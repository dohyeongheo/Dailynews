import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit-redis";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate Limiting 미들웨어 헬퍼
 * @param request NextRequest 객체
 * @param config Rate Limit 설정
 * @returns Rate Limit 초과 시 NextResponse, 통과 시 null
 */
export async function applyRateLimit(request: NextRequest, config: RateLimitConfig): Promise<NextResponse | null> {
  // IP 주소 추출
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || request.ip || "unknown";

  // Rate Limit 체크
  const rateLimitResult = await checkRateLimit(clientIp, config.maxRequests, config.windowMs);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: `요청 한도를 초과했습니다. ${retryAfter}초 후 다시 시도해주세요.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  return null;
}

/**
 * Rate Limit 설정 상수
 */
export const RATE_LIMIT_CONFIGS = {
  REGISTER: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1분
  },
  SIGNIN: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1분
  },
  COMMENTS: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1분
  },
  BOOKMARKS: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1분
  },
  MANUAL_FETCH: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1시간
  },
} as const;
