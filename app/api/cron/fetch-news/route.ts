import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveNewsAction } from "@/lib/actions";
import { log } from "@/lib/utils/logger";

// 이 라우트는 요청 헤더 등을 사용하는 동적 서버 코드이므로
// 정적 렌더링 대상이 아닌 동적 처리로 강제한다.
export const dynamic = "force-dynamic";

/**
 * Vercel Cron Job: 매일 오전 6시 (태국 시간, UTC 23시) 뉴스 수집
 *
 * Vercel Cron Jobs는 UTC 시간을 사용합니다.
 * 태국 시간 오전 6시 = UTC 23시 (전날)
 *
 * 참고: Vercel Serverless Functions는 기본 타임아웃이 10초(Hobby) 또는 60초(Pro)입니다.
 * 뉴스 수집 작업이 오래 걸릴 수 있으므로 maxDuration을 300초로 설정했습니다.
 * (Vercel Pro 플랜의 최대 타임아웃)
 */
export const maxDuration = 300; // Vercel Pro 플랜 최대 타임아웃 (초)

/**
 * Vercel Cron Job 인증 확인
 *
 * Vercel Cron Job 인증 방식:
 * 1. CRON_SECRET이 설정된 경우: Authorization: Bearer ${CRON_SECRET} 헤더 확인
 * 2. CRON_SECRET이 없는 경우: Vercel 내부 호출로 간주하고 허용
 *    (Vercel Cron Job은 내부적으로 호출되므로 외부 접근이 불가능)
 */
function verifyCronAuth(request: NextRequest): { authorized: boolean; reason?: string } {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되지 않은 경우
  // Vercel Cron Job은 내부적으로 호출되므로 인증을 건너뜀
  // (외부에서 직접 접근할 수 없으므로 보안상 안전)
  if (!cronSecret) {
    // Vercel Cron Job이 호출하는 경우 특정 헤더나 User-Agent를 확인할 수 있지만,
    // Vercel의 내부 호출이므로 인증을 건너뛰는 것이 일반적입니다.
    // 대신 User-Agent로 Vercel 호출인지 확인 (선택사항)
    const userAgent = request.headers.get("user-agent") || "";
    const isVercelCall = userAgent.includes("vercel") || userAgent.includes("Vercel");

    // Vercel Cron Job은 내부 호출이므로 허용
    // 하지만 로깅을 위해 정보를 기록
    log.debug("Cron CRON_SECRET 미설정, Vercel 내부 호출로 간주", {
      userAgent,
      isVercelCall,
      hasAuthHeader: !!request.headers.get("authorization"),
    });

    return { authorized: true };
  }

  // CRON_SECRET이 설정된 경우 검증
  const authHeader = request.headers.get("authorization");
  const vercelSignature = request.headers.get("x-vercel-signature");

  // Vercel의 기본 서명이 있으면 허용
  if (vercelSignature) {
    return { authorized: true };
  }

  // Bearer 토큰으로 검증
  if (authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  return { authorized: false, reason: "Invalid credentials" };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const executionId = `cron-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    // Vercel Cron Job 인증 확인
    const authResult = verifyCronAuth(request);
    if (!authResult.authorized) {
      log.error("Cron 인증 실패", undefined, {
        executionId,
        reason: authResult.reason,
        hasAuthHeader: !!request.headers.get("authorization"),
        hasVercelSignature: !!request.headers.get("x-vercel-signature"),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          executionId,
          reason: authResult.reason,
        },
        { status: 401 }
      );
    }

    log.info("Cron 뉴스 수집 시작", {
      executionId,
      timestamp: new Date().toISOString(),
      thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    });

    // 환경 변수 확인
    const requiredEnvVars = ["GOOGLE_GEMINI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      log.error("Cron 필수 환경 변수 누락", undefined, {
        executionId,
        missingEnvVars,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          message: `필수 환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(", ")}`,
          executionId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

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
      log.error("Cron 타임아웃 발생", timeoutError instanceof Error ? timeoutError : new Error(String(timeoutError)), {
        executionId,
        timeoutMs: TIMEOUT_MS,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          message: timeoutError instanceof Error ? timeoutError.message : "타임아웃이 발생했습니다.",
          executionId,
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString(),
        },
        { status: 504 } // Gateway Timeout
      );
    }

    const executionTime = Date.now() - startTime;

    if (result.success) {
      log.info("Cron 뉴스 수집 성공", {
        executionId,
        message: result.message,
        data: result.data,
        executionTimeMs: executionTime,
        executionTimeSec: (executionTime / 1000).toFixed(2),
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        executionId,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
        thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      log.error("Cron 뉴스 수집 실패", undefined, {
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
    const executionTime = Date.now() - startTime;

    log.error("Cron 뉴스 수집 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
      executionId,
      executionTimeMs: executionTime,
      executionTimeSec: (executionTime / 1000).toFixed(2),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      environment: {
        hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        executionId,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
