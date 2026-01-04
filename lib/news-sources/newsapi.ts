/**
 * NewsAPI.org 클라이언트
 * 태국 뉴스 수집을 위한 API 클라이언트
 */

import { getEnv } from "../config/env";
import { log } from "../utils/logger";
import type { NewsInput } from "@/types/news";
import { isPastDate, isFutureDate } from "../utils/date-helper";

/**
 * NewsAPI 응답 타입
 */
interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string; // 원문 URL (번역용)
  urlToImage: string | null; // 이미지 URL (이미지 수집용)
  publishedAt: string; // ISO 8601 형식
  content: string | null; // 기사 본문 (일부만 제공될 수 있음)
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

/**
 * NewsAPI.org를 사용하여 태국 뉴스를 수집합니다.
 * @param date 수집할 뉴스의 날짜 (YYYY-MM-DD 형식)
 * @param limit 수집할 뉴스 개수 (기본값: 10)
 * @returns NewsInput 배열
 */
export async function fetchThaiNewsFromNewsAPI(
  date: string,
  limit: number = 10
): Promise<NewsInput[]> {
  const { NEWSAPI_KEY } = getEnv();

  if (!NEWSAPI_KEY) {
    log.warn("NEWSAPI_KEY가 설정되지 않아 태국 뉴스 수집을 건너뜁니다");
    return [];
  }

  try {
    // NewsAPI Everything 엔드포인트 사용
    // from과 to를 같은 날짜로 설정하여 해당 날짜의 뉴스만 수집
    // q 파라미터 필수: 태국 관련 검색어 사용
    const apiUrl = new URL("https://newsapi.org/v2/everything");
    apiUrl.searchParams.set("q", "Thailand OR ไทย"); // 태국 관련 검색어 (필수)
    apiUrl.searchParams.set("language", "th"); // 태국어
    apiUrl.searchParams.set("from", `${date}T00:00:00Z`);
    apiUrl.searchParams.set("to", `${date}T23:59:59Z`);
    apiUrl.searchParams.set("sortBy", "publishedAt"); // 날짜순 정렬
    apiUrl.searchParams.set("pageSize", "100"); // 최대 100개 요청 (필터링 후 limit만큼 선택)
    apiUrl.searchParams.set("page", "1");

    log.info("NewsAPI 태국 뉴스 수집 시작", { date, limit });

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "X-Api-Key": NEWSAPI_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("NewsAPI 요청 실패", new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        date,
      });
      return [];
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status !== "ok") {
      log.error("NewsAPI 응답 오류", new Error(`Status: ${data.status}`), { date });
      return [];
    }

    if (!data.articles || data.articles.length === 0) {
      log.warn("NewsAPI에서 뉴스를 찾을 수 없음", { date, totalResults: data.totalResults });
      return [];
    }

    log.info("NewsAPI 응답 수신", {
      date,
      totalResults: data.totalResults,
      articlesCount: data.articles.length,
    });

    // 날짜 필터링 및 데이터 변환
    const newsItems: NewsInput[] = [];
    for (const article of data.articles) {
      // publishedAt을 YYYY-MM-DD 형식으로 변환
      const articleDate = new Date(article.publishedAt).toISOString().split("T")[0];

      // 요청한 날짜와 일치하는지 확인
      if (articleDate !== date) {
        continue; // 날짜가 일치하지 않으면 제외
      }

      // 과거/미래 날짜 확인
      if (isPastDate(articleDate) || isFutureDate(articleDate)) {
        continue; // 과거 또는 미래 날짜면 제외
      }

      // 필수 필드 검증
      if (!article.title || !article.description) {
        continue; // 제목이나 설명이 없으면 제외
      }

      // 본문 내용 결정 (description이 없으면 content 사용)
      const content = article.description || article.content || "";

      if (content.trim().length < 100) {
        continue; // 내용이 너무 짧으면 제외 (최소 100자)
      }

      newsItems.push({
        title: article.title.trim(),
        content: content.trim(),
        source_country: "태국",
        source_media: article.source.name || "Unknown",
        category: "태국뉴스",
        published_date: date,
        source_api: 'newsapi',
        original_url: article.url, // 원문 URL (번역용)
        url_to_image: article.urlToImage || undefined, // 이미지 URL
      });

      // limit 개수만큼 수집하면 중단
      if (newsItems.length >= limit) {
        break;
      }
    }

    log.info("NewsAPI 태국 뉴스 수집 완료", {
      date,
      requested: limit,
      collected: newsItems.length,
    });

    return newsItems;
  } catch (error) {
    log.error("NewsAPI 태국 뉴스 수집 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      date,
      limit,
    });
    return [];
  }
}

