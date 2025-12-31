import type { NewsInput, NewsCategory, NewsTopicCategory } from "@/types/news";
import { log } from "./utils/logger";
import { getEnv } from "./config/env";
import { translateToKorean } from "./news-fetcher";
import { uploadNewsImage } from "./storage/image-storage";
import { updateNewsImageUrl } from "./db/news";

/**
 * Brave Search API 응답 타입
 */
interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  meta_url?: {
    hostname?: string;
  };
  age?: string;
  thumbnail?: {
    src?: string;
  };
}

interface BraveSearchResponse {
  query?: {
    original?: string;
  };
  web?: {
    results?: BraveSearchResult[];
  };
  news?: {
    results?: BraveSearchResult[];
  };
}

/**
 * Brave Search API를 사용하여 뉴스를 검색합니다.
 */
async function searchBraveNews(query: string, count: number = 10): Promise<BraveSearchResult[]> {
  const { BRAVE_SEARCH_API_KEY } = getEnv();

  if (!BRAVE_SEARCH_API_KEY) {
    throw new Error("BRAVE_SEARCH_API_KEY가 설정되지 않았습니다.");
  }

  const apiUrl = "https://api.search.brave.com/res/v1/web/search";
  const params = new URLSearchParams({
    q: query,
    count: count.toString(),
    search_lang: "ko",
    country: "KR",
    safesearch: "moderate",
  });

  try {
    log.debug("Brave Search API 호출", { query, count });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Rate limit 오류 처리
      if (response.status === 429) {
        let retryAfter = 60; // 기본 60초
        try {
          const errorData = JSON.parse(errorText);
          if (errorData?.error?.meta?.rate_limit) {
            // Rate limit 정보가 있으면 재시도 시간 계산
            retryAfter = Math.ceil(60 / errorData.error.meta.rate_limit);
          }
        } catch {
          // JSON 파싱 실패 시 기본값 사용
        }
        
        log.error("Brave Search API Rate Limit 초과", new Error(`HTTP ${response.status}: ${errorText}`), {
          status: response.status,
          statusText: response.statusText,
          query,
          retryAfter,
        });
        throw new Error(`Brave Search API Rate Limit 초과. ${retryAfter}초 후 다시 시도해주세요.`);
      }
      
      log.error("Brave Search API 오류", new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        statusText: response.statusText,
        query,
      });
      throw new Error(`Brave Search API 오류: ${response.status} ${response.statusText}`);
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results || data.news?.results || [];

    log.info("Brave Search API 성공", {
      query,
      resultCount: results.length,
      requestedCount: count,
    });

    return results;
  } catch (error) {
    log.error("Brave Search API 호출 실패", error instanceof Error ? error : new Error(String(error)), {
      query,
    });
    throw error;
  }
}

/**
 * 뉴스 카테고리별 검색 쿼리 생성
 */
function getSearchQueryForCategory(category: NewsCategory, date: string): string {
  const dateStr = date || new Date().toISOString().split("T")[0];

  switch (category) {
    case "태국뉴스":
      return `태국 뉴스 ${dateStr} site:th OR site:thailand`;
    case "관련뉴스":
      return `한국 태국 관련 뉴스 ${dateStr} site:kr OR site:co.kr`;
    case "한국뉴스":
      return `한국 뉴스 ${dateStr} site:kr OR site:co.kr`;
    default:
      return `뉴스 ${dateStr}`;
  }
}

/**
 * HTML 태그를 제거하고 텍스트만 추출합니다.
 */
