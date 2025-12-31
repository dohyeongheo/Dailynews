/**
 * 세션 관리 API
 */

import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { createOrUpdateSession, endSession } from '@/lib/db/analytics';
import type { CreateOrUpdateSessionRequest } from '@/lib/types/analytics';
import { getClientIp } from '@/lib/utils/request-utils';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const action = body.action || 'create'; // 'create' | 'end'

    if (action === 'end') {
      // 세션 종료
      await endSession(body.session_id);
      return createSuccessResponse({ success: true });
    }

    // 세션 생성 또는 업데이트
    const ip = getClientIp(request);

    const sessionData: CreateOrUpdateSessionRequest = {
      id: body.session_id,
      user_id: body.user_id || null,
      first_page_path: body.first_page_path,
      referrer: body.referrer || null,
      user_agent: body.user_agent || null,
      ip_address: ip,
      country: body.country || null,
      device_type: body.device_type || null,
      browser: body.browser || null,
      os: body.os || null,
      screen_width: body.screen_width || null,
      screen_height: body.screen_height || null,
    };

    const session = await createOrUpdateSession(sessionData);

    return createSuccessResponse(session);
  } catch (error) {
    return createErrorResponse(error);
  }
});


