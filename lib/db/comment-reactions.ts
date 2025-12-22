import { supabaseServer } from "../supabase/server";

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string;
}

/**
 * 댓글에 대한 사용자의 반응 조회 (회원)
 */
export async function getUserCommentReaction(commentId: string, userId: string): Promise<"like" | "dislike" | null> {
  try {
    const { data, error } = await (supabaseServer.from("comment_reactions") as any)
      .select("reaction_type")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러로 정상적인 경우
      console.error("Error getting user comment reaction:", error);
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    console.error("Error getting user comment reaction:", error);
    return null;
  }
}

/**
 * 댓글에 대한 비회원의 반응 조회 (IP 기반)
 */
export async function getUserCommentReactionByIp(commentId: string, guestIp: string): Promise<"like" | "dislike" | null> {
  try {
    const { data, error } = await (supabaseServer.from("comment_reactions") as any)
      .select("reaction_type")
      .eq("comment_id", commentId)
      .eq("guest_ip", guestIp)
      .is("user_id", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error getting guest comment reaction:", error);
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    console.error("Error getting guest comment reaction:", error);
    return null;
  }
}

/**
 * 댓글 반응 추가/업데이트
 */
export async function setCommentReaction(
  commentId: string,
  userId: string | null,
  reactionType: "like" | "dislike",
  guestIp?: string | null
): Promise<boolean> {
  try {
    // 기존 반응 확인
    let existing: "like" | "dislike" | null = null;
    if (userId) {
      existing = await getUserCommentReaction(commentId, userId);
    } else if (guestIp) {
      existing = await getUserCommentReactionByIp(commentId, guestIp);
    }

    if (existing === reactionType) {
      // 같은 반응이면 삭제 (토글)
      let deleteQuery = (supabaseServer.from("comment_reactions") as any).delete().eq("comment_id", commentId);
      if (userId) {
        deleteQuery = deleteQuery.eq("user_id", userId);
      } else if (guestIp) {
        deleteQuery = deleteQuery.eq("guest_ip", guestIp).is("user_id", null);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error("Error removing comment reaction:", error);
        return false;
      }
      return true;
    }

    // 반응 추가/업데이트
    const insertData: {
      comment_id: string;
      user_id: string | null;
      guest_ip?: string | null;
      reaction_type: "like" | "dislike";
    } = {
      comment_id: commentId,
      user_id: userId,
      reaction_type: reactionType,
    };

    if (!userId && guestIp) {
      insertData.guest_ip = guestIp;
    }

    // upsert 실행
    if (userId) {
      const { error } = await (supabaseServer.from("comment_reactions") as any)
        .upsert(insertData, { onConflict: "comment_id,user_id" })
        .select()
        .single();

      if (error) {
        console.error("Error setting comment reaction:", error);
        return false;
      }
    } else if (guestIp) {
      // guest_ip는 인덱스로 처리되므로 직접 처리
      // 먼저 기존 항목 삭제 후 삽입
      await (supabaseServer.from("comment_reactions") as any)
        .delete()
        .eq("comment_id", commentId)
        .eq("guest_ip", guestIp)
        .is("user_id", null);

      const { error: insertError } = await (supabaseServer.from("comment_reactions") as any)
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("Error setting comment reaction:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error setting comment reaction:", error);
    return false;
  }
}

/**
 * 댓글의 좋아요/싫어요 개수 조회
 */
export async function getCommentReactionCounts(commentId: string): Promise<{ likes: number; dislikes: number }> {
  try {
    const { data, error } = await (supabaseServer.from("comment_reactions") as any).select("reaction_type").eq("comment_id", commentId);

    if (error) {
      console.error("Error getting comment reaction counts:", error);
      return { likes: 0, dislikes: 0 };
    }

    const likes = data?.filter((r: any) => r.reaction_type === "like").length || 0;
    const dislikes = data?.filter((r: any) => r.reaction_type === "dislike").length || 0;

    return { likes, dislikes };
  } catch (error) {
    console.error("Error getting comment reaction counts:", error);
    return { likes: 0, dislikes: 0 };
  }
}

/**
 * 여러 댓글의 반응 개수 일괄 조회
 */
export async function getCommentReactionCountsBatch(commentIds: string[]): Promise<Record<string, { likes: number; dislikes: number }>> {
  try {
    if (commentIds.length === 0) {
      return {};
    }

    const { data, error } = await (supabaseServer.from("comment_reactions") as any).select("comment_id, reaction_type").in("comment_id", commentIds);

    if (error) {
      console.error("Error getting comment reaction counts batch:", error);
      return {};
    }

    const result: Record<string, { likes: number; dislikes: number }> = {};

    // 초기화
    commentIds.forEach((id) => {
      result[id] = { likes: 0, dislikes: 0 };
    });

    // 개수 집계
    data?.forEach((r: any) => {
      if (!result[r.comment_id]) {
        result[r.comment_id] = { likes: 0, dislikes: 0 };
      }
      if (r.reaction_type === "like") {
        result[r.comment_id].likes++;
      } else if (r.reaction_type === "dislike") {
        result[r.comment_id].dislikes++;
      }
    });

    return result;
  } catch (error) {
    console.error("Error getting comment reaction counts batch:", error);
    return {};
  }
}