function stripHtmlTags(text: string): string {
  if (!text) return "";
  // HTML 태그 제거
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 에러 메시지나 불필요한 텍스트를 필터링합니다.
 */
function filterErrorMessages(text: string): string {
  if (!text) return "";
  const lowerText = text.toLowerCase();
  
  // 에러 메시지 패턴
  const errorPatterns = [
    /we cannot provide a description/i,
    /cannot provide/i,
    /no description available/i,
    /description not available/i,
  ];
  
  for (const pattern of errorPatterns) {
    if (pattern.test(text)) {
      return "";
    }
  }
  
  return text;
}

/**
 * description에서 제목을 추출 시도합니다.
 */
function extractTitleFromDescription(description: string): string | null {
  if (!description) return null;
  
  // description이 제목처럼 보이는 경우 (짧고, 문장 끝이 아닌 경우)
  const cleaned = stripHtmlTags(description);
  const sentences = cleaned.split(/[.!?]\s+/);
  
  // 첫 문장이 100자 이하이고 제목처럼 보이면 추출
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 10 && firstSentence.length < 100 && !firstSentence.endsWith(".")) {
      return firstSentence;
    }
  }
  
  return null;
}

/**
 * 제목에서 언론사 이름을 제거합니다.
 */
function removePublisherName(title: string, sourceMedia: string): string {
  if (!title || !sourceMedia) return title;
  
  let cleaned = title;
  
  // 언론사 이름 패턴 제거
  const publisherPatterns = [
    new RegExp(`\\s*\\|\\s*${sourceMedia.replace(/\./g, "\\.")}\\s*$`, "i"),
    new RegExp(`^${sourceMedia.replace(/\./g, "\\.")}\\s*$`, "i"),
    new RegExp(`^${sourceMedia.replace(/\./g, "\\.")}\\s*\\|\\s*`, "i"),
    /\s*\|\s*(중앙일보|서울신문|연합뉴스|KBS|MBC|SBS|경향신문|한겨레|조선일보|동아일보|매일경제|한국경제|조선비즈|이데일리|아시아경제|YTN|JTBC|채널A|TV조선|MBN)\s*$/i,
    /^(중앙일보|서울신문|연합뉴스|KBS|MBC|SBS|경향신문|한겨레|조선일보|동아일보|매일경제|한국경제|조선비즈|이데일리|아시아경제|YTN|JTBC|채널A|TV조선|MBN)\s*$/i,
    /^(경제|정치|사회|국제|문화|스포츠|기술|과학|건강|환경)\s*\|\s*(중앙일보|서울신문|연합뉴스|KBS|MBC|SBS|경향신문|한겨레|조선일보|동아일보|매일경제|한국경제|조선비즈|이데일리|아시아경제|YTN|JTBC|채널A|TV조선|MBN)\s*$/i,
  ];
  
  for (const pattern of publisherPatterns) {
    cleaned = cleaned.replace(pattern, "").trim();
  }
  
  // 카테고리만 있는 경우 제거
  cleaned = cleaned.replace(/^(경제|정치|사회|국제|문화|스포츠|기술|과학|건강|환경)\s*\|\s*$/i, "").trim();
  
  return cleaned || title; // 제거 후 빈 문자열이면 원본 반환
}

/**
 * 제목을 정제합니다.
 */
function cleanTitle(title: string, description: string, url: string, sourceMedia: string): string {
  if (!title) return "";
  
  // HTML 태그 제거
  let cleaned = stripHtmlTags(title);
  
  // 언론사 이름 제거
  cleaned = removePublisherName(cleaned, sourceMedia);
  
  // 제목이 너무 짧거나 언론사 이름만 있는 경우 description에서 추출 시도
  if (cleaned.length < 10 || cleaned === sourceMedia || cleaned.match(/^(중앙일보|서울신문|연합뉴스|KBS|MBC|SBS|경향신문|한겨레|조선일보|동아일보|매일경제|한국경제|조선비즈|이데일리|아시아경제|YTN|JTBC|채널A|TV조선|MBN|뉴스)$/i)) {
    const extractedTitle = extractTitleFromDescription(description);
    if (extractedTitle && extractedTitle.length > cleaned.length) {
      cleaned = extractedTitle;
    }
  }
  
  // URL에서 제목 추출 시도 (마지막 경로에서)
  if (cleaned.length < 10) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter((p) => p && p.length > 5);
      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1])
          .replace(/[-_]/g, " ")
          .replace(/\.[^.]+$/, "");
        if (lastPart.length > cleaned.length && lastPart.length < 100) {
          cleaned = lastPart;
        }
      }
    } catch {
      // URL 파싱 실패 시 무시
    }
  }
  
  return cleaned.trim() || title; // 최종적으로 빈 문자열이면 원본 반환
}

