/**
 * 뉴스 이미지 추출 및 다운로드 유틸리티
 * NewsAPI와 네이버 API에서 이미지를 추출하고, 실패 시 Gemini API로 생성합니다.
 */

import { log } from "../utils/logger";
import type { NewsInput } from "@/types/news";
import { generateAIImage } from "./ai-image-generator";
import { generateImagePrompt } from "./prompt-generator";

/**
 * NewsAPI에서 제공한 이미지 URL에서 이미지를 다운로드합니다.
 * @param imageUrl 이미지 URL
 * @returns 이미지 Buffer, 실패 시 null
 */
async function downloadImageFromUrl(imageUrl: string): Promise<Buffer | null> {
  try {
    log.debug("이미지 다운로드 시작", { imageUrl });

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      log.warn("이미지 다운로드 실패", { imageUrl, status: response.status });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 이미지 형식 검증 (간단한 체크)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      log.warn("이미지 형식이 아닌 파일", { imageUrl, contentType });
      return null;
    }

    log.debug("이미지 다운로드 완료", {
      imageUrl,
      size: buffer.length,
      contentType,
    });

    return buffer;
  } catch (error) {
    log.error("이미지 다운로드 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      imageUrl,
    });
    return null;
  }
}

/**
 * 네이버 뉴스 원문 URL에서 이미지를 추출합니다.
 * 메타 태그에서 og:image 또는 article:image를 찾습니다.
 * @param originalUrl 원문 URL
 * @returns 이미지 URL, 실패 시 null
 */
async function extractImageFromNaverArticle(originalUrl: string): Promise<string | null> {
  try {
    log.debug("네이버 뉴스 이미지 추출 시작", { originalUrl });

    const response = await fetch(originalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      log.warn("네이버 뉴스 페이지 로드 실패", { originalUrl, status: response.status });
      return null;
    }

    const html = await response.text();

    // og:image 메타 태그 찾기
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      log.debug("og:image 메타 태그에서 이미지 URL 발견", { originalUrl, imageUrl: ogImageMatch[1] });
      return ogImageMatch[1];
    }

    // article:image 메타 태그 찾기
    const articleImageMatch = html.match(/<meta\s+property=["']article:image["']\s+content=["']([^"']+)["']/i);
    if (articleImageMatch && articleImageMatch[1]) {
      log.debug("article:image 메타 태그에서 이미지 URL 발견", { originalUrl, imageUrl: articleImageMatch[1] });
      return articleImageMatch[1];
    }

    // 일반 img 태그에서 첫 번째 이미지 찾기 (대안)
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const imageUrl = imgMatch[1];
      // 상대 경로를 절대 경로로 변환
      if (imageUrl.startsWith("//")) {
        return `https:${imageUrl}`;
      } else if (imageUrl.startsWith("/")) {
        const urlObj = new URL(originalUrl);
        return `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith("http")) {
        const urlObj = new URL(originalUrl);
        return `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
      }
      log.debug("img 태그에서 이미지 URL 발견", { originalUrl, imageUrl });
      return imageUrl;
    }

    log.warn("네이버 뉴스 페이지에서 이미지를 찾을 수 없음", { originalUrl });
    return null;
  } catch (error) {
    log.error("네이버 뉴스 이미지 추출 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      originalUrl,
    });
    return null;
  }
}

/**
 * NewsAPI 또는 네이버 API에서 이미지를 추출하거나, 실패 시 Gemini API로 생성합니다.
 * @param news 뉴스 항목
 * @returns 이미지 Buffer, 실패 시 null
 */
export async function fetchOrGenerateImage(news: NewsInput): Promise<Buffer | null> {
  try {
    // 1. NewsAPI: url_to_image 확인
    if (news.source_api === "newsapi" && news.url_to_image) {
      log.debug("NewsAPI 이미지 URL에서 이미지 다운로드 시도", {
        newsId: news.title.substring(0, 50),
        imageUrl: news.url_to_image,
      });

      const imageBuffer = await downloadImageFromUrl(news.url_to_image);
      if (imageBuffer) {
        log.info("NewsAPI 이미지 다운로드 성공", {
          newsId: news.title.substring(0, 50),
          imageSize: imageBuffer.length,
        });
        return imageBuffer;
      }

      log.warn("NewsAPI 이미지 다운로드 실패, Gemini API로 폴백", {
        newsId: news.title.substring(0, 50),
      });
    }

    // 2. 네이버 API: 원문 URL에서 메타 태그 크롤링
    if (news.source_api === "naver" && news.original_url) {
      log.debug("네이버 뉴스 원문에서 이미지 추출 시도", {
        newsId: news.title.substring(0, 50),
        originalUrl: news.original_url,
      });

      const imageUrl = await extractImageFromNaverArticle(news.original_url);
      if (imageUrl) {
        const imageBuffer = await downloadImageFromUrl(imageUrl);
        if (imageBuffer) {
          log.info("네이버 뉴스 이미지 추출 성공", {
            newsId: news.title.substring(0, 50),
            imageUrl,
            imageSize: imageBuffer.length,
          });
          return imageBuffer;
        }
      }

      log.warn("네이버 뉴스 이미지 추출 실패, Gemini API로 폴백", {
        newsId: news.title.substring(0, 50),
      });
    }

    // 3. 이미지 수집 실패 시 Gemini API로 생성
    log.debug("Gemini API로 이미지 생성 시작", {
      newsId: news.title.substring(0, 50),
      source_api: news.source_api,
    });

    const imagePrompt = await generateImagePrompt(news);
    const imageBuffer = await generateAIImage(imagePrompt);

    log.info("Gemini API 이미지 생성 성공", {
      newsId: news.title.substring(0, 50),
      imageSize: imageBuffer.length,
    });

    return imageBuffer;
  } catch (error) {
    log.error("이미지 추출/생성 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      newsId: news.title.substring(0, 50),
      source_api: news.source_api,
    });
    return null;
  }
}

