# Sentry 8.x+ 마이그레이션 완료

**마이그레이션 일시**: 2025-12-31
**Sentry SDK 버전**: @sentry/nextjs 10.30.0
**Next.js 버전**: 14.2.33

---

## 개요

Sentry 8.x+ 및 Next.js 15+ (Turbopack) 지원을 위해 Sentry 설정을 최신 권장사항에 맞게 마이그레이션했습니다.

---

## 변경 사항

### 1. `instrumentation.ts` 파일 생성

**위치**: `instrumentation.ts` (프로젝트 루트)

**변경 내용**:
- Next.js Instrumentation Hook을 사용하여 서버 및 Edge 런타임 설정을 등록
- `register()` 함수 내에서 직접 `Sentry.init()` 호출
- 기존 `sentry.server.config.ts`와 `sentry.edge.config.ts`의 내용을 통합

**코드 구조**:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({ /* 서버 설정 */ });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({ /* Edge 설정 */ });
  }
}
```

### 2. `instrumentation-client.ts` 파일 생성

**위치**: `instrumentation-client.ts` (프로젝트 루트)

**변경 내용**:
- 기존 `sentry.client.config.ts`를 대체
- Turbopack 지원을 위해 필수
- `onRouterTransitionStart` hook 추가 (네비게이션 추적)

**주요 기능**:
- 클라이언트 사이드 Sentry 초기화
- Router 전환 자동 추적
- 브라우저 확장 프로그램 에러 필터링

### 3. `app/global-error.tsx` 파일 생성

**위치**: `app/global-error.tsx`

**변경 내용**:
- App Router의 React 렌더링 에러를 캡처하는 Global Error Boundary
- Next.js의 `global-error.tsx` 컨벤션 사용
- Sentry에 자동으로 에러 전송

**기능**:
- React 컴포넌트 렌더링 에러 캡처
- Sentry에 에러 전송 (digest, componentStack 포함)
- 사용자 친화적인 에러 UI 표시

### 4. `next.config.js` 업데이트

**변경 내용**:
- `experimental.instrumentationHook: true` 추가
- Instrumentation Hook 활성화

### 5. 기존 파일 삭제

**삭제된 파일**:
- ✅ `sentry.server.config.ts` - `instrumentation.ts`로 통합
- ✅ `sentry.edge.config.ts` - `instrumentation.ts`로 통합
- ✅ `sentry.client.config.ts` - `instrumentation-client.ts`로 대체

---

## 해결된 경고

### ✅ Before (경고 발생)
```
[@sentry/nextjs] It appears you've configured a `sentry.server.config.ts` file.
Please ensure to put this file's content into the `register()` function of a
Next.js instrumentation file instead.

[@sentry/nextjs] It seems like you don't have a global error handler set up.
It is recommended that you add a 'global-error.js' file with Sentry instrumentation.

[@sentry/nextjs] It appears you've configured a `sentry.edge.config.ts` file.
Please ensure to put this file's content into the `register()` function.

[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your
`sentry.client.config.ts` file, or moving its content to `instrumentation-client.ts`.
```

### ✅ After (경고 없음)
- 모든 Sentry 경고가 해결됨
- 빌드 성공
- Turbopack 지원 준비 완료

---

## 파일 구조

```
프로젝트 루트/
├── instrumentation.ts              # 서버/Edge 런타임 설정 (신규)
├── instrumentation-client.ts      # 클라이언트 설정 (신규)
└── app/
    └── global-error.tsx            # Global Error Boundary (신규)

삭제된 파일:
├── sentry.server.config.ts         # 삭제됨
├── sentry.edge.config.ts           # 삭제됨
└── sentry.client.config.ts         # 삭제됨
```

---

## 주요 개선 사항

### 1. Turbopack 지원
- `instrumentation-client.ts` 사용으로 Turbopack과 호환
- Next.js 15+ 업그레이드 준비 완료

### 2. 에러 추적 개선
- `global-error.tsx`로 React 렌더링 에러 자동 캡처
- App Router의 모든 에러를 Sentry에 전송

### 3. 네비게이션 추적
- `onRouterTransitionStart` hook으로 라우터 전환 자동 추적
- 성능 모니터링 향상

### 4. 코드 구조 개선
- 설정 파일 통합으로 유지보수성 향상
- Next.js 표준 컨벤션 준수

---

## 참고 자료

- [Sentry Next.js 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Instrumentation Hook](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Sentry 7.x to 8.x 마이그레이션 가이드](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v7-to-v8/)

---

## 테스트

### 빌드 테스트
```bash
npm run build
```

**결과**: ✅ 성공 (경고 없음)

### 개발 서버 테스트
```bash
npm run dev
```

**확인 사항**:
- Sentry 초기화 확인
- 에러 발생 시 Sentry 전송 확인
- 네비게이션 추적 확인

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31


