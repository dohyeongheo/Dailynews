import { NextResponse } from "next/server";
import { getCsrfToken, setCsrfToken } from "@/lib/utils/csrf";

/**
 * CSRF 토큰을 가져오는 API
 * - 이미 쿠키에 토큰이 있으면 재사용
 * - 없으면 새로 생성해서 쿠키와 응답에 포함
 * 이렇게 해서 여러 컴포넌트에서 동시에 호출해도
 * 항상 동일한 토큰 쌍(헤더/쿠키)을 사용하도록 보장합니다.
 */
export async function GET() {
  // 기존 쿠키에 CSRF 토큰이 있는지 확인
  const existingToken = await getCsrfToken();

  const token = existingToken ?? (await setCsrfToken());

  // 토큰을 응답 본문에도 포함 (쿠키는 자동으로 설정됨)
  return NextResponse.json({ token });
}
