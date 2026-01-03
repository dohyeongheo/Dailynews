/**
 * AI 할루시네이션 감지 유틸리티
 * 뉴스 데이터에서 AI 할루시네이션 패턴을 감지합니다.
 */

import { log } from "./logger";

/**
 * 할루시네이션 의심 패턴 검사 결과
 */
export interface HallucinationCheckResult {
  isSuspicious: boolean;
  reasons: string[];
  score: number; // 0-100, 높을수록 의심도 높음
}

/**
 * 영화/드라마/작품명 패턴 추출
 * 제목이나 내용에서 작품명을 추출합니다.
 */
function extractWorkTitles(text: string): string[] {
  const titles: string[] = [];

  // 작은따옴표나 큰따옴표로 둘러싸인 제목 패턴
  const quotedPattern = /['"]([^'"]{2,30})['"]/g;
  let match;
  while ((match = quotedPattern.exec(text)) !== null) {
    const title = match[1].trim();
    // 너무 짧거나 긴 것은 제외
    if (title.length >= 2 && title.length <= 30) {
      titles.push(title);
    }
  }

  // "영화 '제목'" 패턴
  const moviePattern = /영화\s*['"]([^'"]{2,30})['"]/g;
  while ((match = moviePattern.exec(text)) !== null) {
    const title = match[1].trim();
    if (title.length >= 2 && title.length <= 30) {
      titles.push(title);
    }
  }

  // "드라마 '제목'" 패턴
  const dramaPattern = /드라마\s*['"]([^'"]{2,30})['"]/g;
  while ((match = dramaPattern.exec(text)) !== null) {
    const title = match[1].trim();
    if (title.length >= 2 && title.length <= 30) {
      titles.push(title);
    }
  }

  return [...new Set(titles)]; // 중복 제거
}

/**
 * 숫자와 단위가 포함된 통계 패턴 검증
 * 예: "200만 명", "100억원" 등
 */
function hasSpecificStatistics(text: string): boolean {
  // 구체적인 숫자와 단위 패턴
  const statisticPatterns = [
    /\d+만\s*(명|원|개|건)/,
    /\d+억\s*(원|명)/,
    /\d+천\s*(명|원)/,
    /\d+만\s*명의\s*관객/,
    /\d+만\s*명이\s*관람/,
    /관객\s*\d+만\s*명/,
    /흥행\s*\d+만/,
    /예매율\s*\d+%/,
  ];

  return statisticPatterns.some((pattern) => pattern.test(text));
}

/**
 * 할루시네이션 의심 패턴 검사
 * @param title 뉴스 제목
 * @param content 뉴스 내용
 * @param sourceMedia 소스 미디어
 * @returns 할루시네이션 검사 결과
 */
