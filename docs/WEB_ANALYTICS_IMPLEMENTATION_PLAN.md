# 웹 분석(Web Analytics) 기능 구현 계획

## 1. 개요

Daily News 프로젝트에 웹 분석 기능을 추가하여 사용자 행동 추적, 페이지뷰 분석, 이벤트 추적 등을 구현합니다.

## 2. 목표

- **사용자 행동 분석**: 페이지뷰, 세션, 사용자 플로우 추적
- **콘텐츠 성과 분석**: 뉴스 조회수, 인기 뉴스, 카테고리별 통계
- **사용자 참여도 분석**: 검색, 북마크, 댓글, 반응(좋아요/싫어요) 추적
- **실시간 대시보드**: 관리자 페이지에서 실시간 통계 확인
- **리포트 생성**: 일별/주별/월별 리포트 자동 생성

## 3. 기술 스택

### 3.1 기존 인프라 활용
- **데이터베이스**: Supabase (PostgreSQL)
- **차트 라이브러리**: recharts (이미 설치됨)
- **관리자 페이지**: 기존 `/admin` 페이지 확장
- **로깅**: pino (이미 설치됨)

### 3.2 추가 필요 사항
- **클라이언트 사이드 추적**: Next.js App Router의 클라이언트 컴포넌트
- **서버 사이드 추적**: API Route를 통한 이벤트 수집
- **실시간 업데이트**: 필요시 WebSocket 또는 Server-Sent Events (선택사항)

## 4. 데이터베이스 스키마 설계

### 4.1 `page_views` 테이블
페이지뷰 추적을 위한 테이블

```sql
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
```

### 4.2 `events` 테이블
사용자 이벤트 추적을 위한 테이블

```sql
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
```

### 4.3 `sessions` 테이블
사용자 세션 추적을 위한 테이블

```sql
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
```

### 4.4 `analytics_daily_summary` 테이블
일별 집계 데이터 (성능 최적화)

```sql
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
```

## 5. 구현 단계

### Phase 1: 기본 인프라 구축 (1-2일)

#### 5.1 데이터베이스 마이그레이션
- [ ] `page_views` 테이블 생성
- [ ] `events` 테이블 생성
- [ ] `sessions` 테이블 생성
- [ ] `analytics_daily_summary` 테이블 생성
- [ ] 인덱스 생성
- [ ] RLS 정책 설정

#### 5.2 타입 정의
- [ ] `lib/types/analytics.ts` 생성
- [ ] TypeScript 타입 정의

#### 5.3 유틸리티 함수
- [ ] `lib/utils/analytics.ts` 생성
  - 세션 ID 생성/관리
  - 디바이스 정보 파싱
  - IP 주소 처리 (개인정보 보호)

### Phase 2: 클라이언트 사이드 추적 (2-3일)

#### 5.4 Analytics Provider
- [ ] `components/analytics/AnalyticsProvider.tsx` 생성
  - 세션 관리
  - 페이지뷰 자동 추적
  - 이벤트 추적 함수 제공

#### 5.5 페이지뷰 추적
- [ ] `app/layout.tsx`에 AnalyticsProvider 추가
- [ ] `lib/hooks/usePageView.ts` 생성
  - Next.js App Router의 `usePathname`, `useSearchParams` 활용
  - 페이지 변경 시 자동 추적

#### 5.6 이벤트 추적 Hook
- [ ] `lib/hooks/useAnalytics.ts` 생성
  - `trackEvent()` 함수 제공
  - 클릭, 검색, 북마크 등 이벤트 추적

### Phase 3: 서버 사이드 API (2일)

#### 5.7 API 엔드포인트
- [ ] `app/api/analytics/pageview/route.ts` 생성
  - 페이지뷰 수집 API
  - POST 요청 처리

- [ ] `app/api/analytics/event/route.ts` 생성
  - 이벤트 수집 API
  - POST 요청 처리

- [ ] `app/api/analytics/session/route.ts` 생성
  - 세션 시작/종료 API
  - POST 요청 처리

#### 5.8 데이터베이스 함수
- [ ] `lib/db/analytics.ts` 생성
  - `savePageView()` 함수
  - `saveEvent()` 함수
  - `createOrUpdateSession()` 함수
  - `getAnalyticsData()` 함수

### Phase 4: 관리자 대시보드 (3-4일)

#### 5.9 Analytics 대시보드 컴포넌트
- [ ] `components/admin/analytics/AnalyticsDashboard.tsx` 생성
  - 실시간 통계 카드
  - 페이지뷰 차트
  - 이벤트 통계
  - 인기 콘텐츠

#### 5.10 Analytics API
- [ ] `app/api/admin/analytics/route.ts` 생성
  - 통계 데이터 조회 API
  - 필터링 (날짜, 페이지, 이벤트 타입 등)

- [ ] `app/api/admin/analytics/summary/route.ts` 생성
  - 일별/주별/월별 요약 데이터 API

#### 5.11 AdminTabs에 Analytics 탭 추가
- [ ] `components/admin/AdminTabs.tsx` 수정
  - Analytics 탭 추가

### Phase 5: 고급 기능 (2-3일)

#### 5.12 일별 집계 작업
- [ ] `scripts/analytics/daily-summary.ts` 생성
  - 일별 통계 집계 스크립트
  - GitHub Actions 또는 Cron Job으로 실행

