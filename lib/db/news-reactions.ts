import { supabaseServer } from "../supabase/server";

export interface NewsReaction {
  id: string;
  news_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string;
}

/**
 * 뉴스에 대한 사용자의 반응 조회 (회원)
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
 * 뉴스에 대한 비회원의 반응 조회 (IP 기반)
 */
export async function getUserNewsReactionByIp(newsId: string, guestIp: string): Promise<"like" | "dislike" | null> {
  try {
    const { data, error } = await (supabaseServer.from("news_reactions") as any)
      .select("reaction_type")
      .eq("news_id", newsId)
      .eq("guest_ip", guestIp)
      .is("user_id", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error getting guest news reaction:", error);
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    console.error("Error getting guest news reaction:", error);
    return null;
  }
}

/**
 * 뉴스 반응 추가/업데이트
 */
export async function setNewsReaction(
  newsId: string,
  userId: string | null,
  reactionType: "like" | "dislike",
  guestIp?: string | null
): Promise<boolean> {
  try {
    // 기존 반응 확인
    let existing: "like" | "dislike" | null = null;
    if (userId) {
      existing = await getUserNewsReaction(newsId, userId);
    } else if (guestIp) {
      existing = await getUserNewsReactionByIp(newsId, guestIp);
    }

    if (existing === reactionType) {
      // 같은 반응이면 삭제 (토글)
      let deleteQuery = (supabaseServer.from("news_reactions") as any).delete().eq("news_id", newsId);
      if (userId) {
        deleteQuery = deleteQuery.eq("user_id", userId);
      } else if (guestIp) {
        deleteQuery = deleteQuery.eq("guest_ip", guestIp).is("user_id", null);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error("Error removing news reaction:", error);
        return false;
      }
      return true;
    }

    // 반응 추가/업데이트
    const insertData: {
      news_id: string;
      user_id: string | null;
      guest_ip?: string | null;
      reaction_type: "like" | "dislike";
    } = {
      news_id: newsId,
      user_id: userId,
      reaction_type: reactionType,
    };

    if (!userId && guestIp) {
      insertData.guest_ip = guestIp;
    }

    // upsert 실행
    let upsertQuery = (supabaseServer.from("news_reactions") as any).upsert(insertData);
    
    // conflict 해결: user_id가 있으면 news_id, user_id로, 없으면 news_id, guest_ip로
    if (userId) {
      upsertQuery = upsertQuery.onConflict("news_id,user_id");
    } else if (guestIp) {
      // guest_ip는 인덱스로 처리되므로 직접 처리
      // 먼저 기존 항목 삭제 후 삽입
      await (supabaseServer.from("news_reactions") as any)
        .delete()
        .eq("news_id", newsId)
        .eq("guest_ip", guestIp)
        .is("user_id", null);
      
      const { error: insertError } = await (supabaseServer.from("news_reactions") as any)
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("Error setting news reaction:", insertError);
        return false;
      }
      return true;
    }

    const { error } = await upsertQuery.select().single();

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