/**
 * 본문 내용을 정제합니다.
 */
function cleanContent(description: string, url: string): string {
  if (!description) return "";
  
  // 에러 메시지 필터링
  let cleaned = filterErrorMessages(description);
  if (!cleaned) {
    return `자세한 내용은 원문을 참고하세요: ${url}`;
  }
  
  // HTML 태그 제거
  cleaned = stripHtmlTags(cleaned);
  
  // 연속된 공백 정리
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // 최소 길이 보장 (100자 미만이면 URL 추가)
  if (cleaned.length < 100) {
    cleaned = `${cleaned}\n\n자세한 내용은 원문을 참고하세요: ${url}`;
  }
  
  return cleaned;
}

/**
 * 뉴스 주제 카테고리 분류 (제목과 내용 기반)
 */
function classifyNewsCategory(title: string, description: string): NewsTopicCategory | null {
  const text = `${title} ${description}`.toLowerCase();

  const categories: Array<{ keywords: string[]; category: NewsTopicCategory; priority: number }> = [
    // 우선순위가 높은 카테고리부터 검사 (더 구체적인 키워드 우선)
    {
      keywords: [
        "과학", "연구", "발견", "실험", "연구소", "과학자", "논문", "발표",
        "science", "research", "study", "discovery", "experiment",
      ],
      category: "과학",
      priority: 1,
    },
    {
      keywords: [
        "정치", "선거", "정책", "국회", "정부", "대통령", "총리", "의원", "당", "여당", "야당",
        "politics", "election", "government", "parliament", "president",
      ],
      category: "정치",
      priority: 2,
    },
    {
      keywords: [
        "경제", "기업", "금융", "주식", "증시", "코스피", "코스닥", "은행", "투자", "경기",
        "economy", "economic", "finance", "stock", "market", "business", "company",
      ],
      category: "경제",
      priority: 3,
    },
    {
      keywords: [
        "스포츠", "경기", "선수", "대회", "올림픽", "월드컵", "축구", "야구", "농구", "골프",
        "sports", "sport", "game", "match", "player", "olympic", "world cup",
      ],
      category: "스포츠",
      priority: 4,
    },
    {
      keywords: [
        "기술", "IT", "디지털", "소프트웨어", "인공지능", "AI", "빅데이터", "클라우드", "스마트폰",
        "tech", "technology", "digital", "software", "artificial intelligence", "cloud",
      ],
      category: "기술",
      priority: 5,
    },
    {
      keywords: [
        "건강", "의료", "질병", "병원", "의사", "치료", "약", "백신", "코로나", "감염",
        "health", "medical", "hospital", "doctor", "disease", "treatment", "medicine",
      ],
      category: "건강",
      priority: 6,
    },
    {
      keywords: [
        "환경", "기후", "생태", "탄소", "온실가스", "재생에너지", "친환경", "기후변화",
        "climate", "environment", "eco", "carbon", "green", "renewable",
      ],
      category: "환경",
      priority: 7,
    },
    {
      keywords: [
        "문화", "예술", "엔터테인먼트", "영화", "드라마", "음악", "공연", "전시", "박물관",
        "culture", "art", "entertainment", "movie", "music", "concert", "exhibition",
      ],
      category: "문화",
      priority: 8,
    },
    {
      keywords: [
        "국제", "외교", "해외", "국제관계", "외교부", "대사관", "국제기구", "유엔", "NATO",
        "international", "diplomacy", "foreign", "global", "UN", "NATO",
      ],
      category: "국제",
      priority: 9,
    },
    {
      keywords: [
        "사회", "사건", "사고", "인물", "범죄", "교통사고", "화재", "재난", "구조", "소방",
        "society", "social", "incident", "accident", "crime", "disaster",
      ],
      category: "사회",
      priority: 10, // 가장 낮은 우선순위 (일반적인 키워드)
    },
  ];

  // 우선순위 순으로 정렬
  const sortedCategories = categories.sort((a, b) => a.priority - b.priority);

  // 우선순위가 높은 카테고리부터 매칭
  for (const { keywords, category } of sortedCategories) {
    // 키워드 매칭 개수 계산
    const matchCount = keywords.filter((keyword) => text.includes(keyword)).length;
    // 최소 1개 이상의 키워드가 매칭되면 해당 카테고리로 분류
    if (matchCount > 0) {
      return category;
    }
  }

  return null;
}

