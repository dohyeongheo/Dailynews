/**
 * CSRF 토큰 관련 상수
 * 클라이언트와 서버 모두에서 사용 가능
 */
export const CSRF_TOKEN_COOKIE_NAME = "csrf-token";
export const CSRF_TOKEN_HEADER = "x-csrf-token";
export const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24시간
