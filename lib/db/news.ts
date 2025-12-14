import type { News, NewsInput, NewsCategory } from "@/types/news";
import * as supabaseNews from "./supabase-news";

/**
 * 뉴스를 데이터베이스에 저장
 */
export async function insertNews(news: NewsInput): Promise<{ success: boolean; error?: string }> {
  return await supabaseNews.insertNews(news);
}

/**
 * 여러 뉴스를 배치로 저장
 */
export async function insertNewsBatch(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  return await supabaseNews.insertNewsBatch(newsItems);
}

/**
 * 카테고리별로 뉴스 조회
 */
export async function getNewsByCategory(category: NewsCategory, limit: number = 10, offset: number = 0): Promise<News[]> {
  return await supabaseNews.getNewsByCategory(category, limit, offset);
}

/**
 * 모든 뉴스 조회
 */
export async function getAllNews(limit: number = 30): Promise<News[]> {
  return await supabaseNews.getAllNews(limit);
}

/**
 * 검색어로 뉴스 조회
 * @param query 검색어
 * @param searchType 검색 타입: 'title' | 'content' | 'all'
 * @param limit 결과 제한
 */
export async function searchNews(query: string, searchType: "title" | "content" | "all" = "all", limit: number = 100): Promise<News[]> {
  return await supabaseNews.searchNews(query, searchType, limit);
}

/**
 * 뉴스 개수 조회
 */
export async function getNewsCount(category?: NewsCategory): Promise<number> {
  return await supabaseNews.getNewsCount(category);
}

/**
 * ID로 뉴스 조회
 */
export async function getNewsById(id: string): Promise<News | null> {
  return await supabaseNews.getNewsById(id);
}

/**
 * ID로 뉴스 삭제
 */
export async function deleteNews(id: string): Promise<boolean> {
  return await supabaseNews.deleteNews(id);
}

/**
 * 관련 뉴스 조회 (같은 카테고리, 현재 뉴스 제외)
 */
export async function getRelatedNews(currentNewsId: string, category: NewsCategory, limit: number = 5): Promise<News[]> {
  return await supabaseNews.getRelatedNews(currentNewsId, category, limit);
}
