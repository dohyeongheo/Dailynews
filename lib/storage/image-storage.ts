import { supabaseServer } from "../supabase/server";
import { log } from "../utils/logger";

const BUCKET_NAME = "news-images";

/**
 * 뉴스 이미지를 Supabase Storage에 업로드하고 Public URL을 반환합니다.
 * @param newsId 뉴스 ID
 * @param imageBuffer 이미지 Buffer
 * @returns Public URL
 */
export async function uploadNewsImage(newsId: string, imageBuffer: Buffer): Promise<string> {
  try {
    const filename = `news/${newsId}.png`;

    // Supabase Storage에 업로드
    const { data, error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: true, // 기존 파일이 있으면 덮어쓰기
      });

    if (error) {
      log.error("Supabase Storage 이미지 업로드 실패", error instanceof Error ? error : new Error(String(error)), {
        newsId,
        filename,
        errorMessage: error.message,
      });
      throw error;
    }

    // Public URL 생성
    const { data: { publicUrl } } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    log.debug("Supabase Storage 이미지 업로드 완료", {
      newsId,
      url: publicUrl,
      size: imageBuffer.length,
      path: data.path,
    });

    return publicUrl;
  } catch (error) {
    log.error("Supabase Storage 이미지 업로드 실패", error instanceof Error ? error : new Error(String(error)), {
      newsId,
    });
    throw error;
  }
}

