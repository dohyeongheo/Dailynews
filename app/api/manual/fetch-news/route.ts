import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveNewsAction } from "@/lib/actions";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { manualFetchNewsSchema, safeParse } from "@/lib/utils/validation";

/**
 * 수동 뉴스 수집 API
 *
 * 비밀번호 인증이 필요합니다.
 *
 * 사용법:
 * GET /api/manual/fetch-news?password=YOUR_PASSWORD
 * 또는
 * POST /api/manual/fetch-news
 * Body: { "password": "YOUR_PASSWORD" }
 *
 * 환경 변수:
 * MANUAL_FETCH_PASSWORD: 수동 뉴스 수집에 사용할 비밀번호
 *
 * 참고: Vercel Serverless Functions는 기본 타임아웃이 10초(Hobby) 또는 60초(Pro)입니다.
 * 뉴스 수집 작업이 오래 걸릴 수 있으므로 maxDuration을 300초로 설정했습니다.
 * (Vercel Pro 플랜의 최대 타임아웃)
 */
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
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

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

    // 비밀번호 확인
    const expectedPassword = process.env.MANUAL_FETCH_PASSWORD;

    if (!expectedPassword) {
      console.error("[Manual Fetch] MANUAL_FETCH_PASSWORD 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json(
        {
          success: false,
          message: "서버 설정 오류: 비밀번호가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    let providedPassword: string | null = null;
    let requestData: unknown;

    if (method === "GET") {
      // GET 요청: 쿼리 파라미터에서 비밀번호 가져오기
      const { searchParams } = new URL(request.url);
      requestData = { password: searchParams.get("password") };
    } else {
      // POST 요청: 요청 본문에서 비밀번호 가져오기
      try {
        requestData = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "요청 본문을 파싱할 수 없습니다. JSON 형식으로 요청해주세요.",
          },
          { status: 400 }
        );
      }
    }

    // Input Validation
    const validationResult = safeParse(manualFetchNewsSchema, requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: `입력 검증 실패: ${validationResult.error}`,
        },
        { status: 400 }
      );
    }

    providedPassword = validationResult.data.password;

    // 비밀번호 확인
    if (!providedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호가 제공되지 않았습니다.",
        },
        { status: 401 }
      );
    }

    if (providedPassword !== expectedPassword) {
      console.warn("[Manual Fetch] 잘못된 비밀번호로 접근 시도:", {
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      });
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호가 올바르지 않습니다.",
        },
        { status: 401 }
      );
    }

    // 뉴스 수집 시작
    const startTime = Date.now();
    const executionId = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log("[Manual Fetch] 뉴스 수집 시작:", {
      executionId,
      timestamp: new Date().toISOString(),
      thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(),
    });

    // 타임아웃을 고려한 뉴스 수집 실행
    // 280초 후 타임아웃 (300초 제한 전에 안전하게 실패 처리)
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
      // 타임아웃 에러 처리
      const executionTime = Date.now() - startTime;
      console.error("[Manual Fetch] 타임아웃 발생:", {
        executionId,
        timeoutMs: TIMEOUT_MS,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          message: timeoutError instanceof Error ? timeoutError.message : "타임아웃이 발생했습니다. 뉴스 수집 작업이 너무 오래 걸렸습니다.",
          executionId,
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString(),
        },
        { status: 504 } // Gateway Timeout
      );
    }

    const executionTime = Date.now() - startTime;

    if (result.success) {
      console.log("[Manual Fetch] 뉴스 수집 성공:", {
        executionId,
        message: result.message,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: result.data,
          executionId,
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString(),
          thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(), // UTC+7
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
      console.error("[Manual Fetch] 뉴스 수집 실패:", {
        executionId,
        message: result.message,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          executionId,
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Manual Fetch] 뉴스 수집 중 오류 발생:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
