# 프로젝트 개선 작업 계획서

## 📋 개요

이 문서는 Daily News 프로젝트의 개선사항을 단계별로 구현하기 위한 상세 작업 계획입니다.

---

## 🔴 Phase 1: 높은 우선순위 개선 (즉시 개선)

### 1.1 로깅 시스템 통일

#### 작업 1.1.1: alert() → Toast 시스템 변경
**예상 시간:** 1시간  
**우선순위:** 높음

**대상 파일:**
- `components/admin/NewsManagement.tsx` (5곳)

**작업 내용:**
1. `useToast` 훅 import 추가
2. `alert()` 호출을 `toast.success()`, `toast.error()` 등으로 변경
3. `confirm()` 호출은 유지 (필요시 커스텀 모달로 변경 가능)

**변경 예시:**
```typescript
// ❌ 현재
alert("삭제 완료");

// ✅ 개선
const { toast } = useToast();
toast.success("삭제 완료");
```

**체크리스트:**
- [ ] NewsManagement.tsx의 모든 alert() 제거
- [ ] Toast 메시지 타입 적절히 설정 (success/error/warning)
- [ ] 사용자 경험 테스트

---

#### 작업 1.1.2: console.log → 구조화된 로깅 변경
**예상 시간:** 4-5시간  
**우선순위:** 높음

**대상 파일:**
- `scripts/*.ts` (모든 스크립트 파일)
- `lib/config/env.ts`
- 기타 console.log 사용 파일

**작업 내용:**
1. 스크립트 파일에 `log` 유틸리티 import 추가
2. `console.log()` → `log.info()`
3. `console.error()` → `log.error()`
4. `console.warn()` → `log.warn()`
5. 구조화된 데이터를 두 번째 인자로 전달

**변경 예시:**
```typescript
// ❌ 현재
console.log("뉴스 수집 완료");
console.error("오류 발생:", error);

// ✅ 개선
import { log } from "../lib/utils/logger";
log.info("뉴스 수집 완료", { count: newsItems.length });
log.error("오류 발생", error instanceof Error ? error : new Error(String(error)), { context: "news-fetch" });
```

**대상 파일 목록:**
- [ ] `scripts/fetch-news.ts`
- [ ] `scripts/fetch-news-test.ts`
- [ ] `scripts/test-*.ts` (모든 테스트 스크립트)
- [ ] `lib/config/env.ts`
- [ ] 기타 console.log 사용 파일

**체크리스트:**
- [ ] 모든 스크립트 파일의 console.log 제거
- [ ] 로그 레벨 적절히 설정 (debug/info/warn/error)
- [ ] 구조화된 데이터 포함
- [ ] 프로덕션 환경에서 불필요한 로그 제거 확인

---

#### 작업 1.1.3: 프로덕션 로그 레벨 관리
**예상 시간:** 30분  
**우선순위:** 중간

**작업 내용:**
1. 환경 변수 `LOG_LEVEL` 기본값 설정 확인
2. 프로덕션 환경에서 debug 로그 비활성화 확인
3. 로그 레벨별 필터링 로직 검증

**체크리스트:**
- [ ] `lib/utils/logger.ts`에서 LOG_LEVEL 기본값 확인
- [ ] 프로덕션 환경에서 debug 로그가 출력되지 않음 확인
- [ ] Vercel 환경 변수에 LOG_LEVEL 설정 가이드 추가

---

### 1.2 타입 안전성 강화

#### 작업 1.2.1: as any 제거
**예상 시간:** 2-3시간  
**우선순위:** 높음

**대상 파일:**
- `lib/db/news-reactions.ts` (5곳)
- `lib/news-fetcher.ts` (1곳)
- `lib/utils/gemini-client.ts` (1곳)
- `lib/utils/api-helpers.ts` (3곳)

**작업 내용:**
1. 각 `as any` 사용 위치 분석
2. 적절한 타입 정의 또는 타입 가드 추가
3. Zod 스키마를 사용한 런타임 타입 검증 추가

**변경 예시:**
```typescript
// ❌ 현재
const { data, error } = await (supabaseServer.from("news_reactions") as any).select("reaction_type");

// ✅ 개선
const { data, error } = await supabaseServer
  .from("news_reactions")
  .select("reaction_type")
  .eq("news_id", newsId)
  .eq("user_id", userId)
  .single();
```

