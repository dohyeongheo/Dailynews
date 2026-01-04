# Gemini API Grounding 기능 조사 보고서

## 개요

현재 시스템에서 Gemini API를 사용하여 뉴스를 생성하는 방식은 할루시네이션 문제가 심각합니다. 이를 해결하기 위해 Gemini API의 Grounding 기능(Google Search 통합)을 활용한 실제 뉴스 검색 방법을 조사했습니다.

## 1. Gemini API Grounding 기능 기본 정보

### 1.1 Grounding 기능이란?

Gemini API Grounding with Google Search는 AI 모델이 실시간 웹 콘텐츠에 접근하여 최신 정보를 검색하고, 실제 정보를 기반으로 응답을 생성하는 기능입니다.

**주요 특징:**

- **사실성 향상**: 모델의 할루시네이션을 줄이고, 실제 정보를 기반으로 한 응답을 제공
- **최신 정보 제공**: 모델의 지식 컷오프 이후의 최신 정보를 검색하여 반영
- **출처 명시**: 응답 내에 인라인으로 출처 링크를 제공하여 투명성 향상

### 1.2 Google Search와의 통합 방식

Grounding 기능은 `google_search_retrieval` 도구를 통해 활성화됩니다. 모델이 프롬프트를 분석하여 필요한 정보를 Google 검색으로 자동 검색하고, 검색 결과를 기반으로 응답을 생성합니다.

### 1.3 지원 모델

- Gemini 1.5 모델의 모든 정식 출시 버전에서 지원
- Gemini 2.5 Pro 및 Gemini 2.5 Flash 모델도 지원 (확인 필요)

### 1.4 실시간 웹 검색 가능 여부

네, 실시간으로 Google 검색을 수행하여 최신 정보를 검색할 수 있습니다. 이는 뉴스 수집에 매우 유리한 기능입니다.

## 2. 기술적 구현 방법

### 2.1 API 호출 방식

**Python 예시 (공식 문서):**

```python
from google.cloud import generativeai as genai

client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="미국에서 다음 개기일식은 언제인가요?",
    config=genai.GenerateContentConfig(
        tools=[
            genai.Tool(
                google_search=genai.GoogleSearch()
            )
        ],
    ),
)
```

**TypeScript/Node.js SDK 사용 방법:**

현재 프로젝트에서 사용 중인 `@google/generative-ai` 패키지(버전 0.24.1)에서의 사용 방법은 공식 문서를 확인해야 합니다. 일반적으로 다음과 같은 형태로 사용할 것으로 예상됩니다:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  tools: [
    {
      googleSearchRetrieval: {}, // 또는 google_search_retrieval
    },
  ],
});

