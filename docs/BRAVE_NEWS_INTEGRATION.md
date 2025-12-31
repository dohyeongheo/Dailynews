# Brave News API 통합 가이드

## 개요

이 문서는 Brave Search API를 사용하여 뉴스를 수집하는 기능의 사용 방법과 버전 관리 전략을 설명합니다.

## 기능 설명

Brave Search API를 활용하여 뉴스와 이미지를 수집하는 기능이 구현되었습니다. 기존의 Google Gemini API 방식과 함께 사용할 수 있으며, 환경 변수를 통해 언제든지 전환할 수 있습니다.

## 환경 변수 설정

### 필수 환경 변수

```bash
# Brave Search API 키 (Brave 방식 사용 시 필수)
BRAVE_SEARCH_API_KEY=your_brave_api_key_here

# 뉴스 수집 방식 선택: "gemini" 또는 "brave" (기본값: "gemini")
NEWS_COLLECTION_METHOD=brave
```

### 선택적 환경 변수

```bash
# Gemini API 키 (Gemini 방식 사용 시 필수, 기존 설정 유지)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 사용 방법

### 방법 1: 환경 변수 변경

가장 간단한 방법은 환경 변수를 변경하는 것입니다.

#### Gemini 방식으로 전환

```bash
# .env 파일 또는 환경 변수 설정
NEWS_COLLECTION_METHOD=gemini
```

#### Brave 방식으로 전환

```bash
# .env 파일 또는 환경 변수 설정
NEWS_COLLECTION_METHOD=brave
BRAVE_SEARCH_API_KEY=your_api_key
```

### 방법 2: Git 브랜치 전환

별도의 브랜치에서 Brave 방식을 테스트할 수 있습니다.

```bash
# Brave 방식 테스트 브랜치로 전환
git checkout feature/brave-news-integration

# 기존 방식으로 복귀
git checkout main
```

### 방법 3: 코드에서 직접 호출

특정 상황에서만 Brave 방식을 사용하고 싶다면:

```typescript
import { fetchNewsFromBrave } from '@/lib/news-fetcher-brave';

// Brave 방식으로 뉴스 수집
const newsItems = await fetchNewsFromBrave('2025-01-15');
```

## 버전 관리 전략

### 브랜치 구조

- **`main`**: 기본 브랜치, Gemini 방식 사용 (기본값)
- **`feature/brave-news-integration`**: Brave 방식 구현 및 테스트 브랜치

### 전환 시나리오

#### 시나리오 1: 환경 변수로 즉시 전환

1. 환경 변수 설정 변경
2. 애플리케이션 재시작
3. 즉시 새로운 방식으로 뉴스 수집 시작

**장점**: 빠른 전환, 코드 변경 불필요
**단점**: 재시작 필요

#### 시나리오 2: 브랜치 전환

1. `git checkout feature/brave-news-integration`
2. 환경 변수 설정 (NEWS_COLLECTION_METHOD=brave)
3. 테스트 및 검증
4. 필요시 `main`으로 병합

**장점**: 독립적인 테스트 환경
**단점**: 브랜치 관리 필요

#### 시나리오 3: 병합 후 환경 변수 제어

1. `feature/brave-news-integration` 브랜치를 `main`에 병합
2. 환경 변수로 두 방식 모두 사용 가능
3. 필요에 따라 즉시 전환

**장점**: 최대 유연성
**단점**: 코드 복잡도 증가

## 기능 비교

| 기능 | Gemini 방식 | Brave 방식 |
|------|------------|-----------|
| 뉴스 생성 | AI 생성 | 실제 뉴스 검색 |
| 이미지 | AI 생성 | 검색 결과에서 추출 (가능한 경우) |
| 번역 | 자동 번역 | 필요시 번역 |
| 비용 | API 사용량 기반 | API 사용량 기반 |
| 속도 | 상대적으로 느림 | 상대적으로 빠름 |
| 정확도 | 생성된 내용 | 실제 뉴스 기사 |

## 테스트

### 단위 테스트 실행

```bash
# Brave News 관련 테스트
npm test -- __tests__/lib/news-fetcher-brave.test.ts

# 전체 테스트
npm test
```

### 수동 테스트

```bash
# 뉴스 수집 스크립트 실행
npm run fetch-news
```

## 문제 해결

### API 키 오류

```
Error: BRAVE_SEARCH_API_KEY가 설정되지 않았습니다.
```

**해결 방법**: 환경 변수에 `BRAVE_SEARCH_API_KEY`를 설정하세요.

### API 오류

```
Error: Brave Search API 오류: 500 Internal Server Error
```

**해결 방법**: 
1. API 키가 유효한지 확인
2. API 할당량 확인
3. 네트워크 연결 확인

### 뉴스 수집 실패

특정 카테고리에서 뉴스를 찾을 수 없는 경우, 다른 카테고리는 계속 수집됩니다. 로그를 확인하여 문제를 파악하세요.

## 주의사항

1. **API 할당량**: Brave Search API의 할당량을 확인하고 모니터링하세요.
2. **Rate Limit**: API 호출 간 짧은 대기 시간이 포함되어 있습니다.
3. **번역 비용**: Gemini API를 사용한 번역은 별도 비용이 발생할 수 있습니다.
4. **이미지**: Brave Search API에서 이미지를 제공하지 않는 경우, 기존 AI 이미지 생성 방식을 사용합니다.

## 향후 개선 사항

- [ ] 관리자 페이지에서 UI로 전환 기능 추가
- [ ] 데이터베이스에 설정 저장 기능
- [ ] 두 방식의 결과 비교 기능
- [ ] 자동 전환 로직 (한 방식 실패 시 다른 방식 시도)

## 참고 자료

- [Brave Search API 문서](https://brave.com/search/api/)
- [프로젝트 아키텍처 문서](./ARCHITECTURE.md)
- [API 문서](./API.md)

