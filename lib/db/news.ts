import type { News, NewsInput, NewsCategory } from "@/types/news";
import * as supabaseNews from "./supabase-news";
import { getCache, setCache, deleteCache, invalidateNewsCache, invalidateCategoryCache, CACHE_NAMESPACES } from "@/lib/utils/cache";

/**
 * 뉴스를 데이터베이스에 저장
 */
export async function insertNews(news: NewsInput): Promise<{ success: boolean; error?: string; id?: string | null }> {
  return await supabaseNews.insertNews(news);
}

/**
 * 여러 뉴스를 배치로 저장
 */
export async function insertNewsBatch(newsItems: NewsInput[]): Promise<{ success: number; failed: number; savedNewsIds: string[] }> {
  const result = await supabaseNews.insertNewsBatch(newsItems);

  // 뉴스 추가 시 관련 캐시 무효화
  if (result.success > 0) {
    await invalidateNewsCache(); // 모든 뉴스 캐시 무효화
  }

  return result;
}

/**
 * 카테고리별로 뉴스 조회 (캐싱 적용)
 */
export async function getNewsByCategory(category: NewsCategory, limit: number = 10, offset: number = 0): Promise<News[]> {
  const cacheKey = `${category}:${limit}:${offset}`;

  // 캐시에서 조회
  const cached = await getCache<News[]>(CACHE_NAMESPACES.NEWS_CATEGORY, cacheKey);
  if (cached) {
    return cached;
  }

  // 캐시 미스 시 DB에서 조회
  const news = await supabaseNews.getNewsByCategory(category, limit, offset);

  // 캐시에 저장 (TTL: 60초)
  await setCache(CACHE_NAMESPACES.NEWS_CATEGORY, cacheKey, news, 60);

  return news;
}

/**
 * news_category(주제 카테고리)별로 뉴스 조회 (캐싱 적용)
 */
export async function getNewsByTopicCategory(
  newsCategory: string,
  limit: number = 10,
  offset: number = 0
): Promise<News[]> {
  const cacheKey = `topic:${newsCategory}:${limit}:${offset}`;

  // 캐시에서 조회
  const cached = await getCache<News[]>(CACHE_NAMESPACES.NEWS_CATEGORY, cacheKey);
  if (cached) {
    return cached;
  }

  // 캐시 미스 시 DB에서 조회
  const news = await supabaseNews.getNewsByTopicCategory(newsCategory, limit, offset);

  // 캐시에 저장 (TTL: 60초)
  await setCache(CACHE_NAMESPACES.NEWS_CATEGORY, cacheKey, news, 60);

  return news;
}

/**
 * 모든 뉴스 조회 (페이지네이션 지원)
 */
export async function getAllNews(limit: number = 30, offset: number = 0): Promise<News[]> {
  return await supabaseNews.getAllNews(limit, offset);
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
 * ID로 뉴스 조회 (캐싱 적용)
 */
export async function getNewsById(id: string): Promise<News | null> {
  // 캐시에서 조회
  const cached = await getCache<News>(CACHE_NAMESPACES.NEWS_ID, id);
  if (cached) {
    return cached;
  }

  // 캐시 미스 시 DB에서 조회
  const news = await supabaseNews.getNewsById(id);

  // 캐시에 저장 (TTL: 300초 = 5분)
  if (news) {
    await setCache(CACHE_NAMESPACES.NEWS_ID, id, news, 300);
  }

  return news;
}

/**
 * ID로 뉴스 삭제 (캐시 무효화 포함)
 */
export async function deleteNews(id: string): Promise<boolean> {
  const result = await supabaseNews.deleteNews(id);

  // 삭제 성공 시 관련 캐시 무효화
  if (result) {
    await invalidateNewsCache(id);
  }

  return result;
}

/**
 * 뉴스의 image_url 업데이트
 */
export async function updateNewsImageUrl(newsId: string, imageUrl: string): Promise<boolean> {
  const result = await supabaseNews.updateNewsImageUrl(newsId, imageUrl);

  // 업데이트 성공 시 관련 캐시 무효화
  if (result) {
    await invalidateNewsCache(newsId);
  }

  return result;
}

/**
 * 관련 뉴스 조회 (같은 카테고리, 현재 뉴스 제외, 캐싱 적용)
 */
export async function getRelatedNews(currentNewsId: string, category: NewsCategory, limit: number = 5): Promise<News[]> {
  const cacheKey = `${currentNewsId}:${category}:${limit}`;

  // 캐시에서 조회
  const cached = await getCache<News[]>(CACHE_NAMESPACES.NEWS_RELATED, cacheKey);
  if (cached) {
    return cached;
  }

  // 캐시 미스 시 DB에서 조회
  const news = await supabaseNews.getRelatedNews(currentNewsId, category, limit);

  // 캐시에 저장 (TTL: 300초 = 5분)
  await setCache(CACHE_NAMESPACES.NEWS_RELATED, cacheKey, news, 300);

  return news;
}

/**
 * 번역 실패한 뉴스 조회
 */
export async function getNewsWithFailedTranslation(limit: number = 100): Promise<News[]> {
  return await supabaseNews.getNewsWithFailedTranslation(limit);
}

