# 메트릭 모니터링 기능 테스트 가이드

## 1. Supabase 마이그레이션 확인

✅ **완료**: `metrics_history` 테이블이 성공적으로 생성되었습니다.

### 테이블 구조
- `id`: UUID (Primary Key)
- `metric_type`: TEXT (performance | business | system)
- `metric_name`: TEXT (api_response_time | news_collection_success_rate | image_generation_success_rate | news_collection_count | image_generation_count | total_news | news_by_category | failed_translation_count | news_without_image)
- `metric_value`: NUMERIC (메트릭 값)
- `metadata`: JSONB (추가 메타데이터, nullable)
- `created_at`: TIMESTAMPTZ (생성 시간)

### 인덱스
- `idx_metrics_history_type`: metric_type 인덱스
- `idx_metrics_history_name`: metric_name 인덱스
- `idx_metrics_history_created_at`: created_at 인덱스 (DESC)
- `idx_metrics_history_type_name_created`: 복합 인덱스

### RLS 정책
- `metrics_history_block_anon`: anon key로의 직접 접근 차단 (서버 사이드만 접근 가능)

## 2. 테스트용 메트릭 데이터

✅ **완료**: 테스트용 메트릭 데이터가 생성되었습니다.

생성된 메트릭:
- `performance.api_response_time`: 20개 (최근 7일)
- `business.news_collection_success_rate`: 15개 (최근 7일)
- `business.image_generation_success_rate`: 15개 (최근 7일)
- `business.news_collection_count`: 20개 (최근 7일)
- `business.image_generation_count`: 20개 (최근 7일)

## 3. 관리자 페이지에서 모니터링 탭 확인

### 접속 방법
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/admin/login` 접속
3. `ADMIN_PASSWORD` 환경 변수에 설정된 비밀번호 입력
4. 로그인 성공 시 `/admin` 페이지로 리다이렉트
5. 상단 탭에서 **"모니터링"** 탭 클릭

### 확인 사항
- ✅ 시스템 통계 카드 표시 (전체 뉴스, 오늘 수집된 뉴스, 최근 7일 뉴스, 번역 실패 뉴스, 이미지 없는 뉴스)
- ✅ 카테고리별 뉴스 개수 표시
- ✅ 성능 메트릭 차트 표시 (API 응답 시간)
- ✅ 비즈니스 메트릭 차트 표시:
  - 뉴스 수집 성공률 (Line 차트)
  - 이미지 생성 성공률 (Line 차트)
  - 시간대별 뉴스 수집 추이 (Bar 차트)
  - 시간대별 이미지 생성 추이 (Bar 차트)

## 4. 뉴스 수집 후 메트릭 저장 확인

### 테스트 방법
1. 관리자 페이지에서 뉴스 수집 실행 (또는 `npm run fetch-news` 실행)
2. 뉴스 수집 완료 후 Supabase에서 메트릭 확인:

```sql
-- 최근 저장된 메트릭 확인
SELECT
  metric_type,
  metric_name,
  metric_value,
  metadata,
  created_at
FROM metrics_history
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

### 확인할 메트릭
- ✅ `business.news_collection_success_rate`: 뉴스 수집 성공률 (%)
- ✅ `business.news_collection_count`: 수집된 뉴스 개수
- ✅ `business.image_generation_success_rate`: 이미지 생성 성공률 (%)
- ✅ `business.image_generation_count`: 생성된 이미지 개수
- ✅ `performance.api_response_time`: API 응답 시간 (ms) - `/api/admin/metrics` 호출 시

### 메트릭 저장 위치
- 뉴스 수집: `lib/news-fetcher.ts`의 `fetchAndSaveNews()` 함수
- 이미지 생성: `lib/news-fetcher.ts`의 `generateImagesForNews()` 함수
- API 응답 시간: `app/api/admin/metrics/route.ts`의 `GET` 핸들러

## 5. 차트 정상 표시 확인

### 확인 사항
1. **차트 로딩**
   - 차트가 정상적으로 로드되는지 확인
   - "로딩 중..." 메시지가 잠시 표시된 후 차트가 나타나는지 확인

2. **데이터 표시**
   - X축: 시간 (월/일 시:분 형식)
   - Y축: 메트릭 값 (응답 시간은 ms, 성공률은 %, 개수는 숫자)
   - 데이터 포인트가 정상적으로 표시되는지 확인

3. **Tooltip**
   - 차트 위에 마우스를 올렸을 때 Tooltip이 표시되는지 확인
   - Tooltip에 시간과 값이 정확히 표시되는지 확인

4. **반응형**
   - 브라우저 창 크기를 조절했을 때 차트가 반응형으로 조정되는지 확인

5. **데이터 없음 처리**
   - 메트릭 데이터가 없는 경우 "데이터가 없습니다." 메시지가 표시되는지 확인

## 6. API 엔드포인트 테스트

### 메트릭 히스토리 조회 API
```bash
# 최근 7일간의 API 응답 시간 조회
curl http://localhost:3000/api/admin/metrics/history?metricType=performance&metricName=api_response_time

# 최근 7일간의 뉴스 수집 성공률 조회
curl http://localhost:3000/api/admin/metrics/history?metricType=business&metricName=news_collection_success_rate

# 특정 날짜 범위 조회
curl "http://localhost:3000/api/admin/metrics/history?metricType=business&metricName=news_collection_count&startDate=2024-12-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"
```

### 응답 형식
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "uuid",
        "metric_type": "business",
        "metric_name": "news_collection_success_rate",
        "metric_value": 95.5,
        "metadata": {
          "total": 10,
          "success": 9,
          "failed": 1
        },
        "created_at": "2024-12-28T12:00:00Z"
      }
    ],
    "count": 1,
    "query": {
      "metricType": "business",
      "metricName": "news_collection_success_rate",
      "startDate": "2024-12-21T00:00:00Z",
      "endDate": "2024-12-28T00:00:00Z",
      "limit": 100
    }
  }
}
```

## 7. 문제 해결

### 차트가 표시되지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. 네트워크 탭에서 API 요청이 성공했는지 확인
3. `recharts` 라이브러리가 정상적으로 설치되었는지 확인: `npm list recharts`

### 메트릭이 저장되지 않는 경우
1. 뉴스 수집 로그 확인: `lib/news-fetcher.ts`의 로그 확인
2. Supabase 연결 확인: `.env.local`의 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 확인
3. 데이터베이스 권한 확인: Service Role Key가 정상적으로 설정되었는지 확인

### API 응답 시간이 측정되지 않는 경우
1. `app/api/admin/metrics/route.ts`에서 성능 측정 코드가 정상적으로 실행되는지 확인
2. 비동기 메트릭 저장이 실패해도 API 응답에는 영향이 없어야 함

## 8. 추가 개선 사항

### 향후 개선 가능한 기능
1. **더 긴 기간의 데이터 조회**
   - 30일, 90일, 1년 등 더 긴 기간의 데이터 조회 옵션 추가
   - 날짜 범위 선택 UI 추가

2. **메트릭 알림 시스템**
   - 성공률이 특정 임계값 이하로 떨어질 때 알림
   - API 응답 시간이 특정 임계값을 초과할 때 알림

3. **메트릭 데이터 내보내기**
   - CSV 또는 JSON 형식으로 메트릭 데이터 내보내기
   - 특정 기간의 메트릭 데이터 다운로드

4. **실시간 업데이트**
   - WebSocket을 통한 실시간 메트릭 업데이트
   - 자동 새로고침 간격 조정 옵션


