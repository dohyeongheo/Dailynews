import { NextRequest, NextResponse } from "next/server";
import { retryFailedTranslations } from "@/lib/news-fetcher";
import { log } from "@/lib/utils/logger";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { BadRequestError } from "@/lib/errors";

export const maxDuration = 300; // Vercel Pro 플랜 최대 타임아웃 (초)

/**
 * 번역 실패한 뉴스 재번역 API
 * 관리자 전용
 */
export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json().catch(() => ({}));
      const limit = body.limit && typeof body.limit === "number" ? Math.min(body.limit, 100) : 50; // 최대 100개

      log.info("번역 재처리 API 호출", { limit });

      const result = await retryFailedTranslations(limit);

      if (result.total === 0) {
        return createSuccessResponse(
          { success: 0, failed: 0, total: 0 },
          "재번역할 뉴스가 없습니다."
        );
      }

      return createSuccessResponse(
        {
          success: result.success,
          failed: result.failed,
          total: result.total,
        },
        `${result.total}개의 뉴스 중 ${result.success}개가 성공적으로 재번역되었습니다.`
      );
    } catch (error) {
      log.error("번역 재처리 API 오류", error instanceof Error ? error : new Error(String(error)));
      return createErrorResponse(
        new BadRequestError(error instanceof Error ? error.message : "번역 재처리에 실패했습니다."),
        500
      );
    }
  })
);

