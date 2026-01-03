/**
 * 웹 분석(Web Analytics) 관련 타입 정의
 */

/**
 * 페이지뷰 데이터
 */
export interface PageView {
  id: string;
  session_id: string;
  user_id: string | null;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  screen_height: number | null;
  view_duration: number | null;
  created_at: string;
}

/**
 * 이벤트 데이터
 */
export interface Event {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: 'click' | 'search' | 'bookmark' | 'comment' | 'reaction' | 'share' | 'scroll' | 'custom';
  event_name: string;
  page_path: string;
  element_id: string | null;
  element_class: string | null;
  element_text: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * 세션 데이터
 */
export interface Session {
  id: string;
  user_id: string | null;
  first_page_path: string;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  screen_height: number | null;
  page_views_count: number;
  events_count: number;
  duration: number | null;
  started_at: string;
  ended_at: string | null;
  last_activity_at: string;
}

/**
 * 일별 집계 데이터
 */
export interface AnalyticsDailySummary {
  id: string;
  date: string;
  total_page_views: number;
  unique_visitors: number;
  unique_users: number;
  total_sessions: number;
  avg_session_duration: number | null;
  bounce_rate: number | null;
  top_pages: Array<{ path: string; views: number }> | null;
  top_categories: Array<{ category: string; count: number }> | null;
  top_events: Array<{ event_name: string; count: number }> | null;
  device_types: Record<string, number> | null;
  countries: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

/**
 * 페이지뷰 생성 요청 데이터
 */
export interface CreatePageViewRequest {
  session_id: string;
  user_id?: string | null;
  page_path: string;
  page_title?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  country?: string | null;
  device_type?: 'desktop' | 'mobile' | 'tablet' | null;
  browser?: string | null;
  os?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  view_duration?: number | null;
}

/**
 * 이벤트 생성 요청 데이터
 */
export interface CreateEventRequest {
  session_id: string;
  user_id?: string | null;
  event_type: 'click' | 'search' | 'bookmark' | 'comment' | 'reaction' | 'share' | 'scroll' | 'custom';
  event_name: string;
  page_path: string;
  element_id?: string | null;
  element_class?: string | null;
  element_text?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * 세션 생성/업데이트 요청 데이터
 */
export interface CreateOrUpdateSessionRequest {
  id: string;
  user_id?: string | null;
  first_page_path: string;
  referrer?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  country?: string | null;
  device_type?: 'desktop' | 'mobile' | 'tablet' | null;
  browser?: string | null;
  os?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
}

/**
 * 디바이스 정보
 */
export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet' | null;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  screen_height: number | null;
}

/**
 * Analytics 통계 필터
 */
export interface AnalyticsFilter {
  start_date?: string;
  end_date?: string;
  page_path?: string;
  event_type?: string;
  event_name?: string;
  user_id?: string;
}

/**
 * Analytics 통계 응답
 */
export interface AnalyticsStats {
  total_page_views: number;
  unique_visitors: number;
  unique_users: number;
  total_sessions: number;
  avg_session_duration: number | null;
  bounce_rate: number | null;
  top_pages: Array<{ path: string; views: number }>;
  top_events: Array<{ event_name: string; count: number }>;
  device_types: Record<string, number>;
  countries: Record<string, number>;
}






