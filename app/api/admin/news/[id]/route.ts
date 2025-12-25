import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { log } from "@/lib/utils/logger";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { BadRequestError } from "@/lib/errors";

const updateNewsSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다.").optional(),
  content: z.string().min(1, "내용은 필수입니다.").optional(),
  content_translated: z.string().optional(),
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]).optional(),
  news_category: z.enum(["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"]).nullable().optional(),
  source_country: z.string().optional(),
  source_media: z.string().optional(),
  original_link: z.string().url().optional().or(z.literal("")),
  published_date: z.string().optional(),
});

/**
 * 뉴스 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(
    withErrorHandling(async (req: NextRequest) => {
      const body = await req.json();
      const validatedData = updateNewsSchema.parse(body);

      const supabase = createClient();
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (validatedData.title) updateData.title = validatedData.title;
      if (validatedData.content) updateData.content = validatedData.content;
      if (validatedData.content_translated !== undefined) {
        updateData.content_translated = validatedData.content_translated || null;
      }
      if (validatedData.category) updateData.category = validatedData.category;
      if (validatedData.news_category !== undefined) {
        updateData.news_category = validatedData.news_category || null;
      }
      if (validatedData.source_country !== undefined) {
        updateData.source_country = validatedData.source_country;
      }
      if (validatedData.source_media !== undefined) {
        updateData.source_media = validatedData.source_media;
      }
      if (validatedData.original_link !== undefined) {
        updateData.original_link = validatedData.original_link || "#";
      }
      if (validatedData.published_date) {
        updateData.published_date = validatedData.published_date;
      }

      const { error } = await supabase.from("news").update(updateData).eq("id", params.id);

      if (error) {
        log.error("Update news error", new Error(error.message), { id: params.id, errorCode: error.code });
        return createErrorResponse(new Error(error.message), 500);
      }

      return createSuccessResponse({ success: true }, "뉴스가 수정되었습니다.");
    })
  )(request);
}
