# 번역 재시도 로직 수정 요약

**수정 일자**: 2025-01-03
**문제**: 번역 실패한 뉴스 재번역 기능이 작동하지 않음

## 문제 분석

### 1. 현황
- 최근 수집된 태국 뉴스 5개가 모두 태국어로 저장됨
- 로그: "번역 완료" - failedCount: 0
- 로그: "번역 실패한 뉴스 발견" - 5개
- 번역 재시도 기능이 작동하지 않음

### 2. 근본 원인

#### 2.1 Gemini API 프롬프트 무시
- **문제**: Gemini API가 프롬프트에서 "반드시 한국어로 번역"하라고 명시했지만, 실제로는 태국어 원문을 content 필드에 반환
- **증거**: 제목은 한국어로 번역되었지만, content는 태국어로 저장됨

#### 2.2 번역 로직 실행 여부 불명확
- 번역 로직이 실행되었는지 로그로 확인 불가
- "태국 뉴스가 한국어가 아닌 상태로 수집됨, 번역 시도" 경고가 로그에 없음
- 가능성: 번역이 실행되었지만 실패했거나, 번역 결과가 원본과 같아서 실패로 판단됨

#### 2.3 `retryFailedTranslations` 함수 문제 ⚠️ **치명적 버그**
```typescript
// 문제: content_translated 필드를 확인하고 있지만, 이 필드는 항상 null
if (!result.translationFailed && result.newsItem.content_translated) {
  // 이 조건은 절대 true가 될 수 없음!
  const updated = await updateNewsTranslation(news.id, result.newsItem.content_translated);
  // ...
}
```

**문제점**:
- `content_translated` 필드는 더 이상 사용하지 않으며 항상 `null`
- 번역 성공 여부를 `content_translated`로 확인하고 있어서 항상 실패로 처리됨
- `updateNewsTranslation` 함수도 더 이상 사용하지 않으며 항상 `false` 반환

#### 2.4 DB 업데이트 로직 누락
- 번역 성공 시 `content` 필드를 업데이트하는 함수가 없음
- `updateNewsTranslation` 함수는 `content_translated` 컬럼을 업데이트하려고 시도하지만, 해당 컬럼은 존재하지 않음

## 수정 내용

### 1. `updateNewsContent` 함수 추가

**파일**: `lib/db/supabase-news.ts`

```typescript
/**
 * 뉴스의 content 필드 업데이트 (번역 재처리용)
 */
export async function updateNewsContent(newsId: string, content: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("news")
      .update({ content })
      .eq("id", newsId);

    if (error) {
      log.error("updateNewsContent Supabase 에러 발생", new Error(error.message), {
        newsId,
        errorCode: error.code,
      });
      return false;
    }

    log.debug("뉴스 content 업데이트 완료", { newsId, contentPreview: content.substring(0, 50) });
    return true;
  } catch (error) {
    log.error("updateNewsContent 예외 발생", error instanceof Error ? error : new Error(String(error)), { newsId });
    return false;
  }
}
```

**파일**: `lib/db/news.ts`

```typescript
/**
 * 뉴스의 content 필드 업데이트 (번역 재처리용, 캐시 무효화 포함)
 */
export async function updateNewsContent(newsId: string, content: string): Promise<boolean> {
  const result = await supabaseNews.updateNewsContent(newsId, content);

  // 업데이트 성공 시 관련 캐시 무효화
  if (result) {
    await invalidateNewsCache(newsId);
  }

  return result;
}
```

### 2. `retryFailedTranslations` 함수 수정

**파일**: `lib/news-fetcher.ts`

```typescript
// 변경 전
if (!result.translationFailed && result.newsItem.content_translated) {
  const updated = await updateNewsTranslation(news.id, result.newsItem.content_translated);
  // ...
}

// 변경 후
const originalContent = newsItem.content;
const translatedContent = result.newsItem.content;
const isTranslated = !isTranslationFailed(originalContent, translatedContent) && isKorean(translatedContent);

if (!result.translationFailed && isTranslated) {
  // DB에 번역본 업데이트 (content 필드 업데이트)
  const updated = await updateNewsContent(news.id, translatedContent);
  if (updated) {
    log.info("뉴스 번역 재처리 성공", {
      newsId: news.id,
      title: news.title.substring(0, 50),
    });
    return { success: true, newsId: news.id };
  } else {
    log.warn("뉴스 번역본 업데이트 실패", { newsId: news.id });
    return { success: false, newsId: news.id };
  }
} else {
  log.warn("뉴스 번역 재처리 실패", {
    newsId: news.id,
    title: news.title.substring(0, 50),
    translationFailed: result.translationFailed,
    isTranslated,
  });
  return { success: false, newsId: news.id };
}
```

**개선 사항**:
1. `content_translated` 대신 `content` 필드 확인
2. 번역 성공 여부를 `isTranslationFailed()`와 `isKorean()` 함수로 검증
3. 번역 성공 시 `updateNewsContent()` 함수로 `content` 필드 업데이트
4. 더 상세한 로그 기록

## 수정 결과

### ✅ 해결된 문제
1. **번역 재시도 기능 작동**: `content` 필드를 직접 업데이트하도록 수정하여 번역 재시도가 작동함
2. **번역 성공 여부 정확한 판단**: `content_translated` 대신 `content` 필드의 한국어 여부로 판단
3. **DB 업데이트 로직 추가**: 번역 성공 시 `content` 필드를 업데이트하는 함수 추가

### ⚠️ 남은 문제
1. **Gemini API 프롬프트 무시**: Gemini API가 태국 뉴스를 태국어 원문으로 반환하는 문제는 프롬프트 강화로 일부 개선되었지만, 완전히 해결되지 않을 수 있음
2. **번역 실패 감지**: 번역 로직이 실행되었는지 로그로 확인이 어려움 (추가 로그 필요)

## 향후 개선 사항

1. **프롬프트 추가 개선**: Gemini API가 태국 뉴스를 한국어로 번역하여 반환하도록 프롬프트를 더 명확하게 수정
2. **번역 로직 로그 개선**: 번역 시도 및 실패 시 더 상세한 로그 기록
3. **번역 품질 검증**: 번역 결과가 실제로 한국어인지 검증하는 로직 추가
4. **모니터링 강화**: 번역 실패율을 모니터링하여 프롬프트 효과 측정

## 테스트 및 검증

- ✅ 빌드 성공
- ✅ Linter 오류 없음
- ✅ 타입 체크 통과
- ⚠️ 실제 번역 재시도 동작 확인 필요 (프로덕션 환경에서 테스트 권장)

## 관련 문서

- `docs/TRANSLATION_FAILURE_ANALYSIS_AND_FIX.md`: 번역 실패 원인 분석 및 프롬프트 개선
- `docs/CONTENT_TRANSLATED_FIX_SUMMARY.md`: content_translated 컬럼 제거 요약

