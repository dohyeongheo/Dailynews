-- Gemini API 사용량 추적 및 비용 알림을 위한 테이블 생성

-- 1. gemini_usage_logs 테이블 (API 호출 로그)
CREATE TABLE IF NOT EXISTS gemini_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL, -- 'gemini-2.5-pro' | 'gemini-2.5-flash'
  task_type TEXT NOT NULL, -- 'news_collection' | 'translation' | 'prompt_generation'
  input_tokens INTEGER, -- 입력 토큰 수
  output_tokens INTEGER, -- 출력 토큰 수
  total_tokens INTEGER, -- 총 토큰 수
  estimated_cost NUMERIC, -- 추정 비용 (원)
  response_time_ms INTEGER, -- 응답 시간 (밀리초)
  success BOOLEAN DEFAULT true, -- 성공 여부
  error_message TEXT, -- 에러 메시지 (실패 시)
  metadata JSONB, -- 추가 메타데이터 (예: 캐시 키, 프롬프트 길이 등)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_model ON gemini_usage_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_task_type ON gemini_usage_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_created_at ON gemini_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_model_task_created ON gemini_usage_logs(model_name, task_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gemini_usage_logs_success ON gemini_usage_logs(success);

-- 2. cost_alerts 테이블 (알림 이력)
CREATE TABLE IF NOT EXISTS cost_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'budget_exceeded' | 'cost_spike' | 'usage_spike'
  alert_level TEXT NOT NULL, -- 'warning' | 'critical'
  message TEXT NOT NULL, -- 알림 메시지
  cost_amount NUMERIC, -- 비용 금액 (원)
  threshold_amount NUMERIC, -- 임계값 (원)
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  period_start DATE NOT NULL, -- 기간 시작일
  period_end DATE NOT NULL, -- 기간 종료일
  metadata JSONB, -- 추가 메타데이터
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- 알림 발송 시간
  acknowledged_at TIMESTAMPTZ, -- 확인 시간
  acknowledged_by TEXT -- 확인한 사용자
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cost_alerts_type ON cost_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_level ON cost_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_sent_at ON cost_alerts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_period ON cost_alerts(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_acknowledged ON cost_alerts(acknowledged_at);

-- 3. cost_budgets 테이블 (예산 설정 - 하드 코딩이지만 나중에 변경 가능성을 위해)
CREATE TABLE IF NOT EXISTS cost_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_type TEXT NOT NULL UNIQUE, -- 'monthly' | 'daily' | 'weekly'
  amount NUMERIC NOT NULL, -- 예산 금액 (원)
  alert_threshold NUMERIC NOT NULL, -- 알림 임계값 (원)
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  description TEXT, -- 설명
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 기본 예산 설정 삽입 (하드 코딩된 값)
INSERT INTO cost_budgets (budget_type, amount, alert_threshold, is_active, description)
VALUES
  ('monthly', 40000, 30000, true, '월별 예산: 40,000원, 알림 임계값: 30,000원')
ON CONFLICT (budget_type) DO UPDATE
SET
  amount = EXCLUDED.amount,
  alert_threshold = EXCLUDED.alert_threshold,
  updated_at = NOW();

-- RLS 활성화 (서버 사이드 접근은 Service Role Key로 RLS 우회)
ALTER TABLE public.gemini_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_budgets ENABLE ROW LEVEL SECURITY;

-- RLS 정책: anon key로의 직접 접근 차단 (서버 사이드만 접근 가능)
CREATE POLICY "gemini_usage_logs_block_anon" ON public.gemini_usage_logs
  FOR ALL
  USING (false);

CREATE POLICY "cost_alerts_block_anon" ON public.cost_alerts
  FOR ALL
  USING (false);

CREATE POLICY "cost_budgets_block_anon" ON public.cost_budgets
  FOR ALL
  USING (false);

