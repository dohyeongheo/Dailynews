/**
 * 텍스트 유사도 계산 유틸리티
 * 뉴스 제목과 내용의 유사도를 계산하여 중복 뉴스를 감지하는데 사용
 */

/**
 * 두 문자열의 Jaccard 유사도를 계산합니다.
 * Jaccard 유사도 = 교집합 크기 / 합집합 크기
 *
 * @param text1 첫 번째 텍스트
 * @param text2 두 번째 텍스트
 * @returns 유사도 (0~1 사이의 값, 1에 가까울수록 유사)
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  // null이나 undefined 체크만 수행 (빈 문자열은 허용)
  if (text1 == null || text2 == null) {
    return 0;
  }

  // 텍스트를 단어 집합으로 변환 (띄어쓰기 기준으로 분리, 중복 제거)
  const words1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, " ") // 특수문자 제거 (한글 포함)
      .split(/\s+/)
      .filter((word) => word.length > 0)
  );

  const words2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, " ") // 특수문자 제거 (한글 포함)
      .split(/\s+/)
      .filter((word) => word.length > 0)
  );

  // 둘 다 공집합인 경우 (빈 문자열 또는 공백만 있는 경우)
  if (words1.size === 0 && words2.size === 0) {
    return 1; // 빈 문자열끼리는 동일하다고 간주
  }

  // 한쪽만 공집합인 경우
  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  // 교집합 계산
  const intersection = new Set([...words1].filter((word) => words2.has(word)));

  // 합집합 계산
  const union = new Set([...words1, ...words2]);

  // Jaccard 유사도 = 교집합 크기 / 합집합 크기
  return intersection.size / union.size;
}

/**
 * 두 문자열의 Levenshtein 거리 기반 유사도를 계산합니다.
 * Levenshtein 거리 기반 유사도 = 1 - (거리 / 최대 길이)
 *
 * @param text1 첫 번째 텍스트
 * @param text2 두 번째 텍스트
 * @returns 유사도 (0~1 사이의 값, 1에 가까울수록 유사)
 */
export function calculateLevenshteinSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) {
    return 0;
  }

  if (text1 === text2) {
    return 1;
  }

  const len1 = text1.length;
  const len2 = text2.length;

  if (len1 === 0 || len2 === 0) {
    return 0;
  }

  // Levenshtein 거리 계산 (동적 프로그래밍)
  const matrix: number[][] = [];

  // 초기화
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 거리 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 삭제
        matrix[i][j - 1] + 1, // 삽입
        matrix[i - 1][j - 1] + cost // 치환
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);

  // 유사도 = 1 - (거리 / 최대 길이)
  return 1 - distance / maxLength;
}

/**
 * 두 뉴스 항목의 제목과 내용을 비교하여 종합 유사도를 계산합니다.
 * 제목 가중치 50%, 내용 가중치 50%로 가중 평균 계산
 * 제목 유사도가 90% 이상이면 추가 가중치 적용
 *
 * @param title1 첫 번째 뉴스의 제목
 * @param content1 첫 번째 뉴스의 내용
 * @param title2 두 번째 뉴스의 제목
 * @param content2 두 번째 뉴스의 내용
 * @param titleWeight 제목 가중치 (기본값: 0.5)
 * @param contentWeight 내용 가중치 (기본값: 0.5)
 * @returns 종합 유사도 (0~1 사이의 값)
 */
export function calculateNewsSimilarity(
  title1: string,
  content1: string,
  title2: string,
  content2: string,
  titleWeight: number = 0.5,
  contentWeight: number = 0.5
): number {
  // 제목 유사도 계산 (Jaccard 유사도 사용 - 단어 기반 비교에 적합)
  const titleSimilarity = calculateJaccardSimilarity(title1, title2);

  // 내용 유사도 계산 (Jaccard 유사도 사용)
  const content1ToCompare = content1 || "";
  const content2ToCompare = content2 || "";
  const contentSimilarity = calculateJaccardSimilarity(content1ToCompare, content2ToCompare);

  // 가중 평균 계산
  let totalSimilarity = titleSimilarity * titleWeight + contentSimilarity * contentWeight;

  // 제목 유사도가 90% 이상이면 추가 가중치 적용 (제목이 매우 유사하면 중복 가능성 높음)
  if (titleSimilarity >= 0.9) {
    // 제목 유사도에 추가 가중치를 주어 전체 유사도를 높임
    totalSimilarity = Math.min(1.0, totalSimilarity + (titleSimilarity - 0.9) * 0.2);
  }

  return totalSimilarity;
}

/**
 * 유사도를 백분율로 변환합니다.
 *
 * @param similarity 유사도 (0~1)
 * @returns 백분율 (0~100)
 */
export function similarityToPercent(similarity: number): number {
  return Math.round(similarity * 100);
}

