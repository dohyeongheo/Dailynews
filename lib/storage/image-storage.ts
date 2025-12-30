import { put, del } from "@vercel/blob";
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

/**
 * 뉴스 이미지를 Vercel Blob Storage에서 삭제합니다.
 * @param imageUrl 삭제할 이미지 URL
 * @returns 삭제 성공 여부
 */
export async function deleteNewsImage(imageUrl: string): Promise<boolean> {
  try {
    await del(imageUrl);

    log.debug("Vercel Blob 이미지 삭제 완료", {
      imageUrl,
    });

    return true;
  } catch (error) {
    log.error("Vercel Blob 이미지 삭제 실패", error instanceof Error ? error : new Error(String(error)), {
      imageUrl,
    });
    return false;
  }
}

