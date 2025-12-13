# API 문서

## 개요

Daily News 서비스의 API 엔드포인트 문서입니다.

## 엔드포인트

### 1. 수동 뉴스 수집 API

뉴스를 수동으로 수집하는 API입니다.

**엔드포인트:** `/api/manual/fetch-news`

**메서드:** `GET` 또는 `POST`

**인증:** 비밀번호 인증 필요 (`MANUAL_FETCH_PASSWORD`)

**Rate Limit:** 10분에 5회 요청

#### GET 요청

```bash
GET /api/manual/fetch-news?password=YOUR_PASSWORD
```

#### POST 요청

```bash
POST /api/manual/fetch-news
Content-Type: application/json

{
  "password": "YOUR_PASSWORD"
}
```

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "90개의 뉴스 중 85개가 성공적으로 저장되었습니다.",
  "data": {
    "success": 85,
    "failed": 5,
    "total": 90
  },
  "executionId": "manual-1234567890-abc123",
  "executionTimeMs": 45000,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "thailandTime": "2025-01-01T07:00:00.000Z"
}
```

**실패 (401 Unauthorized):**
```json
{
  "success": false,
  "message": "비밀번호가 올바르지 않습니다."
}
```

**Rate Limit 초과 (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "요청 한도를 초과했습니다. 300초 후 다시 시도해주세요."
}
```

#### 헤더

- `X-RateLimit-Limit`: 최대 요청 수
- `X-RateLimit-Remaining`: 남은 요청 수
- `X-RateLimit-Reset`: 리셋 시간 (Unix timestamp)
- `Retry-After`: 재시도 가능 시간 (초)

---

### 2. Cron Job 뉴스 수집 API

자동 뉴스 수집을 위한 Cron Job API입니다.

**엔드포인트:** `/api/cron/fetch-news`

**메서드:** `GET`

**인증:** Vercel Cron Job 인증 또는 `CRON_SECRET`

**스케줄:** 매일 오전 6시 (태국 시간, UTC 23시)

#### 요청

```bash
GET /api/cron/fetch-news
Authorization: Bearer YOUR_CRON_SECRET
```

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "90개의 뉴스 중 85개가 성공적으로 저장되었습니다.",
  "data": {
    "success": 85,
    "failed": 5,
    "total": 90
  },
  "executionId": "cron-1234567890-abc123",
  "executionTimeMs": 45000,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**실패 (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "executionId": "cron-1234567890-abc123",
  "reason": "Invalid credentials"
}
```

---

## Server Actions

### 1. 뉴스 수집 및 저장

**함수:** `fetchAndSaveNewsAction(date?: string)`

**설명:** Google Gemini API를 통해 뉴스를 수집하고 데이터베이스에 저장합니다.

**파라미터:**
- `date` (선택): 수집할 뉴스의 날짜 (YYYY-MM-DD 형식). 기본값은 오늘 날짜.

**반환값:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    success: number;
    failed: number;
    total: number;
  } | null;
}
```

### 2. 카테고리별 뉴스 조회

**함수:** `getNewsByCategoryAction(category: NewsCategory, limit?: number, offset?: number)`

**설명:** 특정 카테고리의 뉴스를 조회합니다.

**파라미터:**
- `category`: 뉴스 카테고리 (`'태국뉴스' | '관련뉴스' | '한국뉴스'`)
- `limit`: 조회할 뉴스 개수 (기본값: 10)
- `offset`: 오프셋 (기본값: 0)

**반환값:**
```typescript
{
  success: boolean;
  data: News[] | null;
  error?: string;
}
```

### 3. 뉴스 검색

**함수:** `searchNewsAction(query: string, searchType?: 'title' | 'content' | 'all', limit?: number)`

**설명:** 뉴스를 검색합니다.

**파라미터:**
- `query`: 검색어
- `searchType`: 검색 타입 (기본값: `'all'`)
- `limit`: 조회할 뉴스 개수 (기본값: 100)

**반환값:**
```typescript
{
  success: boolean;
  data: News[] | null;
  error?: string;
}
```

---

## 에러 코드

| HTTP 상태 코드 | 설명 |
|--------------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (입력 검증 실패) |
| 401 | 인증 실패 |
| 429 | Rate Limit 초과 |
| 500 | 서버 오류 |
| 504 | Gateway Timeout (요청 시간 초과) |

---

## Rate Limiting

수동 뉴스 수집 API는 Rate Limiting이 적용됩니다:
- **최대 요청 수:** 5회
- **시간 윈도우:** 10분
- **식별자:** 클라이언트 IP 주소

Rate Limit 초과 시 `429 Too Many Requests` 응답과 함께 `Retry-After` 헤더가 반환됩니다.

---

## 환경 변수

### 필수 환경 변수

- `GOOGLE_GEMINI_API_KEY`: Google Gemini API 키
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

### 선택적 환경 변수

- `MANUAL_FETCH_PASSWORD`: 수동 뉴스 수집 비밀번호
- `CRON_SECRET`: Cron Job 인증 비밀번호
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN (에러 모니터링)
- `LOG_LEVEL`: 로그 레벨 (`debug`, `info`, `warn`, `error`)

