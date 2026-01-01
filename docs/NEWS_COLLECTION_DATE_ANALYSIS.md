# 뉴스 수집 날짜 로직 분석 리포트

**분석 일자**: 2025-01-03
**분석 대상**: 뉴스 수집 시 날짜 처리 로직 및 최신 뉴스 수집 보장 여부

## 1. 요약

현재 뉴스 수집 로직은 다음과 같은 특징을 가지고 있습니다:

- ✅ **미래 날짜 체크**: 미래 날짜는 감지하여 오늘 날짜로 변경
- ❌ **과거 날짜 체크 없음**: 과거 날짜를 전달하면 그대로 사용됨
- ⚠️ **최신 뉴스 보장 불가**: 프롬프트에 날짜를 명시하지만, Gemini API가 실제로 해당 날짜의 최신 뉴스만 반환하는지 보장할 수 없음

## 2. 현재 구현 분석

### 2.1 날짜 검증 로직 (`lib/news-fetcher.ts::fetchNewsFromGemini`)

```499:523:lib/news-fetcher.ts
export async function fetchNewsFromGemini(
  date: string = new Date().toISOString().split("T")[0],
  limit?: number,
  categoryFilter?: NewsCategory
): Promise<NewsInput[]> {
  // 날짜 검증: 미래 날짜가 아닌지 확인
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const requestDate = date || todayStr;

  // 미래 날짜인 경우 오늘 날짜로 변경
  if (requestDate > todayStr) {
    log.warn("미래 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayStr });
    date = todayStr;
  } else {
    date = requestDate;
  }

  // 날짜가 비정상적으로 미래인 경우 (예: 2025년) 오늘 날짜로 강제 변경
  const requestYear = parseInt(requestDate.substring(0, 4), 10);
  const currentYear = today.getFullYear();
  if (requestYear > currentYear) {
    log.warn("비정상적인 미래 날짜 감지 - 오늘 날짜로 강제 변경", { requestDate, requestYear, currentYear, todayStr });
    date = todayStr;
  }
```

**분석 결과**:
- ✅ 미래 날짜(`requestDate > todayStr`)는 감지하여 오늘 날짜로 변경
- ✅ 비정상적인 미래 연도도 체크
- ❌ **과거 날짜에 대한 검증이 없음**: `else` 블록에서 `date = requestDate;`로 그대로 사용
- ⚠️ 과거 날짜(예: 어제, 지난주)를 전달하면 해당 날짜로 뉴스 수집을 시도함

### 2.2 프롬프트에 날짜 명시

```535:552:lib/news-fetcher.ts
  if (categoryFilter === "태국뉴스") {
    newsSourceInstruction = `${date}의 태국 주요 뉴스(한국어 번역)만 수집하여 JSON 포맷으로 출력해주세요.`;
    newsCountInstruction = limit
      ? `정확히 ${limit}개의 태국 뉴스를 수집해주세요.`
      : `정확히 10개의 태국 뉴스를 수집해주세요.`;
  } else if (categoryFilter === "관련뉴스") {
    newsSourceInstruction = `${date}의 한국에서 태국과 관련된 뉴스만 수집하여 JSON 포맷으로 출력해주세요.`;
    newsCountInstruction = limit
      ? `정확히 ${limit}개의 관련 뉴스를 수집해주세요.`
      : `정확히 10개의 관련 뉴스를 수집해주세요.`;
  } else if (categoryFilter === "한국뉴스") {
    newsSourceInstruction = `${date}의 한국 주요 뉴스만 수집하여 JSON 포맷으로 출력해주세요.`;
    newsCountInstruction = limit
      ? `정확히 ${limit}개의 한국 뉴스를 수집해주세요.`
      : `정확히 10개의 한국 뉴스를 수집해주세요.`;
  } else {
    // categoryFilter가 없으면 모든 카테고리 수집
    newsSourceInstruction = `${date}의 태국 주요 뉴스(한국어 번역), 한국의 태국 관련 뉴스, 한국 주요 뉴스를 수집하여 JSON 포맷으로 출력해주세요.`;
```

