"use server";

import { fetchAndSaveNews } from "./news-fetcher";
import * as newsDB from "./db/news";
import type { News, NewsCategory } from "@/types/news";
import { toAppError, getErrorMessage, ErrorType } from "./errors";

/**
 * 뉴스를 수집하고 데이터베이스에 저장하는 Server Action
 */
export async function fetchAndSaveNewsAction(date?: string) {
  try {
    const result = await fetchAndSaveNews(date);

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
    console.error("Error in fetchAndSaveNewsAction:", error);
    const appError = toAppError(error, ErrorType.API_ERROR);
    const errorMessage = getErrorMessage(appError);
    return {
      success: false,
      message: errorMessage,
      data: null,
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
    console.log(`[getNewsByCategoryAction] 시작 - 카테고리: ${category}, 제한: ${limit}, 오프셋: ${offset}`);
    const data = await newsDB.getNewsByCategory(category, limit, offset);

    if (!data || !Array.isArray(data)) {
      console.warn(`[getNewsByCategoryAction] 유효하지 않은 데이터 반환 - 카테고리: ${category}`);
      return {
        success: false,
        data: null,
        error: "뉴스 데이터 형식이 올바르지 않습니다.",
      };
    }

    console.log(`[getNewsByCategoryAction] 성공 - ${data.length}개의 뉴스 조회됨. 카테고리: ${category}`);

    return {
      success: true,
      data,
    };
  } catch (error) {
    const appError = toAppError(error, ErrorType.DATABASE_ERROR);
    const errorMessage = getErrorMessage(appError);
    console.error("[getNewsByCategoryAction] 에러 발생:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      category,
      limit,
    });
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

/**
 * 모든 뉴스를 조회하는 Server Action
 */
export async function getAllNewsAction(limit: number = 30): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    const data = await newsDB.getAllNews(limit);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error in getAllNews:", error);
    const appError = toAppError(error, ErrorType.DATABASE_ERROR);
    const errorMessage = getErrorMessage(appError);
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
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

    console.log(`[getNewsByCategoryPaginatedAction] 시작 - 카테고리: ${category}, 페이지: ${page}, 페이지 크기: ${pageSize}`);
    const data = await newsDB.getNewsByCategory(category, limit, offset);

    if (!data || !Array.isArray(data)) {
      console.warn(`[getNewsByCategoryPaginatedAction] 유효하지 않은 데이터 반환 - 카테고리: ${category}`);
      return {
        success: false,
        data: null,
        hasMore: false,
        error: "뉴스 데이터 형식이 올바르지 않습니다.",
      };
    }

    // 한 개 더 가져왔으므로 hasMore 판단
    const hasMore = data.length > pageSize;
    const newsData = hasMore ? data.slice(0, pageSize) : data;

    console.log(`[getNewsByCategoryPaginatedAction] 성공 - ${newsData.length}개의 뉴스 조회됨. 카테고리: ${category}, 더 있음: ${hasMore}`);

    return {
      success: true,
      data: newsData,
      hasMore,
    };
  } catch (error) {
    const appError = toAppError(error, ErrorType.DATABASE_ERROR);
    const errorMessage = getErrorMessage(appError);
    console.error("[getNewsByCategoryPaginatedAction] 에러 발생:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      category,
      page,
      pageSize,
    });
    return {
      success: false,
      data: null,
      hasMore: false,
      error: errorMessage,
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
    console.error("Error in searchNews:", error);
    const appError = toAppError(error, ErrorType.DATABASE_ERROR);
    const errorMessage = getErrorMessage(appError);
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}
