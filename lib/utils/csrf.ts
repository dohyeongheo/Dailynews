import { cookies } from "next/headers";
import crypto from "crypto";
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
    sameSite: "strict",
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
    return false;
  }

  // 토큰이 일치하는지 확인 (타이밍 공격 방지를 위해 crypto.timingSafeEqual 사용)
  try {
    const requestBuffer = Buffer.from(requestToken, "hex");
    const cookieBuffer = Buffer.from(cookieToken, "hex");

    if (requestBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(requestBuffer, cookieBuffer);
  } catch {
    return false;
  }
}

/**
 * CSRF 보호가 필요한 메서드인지 확인
 */
export function requiresCsrfProtection(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
