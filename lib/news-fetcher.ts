import { insertNewsBatch, updateNewsImageUrl, getNewsById, getNewsWithFailedTranslation, getNewsWithFailedImageGeneration } from "./db/news";
import type { NewsInput, GeminiNewsResponse, NewsCategory, NewsTopicCategory } from "@/types/news";
import { log } from "./utils/logger";
import { getModelForTask, generateContentWithCaching, type TaskType } from "./utils/gemini-client";
import { generateImagePrompt } from "./image-generator/prompt-generator";
import { generateAIImage } from "./image-generator/ai-image-generator";
import { uploadNewsImage } from "./storage/image-storage";
import { createNewsInputFromDB } from "./utils/news-helpers";
import { saveMetricSnapshot } from "./utils/metrics-storage";
import { getTodayKST, isPastDate, isFutureDate } from "./utils/date-helper";
import { isHallucinatedNews } from "./utils/hallucination-detector";
import { fetchThaiNewsFromNewsAPI } from "./news-sources/newsapi";
import { fetchKoreanNewsFromNaver, fetchRelatedNewsFromNaver } from "./news-sources/naver-api";
import { fetchOrGenerateImage } from "./image-generator/image-fetcher";

/**
 * 할당량 초과 에러인지 확인합니다.
 */
function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes("429") ||
    errorMessage.includes("quota exceeded") ||
    errorMessage.includes("exceeded your current quota") ||
    errorMessage.includes("quotaexceeded")
  );
}

/**
 * 텍스트가 유효한 JSON인지 확인합니다.
 */
