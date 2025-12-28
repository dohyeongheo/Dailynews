-- 메트릭 히스토리 테이블 생성
-- 성능 메트릭 및 비즈니스 메트릭의 시간별 스냅샷을 저장

CREATE TABLE IF NOT EXISTS metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'performance' | 'business' | 'system'
  metric_name TEXT NOT NULL, -- 'api_response_time' | 'news_collection_success_rate' | 'image_generation_success_rate' | 'total_news' 등
  metric_value NUMERIC NOT NULL, -- 메트릭 값
  metadata JSONB, -- 추가 메타데이터 (예: API 엔드포인트, 카테고리별 통계 등)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_metrics_history_type ON metrics_history(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_history_name ON metrics_history(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_history_created_at ON metrics_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_history_type_name_created ON metrics_history(metric_type, metric_name, created_at DESC);

-- RLS 활성화 (서버 사이드 접근은 Service Role Key로 RLS 우회)
ALTER TABLE public.metrics_history ENABLE ROW LEVEL SECURITY;

-- metrics_history: anon key로의 직접 접근 차단
CREATE POLICY "metrics_history_block_anon" ON public.metrics_history
  FOR ALL
  USING (false);


