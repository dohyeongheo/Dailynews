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
    return {
      success: true,
      message: `${result.total}개의 뉴스 중 ${result.success}개가 성공적으로 저장되었습니다.`,
      data: result,
    };
  } catch (error) {
    console.error('Error in fetchAndSaveNewsAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '뉴스 수집 중 오류가 발생했습니다.',
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
    const data = await newsDB.getNewsByCategory(category, limit);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error in getNewsByCategory:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '뉴스 조회 중 오류가 발생했습니다.',
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