**체크리스트:**
- [ ] `lib/db/news-reactions.ts`의 모든 `as any` 제거
- [ ] `lib/news-fetcher.ts`의 `as any` 제거
- [ ] `lib/utils/gemini-client.ts`의 `Promise<any>` 구체적 타입으로 변경
- [ ] `lib/utils/api-helpers.ts`의 `as unknown as T` 패턴 개선
- [ ] 타입 에러 없이 빌드 확인

---

#### 작업 1.2.2: API 응답 타입 검증 추가
**예상 시간:** 3-4시간  
**우선순위:** 높음

**대상 파일:**
- `lib/actions.ts`
- `app/api/**/route.ts` (모든 API 라우트)

**작업 내용:**
1. API 응답 스키마 정의 (Zod)
2. 응답 파싱 및 검증 로직 추가
3. 타입 안전한 응답 반환

**변경 예시:**
```typescript
// ✅ 개선
import { z } from "zod";

const NewsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(NewsSchema),
  error: z.string().optional(),
});

const result = NewsResponseSchema.parse(await response.json());
```

**체크리스트:**
- [ ] 주요 API 응답 스키마 정의
- [ ] `lib/actions.ts`의 모든 응답 검증 추가
- [ ] API 라우트의 응답 검증 추가
- [ ] 타입 에러 처리 로직 추가

---

#### 작업 1.2.3: Promise<any> → 구체적 타입 지정
**예상 시간:** 1-2시간  
**우선순위:** 중간

**대상 파일:**
- `lib/utils/gemini-client.ts`

**작업 내용:**
1. `generateContentWithCaching` 반환 타입 정의
2. Gemini API 응답 타입 명시

**변경 예시:**
```typescript
// ❌ 현재
export async function generateContentWithCaching(
  model: GenerativeModel,
  prompt: string,
  cacheKey?: string
): Promise<any>

// ✅ 개선
import type { GenerateContentResult } from "@google/generative-ai";

export async function generateContentWithCaching(
  model: GenerativeModel,
  prompt: string,
  cacheKey?: string
): Promise<GenerateContentResult>
```

**체크리스트:**
- [ ] `lib/utils/gemini-client.ts`의 `Promise<any>` 제거
- [ ] 적절한 타입 import 및 사용
- [ ] 타입 에러 없이 빌드 확인

---

### 1.3 에러 핸들링 일관성

#### 작업 1.3.1: 모든 에러를 AppError 계층으로 변환
**예상 시간:** 4-5시간  
**우선순위:** 높음

**대상 파일:**
- `lib/news-fetcher.ts`
- `lib/db/*.ts`
- `app/api/**/route.ts`

**작업 내용:**
1. 모든 catch 블록에서 `toAppError()` 사용
2. 에러 타입별 적절한 `AppError` 서브클래스 사용
3. 에러 로깅 후 사용자 메시지 표시

**변경 예시:**
```typescript
// ❌ 현재
catch (error) {
  log.error("Error", error);
  return { success: 0, failed: newsItems.length };
}

// ✅ 개선
catch (error) {
  const appError = toAppError(error, ErrorType.DATABASE_ERROR);
  log.error("Error in saveNewsToDatabase", appError);
  return { success: 0, failed: newsItems.length };
}
```

**체크리스트:**
- [ ] `lib/news-fetcher.ts`의 모든 에러 처리 개선
- [ ] `lib/db/*.ts`의 모든 에러 처리 개선
- [ ] API 라우트의 에러 처리 일관화
- [ ] 적절한 에러 타입 사용 (DATABASE_ERROR, VALIDATION_ERROR 등)

---

#### 작업 1.3.2: 사용자 메시지 개선
**예상 시간:** 2-3시간  
**우선순위:** 중간

**작업 내용:**
1. 에러 메시지를 사용자 친화적으로 변경
2. 기술적 세부사항은 로그에만 기록
3. 사용자에게는 간단하고 명확한 메시지 표시

**체크리스트:**
- [ ] 모든 사용자 메시지 검토
- [ ] 기술적 에러 메시지 제거
- [ ] 사용자 친화적 메시지로 변경
- [ ] 다국어 지원 고려 (필요시)

---

#### 작업 1.3.3: 재시도 로직 표준화
**예상 시간:** 2-3시간  
**우선순위:** 중간

**작업 내용:**
1. 공통 재시도 유틸리티 함수 생성
2. 재시도 가능한 에러와 불가능한 에러 구분
3. 지수 백오프(exponential backoff) 적용

**변경 예시:**
```typescript
// ✅ 개선
import { retryWithBackoff } from "@/lib/utils/retry";

const result = await retryWithBackoff(
  async () => await translateToKorean(text),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    retryable: (error) => isRetryableError(error),
  }
);
```