/**
 * URL에서 이미지를 다운로드하여 Buffer로 변환합니다.
 */
async function downloadImageFromUrl(imageUrl: string): Promise<Buffer | null> {
  try {
    log.debug("이미지 다운로드 시작", { imageUrl });
    
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      log.warn("이미지 다운로드 실패", { imageUrl, status: response.status });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 이미지 크기 확인 (최대 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      log.warn("이미지 크기가 너무 큼", { imageUrl, size: buffer.length });
      return null;
    }

    log.debug("이미지 다운로드 완료", { imageUrl, size: buffer.length });
    return buffer;
  } catch (error) {
    log.error("이미지 다운로드 오류", error instanceof Error ? error : new Error(String(error)), {
      imageUrl,
    });
    return null;
  }
}

/**
 * Brave Search API의 thumbnail 이미지를 저장합니다.
 */
export async function saveBraveThumbnailImage(newsId: string, thumbnailUrl: string): Promise<string | null> {
  try {
    const imageBuffer = await downloadImageFromUrl(thumbnailUrl);
    if (!imageBuffer) {
      return null;
    }

    const imageUrl = await uploadNewsImage(newsId, imageBuffer);
    await updateNewsImageUrl(newsId, imageUrl);

    log.info("Brave thumbnail 이미지 저장 완료", {
      newsId,
      thumbnailUrl,
      imageUrl,
      size: imageBuffer.length,
    });

    return imageUrl;
  } catch (error) {
    log.error("Brave thumbnail 이미지 저장 실패", error instanceof Error ? error : new Error(String(error)), {
      newsId,
      thumbnailUrl,
    });
    return null;
  }
}

/**
 * Brave Search 결과를 NewsInput 형식으로 변환
 */
function convertBraveResultToNewsInput(
  result: BraveSearchResult,
  category: NewsCategory,
  date: string
): NewsInput & { thumbnailUrl?: string } {
  const sourceMedia = result.meta_url?.hostname || new URL(result.url).hostname || "알 수 없음";
  const sourceCountry = category === "태국뉴스" ? "태국" : "한국";

  // 제목 정제
  const cleanedTitle = cleanTitle(result.title, result.description, result.url, sourceMedia);
  
  // 본문 정제
  const cleanedContent = cleanContent(result.description, result.url);

  // 뉴스 주제 분류 (정제된 제목과 본문 사용)
  const newsCategory = classifyNewsCategory(cleanedTitle, cleanedContent);

  // thumbnail URL 추출
  const thumbnailUrl = result.thumbnail?.src;

  return {
    published_date: date,
    source_country: sourceCountry,
    source_media: sourceMedia,
    title: cleanedTitle,
    content: cleanedContent,
    category,
    news_category: newsCategory,
    thumbnailUrl,
  };
}

/**
 * Brave Search API를 사용하여 뉴스를 수집합니다.
 * @returns 뉴스 항목과 thumbnail URL 매핑 정보
 */
