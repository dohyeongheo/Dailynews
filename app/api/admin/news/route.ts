import { NextRequest, NextResponse } from "next/server";
import { insertNews } from "@/lib/db/news";
import { z } from "zod";
import { log } from "@/lib/utils/logger";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { BadRequestError } from "@/lib/errors";

const newsSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  // content_translated 컬럼은 더 이상 사용하지 않음 (번역된 내용은 content에 직접 저장)
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]),
  news_category: z.enum(["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"]).nullable().optional(),
  source_country: z.string().optional(),
  source_media: z.string().optional(),
  published_date: z.string(),
});

/**
 * 뉴스 생성
 */
export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    const body = await request.json();
    const validatedData = newsSchema.parse(body);

    const result = await insertNews({
      title: validatedData.title,
      content: validatedData.content,
      content_translated: null, // content_translated 컬럼은 더 이상 사용하지 않음
      category: validatedData.category,
      news_category: validatedData.news_category || null,
      published_date: validatedData.published_date,
      source_country: validatedData.source_country || "",
      source_media: validatedData.source_media || "",
    });

    if (result.success) {
      return createSuccessResponse({ success: true }, "뉴스가 생성되었습니다.");
    } else {
      return createErrorResponse(new BadRequestError(result.error || "뉴스 생성에 실패했습니다."), 400);
    }
  })
);
