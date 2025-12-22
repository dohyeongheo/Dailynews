import { cookies } from "next/headers";
import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER, CSRF_TOKEN_MAX_AGE } from "./csrf-constants";

/**
 * CSRF 토큰 생성
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * CSRF 토큰을 쿠키에 설정
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // strict에서 lax로 변경하여 더 유연하게 처리
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: "/",
  });

  return token;
}

/**
 * CSRF 토큰 가져오기
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE_NAME)?.value || null;
}

/**
 * CSRF 토큰 검증
 * @param requestToken 요청 헤더에서 받은 토큰
 * @param cookieToken 쿠키에서 받은 토큰
 */
export function verifyCsrfToken(requestToken: string | null, cookieToken: string | null): boolean {
  if (!requestToken || !cookieToken) {
    console.warn("[CSRF] 토큰 누락:", { hasRequestToken: !!requestToken, hasCookieToken: !!cookieToken });
    return false;
  }

  // Edge/Node 환경 차이 없이 동작하도록 단순 문자열 비교 사용
  if (requestToken.length !== cookieToken.length) {
    console.warn("[CSRF] 토큰 길이 불일치:", {
      requestLength: requestToken.length,
      cookieLength: cookieToken.length,
    });
    return false;
  }

  const isValid = requestToken === cookieToken;
  if (!isValid) {
    console.warn("[CSRF] 토큰 불일치");
  }
  return isValid;
}

/**
 * CSRF 보호가 필요한 메서드인지 확인
 */
export function requiresCsrfProtection(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
