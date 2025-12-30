# 웹 분석(Web Analytics) 기능 사용 가이드

## 개요

Daily News 프로젝트에 웹 분석 기능이 추가되어 사용자 행동 추적, 페이지뷰 분석, 이벤트 추적 등을 수행할 수 있습니다.

## 기능

### 1. 자동 페이지뷰 추적

페이지뷰는 자동으로 추적됩니다. `AnalyticsProvider`가 앱 전체를 감싸고 있어 페이지 이동 시 자동으로 페이지뷰가 기록됩니다.

### 2. 이벤트 추적

컴포넌트에서 `useAnalytics` Hook을 사용하여 이벤트를 추적할 수 있습니다.

#### 기본 사용법

```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function MyComponent() {
  const { trackClick, trackSearch, trackBookmark } = useAnalytics();

  const handleClick = () => {
    trackClick('news_card_click', {
      news_id: '123',
      category: '태국뉴스',
    });
  };

  return <button onClick={handleClick}>클릭</button>;
}
```

#### 사용 가능한 이벤트 추적 함수

- `trackClick(eventName, metadata)`: 클릭 이벤트
- `trackSearch(query, resultsCount)`: 검색 이벤트
- `trackBookmark(newsId, action)`: 북마크 이벤트
- `trackComment(newsId, action)`: 댓글 이벤트
- `trackReaction(newsId, reactionType)`: 반응(좋아요/싫어요) 이벤트
- `trackShare(newsId, platform)`: 공유 이벤트
- `trackScroll(percentage)`: 스크롤 이벤트
- `trackCustom(eventName, metadata)`: 커스텀 이벤트

#### 예시: 뉴스 카드 클릭 추적

```typescript
// components/NewsCard.tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function NewsCard({ news }) {
  const { trackClick } = useAnalytics();

  const handleClick = () => {
    trackClick('news_card_click', {
      news_id: news.id,
      category: news.category,
      title: news.title,
    });
  };

  return (
    <div onClick={handleClick}>
      {/* 뉴스 카드 내용 */}
    </div>
  );
}
```

#### 예시: 검색 추적

```typescript
// app/search/page.tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function SearchPage() {
  const { trackSearch } = useAnalytics();

  const handleSearch = async (query: string) => {
    const results = await searchNews(query);

    trackSearch(query, results.length);

    // 검색 결과 표시
  };

  return <SearchForm onSubmit={handleSearch} />;
}
```

#### 예시: 북마크 추적

```typescript
// components/BookmarkButton.tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function BookmarkButton({ newsId, isBookmarked }) {
  const { trackBookmark } = useAnalytics();

  const handleToggle = async () => {
    if (isBookmarked) {
      await removeBookmark(newsId);
      trackBookmark(newsId, 'remove');
    } else {
      await addBookmark(newsId);
      trackBookmark(newsId, 'add');
    }
  };

  return <button onClick={handleToggle}>북마크</button>;
}
```

## 관리자 대시보드

관리자 페이지(`/admin`)에서 "웹 분석" 탭을 클릭하면 Analytics 대시보드를 확인할 수 있습니다.

### 대시보드 기능

1. **통계 카드**
   - 총 페이지뷰
   - 고유 방문자
   - 고유 사용자
   - 총 세션
   - 평균 세션 시간
   - 이탈률

2. **인기 페이지 차트**
   - 페이지뷰가 많은 페이지를 막대 그래프로 표시

3. **인기 이벤트 목록**
   - 발생 빈도가 높은 이벤트를 표시

4. **디바이스 타입별 통계**
   - Desktop, Mobile, Tablet 비율

5. **국가별 통계**
   - 방문자 국가별 통계

6. **날짜 범위 선택**
   - 시작일과 종료일을 선택하여 특정 기간의 통계를 확인할 수 있습니다.

## 데이터베이스 마이그레이션

Analytics 기능을 사용하기 전에 데이터베이스 마이그레이션을 실행해야 합니다.

### Supabase에서 마이그레이션 실행

1. Supabase 대시보드에서 "SQL Editor" 메뉴 클릭
2. "New query" 클릭
3. `supabase/migrations/create_analytics_tables.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. 테이블 생성 확인

### 생성되는 테이블

- `page_views`: 페이지뷰 추적
- `events`: 이벤트 추적
- `sessions`: 세션 관리
- `analytics_daily_summary`: 일별 집계 데이터

## 개인정보 보호

### IP 주소 처리

- IP 주소는 자동으로 해시화되어 저장됩니다 (마지막 옥텟 제거)
- IPv4: `192.168.1.100` → `192.168.1.0`
- IPv6: 전체 해시 처리

### 쿠키 및 로컬 스토리지

- 세션 ID는 로컬 스토리지에 저장됩니다
- 세션 만료 시간: 30분 (비활성 시)

## 성능 고려사항

### 비동기 처리

- 모든 Analytics 요청은 비동기로 처리되어 사용자 경험에 영향을 주지 않습니다
- 요청 실패 시에도 앱 동작에 영향을 주지 않습니다

### 배치 처리 (향후 개선)

- 현재는 각 이벤트마다 개별 API 호출을 수행합니다
- 향후 배치 처리 기능을 추가하여 성능을 개선할 수 있습니다

## API 엔드포인트

### 페이지뷰 추적

```
POST /api/analytics/pageview
```

### 이벤트 추적

```
POST /api/analytics/event
```

### 세션 관리

```
POST /api/analytics/session
```

### 관리자 Analytics 통계

```
GET /api/admin/analytics?start_date=2024-01-01&end_date=2024-01-31
```

## 문제 해결

### 페이지뷰가 추적되지 않는 경우

1. 브라우저 콘솔에서 에러 확인
2. 네트워크 탭에서 API 요청 확인
3. 세션 ID가 로컬 스토리지에 저장되어 있는지 확인

### 이벤트가 추적되지 않는 경우

1. `useAnalytics` Hook이 올바르게 사용되고 있는지 확인
2. 이벤트 이름과 메타데이터가 올바른지 확인
3. 브라우저 콘솔에서 에러 확인

### 관리자 대시보드에 데이터가 표시되지 않는 경우

1. 데이터베이스 마이그레이션이 실행되었는지 확인
2. 관리자 권한이 있는지 확인
3. 날짜 범위가 올바른지 확인

