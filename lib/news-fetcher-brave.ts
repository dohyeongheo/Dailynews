import type { NewsInput, NewsCategory, NewsTopicCategory } from "@/types/news";
import { log } from "./utils/logger";
import { getEnv } from "./config/env";
import { translateToKorean } from "./news-fetcher";

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
 * Brave Search 결과를 NewsInput 형식으로 변환
 */
function convertBraveResultToNewsInput(
  result: BraveSearchResult,
  category: NewsCategory,
  date: string
): NewsInput {
  const sourceMedia = result.meta_url?.hostname || new URL(result.url).hostname || "알 수 없음";
  const sourceCountry = category === "태국뉴스" ? "태국" : "한국";

  // 설명을 content로 사용 (실제 뉴스 본문은 API에서 제공하지 않으므로)
  const content = result.description || result.title || "";

  // 뉴스 주제 분류
  const newsCategory = classifyNewsCategory(result.title, result.description);

  return {
    published_date: date,
    source_country: sourceCountry,
    source_media: sourceMedia,
    title: result.title,
    content: content.length > 300 ? content : `${content}\n\n자세한 내용은 원문을 참고하세요: ${result.url}`,
    category,
    news_category: newsCategory,
  };
}

/**
 * Brave Search API를 사용하여 뉴스를 수집합니다.
 */
export async function fetchNewsFromBrave(date: string = new Date().toISOString().split("T")[0]): Promise<NewsInput[]> {
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
  const allNewsItems: NewsInput[] = [];

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

        // API Rate Limit 방지를 위한 짧은 대기
        await new Promise((resolve) => setTimeout(resolve, 500));
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
    const translatedNewsItems: NewsInput[] = [];
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

    return translatedNewsItems;
  } catch (error) {
    log.error("Error fetching news from Brave", error);
    throw new Error(`Failed to fetch news from Brave: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

