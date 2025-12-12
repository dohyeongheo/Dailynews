import { supabaseServer } from "../supabase/server";
import type { News, NewsInput, NewsCategory } from "@/types/news";

/**
 * 뉴스를 Supabase 데이터베이스에 저장
 */
export async function insertNews(news: NewsInput): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseServer.from("news").insert({
      published_date: news.published_date,
      source_country: news.source_country,
      source_media: news.source_media,
      title: news.title,
      content: news.content,
      content_translated: news.content_translated || null,
      category: news.category,
      original_link: news.original_link,
    });

    if (error) {
      console.error("Error inserting news:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error inserting news:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 여러 뉴스를 배치로 Supabase에 저장
 */
export async function insertNewsBatch(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  for (const news of newsItems) {
    const result = await insertNews(news);
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

/**
 * 카테고리별로 뉴스 조회
 */
export async function getNewsByCategory(category: NewsCategory, limit: number = 10): Promise<News[]> {
  const { data, error } = await supabaseServer.from("news").select("*").eq("category", category).order("created_at", { ascending: false }).limit(limit);

  if (error) {
    console.error("Error fetching news by category:", error);
    return [];
  }

  return (data || []) as News[];
}

/**
 * 모든 뉴스 조회
 */
export async function getAllNews(limit: number = 30): Promise<News[]> {
  const { data, error } = await supabaseServer.from("news").select("*").order("created_at", { ascending: false }).limit(limit);

  if (error) {
    console.error("Error fetching all news:", error);
    return [];
  }

  return (data || []) as News[];
}

/**
 * 검색어로 뉴스 조회
 * @param query 검색어
 * @param searchType 검색 타입: 'title' | 'content' | 'all'
 * @param limit 결과 제한
 */
export async function searchNews(query: string, searchType: "title" | "content" | "all" = "all", limit: number = 100): Promise<News[]> {
  const searchTerm = `%${query}%`;

  switch (searchType) {
    case "title": {
      const { data, error } = await supabaseServer.from("news").select("*").ilike("title", searchTerm).order("created_at", { ascending: false }).limit(limit);

      if (error) {
        console.error("Error searching news:", error);
        return [];
      }
      return (data || []) as News[];
    }

    case "content": {
      // content 또는 content_translated에서 검색
      const { data, error } = await supabaseServer
        .from("news")
        .select("*")
        .or(`content.ilike.${searchTerm},content_translated.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error searching news:", error);
        return [];
      }
      return (data || []) as News[];
    }

    case "all":
    default: {
      // title, content, content_translated에서 검색
      const { data, error } = await supabaseServer
        .from("news")
        .select("*")
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},content_translated.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error searching news:", error);
        return [];
      }
      return (data || []) as News[];
    }
  }
}

/**
 * 뉴스 개수 조회
 */
export async function getNewsCount(category?: NewsCategory): Promise<number> {
  let queryBuilder = supabaseServer.from("news").select("*", { count: "exact", head: true });

  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  const { count, error } = await queryBuilder;

  if (error) {
    console.error("Error getting news count:", error);
    return 0;
  }

  return count || 0;
}