**분석 결과**:
- ✅ 프롬프트에 `${date}의` 형태로 날짜를 명시적으로 전달
- ✅ JSON 형식에도 `"published_date": "${date}"`로 날짜 지정 (576줄)
- ⚠️ **단, Gemini API가 실제로 해당 날짜의 뉴스만 반환하는지 보장할 수 없음**
  - API가 최신 뉴스를 우선 반환하거나
  - 날짜 해석 오류로 다른 날짜의 뉴스를 포함할 가능성

### 2.3 호출 경로 분석

#### 2.3.1 GitHub Actions 스크립트 (`scripts/fetch-news.ts`)

```35:35:scripts/fetch-news.ts
    const result = await fetchAndSaveNews();
```

- ❌ date 파라미터 없이 호출 → 기본값 오늘 날짜 사용
- ✅ 일반적인 사용 케이스에서는 문제 없음

#### 2.3.2 Server Action (`lib/actions.ts::fetchAndSaveNewsAction`)

```52:54:lib/actions.ts
export async function fetchAndSaveNewsAction(date?: string, maxImageGenerationTimeMs?: number) {
  try {
    const result = await fetchAndSaveNews(date, maxImageGenerationTimeMs);
```

- ⚠️ `date` 파라미터가 optional → 과거 날짜 전달 가능
- 현재 관리자 페이지에서 이 함수를 호출하는 코드는 확인되지 않았지만, API로 직접 호출 가능

## 3. 문제점 및 위험성 분석

### 3.1 과거 날짜 수집 가능성

**문제**:
- 과거 날짜를 명시적으로 전달하면 해당 날짜의 뉴스를 수집하려고 시도함
- 예: `fetchAndSaveNewsAction("2025-01-01")` 호출 시 2025-01-01의 뉴스 수집 시도

**영향**:
- ❌ 최신 뉴스가 아닌 과거 뉴스가 수집될 수 있음
- ❌ 데이터베이스에 중복된 뉴스가 저장될 수 있음 (같은 날짜로 여러 번 실행 시)
- ⚠️ Context Caching이 날짜 기반이므로, 과거 날짜로 캐시된 결과가 재사용될 수 있음

### 3.2 최신 뉴스 보장 불가

**문제**:
- 프롬프트에 날짜를 명시하지만, Gemini API가 실제로 해당 날짜의 최신 뉴스만 반환하는지 보장할 수 없음
- API가 최신 뉴스를 우선 반환하거나, 날짜 해석 오류로 다른 날짜의 뉴스를 포함할 가능성

**영향**:
- ⚠️ 실행 시점 이전 날짜의 뉴스가 포함될 수 있음
- ⚠️ 예: 오늘(2025-01-03) 뉴스 수집 시도 시, 어제(2025-01-02) 또는 그 이전 날짜의 뉴스가 포함될 수 있음

### 3.3 시간대 문제

**문제**:
- `new Date().toISOString().split("T")[0]`는 UTC 기준 날짜를 반환
- 서버 시간대가 KST(UTC+9)인 경우, 자정 전후에 날짜 차이가 발생할 수 있음

**영향**:
- ⚠️ 한국 시간 자정(00:00) 전에 실행하면 UTC 기준으로는 전날 날짜가 될 수 있음
- 예: KST 2025-01-03 00:30 = UTC 2025-01-02 15:30 → "2025-01-02" 날짜로 수집 시도

## 4. 권장 개선 사항

### 4.1 과거 날짜 체크 추가 (권장)

```typescript
// lib/news-fetcher.ts::fetchNewsFromGemini 함수 내부
// 과거 날짜 체크 추가
const daysDiff = Math.floor((new Date(requestDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));

if (daysDiff < 0) {
  log.warn("과거 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayStr, daysDiff });
  date = todayStr;
} else if (requestDate > todayStr) {
  log.warn("미래 날짜 감지 - 오늘 날짜로 변경", { requestDate, todayStr });
  date = todayStr;
} else {
  date = requestDate;
}
```

**효과**:
- ✅ 과거 날짜 전달 시 오늘 날짜로 자동 변경
- ✅ 항상 최신(오늘) 뉴스만 수집 보장

### 4.2 프롬프트에 "최신" 강조 추가 (선택)

```typescript
newsSourceInstruction = `${date}의 최신 태국 주요 뉴스(한국어 번역)만 수집하여 JSON 포맷으로 출력해주세요. 날짜가 정확히 ${date}인 뉴스만 수집해주세요.`;
```