const result = await model.generateContent(prompt);
```

**참고**: 정확한 API 형식은 `@google/generative-ai` SDK의 최신 문서를 확인해야 합니다. SDK 버전에 따라 API 형식이 다를 수 있습니다.

### 2.2 검색 결과 처리

Grounding 기능을 사용하면 응답에 다음이 포함됩니다:

- 검색 결과를 기반으로 한 응답 텍스트
- 인라인 출처 링크 (grounding metadata)
- 검색 제안 (search suggestions)

응답에서 출처 정보를 추출하여 뉴스 데이터의 `source_media`와 원본 URL을 설정할 수 있습니다.

### 2.3 한국어/태국어 뉴스 검색 지원

Google Search는 한국어와 태국어를 지원하므로, 적절한 프롬프트를 사용하면 한국/태국 뉴스를 검색할 수 있습니다.

예시 프롬프트:

- 한국 뉴스: "오늘(2025-01-03) 한국의 주요 뉴스 10개를 알려주세요"
- 태국 뉴스: "오늘(2025-01-03) 태국의 주요 뉴스 10개를 알려주세요"

## 3. 현재 시스템 적용 가능성

### 3.1 현재 사용 중인 Gemini API 버전

- **SDK 버전**: `@google/generative-ai@^0.24.1`
- **사용 모델**: `gemini-2.5-pro`, `gemini-2.5-flash`
- **구현 위치**: `lib/utils/gemini-client.ts`

### 3.2 Grounding 기능 지원 여부

- Gemini 2.5 Pro/Flash 모델은 Grounding 기능을 지원할 것으로 예상되지만, SDK 버전 0.24.1에서의 지원 여부는 확인이 필요합니다.
- 최신 SDK 버전으로 업데이트가 필요할 수 있습니다.

### 3.3 기존 코드와의 호환성

**현재 구조:**

```typescript
// lib/utils/gemini-client.ts
export async function generateContentWithCaching(
  model: GenerativeModel,
  prompt: string,
  cacheKey?: string,
  taskType?: TaskType
): Promise<GenerateContentResult>;
```

**필요한 변경사항:**

1. `getModelWithCaching()` 함수에 `tools` 파라미터 추가
2. `generateContentWithCaching()` 함수에서 Grounding 활성화 옵션 추가
3. 뉴스 수집 시 Grounding 기능 활성화

**예상 변경 코드:**

```typescript
// lib/utils/gemini-client.ts 수정 예시
export function getModelWithCaching(
  modelName: string,
  cacheKey?: string,
  enableGrounding?: boolean // 추가
): GenerativeModel {
  const genAI = getGenAI();

  const config: any = { model: modelName };

  // Grounding 활성화
  if (enableGrounding) {
    config.tools = [{ googleSearchRetrieval: {} }];
  }

  return genAI.getGenerativeModel(config);
}
```

## 4. 장단점 분석

### 4.1 장점

1. **실제 웹 검색 결과 기반**

   - AI가 학습 데이터를 기반으로 뉴스를 생성하는 것이 아닌, 실제 웹에서 검색한 뉴스를 기반으로 응답
   - 할루시네이션 문제를 근본적으로 해결 가능

2. **최신 뉴스 수집 가능**

   - 실시간 Google 검색을 통해 최신 뉴스 수집
   - 모델의 지식 컷오프 날짜 이후의 정보도 검색 가능

3. **출처 정보 제공**

   - 응답에 원본 URL과 출처 정보가 포함됨
   - 뉴스 데이터의 신뢰성 검증 가능

4. **할루시네이션 감소**
   - 실제 검색 결과를 기반으로 하므로 가짜 뉴스 생성 가능성 대폭 감소

### 4.2 단점

1. **API 비용**

   - 유료 티어: 1,000개의 그라운드된 쿼리당 $35
   - 일반 API 호출보다 비용이 높음
   - 예: 하루 30개 뉴스 수집 시 월 약 $32 (1,000개 기준)

2. **검색 결과 품질 의존**

   - Google 검색 결과의 품질에 의존
   - 검색 결과가 부적절할 경우 뉴스 품질 저하 가능

3. **한국/태국 뉴스 검색 품질**

   - Google 검색의 한국/태국 뉴스 검색 품질에 의존
   - 영어 뉴스에 비해 검색 결과 품질이 낮을 수 있음

4. **응답 구조 변경 필요**

   - Grounding 메타데이터 처리 로직 추가 필요
   - 기존 코드 수정 범위가 큼

5. **SDK 버전 확인 필요**
   - 현재 SDK 버전(0.24.1)에서 Grounding 기능 지원 여부 확인 필요
   - 지원되지 않을 경우 SDK 업데이트 필요

## 5. 비교: 현재 방식 vs Grounding 방식

| 항목             | 현재 방식 (AI 생성)      | Grounding 방식 (웹 검색)              |
| ---------------- | ------------------------ | ------------------------------------- |
| **데이터 소스**  | AI 학습 데이터 기반 생성 | Google 검색 결과 기반                 |
| **신뢰성**       | 할루시네이션 발생 가능   | 실제 웹 검색 결과 기반                |
| **최신성**       | 모델 학습 데이터 기준    | 실시간 최신 정보                      |
| **출처 정보**    | AI가 생성한 가상의 출처  | 실제 검색 결과의 출처 URL             |
| **API 비용**     | 일반 Gemini API 요금     | + Grounding 요금 ($35/1K 쿼리)        |
| **구현 복잡도**  | 낮음 (현재 구현 완료)    | 중간 (SDK 업데이트 및 코드 수정 필요) |
| **할루시네이션** | 심각한 문제 존재         | 대폭 감소 예상                        |

## 6. 현재 시스템 적용 방안

### 6.1 단계별 구현 계획

1. **SDK 버전 확인 및 업데이트**

   - `@google/generative-ai` 최신 버전 확인
   - Grounding 기능 지원 여부 확인
   - 필요 시 SDK 업데이트

2. **테스트 환경 구축**

   - Grounding 기능을 테스트할 수 있는 스크립트 작성
   - 한국/태국 뉴스 검색 테스트 수행
   - 응답 구조 및 메타데이터 확인

3. **코드 수정**

   - `lib/utils/gemini-client.ts` 수정
   - `lib/news-fetcher.ts`의 `fetchNewsFromGemini()` 함수 수정
   - Grounding 메타데이터 처리 로직 추가

4. **비용 모니터링**
   - Grounding API 호출 비용 추적
   - 비용 최적화 방안 모색

### 6.2 예상 코드 변경사항

**lib/utils/gemini-client.ts:**

```typescript
export function getModelWithCaching(modelName: string, cacheKey?: string, enableGrounding?: boolean): GenerativeModel {
  const genAI = getGenAI();
  const env = getEnv();

  const config: any = { model: modelName };

  // Grounding 활성화
  if (enableGrounding) {
    config.tools = [{ googleSearchRetrieval: {} }];
  }

  return genAI.getGenerativeModel(config);
}

