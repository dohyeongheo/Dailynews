# content_translated 컬럼 제거 및 번역 로직 수정 요약

**수정 일자**: 2025-01-03
**문제**: 데이터베이스에 `content_translated` 컬럼이 없는데 코드에서 이를 사용하고 있었음

## 문제점 분석

### 1. 데이터베이스 현황
- Supabase 데이터베이스의 `news` 테이블에는 `content_translated` 컬럼이 **존재하지 않음**
- 하지만 코드 전반에서 `content_translated` 필드를 사용하고 있었음

### 2. 번역 실패 원인
- `translateNewsIfNeeded` 함수에서 번역된 내용을 `content_translated` 변수에 저장하고 있었음
- 하지만 DB 저장 시에는 `content` 필드만 저장하고 `content_translated`는 무시됨
- 결과적으로 **번역된 내용이 실제로 DB에 저장되지 않았음**
- 번역 실패한 뉴스가 5개 확인됨 (한국어가 아닌 content를 가진 뉴스)

### 3. 코드 불일치
- 문서에는 "번역 결과를 `content`에 직접 저장"한다고 명시되어 있으나, 실제 코드는 그렇게 구현되지 않았음
- 프론트엔드에서 `content_translated || content`를 사용하고 있었으나, `content_translated`는 항상 `null`이므로 항상 `content`가 표시됨

## 수정 내용

### 1. 번역 로직 수정 (`lib/news-fetcher.ts`)

**변경 전**:
```typescript
// 번역된 내용을 contentTranslated 변수에 저장
contentTranslated = translatedContent;
return {
  newsItem: {
    ...newsItem,
    title,
    content, // 원본 유지
    content_translated: contentTranslated, // 번역된 내용
  },
  translationFailed,
};
```

**변경 후**:
```typescript
// 번역된 내용을 content 필드에 직접 저장
content = translatedContent;
return {
  newsItem: {
    ...newsItem,
    title,
    content, // 번역된 내용이 직접 저장됨
    content_translated: null, // 더 이상 사용하지 않음
  },
  translationFailed,
};
```

### 2. 프론트엔드 컴포넌트 수정

#### `components/NewsCard.tsx`
- `news.content_translated || news.content` → `news.content`

#### `components/SearchResultCard.tsx`
- `news.content_translated || news.content` → `news.content`

### 3. 관리자 폼 수정 (`components/admin/NewsForm.tsx`)
- `content_translated` 필드 제거
- formData에서 `content_translated` 제거
- 주석 추가: "번역된 내용은 content 필드에 직접 저장됨"

### 4. API 라우트 수정

#### `app/api/admin/news/route.ts`
- 스키마에서 `content_translated` 제거 (주석으로 표시)
- `insertNews` 호출 시 `content_translated: null` 고정

#### `app/api/admin/news/[id]/route.ts`
- 스키마에서 `content_translated` 제거 (주석으로 표시)
- `updateData`에서 `content_translated` 처리 제거

#### `app/api/admin/metrics/route.ts`
- `content_translated` 컬럼 쿼리 제거
- 성능상의 이유로 번역 실패 카운트는 0으로 설정 (정확한 카운트는 `getNewsWithFailedTranslation` 사용)

### 5. DB 쿼리 주석 정리 (`lib/db/supabase-news.ts`)
- 잘못된 주석 수정: "content 또는 content_translated에서 검색" → "content 필드에서 검색"
- "title, content, content_translated에서 검색" → "title, content에서 검색"

## 수정 결과

### ✅ 해결된 문제
1. **번역된 내용이 DB에 저장됨**: 번역된 내용이 `content` 필드에 직접 저장되어 실제로 DB에 반영됨
2. **코드 일관성 확보**: 모든 코드가 `content` 필드만 사용하도록 통일됨
3. **불필요한 필드 제거**: 존재하지 않는 `content_translated` 컬럼 참조 제거

### ⚠️ 주의사항
1. **기존 번역 실패 뉴스**: 현재 DB에 한국어가 아닌 content를 가진 뉴스가 5개 있음. 이들은 번역 재시도 기능을 통해 재번역해야 함
2. **타입 정의**: `types/news.ts`의 `News` 인터페이스에서 `content_translated` 필드는 하위 호환성을 위해 유지 (항상 `null`)
3. **데이터베이스 스키마**: `supabase/schema.sql`에는 `content_translated` 컬럼이 정의되어 있으나, 실제 DB에는 없음 (마이그레이션 불일치 가능성)

## 테스트 및 검증

- ✅ 빌드 성공
- ✅ Linter 오류 없음
- ✅ 타입 체크 통과
- ⚠️ 실제 번역 동작 확인 필요 (프로덕션 환경에서 테스트 권장)

## 향후 개선 사항

1. **번역 실패 뉴스 재번역**: 관리자 페이지의 번역 재시도 기능을 사용하여 기존 번역 실패 뉴스 재번역
2. **데이터베이스 스키마 정리**: `supabase/schema.sql`에서 `content_translated` 컬럼 정의 제거 검토
3. **타입 정의 정리**: 향후 `News` 인터페이스에서 `content_translated` 필드 제거 검토 (하위 호환성 고려)

