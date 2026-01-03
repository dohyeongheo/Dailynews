# Google Cloud Billing 관리 MCP 서버 가이드

**작성일**: 2025-12-31
**프로젝트**: gen-lang-client-0408997230

## 개요

Google Cloud Billing 관리를 위한 MCP 서버 옵션을 조사하고, 각 옵션의 기능, 설정 방법, 사용 예시를 상세히 설명합니다.

---

## 1. 추천 옵션 비교

### 옵션 1: @google-cloud/gcloud-mcp (공식) ⭐⭐⭐ **추천**

**패키지 정보:**

- **이름**: `@google-cloud/gcloud-mcp`
- **버전**: `0.5.2` (최신)
- **제공자**: Google (공식)
- **GitHub**: https://github.com/googleapis/gcloud-mcp
- **상태**: ✅ 이미 설정되어 있음 (`gcp-general`)

**빌링 관련 기능:**

- ✅ 빌링 정보 조회
- ✅ 프로젝트별 비용 확인
- ✅ 서비스별 비용 분석
- ✅ 리소스 사용량 확인
- ✅ 일반적인 GCP 리소스 관리 (빌링 외에도 다양한 기능)

**장점:**

- ✅ 공식 Google 패키지 (안정성, 지속적인 업데이트)
- ✅ 이미 설정되어 있음 (추가 설정 불필요)
- ✅ 빌링 외에도 다양한 GCP 관리 기능 제공
- ✅ 자연어로 GCP와 상호작용 가능

**단점:**

- ⚠️ 빌링 전용 기능은 제한적일 수 있음
- ⚠️ 예산 관리, 알림 설정 등 고급 기능은 없을 수 있음

**현재 설정 상태:**

