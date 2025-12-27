import { supabaseServer } from "../supabase/server";
import { log } from "../utils/logger";

export interface NewsReaction {
  id: string;
  news_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string;
}

/**
 * 뉴스에 대한 사용자의 반응 조회
 */
export async function getUserNewsReaction(newsId: string, userId: string): Promise<"like" | "dislike" | null> {
  try {
    const { data, error } = await (supabaseServer.from("news_reactions") as any).select("reaction_type").eq("news_id", newsId).eq("user_id", userId).single();

    if (error && error.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러로 정상적인 경우
      log.error("Error getting user news reaction", new Error(error.message), { newsId, userId, errorCode: error.code });
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    log.error("Error getting user news reaction", error instanceof Error ? error : new Error(String(error)), { newsId, userId });
    return null;
  }
}

/**
 * 뉴스 반응 추가/업데이트
 */
export async function setNewsReaction(newsId: string, userId: string, reactionType: "like" | "dislike"): Promise<boolean> {
  try {
    // 기존 반응 확인
    const existing = await getUserNewsReaction(newsId, userId);

    if (existing === reactionType) {
      // 같은 반응이면 삭제 (토글)
      const { error } = await supabaseServer
        .from("news_reactions")
        .delete()
        .eq("news_id", newsId)
        .eq("user_id", userId);

      if (error) {
        log.error("Error removing news reaction", new Error(error.message), { newsId, userId, errorCode: error.code });
        return false;
      }
      return true;
    }

    // 반응 추가/업데이트
    const { error } = await supabaseServer
      .from("news_reactions")
      .upsert(
        {
          news_id: newsId,
          user_id: userId,
          reaction_type: reactionType,
        },
        {
          onConflict: "news_id,user_id",
        }
      )
      .select()
      .single();

    if (error) {
      log.error("Error setting news reaction", new Error(error.message), { newsId, userId, reactionType, errorCode: error.code });
      return false;
    }

    return true;
  } catch (error) {
    log.error("Error setting news reaction", error instanceof Error ? error : new Error(String(error)), { newsId, userId, reactionType });
    return false;
  }
}

/**
 * 뉴스의 좋아요/싫어요 개수 조회
 */
export async function getNewsReactionCounts(newsId: string): Promise<{ likes: number; dislikes: number }> {
  try {
    const { data, error } = await supabaseServer
      .from("news_reactions")
      .select("reaction_type")
      .eq("news_id", newsId);

    if (error) {
      log.error("Error getting news reaction counts", new Error(error.message), { newsId, errorCode: error.code });
      return { likes: 0, dislikes: 0 };
    }

    if (!data) {
      return { likes: 0, dislikes: 0 };
    }

    const reactions = data as Array<{ reaction_type: "like" | "dislike" }>;
    const likes = reactions.filter((r) => r.reaction_type === "like").length;
    const dislikes = reactions.filter((r) => r.reaction_type === "dislike").length;

    return { likes, dislikes };
  } catch (error) {
    log.error("Error getting news reaction counts", error instanceof Error ? error : new Error(String(error)), { newsId });
    return { likes: 0, dislikes: 0 };
  }
}