**체크리스트:**
- [ ] `lib/utils/retry.ts` 생성
- [ ] 재시도 로직 통합
- [ ] 지수 백오프 구현
- [ ] 재시도 가능한 에러 판단 로직 추가

---

## 🟡 Phase 2: 중간 우선순위 개선 (단기 개선)

### 2.1 성능 최적화

#### 작업 2.1.1: DB 쿼리 최적화 - 필요한 필드만 선택
**예상 시간:** 2-3시간  
**우선순위:** 중간

**대상 파일:**
- `lib/db/supabase-news.ts`

**작업 내용:**
1. 각 쿼리에서 필요한 필드만 선택
2. 불필요한 필드 제외로 네트워크 트래픽 감소
3. 쿼리 성능 측정 및 비교

**변경 예시:**
```typescript
// ❌ 현재
.select("*")

// ✅ 개선
.select("id, title, content, content_translated, published_date, category, news_category, image_url, created_at")
```

**체크리스트:**
- [ ] `getNewsByCategory` 쿼리 최적화
- [ ] `getNewsByTopicCategory` 쿼리 최적화
- [ ] `getAllNews` 쿼리 최적화
- [ ] `getRelatedNews` 쿼리 최적화
- [ ] 성능 개선 측정

---

#### 작업 2.1.2: React 컴포넌트 최적화 - React.memo 적용
**예상 시간:** 2-3시간  
**우선순위:** 중간

**대상 파일:**
- `components/NewsCard.tsx`
- `components/SearchResultCard.tsx`
- `components/CategoryBadge.tsx`
- 기타 리렌더링이 빈번한 컴포넌트

**작업 내용:**
1. 불필요한 리렌더링 방지를 위한 `React.memo` 적용
2. `useMemo`, `useCallback` 적절히 사용
3. 리렌더링 성능 측정

**변경 예시:**
```typescript
// ✅ 개선
import React from "react";

function NewsCard({ news, showOriginalLink = true }: NewsCardProps) {
  // ...
}

export default React.memo(NewsCard);
```

**체크리스트:**
- [ ] NewsCard에 React.memo 적용
- [ ] SearchResultCard에 React.memo 적용
- [ ] CategoryBadge에 React.memo 적용
- [ ] useMemo/useCallback 적절히 사용
- [ ] 리렌더링 성능 개선 확인

---

#### 작업 2.1.3: 캐시 전략 개선 - API 라우트에 캐시 헤더 추가
**예상 시간:** 1-2시간  
**우선순위:** 중간

**대상 파일:**
- `app/api/**/route.ts` (읽기 전용 API)

**작업 내용:**
1. 읽기 전용 API에 적절한 캐시 헤더 추가
2. `revalidate` 값 설정
3. `stale-while-revalidate` 전략 적용

