/**
 * 이벤트 추적 API
 */

import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { saveEvent } from '@/lib/db/analytics';
import type { CreateEventRequest } from '@/lib/types/analytics';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();

    const eventData: CreateEventRequest = {
      session_id: body.session_id,
      user_id: body.user_id || null,
      event_type: body.event_type || 'custom',
      event_name: body.event_name,
      page_path: body.page_path,
      element_id: body.element_id || null,
      element_class: body.element_class || null,
      element_text: body.element_text || null,
      metadata: body.metadata || null,
    };

    const event = await saveEvent(eventData);

    return createSuccessResponse(event);
  } catch (error) {
    return createErrorResponse(error);
  }
});





