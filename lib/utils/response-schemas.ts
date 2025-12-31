/**
 * API 응답 타입 검증을 위한 Zod 스키마
 */

import { z } from "zod";
import type { News, NewsCategory } from "@/types/news";

/**
 * News 스키마
 */
export const NewsSchema = z.object({
  id: z.string(),
  published_date: z.string(),
  source_country: z.string(),
  source_media: z.string(),
  title: z.string(),
  content: z.string(),
  content_translated: z.string().nullable(),
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]),
  news_category: z.enum(["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"]).nullable(),
  image_url: z.string().nullable(),
  created_at: z.string(),
});

/**
 * News 배열 응답 스키마
 */
export const NewsArrayResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(NewsSchema).nullable(),
  error: z.string().optional(),
});

/**
 * News 페이지네이션 응답 스키마
 */
export const NewsPaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(NewsSchema).nullable(),
  error: z.string().optional(),
  hasMore: z.boolean(),
});

/**
 * 뉴스 수집 결과 스키마
 */
export const NewsCollectionResultSchema = z.object({
  success: z.number(),
  failed: z.number(),
  total: z.number(),
  savedNewsIds: z.array(z.string()),
});

/**
 * API 응답 검증 헬퍼
 */
export function validateNewsArrayResponse(data: unknown): { success: boolean; data: News[] | null; error?: string } {
  try {
    const result = NewsArrayResponseSchema.parse(data);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: `응답 검증 실패: ${error.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      };
    }
    return {
      success: false,
      data: null,
      error: "응답 검증 중 오류가 발생했습니다.",
    };
  }
}

