# Nano Banana Pro API 분석 및 호환성 검토

## 개요

Google AI Studio 공식 문서를 기반으로 Nano Banana Pro API의 기능 및 현재 프로젝트와의 호환성을 검토한 결과입니다.

## Nano Banana Pro 정보

### 모델 정보
- **Nano Banana**: Gemini 2.5 Flash Image 모델
  - 속도와 효율성에 최적화
  - 대량의 저지연 작업에 적합

- **Nano Banana Pro**: Gemini 3 Pro Image Preview 모델
  - 고해상도 이미지 생성 및 편집 기능
  - 1K, 2K, 4K 해상도 지원

### 주요 기능
1. **고해상도 이미지 생성**: 1K, 2K, 4K 해상도 지원
2. **AI 사고 모드**: 복잡한 구성을 위한 중간 사고 이미지 생성
3. **웹 검색 그라운딩**: 실시간 Google 검색 데이터 통합
4. **다중 이미지 융합**: 최대 8개의 참조 이미지 혼합
5. **전문가급 컨트롤**: 카메라 앵글, 조명, 피사계 심도, 초점, 색상 그레이딩 제어

## API 호환성 검토

### 현재 프로젝트 상태
- **사용 중인 SDK**: `@google/generative-ai` v0.24.1
- **현재 구현**: REST API 직접 호출 방식으로 변경
- **모델 이름**: `gemini-2.5-flash-image` (추정, 공식 문서 확인 필요)

### 공식 문서 확인 결과

#### 1. API 엔드포인트
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

#### 2. 모델 이름 (확인 필요)
- Nano Banana: `gemini-2.5-flash-image` (추정)
- Nano Banana Pro: `gemini-3-pro-image-preview` 또는 `gemini-3-pro-image` (추정)

#### 3. 응답 형식
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "data": "base64_encoded_image_data",
          "mimeType": "image/png"
        }
      }]
    }
  }]
}
```

## 구현 변경 사항

### REST API 직접 호출 방식
현재 `@google/generative-ai` SDK의 `generateContent()` 메서드로는 이미지 생성이 작동하지 않으므로, REST API를 직접 호출하는 방식으로 구현했습니다.

### 주요 변경점
1. **API 엔드포인트 직접 호출**: `fetch()`를 사용하여 REST API 호출
2. **응답 파싱**: `inlineData`에서 Base64 이미지 데이터 추출
3. **에러 처리**: 모델이 존재하지 않거나 이미지 생성을 지원하지 않는 경우 명확한 에러 메시지

## 호환성 문제 및 해결 방안

### 문제점
1. **모델 이름 불확실**: 정확한 모델 이름이 공식 문서에서 명확하지 않음
2. **SDK 제한**: 현재 SDK 버전이 이미지 생성을 지원하지 않을 수 있음
3. **API 응답 형식**: 실제 응답 형식이 예상과 다를 수 있음

### 해결 방안

#### 옵션 1: 모델 이름 확인 및 테스트
- Google AI Studio에서 실제 사용 가능한 모델 이름 확인
- 다양한 모델 이름으로 테스트 (`gemini-2.5-flash-image`, `gemini-3-pro-image-preview` 등)

#### 옵션 2: SDK 업데이트
- 최신 버전의 `@google/generative-ai` SDK 확인
- 이미지 생성 기능이 추가되었는지 확인

#### 옵션 3: 대안 API 사용
- Replicate API (Stable Diffusion) - 이미 구현됨
- Hugging Face API - 무료 티어 제공
- DeepAI API - 간단한 통합

## 테스트 필요 사항

1. **모델 이름 확인**: Google AI Studio에서 실제 사용 가능한 모델 이름 확인
2. **API 응답 테스트**: 실제 API 호출 시 응답 형식 확인
3. **에러 처리**: 모델이 존재하지 않는 경우 적절한 에러 메시지 표시

## 권장 사항

### 즉시 적용 가능한 해결책
1. **Replicate API 사용**: 이미 구현되어 있고 안정적으로 작동
2. **Hugging Face API 사용**: 무료 티어 제공
3. **DeepAI API 사용**: 간단한 통합

### 장기적 해결책
1. **공식 문서 확인**: `ai.google.dev/gemini-api/docs/nanobanana`에서 정확한 API 사용 방법 확인
2. **모델 이름 확인**: Google AI Studio에서 실제 사용 가능한 모델 이름 확인
3. **SDK 업데이트**: 최신 버전의 `@google/generative-ai` SDK 확인 및 업데이트

## 참고 자료
- [Google AI Studio](https://ai.google.dev/aistudio/)
- [Nano Banana Pro 문서](https://ai.google.dev/gemini-api/docs/nanobanana)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)

## 결론

현재 REST API 직접 호출 방식으로 구현했으나, 정확한 모델 이름과 API 응답 형식 확인이 필요합니다.

**권장 조치:**
1. Google AI Studio에서 실제 모델 이름 확인
2. API 호출 테스트를 통해 응답 형식 확인
3. 임시로 Replicate/Hugging Face/DeepAI API 사용
