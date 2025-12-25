import { supabaseServer } from "../supabase/server";
import type { News, NewsInput, NewsCategory } from "@/types/news";
import { log } from "../utils/logger";
import type { NewsRow } from "../types/supabase";

/**
 * original_link로 중복 뉴스 확인
 */
async function checkDuplicateNews(originalLink: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer.from("news").select("id").eq("original_link", originalLink).limit(1);

    if (error) {
      log.error("Error checking duplicate news", error instanceof Error ? error : new Error(String(error)));
      return false; // 에러 발생 시 중복이 아닌 것으로 간주하고 진행
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    log.error("Error checking duplicate news", error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * 뉴스를 Supabase 데이터베이스에 저장
 */
export async function insertNews(news: NewsInput): Promise<{ success: boolean; error?: string }> {
  try {
    // 중복 체크
    const isDuplicate = await checkDuplicateNews(news.original_link);
    if (isDuplicate) {
      log.info("중복 뉴스 건너뜀", { originalLink: news.original_link });
      return {
        success: false,
        error: "이미 존재하는 뉴스입니다.",
      };
    }

    const { error } = await supabaseServer.from("news").insert({
      published_date: news.published_date,
      source_country: news.source_country,
      source_media: news.source_media,
      title: news.title,
      content: news.content,
      content_translated: news.content_translated || null,
      category: news.category,
      news_category: news.news_category || null,
      original_link: news.original_link,
    });

    if (error) {
      // 유니크 제약 조건 위반인 경우 중복으로 처리
      if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
        log.info("중복 뉴스 건너뜀 (DB 제약 조건)", { originalLink: news.original_link });
        return {
          success: false,
          error: "이미 존재하는 뉴스입니다.",
        };
      }

      log.error("Error inserting news", new Error(error.message), { errorCode: error.code, originalLink: news.original_link });
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    log.error("Error inserting news", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 여러 뉴스를 배치로 Supabase에 저장
 * 성능 개선: 병렬 처리로 저장 시간 단축 (최대 10개씩 동시 처리)
 */
export async function insertNewsBatch(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  // 배치 크기: 한 번에 처리할 뉴스 개수
  const BATCH_SIZE = 10;

  // 배치 단위로 처리
  for (let i = 0; i < newsItems.length; i += BATCH_SIZE) {
    const batch = newsItems.slice(i, i + BATCH_SIZE);

    // 병렬 처리로 배치 저장
    const results = await Promise.allSettled(batch.map((news) => insertNews(news)));

    // 결과 집계
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        successCount++;
      } else {
        failedCount++;
        if (result.status === "rejected") {
          log.error("뉴스 저장 중 오류", result.reason instanceof Error ? result.reason : new Error(String(result.reason)));
        } else if (result.status === "fulfilled" && !result.value.success) {
          // 중복 뉴스는 실패로 카운트하지 않음 (정상 동작)
          if (result.value.error && !result.value.error.includes("이미 존재")) {
            log.warn("뉴스 저장 실패", { error: result.value.error });
          }
        }
      }
    }

    // 진행 상황 로깅
    if ((i + BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= newsItems.length) {
      log.info("뉴스 저장 진행 중", {
        processed: Math.min(i + BATCH_SIZE, newsItems.length),
        total: newsItems.length,
      });
    }
  }

  return { success: successCount, failed: failedCount };
}

/**
 * 카테고리별로 뉴스 조회
 */
export async function getNewsByCategory(category: NewsCategory, limit: number = 10, offset: number = 0): Promise<News[]> {
  try {
    log.debug("getNewsByCategory 호출", { category, limit, offset });

    const { data, error } = await supabaseServer
      .from("news")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("getNewsByCategory Supabase 에러 발생", new Error(error.message), {
        details: error.details,
        hint: error.hint,
        code: error.code,
        category,
        limit,
      });
      return [];
    }

    if (!data) {
      log.warn("getNewsByCategory 데이터가 null", { category });
      return [];
    }

    log.debug("getNewsByCategory 성공", { count: data.length, category });

    // 데이터 타입 변환 및 검증
    const newsItems: News[] = data.map((item: NewsRow) => ({
      id: String(item.id || ""),
      published_date: item.published_date || "",
      source_country: item.source_country || "",
      source_media: item.source_media || "",
      title: item.title || "",
      content: item.content || "",
      content_translated: item.content_translated || null,
      category: item.category as NewsCategory,
      news_category: item.news_category || null,
      original_link: item.original_link || "",
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    }));

    return newsItems;
  } catch (error) {
    log.error("getNewsByCategory 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      category,
      limit,
    });
    return [];
  }
}

/**
 * 모든 뉴스 조회 (페이지네이션 지원)
 */
export async function getAllNews(limit: number = 30, offset: number = 0): Promise<News[]> {
  try {
    log.debug("getAllNews 호출", { limit, offset });

    const { data, error } = await supabaseServer
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error("getAllNews Supabase 에러 발생", new Error(error.message), {
        details: error.details,
        hint: error.hint,
        code: error.code,
        limit,
      });
      return [];
    }

    if (!data) {
      log.warn("getAllNews 데이터가 null");
      return [];
    }

    log.debug("getAllNews 성공", { count: data.length });

    // 데이터 타입 변환 및 검증
    const newsItems: News[] = data.map((item: NewsRow) => ({
      id: String(item.id || ""),
      published_date: item.published_date || "",
      source_country: item.source_country || "",
      source_media: item.source_media || "",
      title: item.title || "",
      content: item.content || "",
      content_translated: item.content_translated || null,
      category: item.category as NewsCategory,
      news_category: item.news_category || null,
      original_link: item.original_link || "",
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    }));

    return newsItems;
  } catch (error) {
    log.error("getAllNews 예외 발생", error instanceof Error ? error : new Error(String(error)), { limit });
    return [];
  }
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
      const { data, error } = await supabaseServer
        .from("news")
        .select("*")
        .ilike("title", searchTerm)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        log.error("searchNews Supabase 에러 발생 (title)", new Error(error.message), {
          details: error.details,
          hint: error.hint,
          code: error.code,
          query,
          searchType,
        });
        return [];
      }

      if (!data) {
        return [];
      }

      return data.map((item: NewsRow) => ({
        id: String(item.id || ""),
        published_date: item.published_date || "",
        source_country: item.source_country || "",
        source_media: item.source_media || "",
        title: item.title || "",
        content: item.content || "",
        content_translated: item.content_translated || null,
        category: item.category as NewsCategory,
        news_category: item.news_category || null,
        original_link: item.original_link || "",
        created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      }));
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
        log.error("searchNews Supabase 에러 발생 (content)", new Error(error.message), {
          details: error.details,
          hint: error.hint,
          code: error.code,
          query,
          searchType,
        });
        return [];
      }

      if (!data) {
        return [];
      }

      return data.map((item: NewsRow) => ({
        id: String(item.id || ""),
        published_date: item.published_date || "",
        source_country: item.source_country || "",
        source_media: item.source_media || "",
        title: item.title || "",
        content: item.content || "",
        content_translated: item.content_translated || null,
        category: item.category as NewsCategory,
        news_category: item.news_category || null,
        original_link: item.original_link || "",
        created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      }));
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
        log.error("searchNews Supabase 에러 발생 (all)", new Error(error.message), {
          details: error.details,
          hint: error.hint,
          code: error.code,
          query,
          searchType,
        });
        return [];
      }

      if (!data) {
        return [];
      }

      return data.map((item: NewsRow) => ({
        id: String(item.id || ""),
        published_date: item.published_date || "",
        source_country: item.source_country || "",
        source_media: item.source_media || "",
        title: item.title || "",
        content: item.content || "",
        content_translated: item.content_translated || null,
        category: item.category as NewsCategory,
        news_category: item.news_category || null,
        original_link: item.original_link || "",
        created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      }));
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
    log.error("Error getting news count", error instanceof Error ? error : new Error(String(error)), { category });
    return 0;
  }

  return count || 0;
}