export function checkHallucinationPatterns(
  title: string,
  content: string,
  sourceMedia: string
): HallucinationCheckResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. 제목이나 내용이 비정상적으로 짧은 경우
  if (title.length < 10) {
    reasons.push("제목이 너무 짧음 (10자 미만)");
    score += 20;
  }
  if (content.length < 100) {
    reasons.push("내용이 너무 짧음 (100자 미만)");
    score += 15;
  }

  // 2. 제목이나 내용이 비정상적으로 긴 경우
  if (title.length > 200) {
    reasons.push("제목이 너무 김 (200자 초과)");
    score += 10;
  }
  if (content.length > 10000) {
    reasons.push("내용이 너무 김 (10,000자 초과)");
    score += 10;
  }

  // 3. 내용에 반복되는 패턴이 많은 경우 (할루시네이션 의심)
  const repeatedPhrases = content.match(/(.{10,})\1{2,}/g);
  if (repeatedPhrases && repeatedPhrases.length > 0) {
    reasons.push(`반복되는 구문 발견: ${repeatedPhrases.length}개`);
    score += repeatedPhrases.length * 5;
  }

  // 4. AI 생성 관련 키워드가 포함된 경우
  const aiKeywords = [
    "생성된",
    "AI가",
    "인공지능이",
    "테스트",
    "샘플",
    "예시",
    "더미",
    "fake",
    "test",
    "sample",
    "generated",
    "hallucination",
    "예제",
    "예상",
  ];
  const lowerContent = content.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const foundKeywords = aiKeywords.filter(
    (keyword) => lowerContent.includes(keyword.toLowerCase()) || lowerTitle.includes(keyword.toLowerCase())
  );
  if (foundKeywords.length > 0) {
    reasons.push(`AI 생성 관련 키워드 발견: ${foundKeywords.slice(0, 3).join(", ")}`);
    score += foundKeywords.length * 10;
  }

  // 5. 내용이 특정 단어로 비정상적으로 많이 반복되는 경우
  const words = content.split(/\s+/).filter((word) => word.length > 2);
  if (words.length > 0) {
    const wordFrequency = new Map<string, number>();
    words.forEach((word) => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });
    const maxFrequency = Math.max(...Array.from(wordFrequency.values()));
    const totalWords = words.length;
    if (totalWords > 0 && maxFrequency / totalWords > 0.15) {
      reasons.push("특정 단어가 비정상적으로 많이 반복됨");
      score += 15;
    }
  }

  // 6. 내용이 문장 구조가 아닌 경우 (너무 많은 특수문자, 숫자만 등)
  const alphaNumericRatio = (content.match(/[a-zA-Z가-힣]/g) || []).length / content.length;
  if (alphaNumericRatio < 0.5 && content.length > 50) {
    reasons.push("알파벳/한글 비율이 너무 낮음 (특수문자/숫자 과다)");
    score += 10;
  }

  // 7. 소스 미디어와 내용의 일관성 검사
  if (!sourceMedia || sourceMedia.trim().length < 2) {
    reasons.push("소스 미디어 정보가 부족함");
    score += 5;
  }

  // 8. 내용이 문장 구조를 갖추지 않은 경우 (마침표나 줄바꿈이 거의 없음)
  const sentenceEndings = (content.match(/[.!?。！？]/g) || []).length;
  const sentenceRatio = sentenceEndings / content.length;
  if (sentenceRatio < 0.005 && content.length > 200) {
    reasons.push("문장 구조가 비정상적임 (마침표 부족)");
    score += 10;
  }

  // 9. 내용이 단순 반복 패턴인 경우 (예: "뉴스 내용 뉴스 내용 뉴스 내용")
  const sentences = content.split(/[.!?。！？\n]/).filter((s) => s.trim().length > 10);
  if (sentences.length > 1) {
    const firstSentence = sentences[0].trim();
    const repeatedSentenceCount = sentences.filter((s) => s.trim() === firstSentence).length;
    if (repeatedSentenceCount > sentences.length * 0.3) {
      reasons.push("문장이 비정상적으로 반복됨");
      score += 20;
    }
  }

  // 10. 구체적인 작품명(영화, 드라마 등)과 통계가 함께 있는 경우 (할루시네이션 의심)
  const workTitles = extractWorkTitles(title + " " + content);
  if (workTitles.length > 0 && hasSpecificStatistics(content)) {
    // 작품명이 있고 구체적인 통계도 있으면 의심도 증가
    // 실제로는 웹 검색으로 확인해야 하지만, 일단 패턴으로 감지
    reasons.push(`구체적인 작품명과 통계가 함께 있음: ${workTitles.slice(0, 2).join(", ")}`);
    score += 25;
  }

  // 11. 영화/드라마 관련 키워드와 구체적인 통계가 함께 있는 경우
  const entertainmentKeywords = ["영화", "드라마", "개봉", "관객", "흥행", "예매율", "박스오피스"];
  const hasEntertainmentKeyword = entertainmentKeywords.some((keyword) =>
    content.includes(keyword) || title.includes(keyword)
  );
  if (hasEntertainmentKeyword && hasSpecificStatistics(content)) {
    // 영화/드라마 관련 뉴스에 구체적인 통계가 있으면 의심
    // 실제 작품인지 확인이 어려우므로 점수 추가
    reasons.push("영화/드라마 관련 뉴스에 구체적인 통계 포함 (사실 확인 필요)");
    score += 15;
  }

  // 12. 과도하게 구체적인 정보가 포함된 경우 (할루시네이션 특징)
  // 예: "1988년 서울 올림픽", "200만 명", "첫 주말" 등이 모두 포함된 경우
  const specificDatePattern = /\d{4}년/;
  const hasSpecificDate = specificDatePattern.test(content);
  if (hasSpecificDate && hasSpecificStatistics(content) && workTitles.length > 0) {
    reasons.push("과도하게 구체적인 정보가 포함됨 (날짜, 통계, 작품명 모두 포함)");
    score += 20;
  }

  // 점수가 30 이상이면 의심으로 간주
  const isSuspicious = score >= 30;

  return {
    isSuspicious,
    reasons,
    score: Math.min(100, score),
  };
}

/**
 * 뉴스 데이터의 할루시네이션 여부를 확인합니다.
 * @param title 뉴스 제목
 * @param content 뉴스 내용
 * @param sourceMedia 소스 미디어
 * @returns 할루시네이션이 의심되면 true
 */
export function isHallucinatedNews(title: string, content: string, sourceMedia: string): boolean {
  const result = checkHallucinationPatterns(title, content, sourceMedia);

  if (result.isSuspicious) {
    log.warn("할루시네이션 의심 뉴스 감지", {
      title: title.substring(0, 50),
      score: result.score,
      reasons: result.reasons,
    });
  }

  return result.isSuspicious;
}

