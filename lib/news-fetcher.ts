import { GoogleGenerativeAI } from "@google/generative-ai";
import { insertNewsBatch } from "./db/news";
import type { NewsInput, GeminiNewsResponse, NewsCategory } from "@/types/news";

/**
 * Gemini AI 클라이언트를 지연 초기화합니다.
 * 빌드 타임에 API 키가 없어도 오류가 발생하지 않도록 합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not set");
  }

  return new GoogleGenerativeAI(API_KEY);
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
 */
async function translateToKorean(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;

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
    console.error("번역 오류:", error);
    // 번역 실패 시 원본 반환
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
    console.log(`📝 제목 번역 중: ${title.substring(0, 50)}...`);
    title = await translateToKorean(title);
  }

  // 태국 뉴스인 경우 특별 처리
  if (newsItem.category === "태국뉴스") {
    // content가 영어이고, content_translated가 없거나 영어인 경우 번역
    if (!isKorean(content)) {
      // content_translated가 없거나, 있더라도 한국어가 아니면 번역
      if (!contentTranslated || !isKorean(contentTranslated)) {
        console.log(`📝 태국 뉴스 내용 번역 중: ${content.substring(0, 50)}...`);
        contentTranslated = await translateToKorean(content);
      }
    } else {
      // content가 이미 한국어인 경우
      contentTranslated = null;
    }
  } else {
    // 다른 카테고리: content_translated가 없거나 비어있고, content가 한국어가 아니면 번역
    if ((!contentTranslated || contentTranslated.trim() === "") && !isKorean(content)) {
      console.log(`📝 내용 번역 중: ${content.substring(0, 50)}...`);
      contentTranslated = await translateToKorean(content);
    } else if (!contentTranslated || contentTranslated.trim() === "") {
      // 한국어인 경우 content_translated를 null로 유지
      contentTranslated = null;
    } else if (contentTranslated && !isKorean(contentTranslated)) {
      // content_translated가 있지만 한국어가 아닌 경우 다시 번역
      console.log(`📝 content_translated가 한국어가 아니어서 재번역 중: ${contentTranslated.substring(0, 50)}...`);
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
 * Search Grounding 기능을 활용하여 최신 뉴스를 가져옵니다.
 */
export async function fetchNewsFromGemini(date: string = new Date().toISOString().split("T")[0]): Promise<NewsInput[]> {
  // 사용 가능한 모델 목록 시도 (우선순위 순)
  // 최신 모델: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash 등
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

  let model = null;
  let lastError: Error | null = null;

  // Gemini AI 클라이언트 초기화 (런타임에 실행)
  const genAI = getGenAI();

  // 기본 모델 사용 (gemini-2.5-flash가 가장 빠르고 안정적)
  // 모델 객체 생성은 항상 성공하므로, 실제 요청 시 오류가 발생하면 다른 모델 시도
  model = genAI.getGenerativeModel({ model: modelsToTry[0] });
  console.log(`✅ 모델 선택: ${modelsToTry[0]}`);

  const prompt = `${date}의 태국 주요 뉴스(한국어 번역), 한국의 태국 관련 뉴스, 한국 주요 뉴스를 10개 이상 수집하여 JSON 포맷으로 출력해주세요.

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
      "original_link": "원본 뉴스 링크 URL (반드시 http:// 또는 https://로 시작하는 완전한 URL이어야 함)",
      "published_date": "${date}"
    }
  ]
}

중요 사항:
- original_link는 반드시 실제 뉴스 기사 URL이어야 하며, http:// 또는 https://로 시작하는 완전한 URL 형식이어야 합니다.
- original_link가 없거나 유효하지 않은 경우, 해당 뉴스는 제외하거나 빈 문자열("")로 설정하세요.
- 각 뉴스는 반드시 실제 존재하는 뉴스 기사여야 하며, 실제 URL을 제공해야 합니다.

카테고리 분류 기준:
- "태국뉴스": 태국에서 발생한 주요 뉴스
- "관련뉴스": 한국에서 태국과 관련된 뉴스
- "한국뉴스": 한국의 주요 뉴스

각 카테고리별로 최소 3개 이상의 뉴스를 포함해주세요.`;

  try {
    let result;
    let response;
    let text;

    // 먼저 Search Grounding을 사용하여 시도
    try {
      console.log("🔄 Search Grounding을 사용하여 뉴스 수집 시도...");
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [
          {
            googleSearchRetrieval: {},
          },
        ],
      });
      response = await result.response;
      text = response.text();
      console.log("✅ Search Grounding 사용 성공");
    } catch (groundingError) {
      // Search Grounding이 지원되지 않거나 실패한 경우, 기본 모드로 시도
      console.log("⚠️  Search Grounding 사용 실패, 기본 모드로 시도...");
      console.log(`오류: ${groundingError instanceof Error ? groundingError.message : String(groundingError)}`);

      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
      console.log("✅ 기본 모드로 뉴스 수집 성공");
    }

    // JSON 응답 파싱
    let jsonText = text.trim();

    // 마크다운 코드 블록 제거 (```json ... ```)
    if (jsonText.includes("```")) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    }

    const parsedData: GeminiNewsResponse = JSON.parse(jsonText);

    if (!parsedData.news || !Array.isArray(parsedData.news)) {
      throw new Error("Invalid response format from Gemini API");
    }

    // 데이터 정규화 및 변환
    const newsItems: NewsInput[] = parsedData.news.map((item) => {
      // original_link 유효성 검사 및 정규화
      let originalLink = item.original_link || "";

      // 빈 문자열이거나 유효하지 않은 경우 처리
      if (!originalLink || originalLink.trim() === "") {
        originalLink = "#"; // 기본값으로 # 설정
      } else {
        // URL 형식 검증 및 정규화
        originalLink = originalLink.trim();

        // http:// 또는 https://로 시작하지 않으면 추가
        if (!originalLink.startsWith("http://") && !originalLink.startsWith("https://")) {
          originalLink = `https://${originalLink}`;
        }

        // URL 유효성 검사
        try {
          new URL(originalLink);
        } catch {
          // 유효하지 않은 URL인 경우 기본값으로 설정
          console.warn(`Invalid URL detected: ${originalLink}, setting to #`);
          originalLink = "#";
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
        original_link: originalLink,
      };
    });

    // 한국어가 아닌 뉴스 항목들을 번역 처리
    console.log("🔄 한국어 번역이 필요한 뉴스 확인 중...");
    const translatedNewsItems: NewsInput[] = [];

    for (const newsItem of newsItems) {
      const translated = await translateNewsIfNeeded(newsItem);
      translatedNewsItems.push(translated);
    }

    console.log(`✅ 번역 완료: ${translatedNewsItems.length}개 뉴스 처리됨`);
    return translatedNewsItems;
  } catch (error) {
    console.error("Error fetching news from Gemini:", error);
    throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 수집한 뉴스를 로컬 데이터베이스에 저장합니다.
 */
export async function saveNewsToDatabase(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  const result = await insertNewsBatch(newsItems);
  return result;
}

/**
 * 뉴스 수집 및 저장을 한 번에 수행합니다.
 */
export async function fetchAndSaveNews(date?: string): Promise<{ success: number; failed: number; total: number }> {
  const newsItems = await fetchNewsFromGemini(date);
  const result = await saveNewsToDatabase(newsItems);

  return {
    ...result,
    total: newsItems.length,
  };
}
