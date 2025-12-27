import { put } from "@vercel/blob";
import { log } from "../utils/logger";

/**
 * 뉴스 이미지를 Vercel Blob Storage에 업로드하고 Public URL을 반환합니다.
 * @param newsId 뉴스 ID
 * @param imageBuffer 이미지 Buffer
 * @returns Public URL
 */
export async function uploadNewsImage(newsId: string, imageBuffer: Buffer): Promise<string> {
  try {
    const filename = `news/${newsId}.png`;

    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false, // newsId가 이미 고유하므로 랜덤 접미사 불필요
    });

    log.debug("Vercel Blob 이미지 업로드 완료", {
      newsId,
      url: blob.url,
      size: imageBuffer.length,
    });

    return blob.url;
  } catch (error) {
    log.error("Vercel Blob 이미지 업로드 실패", error instanceof Error ? error : new Error(String(error)), {
      newsId,
    });
    throw error;
  }
}

