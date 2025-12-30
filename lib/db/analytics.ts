/**
 * Analytics 데이터베이스 함수
 */

import { supabaseServer } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';
import type {
  CreatePageViewRequest,
  CreateEventRequest,
  CreateOrUpdateSessionRequest,
  PageView,
  Event,
  Session,
} from '@/lib/types/analytics';
import { hashIpAddress, normalizePagePath } from '@/lib/utils/analytics';

/**
 * 페이지뷰 저장
 */
export async function savePageView(data: CreatePageViewRequest): Promise<PageView> {
  try {
    // IP 주소 해시화
    const hashedIp = hashIpAddress(data.ip_address || null);
    const normalizedPath = normalizePagePath(data.page_path);

    const { data: pageView, error } = await supabaseServer
      .from('page_views')
      .insert({
        session_id: data.session_id,
        user_id: data.user_id || null,
        page_path: normalizedPath,
        page_title: data.page_title || null,
        referrer: data.referrer || null,
        user_agent: data.user_agent || null,
        ip_address: hashedIp,
        country: data.country || null,
        device_type: data.device_type || null,
        browser: data.browser || null,
        os: data.os || null,
        screen_width: data.screen_width || null,
        screen_height: data.screen_height || null,
        view_duration: data.view_duration || null,
      })
      .select()
      .single();

    if (error) {
      log.error('페이지뷰 저장 실패', error);
      throw error;
    }

    // 세션 업데이트 (페이지뷰 수 증가)
    await updateSessionPageViews(data.session_id);

    return pageView as PageView;
  } catch (error) {
    log.error('페이지뷰 저장 중 오류', error);
    throw error;
  }
}

/**
 * 이벤트 저장
 */
export async function saveEvent(data: CreateEventRequest): Promise<Event> {
  try {
    const normalizedPath = normalizePagePath(data.page_path);

    const { data: event, error } = await supabaseServer
      .from('events')
      .insert({
        session_id: data.session_id,
        user_id: data.user_id || null,
        event_type: data.event_type,
        event_name: data.event_name,
        page_path: normalizedPath,
        element_id: data.element_id || null,
        element_class: data.element_class || null,
        element_text: data.element_text || null,
        metadata: data.metadata || null,
      })
      .select()
      .single();

    if (error) {
      log.error('이벤트 저장 실패', error);
      throw error;
    }

    // 세션 업데이트 (이벤트 수 증가)
    await updateSessionEvents(data.session_id);

    return event as Event;
  } catch (error) {
    log.error('이벤트 저장 중 오류', error);
    throw error;
  }
}

/**
 * 세션 생성 또는 업데이트
 */
export async function createOrUpdateSession(data: CreateOrUpdateSessionRequest): Promise<Session> {
  try {
    const hashedIp = hashIpAddress(data.ip_address || null);

    // 기존 세션 확인
    const { data: existingSession } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', data.id)
      .single();

    if (existingSession) {
      // 세션 업데이트 (마지막 활동 시간만 업데이트)
      const { data: session, error } = await supabaseServer
        .from('sessions')
        .update({
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        log.error('세션 업데이트 실패', error);
        throw error;
      }

      return session as Session;
    } else {
      // 새 세션 생성
      const { data: session, error } = await supabaseServer
        .from('sessions')
        .insert({
          id: data.id,
          user_id: data.user_id || null,
          first_page_path: data.first_page_path,
          referrer: data.referrer || null,
          user_agent: data.user_agent || null,
          ip_address: hashedIp,
          country: data.country || null,
          device_type: data.device_type || null,
          browser: data.browser || null,
          os: data.os || null,
          screen_width: data.screen_width || null,
          screen_height: data.screen_height || null,
        })
        .select()
        .single();

      if (error) {
        log.error('세션 생성 실패', error);
        throw error;
      }

      return session as Session;
    }
  } catch (error) {
    log.error('세션 생성/업데이트 중 오류', error);
    throw error;
  }
}

/**
 * 세션 페이지뷰 수 증가
 */
async function updateSessionPageViews(sessionId: string): Promise<void> {
  try {
    await supabaseServer.rpc('increment_session_page_views', {
      session_id: sessionId,
    });
  } catch (error) {
    // RPC 함수가 없을 수 있으므로 직접 업데이트
    const { data: session } = await supabaseServer
      .from('sessions')
      .select('page_views_count')
      .eq('id', sessionId)
      .single();

    if (session) {
      await supabaseServer
        .from('sessions')
        .update({
          page_views_count: (session.page_views_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  }
}

/**
 * 세션 이벤트 수 증가
 */
async function updateSessionEvents(sessionId: string): Promise<void> {
  try {
    await supabaseServer.rpc('increment_session_events', {
      session_id: sessionId,
    });
  } catch (error) {
    // RPC 함수가 없을 수 있으므로 직접 업데이트
    const { data: session } = await supabaseServer
      .from('sessions')
      .select('events_count')
      .eq('id', sessionId)
      .single();

    if (session) {
      await supabaseServer
        .from('sessions')
        .update({
          events_count: (session.events_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
  }
}

/**
 * 세션 종료
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    const { data: session } = await supabaseServer
      .from('sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    if (session) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
      );

      await supabaseServer
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration,
        })
        .eq('id', sessionId);
    }
  } catch (error) {
    log.error('세션 종료 중 오류', error);
  }
}