/**
 * ID로 뉴스 단건 조회
 */
export async function getNewsById(id: string): Promise<News | null> {
  try {
    const { data, error } = await supabaseServer.from("news").select("*").eq("id", id).single();

    if (error) {
      log.error("getNewsById Supabase 에러 발생", new Error(error.message), {
        details: error.details,
        hint: error.hint,
        code: error.code,
        id,
      });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: String(data.id),
      published_date: data.published_date || "",
      source_country: data.source_country || "",
      source_media: data.source_media || "",
      title: data.title || "",
      content: data.content || "",
      content_translated: data.content_translated || null,
      category: data.category as NewsCategory,
      news_category: data.news_category || null,
      original_link: data.original_link || "",
      created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    log.error("getNewsById 예외 발생", error instanceof Error ? error : new Error(String(error)), { id });
    return null;
  }
}

/**
 * ID로 뉴스 삭제
 */
export async function deleteNews(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from("news").delete().eq("id", id);

    if (error) {
      log.error("deleteNews Supabase 에러 발생", new Error(error.message), { id, errorCode: error.code });
      return false;
    }

    return true;
  } catch (error) {
    log.error("deleteNews 예외 발생", error instanceof Error ? error : new Error(String(error)), { id });
    return false;
  }
}

/**
 * 관련 뉴스 조회 (같은 카테고리, 현재 뉴스 제외)
 */
export async function getRelatedNews(currentNewsId: string, category: NewsCategory, limit: number = 5): Promise<News[]> {
  try {
    const { data, error } = await supabaseServer
      .from("news")
      .select("*")
      .eq("category", category)
      .neq("id", currentNewsId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("getRelatedNews Supabase 에러 발생", new Error(error.message), {
        currentNewsId,
        category,
        limit,
        errorCode: error.code,
      });
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item: NewsRow) => ({
      id: String(item.id || ""),
      published_date: item.published_date || "",
      source_country: item.source_country || "",
      source_media: item.source_media || "",
      title: item.title || "",
      content: item.content || "",
      content_translated: item.content_translated || null,
      category: item.category as NewsCategory,
      news_category: item.news_category || null,
      original_link: item.original_link || "",
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    log.error("getRelatedNews 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      currentNewsId,
      category,
      limit,
    });
    return [];
  }
}
