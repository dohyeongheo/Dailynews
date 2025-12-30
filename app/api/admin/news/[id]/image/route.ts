import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { uploadNewsImage, deleteNewsImage } from "@/lib/storage/image-storage";
import { updateNewsImageUrl } from "@/lib/db/news";
import { supabaseServer } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

/**
 * 뉴스 이미지 업로드
 * POST /api/admin/news/[id]/image
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(
    withErrorHandling(async (req: NextRequest) => {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;

      if (!file) {
        return createErrorResponse(new Error("이미지 파일이 필요합니다."), 400);
      }

      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        return createErrorResponse(new Error("이미지 파일만 업로드 가능합니다."), 400);
      }

      // 파일 크기 제한 (10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        return createErrorResponse(new Error("이미지 크기는 10MB를 초과할 수 없습니다."), 400);
      }

      try {
        // 기존 이미지 URL 확인 (삭제용)
        const { data: existingNews } = await supabaseServer
          .from("news")
          .select("image_url")
          .eq("id", params.id)
          .single();

        // 파일을 Buffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 이미지 업로드
        const imageUrl = await uploadNewsImage(params.id, buffer);

        // DB 업데이트
        await updateNewsImageUrl(params.id, imageUrl);

        // 기존 이미지가 있으면 삭제
        if (existingNews?.image_url && existingNews.image_url !== imageUrl) {
          await deleteNewsImage(existingNews.image_url).catch((error) => {
            log.warn("기존 이미지 삭제 실패 (무시)", {
              error: error instanceof Error ? error.message : String(error),
              newsId: params.id,
              oldImageUrl: existingNews.image_url,
            });
          });
        }

        return createSuccessResponse({ imageUrl }, "이미지가 업로드되었습니다.");
      } catch (error) {
        log.error("이미지 업로드 실패", error instanceof Error ? error : new Error(String(error)), {
          newsId: params.id,
        });
        return createErrorResponse(
          error instanceof Error ? error : new Error("이미지 업로드에 실패했습니다."),
          500
        );
      }
    })
  )(request);
}

/**
 * 뉴스 이미지 삭제
 * DELETE /api/admin/news/[id]/image
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(
    withErrorHandling(async (req: NextRequest) => {
      try {
        // 현재 이미지 URL 확인
        const { data: news, error: fetchError } = await supabaseServer
          .from("news")
          .select("image_url")
          .eq("id", params.id)
          .single();

        if (fetchError) {
          return createErrorResponse(new Error("뉴스를 찾을 수 없습니다."), 404);
        }

        if (!news?.image_url) {
          return createErrorResponse(new Error("삭제할 이미지가 없습니다."), 400);
        }

        // Vercel Blob에서 이미지 삭제
        const deleted = await deleteNewsImage(news.image_url);

        if (!deleted) {
          log.warn("이미지 삭제 실패 (DB는 업데이트)", {
            newsId: params.id,
            imageUrl: news.image_url,
          });
        }

        // DB에서 image_url 제거
        const { error: updateError } = await supabaseServer
          .from("news")
          .update({ image_url: null })
          .eq("id", params.id);

        if (updateError) {
          log.error("이미지 URL 업데이트 실패", new Error(updateError.message), {
            newsId: params.id,
          });
          return createErrorResponse(new Error("이미지 삭제에 실패했습니다."), 500);
        }

        return createSuccessResponse({ success: true }, "이미지가 삭제되었습니다.");
      } catch (error) {
        log.error("이미지 삭제 실패", error instanceof Error ? error : new Error(String(error)), {
          newsId: params.id,
        });
        return createErrorResponse(
          error instanceof Error ? error : new Error("이미지 삭제에 실패했습니다."),
          500
        );
      }
    })
  )(request);
}