export async function generateContentWithCaching(
  model: GenerativeModel,
  prompt: string,
  cacheKey?: string,
  taskType?: TaskType,
  enableGrounding?: boolean
): Promise<GenerateContentResult> {
  // ... 기존 코드 ...
  // Grounding이 활성화된 경우 메타데이터 처리
  // (응답에서 grounding metadata 추출)
}
```

**lib/news-fetcher.ts:**

```typescript
export async function fetchNewsFromGemini(date: string = getTodayKST()): Promise<NewsInput[]> {
  // ...

  const model = getModelForTask("news_collection", date, true); // enableGrounding: true

  const prompt = `${date}의 태국 주요 뉴스, 한국의 태국 관련 뉴스, 한국 주요 뉴스를 각각 10개씩 검색하여 JSON 형식으로 제공해주세요.`;

  const result = await generateContentWithCaching(model, prompt, cacheKey, "news_collection", true);

  // 응답에서 grounding metadata 추출하여 source_media와 원본 URL 설정
  // ...
}
```

## 7. 권장사항

### 7.1 적용 가능성 평가

**적용 가능**: Grounding 기능은 할루시네이션 문제를 근본적으로 해결할 수 있는 유력한 방법입니다.

**주의사항**:

1. SDK 버전 확인 및 업데이트 필요
2. API 비용 증가 (월 약 $30-40 예상)
3. 한국/태국 뉴스 검색 품질 테스트 필요

### 7.2 다음 단계

1. **즉시 실행 가능한 조사**

   - `@google/generative-ai` 최신 버전 확인
   - 공식 문서에서 TypeScript/Node.js SDK의 Grounding 사용법 확인
   - Google AI Studio에서 무료 테스트 수행

2. **테스트 구현**

   - 간단한 테스트 스크립트 작성
   - 한국/태국 뉴스 검색 품질 확인
   - 응답 구조 및 메타데이터 분석

3. **비용 분석**

   - 예상 API 비용 계산
   - 현재 비용과 비교
   - ROI 평가

4. **결정**
   - 테스트 결과 기반으로 적용 여부 결정
   - 적용 시 단계별 구현 계획 수립

## 8. 참고 자료

- [Gemini API Grounding 공식 문서](https://ai.google.dev/gemini-api/docs/grounding/)
- [Gemini API Grounding 블로그 포스트 (한국어)](https://developers.googleblog.com/ko/gemini-api-and-ai-studio-now-offer-grounding-with-google-search/)
- [Vertex AI Grounding 문서](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/grounding)

## 9. 결론

Gemini API Grounding 기능은 현재 시스템의 할루시네이션 문제를 해결할 수 있는 가장 효과적인 방법 중 하나입니다. 실제 웹 검색 결과를 기반으로 뉴스를 수집하므로 가짜 뉴스 생성 가능성을 대폭 줄일 수 있습니다.

다만, SDK 버전 확인, 비용 증가, 그리고 한국/태국 뉴스 검색 품질 테스트가 선행되어야 합니다. 테스트 결과를 바탕으로 최종 적용 여부를 결정하는 것을 권장합니다.

## 10. 관련 문서

- [무료 크롤링 API 및 MCP 서버 활용 방법 조사](./FREE_CRAWLING_API_AND_MCP_RESEARCH.md): RSS 피드, 웹 크롤링, 무료 API 등 대안 방법 조사
