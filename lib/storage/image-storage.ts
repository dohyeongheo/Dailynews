import { put, del } from "@vercel/blob";
import { log } from "../utils/logger";
import { optimizeImage } from "../utils/image-optimizer";

/**
 * 뉴스 이미지를 최적화하고 Vercel Blob Storage에 업로드하여 Public URL을 반환합니다.
 * @param newsId 뉴스 ID
 * @param imageBuffer 원본 이미지 Buffer
 * @returns Public URL
 */
export async function uploadNewsImage(newsId: string, imageBuffer: Buffer): Promise<string> {
  try {
    // 이미지 최적화 (WebP 형식, 최대 768px, 품질 80%)
    // Gemini API에서 768x768로 생성하므로 동일한 해상도로 유지하여 추가 용량 절감
    const { buffer: optimizedBuffer, mimeType, originalSize, optimizedSize } = await optimizeImage(
      imageBuffer,
      {
        maxWidth: 768,
        maxHeight: 768,
        quality: 80,
        useWebP: true,
      }
    );

    // 파일 확장자 결정 (WebP 또는 PNG)
    const extension = mimeType === "image/webp" ? "webp" : "png";
    const filename = `news/${newsId}.${extension}`;

    const blob = await put(filename, optimizedBuffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false, // newsId가 이미 고유하므로 랜덤 접미사 불필요
    });

    log.info("Vercel Blob 이미지 업로드 완료", {
      newsId,
      url: blob.url,
      originalSize,
      optimizedSize,
      compressionRatio: (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2) + "%",
      mimeType,
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

