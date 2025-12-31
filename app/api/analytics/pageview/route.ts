/**
 * 페이지뷰 추적 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { savePageView, createOrUpdateSession } from '@/lib/db/analytics';
import type { CreatePageViewRequest } from '@/lib/types/analytics';
import { getClientIp } from '@/lib/utils/request-utils';
import { log } from '@/lib/utils/logger';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.session_id || !body.page_path) {
      log.warn('페이지뷰 추적 요청에 필수 필드가 없습니다', {
        hasSessionId: !!body.session_id,
        hasPagePath: !!body.page_path,
      });
      return NextResponse.json(
        { error: 'session_id와 page_path는 필수입니다.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);

    // 세션 생성 또는 업데이트
    try {
      await createOrUpdateSession({
        id: body.session_id,
        user_id: body.user_id || null,
        first_page_path: body.page_path,
        referrer: body.referrer || null,
        user_agent: body.user_agent || null,
        ip_address: ip,
        country: body.country || null,
        device_type: body.device_type || null,
        browser: body.browser || null,
        os: body.os || null,
        screen_width: body.screen_width || null,
        screen_height: body.screen_height || null,
      });
    } catch (sessionError) {
      log.error('세션 생성/업데이트 실패', sessionError);
      // 세션 생성 실패해도 페이지뷰는 저장 시도
    }

    // 페이지뷰 저장
    const pageViewData: CreatePageViewRequest = {
      session_id: body.session_id,
      user_id: body.user_id || null,
      page_path: body.page_path,
      page_title: body.page_title || null,
      referrer: body.referrer || null,
      user_agent: body.user_agent || null,
      ip_address: ip,
      country: body.country || null,
      device_type: body.device_type || null,
      browser: body.browser || null,
      os: body.os || null,
      screen_width: body.screen_width || null,
      screen_height: body.screen_height || null,
      view_duration: body.view_duration || null,
    };

    const pageView = await savePageView(pageViewData);

    return createSuccessResponse(pageView);
  } catch (error) {
    log.error('페이지뷰 추적 API 오류', error);
    return createErrorResponse(error);
  }
});

