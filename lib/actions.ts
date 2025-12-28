"use server";

import { fetchAndSaveNews, retryFailedTranslations } from "./news-fetcher";
import * as newsDB from "./db/news";
import type { News, NewsCategory } from "@/types/news";
import { toAppError, getErrorMessage, ErrorType } from "./errors";
import { log } from "./utils/logger";

/**
 * 공통 에러 처리 헬퍼 함수
 * @param error 발생한 에러
 * @param errorType 에러 타입
 * @param context 추가 컨텍스트 정보
 * @returns 에러 응답 객체
 */
function handleActionError(
  error: unknown,
  errorType: ErrorType,
  context?: Record<string, unknown>
): { success: false; error: string; data: null; message?: string; hasMore?: boolean } {
  log.error("Action error", error instanceof Error ? error : new Error(String(error)), context);
  const appError = toAppError(error, errorType);
  const errorMessage = getErrorMessage(appError);
  return {
    success: false,
    error: errorMessage,
    data: null,
  };
}

/**
 * 공통 데이터 검증 함수
 * @param data 검증할 데이터
 * @param errorMessage 에러 메시지
 * @returns 검증 결과
 */
function validateNewsData<T extends News[]>(
  data: T | null | undefined,
  errorMessage: string = "뉴스 데이터 형식이 올바르지 않습니다."
): { isValid: false; error: string } | { isValid: true; data: T } {
  if (!data || !Array.isArray(data)) {
    return { isValid: false, error: errorMessage };
  }
  return { isValid: true, data };
}

/**
 * 뉴스를 수집하고 데이터베이스에 저장하는 Server Action
 * @param date 수집할 뉴스의 날짜 (기본값: 오늘)
 * @param maxImageGenerationTimeMs 이미지 생성에 사용할 수 있는 최대 시간(밀리초). 설정하지 않으면 제한 없음.
 */
export async function fetchAndSaveNewsAction(date?: string, maxImageGenerationTimeMs?: number) {
  try {
    const result = await fetchAndSaveNews(date, maxImageGenerationTimeMs);

    // result가 유효한지 확인
    if (!result || typeof result !== "object") {
      throw new Error("뉴스 수집 결과가 올바르지 않습니다.");
    }

    return {
      success: true,
      message: `${result.total || 0}개의 뉴스 중 ${result.success || 0}개가 성공적으로 저장되었습니다.`,
      data: result,
    };
  } catch (error) {
    const errorResult = handleActionError(error, ErrorType.API_ERROR, { date, maxImageGenerationTimeMs });
    return {
      ...errorResult,
      message: errorResult.error,
    };
  }
}

/**
 * 카테고리별로 뉴스를 조회하는 Server Action
 */
export async function getNewsByCategoryAction(
  category: NewsCategory,
  limit: number = 10,
  offset: number = 0
): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    log.debug("getNewsByCategoryAction 시작", { category, limit, offset });
    const data = await newsDB.getNewsByCategory(category, limit, offset);

    const validation = validateNewsData(data);
    if (!validation.isValid) {
      log.warn("getNewsByCategoryAction 유효하지 않은 데이터 반환", { category });
      return {
        success: false,
        data: null,
        error: validation.error,
      };
    }

    log.debug("getNewsByCategoryAction 성공", { count: validation.data.length, category });

    return {
      success: true,
      data: validation.data,
    };
  } catch (error) {
    return handleActionError(error, ErrorType.DATABASE_ERROR, { category, limit, offset });
  }
}

/**
 * 모든 뉴스를 조회하는 Server Action (페이지네이션 지원)
 */
export async function getAllNewsAction(limit: number = 30, offset: number = 0): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    const data = await newsDB.getAllNews(limit, offset);
    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleActionError(error, ErrorType.DATABASE_ERROR, { limit, offset });
  }
}

/**
 * 카테고리별로 뉴스를 페이지네이션으로 조회하는 Server Action
 */
