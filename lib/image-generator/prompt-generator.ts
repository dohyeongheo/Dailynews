import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NewsInput } from "@/types/news";
import { log } from "../utils/logger";
import { getEnv } from "../config/env";

/**
 * Gemini AI 클라이언트를 지연 초기화합니다.
 */
function getGenAI(): GoogleGenerativeAI {
  const { GOOGLE_GEMINI_API_KEY } = getEnv();
  return new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
}

/**
 * 뉴스 내용을 기반으로 이미지 생성에 적합한 프롬프트를 생성합니다.
 * 영어 프롬프트를 생성하여 AI 이미지 생성 API에 최적화합니다.
 */
export async function generateImagePrompt(news: NewsInput): Promise<string> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 뉴스 내용 요약
    const newsContent = news.content_translated || news.content;
    const newsTitle = news.title;
    const category = news.news_category || news.category;

    // 카테고리별 스타일 가이드
    const styleGuide = getCategoryStyleGuide(category);

    const prompt = `다음 뉴스 기사를 기반으로 AI 이미지 생성에 사용할 영어 프롬프트를 생성해주세요.

뉴스 제목: ${newsTitle}
뉴스 내용: ${newsContent.substring(0, 500)}
카테고리: ${category}

요구사항:
1. 영어로 작성된 프롬프트여야 합니다.
2. 뉴스의 핵심 내용을 시각적으로 표현할 수 있는 구체적인 이미지 설명이어야 합니다.
3. ${styleGuide}
4. 프롬프트는 50-100 단어 정도로 작성해주세요.
5. JSON 형식으로 반환하지 말고, 순수한 텍스트 프롬프트만 반환해주세요.

프롬프트:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedPrompt = response.text().trim();

    log.debug("이미지 프롬프트 생성 완료", {
      newsTitle: newsTitle.substring(0, 50),
      promptLength: generatedPrompt.length,
    });

    return generatedPrompt;
  } catch (error) {
    log.error("이미지 프롬프트 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      newsTitle: news.title.substring(0, 50),
    });
    // 기본 프롬프트 반환
    return generateDefaultPrompt(news);
  }
}

/**
 * 카테고리별 스타일 가이드 반환
 */
function getCategoryStyleGuide(category: string): string {
  const guides: Record<string, string> = {
    정치: "정치적이고 공식적인 분위기, 신뢰감 있는 이미지",
    경제: "비즈니스와 금융을 나타내는 이미지, 차트나 그래프 요소 포함 가능",
    사회: "일상적이고 현실적인 이미지, 사람들의 생활 모습",
    과학: "과학적이고 미래지향적인 이미지, 기술과 혁신 요소",
    스포츠: "역동적이고 활기찬 이미지, 운동과 경쟁의 모습",
    문화: "예술적이고 창의적인 이미지, 문화적 다양성 표현",
    기술: "기술적이고 혁신적인 이미지, 디지털과 IT 요소",
    건강: "건강하고 활기찬 이미지, 웰빙과 의료 요소",
    환경: "자연과 환경 보호를 나타내는 이미지, 지속가능성 요소",
    국제: "글로벌하고 다문화적인 이미지, 국제 협력과 교류",
    기타: "일반적이고 중립적인 이미지",
  };

  return guides[category] || guides["기타"];
}

/**
 * 기본 프롬프트 생성 (에러 발생 시 사용)
 */
function generateDefaultPrompt(news: NewsInput): string {
  const title = news.title;
  const category = news.news_category || news.category;

  return `A news illustration representing "${title}" in the ${category} category, professional and informative style, high quality, detailed`;
}

