import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { requiresCsrfProtection } from "@/lib/utils/csrf";
import { CSRF_TOKEN_HEADER, CSRF_TOKEN_COOKIE_NAME } from "@/lib/utils/csrf-constants";

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthPage = nextUrl.pathname.startsWith("/auth");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isProtectedApi = nextUrl.pathname.startsWith("/api/bookmarks") || (nextUrl.pathname.startsWith("/api/comments") && req.method !== "GET");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // CSRF 보호: API 라우트에서 POST/PUT/PATCH/DELETE 요청에 대해 CSRF 토큰 검증
  if (isApiRoute && requiresCsrfProtection(req.method)) {
    // 제외할 라우트들: NextAuth, CSRF 토큰 API, 비밀번호/Secret 기반 인증 API
    const isCsrfTokenRoute = nextUrl.pathname.startsWith("/api/csrf-token");
    const isManualFetchRoute = nextUrl.pathname.startsWith("/api/manual/fetch-news");
    const isCronFetchRoute = nextUrl.pathname.startsWith("/api/cron/fetch-news");

    if (!isApiAuthRoute && !isCsrfTokenRoute && !isManualFetchRoute && !isCronFetchRoute) {
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

  // API 인증 라우트는 통과
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 관리자 페이지 보호
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", nextUrl));
    }
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl)); // 권한 없음 -> 홈으로
    }
    return NextResponse.next();
  }

  // 보호된 API 보호
  if (isProtectedApi) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 로그인 페이지 등에서 이미 로그인된 경우 리다이렉트
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
