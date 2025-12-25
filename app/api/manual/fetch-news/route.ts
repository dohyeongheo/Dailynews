import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveNewsAction } from "@/lib/actions";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { auth } from "@/auth";
import { log } from "@/lib/utils/logger";

export const maxDuration = 300; // Vercel Pro 플랜 최대 타임아웃 (초)

// Rate Limiting 설정: 10분에 5회 요청 허용
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10분

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

async function handleRequest(request: NextRequest, method: "GET" | "POST") {
  try {
    // Rate Limiting 체크
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `요청 한도를 초과했습니다. ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)}초 후 다시 시도해주세요.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // 인증 확인: 세션 또는 비밀번호
    let isAuthenticated = false;
    let authMethod = "none";

    // 1. 세션 확인 (관리자인 경우)
    const session = await auth();
    if (session?.user?.role === "admin") {
      isAuthenticated = true;
      authMethod = "session";
      log.info("Manual Fetch 관리자 세션 인증 성공");
    }

    // 2. 비밀번호 확인 (세션 인증 실패 시)
    if (!isAuthenticated) {
      const expectedPassword = process.env.MANUAL_FETCH_PASSWORD;

      if (!expectedPassword) {
        log.error("Manual Fetch MANUAL_FETCH_PASSWORD 환경 변수가 설정되지 않음");
        return NextResponse.json(
          {
            success: false,
            message: "서버 설정 오류: 관리자 권한이 없으며 비밀번호도 설정되지 않았습니다.",
          },
          { status: 500 }
        );
      }

      let providedPassword: string | null = null;

      if (method === "GET") {
        const { searchParams } = new URL(request.url);
        providedPassword = searchParams.get("password");
      } else {
        try {
          // body가 비어있을 수 있음
          const text = await request.text();

          if (!text || text.trim() === "") {
            // 본문이 비어있음 - 정상적인 경우일 수 있음
            log.debug("Manual Fetch POST 요청 본문이 비어있음");
          } else {
            try {
              const json = JSON.parse(text);
              providedPassword = json?.password || null;

              if (!providedPassword) {
                log.warn("Manual Fetch POST 요청 본문에 password 필드가 없음");
              }
            } catch (parseError) {
              // JSON 파싱 실패 - 명확한 에러 로깅
              log.error("Manual Fetch POST 요청 본문 JSON 파싱 실패", parseError instanceof Error ? parseError : new Error(String(parseError)), {
                bodyPreview: text.substring(0, 100), // 처음 100자만 로깅
              });
              // JSON 파싱 실패는 인증 실패로 처리하지 않고, providedPassword는 null로 유지
            }
          }
        } catch (error) {
          // request.text() 호출 실패 - 본문이 이미 소비되었거나 다른 문제
          log.error("Manual Fetch POST 요청 본문 읽기 실패", error instanceof Error ? error : new Error(String(error)), {
            hint: "본문이 이미 소비되었거나 요청 형식이 잘못되었을 수 있습니다.",
          });
          // 본문 읽기 실패는 인증 실패로 처리하지 않고, providedPassword는 null로 유지
        }
      }

      if (providedPassword === expectedPassword) {
        isAuthenticated = true;
        authMethod = "password";
      } else if (providedPassword) {
        log.warn("Manual Fetch 잘못된 비밀번호로 접근 시도");
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "인증 실패: 관리자 권한이 필요하거나 올바른 비밀번호를 입력해야 합니다.",
        },
        { status: 401 }
      );
    }

    // 뉴스 수집 시작
    const startTime = Date.now();
    const executionId = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    log.info("Manual Fetch 뉴스 수집 시작", {
      executionId,
      authMethod,
      timestamp: new Date().toISOString(),
    });

    // 타임아웃을 고려한 뉴스 수집 실행
    const TIMEOUT_MS = 280000; // 280초
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`뉴스 수집 작업이 타임아웃되었습니다. (${TIMEOUT_MS / 1000}초 초과)`));
      }, TIMEOUT_MS);
    });

    const fetchPromise = fetchAndSaveNewsAction();

    // Promise.race로 타임아웃 처리
    let result: Awaited<ReturnType<typeof fetchAndSaveNewsAction>>;
    try {
      result = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (timeoutError) {
      const executionTime = Date.now() - startTime;
      log.error("Manual Fetch 타임아웃 발생", timeoutError instanceof Error ? timeoutError : new Error(String(timeoutError)), {
        executionId,
        timeoutMs: TIMEOUT_MS,
        executionTimeMs: executionTime,
      });

      return NextResponse.json(
        {
          success: false,
          message: timeoutError instanceof Error ? timeoutError.message : "타임아웃이 발생했습니다.",
          executionId,
        },
        { status: 504 }
      );
    }

    const executionTime = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: result.data,
          executionId,
          executionTimeMs: executionTime,
        },
        {
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          executionId,
          executionTimeMs: executionTime,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error("Manual Fetch 뉴스 수집 중 오류 발생", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
