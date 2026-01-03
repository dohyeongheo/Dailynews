# Analytics 페이지뷰 추적 오류 수정

## 문제 분석

### 원인
1. **경쟁 조건 (Race Condition)**: `sessionId`가 초기화되기 전에 `trackPageView`가 호출됨
2. **의존성 배열 문제**: `useEffect`의 의존성 배열에 `trackPageView`가 없어서 경고 발생
3. **타이밍 이슈**: 세션 초기화와 페이지뷰 추적이 동시에 실행되어 네트워크 오류 발생

### 증상
- 콘솔에 `[WARN] 페이지뷰 추적 실패 (네트워크 오류)` 메시지 반복 출력
- `/admin` 페이지에서 특히 자주 발생
- `Failed to fetch` 에러 발생

## 수정 사항

### 1. 세션 초기화 상태 추적 (`AnalyticsProvider.tsx`)

```typescript
const [isSessionInitialized, setIsSessionInitialized] = useState<boolean>(false);
const initializationRef = useRef<boolean>(false);
```

- 세션이 초기화되었는지 명확히 추적
- 중복 초기화 방지

### 2. `trackPageView` 메모이제이션

```typescript
const trackPageView = useCallback(async (pagePath?: string, pageTitle?: string) => {
  if (!isSessionInitialized || !sessionId) {
    clientLog.debug('세션 초기화 대기 중...', { isSessionInitialized, hasSessionId: !!sessionId });
    return;
  }
  // ...
}, [sessionId, isSessionInitialized, pathname, lastPagePath]);
```

- `useCallback`으로 메모이제이션하여 불필요한 재생성 방지
- 의존성 배열에 필요한 모든 값 포함

### 3. 세션 초기화 완료 후 페이지뷰 추적

```typescript
useEffect(() => {
  if (!isSessionInitialized || !sessionId) return;

  const timer = setTimeout(() => {
    trackPageView();
  }, 300); // 지연 시간을 300ms로 증가

  return () => clearTimeout(timer);
}, [pathname, searchParams, sessionId, isSessionInitialized, trackPageView]);
```

- 세션이 완전히 초기화된 후에만 페이지뷰 추적 시도
- 지연 시간을 300ms로 증가하여 안정성 향상

### 4. API 엔드포인트 개선 (`app/api/analytics/pageview/route.ts`)

```typescript
// 필수 필드 검증
if (!body.session_id || !body.page_path) {
  log.warn('페이지뷰 추적 요청에 필수 필드가 없습니다', {
    hasSessionId: !!body.session_id,
    hasPagePath: !!body.page_path,
  });
  return NextResponse.json(
    { error: 'session_id와 page_path는 필수입니다.' },
    { status: 400 }
  );
}
```

- 필수 필드 검증 추가
- 세션 생성 실패해도 페이지뷰 저장 시도
- 더 자세한 에러 로깅

### 5. 개발 환경 로깅 최적화

```typescript
if (process.env.NODE_ENV === 'development') {
  clientLog.warn('페이지뷰 추적 실패 (네트워크 오류)', {
    pagePath: currentPath,
    sessionId,
    error: error instanceof Error ? error.message : String(error),
  });
}
```

- 프로덕션 환경에서는 불필요한 로그 출력 최소화
- 개발 환경에서만 상세 로그 출력

## 예상 결과

1. ✅ 세션이 완전히 초기화된 후에만 페이지뷰 추적 시도
2. ✅ 경쟁 조건 해결로 네트워크 오류 감소
3. ✅ 프로덕션 환경에서 불필요한 경고 메시지 제거
4. ✅ 더 안정적인 페이지뷰 추적

## 테스트 방법

1. 브라우저 콘솔에서 경고 메시지 확인
2. 네트워크 탭에서 `/api/analytics/pageview` 요청 성공 여부 확인
3. Supabase에서 `page_views` 테이블에 데이터가 정상적으로 저장되는지 확인






