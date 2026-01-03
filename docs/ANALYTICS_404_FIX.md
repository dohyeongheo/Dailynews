# Analytics API 404 에러 수정

**수정 날짜**: 2025-12-30
**문제**: `/api/analytics/session`과 `/api/analytics/pageview`가 404 에러 반환

## 원인 분석

1. **파일 확인**: ✅ 파일이 올바른 위치에 존재 (`app/api/analytics/*/route.ts`)
2. **Export 확인**: ✅ `export const POST` 정상적으로 정의됨
3. **문법 확인**: ✅ 문법 오류 없음
4. **Middleware 확인**: Analytics API가 CSRF 보호에서 제외되어 있지만, 명시적으로 통과시키는 로직이 없었음

## 수정 사항

### 1. Middleware 수정 (`middleware.ts`)

Analytics API를 명시적으로 통과시키도록 수정:

```typescript
// Analytics API는 공개 API로 통과 (CSRF 보호 제외)
const isAnalyticsApi = nextUrl.pathname.startsWith("/api/analytics");
if (isAnalyticsApi) {
  return NextResponse.next();
}
```

**이유**:
- Analytics API는 공개 API로, 모든 사용자가 접근할 수 있어야 함
- CSRF 보호에서 제외되어 있지만, middleware에서 명시적으로 통과시키는 것이 더 명확함
- 다른 middleware 로직(관리자 인증 등)과의 충돌 방지

## 추가 조치 사항

### Next.js 개발 서버 재시작 필요

코드 수정 후 Next.js 개발 서버를 재시작해야 라우트가 정상적으로 인식됩니다:

```bash
# 개발 서버 중지 (Ctrl+C)
# 그 다음 재시작
npm run dev
```

### 빌드 캐시 삭제 (선택사항)

만약 재시작 후에도 문제가 지속되면:

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run dev
```

## 확인 방법

수정 후 다음을 확인:

1. **API 직접 테스트**:
   ```bash
   curl -X POST http://localhost:3000/api/analytics/session \
     -H "Content-Type: application/json" \
     -d '{"session_id":"test","first_page_path":"/test"}'
   ```
   예상 결과: `200 OK` (404가 아닌)

2. **Browser MCP로 확인**:
   - 관리자 페이지 접속
   - 콘솔 메시지 확인
   - 네트워크 요청 확인

3. **브라우저 콘솔 확인**:
   - Analytics 관련 404 에러가 사라졌는지 확인
   - 페이지뷰 추적이 정상적으로 작동하는지 확인

## 예상 결과

수정 후:
1. ✅ Analytics API가 정상적으로 작동
2. ✅ 페이지뷰 및 이벤트 추적이 정상적으로 수집됨
3. ✅ 콘솔 에러가 사라짐

## 참고

- Next.js App Router는 `app/api/[경로]/route.ts` 형식의 파일을 API 라우트로 자동 인식합니다
- Middleware는 모든 요청에 대해 실행되므로, 공개 API는 명시적으로 통과시키는 것이 좋습니다
- 개발 서버 재시작은 라우트 변경사항을 인식하는 데 필요할 수 있습니다





