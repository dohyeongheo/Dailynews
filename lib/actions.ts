'use server';

import { fetchAndSaveNews } from './news-fetcher';
import * as newsDB from './db/news';
import type { News, NewsCategory } from '@/types/news';

/**
 * 뉴스를 수집하고 데이터베이스에 저장하는 Server Action
 */
export async function fetchAndSaveNewsAction(date?: string) {
  try {
    const result = await fetchAndSaveNews(date);

    // result가 유효한지 확인
    if (!result || typeof result !== 'object') {
      throw new Error('뉴스 수집 결과가 올바르지 않습니다.');
    }

    return {
      success: true,
      message: `${result.total || 0}개의 뉴스 중 ${result.success || 0}개가 성공적으로 저장되었습니다.`,
      data: result,
    };
  } catch (error) {
    console.error('Error in fetchAndSaveNewsAction:', error);
    const errorMessage = error instanceof Error ? error.message : '뉴스 수집 중 오류가 발생했습니다.';
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
  limit: number = 10
): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    console.log(`[getNewsByCategoryAction] 시작 - 카테고리: ${category}, 제한: ${limit}`);
    const data = await newsDB.getNewsByCategory(category, limit);
    
    if (!data || !Array.isArray(data)) {
      console.warn(`[getNewsByCategoryAction] 유효하지 않은 데이터 반환 - 카테고리: ${category}`);
      return {
        success: false,
        data: null,
        error: '뉴스 데이터 형식이 올바르지 않습니다.',
      };
    }

    console.log(`[getNewsByCategoryAction] 성공 - ${data.length}개의 뉴스 조회됨. 카테고리: ${category}`);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '뉴스 조회 중 오류가 발생했습니다.';
    console.error('[getNewsByCategoryAction] 에러 발생:', {
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
    console.error('Error in getAllNews:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '뉴스 조회 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 검색어로 뉴스를 조회하는 Server Action
 */
export async function searchNewsAction(
  query: string,
  searchType: 'title' | 'content' | 'all' = 'all',
  limit: number = 100
): Promise<{ success: boolean; data: News[] | null; error?: string }> {
  try {
    const data = await newsDB.searchNews(query, searchType, limit);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error in searchNews:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '뉴스 검색 중 오류가 발생했습니다.',
    };
  }
}

