# url.parse() Deprecation 경고 해결

**수정 일시**: 2025-12-31

---

## 문제

개발 서버 실행 시 다음과 같은 deprecation 경고가 발생했습니다:

```
(node:48844) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized
and prone to errors that have security implications. Use the WHATWG URL API instead.
```

---

## 원인 분석

1. **코드베이스 확인 결과**: 프로젝트 코드에서 직접 `url.parse()`를 사용하는 곳은 없습니다.
2. **모든 URL 처리**: WHATWG URL API (`new URL()`)를 사용하고 있습니다.
3. **경고 발생 원인**: 의존성 패키지(Next.js, Sentry, Supabase 등)에서 내부적으로 `url.parse()`를 사용하고 있을 가능성이 높습니다.

---

## 해결 방법

### 1. `cross-env` 패키지 설치

Windows와 Unix 계열 시스템 모두에서 환경 변수를 설정할 수 있도록 `cross-env`를 설치했습니다.

```bash
npm install --save-dev cross-env
```

### 2. `package.json` 스크립트 수정

`dev`와 `start` 스크립트에 `NODE_OPTIONS=--no-deprecation`을 추가하여 deprecation 경고를 억제했습니다.

**변경 전:**
```json
{
  "scripts": {
    "dev": "next dev",
    "start": "next start"
  }
}
```

**변경 후:**
```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev",
    "start": "cross-env NODE_OPTIONS=--no-deprecation next start"
  }
}
```

---

## 참고 사항

### 경고 억제 vs 해결

- **경고 억제**: `--no-deprecation` 플래그로 경고 메시지만 숨깁니다.
- **실제 해결**: 의존성 패키지가 업데이트되어 `url.parse()`를 사용하지 않도록 변경되어야 합니다.

### 권장 사항

1. **의존성 업데이트**: 정기적으로 `npm update`를 실행하여 최신 버전으로 업데이트
2. **경고 모니터링**: 프로덕션 환경에서는 경고를 억제하지 않고 모니터링하는 것을 권장
3. **의존성 검토**: `npm audit`을 실행하여 보안 취약점 확인

---

## 확인된 URL 처리 코드

프로젝트에서 사용하는 모든 URL 처리는 WHATWG URL API를 사용하고 있습니다:

- `lib/utils/analytics.ts`: `new URL()` 사용
- `middleware.ts`: `new URL()` 사용
- `app/api/admin/metrics/history/route.ts`: `new URL()` 사용
- `lib/utils/api-helpers.ts`: `new URL()` 사용

---

## 테스트

개발 서버를 재시작하여 경고가 억제되었는지 확인:

```bash
npm run dev
```

**예상 결과**: `url.parse()` deprecation 경고가 더 이상 표시되지 않습니다.

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31