**변경 예시:**
```typescript
// ✅ 개선
export async function GET(request: NextRequest) {
  const data = await getNewsByCategory(category);
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

**체크리스트:**
- [ ] 읽기 전용 API 라우트 식별
- [ ] 적절한 캐시 헤더 추가
- [ ] revalidate 값 설정
- [ ] 캐시 동작 테스트

---

### 2.2 코드 중복 제거

#### 작업 2.2.1: 날짜 포맷팅 로직 통합
**예상 시간:** 1-2시간  
**우선순위:** 낮음

**작업 내용:**
1. 날짜 포맷팅 유틸리티 함수 생성
2. 중복된 날짜 포맷팅 로직 통합

**변경 예시:**
```typescript
// ✅ 개선
// lib/utils/date-format.ts
export function formatNewsDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
```

**체크리스트:**
- [ ] 날짜 포맷팅 로직 통합
- [ ] 모든 컴포넌트에서 공통 함수 사용
- [ ] 일관된 날짜 형식 유지

---

#### 작업 2.2.2: 뉴스 데이터 변환 로직 통합
**예상 시간:** 2-3시간  
**우선순위:** 낮음

**작업 내용:**
1. 뉴스 데이터 변환 유틸리티 함수 생성
2. `News` → `NewsInput` 변환 로직 통합
3. 중복 코드 제거

**체크리스트:**
- [ ] 뉴스 데이터 변환 로직 통합
- [ ] 중복 코드 제거
- [ ] 타입 안전성 유지

---

#### 작업 2.2.3: 에러 메시지 포맷팅 통합
**예상 시간:** 1-2시간  
**우선순위:** 낮음

**작업 내용:**
1. 에러 메시지 포맷팅 유틸리티 함수 생성
2. 일관된 에러 메시지 형식 유지

**체크리스트:**
- [ ] 에러 메시지 포맷팅 통합
- [ ] 일관된 메시지 형식 유지

---

### 2.3 테스트 커버리지 향상

#### 작업 2.3.1: 통합 테스트 추가
**예상 시간:** 6-8시간  
**우선순위:** 중간

**작업 내용:**
1. 뉴스 수집 플로우 통합 테스트
2. 이미지 생성 플로우 테스트
3. API 엔드포인트 통합 테스트

**체크리스트:**
- [ ] 뉴스 수집 통합 테스트 작성
- [ ] 이미지 생성 통합 테스트 작성
- [ ] API 엔드포인트 통합 테스트 작성
- [ ] 테스트 커버리지 70% 이상 달성

---

#### 작업 2.3.2: E2E 테스트 추가 (Playwright)
**예상 시간:** 8-10시간  
**우선순위:** 낮음

**작업 내용:**
1. Playwright 설정
2. 주요 사용자 플로우 E2E 테스트 작성
3. CI/CD 파이프라인에 E2E 테스트 추가

**체크리스트:**
- [ ] Playwright 설치 및 설정
- [ ] 주요 플로우 E2E 테스트 작성
- [ ] CI/CD 파이프라인에 통합
- [ ] E2E 테스트 자동화

---

## 📊 작업 일정

### Week 1: Phase 1 (높은 우선순위)
- **Day 1-2:** 로깅 시스템 통일 (작업 1.1.1, 1.1.2, 1.1.3)
- **Day 3-4:** 타입 안전성 강화 (작업 1.2.1, 1.2.2, 1.2.3)
- **Day 5:** 에러 핸들링 일관성 (작업 1.3.1, 1.3.2, 1.3.3)

### Week 2: Phase 2 (중간 우선순위)
- **Day 1-2:** 성능 최적화 (작업 2.1.1, 2.1.2, 2.1.3)
- **Day 3:** 코드 중복 제거 (작업 2.2.1, 2.2.2, 2.2.3)
- **Day 4-5:** 테스트 커버리지 향상 (작업 2.3.1, 2.3.2)

---

## ✅ 진행 상황 추적

### Phase 1: 높은 우선순위
- [ ] 작업 1.1.1: alert() → Toast 시스템 변경
- [ ] 작업 1.1.2: console.log → 구조화된 로깅 변경
- [ ] 작업 1.1.3: 프로덕션 로그 레벨 관리
- [ ] 작업 1.2.1: as any 제거
- [ ] 작업 1.2.2: API 응답 타입 검증 추가
- [ ] 작업 1.2.3: Promise<any> → 구체적 타입 지정
- [ ] 작업 1.3.1: 모든 에러를 AppError 계층으로 변환
- [ ] 작업 1.3.2: 사용자 메시지 개선
- [ ] 작업 1.3.3: 재시도 로직 표준화

### Phase 2: 중간 우선순위
- [ ] 작업 2.1.1: DB 쿼리 최적화
- [ ] 작업 2.1.2: React 컴포넌트 최적화
- [ ] 작업 2.1.3: 캐시 전략 개선
- [ ] 작업 2.2.1: 날짜 포맷팅 로직 통합
- [ ] 작업 2.2.2: 뉴스 데이터 변환 로직 통합
- [ ] 작업 2.2.3: 에러 메시지 포맷팅 통합
- [ ] 작업 2.3.1: 통합 테스트 추가
- [ ] 작업 2.3.2: E2E 테스트 추가

---

## 📝 참고사항

1. **점진적 적용:** 모든 작업을 한 번에 수행하지 않고 단계적으로 진행
2. **테스트 우선:** 각 작업 후 반드시 테스트 수행
3. **코드 리뷰:** 주요 변경사항은 코드 리뷰 후 병합
4. **문서 업데이트:** 변경사항은 관련 문서에 반영
5. **성능 측정:** 성능 개선 작업은 Before/After 측정 필수

---

## 🎯 성공 기준

### Phase 1 완료 기준
- ✅ 모든 alert() 제거 및 Toast 시스템 적용
- ✅ 모든 console.log를 구조화된 로깅으로 변경
- ✅ 모든 `as any` 제거 및 타입 안전성 확보
- ✅ 모든 에러가 AppError 계층으로 처리됨

### Phase 2 완료 기준
- ✅ DB 쿼리 성능 20% 이상 개선
- ✅ React 컴포넌트 리렌더링 최적화
- ✅ 테스트 커버리지 70% 이상 달성
- ✅ 코드 중복 50% 이상 감소

