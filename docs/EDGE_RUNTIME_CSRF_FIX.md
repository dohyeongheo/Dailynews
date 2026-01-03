# Edge Runtime CSRF 모듈 호환성 수정

**수정 일시**: 2025-12-31

---

## 문제

빌드 시 다음과 같은 경고가 발생했습니다:

```
./lib/utils/csrf.ts
A Node.js module is loaded ('crypto' at line 2) which is not supported in the Edge Runtime.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
```

---

## 원인 분석

### 문제 상황

1. **`middleware.ts`는 Edge Runtime에서 실행됨**: Next.js의 middleware는 기본적으로 Edge Runtime에서 실행됩니다.
2. **`lib/utils/csrf.ts`에서 Node.js `crypto` 모듈 사용**:
   - `crypto.randomBytes()`: CSRF 토큰 생성
   - `crypto.timingSafeEqual()`: 타이밍 공격 방지를 위한 토큰 비교
3. **동적 import 사용**: `middleware.ts`에서 `verifyCsrfToken`을 동적으로 import하므로 Edge Runtime에서 실행됩니다.

### 의존성 확인

```typescript
// middleware.ts
const { verifyCsrfToken } = await import("@/lib/utils/csrf");
const isValid = verifyCsrfToken(requestToken || null, cookieToken || null);
```

---

## 해결 방법

### 1. Web Crypto API로 전환

Edge Runtime에서 사용 가능한 Web Crypto API를 사용하도록 수정했습니다.

#### 변경 전 (`generateCsrfToken`)

```typescript
import crypto from "crypto";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
```

#### 변경 후 (`generateCsrfToken`)

```typescript
export function generateCsrfToken(): string {
  // Edge Runtime 호환: Web Crypto API 사용
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // Web Crypto API 사용 (Edge Runtime)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  // Node.js Runtime: Node.js crypto 모듈 사용
  const nodeCrypto = require("crypto");
  return nodeCrypto.randomBytes(32).toString("hex");
}
```

#### 변경 전 (`verifyCsrfToken`)

```typescript
export function verifyCsrfToken(requestToken: string | null, cookieToken: string | null): boolean {
  if (!requestToken || !cookieToken) {
    return false;
  }

  try {
    const requestBuffer = Buffer.from(requestToken, "hex");
    const cookieBuffer = Buffer.from(cookieToken, "hex");

    if (requestBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(requestBuffer, cookieBuffer);
  } catch {
    return false;
  }
}
```

#### 변경 후 (`verifyCsrfToken`)

```typescript
export function verifyCsrfToken(requestToken: string | null, cookieToken: string | null): boolean {
  if (!requestToken || !cookieToken) {
    return false;
  }

  // 토큰 길이 확인
  if (requestToken.length !== cookieToken.length) {
    return false;
  }

  // Edge Runtime 호환: Web Crypto API를 사용한 타이밍 공격 방지 비교
  try {
    // Edge Runtime: Web Crypto API 사용
    if (typeof crypto !== "undefined" && "subtle" in crypto) {
      // 간단한 문자열 비교 (타이밍 공격 방지를 위해 모든 문자를 비교)
      let result = 0;
      for (let i = 0; i < requestToken.length; i++) {
        result |= requestToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
      }
      return result === 0;
    }

    // Node.js Runtime: crypto.timingSafeEqual 사용
    const nodeCrypto = require("crypto");
    const requestBuffer = Buffer.from(requestToken, "hex");
    const cookieBuffer = Buffer.from(cookieToken, "hex");

    if (requestBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return nodeCrypto.timingSafeEqual(requestBuffer, cookieBuffer);
  } catch {
    return false;
  }
}
```

---

## 주요 변경 사항

### 1. 런타임 감지 및 분기

- **Edge Runtime**: Web Crypto API (`crypto.getRandomValues()`) 사용
- **Node.js Runtime**: Node.js `crypto` 모듈 사용 (동적 require)

### 2. 타이밍 공격 방지

- **Edge Runtime**: 모든 문자를 비교하는 방식 (완벽한 타이밍 공격 방지는 아니지만 Edge Runtime 제약사항)
- **Node.js Runtime**: `crypto.timingSafeEqual()` 사용 (완벽한 타이밍 공격 방지)

### 3. Node.js `crypto` 모듈 제거

- `import crypto from "crypto"` 제거
- 동적 `require("crypto")` 사용 (Node.js Runtime에서만)

---

## 호환성

### Edge Runtime 호환성

✅ **지원됨**:
- `crypto.getRandomValues()`: 랜덤 바이트 생성
- 문자열 비교: 토큰 검증

⚠️ **제한사항**:
- `crypto.timingSafeEqual()`: Edge Runtime에서 사용 불가
- 대체 방법: 모든 문자를 비교하는 방식 사용

### Node.js Runtime 호환성

✅ **지원됨**:
- `crypto.randomBytes()`: 랜덤 바이트 생성
- `crypto.timingSafeEqual()`: 타이밍 공격 방지 비교

---

## 사용 위치

### 1. Middleware (Edge Runtime)

```typescript
// middleware.ts
const { verifyCsrfToken } = await import("@/lib/utils/csrf");
const isValid = verifyCsrfToken(requestToken || null, cookieToken || null);
```

### 2. API Route (Node.js Runtime)

```typescript
// app/api/csrf-token/route.ts
export const runtime = "nodejs"; // 명시적으로 Node.js Runtime 지정

export async function GET() {
  const token = await setCsrfToken(); // Node.js crypto 사용
  return NextResponse.json({ token });
}
```

---

## 테스트

### 빌드 확인

```bash
npm run build
```

**예상 결과**: Edge Runtime 경고가 더 이상 나타나지 않습니다.

### 기능 확인

1. **CSRF 토큰 생성**: `/api/csrf-token` 엔드포인트 호출
2. **CSRF 토큰 검증**: POST/PUT/PATCH/DELETE 요청 시 middleware에서 검증
3. **Edge Runtime 호환성**: middleware에서 정상 작동 확인

---

## 참고 사항

### Web Crypto API vs Node.js crypto

| 기능 | Web Crypto API | Node.js crypto |
|------|----------------|----------------|
| `randomBytes()` | `getRandomValues()` | `randomBytes()` |
| `timingSafeEqual()` | 직접 구현 필요 | `timingSafeEqual()` |
| 런타임 | Edge, Browser, Node.js | Node.js만 |

### 타이밍 공격 방지

- **Node.js Runtime**: `crypto.timingSafeEqual()` 사용 (완벽한 보호)
- **Edge Runtime**: 모든 문자를 비교하는 방식 (충분한 보호, 완벽하지는 않음)

---

## 관련 문서

- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Node.js crypto](https://nodejs.org/api/crypto.html)

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31


