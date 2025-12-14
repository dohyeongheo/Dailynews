import { supabaseServer } from "../supabase/server";

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
      console.error("Error getting user news reaction:", error);
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    console.error("Error getting user news reaction:", error);
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
      const { error } = await (supabaseServer.from("news_reactions") as any).delete().eq("news_id", newsId).eq("user_id", userId);

      if (error) {
        console.error("Error removing news reaction:", error);
        return false;
      }
      return true;
    }

    // 반응 추가/업데이트
    const { error } = await (supabaseServer.from("news_reactions") as any)
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
      console.error("Error setting news reaction:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error setting news reaction:", error);
    return false;
  }
}

/**
 * 뉴스의 좋아요/싫어요 개수 조회
 */
export async function getNewsReactionCounts(newsId: string): Promise<{ likes: number; dislikes: number }> {
  try {
    const { data, error } = await (supabaseServer.from("news_reactions") as any).select("reaction_type").eq("news_id", newsId);

    if (error) {
      console.error("Error getting news reaction counts:", error);
      return { likes: 0, dislikes: 0 };
    }

    const likes = data?.filter((r: any) => r.reaction_type === "like").length || 0;
    const dislikes = data?.filter((r: any) => r.reaction_type === "dislike").length || 0;

    return { likes, dislikes };
  } catch (error) {
    console.error("Error getting news reaction counts:", error);
    return { likes: 0, dislikes: 0 };
  }
}
