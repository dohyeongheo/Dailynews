# Gemini API 비용 모니터링 시스템 가이드

**작성일**: 2025-12-31
**프로젝트**: Dailynews

## 개요

Gemini API 비용 모니터링 시스템은 Google Cloud MCP 서버를 활용하여 Gemini API 호출량과 과금 정보를 실시간으로 모니터링하고, 비용 절감을 위한 알림 및 분석 도구를 제공합니다.

---

## 주요 기능

### 1. 자동 사용량 추적

- Gemini API 호출 시 자동으로 사용량 추적
- 토큰 사용량, 모델별 호출 횟수, 비용 추정 저장
- 작업 유형별 분류 (뉴스 수집, 번역, 프롬프트 생성)

### 2. 비용 분석

- 일별/주별/월별 비용 추이 분석
- 모델별 비용 비교 (Pro vs Flash)
- 작업 유형별 비용 분석
- 비용 절감 제안 생성

### 3. 알림 시스템

- **예산 초과 알림**: 월별 예산 40,000원 초과 시
- **비용 급증 알림**: 일별 비용이 30,000원 초과 시
- 알림 이력 관리

### 4. 관리자 대시보드

- 실시간 비용 표시
- 비용 추이 차트
- 모델별 사용량 비교
- 작업 유형별 비용 분석
- 비용 절감 제안 표시

---

## 설정값

### 하드 코딩된 설정

- **비용 알림 임계값**: 30,000원 (3만원)
- **월별 예산**: 40,000원 (4만원)

설정 파일: `lib/utils/cost-alert.ts`

---

## 데이터베이스 스키마

### 테이블 구조

#### 1. `gemini_usage_logs`

API 호출 로그를 저장합니다.

- `id`: UUID (Primary Key)
- `model_name`: 모델 이름 (예: "gemini-2.5-pro", "gemini-2.5-flash")
- `task_type`: 작업 유형 ("news_collection", "translation", "prompt_generation")
- `input_tokens`: 입력 토큰 수
- `output_tokens`: 출력 토큰 수
- `total_tokens`: 총 토큰 수
- `estimated_cost`: 추정 비용 (원)
- `response_time_ms`: 응답 시간 (밀리초)
- `success`: 성공 여부
- `error_message`: 에러 메시지 (실패 시)
- `metadata`: 추가 메타데이터 (JSONB)
- `created_at`: 생성 시간

#### 2. `cost_alerts`

알림 이력을 저장합니다.

- `id`: UUID (Primary Key)
- `alert_type`: 알림 타입 ("budget_exceeded", "cost_spike", "usage_spike")
- `alert_level`: 알림 레벨 ("warning", "critical")
- `message`: 알림 메시지
- `cost_amount`: 비용 금액 (원)
- `threshold_amount`: 임계값 (원)
- `period_type`: 기간 타입 ("daily", "weekly", "monthly")
- `period_start`: 기간 시작일
- `period_end`: 기간 종료일
- `metadata`: 추가 메타데이터 (JSONB)
- `sent_at`: 알림 발송 시간
- `acknowledged_at`: 확인 시간
- `acknowledged_by`: 확인한 사용자

#### 3. `cost_budgets`

예산 설정을 저장합니다 (하드 코딩된 값으로 초기화됨).

- `id`: UUID (Primary Key)
- `budget_type`: 예산 타입 ("monthly", "daily", "weekly")
- `amount`: 예산 금액 (원)
- `alert_threshold`: 알림 임계값 (원)
- `is_active`: 활성화 여부
- `description`: 설명
- `created_at`: 생성 시간
- `updated_at`: 업데이트 시간

---

## 사용 방법

### 1. 관리자 대시보드

1. 관리자 페이지 접속: `/admin`
2. "비용 모니터링" 탭 클릭
3. 기간 선택 (일별/주별/월별)
4. 비용 통계 및 제안 확인

### 2. API 엔드포인트

#### 비용 조회 API

```
GET /api/admin/cost?period=daily|weekly|monthly&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "summary": {
      "totalCost": 35000,
      "totalTokens": 1500000,
      "totalCalls": 500,
      "currentMonthCost": 35000,
      "monthlyBudget": 40000,
      "alertThreshold": 30000,
      "budgetUsage": 87.5
    },
    "dailyStats": [...],
    "modelStats": [...],
    "taskStats": [...],
    "suggestions": [...],
    "recentAlerts": [...]
  }
}
```

### 3. 유틸리티 스크립트

#### 비용 조회 스크립트

```bash
npm run tsx scripts/admin/check-gemini-cost.ts
```

#### 사용량 분석 스크립트

