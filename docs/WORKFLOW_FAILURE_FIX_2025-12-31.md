# 워크플로우 실패 원인 분석 및 수정

**분석 날짜**: 2025-12-31
**워크플로우 실행 번호**: #11
**상태**: ❌ **실패** (failure)

## 🔍 실패 원인 분석

### 워크플로우 실행 정보
- **실행 번호**: #11
- **상태**: completed
- **결론**: failure
- **이벤트**: schedule (자동 실행)
- **실행 시간**: 2025. 12. 31. 오전 6:22:58 ~ 2025. 12. 31. 오전 6:25:13
- **실패 단계**: "Fetch and save news"
- **URL**: https://github.com/dohyeongheo/Dailynews/actions/runs/20608075493

### 문제점

최근에 수정한 중복 감지 로직에서 카테고리 필터링을 추가했는데, 다음과 같은 문제가 발생할 수 있습니다:

1. **쿼리 빌더 체이닝 문제**: `let query = ...`로 변수에 할당하고 다시 할당하는 방식이 TypeScript/Supabase 타입 시스템에서 문제를 일으킬 수 있습니다.

2. **카테고리 null 체크**: `news.category`가 `null`이거나 `undefined`일 경우 `.eq("category", news.category)`가 예상치 못한 동작을 할 수 있습니다.

## ✅ 수정 사항

### 파일: `lib/db/supabase-news.ts`

#### 1. 카테고리 null 체크 추가
```typescript
// 카테고리가 없으면 중복 체크를 건너뜀
if (!news.category) {
  log.warn("카테고리가 없어 중복 체크를 건너뜀", { title: news.title?.substring(0, 50) });
  return { isDuplicate: false };
}
```

#### 2. 쿼리 빌더 체이닝 방식 개선
**수정 전**:
```typescript
let query = supabaseServer
  .from("news")
  .select("id, title, content, published_date, category")
  .gte("published_date", sevenDaysAgoStr);

query = query.eq("category", news.category);

const { data, error } = await query.order("published_date", { ascending: false });
```

**수정 후**:
```typescript
const { data, error } = await supabaseServer
  .from("news")
  .select("id, title, content, published_date, category")
  .gte("published_date", sevenDaysAgoStr)
  .eq("category", news.category)
  .order("published_date", { ascending: false });
```

## 📝 변경 이유

1. **타입 안전성**: 쿼리 빌더를 직접 체이닝하는 방식이 TypeScript 타입 추론에 더 안전합니다.
2. **방어적 프로그래밍**: `news.category`가 없을 경우를 명시적으로 처리하여 예상치 못한 에러를 방지합니다.
3. **코드 가독성**: 직접 체이닝하는 방식이 더 읽기 쉽고 이해하기 쉽습니다.

## 🧪 테스트

수정 후 다음을 확인해야 합니다:

1. **로컬 테스트**: `npm test` 실행하여 기존 테스트가 통과하는지 확인
2. **워크플로우 재실행**: GitHub Actions에서 워크플로우를 다시 실행하여 성공하는지 확인
3. **중복 감지 기능**: 실제 뉴스 수집 시 중복 감지가 정상적으로 작동하는지 확인

## 🔄 다음 단계

1. **워크플로우 재실행**: 수정된 코드를 커밋하고 푸시한 후 워크플로우를 다시 실행
2. **로그 확인**: 워크플로우 실행 후 로그를 확인하여 문제가 해결되었는지 확인
3. **모니터링**: 다음 자동 실행(schedule)에서도 정상적으로 작동하는지 확인

## 📌 참고 사항

- `NewsInput` 타입에서 `category`는 필수 필드이지만, 런타임에서 `null`이나 `undefined`가 올 수 있는 경우를 대비하여 방어 로직을 추가했습니다.
- Supabase 쿼리 빌더는 불변(immutable) 객체를 반환하므로, 변수에 재할당하는 방식보다 직접 체이닝하는 방식이 더 안전합니다.





