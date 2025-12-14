import { NextResponse } from "next/server";
import { setCsrfToken } from "@/lib/utils/csrf";

/**
 * CSRF 토큰을 가져오는 API
 * 클라이언트 컴포넌트에서 이 API를 호출하여 CSRF 토큰을 받아옵니다.
 */
export async function GET() {
  const token = await setCsrfToken();

  // 토큰을 응답 본문에도 포함 (쿠키는 자동으로 설정됨)
  return NextResponse.json({ token });
}
