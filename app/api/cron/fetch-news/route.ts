import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNewsAction } from '@/lib/actions';

/**
 * Vercel Cron Job: 매일 오전 7시 40분 (태국 시간, UTC 00시 40분) 뉴스 수집
 *
 * Vercel Cron Jobs는 UTC 시간을 사용합니다.
 * 태국 시간 오전 7시 40분 = UTC 00시 40분
 * 
 * 참고: Vercel Serverless Functions는 기본 타임아웃이 10초(Hobby) 또는 60초(Pro)입니다.
 * 뉴스 수집 작업이 오래 걸릴 수 있으므로 타임아웃 처리를 포함했습니다.
 */
export const maxDuration = 60; // Vercel Pro 플랜 최대 타임아웃 (초)

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let executionId = `cron-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  try {
    // Vercel Cron Job 인증 확인
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel Cron Job은 자동으로 authorization 헤더를 추가합니다
    // 하지만 CRON_SECRET이 설정된 경우 검증합니다
    if (cronSecret) {
      const vercelAuthHeader = request.headers.get('x-vercel-signature');
      if (!vercelAuthHeader && authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] 인증 실패:', {
          executionId,
          hasAuthHeader: !!authHeader,
          hasVercelSignature: !!vercelAuthHeader,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { 
            success: false,
            error: 'Unauthorized',
            executionId,
          }, 
          { status: 401 }
        );
      }
    }

    console.log('[Cron] 뉴스 수집 시작:', {
      executionId,
      timestamp: new Date().toISOString(),
      thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(),
    });

    // 환경 변수 확인
    const requiredEnvVars = [
      'GOOGLE_GEMINI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      console.error('[Cron] 필수 환경 변수 누락:', {
        executionId,
        missingEnvVars,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          message: `필수 환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}`,
          executionId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // 타임아웃을 고려한 뉴스 수집 실행
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('뉴스 수집 작업이 타임아웃되었습니다. (60초 초과)'));
      }, 55000); // 55초 후 타임아웃 (60초 제한 전에 실패 처리)
    });

    const fetchPromise = fetchAndSaveNewsAction();
    
    // Promise.race로 타임아웃 처리
    const result = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<ReturnType<typeof fetchAndSaveNewsAction>>;

    const executionTime = Date.now() - startTime;

    if (result.success) {
      console.log('[Cron] 뉴스 수집 성공:', {
        executionId,
        message: result.message,
        data: result.data,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
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
      console.error('[Cron] 뉴스 수집 실패:', {
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
    
    console.error('[Cron] 뉴스 수집 중 오류 발생:', {
      executionId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        executionId,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

