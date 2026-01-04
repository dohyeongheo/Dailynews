/**
 * 네이버 뉴스 검색 API 클라이언트
 * 한국 뉴스 및 한국 내 태국 관련 뉴스 수집을 위한 API 클라이언트
 */

import { getEnv } from "../config/env";
import { log } from "../utils/logger";
import type { NewsInput } from "@/types/news";
import { isPastDate, isFutureDate, parseRFC822Date } from "../utils/date-helper";

/**
 * 네이버 API 응답 타입
 */
interface NaverNewsItem {
  title: string; // HTML 태그 포함 가능
  originallink: string; // 원문 URL
  link: string; // 네이버 뉴스 URL
  description: string; // 요약 정보 (HTML 태그 포함)
  pubDate: string; // RFC 822 형식 날짜
}

interface NaverNewsResponse {
  items: NaverNewsItem[];
  total: number;
  start: number;
  display: number;
}

/**
 * HTML 태그를 제거합니다.
 * @param text HTML 태그가 포함된 텍스트
 * @returns HTML 태그가 제거된 텍스트
 */
function removeHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // 모든 HTML 태그 제거
    .replace(/&nbsp;/g, " ") // &nbsp; 제거
    .replace(/&amp;/g, "&") // &amp; 제거
    .replace(/&lt;/g, "<") // &lt; 제거
    .replace(/&gt;/g, ">") // &gt; 제거
    .replace(/&quot;/g, '"') // &quot; 제거
    .replace(/&#39;/g, "'") // &#39; 제거
    .trim();
}

/**
 * URL에서 도메인을 추출하여 소스 미디어 이름으로 변환합니다.
 * @param url 원문 URL
 * @returns 소스 미디어 이름
 */
function extractSourceMedia(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // www. 제거 및 도메인 이름 추출
    const domain = hostname.replace(/^www\./, "");
    // 도메인에서 최상위 도메인 부분만 추출 (예: yonhapnews.co.kr -> yonhapnews)
    const parts = domain.split(".");
    if (parts.length > 2) {
      return parts[0]; // 첫 번째 부분 반환
    }
    return domain;
  } catch {
    return "Unknown";
  }
}

/**
 * 네이버 API를 사용하여 한국 뉴스를 수집합니다.
 * @param date 수집할 뉴스의 날짜 (YYYY-MM-DD 형식)
 * @param limit 수집할 뉴스 개수 (기본값: 10)
 * @returns NewsInput 배열
 */
export async function fetchKoreanNewsFromNaver(
  date: string,
  limit: number = 10
): Promise<NewsInput[]> {
  const { NAVER_CLIENT_ID, NAVER_SECRET } = getEnv();

  if (!NAVER_CLIENT_ID || !NAVER_SECRET) {
    log.warn("네이버 API 키가 설정되지 않아 한국 뉴스 수집을 건너뜁니다");
    return [];
  }

  try {
    // 네이버 뉴스 검색 API 엔드포인트
    const apiUrl = new URL("https://openapi.naver.com/v1/search/news.json");
    apiUrl.searchParams.set("query", "한국"); // 검색어: "한국"
    apiUrl.searchParams.set("display", "100"); // 최대 100개 요청
    apiUrl.searchParams.set("start", "1");
    apiUrl.searchParams.set("sort", "date"); // 날짜순 정렬

    log.info("네이버 API 한국 뉴스 수집 시작", { date, limit });

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_SECRET,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("네이버 API 요청 실패", new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        date,
      });
      return [];
    }

    const data: NaverNewsResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      log.warn("네이버 API에서 한국 뉴스를 찾을 수 없음", { date, total: data.total });
      return [];
    }

    log.info("네이버 API 응답 수신", {
      date,
      total: data.total,
      itemsCount: data.items.length,
    });

    // 날짜 필터링 및 데이터 변환
    const newsItems: NewsInput[] = [];
    for (const item of data.items) {
      // RFC 822 형식을 YYYY-MM-DD로 변환
      const articleDate = parseRFC822Date(item.pubDate);

      if (!articleDate || articleDate !== date) {
        continue; // 날짜가 일치하지 않으면 제외
      }

      // 과거/미래 날짜 확인
      if (isPastDate(articleDate) || isFutureDate(articleDate)) {
        continue; // 과거 또는 미래 날짜면 제외
      }

      // 필수 필드 검증
      if (!item.title || !item.description) {
        continue; // 제목이나 설명이 없으면 제외
      }

      // HTML 태그 제거
      const title = removeHtmlTags(item.title);
      const content = removeHtmlTags(item.description);

      if (content.trim().length < 100) {
        continue; // 내용이 너무 짧으면 제외 (최소 100자)
      }

      newsItems.push({
        title: title.trim(),
        content: content.trim(),
        source_country: "한국",
        source_media: extractSourceMedia(item.originallink),
        category: "한국뉴스",
        published_date: date,
        source_api: 'naver',
        original_url: item.originallink, // 원문 URL (이미지 크롤링용)
      });

      // limit 개수만큼 수집하면 중단
      if (newsItems.length >= limit) {
        break;
      }
    }

    log.info("네이버 API 한국 뉴스 수집 완료", {
      date,
      requested: limit,
      collected: newsItems.length,
    });

    return newsItems;
  } catch (error) {
    log.error("네이버 API 한국 뉴스 수집 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      date,
      limit,
    });
    return [];
  }
}

