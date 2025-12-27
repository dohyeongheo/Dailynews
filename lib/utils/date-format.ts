/**
 * 날짜 포맷팅 유틸리티
 * 중복된 날짜 포맷팅 로직을 통합
 */

/**
 * 뉴스 날짜를 한국어 형식으로 포맷팅
 * @param dateString ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "2024년 1월 15일")
 */
export function formatNewsDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 뉴스 날짜를 상세 형식으로 포맷팅 (시간 포함)
 * @param dateString ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "2024년 01월 15일 14시 30분")
 */
export function formatNewsDateDetailed(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