```json
{
  "gcp-general": {
    "command": "npx",
    "args": ["-y", "@google-cloud/gcloud-mcp"],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**사용 예시:**

```
"gcp-general MCP로 이번 달 빌링 비용을 확인해줘"
"gcp-general MCP로 서비스별 비용을 분석해줘"
"gcp-general MCP로 프로젝트의 리소스 사용량을 확인해줘"
```

---

### 옵션 2: mcp-google_cloud_billing (PyPI) ⭐⭐

**패키지 정보:**

- **이름**: `mcp-google_cloud_billing`
- **제공자**: 서드파티 (PyPI)
- **PyPI**: https://pypi.org/project/mcp-google_cloud_billing/
- **언어**: Python

**빌링 관련 기능:**

- ✅ Billing Account 관리
- ✅ Billing Account 상세 정보 조회
- ✅ 프로젝트별 빌링 정보
- ✅ 비용 분석 및 이해

**장점:**

- ✅ 빌링 전용 기능에 집중
- ✅ Billing Account 관리 기능 제공

**단점:**

- ⚠️ Python 기반 (Node.js 프로젝트와 호환성 문제 가능)
- ⚠️ 서드파티 패키지 (공식 지원 없음)
- ⚠️ 추가 설정 필요

**설정 방법:**

```json
{
  "gcp-billing": {
    "command": "python",
    "args": ["-m", "mcp_google_cloud_billing"],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**설치:**

```bash
pip install mcp-google-cloud-billing
```

---

### 옵션 3: google-cloud-mcp (krzko) ⭐⭐

**패키지 정보:**

- **이름**: `google-cloud-mcp`
- **버전**: `0.1.3`
- **제공자**: krzko (서드파티)
- **GitHub**: https://github.com/krzko/google-cloud-mcp
- **언어**: TypeScript/Node.js

**빌링 관련 기능:**

- ✅ `gcp-billing-list-accounts`: Billing Account 목록 조회
- ✅ `gcp-billing-get-account-details`: Billing Account 상세 정보
- ✅ `gcp-billing-list-projects`: 프로젝트별 빌링 정보
- ✅ Cloud Logging, Monitoring, Trace 기능도 포함

**장점:**

- ✅ Node.js 기반 (프로젝트와 호환성 좋음)
- ✅ 빌링 + 모니터링 통합 기능
- ✅ TypeScript로 작성되어 타입 안정성

**단점:**

- ⚠️ 서드파티 패키지 (공식 지원 없음)
- ⚠️ 최신 업데이트가 적을 수 있음
- ⚠️ 추가 설정 필요

**설정 방법:**

```json
{
  "gcp-billing-krzko": {
    "command": "npx",
    "args": ["-y", "-p", "google-cloud-mcp", "node", "-e", "require('google-cloud-mcp/dist/index.js')"],
    "env": {
      "GOOGLE_PROJECT_ID": "gen-lang-client-0408997230",
      "GOOGLE_CLIENT_EMAIL": "id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com",
      "GOOGLE_PRIVATE_KEY": "..."
    }
  }
}
```

---

### 옵션 4: gcp-billing-and-monitoring-mcp ⭐

**패키지 정보:**

- **이름**: `gcp-billing-and-monitoring-mcp`
- **제공자**: RadiumGu (서드파티)
- **GitHub**: https://github.com/RadiumGu/gcp-billing-and-monitoring-mcp
- **언어**: TypeScript/Node.js

**빌링 관련 기능:**

- ✅ 빌링 정보 조회
- ✅ 모니터링 통합
- ✅ 비용 분석

**장점:**

- ✅ 빌링 + 모니터링 통합
- ✅ Node.js 기반

**단점:**

- ⚠️ 서드파티 패키지
- ⚠️ 빌드 및 설정이 복잡할 수 있음
- ⚠️ 추가 설정 필요

**설정 방법:**

```bash
# 클론 및 빌드 필요
git clone https://github.com/RadiumGu/gcp-billing-and-monitoring-mcp.git
cd gcp-billing-and-monitoring-mcp
pnpm install
pnpm build
```

---

## 2. 권장 사항

### 현재 상황 분석

**이미 설정된 서버:**

- ✅ `gcp-general` (`@google-cloud/gcloud-mcp`) - 빌링 정보 조회 가능
- ✅ `gcp-observability` (`@google-cloud/observability-mcp`) - 모니터링

**추가 필요성:**

- 기본적인 빌링 정보 조회는 `gcp-general`로 가능
- 고급 빌링 관리 기능이 필요한 경우 추가 옵션 고려

### 추천 순위

#### 1순위: @google-cloud/gcloud-mcp (이미 설정됨) ✅

**이유:**

- ✅ 이미 설정되어 있어 즉시 사용 가능
- ✅ 공식 Google 패키지로 안정성 보장
- ✅ 빌링 정보 조회 기능 포함
- ✅ 추가 설정 불필요

**사용 방법:**

```
"gcp-general MCP로 이번 달 빌링 비용을 확인해줘"
"gcp-general MCP로 서비스별 비용을 분석해줘"
"gcp-general MCP로 프로젝트의 리소스 사용량을 확인해줘"
```

#### 2순위: google-cloud-mcp (krzko) - 필요시 추가

**추가 고려 사항:**

- Billing Account 관리가 필요한 경우
- 더 상세한 빌링 분석이 필요한 경우
- Node.js 기반 프로젝트와의 호환성을 중시하는 경우

**추가 시 이점:**

- Billing Account 목록 및 상세 정보 조회
- 프로젝트별 빌링 정보 상세 분석
- 빌링 + 모니터링 통합 관리

---

## 3. 실제 사용 가이드

### 3.1 @google-cloud/gcloud-mcp 사용하기 (현재 설정)

**기본 사용:**

```
"gcp-general MCP로 프로젝트의 빌링 정보를 확인해줘"
"gcp-general MCP로 이번 달 비용을 분석해줘"
"gcp-general MCP로 서비스별 사용량을 확인해줘"
```

**필요한 권한:**

- Cloud Billing API 접근 권한
- Billing Account Viewer 권한 (최소)
- 프로젝트 리소스 조회 권한

**권한 설정:**

```bash
# 서비스 계정에 Billing Account Viewer 역할 부여
gcloud billing accounts add-iam-policy-binding BILLING_ACCOUNT_ID \
  --member="serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com" \
  --role="roles/billing.viewer"
```

### 3.2 google-cloud-mcp (krzko) 추가하기 (선택사항)

**1단계: mcp.json에 추가**

```json
{
  "gcp-billing-krzko": {
    "command": "npx",
    "args": ["-y", "-p", "google-cloud-mcp", "node", "-e", "require('google-cloud-mcp/dist/index.js')"],
    "env": {
      "GOOGLE_PROJECT_ID": "gen-lang-client-0408997230",
      "GOOGLE_CLIENT_EMAIL": "id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com",
      "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    }
  }
}
```

**2단계: Cursor 재시작**

**3단계: 사용 예시**

```
"gcp-billing-krzko MCP로 Billing Account 목록을 보여줘"
"gcp-billing-krzko MCP로 Billing Account 상세 정보를 확인해줘"
"gcp-billing-krzko MCP로 프로젝트별 빌링 정보를 분석해줘"
```

---

## 4. 기능 비교표

| 기능                 | @google-cloud/gcloud-mcp | mcp-google_cloud_billing | google-cloud-mcp (krzko) | gcp-billing-and-monitoring-mcp |
| -------------------- | ------------------------ | ------------------------ | ------------------------ | ------------------------------ |
| 빌링 정보 조회       | ✅                       | ✅                       | ✅                       | ✅                             |
| Billing Account 관리 | ⚠️ 제한적                | ✅                       | ✅                       | ⚠️                             |
| 프로젝트별 비용 분석 | ✅                       | ✅                       | ✅                       | ✅                             |
| 서비스별 비용 분석   | ✅                       | ⚠️                       | ⚠️                       | ✅                             |
| 예산 관리            | ❌                       | ❌                       | ❌                       | ❌                             |
| 알림 설정            | ❌                       | ❌                       | ❌                       | ❌                             |
| 공식 지원            | ✅                       | ❌                       | ❌                       | ❌                             |
| Node.js 호환         | ✅                       | ❌ (Python)              | ✅                       | ✅                             |
| 현재 설정 상태       | ✅ 설정됨                | ❌                       | ❌                       | ❌                             |
| 설정 난이도          | 쉬움                     | 보통                     | 보통                     | 어려움                         |

---

## 5. 실제 사용 시나리오

### 시나리오 1: 기본 빌링 정보 확인

**목적**: 이번 달 비용 확인

**사용 방법:**

```
"gcp-general MCP로 이번 달 빌링 비용을 확인해줘"
"gcp-general MCP로 최근 30일간의 비용 추이를 분석해줘"
```

**예상 결과:**

- 총 비용
- 서비스별 비용 분류
- 일별 비용 추이

### 시나리오 2: 서비스별 비용 분석

**목적**: 어떤 서비스가 가장 많은 비용을 사용하는지 확인

**사용 방법:**

```
"gcp-general MCP로 서비스별 비용을 분석하고 가장 비용이 많이 드는 서비스를 알려줘"
"gcp-general MCP로 Compute Engine과 Cloud Storage의 비용을 비교해줘"
```

**예상 결과:**

- 서비스별 비용 순위
- 비용 비율
- 비용 최적화 제안

### 시나리오 3: 프로젝트 리소스 사용량 확인

**목적**: 리소스 사용량과 비용의 연관성 파악

**사용 방법:**

```
"gcp-general MCP로 프로젝트의 리소스 사용량을 확인하고 비용과 연관성을 분석해줘"
"gcp-general MCP로 사용되지 않는 리소스를 찾아서 비용 절감 방안을 제안해줘"
```

**예상 결과:**

- 리소스 목록 및 상태
- 리소스별 비용
- 최적화 제안

### 시나리오 4: Billing Account 관리 (고급)

**목적**: Billing Account 정보 및 설정 확인

**필요한 서버**: `google-cloud-mcp` (krzko) 추가 필요

**사용 방법:**

```
"gcp-billing-krzko MCP로 Billing Account 목록을 보여줘"
"gcp-billing-krzko MCP로 Billing Account 상세 정보를 확인해줘"
"gcp-billing-krzko MCP로 프로젝트별 빌링 정보를 분석해줘"
```

---

## 6. 권한 설정 가이드

### 6.1 최소 권한 설정

**Billing Account Viewer 역할:**

```bash
gcloud billing accounts add-iam-policy-binding BILLING_ACCOUNT_ID \
  --member="serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com" \
  --role="roles/billing.viewer"
```

**프로젝트 Billing User 역할:**

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0408997230 \
  --member="serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com" \
  --role="roles/billing.projectManager"
```

### 6.2 Billing Account ID 확인

```bash
gcloud billing accounts list
```

---

## 7. 결론 및 권장 사항

### 현재 상황

✅ **이미 설정된 서버로 충분:**

- `gcp-general` (`@google-cloud/gcloud-mcp`)가 이미 설정되어 있음
- 기본적인 빌링 정보 조회 가능
- 추가 설정 없이 즉시 사용 가능

### 권장 사항

1. **기본 사용**: `gcp-general` MCP 서버 활용

   - 이번 달 비용 확인
   - 서비스별 비용 분석
   - 리소스 사용량 확인

2. **고급 기능 필요 시**: `google-cloud-mcp` (krzko) 추가 고려

   - Billing Account 관리
   - 더 상세한 빌링 분석
   - 프로젝트별 상세 정보

3. **예산 관리 및 알림**: MCP 서버 대신 Google Cloud Console 사용
   - 예산 설정 및 알림은 Google Cloud Console에서 직접 설정
   - MCP 서버는 주로 조회 및 분석 용도

### 다음 단계

1. ✅ `gcp-general` MCP 서버로 기본 빌링 정보 확인 테스트
2. ⚠️ 필요시 `google-cloud-mcp` (krzko) 추가 검토
3. ⚠️ 권한 설정 확인 및 필요시 추가

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31