function isValidJSON(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 텍스트에서 JSON 부분을 추출합니다.
 * 마크다운 코드 블록, 주변 텍스트 등을 제거하고 순수 JSON만 반환합니다.
 * 여러 코드 블록이 있거나 설명 텍스트가 포함된 경우도 처리합니다.
 */
function extractJSON(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  let jsonText = text.trim();

  // 1. 마크다운 코드 블록에서 JSON 추출 시도
  if (jsonText.includes("```")) {
    // 모든 코드 블록을 찾아서 JSON이 포함된 것을 찾음
    // 더 견고한 정규식: 코드 블록 시작부터 끝까지 (중첩된 ``` 처리)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
    const codeBlocks: Array<{ content: string; startPos: number }> = [];
    let match;

    while ((match = codeBlockRegex.exec(jsonText)) !== null) {
      if (match[1]) {
        codeBlocks.push({
          content: match[1].trim(),
          startPos: match.index + match[0].indexOf(match[1]),
        });
      }
    }

    // 코드 블록이 있으면 그 중에서 JSON을 찾음
    if (codeBlocks.length > 0) {
      // 여러 코드 블록이 있는 경우 가장 긴 것을 우선 시도 (완전한 JSON일 가능성 높음)
      codeBlocks.sort((a, b) => b.content.length - a.content.length);

      for (const block of codeBlocks) {
        const extracted = extractJSONFromText(block.content);
        if (extracted && isValidJSON(extracted)) {
          return extracted;
        }
      }
    }
  }

  // 2. 마크다운 코드 블록이 없거나 코드 블록에서 찾지 못한 경우 전체 텍스트에서 추출
  // 먼저 { 로 시작하는 부분을 찾아서 추출 시도
  const jsonStartIndex = jsonText.indexOf("{");
  if (jsonStartIndex !== -1) {
    // { 로 시작하는 부분부터 추출
    const fromStart = jsonText.substring(jsonStartIndex);
    const extracted = extractJSONFromText(fromStart);
    if (extracted && isValidJSON(extracted)) {
      return extracted;
    }
  }

  // 3. 마지막 시도: 전체 텍스트에서 추출
  return extractJSONFromText(jsonText);
}

/**
 * 텍스트에서 JSON 객체를 추출하는 헬퍼 함수
 */
function extractJSONFromText(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  // JSON 시작 위치 찾기 ({)
  const startIndex = text.indexOf("{");
  if (startIndex === -1) {
    return null;
  }

  // 중괄호 카운팅으로 JSON 종료 위치 찾기
  // 문자열 내부의 중괄호는 무시해야 함
  let braceCount = 0;
  let endIndex = -1;
  let inString = false;
  let escapeNext = false;
  let stringChar = "";

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (inString && char === stringChar) {
      inString = false;
      stringChar = "";
      continue;
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }

  if (endIndex === -1) {
    // 중괄호 카운팅으로 찾지 못한 경우, 마지막 }를 사용
    const lastBraceIndex = text.lastIndexOf("}");
    if (lastBraceIndex > startIndex) {
      endIndex = lastBraceIndex;
    } else {
      return null;
    }
  }

  // JSON 부분만 추출
  const extractedJSON = text.substring(startIndex, endIndex + 1);

  // 유효성 검사
  if (isValidJSON(extractedJSON)) {
    return extractedJSON;
  }

  // 유효하지 않은 경우, JSON을 정리하여 재시도
  // 앞뒤 공백과 줄바꿈 제거
  const cleanedJSON = extractedJSON.trim();
  if (cleanedJSON !== extractedJSON && isValidJSON(cleanedJSON)) {
    return cleanedJSON;
  }

  return null;
}

/**
 * 응답이 에러 메시지인지 확인합니다.
 */
function isErrorResponse(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const lowerText = text.toLowerCase().trim();
  const errorPatterns = [/^an error/i, /^error/i, /^sorry/i, /^i cannot/i, /^i'm sorry/i, /^unable to/i, /^failed to/i, /^cannot/i];

  return errorPatterns.some((pattern) => pattern.test(lowerText));
}

/**
 * 할당량 초과 에러에서 상세 정보를 파싱합니다.
 */
function parseQuotaError(error: unknown): { limit?: number; retryAfter?: number; message: string } {
  const result: { limit?: number; retryAfter?: number; message: string } = {
    message: "Gemini API 일일 할당량을 초과했습니다.",
  };

  if (!(error instanceof Error)) {
    return result;
  }

  const errorMessage = error.message;

  // 할당량 한도 정보 추출
  const limitMatch = errorMessage.match(/limit:\s*(\d+)/i) || errorMessage.match(/quotaValue["']?\s*:\s*["']?(\d+)/i);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1], 10);
  }

  // 재시도 가능 시간 추출
  const retryAfterMatch =
    errorMessage.match(/retry in ([\d.]+)s/i) ||
    errorMessage.match(/retryDelay["']?\s*:\s*["']?(\d+)/i) ||
    errorMessage.match(/retryDelay["']?\s*:\s*["']?([\d.]+)s/i);
  if (retryAfterMatch) {
    result.retryAfter = Math.ceil(parseFloat(retryAfterMatch[1]));
  }

  // 에러 객체에서 retryDelay 정보 추출 시도
  if (typeof error === "object" && error !== null) {
    interface ErrorWithDetails {
      errorDetails?: Array<{
        "@type"?: string;
        retryDelay?: string | number;
        violations?: Array<{ subject?: string; description?: string; quotaValue?: string | number }>;
      }>;
    }
    const errorObj = error as ErrorWithDetails;
    if (errorObj.errorDetails) {
      for (const detail of errorObj.errorDetails) {
        if (detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" && detail.retryDelay) {
          const retryDelay = typeof detail.retryDelay === "string" ? parseFloat(detail.retryDelay) : detail.retryDelay;
          if (!isNaN(retryDelay)) {
            result.retryAfter = Math.ceil(retryDelay);
          }
        }
        if (detail["@type"] === "type.googleapis.com/google.rpc.QuotaFailure" && detail.violations) {
          for (const violation of detail.violations) {
            if (violation.quotaValue) {
              result.limit = parseInt(String(violation.quotaValue), 10);
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * 텍스트가 한국어인지 간단히 판단합니다.
 * 한국어 문자(한글)가 포함되어 있으면 한국어로 간주합니다.
 */
function isKorean(text: string): boolean {
  if (!text || text.trim().length === 0) return true;

  // 한국어 문자 범위: 한글 완성형(U+AC00-U+D7A3), 한글 자모(U+1100-U+11FF), 한글 호환 자모(U+3130-U+318F)
  const koreanRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;

  // 전체 텍스트 중 한국어 문자가 차지하는 비율 계산
  const koreanChars = (text.match(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;

  // 한국어 문자가 전체의 30% 이상이면 한국어로 간주
  if (totalChars === 0) return true;
  return koreanChars / totalChars >= 0.3 || koreanRegex.test(text);
}

/**
 * Gemini API를 사용하여 텍스트를 한국어로 번역합니다.
 * 재시도 로직 포함 (최대 3회)
 */
async function translateToKorean(text: string, retryCount: number = 0): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1초

  try {
    // Context Caching을 지원하는 모델 생성 (텍스트 해시 기반 캐시 키)
    const model = getModelForTask("translation", text);

    const prompt = `다음 텍스트를 자연스러운 한국어로 번역해주세요. 원문의 의미와 뉘앙스를 정확히 전달해야 합니다. 번역만 출력하고 다른 설명은 하지 마세요.

원문:
${text}`;

    // Context Caching을 지원하는 generateContent 호출
    const result = await generateContentWithCaching(model, prompt, text);
    const response = await result.response;
    const translatedText = response.text().trim();

    return translatedText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 할당량 초과 에러인지 확인
    if (isQuotaExceededError(error)) {
      const quotaInfo = parseQuotaError(error);
      const timestamp = new Date().toISOString();
      const thailandTime = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString();

      log.error("번역 오류: 할당량 초과", error instanceof Error ? error : new Error(String(error)), {
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES + 1,
        timestamp,
        thailandTime,
        limit: quotaInfo.limit,
        retryAfter: quotaInfo.retryAfter,
        retryAfterFormatted: quotaInfo.retryAfter ? `${Math.floor(quotaInfo.retryAfter / 60)}분 ${quotaInfo.retryAfter % 60}초` : "내일",
        message: quotaInfo.message,
        textLength: text.length,
        textPreview: text.substring(0, 100),
      });
      // 할당량 초과는 재시도하지 않고 원본 텍스트 반환
      log.warn("번역 실패 (할당량 초과), 원본 텍스트 반환", { textPreview: text.substring(0, 50) });
      return text;
    }

    log.error("번역 오류", error instanceof Error ? error : new Error(errorMessage), {
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES + 1,
    });

    // 재시도 가능한 에러이고 최대 재시도 횟수 미만인 경우 재시도
    // 할당량 초과는 이미 위에서 처리했으므로 제외
    if (
      retryCount < MAX_RETRIES &&
      (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("503")) &&
      !isQuotaExceededError(error)
    ) {
      // 지수 백오프: 1초, 2초, 4초
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      log.debug("번역 재시도 대기 중", { delay, attempt: retryCount + 1 });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return translateToKorean(text, retryCount + 1);
    }

    // 재시도 불가능하거나 최대 재시도 횟수 초과 시 원본 반환
    log.warn("번역 실패, 원본 텍스트 반환", { textPreview: text.substring(0, 50) });
    return text;
  }
}

/**
 * 번역이 실패했는지 확인합니다.
 * 원본과 번역본이 같거나 번역본이 null이면 실패로 간주합니다.
 */
function isTranslationFailed(original: string, translated: string | null): boolean {
  if (!translated) return true;
  // 원본과 번역본이 같으면 실패 (번역이 안 된 것으로 간주)
  return translated.trim() === original.trim();
}

/**
 * 뉴스 항목의 제목과 내용을 확인하고 필요시 한국어로 번역합니다.
 * 번역 실패 시 재시도 로직 포함.
 * 번역 실패 여부를 반환합니다.
 */
async function translateNewsIfNeeded(newsItem: NewsInput): Promise<{ newsItem: NewsInput; translationFailed: boolean }> {
  let title = newsItem.title;
  let content = newsItem.content;
  let translationFailed = false;

  const MAX_TRANSLATION_RETRIES = 3;
  const TRANSLATION_RETRY_DELAY = 1000; // 1초

  // 제목이 한국어가 아니면 번역
  if (!isKorean(title)) {
    log.debug("제목 번역 중", { titlePreview: title.substring(0, 50) });

    let translatedTitle = await translateToKorean(title);
    let titleRetryCount = 0;

    // 번역 결과가 원본과 같으면 재시도
    while (isTranslationFailed(title, translatedTitle) && titleRetryCount < MAX_TRANSLATION_RETRIES) {
      titleRetryCount++;
      log.warn("제목 번역 실패 감지, 재시도 중", {
        titlePreview: title.substring(0, 50),
        attempt: titleRetryCount,
        maxRetries: MAX_TRANSLATION_RETRIES,
      });

      // 재시도 전 대기 (지수 백오프)
      const delay = TRANSLATION_RETRY_DELAY * Math.pow(2, titleRetryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      translatedTitle = await translateToKorean(title);
    }

    // 재시도 후에도 실패하면 실패로 표시
    if (isTranslationFailed(title, translatedTitle)) {
      log.warn("제목 번역 최종 실패", {
        titlePreview: title.substring(0, 50),
        totalAttempts: titleRetryCount + 1,
      });
      translationFailed = true;
    } else {
      title = translatedTitle;
      if (titleRetryCount > 0) {
        log.info("제목 번역 재시도 성공", {
          titlePreview: title.substring(0, 50),
          attempts: titleRetryCount + 1,
        });
      }
    }
  }

  // 모든 카테고리: content가 한국어가 아니면 무조건 번역
  if (!isKorean(content)) {
    log.debug("내용 번역 중", {
      category: newsItem.category,
      news_category: newsItem.news_category,
      contentPreview: content.substring(0, 50),
    });

    let translatedContent = await translateToKorean(content);
    let contentRetryCount = 0;

    // 번역 결과가 원본과 같으면 재시도
    while (isTranslationFailed(content, translatedContent) && contentRetryCount < MAX_TRANSLATION_RETRIES) {
      contentRetryCount++;
      log.warn("내용 번역 실패 감지, 재시도 중", {
        category: newsItem.category,
        contentPreview: content.substring(0, 50),
        attempt: contentRetryCount,
        maxRetries: MAX_TRANSLATION_RETRIES,
      });

      // 재시도 전 대기 (지수 백오프)
      const delay = TRANSLATION_RETRY_DELAY * Math.pow(2, contentRetryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      translatedContent = await translateToKorean(content);
    }

    // 재시도 후에도 실패하면 실패로 표시
    if (isTranslationFailed(content, translatedContent)) {
      log.warn("내용 번역 최종 실패", {
        category: newsItem.category,
        contentPreview: content.substring(0, 50),
        totalAttempts: contentRetryCount + 1,
      });
      translationFailed = true;
    } else {
      // 번역 성공 시 content에 직접 저장
      content = translatedContent;
      if (contentRetryCount > 0) {
        log.info("내용 번역 재시도 성공", {
          category: newsItem.category,
          contentPreview: content.substring(0, 50),
          attempts: contentRetryCount + 1,
        });
      }
    }
  }

  return {
    newsItem: {
      ...newsItem,
      title,
      content,
    },
    translationFailed,
  };
}

/**
 * 특정 카테고리별로 추가 뉴스를 수집합니다 (재시도용)
 */
async function fetchAdditionalNewsByCategory(date: string, category: NewsCategory, count: number, model: any): Promise<NewsInput[]> {
  const categoryKoreanName = category === "태국뉴스" ? "태국" : category === "관련뉴스" ? "한국의 태국 관련" : "한국";

  const prompt = `반드시 ${date} 날짜의 최신 뉴스만 수집해주세요. 과거 날짜나 미래 날짜의 뉴스는 수집하지 마세요.

**중요: "${category}" 카테고리 뉴스를 정확히 ${count}개 수집해주세요.**

**매우 중요: 실제로 존재하는 뉴스만 수집해주세요.**
- 존재하지 않는 영화, 드라마, 작품, 인물, 사건에 대한 뉴스를 생성하지 마세요.
- 실제로 발생한 사건이나 보도된 뉴스만 수집해주세요.
- 확실하지 않은 정보나 추측성 내용은 포함하지 마세요.
- AI가 생성한 가상의 뉴스나 할루시네이션은 절대 포함하지 마세요.

${date}의 ${categoryKoreanName} 뉴스를 ${count}개 정확히 수집하여 JSON 포맷으로 출력해주세요.

다음 JSON 형식을 정확히 따라주세요:
{
  "news": [
    {
      "title": "뉴스 제목",
      "content": "뉴스 본문 내용",
      "source_country": "${category === "태국뉴스" ? "태국" : "한국"}",
      "source_media": "언론사 이름",
      "category": "${category}",
      "news_category": "과학" 또는 "사회" 또는 "정치" 또는 "경제" 또는 "스포츠" 또는 "문화" 또는 "기술" 또는 "건강" 또는 "환경" 또는 "국제" 또는 "기타",
      "published_date": "${date}"
    }
  ]
}

중요 사항:
- 반드시 ${date} 날짜의 최신 뉴스만 수집해주세요.
- 각 뉴스의 본문 내용(content)은 상세하게 작성해주세요. 최소 300자 이상으로 작성해주세요.
- news_category는 뉴스의 제목과 내용을 분석하여 가장 적합한 주제 분류를 선택해주세요.
- published_date는 반드시 "${date}"로 설정해주세요.
- category는 반드시 "${category}"로 설정해주세요.`;

  try {
    const cacheKey = `news_collection_${category}_${count}_${date}_${Date.now()}`; // 캐시 방지를 위해 타임스탬프 추가

    const result = await generateContentWithCaching(model, prompt, cacheKey);
    const response = await result.response;
    const text = response.text();

    if (isErrorResponse(text)) {
      log.warn("추가 뉴스 수집 실패: 에러 응답", { category, count, errorPreview: text.substring(0, 200) });
      return [];
    }

    const jsonText = extractJSON(text);
    if (!jsonText) {
      log.warn("추가 뉴스 수집 실패: JSON 추출 실패", {
        category,
        count,
        responsePreview: text.substring(0, 500),
        responseLength: text.length,
      });
      return [];
    }

    let parsedData: GeminiNewsResponse;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      log.warn("추가 뉴스 수집 실패: JSON 파싱 실패", { category, count, error: parseError });
      return [];
    }

    if (!parsedData.news || !Array.isArray(parsedData.news)) {
      log.warn("추가 뉴스 수집 실패: 잘못된 응답 형식", { category, count });
      return [];
    }

    // 데이터 검증 및 필터링 (할루시네이션 포함)
    const todayKST = getTodayKST();
    const validNewsItems = parsedData.news.filter((item) => {
      // 필수 필드 검증
      if (!item.title || typeof item.title !== "string" || item.title.trim().length === 0) return false;
      if (!item.content || typeof item.content !== "string" || item.content.trim().length === 0) return false;
      if (!item.category || item.category !== category) return false;
      if (!item.source_country || typeof item.source_country !== "string") return false;
      if (!item.source_media || typeof item.source_media !== "string") return false;

      // 날짜 검증
      const publishedDate = item.published_date || date;
      if (isPastDate(publishedDate) || isFutureDate(publishedDate)) return false;

      // 할루시네이션 검사
      if (isHallucinatedNews(item.title, item.content, item.source_media)) {
        return false;
      }

      return true;
    });

    // 데이터 정규화 및 변환
    const newsItems: NewsInput[] = validNewsItems.map((item) => {
      let newsCategory: NewsTopicCategory | null = null;
      if (item.news_category && typeof item.news_category === "string") {
        const validNewsCategories: NewsTopicCategory[] = ["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"];
        if (validNewsCategories.includes(item.news_category as NewsTopicCategory)) {
          newsCategory = item.news_category as NewsTopicCategory;
        }
      }

      return {
        published_date: date,
        source_country: item.source_country,
        source_media: item.source_media,
        title: item.title,
        content: item.content,
        category: item.category as NewsCategory,
        news_category: newsCategory,
      };
    });

    return newsItems;
  } catch (error) {
    log.warn("추가 뉴스 수집 중 오류 발생", { category, count, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Google Gemini API를 사용하여 뉴스를 수집합니다.
 * 할루시네이션 필터링 후 부족한 카테고리별로 추가 수집을 진행합니다.
 */
export async function fetchNewsFromGemini(date: string = getTodayKST()): Promise<NewsInput[]> {
  // KST 기준 오늘 날짜 계산
  const todayKST = getTodayKST();
  const requestDate = date || todayKST;

  // 과거 또는 미래 날짜인 경우 오늘 날짜로 변경
  if (isPastDate(requestDate)) {
    log.warn("과거 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayKST });
    date = todayKST;
  } else if (isFutureDate(requestDate)) {
    log.warn("미래 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayKST });
    date = todayKST;
  } else {
    date = requestDate;
  }

  // Context Caching을 지원하는 모델 생성 (날짜 기반 캐시 키)
  // 뉴스 수집은 Pro 모델 사용 (환경 변수로 제어 가능)
  const model = getModelForTask("news_collection", date);
  const modelName = model.model || "gemini-2.5-pro";
  log.info("모델 선택", { model: modelName, date, useContextCaching: true });

  const prompt = `반드시 ${date} 날짜의 최신 뉴스만 수집해주세요. 과거 날짜나 미래 날짜의 뉴스는 수집하지 마세요.

**중요: 각 카테고리별로 정확히 10개씩 수집해주세요. 총 30개의 뉴스를 수집해야 합니다.**
- "태국뉴스": 정확히 10개
- "관련뉴스": 정확히 10개
- "한국뉴스": 정확히 10개

**매우 중요: 실제로 존재하는 뉴스만 수집해주세요.**
- 존재하지 않는 영화, 드라마, 작품, 인물, 사건에 대한 뉴스를 생성하지 마세요.
- 실제로 발생한 사건이나 보도된 뉴스만 수집해주세요.
- 확실하지 않은 정보나 추측성 내용은 포함하지 마세요.
- AI가 생성한 가상의 뉴스나 할루시네이션은 절대 포함하지 마세요.

${date}의 태국 주요 뉴스(한국어 번역), 한국의 태국 관련 뉴스, 한국 주요 뉴스를 위의 개수대로 정확히 수집하여 JSON 포맷으로 출력해주세요.

다음 JSON 형식을 정확히 따라주세요:
{
  "news": [
    {
      "title": "뉴스 제목",
      "content": "뉴스 본문 내용",
      "source_country": "태국" 또는 "한국",
      "source_media": "언론사 이름",
      "category": "태국뉴스" 또는 "관련뉴스" 또는 "한국뉴스",
      "news_category": "과학" 또는 "사회" 또는 "정치" 또는 "경제" 또는 "스포츠" 또는 "문화" 또는 "기술" 또는 "건강" 또는 "환경" 또는 "국제" 또는 "기타" (뉴스 내용을 분석하여 가장 적합한 주제 분류를 선택,
      "published_date": "${date}"
    }
  ]
}

중요 사항:
- 반드시 ${date} 날짜의 최신 뉴스만 수집해주세요. 과거 날짜나 미래 날짜의 뉴스는 수집하지 마세요.
- 각 뉴스의 본문 내용(content)은 상세하게 작성해주세요. 가능한 한 자세히 작성하되, 최소 300자 이상으로 작성해주세요. 뉴스의 핵심 내용, 배경 정보, 영향 등을 포함해주세요.
- news_category는 뉴스의 제목과 내용을 분석하여 가장 적합한 주제 분류를 선택해주세요.
- published_date는 반드시 "${date}"로 설정해주세요.

카테고리 분류 기준:
- "태국뉴스": 태국에서 발생한 주요 뉴스
- "관련뉴스": 한국에서 태국과 관련된 뉴스
- "한국뉴스": 한국의 주요 뉴스

뉴스 주제 분류(news_category) 기준:
- "과학": 과학 연구, 발견, 기술 등
- "사회": 사회 이슈, 인물, 지역 뉴스 등
- "정치": 정치, 선거, 정책 등
- "경제": 경제, 기업, 금융, 주식 등
- "스포츠": 스포츠 경기, 선수, 대회 등
- "문화": 예술, 문화, 엔터테인먼트 등
- "기술": IT, 기술, 디지털 등
- "건강": 건강, 의료, 질병 등
- "환경": 환경, 기후, 생태 등
- "국제": 국제 관계, 외교, 해외 뉴스 등
- "기타": 위 분류에 해당하지 않는 경우
- null: 주제 분류가 명확하지 않은 경우

**반드시 각 카테고리별로 정확히 10개씩 수집해주세요. 총 30개의 뉴스를 수집해야 합니다.**`;

  try {
    let result;
    let response;
    let text;
    let lastError: Error | null = null;
    const MAX_RETRIES = 3;

    // 기본 모드로 뉴스 수집 시도 (재시도 로직 포함)
    // Context Caching을 위한 캐시 키 생성 (날짜 기반)
    const cacheKey = `news_collection_${date}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        log.debug("뉴스 수집 시도 중", { attempt: attempt + 1, maxRetries: MAX_RETRIES + 1, cacheKey });
        // Context Caching을 지원하는 generateContent 호출
        result = await generateContentWithCaching(model, prompt, cacheKey);
        response = await result.response;
        text = response.text();
        log.info("뉴스 수집 성공", { cacheKey });
        break; // 성공 시 루프 종료
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;

        // 할당량 초과 에러인지 확인
        if (isQuotaExceededError(error)) {
          const quotaInfo = parseQuotaError(error);
          const timestamp = new Date().toISOString();
          const thailandTime = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString();

          log.error("Gemini API 할당량 초과", error, {
            timestamp,
            thailandTime,
            limit: quotaInfo.limit,
            retryAfter: quotaInfo.retryAfter,
            retryAfterFormatted: quotaInfo.retryAfter ? `${Math.floor(quotaInfo.retryAfter / 60)}분 ${quotaInfo.retryAfter % 60}초` : "내일",
            message: quotaInfo.message,
            attempt: attempt + 1,
            maxRetries: MAX_RETRIES + 1,
          });

          // 할당량 초과 에러는 재시도하지 않고 즉시 에러 반환
          const quotaError = new Error(
            quotaInfo.retryAfter
              ? `Gemini API 할당량을 초과했습니다. ${quotaInfo.retryAfter}초 후 다시 시도해주세요. (일일 한도: ${quotaInfo.limit || "알 수 없음"})`
              : `Gemini API 일일 할당량을 초과했습니다. 내일 다시 시도해주세요. (일일 한도: ${quotaInfo.limit || "알 수 없음"})`
          );
          throw quotaError;
        }

        log.warn("뉴스 수집 시도 실패", { attempt: attempt + 1, maxRetries: MAX_RETRIES + 1, errorMessage });

        // 재시도 가능한 에러인지 확인 (할당량 초과는 제외)
        const isRetryable =
          (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("503")) && !isQuotaExceededError(error);

        if (attempt < MAX_RETRIES && isRetryable) {
          // 지수 백오프: 2초, 4초, 8초
          const delay = 2000 * Math.pow(2, attempt);
          log.debug("재시도 대기 중", { delay });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // 마지막 시도이거나 재시도 불가능한 에러인 경우
        if (attempt === MAX_RETRIES) {
          throw lastError;
        }
      }
    }

    if (!text) {
      throw lastError || new Error("뉴스 수집에 실패했습니다.");
    }

    // 에러 메시지인지 확인
    if (isErrorResponse(text)) {
      const errorPreview = text.substring(0, 500);
      log.error("Gemini API가 에러 메시지를 반환했습니다", undefined, {
        responsePreview: errorPreview,
        responseLength: text.length,
      });

      // 에러 메시지에서 주요 내용 추출
      let errorMessage = "Gemini API가 요청을 처리할 수 없습니다.";
      if (text.includes("미래 날짜") || text.includes("future date") || text.includes("2025") || text.includes("2026")) {
        errorMessage = "미래 날짜에 대한 뉴스를 수집할 수 없습니다. 오늘 날짜의 뉴스를 수집하도록 변경되었습니다.";
      } else if (text.includes("너무 많") || text.includes("too many") || text.includes("대량")) {
        errorMessage = "요청한 뉴스 개수가 너무 많습니다. 뉴스 개수를 줄여서 다시 시도해주세요.";
      } else if (text.includes("실제") || text.includes("actual") || text.includes("real")) {
        errorMessage = "실제 뉴스 기사를 찾을 수 없습니다. 날짜를 확인하거나 다른 날짜로 시도해주세요.";
      }

      throw new Error(`${errorMessage} (상세: ${errorPreview}...)`);
    }

    // JSON 추출 및 파싱
    const jsonText = extractJSON(text);

    if (!jsonText) {
      // 더 상세한 디버깅 정보
      const codeBlockMatches = text.match(/```[\s\S]*?```/g);
      const firstJsonIndex = text.indexOf("{");
      const lastJsonIndex = text.lastIndexOf("}");

      log.error("JSON 추출 실패", undefined, {
        originalTextPreview: text.substring(0, 1000),
        originalTextLength: text.length,
        hasMarkdown: text.includes("```"),
        hasJsonStart: text.includes("{"),
        codeBlockCount: codeBlockMatches?.length || 0,
        firstJsonIndex,
        lastJsonIndex,
        jsonRange: firstJsonIndex !== -1 && lastJsonIndex !== -1 ? text.substring(firstJsonIndex, Math.min(firstJsonIndex + 500, lastJsonIndex + 1)) : null,
      });

      // 미래 날짜 관련 응답인지 확인
      if (text.includes("2025") || text.includes("2026") || text.includes("미래") || text.includes("future")) {
        throw new Error("미래 날짜에 대한 뉴스를 수집할 수 없습니다. 오늘 날짜로 다시 시도해주세요.");
      }

      throw new Error("Gemini API 응답에서 유효한 JSON을 찾을 수 없습니다. 응답이 JSON 형식이 아닙니다.");
    }

    // JSON 파싱
    let parsedData: GeminiNewsResponse;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      log.error("JSON 파싱 실패", parseError instanceof Error ? parseError : new Error(String(parseError)), {
        jsonTextPreview: jsonText.substring(0, 500),
        jsonTextLength: jsonText.length,
        originalTextPreview: text.substring(0, 500),
      });
      throw new Error(`JSON 파싱에 실패했습니다: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }

    if (!parsedData.news || !Array.isArray(parsedData.news)) {
      throw new Error("Invalid response format from Gemini API");
    }

    // 데이터 검증 및 필터링
    const todayKST = getTodayKST();
    let hallucinationFilteredCount = 0; // 할루시네이션 필터링 개수 추적

    const validNewsItems = parsedData.news.filter((item, index) => {
      // 필수 필드 검증
      if (!item.title || typeof item.title !== "string" || item.title.trim().length === 0) {
        log.warn("뉴스 항목 title이 없거나 유효하지 않음", { index: index + 1, item });
        return false;
      }

      if (!item.content || typeof item.content !== "string" || item.content.trim().length === 0) {
        log.warn("뉴스 항목 content가 없거나 유효하지 않음", { index: index + 1, title: item.title });
        return false;
      }

      if (!item.category || typeof item.category !== "string") {
        log.warn("뉴스 항목 category가 없거나 유효하지 않음", { index: index + 1, title: item.title });
        return false;
      }

      // 카테고리 유효성 검증
      const validCategories: NewsCategory[] = ["태국뉴스", "관련뉴스", "한국뉴스"];
      if (!validCategories.includes(item.category as NewsCategory)) {
        log.warn("뉴스 항목 유효하지 않은 카테고리", { index: index + 1, title: item.title, category: item.category });
        return false;
      }

      if (!item.source_country || typeof item.source_country !== "string") {
        log.warn("뉴스 항목 source_country가 없거나 유효하지 않음", { index: index + 1, title: item.title });
        return false;
      }

      if (!item.source_media || typeof item.source_media !== "string") {
        log.warn("뉴스 항목 source_media가 없거나 유효하지 않음", { index: index + 1, title: item.title });
        return false;
      }

      // published_date 검증: 과거 또는 미래 날짜인 뉴스 필터링
      const publishedDate = item.published_date || date;
      if (isPastDate(publishedDate)) {
        log.warn("과거 날짜 뉴스 필터링", {
          index: index + 1,
          title: item.title.substring(0, 50),
          publishedDate,
          todayKST,
        });
        return false;
      }
      if (isFutureDate(publishedDate)) {
        log.warn("미래 날짜 뉴스 필터링", {
          index: index + 1,
          title: item.title.substring(0, 50),
          publishedDate,
          todayKST,
        });
        return false;
      }

      // news_category 유효성 검증 (선택적 필드이지만 유효한 값이어야 함)
      if (item.news_category !== null && item.news_category !== undefined) {
        const validNewsCategories: NewsTopicCategory[] = ["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"];
        if (typeof item.news_category !== "string" || !validNewsCategories.includes(item.news_category as NewsTopicCategory)) {
          log.warn("뉴스 항목 유효하지 않은 news_category", { index: index + 1, title: item.title, news_category: item.news_category });
          // 유효하지 않은 경우 null로 설정하여 계속 진행
          item.news_category = null;
        }
      }

      // 할루시네이션 검사
      if (isHallucinatedNews(item.title, item.content, item.source_media)) {
        hallucinationFilteredCount++;
        log.warn("할루시네이션 의심 뉴스 필터링", {
          index: index + 1,
          title: item.title.substring(0, 50),
        });
        return false;
      }

      return true;
    });

    log.info("데이터 검증 완료", {
      total: parsedData.news.length,
      valid: validNewsItems.length,
      hallucinationFiltered: hallucinationFilteredCount,
    });

    if (validNewsItems.length === 0) {
      throw new Error("유효한 뉴스 데이터가 없습니다. 모든 뉴스 항목이 필수 필드를 만족하지 않습니다.");
    }

    // 데이터 정규화 및 변환
    const newsItems: NewsInput[] = validNewsItems.map((item) => {
      // news_category 유효성 검증 및 정규화
      let newsCategory: NewsTopicCategory | null = null;
      if (item.news_category && typeof item.news_category === "string") {
        const validNewsCategories: NewsTopicCategory[] = ["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"];
        if (validNewsCategories.includes(item.news_category as NewsTopicCategory)) {
          newsCategory = item.news_category as NewsTopicCategory;
        }
      }

      // published_date 정규화: 요청한 날짜(date)로 강제 설정
      // 이미 필터링 단계에서 과거/미래 날짜 뉴스는 제외되었으므로, 모든 뉴스는 오늘 날짜로 정규화
      const normalizedPublishedDate = date;
      if (item.published_date && item.published_date !== date) {
        log.warn("뉴스 항목 published_date 정규화", {
          title: item.title.substring(0, 50),
          originalDate: item.published_date,
          normalizedDate: normalizedPublishedDate,
        });
      }

      return {
        published_date: normalizedPublishedDate,
        source_country: item.source_country,
        source_media: item.source_media,
        title: item.title,
        content: item.content,
        category: item.category as NewsCategory,
        news_category: newsCategory,
      };
    });

    // 한국어가 아닌 뉴스 항목들을 번역 처리
    // 성능 개선: 병렬 처리로 번역 시간 단축
    log.debug("한국어 번역이 필요한 뉴스 확인 중");

    // 병렬 처리로 번역 시간 단축 (최대 5개씩 동시 처리)
    const BATCH_SIZE = 5;
    const translatedNewsItems: NewsInput[] = [];
    const failedTranslationCount: number[] = [0]; // 번역 실패 개수 추적

    for (let i = 0; i < newsItems.length; i += BATCH_SIZE) {
      const batch = newsItems.slice(i, i + BATCH_SIZE);
      const translatedBatch = await Promise.all(batch.map((newsItem) => translateNewsIfNeeded(newsItem)));

      // 번역 결과 추출 및 실패 개수 집계
      for (const result of translatedBatch) {
        translatedNewsItems.push(result.newsItem);
        if (result.translationFailed) {
          failedTranslationCount[0]++;
        }
      }

      // 진행 상황 로깅
      if ((i + BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= newsItems.length) {
        log.debug("번역 진행 중", { processed: Math.min(i + BATCH_SIZE, newsItems.length), total: newsItems.length });
      }
    }

    log.info("번역 완료", {
      count: translatedNewsItems.length,
      failedCount: failedTranslationCount[0],
    });

    if (failedTranslationCount[0] > 0) {
      log.warn("번역 실패한 뉴스가 있습니다", { failedCount: failedTranslationCount[0] });
    }

    // 카테고리별로 정확히 10개씩 제한
    const CATEGORY_LIMIT = 10;
    let categoryCounts: Record<NewsCategory, number> = {
      태국뉴스: 0,
      관련뉴스: 0,
      한국뉴스: 0,
    };

    let limitedNewsItems: NewsInput[] = [];

    // 카테고리별로 제한
    for (const newsItem of translatedNewsItems) {
      const category = newsItem.category;
      if (categoryCounts[category] < CATEGORY_LIMIT) {
        limitedNewsItems.push(newsItem);
        categoryCounts[category]++;
      }
    }

    // 할루시네이션 필터링 후 부족한 카테고리별로 추가 수집 (최대 2회 재시도)
    const MAX_RETRY_ATTEMPTS = 2;
    for (let retryAttempt = 0; retryAttempt < MAX_RETRY_ATTEMPTS; retryAttempt++) {
      const missingCategories: Array<{ category: NewsCategory; needed: number }> = [];
      if (categoryCounts.태국뉴스 < CATEGORY_LIMIT) {
        missingCategories.push({ category: "태국뉴스", needed: CATEGORY_LIMIT - categoryCounts.태국뉴스 });
      }
      if (categoryCounts.한국뉴스 < CATEGORY_LIMIT) {
        missingCategories.push({ category: "한국뉴스", needed: CATEGORY_LIMIT - categoryCounts.한국뉴스 });
      }
      if (categoryCounts.관련뉴스 < CATEGORY_LIMIT) {
        missingCategories.push({ category: "관련뉴스", needed: CATEGORY_LIMIT - categoryCounts.관련뉴스 });
      }

      if (missingCategories.length === 0) {
        // 모든 카테고리가 충분함
        break;
      }

      // 재시도 간 지연 시간 추가 (API 제한 방지)
      if (retryAttempt > 0) {
        const delay = 1000 * retryAttempt; // 1초, 2초
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      log.info("할루시네이션 필터링 후 추가 수집 시작", {
        retryAttempt: retryAttempt + 1,
        maxRetries: MAX_RETRY_ATTEMPTS,
        missingCategories: missingCategories.map((m) => `${m.category}: ${m.needed}개`),
      });

      // 부족한 카테고리별로 추가 수집
      for (const missing of missingCategories) {
        try {
          // 부족한 개수의 150%를 요청 (최소 3개) - 할루시네이션 필터링 후에도 목표 개수 달성 가능하도록
          const requestCount = Math.max(3, Math.ceil(missing.needed * 1.5));
          const additionalNews = await fetchAdditionalNewsByCategory(date, missing.category, requestCount, model);

          if (additionalNews.length > 0) {
            // 추가 수집한 뉴스 번역 처리
            const translatedAdditional: NewsInput[] = [];
            for (const newsItem of additionalNews) {
              const result = await translateNewsIfNeeded(newsItem);
              translatedAdditional.push(result.newsItem);
            }

            // 번역된 추가 뉴스를 limitedNewsItems에 추가
            for (const newsItem of translatedAdditional) {
              if (categoryCounts[newsItem.category] < CATEGORY_LIMIT) {
                limitedNewsItems.push(newsItem);
                categoryCounts[newsItem.category]++;
              }
            }

            log.info("추가 뉴스 수집 완료", {
              category: missing.category,
              requested: requestCount,
              needed: missing.needed,
              collected: additionalNews.length,
              added: Math.min(additionalNews.length, missing.needed),
              currentCount: categoryCounts[missing.category],
            });
          } else {
            log.warn("추가 뉴스 수집 실패: 수집된 뉴스 없음", {
              category: missing.category,
              needed: missing.needed,
            });
          }
        } catch (error) {
          log.warn("추가 뉴스 수집 중 오류 발생", {
            category: missing.category,
            needed: missing.needed,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // 재시도 후에도 부족하면 경고
      const stillMissing = missingCategories.filter((m) => categoryCounts[m.category] < CATEGORY_LIMIT);
      if (stillMissing.length > 0 && retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        log.warn("추가 수집 후에도 부족한 카테고리 존재", {
          retryAttempt: retryAttempt + 1,
          stillMissing: stillMissing.map((m) => `${m.category}: ${categoryCounts[m.category]}/${CATEGORY_LIMIT}`),
        });
      }
    }

    // 카테고리별 개수 로깅
    log.info("카테고리별 뉴스 수집 결과", {
      태국뉴스: categoryCounts.태국뉴스,
      한국뉴스: categoryCounts.한국뉴스,
      관련뉴스: categoryCounts.관련뉴스,
      총합: limitedNewsItems.length,
      원본개수: translatedNewsItems.length,
    });

    // 최종적으로 부족한 카테고리가 있으면 경고
    const finalMissingCategories: string[] = [];
    if (categoryCounts.태국뉴스 < CATEGORY_LIMIT) {
      finalMissingCategories.push(`태국뉴스 (${categoryCounts.태국뉴스}/${CATEGORY_LIMIT})`);
    }
    if (categoryCounts.한국뉴스 < CATEGORY_LIMIT) {
      finalMissingCategories.push(`한국뉴스 (${categoryCounts.한국뉴스}/${CATEGORY_LIMIT})`);
    }
    if (categoryCounts.관련뉴스 < CATEGORY_LIMIT) {
      finalMissingCategories.push(`관련뉴스 (${categoryCounts.관련뉴스}/${CATEGORY_LIMIT})`);
    }

    if (finalMissingCategories.length > 0) {
      log.warn("카테고리별 목표 개수 미달 (재시도 후)", {
        부족한카테고리: finalMissingCategories,
        원본개수: translatedNewsItems.length,
        최종개수: limitedNewsItems.length,
      });
    }

    return limitedNewsItems;
  } catch (error) {
    log.error("Error fetching news from Gemini", error);
    throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 저장된 뉴스에 대해 이미지를 생성하고 업로드합니다.
 * 배치 처리로 최대 5개씩 동시 처리하여 성능과 안정성을 고려합니다.
 * 타임아웃을 고려하여 최대 처리 시간을 제한할 수 있습니다.
 */
async function generateImagesForNews(savedNewsIds: string[], maxTimeMs?: number): Promise<{ success: number; failed: number }> {
  try {
    const { getEnv } = require("@/lib/config/env");
    const { IMAGE_GENERATION_API } = getEnv();

    // 이미지 생성 API가 설정되지 않았거나 'none'인 경우 스킵
    if (!IMAGE_GENERATION_API || IMAGE_GENERATION_API === "none") {
      log.debug("이미지 생성 스킵: IMAGE_GENERATION_API가 설정되지 않음", { api: IMAGE_GENERATION_API });
      return { success: 0, failed: 0 };
    }

    log.info("뉴스 이미지 생성 시작", { count: savedNewsIds.length, maxTimeMs });

    const BATCH_SIZE = 5; // 한 번에 처리할 이미지 개수
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    // 배치 단위로 이미지 생성
    for (let i = 0; i < savedNewsIds.length; i += BATCH_SIZE) {
      // 타임아웃 체크
      if (maxTimeMs) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxTimeMs) {
          log.warn("이미지 생성 타임아웃으로 중단", {
            processed: i,
            total: savedNewsIds.length,
            success: successCount,
            failed: failCount,
            elapsedTimeMs: elapsedTime,
            maxTimeMs,
          });
          break;
        }
      }

      const batch = savedNewsIds.slice(i, i + BATCH_SIZE);

      // 배치 내에서 병렬 처리
      const batchResults = await Promise.allSettled(
        batch.map(async (newsId) => {
          try {
            // DB에서 뉴스 데이터 조회
            const savedNews = await getNewsById(newsId);
            if (!savedNews) {
              throw new Error(`뉴스를 찾을 수 없습니다: ${newsId}`);
            }

            // NewsInput 형식으로 변환
            const newsItem = createNewsInputFromDB(savedNews);

            // 1. 이미지 추출 또는 생성 (NewsAPI/네이버 API 우선, 실패 시 Gemini API)
            log.debug("이미지 추출/생성 시작", { newsId, title: newsItem.title.substring(0, 50), source_api: newsItem.source_api });
            const imageBuffer = await fetchOrGenerateImage(newsItem);

            if (!imageBuffer) {
              throw new Error("이미지 추출/생성 실패");
            }

            // 2. Vercel Blob에 업로드
            log.debug("이미지 업로드 중", { newsId });
            const imageUrl = await uploadNewsImage(newsId, imageBuffer);

            // 3. DB에 image_url 업데이트
            const updateSuccess = await updateNewsImageUrl(newsId, imageUrl);
            if (!updateSuccess) {
              throw new Error(`DB 업데이트 실패: image_url을 저장할 수 없습니다 (newsId: ${newsId})`);
            }

            log.info("뉴스 이미지 생성 완료", {
              newsId,
              imageUrl,
              imageSize: imageBuffer.length,
            });

            return { success: true, newsId, imageUrl };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            log.error("뉴스 이미지 생성 실패", error instanceof Error ? error : new Error(String(error)), {
              newsId,
              errorMessage,
              errorStack,
            });
            throw error;
          }
        })
      );

      // 배치 결과 집계
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          failCount++;
          // 실패한 경우 상세 에러 로깅
          const error = result.reason;
          log.error("이미지 생성 배치 처리 실패", error instanceof Error ? error : new Error(String(error)), {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // 진행 상황 로깅
      if ((i + BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= savedNewsIds.length) {
        const elapsedTime = Date.now() - startTime;
        log.info("이미지 생성 진행 중", {
          processed: Math.min(i + BATCH_SIZE, savedNewsIds.length),
          total: savedNewsIds.length,
          success: successCount,
          failed: failCount,
          elapsedTimeMs: elapsedTime,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    log.info("뉴스 이미지 생성 완료", {
      total: savedNewsIds.length,
      processed: successCount + failCount,
      success: successCount,
      failed: failCount,
      totalTimeMs: totalTime,
    });

    // 이미지 생성 성공률 메트릭 저장
    if (savedNewsIds.length > 0) {
      const successRate = (successCount / savedNewsIds.length) * 100 || 0;
      await saveMetricSnapshot({
        metricType: "business",
        metricName: "image_generation_success_rate",
        metricValue: successRate,
        metadata: {
          total: savedNewsIds.length,
          success: successCount,
          failed: failCount,
          totalTimeMs: totalTime,
        },
      });

      // 이미지 생성 개수 메트릭 저장
      await saveMetricSnapshot({
        metricType: "business",
        metricName: "image_generation_count",
        metricValue: successCount,
        metadata: {
          total: savedNewsIds.length,
          failed: failCount,
          totalTimeMs: totalTime,
        },
      });
    }
    return { success: successCount, failed: failCount };
  } catch (error) {
    log.error("이미지 생성 프로세스 오류", error instanceof Error ? error : new Error(String(error)));
    // 이미지 생성 실패는 전체 프로세스를 중단하지 않음
    return { success: 0, failed: savedNewsIds.length };
  }
}

/**
 * 이미지 생성 실패한 뉴스에 대해 이미지 생성을 재시도합니다.
 * @param limit 재시도할 최대 뉴스 개수
 * @param maxRetries 각 뉴스당 최대 재시도 횟수
 */
export async function retryFailedImageGeneration(limit: number = 50, maxRetries: number = 2): Promise<{ success: number; failed: number; total: number }> {
  try {
    log.info("이미지 생성 실패한 뉴스 재시도 시작", { limit, maxRetries });

    // 이미지 생성 실패한 뉴스 조회
    const failedNews = await getNewsWithFailedImageGeneration(limit);
    log.info("이미지 생성 실패한 뉴스 조회 완료", { total: failedNews.length });

    if (failedNews.length === 0) {
      log.info("재시도할 이미지 생성 실패 뉴스가 없습니다");
      return { success: 0, failed: 0, total: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // 각 뉴스에 대해 재시도
    for (const news of failedNews) {
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount < maxRetries) {
        try {
          // NewsInput 형식으로 변환
          const newsItem = createNewsInputFromDB(news);

          // 1. 이미지 프롬프트 생성
          log.debug("이미지 프롬프트 생성 중 (재시도)", { newsId: news.id, retryCount: retryCount + 1, title: newsItem.title.substring(0, 50) });
          const imagePrompt = await generateImagePrompt(newsItem);

          // 2. AI 이미지 생성
          log.debug("AI 이미지 생성 중 (재시도)", { newsId: news.id, retryCount: retryCount + 1 });
          const imageBuffer = await generateAIImage(imagePrompt);

          // 3. Vercel Blob에 업로드
          log.debug("이미지 업로드 중 (재시도)", { newsId: news.id, retryCount: retryCount + 1 });
          const imageUrl = await uploadNewsImage(news.id, imageBuffer);

          // 4. DB에 image_url 업데이트
          const updateSuccess = await updateNewsImageUrl(news.id, imageUrl);
          if (!updateSuccess) {
            throw new Error(`DB 업데이트 실패: image_url을 저장할 수 없습니다 (newsId: ${news.id})`);
          }

          log.info("뉴스 이미지 생성 완료 (재시도 성공)", {
            newsId: news.id,
            imageUrl,
            retryCount: retryCount + 1,
            imageSize: imageBuffer.length,
          });

          successCount++;
          break; // 성공 시 루프 종료
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          retryCount++;

          if (retryCount < maxRetries) {
            // 재시도 전 대기 (지수 백오프: 2초, 4초)
            const delay = 2000 * Math.pow(2, retryCount - 1);
            log.warn("이미지 생성 재시도 대기 중", {
              newsId: news.id,
              retryCount,
              maxRetries,
              delay,
              errorMessage: lastError.message,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            log.error("이미지 생성 재시도 실패 (최대 재시도 횟수 초과)", lastError, {
              newsId: news.id,
              retryCount,
              maxRetries,
            });
            failedCount++;
          }
        }
      }
    }

    log.info("이미지 생성 재시도 완료", {
      total: failedNews.length,
      success: successCount,
      failed: failedCount,
    });

    return {
      success: successCount,
      failed: failedCount,
      total: failedNews.length,
    };
  } catch (error) {
    log.error("이미지 생성 재시도 중 오류 발생", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * 번역 실패한 뉴스를 재번역합니다.
 * @param limit 재번역할 최대 뉴스 개수 (기본값: 50)
 * @returns 재번역 결과 (성공/실패 개수)
 */
export async function retryFailedTranslations(limit: number = 50): Promise<{ success: number; failed: number; total: number }> {
  try {
    log.info("번역 실패한 뉴스 재번역 시작", { limit });

    // 번역 실패한 뉴스 조회
    const failedNews = await getNewsWithFailedTranslation(limit);

    if (failedNews.length === 0) {
      log.info("재번역할 뉴스가 없습니다");
      return { success: 0, failed: 0, total: 0 };
    }

    log.info("번역 실패한 뉴스 발견", { count: failedNews.length });

    let successCount = 0;
    let failedCount = 0;

    // 배치 처리로 재번역 (최대 5개씩 동시 처리)
    const BATCH_SIZE = 5;

    for (let i = 0; i < failedNews.length; i += BATCH_SIZE) {
      const batch = failedNews.slice(i, i + BATCH_SIZE);

      // 배치 내에서 병렬 처리
      const batchResults = await Promise.allSettled(
        batch.map(async (news) => {
          try {
            // NewsInput 형식으로 변환
            const newsItem = createNewsInputFromDB(news);

            // 번역 시도
            const result = await translateNewsIfNeeded(newsItem);

            // 번역 성공 여부 확인 (번역 결과는 이미 content에 저장됨)
            if (!result.translationFailed && result.newsItem.content && result.newsItem.content !== news.content) {
              // 번역 성공 - content가 변경되었으므로 이미 번역 완료된 상태
              log.info("뉴스 번역 재처리 성공 (이미 content에 반영됨)", {
                newsId: news.id,
                title: news.title.substring(0, 50),
              });
              return { success: true, newsId: news.id };
            } else {
              log.warn("뉴스 번역 재처리 실패 (번역 결과가 원본과 동일)", {
                newsId: news.id,
                title: news.title.substring(0, 50),
              });
              return { success: false, newsId: news.id };
            }
          } catch (error) {
            log.error("뉴스 번역 재처리 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
              newsId: news.id,
            });
            return { success: false, newsId: news.id };
          }
        })
      );

      // 배치 결과 집계
      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      // 진행 상황 로깅
      if ((i + BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= failedNews.length) {
        log.info("번역 재처리 진행 중", {
          processed: Math.min(i + BATCH_SIZE, failedNews.length),
          total: failedNews.length,
          success: successCount,
          failed: failedCount,
        });
      }
    }

    log.info("번역 실패한 뉴스 재번역 완료", {
      total: failedNews.length,
      success: successCount,
      failed: failedCount,
    });

    return {
      success: successCount,
      failed: failedCount,
      total: failedNews.length,
    };
  } catch (error) {
    log.error("번역 실패한 뉴스 재번역 중 오류 발생", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * 수집한 뉴스를 로컬 데이터베이스에 저장하고 이미지를 생성합니다.
 * @param newsItems 저장할 뉴스 항목들
 * @param maxImageGenerationTimeMs 이미지 생성에 사용할 수 있는 최대 시간(밀리초). 설정하지 않으면 제한 없음.
 */
export async function saveNewsToDatabase(
  newsItems: NewsInput[],
  maxImageGenerationTimeMs?: number
): Promise<{ success: number; failed: number; savedNewsIds: string[]; imageGenerationResult: { success: number; failed: number } }> {
  try {
    const result = await insertNewsBatch(newsItems);

    // result가 유효한지 확인
    if (!result || typeof result !== "object" || typeof result.success !== "number" || typeof result.failed !== "number") {
      log.error("Invalid result from insertNewsBatch", undefined, { result });
      return { success: 0, failed: newsItems.length, savedNewsIds: [], imageGenerationResult: { success: 0, failed: 0 } };
    }

    // savedNewsIds가 없는 경우 빈 배열로 초기화
    const savedNewsIds = result.savedNewsIds || [];

    // 저장된 뉴스에 대해 이미지 생성 (저장된 뉴스 ID가 있는 경우)
    let imageGenerationResult = { success: 0, failed: 0 };
    if (result.success > 0 && savedNewsIds.length > 0) {
      try {
        // 이미지 생성 완료를 기다림 (Cron Job과 수동 수집 모두에서 동작하도록)
        // 타임아웃이 설정된 경우 남은 시간 내에서 이미지 생성
        // 에러가 발생해도 뉴스 저장 결과에는 영향을 주지 않음
        imageGenerationResult = await generateImagesForNews(savedNewsIds, maxImageGenerationTimeMs);
      } catch (error) {
        log.error("이미지 생성 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
          savedNewsCount: savedNewsIds.length,
          maxImageGenerationTimeMs,
        });
        // 이미지 생성 실패는 뉴스 저장 결과에 영향을 주지 않음
      }
    }

    // 이미지 생성 결과를 반환값에 포함
    return {
      success: result.success,
      failed: result.failed,
      savedNewsIds,
      imageGenerationResult,
    };

    // 자동 재처리: 번역 실패한 뉴스 재처리 (비동기로 실행)
    // 타임아웃이 설정된 경우에는 재처리하지 않음 (시간 제한 고려)
    if (!maxImageGenerationTimeMs) {
      // 비동기로 실행하여 뉴스 저장 응답 시간에 영향을 주지 않음
      retryFailedTranslations(20).catch((error) => {
        log.error("자동 번역 재처리 중 오류 발생 (비동기)", error instanceof Error ? error : new Error(String(error)));
      });
    }

    return { success: result.success, failed: result.failed, savedNewsIds, imageGenerationResult };
  } catch (error) {
    log.error("Error in saveNewsToDatabase", error);
    return { success: 0, failed: newsItems.length, savedNewsIds: [], imageGenerationResult: { success: 0, failed: 0 } };
  }
}

/**
 * 뉴스 수집 및 저장을 한 번에 수행합니다.
 * @param date 수집할 뉴스의 날짜 (기본값: 오늘)
 * @param maxImageGenerationTimeMs 이미지 생성에 사용할 수 있는 최대 시간(밀리초). 설정하지 않으면 제한 없음.
 */
export async function fetchAndSaveNews(
  date?: string,
  maxImageGenerationTimeMs?: number
): Promise<{
  success: number;
  failed: number;
  total: number;
  savedNewsIds: string[];
  categoryCounts: Record<NewsCategory, number>;
  imageGenerationResult: { success: number; failed: number };
}> {
  try {
    // 날짜 검증 (과거/미래 날짜 방지)
    const todayKST = getTodayKST();
    const requestDate = date || todayKST;

    if (isPastDate(requestDate)) {
      log.warn("과거 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayKST });
      date = todayKST;
    } else if (isFutureDate(requestDate)) {
      log.warn("미래 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayKST });
      date = todayKST;
    } else {
      date = requestDate;
    }

    log.info("뉴스 수집 시작", { date, source: "NewsAPI + Naver API" });

    // 1. 태국 뉴스 수집 (NewsAPI) - 날짜 필터링 포함, 정확히 10개
    const thaiNews = await fetchThaiNewsFromNewsAPI(date, 10);

    // 2. 한국 뉴스 수집 (네이버 API) - 날짜 필터링 포함, 정확히 10개
    const koreanNews = await fetchKoreanNewsFromNaver(date, 10);

    // 3. 관련 뉴스 수집 (네이버 API) - 날짜 필터링 포함, 정확히 10개
    const relatedNews = await fetchRelatedNewsFromNaver(date, 10);

    // 총 30개 뉴스 수집 목표 (태국뉴스 10개 + 한국뉴스 10개 + 관련뉴스 10개)
    log.info("뉴스 수집 완료", {
      date,
      thaiNews: thaiNews.length,
      koreanNews: koreanNews.length,
      relatedNews: relatedNews.length,
      total: thaiNews.length + koreanNews.length + relatedNews.length,
    });

    // 4. 태국 뉴스 번역 (Gemini API)
    log.info("태국 뉴스 번역 시작", { count: thaiNews.length });
    const translatedThaiNews: NewsInput[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < thaiNews.length; i += BATCH_SIZE) {
      const batch = thaiNews.slice(i, i + BATCH_SIZE);
      const translatedBatch = await Promise.all(
        batch.map((newsItem) => translateNewsIfNeeded(newsItem))
      );

      for (const result of translatedBatch) {
        translatedThaiNews.push(result.newsItem);
      }
    }

    log.info("태국 뉴스 번역 완료", {
      requested: thaiNews.length,
      translated: translatedThaiNews.length,
    });

    // 5. 결과 병합
    const allNews = [...translatedThaiNews, ...koreanNews, ...relatedNews];

    // 카테고리별 개수 집계
    const categoryCounts: Record<NewsCategory, number> = {
      태국뉴스: translatedThaiNews.length,
      관련뉴스: relatedNews.length,
      한국뉴스: koreanNews.length,
    };

    log.info("뉴스 수집 및 번역 완료", {
      date,
      categoryCounts,
      total: allNews.length,
    });

    // 6. 중복 체크는 insertNewsBatch()에서 자동으로 수행됨
    // 7. 데이터베이스 저장 (이미지 수집 포함)
    const result = await saveNewsToDatabase(allNews, maxImageGenerationTimeMs);

    // result가 유효한지 확인
    if (!result || typeof result !== "object") {
      log.error("Invalid result from saveNewsToDatabase", undefined, { result });
      return {
        success: 0,
        failed: newsItems.length,
        total: newsItems.length,
        savedNewsIds: [],
        categoryCounts,
        imageGenerationResult: { success: 0, failed: 0 },
      };
    }

    // 뉴스 수집 성공률 메트릭 저장
    const successRate = allNews.length > 0 ? (result.success / allNews.length) * 100 : 0;
    await saveMetricSnapshot({
      metricType: "business",
      metricName: "news_collection_success_rate",
      metricValue: successRate,
      metadata: {
        total: allNews.length,
        success: result.success,
        failed: result.failed,
        date: date || new Date().toISOString().split("T")[0],
      },
    });

    // 뉴스 수집 개수 메트릭 저장
    await saveMetricSnapshot({
      metricType: "business",
      metricName: "news_collection_count",
      metricValue: result.success,
      metadata: {
        total: allNews.length,
        failed: result.failed,
        date: date || new Date().toISOString().split("T")[0],
      },
    });

    return {
      success: result.success || 0,
      failed: result.failed || 0,
      total: allNews.length,
      savedNewsIds: result.savedNewsIds || [],
      categoryCounts,
      imageGenerationResult: result.imageGenerationResult || { success: 0, failed: 0 },
    };
  } catch (error) {
    log.error("Error in fetchAndSaveNews", error);
    throw error;
  }
}
