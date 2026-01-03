# glob@7.2.3 Deprecation 경고 해결

**수정 일시**: 2025-12-31

---

## 문제

`npm update` 실행 시 다음과 같은 deprecation 경고가 발생했습니다:

```
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
```

---

## 원인 분석

### 의존성 트리 확인

`npm ls glob` 명령으로 확인한 결과:

```
dailynews@1.0.0
+-- @sentry/nextjs@10.32.1
| `-- @sentry/bundler-plugin-core@4.6.1
|   `-- glob@10.5.0  ✅ (최신 버전)
`-- jest@29.7.0
  `-- @jest/core@29.7.0
    +-- @jest/reporters@29.7.0
    |   `-- glob@7.2.3  ❌ (deprecated)
    +-- @jest/transform@29.7.0
    |   `-- babel-plugin-istanbul@6.1.1
    |     `-- test-exclude@6.0.0
    |       `-- glob@7.2.3  ❌ (deprecated)
    +-- jest-config@29.7.0
    |   `-- glob@7.2.3  ❌ (deprecated)
    `-- jest-runtime@29.7.0
      `-- glob@7.2.3  ❌ (deprecated)
```

**결론**: `jest@29.7.0`과 그 하위 의존성들이 `glob@7.2.3`을 사용하고 있습니다.

---

## 해결 방법

### 1. `package.json`에 `overrides` 추가

npm의 `overrides` 필드를 사용하여 모든 의존성에서 `glob` 패키지를 최신 버전(`^10.0.0`)으로 강제 업데이트했습니다.

**변경 내용:**

```json
{
  "devDependencies": {
    // ... 기존 의존성들
  },
  "overrides": {
    "glob": "^10.0.0"
  }
}
```

### 2. 패키지 재설치

```bash
npm install
```

이 명령을 실행하면 모든 의존성이 `glob@^10.0.0`을 사용하도록 업데이트됩니다.

---

## 해결 결과

### Before
- `jest@29.7.0`의 하위 의존성들이 `glob@7.2.3` 사용
- `npm update` 실행 시 deprecation 경고 발생

### After
- 모든 의존성이 `glob@^10.0.0` 사용
- `npm update` 실행 시 deprecation 경고 없음

---

## 참고 사항

### `overrides` vs `resolutions`

- **`overrides`**: npm 8.3.0+ 에서 지원 (권장)
- **`resolutions`**: Yarn 전용, npm에서는 작동하지 않음

### Jest 업데이트 고려사항

현재 프로젝트는 `jest@29.7.0`을 사용하고 있으며, 최신 버전은 `jest@30.2.0`입니다.

**Jest 30.x로 업데이트 시 고려사항:**
- Jest 30은 Node.js 18.18.0 이상 필요
- 일부 API 변경 가능
- 테스트 코드 수정 필요할 수 있음

**권장 사항:**
- 현재는 `overrides`로 해결
- Jest 30.x 업데이트는 별도 작업으로 진행 (테스트 코드 검증 필요)

---

## 보안 확인

```bash
npm audit
```

**결과**: `found 0 vulnerabilities` ✅

보안 취약점은 없습니다.

---

## 확인 방법

### 1. 의존성 트리 확인

```bash
npm ls glob
```

모든 `glob` 패키지가 `10.x.x` 버전을 사용하는지 확인합니다.

### 2. 업데이트 확인

```bash
npm update
```

deprecation 경고가 더 이상 나타나지 않아야 합니다.

---

## 관련 이슈

- **Jest Issue**: Jest 29.x가 `glob@7.2.3`을 사용하는 것은 Jest 팀의 의존성 관리 문제입니다.
- **해결 시점**: Jest 30.x에서는 `glob@10.x`를 사용할 것으로 예상됩니다.

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31


