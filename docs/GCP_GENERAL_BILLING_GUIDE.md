# GCP General MCP 서버 - 빌링 정보 확인 가이드

**작성일**: 2025-12-31
**MCP 서버**: `@google-cloud/gcloud-mcp` (gcp-general)
**프로젝트**: gen-lang-client-0408997230

## 개요

`@google-cloud/gcloud-mcp`는 Google Cloud CLI (`gcloud`) 명령어를 실행할 수 있는 MCP 서버입니다. 이 가이드는 빌링 정보를 확인하는 방법을 설명합니다.

---

## 1. 연결 상태 확인

### 1.1 기본 연결 테스트

MCP 서버가 정상적으로 연결되었는지 확인:

```
"gcp-general MCP로 gcloud 버전을 확인해줘"
"gcp-general MCP로 현재 프로젝트 설정을 확인해줘"
```

### 1.2 gcloud CLI 직접 확인

PowerShell에서:

```powershell
# 버전 확인
gcloud --version

# 현재 설정 확인
gcloud config list

# 인증된 계정 확인
gcloud auth list
```

---

## 2. 빌링 정보 확인 방법

### 2.1 Billing Account 목록 조회

**MCP 서버 사용:**
```
"gcp-general MCP로 billing accounts list 명령어를 실행해줘"
```

**gcloud CLI 직접 사용:**
```powershell
gcloud billing accounts list
```

**예상 출력:**
```
ACCOUNT_ID            NAME                OPEN
01XXXX-XXXXXX-XXXXXX  My Billing Account  True
```

### 2.2 프로젝트의 빌링 정보 확인

**MCP 서버 사용:**
```
"gcp-general MCP로 프로젝트 gen-lang-client-0408997230의 빌링 정보를 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
gcloud billing projects describe gen-lang-client-0408997230
```

**예상 출력:**
```json
{
  "billingAccountName": "billingAccounts/01XXXX-XXXXXX-XXXXXX",
  "billingEnabled": true,
  "name": "projects/gen-lang-client-0408997230/billingInfo",
  "projectId": "gen-lang-client-0408997230"
}
```

### 2.3 Billing Account 상세 정보

**MCP 서버 사용:**
```
"gcp-general MCP로 billing account [ACCOUNT_ID]의 상세 정보를 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
gcloud billing accounts describe [ACCOUNT_ID]
```

### 2.4 프로젝트에 Billing Account 연결

**MCP 서버 사용:**
```
"gcp-general MCP로 프로젝트에 billing account를 연결해줘"
```

**gcloud CLI 직접 사용:**
```powershell
gcloud billing projects link gen-lang-client-0408997230 --billing-account=[ACCOUNT_ID]
```

---

## 3. 비용 및 사용량 확인

### 3.1 Cloud Billing API를 통한 비용 조회

**주의**: `gcloud` CLI는 직접적인 비용 조회 기능이 제한적입니다. 비용 정보는 주로 Cloud Billing API를 통해 확인합니다.

**MCP 서버 사용 (자연어 요청):**
```
"gcp-general MCP로 이번 달 비용을 확인해줘"
"gcp-general MCP로 최근 30일간의 비용 추이를 분석해줘"
"gcp-general MCP로 서비스별 비용을 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
# Cloud Billing API 활성화 확인
gcloud services list --enabled | findstr billing

# Billing Export 설정 확인 (BigQuery)
gcloud billing accounts get-iam-policy [ACCOUNT_ID]
```

### 3.2 BigQuery를 통한 비용 분석 (Billing Export 사용 시)

Billing Export가 설정되어 있다면 BigQuery에서 비용 데이터를 조회할 수 있습니다:

**MCP 서버 사용:**
```
"gcp-general MCP로 BigQuery에서 이번 달 비용 데이터를 조회해줘"
```

**gcloud CLI 직접 사용:**
```powershell
# BigQuery 데이터셋 확인
gcloud bq datasets list --project=gen-lang-client-0408997230

# BigQuery 쿼리 실행 (예시)
gcloud bq query --use_legacy_sql=false "SELECT * FROM \`[PROJECT_ID].[DATASET].[TABLE]\` LIMIT 10"
```

---

## 4. 리소스 사용량 확인

### 4.1 Compute Engine 리소스

**MCP 서버 사용:**
```
"gcp-general MCP로 Compute Engine 인스턴스 목록을 보여줘"
"gcp-general MCP로 사용 중인 리소스를 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
# VM 인스턴스 목록
gcloud compute instances list

# 디스크 목록
gcloud compute disks list

# 스냅샷 목록
gcloud compute snapshots list
```

### 4.2 Cloud Storage 리소스

**MCP 서버 사용:**
```
"gcp-general MCP로 Cloud Storage 버킷 목록을 보여줘"
"gcp-general MCP로 Storage 사용량을 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
# 버킷 목록
gcloud storage buckets list

# 버킷 크기 확인
gsutil du -sh gs://[BUCKET_NAME]
```

### 4.3 기타 리소스

**MCP 서버 사용:**
```
"gcp-general MCP로 프로젝트의 모든 리소스를 확인해줘"
"gcloud-general MCP로 사용되지 않는 리소스를 찾아줘"
```

**gcloud CLI 직접 사용:**
```powershell
# 활성화된 API 목록
gcloud services list --enabled

# App Engine 애플리케이션
gcloud app versions list

# Cloud Functions
gcloud functions list

# Cloud Run 서비스
gcloud run services list
```

