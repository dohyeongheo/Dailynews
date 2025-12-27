import { GoogleGenerativeAI } from "@google/generative-ai";
import { insertNewsBatch } from "./db/news";
import type { NewsInput, GeminiNewsResponse, NewsCategory, NewsTopicCategory } from "@/types/news";
import { log } from "./utils/logger";

/**
 * Gemini AI 클라이언트를 지연 초기화합니다.
 * 빌드 타임에 API 키가 없어도 오류가 발생하지 않도록 합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  const { GOOGLE_GEMINI_API_KEY } = require("@/lib/config/env").getEnv();
  return new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
}

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
 */
function extractJSON(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  let jsonText = text.trim();

  // 1. 마크다운 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
  if (jsonText.includes("```")) {
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim();
    }
  }

  // 2. JSON 시작 위치 찾기 ({)
  const startIndex = jsonText.indexOf("{");
  if (startIndex === -1) {
    return null;
  }

  // 3. JSON 종료 위치 찾기 (마지막 })
  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < jsonText.length; i++) {
    if (jsonText[i] === "{") {
      braceCount++;
    } else if (jsonText[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    return null;
  }

  // 4. JSON 부분만 추출
  const extractedJSON = jsonText.substring(startIndex, endIndex + 1);

  // 5. 유효성 검사
  if (isValidJSON(extractedJSON)) {
    return extractedJSON;
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
    const errorObj = error as any;
    if (errorObj.errorDetails) {
      for (const detail of errorObj.errorDetails) {
        if (detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" && detail.retryDelay) {
          const retryDelay = parseFloat(detail.retryDelay);
          if (!isNaN(retryDelay)) {
            result.retryAfter = Math.ceil(retryDelay);
          }
        }
        if (detail["@type"] === "type.googleapis.com/google.rpc.QuotaFailure" && detail.violations) {
          for (const violation of detail.violations) {
            if (violation.quotaValue) {
              result.limit = parseInt(violation.quotaValue, 10);
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
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `다음 텍스트를 자연스러운 한국어로 번역해주세요. 원문의 의미와 뉘앙스를 정확히 전달해야 합니다. 번역만 출력하고 다른 설명은 하지 마세요.

원문:
${text}`;

    const result = await model.generateContent(prompt);
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
 * 뉴스 항목의 제목과 내용을 확인하고 필요시 한국어로 번역합니다.
 */
async function translateNewsIfNeeded(newsItem: NewsInput): Promise<NewsInput> {
  let title = newsItem.title;
  let content = newsItem.content;
  let contentTranslated = newsItem.content_translated;

  // 제목이 한국어가 아니면 번역
  if (!isKorean(title)) {
    log.debug("제목 번역 중", { titlePreview: title.substring(0, 50) });
    title = await translateToKorean(title);
  }

  // 태국 뉴스인 경우 특별 처리
  if (newsItem.category === "태국뉴스") {
    // content가 영어이고, content_translated가 없거나 영어인 경우 번역
    if (!isKorean(content)) {
      // content_translated가 없거나, 있더라도 한국어가 아니면 번역
      if (!contentTranslated || !isKorean(contentTranslated)) {
        log.debug("태국 뉴스 내용 번역 중", { contentPreview: content.substring(0, 50) });
        contentTranslated = await translateToKorean(content);
      }
    } else {
      // content가 이미 한국어인 경우
      contentTranslated = null;
    }
  } else {
    // 다른 카테고리: content_translated가 없거나 비어있고, content가 한국어가 아니면 번역
    if ((!contentTranslated || contentTranslated.trim() === "") && !isKorean(content)) {
      log.debug("내용 번역 중", { contentPreview: content.substring(0, 50) });
      contentTranslated = await translateToKorean(content);
    } else if (!contentTranslated || contentTranslated.trim() === "") {
      // 한국어인 경우 content_translated를 null로 유지
      contentTranslated = null;
    } else if (contentTranslated && !isKorean(contentTranslated)) {
      // content_translated가 있지만 한국어가 아닌 경우 다시 번역
      log.debug("content_translated가 한국어가 아니어서 재번역 중", { contentTranslatedPreview: contentTranslated.substring(0, 50) });
      contentTranslated = await translateToKorean(content);
    }
  }

  return {
    ...newsItem,
    title,
    content,
    content_translated: contentTranslated,
  };
}

/**
 * Google Gemini API를 사용하여 뉴스를 수집합니다.
 */
export async function fetchNewsFromGemini(date: string = new Date().toISOString().split("T")[0]): Promise<NewsInput[]> {
  // Gemini AI 클라이언트 초기화 (런타임에 실행)
  const genAI = getGenAI();

  // gemini-2.5-flash 모델 사용
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  log.info("모델 선택: gemini-2.5-flash");

  // 날짜 검증: 미래 날짜가 아닌지 확인
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const requestDate = date || todayStr;

  // 미래 날짜인 경우 오늘 날짜로 변경
  if (requestDate > todayStr) {
    log.warn("미래 날짜 감지", { requestDate, todayStr });
    date = todayStr;
  } else {
    date = requestDate;
  }

  const prompt = `${date}의 태국 주요 뉴스(한국어 번역), 한국의 태국 관련 뉴스, 한국 주요 뉴스를 가능한 한 많은 뉴스를 수집하여 JSON 포맷으로 출력해주세요. (최소 20개 이상)

다음 JSON 형식을 정확히 따라주세요:
{
  "news": [
    {
      "title": "뉴스 제목",
      "content": "뉴스 본문 내용",
      "content_translated": "번역된 내용 (태국 뉴스인 경우)",
      "source_country": "태국" 또는 "한국",
      "source_media": "언론사 이름",
      "category": "태국뉴스" 또는 "관련뉴스" 또는 "한국뉴스",
      "news_category": "과학" 또는 "사회" 또는 "정치" 또는 "경제" 또는 "스포츠" 또는 "문화" 또는 "기술" 또는 "건강" 또는 "환경" 또는 "국제" 또는 "기타" (뉴스 내용을 분석하여 가장 적합한 주제 분류를 선택, 없으면 null),
      "published_date": "${date}",
      "original_link": "뉴스 원문 URL (실제 뉴스 기사 링크, 없으면 빈 문자열)"
    }
  ]
}

중요 사항:
- 각 뉴스의 본문 내용(content)은 상세하게 작성해주세요. 가능한 한 자세히 작성하되, 최소 300자 이상으로 작성해주세요. 뉴스의 핵심 내용, 배경 정보, 영향 등을 포함해주세요.
- content_translated도 원문과 동일한 수준의 상세함을 유지하여 가능한 한 자세히 작성해주세요.
- news_category는 뉴스의 제목과 내용을 분석하여 가장 적합한 주제 분류를 선택해주세요. 뉴스의 주요 주제가 명확하지 않은 경우 null로 설정할 수 있습니다.

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

각 카테고리별로 가능한 한 많은 뉴스를 포함해주세요. (최소 10개 이상 권장)`;

  try {
    let result;
    let response;
    let text;
    let lastError: Error | null = null;
    const MAX_RETRIES = 3;

    // 기본 모드로 뉴스 수집 시도 (재시도 로직 포함)
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        log.debug("뉴스 수집 시도 중", { attempt: attempt + 1, maxRetries: MAX_RETRIES + 1 });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
        log.info("뉴스 수집 성공");
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
      if (text.includes("미래 날짜") || text.includes("future date") || text.includes("2025")) {
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
      log.error("JSON 추출 실패", undefined, {
        originalTextPreview: text.substring(0, 500),
        originalTextLength: text.length,
        hasMarkdown: text.includes("```"),
        hasJsonStart: text.includes("{"),
      });
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

      // original_link 검증 (선택적 필드, URL 형식이거나 빈 문자열)
      if (item.original_link !== undefined && item.original_link !== null && item.original_link !== "") {
        if (typeof item.original_link !== "string") {
          log.warn("뉴스 항목 original_link가 유효하지 않음", { index: index + 1, title: item.title });
          // original_link가 유효하지 않으면 빈 문자열로 설정
          item.original_link = "";
        } else {
          // URL 형식 검증 (간단한 검증)
          try {
            new URL(item.original_link);
          } catch {
            log.warn("뉴스 항목 original_link가 유효한 URL 형식이 아님", { index: index + 1, title: item.title, original_link: item.original_link });
            // 유효하지 않은 URL이면 빈 문자열로 설정
            item.original_link = "";
          }
        }
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

      return true;
    });

    log.info("데이터 검증 완료", { total: parsedData.news.length, valid: validNewsItems.length });

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

      return {
        published_date: item.published_date || date,
        source_country: item.source_country,
        source_media: item.source_media,
        title: item.title,
        content: item.content,
        content_translated: item.content_translated || null,
        category: item.category as NewsCategory,
        news_category: newsCategory,
        original_link: item.original_link || "", // Gemini API에서 받은 original_link 사용, 없으면 빈 문자열
      };
    });

    // 한국어가 아닌 뉴스 항목들을 번역 처리
    // 성능 개선: 병렬 처리로 번역 시간 단축
    log.debug("한국어 번역이 필요한 뉴스 확인 중");

    // 병렬 처리로 번역 시간 단축 (최대 5개씩 동시 처리)
    const BATCH_SIZE = 5;
    const translatedNewsItems: NewsInput[] = [];

    for (let i = 0; i < newsItems.length; i += BATCH_SIZE) {
      const batch = newsItems.slice(i, i + BATCH_SIZE);
      const translatedBatch = await Promise.all(batch.map((newsItem) => translateNewsIfNeeded(newsItem)));
      translatedNewsItems.push(...translatedBatch);

      // 진행 상황 로깅
      if ((i + BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= newsItems.length) {
        log.debug("번역 진행 중", { processed: Math.min(i + BATCH_SIZE, newsItems.length), total: newsItems.length });
      }
    }

    log.info("번역 완료", { count: translatedNewsItems.length });
    return translatedNewsItems;
  } catch (error) {
    log.error("Error fetching news from Gemini", error);
    throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 수집한 뉴스를 로컬 데이터베이스에 저장합니다.
 */
export async function saveNewsToDatabase(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  try {
    const result = await insertNewsBatch(newsItems);

    // result가 유효한지 확인
    if (!result || typeof result !== "object" || typeof result.success !== "number" || typeof result.failed !== "number") {
      log.error("Invalid result from insertNewsBatch", undefined, { result });
      return { success: 0, failed: newsItems.length };
    }

    return result;
  } catch (error) {
    log.error("Error in saveNewsToDatabase", error);
    return { success: 0, failed: newsItems.length };
  }
}

/**
 * 뉴스 수집 및 저장을 한 번에 수행합니다.
 */
export async function fetchAndSaveNews(date?: string): Promise<{ success: number; failed: number; total: number }> {
  try {
    const newsItems = await fetchNewsFromGemini(date);
    const result = await saveNewsToDatabase(newsItems);

    // result가 유효한지 확인
    if (!result || typeof result !== "object") {
      log.error("Invalid result from saveNewsToDatabase", undefined, { result });
      return {
        success: 0,
        failed: newsItems.length,
        total: newsItems.length,
      };
    }

    return {
      success: result.success || 0,
      failed: result.failed || 0,
      total: newsItems.length,
    };
  } catch (error) {
    log.error("Error in fetchAndSaveNews", error);
    throw error;
  }
}
