import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";

/**
 * 모든 댓글 조회 (관리자 전용)
 */
export const GET = withAdmin(
  withErrorHandling(async (request) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id (id, name, email),
        news:news_id (id, title)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100); // 최대 100개

    if (error) {
      log.error("Get all comments error", new Error(error.message), { errorCode: error.code });
      return createErrorResponse(new Error(error.message), 500);
    }

    return createSuccessResponse({ comments: data || [] });
  })
);