---

## 5. 권한 확인 및 설정

### 5.1 현재 권한 확인

**MCP 서버 사용:**
```
"gcp-general MCP로 현재 서비스 계정의 권한을 확인해줘"
```

**gcloud CLI 직접 사용:**
```powershell
# 프로젝트 IAM 정책 확인
gcloud projects get-iam-policy gen-lang-client-0408997230

# 서비스 계정 권한 확인
gcloud projects get-iam-policy gen-lang-client-0408997230 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com"
```

### 5.2 Billing 권한 추가 (필요 시)

**Billing Account Viewer 역할 부여:**

```powershell
# Billing Account ID 확인
gcloud billing accounts list

# Billing Account Viewer 역할 부여
gcloud billing accounts add-iam-policy-binding [BILLING_ACCOUNT_ID] \
  --member="serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com" \
  --role="roles/billing.viewer"
```

**프로젝트 Billing User 역할 부여:**

```powershell
gcloud projects add-iam-policy-binding gen-lang-client-0408997230 \
  --member="serviceAccount:id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com" \
  --role="roles/billing.projectManager"
```

---

## 6. 실제 사용 예시

### 예시 1: 기본 빌링 정보 확인

**요청:**
```
"gcp-general MCP로 프로젝트의 빌링 계정 정보를 확인해줘"
```

**예상 동작:**
- `gcloud billing projects describe` 명령어 실행
- Billing Account 연결 상태 확인
- Billing Account ID 반환

### 예시 2: 리소스 사용량 확인

**요청:**
```
"gcp-general MCP로 프로젝트에서 사용 중인 모든 리소스를 확인하고 비용과 연관성을 분석해줘"
```

**예상 동작:**
- Compute Engine 인스턴스 목록 조회
- Cloud Storage 버킷 목록 조회
- 기타 리소스 목록 조회
- 리소스별 비용 추정 (가능한 경우)

### 예시 3: 비용 최적화 제안

**요청:**
```
"gcp-general MCP로 사용되지 않는 리소스를 찾아서 비용 절감 방안을 제안해줘"
```

**예상 동작:**
- 중지된 VM 인스턴스 확인
- 사용되지 않는 디스크 확인
- 오래된 스냅샷 확인
- 최적화 제안 제공

---

## 7. 제한 사항 및 참고사항

### 7.1 제한 사항

- **비용 데이터**: `gcloud` CLI는 직접적인 비용 조회 기능이 제한적입니다. 상세한 비용 정보는 Cloud Billing API 또는 BigQuery (Billing Export)를 통해 확인해야 합니다.
- **실시간 비용**: 비용 데이터는 일반적으로 24-48시간 지연됩니다.
- **권한**: Billing 정보 조회를 위해서는 적절한 IAM 권한이 필요합니다.

### 7.2 대안 방법

**상세한 비용 분석이 필요한 경우:**

1. **Google Cloud Console 사용**
   - https://console.cloud.google.com/billing
   - 실시간 비용 대시보드
   - 서비스별 상세 분석

2. **Cloud Billing API 직접 사용**
   - REST API 또는 클라이언트 라이브러리 사용
   - 프로그래밍 방식으로 비용 데이터 조회

3. **BigQuery Billing Export**
   - Billing Export 설정 후 BigQuery에서 SQL 쿼리
   - 커스텀 분석 및 리포트 생성

---

## 8. 문제 해결

### 문제 1: "Permission denied" 오류

**원인**: Billing 관련 권한 부족

**해결 방법:**
1. Billing Account Viewer 역할 확인
2. 프로젝트 Billing User 역할 확인
3. 필요시 권한 추가 (5.2 참고)

### 문제 2: "Billing account not found" 오류

**원인**: 프로젝트에 Billing Account가 연결되지 않음

**해결 방법:**
```powershell
# Billing Account 목록 확인
gcloud billing accounts list

# 프로젝트에 Billing Account 연결
gcloud billing projects link gen-lang-client-0408997230 --billing-account=[ACCOUNT_ID]
```

### 문제 3: "Command not found" 오류

**원인**: gcloud CLI가 PATH에 없음

**해결 방법:**
1. gcloud CLI 재설치
2. PATH 환경 변수 확인
3. PowerShell 재시작

---

## 9. 체크리스트

### ✅ 연결 상태 확인
- [ ] `gcloud --version` 명령어 정상 작동
- [ ] `gcloud config list`에서 올바른 프로젝트 설정 확인
- [ ] MCP 서버를 통한 명령어 실행 성공

### ✅ 빌링 정보 확인
- [ ] Billing Account 목록 조회 성공
- [ ] 프로젝트의 Billing Account 연결 상태 확인
- [ ] 리소스 목록 조회 성공

### ✅ 권한 확인
- [ ] 서비스 계정에 적절한 Billing 권한 부여 확인
- [ ] 필요한 경우 권한 추가 완료

---

## 10. 다음 단계

1. **기본 빌링 정보 확인**: Billing Account 연결 상태 확인
2. **리소스 사용량 모니터링**: 정기적으로 리소스 목록 확인
3. **비용 최적화**: 사용되지 않는 리소스 정리
4. **고급 분석**: BigQuery Billing Export 설정 고려

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31