/**
 * 네이버 API를 사용하여 한국 내 태국 관련 뉴스를 수집합니다.
 * @param date 수집할 뉴스의 날짜 (YYYY-MM-DD 형식)
 * @param limit 수집할 뉴스 개수 (기본값: 10)
 * @returns NewsInput 배열
 */
export async function fetchRelatedNewsFromNaver(
  date: string,
  limit: number = 10
): Promise<NewsInput[]> {
  const { NAVER_CLIENT_ID, NAVER_SECRET } = getEnv();

  if (!NAVER_CLIENT_ID || !NAVER_SECRET) {
    log.warn("네이버 API 키가 설정되지 않아 관련 뉴스 수집을 건너뜁니다");
    return [];
  }

  try {
    // 네이버 뉴스 검색 API 엔드포인트
    const apiUrl = new URL("https://openapi.naver.com/v1/search/news.json");
    apiUrl.searchParams.set("query", "태국"); // 검색어: "태국"
    apiUrl.searchParams.set("display", "100"); // 최대 100개 요청
    apiUrl.searchParams.set("start", "1");
    apiUrl.searchParams.set("sort", "date"); // 날짜순 정렬

    log.info("네이버 API 관련 뉴스 수집 시작", { date, limit });

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_SECRET,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("네이버 API 요청 실패", new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        date,
      });
      return [];
    }

    const data: NaverNewsResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      log.warn("네이버 API에서 관련 뉴스를 찾을 수 없음", { date, total: data.total });
      return [];
    }

    log.info("네이버 API 응답 수신", {
      date,
      total: data.total,
      itemsCount: data.items.length,
    });

    // 날짜 필터링 및 데이터 변환
    const newsItems: NewsInput[] = [];
    for (const item of data.items) {
      // RFC 822 형식을 YYYY-MM-DD로 변환
      const articleDate = parseRFC822Date(item.pubDate);

      if (!articleDate || articleDate !== date) {
        continue; // 날짜가 일치하지 않으면 제외
      }

      // 과거/미래 날짜 확인
      if (isPastDate(articleDate) || isFutureDate(articleDate)) {
        continue; // 과거 또는 미래 날짜면 제외
      }

      // 필수 필드 검증
      if (!item.title || !item.description) {
        continue; // 제목이나 설명이 없으면 제외
      }

      // HTML 태그 제거
      const title = removeHtmlTags(item.title);
      const content = removeHtmlTags(item.description);

      if (content.trim().length < 100) {
        continue; // 내용이 너무 짧으면 제외 (최소 100자)
      }

      newsItems.push({
        title: title.trim(),
        content: content.trim(),
        source_country: "한국",
        source_media: extractSourceMedia(item.originallink),
        category: "관련뉴스",
        published_date: date,
        source_api: 'naver',
        original_url: item.originallink, // 원문 URL (이미지 크롤링용)
      });

      // limit 개수만큼 수집하면 중단
      if (newsItems.length >= limit) {
        break;
      }
    }

    log.info("네이버 API 관련 뉴스 수집 완료", {
      date,
      requested: limit,
      collected: newsItems.length,
    });

    return newsItems;
  } catch (error) {
    log.error("네이버 API 관련 뉴스 수집 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      date,
      limit,
    });
    return [];
  }
}

