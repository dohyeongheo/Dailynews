# Brave News 제목 및 본문 품질 개선 결과

## 개선 일시
2025-12-31

## 발견된 문제점

### 1. 제목 문제
- **문제**: "중앙일보", "경제 | 중앙일보", "KBS 뉴스" 등 언론사 이름만 표시
- **원인**: Brave Search API의 `title` 필드가 실제 제목이 아닌 경우 발생
- **영향**: 사용자 경험 저하, 뉴스 식별 어려움

### 2. 본문 내용 문제
- **문제**: 평균 186-247자로 매우 짧음, HTML 태그 포함, 에러 메시지 포함
- **원인**: Brave Search API는 `description` 필드만 제공하며 제한적
- **영향**: 뉴스 내용 이해도 저하

### 3. 이미지 수집
- **상태**: 100% 생성됨 (정상)
- **개선**: Brave Search API의 `thumbnail` 이미지도 활용하도록 추가

## 구현된 개선 사항

### 1. 제목 정제 로직 (`cleanTitle`)

**기능:**
- HTML 태그 제거
- 언론사 이름 제거 (정규식 패턴 매칭)
- description에서 제목 추출 시도
- URL 경로에서 제목 추출 시도
- 최소 길이 검증 (10자 미만 시 대체 제목 시도)

**언론사 이름 제거 패턴:**
- `| 중앙일보`, `| 서울신문` 등 파이프 구분자 제거
- `경제 | 중앙일보` 같은 카테고리 + 언론사 형식 제거
- 언론사 이름만 있는 경우 description에서 추출

### 2. 본문 정제 로직 (`cleanContent`)

**기능:**
- HTML 태그 제거 (`<strong>`, `<em>` 등)
- HTML 엔티티 디코딩 (`&nbsp;`, `&amp;` 등)
- 에러 메시지 필터링 ("We cannot provide a description" 등)
- 연속된 공백 정리
- 최소 길이 보장 (100자 미만 시 원문 URL 추가)

**에러 메시지 패턴:**
- "We cannot provide a description"
- "Cannot provide"
- "No description available"
- "Description not available"

### 3. 이미지 수집 개선

**기능:**
- Brave Search API의 `thumbnail.src` 필드에서 이미지 URL 추출
- thumbnail 이미지 다운로드 및 저장
- AI 이미지 생성과 병행 (thumbnail이 없으면 AI 생성)

**처리 흐름:**
1. 뉴스 수집 시 thumbnail URL 추출
2. 뉴스 저장 후 thumbnail 이미지 다운로드
3. Vercel Blob Storage에 업로드
4. DB에 image_url 업데이트

### 4. Rate Limit 처리 개선

**개선 사항:**
- API 호출 간 대기 시간 증가 (500ms → 1200ms)
- Rate limit 오류 시 명확한 에러 메시지
- 재시도 시간 안내

## 코드 변경 사항

### 추가된 함수

1. **`stripHtmlTags(text: string)`**: HTML 태그 제거
2. **`filterErrorMessages(text: string)`**: 에러 메시지 필터링
3. **`extractTitleFromDescription(description: string)`**: description에서 제목 추출
4. **`removePublisherName(title: string, sourceMedia: string)`**: 언론사 이름 제거
5. **`cleanTitle(title, description, url, sourceMedia)`**: 제목 정제 통합 함수
6. **`cleanContent(description, url)`**: 본문 정제 통합 함수
7. **`downloadImageFromUrl(imageUrl: string)`**: URL에서 이미지 다운로드
8. **`saveBraveThumbnailImage(newsId, thumbnailUrl)`**: thumbnail 이미지 저장

### 수정된 함수

1. **`convertBraveResultToNewsInput`**: 정제 로직 적용
2. **`fetchNewsFromBrave`**: 반환 타입 변경 (thumbnail 맵 포함)
3. **`fetchAndSaveNews`**: thumbnail 이미지 처리 로직 추가

## 현재 데이터 분석 결과

### 문제 통계 (개선 전 데이터 기준)

**한국뉴스:**
- 문제가 있는 제목: 9개 (90%)
- HTML 태그 포함: 7개 (70%)
- 짧은 본문: 1개 (10%)

**관련뉴스:**
- 문제가 있는 제목: 8개 (80%)
- HTML 태그 포함: 7개 (70%)
- 짧은 본문: 0개 (0%)

**태국뉴스:**
- 문제가 있는 제목: 0개 (0%)
- HTML 태그 포함: 3개 (30%)
- 짧은 본문: 0개 (0%)

### 예상 개선 효과

개선된 코드 적용 후:
- **제목 품질**: 80-90% 개선 예상
- **HTML 태그 제거**: 100% 적용
- **에러 메시지 필터링**: 100% 적용

## 테스트 결과

### Rate Limit 이슈
- **발견**: Free 플랜은 1 req/sec 제한
- **해결**: API 호출 간 대기 시간을 1.2초로 증가
- **영향**: 3개 카테고리 수집 시 약 4-5초 소요

### 예상 개선 효과

1. **제목 품질**
   - 언론사 이름만 있는 경우: 90% 이상 개선 예상
   - 카테고리 + 언론사 형식: 80% 이상 개선 예상

2. **본문 품질**
   - HTML 태그 제거: 100% 적용
   - 에러 메시지 필터링: 100% 적용
   - 최소 길이 보장: 100% 적용

3. **이미지 수집**
   - thumbnail 이미지 활용: API에서 제공하는 경우 자동 사용
   - AI 이미지 생성: thumbnail이 없을 때만 사용

## 사용 방법

### 환경 변수 설정

```bash
NEWS_COLLECTION_METHOD=brave
BRAVE_SEARCH_API_KEY=your_api_key
```

### 뉴스 수집 실행

```bash
npm run fetch-news
```

### 결과 검증

```bash
npx tsx scripts/verify-brave-news.ts
```

## 주의사항

1. **Rate Limit**: Free 플랜은 1 req/sec 제한이 있으므로, 3개 카테고리 수집 시 약 4초 소요
2. **Thumbnail 이미지**: 모든 뉴스에 thumbnail이 제공되는 것은 아니므로, AI 이미지 생성도 병행
3. **제목 추출**: description이나 URL에서 제목을 추출할 수 없는 경우 원본 title 사용

## 향후 개선 계획

1. **제목 추출 정확도 향상**
   - AI 기반 제목 추출 고려
   - 원문 페이지 크롤링 (법적 제약 확인 필요)

2. **본문 내용 확장**
   - 원문 페이지 크롤링 (법적 제약 확인 필요)
   - 요약 생성 AI 활용

3. **이미지 품질 개선**
   - thumbnail 이미지 품질 검증
   - 이미지 최적화 처리