export async function fetchNewsFromBrave(
  date: string = new Date().toISOString().split("T")[0]
): Promise<{ newsItems: NewsInput[]; thumbnailMap: Map<string, string> }> {
  // 날짜 검증
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const requestDate = date || todayStr;

  if (requestDate > todayStr) {
    log.warn("미래 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayStr });
    date = todayStr;
  } else {
    date = requestDate;
  }

  log.info("Brave Search API를 사용한 뉴스 수집 시작", { date });

  const categories: NewsCategory[] = ["태국뉴스", "관련뉴스", "한국뉴스"];
  const CATEGORY_LIMIT = 10;
  const allNewsItems: (NewsInput & { thumbnailUrl?: string })[] = [];
  const thumbnailMap = new Map<string, string>();

  try {
    // 각 카테고리별로 뉴스 수집
    for (const category of categories) {
      try {
        const query = getSearchQueryForCategory(category, date);
        log.debug("카테고리별 뉴스 검색", { category, query });

        const results = await searchBraveNews(query, CATEGORY_LIMIT * 2); // 여유있게 가져와서 필터링

        // 결과를 NewsInput으로 변환
        const newsItems = results
          .slice(0, CATEGORY_LIMIT) // 정확히 10개만
          .map((result) => convertBraveResultToNewsInput(result, category, date));

        allNewsItems.push(...newsItems);

        log.info("카테고리별 뉴스 수집 완료", {
          category,
          collected: newsItems.length,
          requested: CATEGORY_LIMIT,
        });

        // API Rate Limit 방지를 위한 대기 (Free 플랜은 1 req/sec)
        await new Promise((resolve) => setTimeout(resolve, 1200)); // 1.2초 대기
      } catch (error) {
        log.error("카테고리별 뉴스 수집 실패", error instanceof Error ? error : new Error(String(error)), {
          category,
        });
        // API 키 오류나 초기 설정 오류, 또는 HTTP 오류는 즉시 throw
        if (
          error instanceof Error &&
          (error.message.includes("BRAVE_SEARCH_API_KEY") || error.message.includes("Brave Search API 오류"))
        ) {
          throw error;
        }
        // 네트워크 오류 등은 한 카테고리 실패해도 다른 카테고리는 계속 진행
      }
    }

    // 한국어가 아닌 뉴스 항목들을 번역 처리
    log.debug("한국어 번역이 필요한 뉴스 확인 중");
    const translatedNewsItems: (NewsInput & { thumbnailUrl?: string })[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < allNewsItems.length; i += BATCH_SIZE) {
      const batch = allNewsItems.slice(i, i + BATCH_SIZE);
      const translatedBatch = await Promise.all(
        batch.map(async (newsItem) => {
          // 제목이 한국어가 아니면 번역
          const isKorean = /[\uAC00-\uD7A3]/.test(newsItem.title);
          if (!isKorean) {
            try {
              const translatedTitle = await translateToKorean(newsItem.title);
              newsItem.title = translatedTitle;
            } catch (error) {
              log.warn("제목 번역 실패", { title: newsItem.title.substring(0, 50) });
            }
          }

          // 내용이 한국어가 아니면 번역
          const isContentKorean = /[\uAC00-\uD7A3]/.test(newsItem.content);
          if (!isContentKorean) {
            try {
              const translatedContent = await translateToKorean(newsItem.content);
              newsItem.content = translatedContent;
            } catch (error) {
              log.warn("내용 번역 실패", { content: newsItem.content.substring(0, 50) });
            }
          }

          return newsItem;
        })
      );

      translatedNewsItems.push(...translatedBatch);
    }

    log.info("Brave Search API 뉴스 수집 완료", {
      total: translatedNewsItems.length,
      byCategory: translatedNewsItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<NewsCategory, number>),
    });

    // thumbnail URL 정보를 별도 맵으로 추출하고 NewsInput만 반환
    // 인덱스를 키로 사용하여 나중에 savedNewsIds와 매칭
    const finalNewsItems: NewsInput[] = translatedNewsItems.map((item, index) => {
      const { thumbnailUrl, ...newsInput } = item;
      // thumbnail URL을 인덱스 기반으로 맵에 저장
      if (thumbnailUrl) {
        thumbnailMap.set(String(index), thumbnailUrl);
      }
      return newsInput;
    });

    log.info("Brave Search API 뉴스 수집 완료 (최종)", {
      total: finalNewsItems.length,
      thumbnailCount: thumbnailMap.size,
    });

    return { newsItems: finalNewsItems, thumbnailMap };
  } catch (error) {
    log.error("Error fetching news from Brave", error);
    throw new Error(`Failed to fetch news from Brave: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

