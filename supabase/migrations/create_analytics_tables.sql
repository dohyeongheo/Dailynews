-- 웹 분석(Web Analytics) 테이블 생성
-- 페이지뷰, 이벤트, 세션 추적을 위한 테이블

-- 1. page_views 테이블 (페이지뷰 추적)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- 세션 식별자
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 로그인한 사용자 (선택사항)
  page_path TEXT NOT NULL, -- 페이지 경로 (예: /news/123)
  page_title TEXT, -- 페이지 제목
  referrer TEXT, -- 이전 페이지 URL
  user_agent TEXT, -- 브라우저 정보
  ip_address INET, -- IP 주소 (개인정보 보호를 위해 해시화 가능)
  country TEXT, -- 국가 (IP 기반, 선택사항)
  device_type TEXT, -- 'desktop' | 'mobile' | 'tablet'
  browser TEXT, -- 브라우저 이름
  os TEXT, -- 운영체제
  screen_width INTEGER, -- 화면 너비
  screen_height INTEGER, -- 화면 높이
  view_duration INTEGER, -- 페이지 체류 시간 (초)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path_created ON page_views(page_path, created_at DESC);

-- 2. events 테이블 (사용자 이벤트 추적)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'click' | 'search' | 'bookmark' | 'comment' | 'reaction' | 'share' | 'scroll' 등
  event_name TEXT NOT NULL, -- 이벤트 이름 (예: 'news_click', 'search_submit')
  page_path TEXT NOT NULL, -- 이벤트가 발생한 페이지
  element_id TEXT, -- 클릭한 요소 ID
  element_class TEXT, -- 클릭한 요소 클래스
  element_text TEXT, -- 클릭한 요소 텍스트
  metadata JSONB, -- 추가 메타데이터 (예: 검색어, 뉴스 ID, 카테고리 등)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_name_created ON events(event_type, event_name, created_at DESC);

-- 3. sessions 테이블 (사용자 세션 추적)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- session_id
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_page_path TEXT NOT NULL, -- 첫 방문 페이지
  referrer TEXT, -- 유입 경로
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  page_views_count INTEGER DEFAULT 0, -- 페이지뷰 수
  events_count INTEGER DEFAULT 0, -- 이벤트 수
  duration INTEGER, -- 세션 지속 시간 (초)
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ, -- 세션 종료 시간
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL -- 마지막 활동 시간
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at DESC);

-- 4. analytics_daily_summary 테이블 (일별 집계 데이터 - 성능 최적화)
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0, -- 고유 세션 수
  unique_users INTEGER DEFAULT 0, -- 로그인한 고유 사용자 수
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration NUMERIC, -- 평균 세션 지속 시간 (초)
  bounce_rate NUMERIC, -- 이탈률 (단일 페이지뷰 세션 비율)
  top_pages JSONB, -- 인기 페이지 (예: [{"path": "/news/123", "views": 100}])
  top_categories JSONB, -- 인기 카테고리
  top_events JSONB, -- 인기 이벤트
  device_types JSONB, -- 디바이스 타입별 통계
  countries JSONB, -- 국가별 통계
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_date ON analytics_daily_summary(date DESC);

-- RLS 활성화 (서버 사이드 접근은 Service Role Key로 RLS 우회)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- RLS 정책: anon key로의 직접 접근 차단 (서버 사이드만 접근 가능)
CREATE POLICY "page_views_block_anon" ON public.page_views
  FOR ALL
  USING (false);

CREATE POLICY "events_block_anon" ON public.events
  FOR ALL
  USING (false);

CREATE POLICY "sessions_block_anon" ON public.sessions
  FOR ALL
  USING (false);

CREATE POLICY "analytics_daily_summary_block_anon" ON public.analytics_daily_summary
  FOR ALL
  USING (false);

