# 모니터링 페이지 디버깅 가이드

## 문제 진단 방법

### 1. 브라우저 개발자 도구 확인

#### 콘솔 탭
1. F12 또는 우클릭 → 검사
2. Console 탭 확인
3. 다음 에러 메시지 확인:
   - "메트릭 로드 실패"
   - "메트릭 데이터를 불러오는데 실패했습니다"
   - 네트워크 에러 (CORS, 401, 403, 500 등)

#### 네트워크 탭
1. Network 탭 열기
2. 모니터링 페이지 새로고침
3. 다음 API 요청 확인:
   - `/api/admin/metrics` (GET)
   - `/api/admin/metrics/history?metricType=...` (GET)
4. 각 요청의 상태 코드 확인:
   - **200**: 성공
   - **401**: 인증 실패 (관리자 로그인 필요)
   - **403**: 권한 없음
   - **500**: 서버 에러

### 2. 일반적인 문제 및 해결 방법

#### 문제 1: 401 Unauthorized (인증 실패)

**증상**:
- API 요청이 401 상태 코드 반환
- "관리자 인증이 필요합니다" 에러 메시지

**해결 방법**:
1. `/admin/login` 페이지에서 로그인
2. `ADMIN_PASSWORD` 환경 변수가 올바르게 설정되었는지 확인
3. 쿠키가 차단되었는지 확인 (브라우저 설정)

#### 문제 2: 500 Internal Server Error

**증상**:
- API 요청이 500 상태 코드 반환
- 서버 로그에 에러 메시지

**해결 방법**:
1. 서버 로그 확인 (터미널 또는 Vercel 로그)
2. Supabase 연결 확인:
   - `.env.local`의 `SUPABASE_URL` 확인
   - `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY` 확인
3. 데이터베이스 테이블 확인:
   - `metrics_history` 테이블이 존재하는지 확인
   - RLS 정책이 올바르게 설정되었는지 확인

#### 문제 3: 데이터가 표시되지 않음

**증상**:
- API 요청은 성공 (200)
- 하지만 차트에 데이터가 표시되지 않음

**해결 방법**:
1. API 응답 확인 (Network 탭 → Response):
   ```json
   {
     "success": true,
     "data": {
       "metrics": [...]
     }
   }
   ```
2. `metrics` 배열이 비어있는지 확인
3. 날짜 범위 확인 (기본값: 최근 7일)
4. 메트릭 데이터가 실제로 존재하는지 확인:
   ```sql
   SELECT COUNT(*) FROM metrics_history
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

#### 문제 4: 차트가 렌더링되지 않음

**증상**:
- "로딩 중..." 메시지가 계속 표시됨
- 또는 빈 화면

**해결 방법**:
1. `recharts` 라이브러리 설치 확인:
   ```bash
   npm list recharts
   ```
2. 브라우저 콘솔에서 JavaScript 에러 확인
3. React 컴포넌트 에러 확인 (Error Boundary)

### 3. API 엔드포인트 직접 테스트

#### curl 명령어로 테스트

```bash
# 관리자 인증 (로그인 후 쿠키 복사)
curl -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your_admin_password"}' \
  -c cookies.txt

# 메트릭 조회 (쿠키 사용)
curl http://localhost:3000/api/admin/metrics \
  -b cookies.txt

# 메트릭 히스토리 조회
curl "http://localhost:3000/api/admin/metrics/history?metricType=performance&metricName=api_response_time" \
  -b cookies.txt
```

### 4. 데이터베이스 직접 확인

#### Supabase SQL Editor에서 확인

```sql
-- 최근 메트릭 데이터 확인
SELECT
  metric_type,
  metric_name,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM metrics_history
GROUP BY metric_type, metric_name
ORDER BY metric_type, metric_name;

-- 특정 메트릭의 최근 데이터 확인
SELECT *
FROM metrics_history
WHERE metric_type = 'performance'
  AND metric_name = 'api_response_time'
ORDER BY created_at DESC
LIMIT 10;
```

### 5. 로그 확인

#### 서버 사이드 로그
- 개발 환경: 터미널에서 `npm run dev` 실행 시 로그 확인
- 프로덕션 환경: Vercel 대시보드 → Functions → Logs

#### 클라이언트 사이드 로그
- 브라우저 콘솔에서 `clientLog` 메시지 확인
- "메트릭 로드 실패" 에러 메시지 확인

### 6. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 관리자
ADMIN_PASSWORD=your_admin_password
```

### 7. 일반적인 해결 단계

1. **브라우저 캐시 클리어**
   - Ctrl+Shift+Delete (Windows/Linux)
   - Cmd+Shift+Delete (Mac)
   - 또는 시크릿 모드로 테스트

2. **서버 재시작**
   ```bash
   # 개발 서버 중지 (Ctrl+C)
   npm run dev
   ```

3. **의존성 재설치**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **빌드 재생성**
   ```bash
   npm run build
   ```

### 8. 추가 디버깅 정보

모니터링 페이지에서 다음 정보를 확인할 수 있습니다:

- **마지막 업데이트 시간**: 페이지 상단에 표시
- **새로고침 버튼**: 수동으로 데이터 다시 로드
- **에러 메시지**: Toast 알림으로 표시

### 9. 문제 보고 시 포함할 정보

문제를 보고할 때 다음 정보를 포함해주세요:

1. 브라우저 콘솔 에러 메시지 (전체)
2. Network 탭의 API 요청/응답 (스크린샷)
3. 서버 로그 (터미널 출력)
4. 환경 변수 설정 상태 (민감한 값 제외)
5. 재현 단계


