import { NextRequest, NextResponse } from "next/server";
import { requiresCsrfProtection } from "@/lib/utils/csrf";
import { CSRF_TOKEN_HEADER, CSRF_TOKEN_COOKIE_NAME } from "@/lib/utils/csrf-constants";
import { isAdminAuthenticated } from "@/lib/utils/admin-auth";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isAdminAuthApi = nextUrl.pathname.startsWith("/api/admin/auth");
  const isAdminLoginPage = nextUrl.pathname === "/admin/login";
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isAdminApi = nextUrl.pathname.startsWith("/api/admin");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // CSRF 보호: API 라우트에서 POST/PUT/PATCH/DELETE 요청에 대해 CSRF 토큰 검증
  if (isApiRoute && requiresCsrfProtection(req.method)) {
    // 제외할 라우트들: CSRF 토큰 API, 비밀번호/Secret 기반 인증 API
    const isCsrfTokenRoute = nextUrl.pathname.startsWith("/api/csrf-token");
    const isManualFetchRoute = nextUrl.pathname.startsWith("/api/manual/fetch-news");
    const isCronFetchRoute = nextUrl.pathname.startsWith("/api/cron/fetch-news");

    if (!isAdminAuthApi && !isCsrfTokenRoute && !isManualFetchRoute && !isCronFetchRoute) {
      const requestToken = req.headers.get(CSRF_TOKEN_HEADER);
      const cookieToken = req.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value;

      // CSRF 토큰 검증
      const { verifyCsrfToken } = await import("@/lib/utils/csrf");
      const isValid = verifyCsrfToken(requestToken || null, cookieToken || null);

      if (!isValid) {
        console.error("[CSRF] 토큰 검증 실패:", {
          path: nextUrl.pathname,
          method: req.method,
          hasRequestToken: !!requestToken,
          hasCookieToken: !!cookieToken,
          requestTokenPreview: requestToken ? requestToken.substring(0, 10) + "..." : null,
        });
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }
  }

  // 관리자 인증 API는 통과
  if (isAdminAuthApi) {
    return NextResponse.next();
  }

  // 관리자 로그인 페이지는 통과
  if (isAdminLoginPage) {
    return NextResponse.next();
  }

  // 관리자 페이지 보호
  if (isAdminPage) {
    if (!isAdminAuthenticated(req)) {
      const loginUrl = new URL("/admin/login", nextUrl);
      loginUrl.searchParams.set("redirect", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 관리자 API 보호
  if (isAdminApi) {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