#### 5.13 리포트 생성
- [ ] `app/api/admin/analytics/report/route.ts` 생성
  - 리포트 생성 API
  - PDF 또는 Excel 내보내기 (선택사항)

#### 5.14 실시간 통계 (선택사항)
- [ ] WebSocket 또는 Server-Sent Events 구현
  - 실시간 페이지뷰 업데이트
  - 실시간 이벤트 스트림

### Phase 6: 최적화 및 개선 (1-2일)

#### 5.15 성능 최적화
- [ ] 배치 처리: 여러 이벤트를 한 번에 전송
- [ ] 로컬 스토리지 활용: 오프라인 이벤트 저장
- [ ] 샘플링: 대량 트래픽 시 샘플링 적용

#### 5.16 개인정보 보호
- [ ] IP 주소 해시화
- [ ] 쿠키 동의 처리 (GDPR 준수)
- [ ] 개인정보 삭제 기능

## 6. 파일 구조

```
Dailynews/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── pageview/
│   │   │   │   └── route.ts
│   │   │   ├── event/
│   │   │   │   └── route.ts
│   │   │   └── session/
│   │   │       └── route.ts
│   │   └── admin/
│   │       └── analytics/
│   │           ├── route.ts
│   │           ├── summary/
│   │           │   └── route.ts
│   │           └── report/
│   │               └── route.ts
├── components/
│   ├── admin/
│   │   └── analytics/
│   │       ├── AnalyticsDashboard.tsx
│   │       ├── PageViewsChart.tsx
│   │       ├── EventsChart.tsx
│   │       ├── TopPages.tsx
│   │       └── RealtimeStats.tsx
│   └── analytics/
│       └── AnalyticsProvider.tsx
├── lib/
│   ├── db/
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useAnalytics.ts
│   │   └── usePageView.ts
│   ├── types/
│   │   └── analytics.ts
│   └── utils/
│       └── analytics.ts
├── scripts/
│   └── analytics/
│       └── daily-summary.ts
└── supabase/
    └── migrations/
        └── create_analytics_tables.sql
```

## 7. 사용 예시

### 7.1 페이지뷰 자동 추적
```typescript
// app/layout.tsx
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
```

### 7.2 이벤트 추적
```typescript
// components/NewsCard.tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function NewsCard({ news }) {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('news_click', {
      news_id: news.id,
      category: news.category,
      title: news.title,
    });
  };

  return <div onClick={handleClick}>...</div>;
}
```

### 7.3 검색 추적
```typescript
// app/search/page.tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function SearchPage() {
  const { trackEvent } = useAnalytics();

  const handleSearch = (query: string) => {
    trackEvent('search', {
      query,
      results_count: results.length,
    });
  };

  return <SearchForm onSubmit={handleSearch} />;
}
```

## 8. 보안 및 개인정보 보호

### 8.1 개인정보 보호
- IP 주소 해시화 또는 마지막 옥텟 제거
- 쿠키 동의 처리 (GDPR, CCPA 준수)
- 사용자 식별 정보 최소화

### 8.2 보안
- Rate Limiting 적용
- CSRF 보호
- 관리자 페이지 접근 제어

### 8.3 데이터 보관
- 원시 데이터 보관 기간 설정 (예: 90일)
- 자동 삭제 스크립트
- 집계 데이터는 장기 보관

## 9. 성능 고려사항

### 9.1 비동기 처리
- 이벤트 수집은 비동기로 처리
- 배치 처리로 API 호출 최소화

### 9.2 캐싱
- 집계 데이터 캐싱
- Redis 또는 메모리 캐시 활용 (선택사항)

### 9.3 샘플링
- 대량 트래픽 시 샘플링 적용
- 예: 10%만 추적

## 10. 테스트 계획

### 10.1 단위 테스트
- [ ] Analytics 유틸리티 함수 테스트
- [ ] 데이터베이스 함수 테스트

### 10.2 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 이벤트 추적 플로우 테스트

### 10.3 E2E 테스트
- [ ] 페이지뷰 추적 테스트
- [ ] 이벤트 추적 테스트
- [ ] 대시보드 표시 테스트

## 11. 배포 계획

### 11.1 단계별 배포
1. 데이터베이스 마이그레이션 배포
2. API 엔드포인트 배포
3. 클라이언트 사이드 추적 배포
4. 관리자 대시보드 배포

### 11.2 모니터링
- 에러 로깅 (Sentry)
- 성능 모니터링
- 데이터 수집 상태 확인

## 12. 향후 개선 사항

- **A/B 테스트 통합**: 실험 추적
- **사용자 세그먼트**: 사용자 그룹별 분석
- **퍼널 분석**: 사용자 전환 경로 분석
- **히트맵**: 클릭 히트맵 (선택사항)
- **세션 리플레이**: 사용자 행동 재현 (선택사항)

## 13. 예상 소요 시간

- **Phase 1**: 1-2일
- **Phase 2**: 2-3일
- **Phase 3**: 2일
- **Phase 4**: 3-4일
- **Phase 5**: 2-3일
- **Phase 6**: 1-2일

**총 예상 시간**: 11-16일 (약 2-3주)

## 14. 참고 자료

- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [recharts Documentation](https://recharts.org/)
- [GDPR Compliance](https://gdpr.eu/)





