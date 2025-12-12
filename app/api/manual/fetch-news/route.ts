import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNewsAction } from '@/lib/actions';

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
 */
export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

async function handleRequest(request: NextRequest, method: 'GET' | 'POST') {
  try {
    // 비밀번호 확인
    const expectedPassword = process.env.MANUAL_FETCH_PASSWORD;

    if (!expectedPassword) {
      console.error('[Manual Fetch] MANUAL_FETCH_PASSWORD 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        {
          success: false,
          message: '서버 설정 오류: 비밀번호가 설정되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    let providedPassword: string | null = null;

    if (method === 'GET') {
      // GET 요청: 쿼리 파라미터에서 비밀번호 가져오기
      const { searchParams } = new URL(request.url);
      providedPassword = searchParams.get('password');
    } else {
      // POST 요청: 요청 본문에서 비밀번호 가져오기
      try {
        const body = await request.json();
        providedPassword = body.password || null;
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: '요청 본문을 파싱할 수 없습니다. JSON 형식으로 요청해주세요.',
          },
          { status: 400 }
        );
      }
    }

    // 비밀번호 확인
    if (!providedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 제공되지 않았습니다.',
        },
        { status: 401 }
      );
    }

    if (providedPassword !== expectedPassword) {
      console.warn('[Manual Fetch] 잘못된 비밀번호로 접근 시도:', {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 올바르지 않습니다.',
        },
        { status: 401 }
      );
    }

    // 뉴스 수집 시작
    console.log('[Manual Fetch] 뉴스 수집 시작:', new Date().toISOString());

    const result = await fetchAndSaveNewsAction();

    if (result.success) {
      console.log('[Manual Fetch] 뉴스 수집 성공:', result.message);
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        thailandTime: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString(), // UTC+7
      });
    } else {
      console.error('[Manual Fetch] 뉴스 수집 실패:', result.message);
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
    console.error('[Manual Fetch] 뉴스 수집 중 오류 발생:', error);
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

