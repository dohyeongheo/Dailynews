/**
 * Analytics 통계 조회 API (관리자 전용)
 */

import { NextRequest } from 'next/server';
import { withAdmin, withErrorHandling } from '@/lib/utils/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { supabaseServer } from '@/lib/supabase/server';
import type { AnalyticsFilter, AnalyticsStats } from '@/lib/types/analytics';

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const filter: AnalyticsFilter = {
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
        page_path: searchParams.get('page_path') || undefined,
        event_type: searchParams.get('event_type') || undefined,
        event_name: searchParams.get('event_name') || undefined,
        user_id: searchParams.get('user_id') || undefined,
      };

      // 기본 날짜 범위: 최근 7일
      const endDate = filter.end_date ? new Date(filter.end_date) : new Date();
      const startDate = filter.start_date
        ? new Date(filter.start_date)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 페이지뷰 통계
      let pageViewsQuery = supabaseServer
        .from('page_views')
        .select('*', { count: 'exact', head: false })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filter.page_path) {
        pageViewsQuery = pageViewsQuery.eq('page_path', filter.page_path);
      }

      const { data: pageViews, count: totalPageViews } = await pageViewsQuery;

      // 고유 방문자 수 (세션 수)
      let sessionsQuery = supabaseServer
        .from('sessions')
        .select('id', { count: 'exact', head: false })
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      const { count: uniqueVisitors } = await sessionsQuery;

      // 고유 사용자 수 (로그인한 사용자)
      let usersQuery = supabaseServer
        .from('page_views')
        .select('user_id', { count: 'exact', head: false })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('user_id', 'is', null);

      if (filter.user_id) {
        usersQuery = usersQuery.eq('user_id', filter.user_id);
      }

      const { data: userViews } = await usersQuery;
      const uniqueUsers = new Set(userViews?.map((v) => v.user_id).filter(Boolean) || []).size;

      // 총 세션 수
      const { count: totalSessions } = await sessionsQuery;

      // 평균 세션 지속 시간
      const { data: sessions } = await supabaseServer
        .from('sessions')
        .select('duration')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .not('duration', 'is', null);

      const avgSessionDuration =
        sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
          : null;

      // 이탈률 (단일 페이지뷰 세션 비율)
      const { data: singlePageViewSessions } = await supabaseServer
        .from('sessions')
        .select('page_views_count')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      const bounceRate =
        singlePageViewSessions && singlePageViewSessions.length > 0
          ? (singlePageViewSessions.filter((s) => s.page_views_count === 1).length /
              singlePageViewSessions.length) *
            100
          : null;

      // 인기 페이지
      const { data: pageViewsData } = await pageViewsQuery;
      const pageViewsMap = new Map<string, number>();
      pageViewsData?.forEach((pv) => {
        const count = pageViewsMap.get(pv.page_path) || 0;
        pageViewsMap.set(pv.page_path, count + 1);
      });
      const topPages = Array.from(pageViewsMap.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // 인기 이벤트
      let eventsQuery = supabaseServer
        .from('events')
        .select('event_name')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (filter.event_type) {
        eventsQuery = eventsQuery.eq('event_type', filter.event_type);
      }
      if (filter.event_name) {
        eventsQuery = eventsQuery.eq('event_name', filter.event_name);
      }

      const { data: eventsData } = await eventsQuery;
      const eventsMap = new Map<string, number>();
      eventsData?.forEach((e) => {
        const count = eventsMap.get(e.event_name) || 0;
        eventsMap.set(e.event_name, count + 1);
      });
      const topEvents = Array.from(eventsMap.entries())
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 디바이스 타입별 통계
      const { data: deviceData } = await supabaseServer
        .from('page_views')
        .select('device_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('device_type', 'is', null);

      const deviceTypes: Record<string, number> = {};
      deviceData?.forEach((d) => {
        const type = d.device_type || 'unknown';
        deviceTypes[type] = (deviceTypes[type] || 0) + 1;
      });

      // 국가별 통계
      const { data: countryData } = await supabaseServer
        .from('page_views')
        .select('country')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('country', 'is', null);

      const countries: Record<string, number> = {};
      countryData?.forEach((c) => {
        const country = c.country || 'unknown';
        countries[country] = (countries[country] || 0) + 1;
      });

      const stats: AnalyticsStats = {
        total_page_views: totalPageViews || 0,
        unique_visitors: uniqueVisitors || 0,
        unique_users: uniqueUsers,
        total_sessions: totalSessions || 0,
        avg_session_duration: avgSessionDuration,
        bounce_rate: bounceRate,
        top_pages: topPages,
        top_events: topEvents,
        device_types: deviceTypes,
        countries: countries,
      };

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);