export async function getNewsByCategoryPaginatedAction(
  category: NewsCategory,
  page: number = 1,
  pageSize: number = 12
): Promise<{ success: boolean; data: News[] | null; error?: string; hasMore: boolean }> {
  try {
    const offset = (page - 1) * pageSize;
    const limit = pageSize + 1; // 한 개 더 가져와서 hasMore 판단

    log.debug("getNewsByCategoryPaginatedAction 시작", { category, page, pageSize });
    const data = await newsDB.getNewsByCategory(category, limit, offset);

    const validation = validateNewsData(data);
    if (!validation.isValid) {
      log.warn("getNewsByCategoryPaginatedAction 유효하지 않은 데이터 반환", { category });
      return {
        success: false,
        data: null,
        hasMore: false,
        error: validation.error,
      };
    }

    // 한 개 더 가져왔으므로 hasMore 판단
    const hasMore = validation.data.length > pageSize;
    const newsData = hasMore ? validation.data.slice(0, pageSize) : validation.data;

    log.debug("getNewsByCategoryPaginatedAction 성공", { count: newsData.length, category, hasMore });

    return {
      success: true,
      data: newsData,
      hasMore,
    };
  } catch (error) {
    const errorResult = handleActionError(error, ErrorType.DATABASE_ERROR, { category, page, pageSize });
    return {
      ...errorResult,
      hasMore: false,
    };
  }
}

/**
 * news_category(주제 카테고리)별로 뉴스를 페이지네이션으로 조회하는 Server Action
 */
export async function getNewsByTopicCategoryPaginatedAction(
  newsCategory: string,
  page: number = 1,
  pageSize: number = 12
): Promise<{ success: boolean; data: News[] | null; error?: string; hasMore: boolean }> {
  try {
    const offset = (page - 1) * pageSize;
    const limit = pageSize + 1; // 한 개 더 가져와서 hasMore 판단

    log.debug("getNewsByTopicCategoryPaginatedAction 시작", { newsCategory, page, pageSize });
    const data = await newsDB.getNewsByTopicCategory(newsCategory, limit, offset);

    const validation = validateNewsData(data);
    if (!validation.isValid) {
      log.warn("getNewsByTopicCategoryPaginatedAction 유효하지 않은 데이터 반환", { newsCategory });
      return {
        success: false,
        data: null,
        hasMore: false,
        error: validation.error,
      };
    }

    // 한 개 더 가져왔으므로 hasMore 판단
    const hasMore = validation.data.length > pageSize;
    const newsData = hasMore ? validation.data.slice(0, pageSize) : validation.data;

    log.debug("getNewsByTopicCategoryPaginatedAction 성공", { count: newsData.length, newsCategory, hasMore });

    return {
      success: true,
      data: newsData,
      hasMore,
    };
  } catch (error) {
    const errorResult = handleActionError(error, ErrorType.DATABASE_ERROR, { newsCategory, page, pageSize });
    return {
      ...errorResult,
      hasMore: false,
    };
  }
}

/**
 * 검색어로 뉴스를 조회하는 Server Action
 */
export async function searchNewsAction(
  query: string,
  searchType: "title" | "content" | "all" = "all",
  limit: number = 100
): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    const data = await newsDB.searchNews(query, searchType, limit);
    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleActionError(error, ErrorType.DATABASE_ERROR, { query, searchType, limit });
  }
}

/**
 * 번역 실패한 뉴스를 재번역하는 Server Action
 * @param limit 재번역할 최대 뉴스 개수 (기본값: 50, 최대: 100)
 */
export async function retryFailedTranslationsAction(limit: number = 50) {
  try {
    const result = await retryFailedTranslations(Math.min(limit, 100));

    return {
      success: true,
      message: `${result.total}개의 뉴스 중 ${result.success}개가 성공적으로 재번역되었습니다.`,
      data: result,
    };
  } catch (error) {
    const errorResult = handleActionError(error, ErrorType.API_ERROR, { limit });
    return {
      ...errorResult,
      message: errorResult.error,
    };
  }
}

// 관리자용 액션들은 관리자 API를 직접 사용하도록 변경됨
// 사용자 관리 기능은 사용자 인증 시스템 제거로 인해 제거됨
