import type { NewsInput } from "@/types/news";
import { log } from "../utils/logger";
import { getModelForTask, generateContentWithCaching } from "../utils/gemini-client";

/**
 * 뉴스 내용을 기반으로 이미지 생성에 적합한 프롬프트를 생성합니다.
 * 영어 프롬프트를 생성하여 AI 이미지 생성 API에 최적화합니다.
 */
export async function generateImagePrompt(news: NewsInput): Promise<string> {
  try {
    // 제목과 내용의 해시를 캐시 키로 사용
    // NewsInput에는 id가 없으므로 제목과 내용의 조합을 사용
    const cacheKeySource = `${news.title}_${news.content.substring(0, 100)}`;

    // Context Caching을 지원하는 모델 생성 (뉴스 제목+내용 기반 캐시 키)
    const model = getModelForTask("prompt_generation", cacheKeySource);

    // 뉴스 내용 요약 (더 많은 컨텍스트 제공)
    const newsContent = news.content;
    const newsTitle = news.title;
    const category = news.news_category || news.category;
    const sourceCountry = news.source_country;

    // 카테고리별 스타일 가이드
    const styleGuide = getCategoryStyleGuide(category);

    // 뉴스 내용을 더 많이 포함 (1000자까지)
    const contentPreview = newsContent.substring(0, 1000);

    const prompt = `다음 뉴스 기사를 기반으로 AI 이미지 생성에 사용할 영어 프롬프트를 생성해주세요.

뉴스 제목: ${newsTitle}
뉴스 내용: ${contentPreview}
카테고리: ${category}
출처 국가: ${sourceCountry}

요구사항:
1. 영어로 작성된 프롬프트여야 합니다.
2. 뉴스의 핵심 내용을 시각적으로 표현할 수 있는 구체적이고 상세한 이미지 설명이어야 합니다.
3. 뉴스의 주요 키워드, 인물, 장소, 사건을 구체적으로 언급하세요.
4. ${styleGuide}
5. 뉴스의 톤과 분위기를 반영하세요 (긍정적, 중립적, 심각한 등).
6. 반드시 2D 애니메이션 스타일(2D animation style)로 작성해야 합니다. 자연스럽고 일관된 애니메이션 일러스트레이션 스타일을 유지하세요.
7. 적절한 색상 팔레트를 제안하세요 (카테고리와 뉴스 톤에 맞게).
8. 부정적이거나 폭력적인 요소는 피하고, 뉴스의 본질을 전달하는 건전한 이미지로 표현하세요.
9. 프롬프트는 80-150 단어 정도로 상세하게 작성해주세요.
10. JSON 형식으로 반환하지 말고, 순수한 텍스트 프롬프트만 반환해주세요.
11. 프롬프트는 "A professional animated illustration" 또는 "A 2D animation style illustration" 같은 형식으로 시작하세요.
12. 모든 이미지는 동일한 애니메이션 스타일을 유지하여 자연스럽고 일관된 느낌을 주어야 합니다.
13. 애니메이션 일러스트레이션의 특성을 살려 부드럽고 유기적인 형태, 자연스러운 색상 그라데이션, 일관된 라인 스타일을 표현하세요.
14. **중요: 생성되는 이미지에는 어떠한 텍스트도 포함되어서는 안 됩니다. 한글, 영어, 숫자, 기호 등 모든 종류의 텍스트나 문자를 이미지에 포함하지 마세요. 이미지는 순수한 시각적 일러스트레이션만 포함해야 하며, 텍스트가 전혀 없는 깨끗한 이미지여야 합니다.**

프롬프트:`;

    // Context Caching을 지원하는 generateContent 호출
    const cacheKey = `prompt_generation_${cacheKeySource}`;
    const result = await generateContentWithCaching(model, prompt, cacheKey);
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
    정치: "정치적이고 공식적인 분위기, 신뢰감 있는 이미지. 블루와 레드 계열 색상. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 정치적 상징이나 건물, 회의실 등의 요소를 애니메이션 스타일로 표현.",
    경제: "비즈니스와 금융을 나타내는 이미지. 차트, 그래프, 화살표, 성장 곡선 등의 요소 포함. 그린(상승) 또는 블루(안정) 계열 색상. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션.",
    사회: "일상적이고 현실적인 이미지, 사람들의 생활 모습. 따뜻하고 친근한 색상 팔레트. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 다양한 사람들의 모습을 애니메이션 스타일로 표현.",
    과학: "과학적이고 미래지향적인 이미지, 기술과 혁신 요소. 사이버펑크 또는 네온 색상, 분자 구조, 데이터 시각화, 혁신적인 기술 디자인. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 미래적이고 혁신적인 느낌.",
    스포츠: "역동적이고 활기찬 이미지, 운동과 경쟁의 모습. 밝고 에너지 넘치는 색상 (레드, 오렌지, 옐로우). 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 동작감 있는 애니메이션 일러스트레이션, 운동 선수나 경기 장면의 실루엣.",
    문화: "예술적이고 창의적인 이미지, 문화적 다양성 표현. 풍부하고 다양한 색상 팔레트. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 문화적 상징 요소, 전통과 현대의 조화를 애니메이션 스타일로 표현.",
    기술: "기술적이고 혁신적인 이미지, 디지털과 IT 요소. 네온 블루, 퍼플, 그린 계열. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 회로판 패턴, 디지털 그리드, 혁신적인 UI 요소를 애니메이션 스타일로 표현.",
    건강: "건강하고 활기찬 이미지, 웰빙과 의료 요소. 그린(자연), 화이트(깨끗함), 블루(신뢰) 계열. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 자연 요소, 웰빙 상징을 애니메이션 스타일로 표현.",
    환경: "자연과 환경 보호를 나타내는 이미지, 지속가능성 요소. 그린, 블루, 브라운 계열의 자연 색상. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 자연 경관, 나무, 태양, 재생 에너지 상징, 지구 이미지를 애니메이션 스타일로 표현.",
    국제: "글로벌하고 다문화적인 이미지, 국제 협력과 교류. 다양한 색상의 조화, 세계 지도, 국기 요소, 국제적 상징. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 현대적이고 포용적인 디자인.",
    기타: "일반적이고 중립적인 이미지. 2D 애니메이션 스타일, 자연스럽고 일관된 애니메이션 일러스트레이션. 부드러운 형태와 자연스러운 색상 그라데이션. 중립적인 색상 팔레트 (그레이, 블루, 화이트).",
  };

  return guides[category] || guides["기타"];
}

/**
 * 기본 프롬프트 생성 (에러 발생 시 사용)
 */
function generateDefaultPrompt(news: NewsInput): string {
  const title = news.title;
  const category = news.news_category || news.category;
  const styleGuide = getCategoryStyleGuide(category);

  return `A professional 2D animation style illustration representing "${title}" in the ${category} category, ${styleGuide}, natural and cohesive animated illustration style, smooth forms, natural color gradients, consistent line style, high quality, detailed, clean composition, no text, no letters, no numbers, no characters, no words, text-free, completely text-free image`;
}

