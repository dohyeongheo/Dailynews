import { cookies } from "next/headers";
import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER, CSRF_TOKEN_MAX_AGE } from "./csrf-constants";

/**
 * CSRF 토큰 생성 (Edge Runtime 호환)
 * Web Crypto API를 사용하여 Edge Runtime에서도 작동
 */
export function generateCsrfToken(): string {
  // Edge Runtime 호환: Web Crypto API 사용
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // Web Crypto API 사용 (Edge Runtime)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  // Node.js Runtime: Node.js crypto 모듈 사용
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto");
  return nodeCrypto.randomBytes(32).toString("hex");
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
 * CSRF 토큰 검증 (Edge Runtime 호환)
 * @param requestToken 요청 헤더에서 받은 토큰
 * @param cookieToken 쿠키에서 받은 토큰
 */
export function verifyCsrfToken(requestToken: string | null, cookieToken: string | null): boolean {
  if (!requestToken || !cookieToken) {
    return false;
  }

  // 토큰 길이 확인
  if (requestToken.length !== cookieToken.length) {
    return false;
  }

  // Edge Runtime 호환: Web Crypto API를 사용한 타이밍 공격 방지 비교
  try {
    // Edge Runtime: Web Crypto API 사용
    if (typeof crypto !== "undefined" && "subtle" in crypto) {
      // 간단한 문자열 비교 (타이밍 공격 방지를 위해 모든 문자를 비교)
      let result = 0;
      for (let i = 0; i < requestToken.length; i++) {
        result |= requestToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
      }
      return result === 0;
    }

    // Node.js Runtime: crypto.timingSafeEqual 사용
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    const requestBuffer = Buffer.from(requestToken, "hex");
    const cookieBuffer = Buffer.from(cookieToken, "hex");

    if (requestBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return nodeCrypto.timingSafeEqual(requestBuffer, cookieBuffer);
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
