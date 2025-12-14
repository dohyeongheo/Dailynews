/**
 * Input Validation 유틸리티
 * Zod를 사용한 스키마 정의
 */

import { z } from "zod";

/**
 * 수동 뉴스 수집 API 요청 스키마
 */
export const manualFetchNewsSchema = z.object({
  password: z.string().min(1, "비밀번호는 필수입니다."),
});

/**
 * 검색 요청 스키마
 */
export const searchNewsSchema = z.object({
  query: z.string().min(1, "검색어는 필수입니다.").max(200, "검색어는 200자 이하여야 합니다."),
  searchType: z.enum(["title", "content", "all"]).optional().default("all"),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

/**
 * 카테고리 페이지네이션 스키마
 */
export const categoryPaginationSchema = z.object({
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(12),
});

/**
 * 안전한 파싱 함수
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    // ZodError는 항상 issues 배열을 가지고 있습니다
    if (result.error && result.error.issues && Array.isArray(result.error.issues)) {
      const errorMessage = result.error.issues
        .map((e) => {
          const path = e.path && e.path.length > 0 ? e.path.join(".") : "root";
          return `${path}: ${e.message || "Validation error"}`;
        })
        .join(", ");
      return { success: false, error: errorMessage };
    }
    // Fallback: ZodError가 예상과 다른 경우
    return { success: false, error: result.error?.message || "Validation failed" };
  }
}

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * SQL Injection 방지를 위한 문자열 검증
 */
export function sanitizeString(input: string): string {
  // 기본적인 SQL Injection 패턴 제거
  // 작은따옴표, 큰따옴표, 세미콜론, 백슬래시 제거
  return input
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .trim();
}
