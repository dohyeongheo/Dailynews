# Next.js 라우트 404 에러 해결 가이드

## 문제
`/api/admin/metrics` 엔드포인트가 404 에러를 반환합니다.

## 원인
Next.js 개발 서버가 새로운 라우트 파일을 인식하지 못하는 경우가 있습니다. 이는 다음과 같은 이유로 발생할 수 있습니다:

1. **캐시 문제**: `.next` 폴더의 캐시된 라우트 정보
2. **파일 감지 지연**: 개발 서버가 파일 변경을 즉시 감지하지 못함
3. **빌드 캐시**: 이전 빌드의 라우트 정보가 남아있음

## 해결 방법

### 방법 1: 개발 서버 재시작 (가장 간단)

1. 개발 서버 중지 (Ctrl+C)
2. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

### 방법 2: .next 폴더 삭제 후 재시작 (권장)

1. 개발 서버 중지 (Ctrl+C)
2. `.next` 폴더 삭제:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next

   # 또는 Windows CMD
   rmdir /s /q .next

   # Linux/Mac
   rm -rf .next
   ```
3. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

### 방법 3: 완전한 클린 빌드

1. 개발 서버 중지
2. 모든 캐시 삭제:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache

   # Linux/Mac
   rm -rf .next
   rm -rf node_modules/.cache
   ```
3. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

## 확인 방법

개발 서버 재시작 후, 브라우저에서 다음을 확인:

1. **브라우저 콘솔**: 에러가 사라졌는지 확인
2. **Network 탭**: `/api/admin/metrics` 요청의 상태 코드가 200인지 확인
3. **터미널 로그**: 개발 서버가 라우트를 인식했는지 확인

## 예방 방법

### 1. 파일 생성 후 자동 재시작
Next.js는 일반적으로 파일 변경을 자동으로 감지하지만, 때로는 수동 재시작이 필요합니다.

### 2. 라우트 파일 확인
새로운 API 라우트를 생성할 때 다음을 확인:

- ✅ 파일 경로: `app/api/[경로]/route.ts`
- ✅ HTTP 메서드 export: `export const GET`, `export const POST` 등
- ✅ 파일 저장: 파일이 실제로 저장되었는지 확인

### 3. TypeScript 컴파일 확인
라우트 파일에 TypeScript 오류가 있으면 라우트가 등록되지 않을 수 있습니다:

```bash
npm run build
```

빌드 오류가 있으면 수정 후 재시작하세요.

## 추가 디버깅

### 라우트 목록 확인
개발 서버를 시작할 때 터미널에 표시되는 라우트 목록을 확인하세요. `/api/admin/metrics`가 목록에 있는지 확인합니다.

### 파일 시스템 확인
파일이 실제로 존재하는지 확인:

```bash
# Windows PowerShell
Test-Path app/api/admin/metrics/route.ts

# Linux/Mac
ls -la app/api/admin/metrics/route.ts
```

### Next.js 라우트 로깅
개발 모드에서 Next.js는 라우트 등록 정보를 로그로 출력합니다. 터미널에서 다음 메시지를 확인:

```
Route (app)                              Size     First Load JS
...
/api/admin/metrics                      0 B                0 B
```

## 참고

- Next.js App Router는 `app` 디렉토리 내의 `route.ts` 파일을 API 라우트로 인식합니다.
- 파일 이름은 반드시 `route.ts` (또는 `route.js`)여야 합니다.
- HTTP 메서드는 `GET`, `POST`, `PUT`, `DELETE`, `PATCH` 중 하나를 export해야 합니다.


