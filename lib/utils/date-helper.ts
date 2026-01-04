/**
 * 날짜 관련 유틸리티 함수
 * KST(한국 표준시) 기준으로 날짜를 처리합니다.
 */

/**
 * KST(한국 표준시) 기준으로 오늘 날짜를 반환합니다.
 * @returns YYYY-MM-DD 형식의 오늘 날짜 문자열
 */
export function getTodayKST(): string {
  const now = new Date();
  // Intl.DateTimeFormat을 사용하여 Asia/Seoul 시간대의 날짜를 가져옴
  // en-CA locale은 YYYY-MM-DD 형식을 반환함
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

/**
 * 날짜 문자열이 유효한 YYYY-MM-DD 형식인지 확인합니다.
 * @param date 날짜 문자열
 * @returns 유효한 날짜 형식이면 true, 아니면 false
 */
export function isValidDate(date: string): boolean {
  if (!date || typeof date !== "string") {
    return false;
  }

  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // 실제로 유효한 날짜인지 확인
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  // 입력한 날짜와 파싱된 날짜가 일치하는지 확인 (예: 2024-13-45 같은 경우 방지)
  const [year, month, day] = date.split("-").map(Number);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() + 1 !== month ||
    dateObj.getDate() !== day
  ) {
    return false;
  }

  return true;
}

/**
 * 주어진 날짜가 오늘(KST 기준)보다 과거인지 확인합니다.
 * @param date 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns 과거 날짜이면 true, 오늘 또는 미래이면 false
 */
export function isPastDate(date: string): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const todayKST = getTodayKST();
  return date < todayKST;
}

/**
 * 주어진 날짜가 오늘(KST 기준)보다 미래인지 확인합니다.
 * @param date 날짜 문자열 (YYYY-MM-DD 형식)
 * @returns 미래 날짜이면 true, 오늘 또는 과거이면 false
 */
export function isFutureDate(date: string): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const todayKST = getTodayKST();
  return date > todayKST;
}

/**
 * RFC 822 형식의 날짜 문자열을 YYYY-MM-DD 형식으로 변환합니다.
 * 예: "Mon, 26 Sep 2016 07:50:00 +0900" → "2016-09-26"
 * @param rfc822Date RFC 822 형식의 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열, 파싱 실패 시 null
 */
export function parseRFC822Date(rfc822Date: string): string | null {
  if (!rfc822Date || typeof rfc822Date !== "string") {
    return null;
  }

  try {
    // RFC 822 형식: "Mon, 26 Sep 2016 07:50:00 +0900"
    // Date 객체가 RFC 822 형식을 파싱할 수 있으므로 직접 사용
    const dateObj = new Date(rfc822Date);

    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // YYYY-MM-DD 형식으로 변환 (KST 기준)
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return formatter.format(dateObj);
  } catch (error) {
    return null;
  }
}

