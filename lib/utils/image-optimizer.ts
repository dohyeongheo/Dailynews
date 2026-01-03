import sharp from "sharp";
import { log } from "./logger";

/**
 * 이미지 최적화 옵션
 */
export interface ImageOptimizeOptions {
  /** 최대 너비 (px). 기본값: 1024 */
  maxWidth?: number;
  /** 최대 높이 (px). 기본값: 1024 */
  maxHeight?: number;
  /** WebP 품질 (0-100). 기본값: 80 */
  quality?: number;
  /** WebP 형식 사용 여부. 기본값: true */
  useWebP?: boolean;
}

/**
 * 이미지를 최적화하여 용량을 줄입니다.
 * @param imageBuffer 원본 이미지 Buffer
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 Buffer와 MIME 타입
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options: ImageOptimizeOptions = {}
): Promise<{ buffer: Buffer; mimeType: string; originalSize: number; optimizedSize: number }> {
  try {
    const {
      maxWidth = 1024,
      maxHeight = 1024,
      quality = 80,
      useWebP = true,
    } = options;

    const originalSize = imageBuffer.length;

    log.debug("이미지 최적화 시작", {
      originalSize,
      maxWidth,
      maxHeight,
      quality,
      useWebP,
    });

    // Sharp 인스턴스 생성
    let sharpInstance = sharp(imageBuffer);

    // 이미지 메타데이터 확인
    const metadata = await sharpInstance.metadata();
    log.debug("원본 이미지 메타데이터", {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    });

    // 리사이즈 (비율 유지)
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: "inside", // 비율 유지하면서 최대 크기 내에 맞춤
      withoutEnlargement: true, // 원본보다 크게 확대하지 않음
    });

    // WebP로 변환 및 품질 설정
    if (useWebP) {
      sharpInstance = sharpInstance.webp({ quality });
    } else {
      // PNG 사용 시에도 최적화
      sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
    }

    // 최적화된 이미지 Buffer 생성
    const optimizedBuffer = await sharpInstance.toBuffer();
    const optimizedSize = optimizedBuffer.length;
    const mimeType = useWebP ? "image/webp" : "image/png";

    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    log.info("이미지 최적화 완료", {
      originalSize,
      optimizedSize,
      compressionRatio: compressionRatio.toFixed(2) + "%",
      mimeType,
      width: metadata.width,
      height: metadata.height,
    });

    return {
      buffer: optimizedBuffer,
      mimeType,
      originalSize,
      optimizedSize,
    };
  } catch (error) {
    log.error("이미지 최적화 실패", error instanceof Error ? error : new Error(String(error)), {
      originalSize: imageBuffer.length,
    });
    // 최적화 실패 시 원본 반환
    return {
      buffer: imageBuffer,
      mimeType: "image/png",
      originalSize: imageBuffer.length,
      optimizedSize: imageBuffer.length,
    };
  }
}

