import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNewsAction } from '@/lib/actions';

/**
 * Vercel Cron Job: 매일 오후 11시 42분 (태국 시간, UTC 16시 42분) 뉴스 수집
 * 
 * Vercel Cron Jobs는 UTC 시간을 사용합니다.
 * 태국 시간 23:42 = UTC 16:42
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Job 인증 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // CRON_SECRET이 설정되지 않은 경우에도 실행 가능하도록 허용 (개발 환경)
      // 프로덕션에서는 CRON_SECRET을 설정하는 것을 권장합니다
      if (process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] 뉴스 수집 시작:', new Date().toISOString());

    // 오늘 날짜로 뉴스 수집
    const result = await fetchAndSaveNewsAction();

    if (result.success) {
      console.log('[Cron] 뉴스 수집 성공:', result.message);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('[Cron] 뉴스 수집 실패:', result.message);
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Cron] 뉴스 수집 중 오류 발생:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

