import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNewsAction } from '@/lib/actions';

/**
 * Cron 테스트용 엔드포인트
 * 수동으로 호출하여 cron 기능을 테스트할 수 있습니다.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Cron Test] 뉴스 수집 시작:', new Date().toISOString());

    // 오늘 날짜로 뉴스 수집
    const result = await fetchAndSaveNewsAction();

    if (result.success) {
      console.log('[Cron Test] 뉴스 수집 성공:', result.message);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(), // UTC+7
      });
    } else {
      console.error('[Cron Test] 뉴스 수집 실패:', result.message);
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
    console.error('[Cron Test] 뉴스 수집 중 오류 발생:', error);
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

