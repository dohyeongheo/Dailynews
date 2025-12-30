/**
 * 페이지뷰 추적 API
 */

import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { savePageView, createOrUpdateSession } from '@/lib/db/analytics';
import type { CreatePageViewRequest } from '@/lib/types/analytics';
import { getClientIp } from '@/lib/utils/request-utils';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const ip = getClientIp(request);

    // 세션 생성 또는 업데이트
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
    return createErrorResponse(error);
  }
});