```bash
npm run tsx scripts/admin/analyze-gemini-usage.ts
```

---

## 비용 추정 방법

### 토큰 가격 (2025년 기준, 환율 8,000원 가정)

#### Gemini 2.5 Pro
- 입력: $0.125 per 1M tokens (약 1,000원/1M 토큰)
- 출력: $0.5 per 1M tokens (약 4,000원/1M 토큰)

#### Gemini 2.5 Flash
- 입력: $0.075 per 1M tokens (약 600원/1M 토큰)
- 출력: $0.3 per 1M tokens (약 2,400원/1M 토큰)

**참고**: 실제 가격은 Google Cloud 가격 정책에 따라 변경될 수 있습니다. 최신 가격은 [Google Cloud 가격 페이지](https://cloud.google.com/vertex-ai/pricing)를 확인하세요.

---

## 알림 시스템

### 알림 조건

1. **예산 초과 알림**
   - 월별 비용이 40,000원을 초과할 때
   - 알림 레벨: 예산의 150% 초과 시 "critical", 그 외 "warning"

2. **비용 급증 알림**
   - 일별 비용이 30,000원을 초과할 때
   - 알림 레벨: 임계값의 150% 초과 시 "critical", 그 외 "warning"

### 알림 확인

관리자 대시보드의 "비용 모니터링" 탭에서 최근 알림을 확인할 수 있습니다.

---

## 비용 절감 제안

시스템은 다음 기준으로 비용 절감 제안을 생성합니다:

1. **모델 전환 제안**
   - Pro 모델이 Flash보다 20% 이상 비쌀 때
   - 단순 작업은 Flash 모델로 전환 제안

2. **에러 감소 제안**
   - 에러율이 5% 이상일 때
   - 에러 감소로 인한 비용 절감 제안

3. **캐시 최적화 제안**
   - 번역 작업이 많을 때
   - Context Caching 활용 강화 제안

4. **배치 처리 제안**
   - 뉴스 수집 작업이 많을 때
   - 배치 처리로 비용 절감 제안

---

## Google Cloud MCP 서버 연동

### 사용 가능한 MCP 서버

1. **gcp-general** (`@google-cloud/gcloud-mcp`)
   - Billing Account 정보 조회
   - 프로젝트 빌링 정보 확인

2. **gcp-observability** (`@google-cloud/observability-mcp`)
   - API 호출 횟수 조회
   - 에러율 모니터링
   - 응답 시간 추적

### MCP 서버 사용 예시

```
"gcp-general MCP로 프로젝트의 빌링 정보를 확인해줘"
"gcp-observability MCP로 Gemini API 호출 횟수를 조회해줘"
```

---

## 문제 해결

### 문제 1: 사용량 로그가 저장되지 않음

**원인**: 데이터베이스 연결 문제 또는 권한 문제

**해결 방법**:
1. Supabase 연결 확인
2. 서비스 계정 권한 확인
3. 로그 확인: `lib/utils/gemini-usage-tracker.ts`

### 문제 2: 비용 추정이 부정확함

**원인**: 토큰 가격 정보가 오래됨

**해결 방법**:
1. `lib/utils/gemini-usage-tracker.ts`의 `TOKEN_PRICES` 업데이트
2. 최신 가격 정보 확인: [Google Cloud 가격 페이지](https://cloud.google.com/vertex-ai/pricing)

### 문제 3: 알림이 발송되지 않음

**원인**: 알림 조건 미충족 또는 데이터베이스 저장 실패

**해결 방법**:
1. 알림 조건 확인: `lib/utils/cost-alert.ts`
2. 데이터베이스 로그 확인
3. 수동으로 알림 확인 스크립트 실행

---

## 참고 파일

- `lib/utils/gemini-usage-tracker.ts` - 사용량 추적 모듈
- `lib/utils/cost-analyzer.ts` - 비용 분석 모듈
- `lib/utils/cost-alert.ts` - 알림 시스템
- `lib/gcp/billing-client.ts` - Billing API 클라이언트
- `lib/gcp/monitoring-client.ts` - Monitoring API 클라이언트
- `app/api/admin/cost/route.ts` - 비용 조회 API
- `components/admin/CostMonitoring.tsx` - 관리자 대시보드 컴포넌트
- `supabase/migrations/add_gemini_usage_tracking.sql` - 데이터베이스 스키마

---

## 향후 개선 사항

1. **실시간 비용 조회**: Cloud Billing API 직접 연동
2. **자동 알림 발송**: Email/Slack 알림 추가
3. **비용 예측**: 머신러닝 기반 비용 예측
4. **자동 최적화**: 비용 절감 제안 자동 적용

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31