**효과**:
- ⚠️ Gemini API가 날짜를 더 명확히 인식하도록 유도
- ⚠️ 단, API 응답 보장은 불가능

### 4.3 시간대 명시 (선택)

```typescript
// 한국 시간 기준으로 날짜 계산 (서버가 UTC인 경우)
const koreaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
const todayStr = koreaTime.toISOString().split("T")[0];
```

**효과**:
- ✅ 한국 시간 기준으로 날짜 계산
- ✅ 시간대 차이로 인한 날짜 오류 방지

### 4.4 수집된 뉴스의 published_date 검증 (선택)

```typescript
// 수집된 뉴스의 published_date가 요청한 날짜와 일치하는지 검증
const filteredNews = newsItems.filter(item => item.published_date === date);
if (filteredNews.length !== newsItems.length) {
  log.warn("날짜 불일치 뉴스 감지", {
    requestedDate: date,
    filtered: filteredNews.length,
    total: newsItems.length
  });
}
```

**효과**:
- ✅ 수집된 뉴스의 날짜가 요청한 날짜와 일치하는지 확인
- ✅ 불일치 시 경고 로그 기록

## 5. 결론

### 5.1 현재 상태 (수정 후)

- ✅ 미래 날짜는 체크하여 오늘 날짜로 변경
- ✅ **과거 날짜 체크 추가됨** (2025-01-03 수정)
- ✅ **한국 시간(KST) 기준 날짜 계산** (2025-01-03 수정)
- ✅ **프롬프트에 날짜 정확성 강조** (2025-01-03 수정)
- ✅ **published_date 검증 및 강제 설정** (2025-01-03 수정)
- ⚠️ 최신 뉴스 보장은 여전히 API 응답에 의존 (프롬프트 강화로 개선)

### 5.2 과거 날짜 수집 가능성 (수정 후)

**답변**: 방지되었습니다.

1. **명시적으로 과거 날짜를 전달하는 경우**:
   - `fetchAndSaveNewsAction("2025-01-01")` 호출 시 과거 날짜 감지하여 오늘 날짜로 자동 변경
   - ✅ **과거 날짜 체크 로직이 추가되어 방지됨**

2. **실행 시점 이전 날짜의 뉴스 수집 가능성**:
   - 프롬프트에 날짜를 명시하고 "최신" 및 "정확히 ${date}인 뉴스만" 강조
   - ✅ **프롬프트 강화로 개선됨**
   - ✅ **published_date 검증 로직 추가로 불일치 시 경고 및 강제 설정**
   - ✅ **한국 시간 기준 날짜 계산으로 시간대 차이 문제 해결**

### 5.3 적용된 개선 사항

1. ✅ **과거 날짜 체크 추가** (4.1) - 적용 완료
2. ✅ **시간대 명시 (KST 기준)** (4.3) - 적용 완료
3. ✅ **프롬프트 강화** (4.2) - 적용 완료
4. ✅ **published_date 검증** (4.4) - 적용 완료

### 5.4 수정 상세 내역

**수정일**: 2025-01-03

**주요 변경사항**:

1. **과거 날짜 체크 로직 추가** (`lib/news-fetcher.ts:504-523`)
   - 날짜 차이를 계산하여 과거 날짜 감지
   - 과거 날짜 전달 시 오늘 날짜로 자동 변경
   - 로그 경고 기록

2. **한국 시간(KST) 기준 날짜 계산** (`lib/news-fetcher.ts:505-507`)
   - `Asia/Seoul` 시간대 기준으로 오늘 날짜 계산
   - UTC와 KST 시간대 차이로 인한 날짜 오류 방지

3. **프롬프트 강화** (`lib/news-fetcher.ts:535-552`)
   - "최신" 키워드 추가
   - "날짜가 정확히 ${date}인 뉴스만 수집해주세요" 문구 추가
   - Gemini API가 날짜를 더 명확히 인식하도록 개선

4. **published_date 검증 및 강제 설정** (`lib/news-fetcher.ts:827-854`)
   - 수집된 뉴스의 published_date가 요청한 날짜와 일치하는지 확인
   - 불일치 시 경고 로그 기록
   - 모든 뉴스 항목의 published_date를 요청한 날짜로 강제 설정하여 일관성 보장

