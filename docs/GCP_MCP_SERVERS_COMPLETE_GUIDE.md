# Google Cloud MCP 서버 전체 가이드

## 개요

이 문서는 Google Cloud가 제공하는 모든 MCP(Model Context Protocol) 서버를 조사하고, 현재 프로젝트에 연결 가능한 서버들의 기능, 설정 방법, 사용 예시를 상세히 설명합니다.

### MCP 서버란?

MCP(Model Context Protocol)는 AI 에이전트가 다양한 도구와 데이터 소스에 안전하게 접근할 수 있게 해주는 프로토콜입니다. Google Cloud MCP 서버를 통해 AI 에이전트는 Google Cloud의 다양한 서비스와 자연어로 상호작용할 수 있습니다.

### 현재 프로젝트 설정 상태

현재 프로젝트(`gen-lang-client-0408997230`)에는 다음 MCP 서버가 설정되어 있습니다:

- ✅ **gcp-observability**: `@google-cloud/observability-mcp` (정상 설정)
- ✅ **gcp-billing**: 설정에서 제거됨 (이전에 `mcp-server-gcp`로 설정되어 있었으나 패키지가 존재하지 않아 제거됨)

---

## 1. 공식 Google Cloud MCP 서버

### 1.1 @google-cloud/gcloud-mcp

**패키지 정보:**
- **이름**: `@google-cloud/gcloud-mcp`
- **버전**: `0.5.2` (최신)
- **설명**: Model Context Protocol (MCP) Server for interacting with GCP APIs
- **GitHub**: https://github.com/googleapis/gcloud-mcp/tree/main/packages/gcloud-mcp
- **실행 바이너리**: `gcloud-mcp`
- **게시일**: 2주 전 (최근 업데이트)

**주요 기능:**
- Google Cloud API와의 일반적인 상호작용
- 다양한 GCP 서비스 관리
- 프로젝트 리소스 조회 및 관리
- 빌링 정보 조회
- IAM 권한 관리
- 리소스 생성 및 삭제
- 서비스 상태 확인

**설정 방법:**

```json
{
  "gcp-general": {
    "command": "npx",
    "args": [
      "-y",
      "@google-cloud/gcloud-mcp"
    ],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**필요한 인증:**
- Google Cloud 서비스 계정 키 파일
- 프로젝트 ID

**사용 예시:**
```
"GCP MCP로 프로젝트의 리소스 목록을 보여줘"
"GCP MCP로 Compute Engine 인스턴스를 확인해줘"
```

### 1.2 @google-cloud/observability-mcp ✅ (현재 설정됨)

**패키지 정보:**
- **이름**: `@google-cloud/observability-mcp`
- **버전**: `0.2.1` (최신)
- **설명**: MCP Server for GCP environment for interacting with various Observability APIs
- **GitHub**: https://github.com/googleapis/gcloud-mcp/tree/main/packages/observability-mcp
- **실행 바이너리**: `observability-mcp`
- **게시일**: 2주 전 (최근 업데이트)

**주요 기능:**

#### 1. 로그 검색 (Cloud Logging)
- 특정 프로젝트의 로그 조회
- 로그 필터링 및 검색
- 시간 범위별 로그 조회
- 로그 레벨별 필터링

#### 2. 메트릭 조회 (Cloud Monitoring)
- 프로젝트의 메트릭 데이터 확인
- 시스템 성능 모니터링
- 메트릭 시간 시리즈 데이터 조회
- 특정 메트릭 타입별 조회

#### 3. 트레이스 조회 (Cloud Trace)
- 애플리케이션 트레이스 검색
- 트레이스 상세 정보 확인
- 성능 분석 및 문제 진단
- 트레이스 시간 범위별 조회

#### 4. 오류 보고서 확인 (Error Reporting)
- 프로젝트의 오류 그룹 조회
- 오류 통계 및 트렌드 분석
- 오류 상세 정보 확인
- 오류 발생 빈도 분석

**현재 설정:**

```json
{
  "gcp-observability": {
    "command": "npx",
    "args": [
      "-y",
      "@google-cloud/observability-mcp"
    ],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**사용 예시:**

```
# 로그 검색
"gcp-observability MCP로 최근 1시간 동안 발생한 에러 로그를 보여줘"
"gcp-observability MCP로 'database timeout'이 포함된 로그를 찾아줘"
"gcp-observability MCP로 어제 발생한 모든 로그를 조회해줘"

# 메트릭 조회
"gcp-observability MCP로 프로젝트의 CPU 사용량 메트릭을 보여줘"
"gcp-observability MCP로 최근 24시간 동안의 메모리 사용량을 확인해줘"

# 트레이스 조회
"gcp-observability MCP로 최근 발생한 느린 트레이스를 찾아줘"
"gcp-observability MCP로 특정 API 엔드포인트의 트레이스를 분석해줘"

# 오류 보고서
"gcp-observability MCP로 최근 발생한 오류 그룹을 보여줘"
"gcp-observability MCP로 오늘 발생한 오류 통계를 확인해줘"
```

**필요한 권한:**
- Cloud Logging API 접근 권한
- Cloud Monitoring API 접근 권한
- Cloud Trace API 접근 권한
- Error Reporting API 접근 권한

---

## 2. 서드파티 MCP 서버

### 2.1 google-cloud-mcp (krzko)

**패키지 정보:**
- **이름**: `google-cloud-mcp`
- **버전**: `0.1.3`
- **작성자**: krzko
- **GitHub**: https://github.com/krzko/google-cloud-mcp
- **설명**: Model Context Protocol server for Google Cloud services

**주요 기능:**
- Cloud Spanner 데이터베이스 관리
- Cloud Logging 로그 조회
- Cloud Monitoring 메트릭 조회
- Cloud Trace 트레이스 조회

**설정 방법:**

```json
{
  "google-cloud-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "-p",
      "google-cloud-mcp",
      "node",
      "-e",
      "require('google-cloud-mcp/dist/index.js')"
    ],
    "env": {
      "GOOGLE_PROJECT_ID": "gen-lang-client-0408997230",
      "GOOGLE_CLIENT_EMAIL": "id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com",
      "GOOGLE_PRIVATE_KEY": "..."
    }
  }
}
```

**참고**: 이 패키지는 실행 바이너리가 없어 `node`로 직접 실행해야 합니다.

---

## 3. 기타 Google 서비스 MCP 서버

### 3.1 Google Maps MCP

**엔드포인트**: `mapstools.googleapis.com/mcp`

**기능:**
- 최신 지리 정보 조회
- 날씨 예보 확인
- 경로 계획 및 세부 정보
- 장소 검색
- 지리 공간 데이터 제공

**설정 방법:**
Google Cloud Console에서 Maps API를 활성화하고 MCP 서버를 활성화해야 합니다.

**사용 사례:**
- 위치 기반 서비스 개발
- 지도 데이터 활용
- 경로 최적화
- 날씨 정보 통합

**활성화 명령:**
```bash
gcloud beta services mcp enable mapstools.googleapis.com --project=gen-lang-client-0408997230
```

### 3.2 BigQuery MCP

**엔드포인트**: `bigquery.googleapis.com/mcp`

**기능:**
- 대규모 데이터 세트 쿼리
- 데이터 분석
- SQL 쿼리 실행
- 데이터 세트 관리
- 테이블 스키마 조회

**설정 방법:**
BigQuery API를 활성화하고 MCP 서버를 활성화해야 합니다.

**사용 사례:**
- 데이터 분석 및 리포팅
- 대규모 데이터 처리
- 비즈니스 인텔리전스
- Analytics 데이터 분석

**활성화 명령:**
```bash
gcloud beta services mcp enable bigquery.googleapis.com --project=gen-lang-client-0408997230
```

**사용 예시:**
```
"BigQuery MCP로 Analytics 데이터를 분석해줘"
"BigQuery MCP로 최근 7일간의 사용자 통계를 조회해줘"
```

### 3.3 Google Drive MCP

**기능:**
- Google Drive 파일 접근
- 문서 내용 분석
- 파일 업로드/다운로드
- 파일 검색
- 폴더 관리

**사용 사례:**
- 문서 관리 자동화
- 콘텐츠 분석
- 파일 공유 관리
- 리포트 저장 및 공유

**설정 방법:**
Google Drive API를 활성화하고 OAuth2 인증을 설정해야 합니다.

### 3.4 Google Sheets MCP

**기능:**
- 스프레드시트 데이터 읽기/쓰기
- 셀 값 업데이트
- 시트 관리
- 데이터 분석
- 차트 생성

**사용 사례:**
- 데이터 입력 자동화
- 스프레드시트 분석
- 리포트 생성
- 데이터 시각화

**설정 방법:**
Google Sheets API를 활성화하고 OAuth2 인증을 설정해야 합니다.

### 3.5 Data Commons MCP

**기능:**
- 공개 데이터 세트 접근
- 통계 데이터 조회
- 데이터 시각화
- 데이터 분석
- 국가/지역 통계

**사용 사례:**
- 공공 데이터 활용
- 통계 분석
- 데이터 기반 의사결정
- 연구 데이터 수집

### 3.6 Compute Engine MCP

**엔드포인트**: `compute.googleapis.com/mcp`

**기능:**
- 가상 머신 인스턴스 생성/삭제
- 인스턴스 상태 확인
- 인스턴스 관리
- 디스크 관리
- 네트워크 설정

**활성화 명령:**
```bash
gcloud beta services mcp enable compute.googleapis.com --project=gen-lang-client-0408997230
```

### 3.7 Google Kubernetes Engine (GKE) MCP

**엔드포인트**: `container.googleapis.com/mcp`

**기능:**
- 클러스터 관리
- 파드 배포 및 관리
- 서비스 관리
- 네임스페이스 관리
- 리소스 모니터링

**활성화 명령:**
```bash
gcloud beta services mcp enable container.googleapis.com --project=gen-lang-client-0408997230
```

### 3.8 Cloud Run MCP

**기능:**
- Cloud Run 서비스 배포
- 서비스 관리
- 리비전 관리
- 트래픽 분산
- 로그 확인

**사용 사례:**
- 서버리스 애플리케이션 배포
- 마이크로서비스 관리
- 자동 배포 파이프라인

---

## 4. 현재 프로젝트 설정 분석

### 4.1 설정된 서버 상태

#### ✅ gcp-observability (정상)

**상태**: 정상 설정됨
**패키지**: `@google-cloud/observability-mcp@0.2.1`
**설정 파일**: `c:\Users\Dohyeongheo\.cursor\mcp.json`

**설정 내용:**
```json
{
  "gcp-observability": {
    "command": "npx",
    "args": ["-y", "@google-cloud/observability-mcp"],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**확인 사항:**
- ✅ 패키지 존재 확인
- ✅ 실행 바이너리 존재 (`observability-mcp`)
- ✅ 환경 변수 설정 완료
- ✅ 인증 파일 경로 설정 완료

#### ✅ gcp-billing (이미 제거됨)

**상태**: 설정에서 제거됨
**이전 설정**: `mcp-server-gcp` (패키지가 존재하지 않음)
**현재 상태**: `mcp.json`에서 제거되어 더 이상 설정에 없음

**참고**: 빌링 정보가 필요한 경우 `@google-cloud/gcloud-mcp`를 사용할 수 있습니다.

### 4.2 문제점 및 해결 방법

**문제 1: mcp-server-gcp 패키지가 존재하지 않음** ✅ 해결됨

**원인**:
- 패키지 이름이 잘못되었거나
- 패키지가 아직 배포되지 않았거나
- 패키지 이름이 변경됨

**해결 상태**:
- `mcp.json`에서 `gcp-billing` 설정이 이미 제거됨
- 더 이상 문제 없음

**대안**:
빌링 정보가 필요한 경우 `@google-cloud/gcloud-mcp`를 추가하여 사용할 수 있습니다.

---

## 5. 연결 가능한 서버 추천

### 5.1 프로젝트 특성 분석

현재 프로젝트는 뉴스 수집 및 관리 시스템(Dailynews)으로, 다음 기능이 필요합니다:

**현재 사용 중인 서비스:**
- ✅ 로그 모니터링: `gcp-observability` (설정됨)
- ✅ 에러 추적: Sentry MCP (설정됨)
- ✅ 데이터베이스 관리: Supabase MCP (설정됨)
- ✅ 배포 관리: Vercel MCP (설정됨)
- ✅ 코드 관리: GitHub MCP (설정됨)

**프로젝트 요구사항:**
- 뉴스 데이터 수집 및 저장
- 이미지 생성 및 저장
- 사용자 분석 및 통계
- 에러 모니터링 및 디버깅
- 배포 및 CI/CD

### 5.2 추천 서버

#### 필수 추천 (이미 설정됨)

1. **@google-cloud/observability-mcp** ✅
   - 로그, 메트릭, 트레이스 모니터링
   - 프로덕션 환경 모니터링에 필수
   - 에러 추적 및 성능 분석

#### 높은 우선순위 추천

2. **@google-cloud/gcloud-mcp** ⭐⭐⭐
   - 일반적인 GCP 리소스 관리
   - 프로젝트 전체 관리에 유용
   - 빌링 정보 조회 가능
   - 리소스 상태 확인
   - **추가 권장**: 프로젝트 관리에 매우 유용

**추가 시 이점:**
- 빌링 비용 모니터링
- 리소스 사용량 확인
- 프로젝트 설정 관리
- 서비스 상태 확인

#### 중간 우선순위 추천

3. **BigQuery MCP** ⭐⭐ (필요시)
   - 대규모 데이터 분석이 필요한 경우
   - Analytics 데이터 분석
   - 뉴스 데이터 통계 분석
   - 사용자 행동 분석

**추가 시 이점:**
- 뉴스 수집 통계 분석
- 사용자 활동 분석
- 트렌드 분석
- 리포트 생성

#### 낮은 우선순위 추천

4. **Google Drive MCP** ⭐ (필요시)
   - 문서 관리 자동화
   - 리포트 저장 및 공유
   - 백업 파일 관리

5. **Google Sheets MCP** ⭐ (필요시)
   - 데이터 입력 자동화
   - 스프레드시트 분석
   - 리포트 생성

### 5.3 프로젝트별 우선순위 매트릭스

| 서버 | 우선순위 | 현재 상태 | 추가 시 이점 | 설정 난이도 |
|------|---------|----------|-------------|------------|
| gcp-observability | 필수 | ✅ 설정됨 | 로그/메트릭 모니터링 | 쉬움 |
| gcloud-mcp | 높음 | ❌ 미설정 | 빌링/리소스 관리 | 쉬움 |
| BigQuery MCP | 중간 | ❌ 미설정 | 데이터 분석 | 보통 |
| Google Drive MCP | 낮음 | ❌ 미설정 | 문서 관리 | 보통 |
| Google Sheets MCP | 낮음 | ❌ 미설정 | 리포트 생성 | 보통 |

### 5.4 설정 가이드

#### @google-cloud/gcloud-mcp 추가하기

**mcp.json에 추가:**

```json
{
  "gcp-general": {
    "command": "npx",
    "args": [
      "-y",
      "@google-cloud/gcloud-mcp"
    ],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

**설정 후:**
1. Cursor 재시작
2. MCP 서버 연결 확인
3. 기능 테스트

**필요한 권한:**
- Cloud Resource Manager API 접근
- 빌링 정보 조회 권한 (필요시)
- 리소스 조회 권한

#### BigQuery MCP 추가하기 (필요시)

**1단계: BigQuery API 활성화**
```bash
gcloud services enable bigquery.googleapis.com --project=gen-lang-client-0408997230
```

**2단계: MCP 서버 활성화**
```bash
gcloud beta services mcp enable bigquery.googleapis.com --project=gen-lang-client-0408997230
```

**3단계: mcp.json 설정**
```json
{
  "bigquery": {
    "url": "https://bigquery.googleapis.com/mcp",
    "headers": {
      "Authorization": "Bearer ${ACCESS_TOKEN}"
    }
  }
}
```

**참고**: BigQuery MCP는 URL 기반 서버이므로 인증 토큰이 필요합니다.

---

## 6. 사용 예시 및 시나리오

### 6.1 gcp-observability 사용 시나리오

#### 시나리오 1: 프로덕션 에러 모니터링

```
"gcp-observability MCP로 최근 1시간 동안 발생한 에러 로그를 보여줘"
"gcp-observability MCP로 'database' 관련 에러를 검색해줘"
"gcp-observability MCP로 오늘 발생한 모든 오류 그룹을 분석해줘"
```

#### 시나리오 2: 성능 모니터링

```
"gcp-observability MCP로 최근 24시간 동안의 API 응답 시간 메트릭을 보여줘"
"gcp-observability MCP로 느린 트레이스를 찾아서 분석해줘"
"gcp-observability MCP로 CPU 사용량이 높은 시간대를 확인해줘"
```

#### 시나리오 3: 문제 진단

```
"gcp-observability MCP로 특정 사용자 ID로 발생한 모든 로그를 찾아줘"
"gcp-observability MCP로 특정 API 엔드포인트의 트레이스를 분석해줘"
"gcp-observability MCP로 최근 발생한 오류의 원인을 분석해줘"
```

### 6.2 @google-cloud/gcloud-mcp 사용 시나리오

#### 시나리오 1: 리소스 관리

```
"GCP MCP로 프로젝트의 모든 리소스를 나열해줘"
"GCP MCP로 Compute Engine 인스턴스 상태를 확인해줘"
"GCP MCP로 Cloud Storage 버킷 목록을 보여줘"
```

#### 시나리오 2: 빌링 정보

```
"GCP MCP로 이번 달 빌링 비용을 확인해줘"
"GCP MCP로 서비스별 비용을 분석해줘"
```

### 6.3 AI 에이전트 활용 방법

**자연어 명령 패턴:**

1. **직접 명령**
   ```
   "gcp-observability MCP로 [작업]을 수행해줘"
   ```

2. **조건부 명령**
   ```
   "gcp-observability MCP로 [조건]에 해당하는 [데이터]를 찾아줘"
   ```

3. **분석 요청**
   ```
   "gcp-observability MCP로 [데이터]를 분석하고 문제점을 파악해줘"
   ```

---

## 7. 인증 및 보안

### 7.1 인증 방법

#### 서비스 계정 키 파일 사용 (현재 방법)

**장점:**
- 간단한 설정
- 로컬 개발에 적합

**단점:**
- 키 파일 관리 필요
- 보안 위험 (파일 노출 시)

**설정:**
```json
{
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
  }
}
```

#### 환경 변수 사용 (대안)

**장점:**
- 키 파일 노출 위험 감소
- 환경별 설정 가능

**설정:**
```json
{
  "env": {
    "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
    "GOOGLE_CLIENT_EMAIL": "id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com",
    "GOOGLE_PRIVATE_KEY": "${GOOGLE_PRIVATE_KEY}"
  }
}
```

### 7.2 필요한 권한

각 MCP 서버별로 필요한 IAM 권한:

#### gcp-observability
- `logging.logEntries.list` (로그 조회)
- `monitoring.timeSeries.list` (메트릭 조회)
- `cloudtrace.traces.list` (트레이스 조회)
- `clouderrorreporting.errors.list` (오류 조회)

#### gcloud-mcp
- 프로젝트 리소스 조회 권한
- 빌링 정보 조회 권한 (필요시)

### 7.3 보안 모범 사례

1. **최소 권한 원칙**: 필요한 권한만 부여
2. **키 파일 보호**: Git에 커밋하지 않기
3. **정기적 키 로테이션**: 주기적으로 키 갱신
4. **환경별 분리**: 개발/프로덕션 환경 분리

---

## 8. 문제 해결

### 8.1 일반적인 문제

#### 문제: MCP 서버가 시작되지 않음

**증상**: 로그에 "could not determine executable to run" 오류

**원인**:
- 패키지가 존재하지 않음
- 실행 바이너리가 없음

**해결**:
1. 패키지 이름 확인
2. `npm view [package-name]`으로 패키지 존재 확인
3. 실행 바이너리 확인 (`bin` 필드)

#### 문제: 인증 실패

**증상**: "Authentication failed" 또는 "Permission denied"

**원인**:
- 서비스 계정 키 파일 경로 오류
- 권한 부족

**해결**:
1. 키 파일 경로 확인
2. IAM 권한 확인
3. 프로젝트 ID 확인

#### 문제: 환경 변수 인식 안 됨

**증상**: 환경 변수가 `undefined`

**원인**:
- 환경 변수 이름 오류
- Cursor 재시작 필요

**해결**:
1. 환경 변수 이름 확인
2. Cursor 재시작
3. 설정 파일 문법 확인

### 8.2 디버깅 방법

1. **MCP 로그 확인**
   - Cursor의 MCP 서버 로그 확인
   - 오류 메시지 분석

2. **패키지 직접 테스트**
   ```bash
   npx -y @google-cloud/observability-mcp --help
   ```

3. **인증 테스트**
   ```bash
   gcloud auth activate-service-account --key-file=path/to/key.json
   gcloud projects list
   ```

---

## 9. 참고 자료

### 공식 문서
- [Google Cloud MCP 개요](https://docs.cloud.google.com/mcp/overview)
- [MCP 서버 활성화/비활성화](https://docs.cloud.google.com/mcp/enable-disable-mcp-servers)
- [MCP 서버 인증](https://docs.cloud.google.com/mcp/authenticate-mcp)

### GitHub 저장소
- [googleapis/gcloud-mcp](https://github.com/googleapis/gcloud-mcp)
- [krzko/google-cloud-mcp](https://github.com/krzko/google-cloud-mcp)

### npm 패키지
- [@google-cloud/gcloud-mcp](https://www.npmjs.com/package/@google-cloud/gcloud-mcp)
- [@google-cloud/observability-mcp](https://www.npmjs.com/package/@google-cloud/observability-mcp)
- [google-cloud-mcp](https://www.npmjs.com/package/google-cloud-mcp)

---

## 10. 요약

### 현재 상태

✅ **정상 작동 중:**
- `gcp-observability` (@google-cloud/observability-mcp) - 로그, 메트릭, 트레이스, 오류 모니터링

✅ **문제 해결됨:**
- `gcp-billing` 설정이 이미 제거됨 (이전에 존재하지 않는 패키지로 설정되어 있었음)

### Google Cloud MCP 서버 전체 목록

#### 공식 npm 패키지
1. ✅ `@google-cloud/gcloud-mcp` (v0.5.2) - 일반 GCP API 상호작용
2. ✅ `@google-cloud/observability-mcp` (v0.2.1) - 관찰성 API (현재 설정됨)

#### 서드파티 패키지
3. `google-cloud-mcp` (v0.1.3) - krzko 제작, Spanner/Logging/Monitoring/Trace

#### Google Cloud 서비스별 MCP 서버 (URL 기반)
4. BigQuery MCP - `bigquery.googleapis.com/mcp`
5. Compute Engine MCP - `compute.googleapis.com/mcp`
6. GKE MCP - `container.googleapis.com/mcp`
7. Maps Grounding Lite MCP - `mapstools.googleapis.com/mcp`

#### 기타 Google 서비스 MCP
8. Google Drive MCP
9. Google Sheets MCP
10. Data Commons MCP
11. Google Workspace MCP

### 권장 사항

1. **현재 상태 유지**: `gcp-observability`는 정상 작동 중이므로 그대로 사용
2. **높은 우선순위 추가**: `@google-cloud/gcloud-mcp` 추가하여 일반 GCP 관리 기능 활용
   - 빌링 정보 조회
   - 리소스 관리
   - 프로젝트 설정 확인
3. **보안 개선**: 키 파일 관리 및 권한 최소화
4. **필요시 추가**: BigQuery MCP (데이터 분석이 필요한 경우)

### 다음 단계

1. ✅ `gcp-billing` 설정 제거 완료
2. ⏳ `@google-cloud/gcloud-mcp` 추가 고려 (높은 우선순위)
3. ⏳ Cursor 재시작 후 연결 테스트
4. ⏳ 각 서버의 기능 테스트
5. ⏳ 필요시 BigQuery MCP 추가 검토

### 빠른 참조

**현재 프로젝트 설정:**
- 프로젝트 ID: `gen-lang-client-0408997230`
- 인증 파일: `C:\Users\Dohyeongheo\gen-lang-client-0408997230-2932de6cee8b.json`
- 설정 파일: `c:\Users\Dohyeongheo\.cursor\mcp.json`

**추가 설정 예시:**
```json
{
  "gcp-general": {
    "command": "npx",
    "args": ["-y", "@google-cloud/gcloud-mcp"],
    "env": {
      "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\gen-lang-client-0408997230-2932de6cee8b.json"
    }
  }
}
```

---

## 11. gcp-observability 상세 기능 가이드

### 11.1 로그 검색 (Cloud Logging)

**기능 설명:**
Cloud Logging API를 통해 프로젝트의 로그를 검색하고 필터링할 수 있습니다.

**주요 기능:**
- 시간 범위별 로그 조회
- 로그 레벨별 필터링 (ERROR, WARNING, INFO, DEBUG)
- 키워드 검색
- 리소스 타입별 필터링
- 서비스별 필터링

**사용 예시:**
```
"gcp-observability MCP로 최근 1시간 동안 발생한 ERROR 레벨 로그를 보여줘"
"gcp-observability MCP로 'database' 키워드가 포함된 로그를 검색해줘"
"gcp-observability MCP로 Cloud Run 서비스의 최근 로그를 조회해줘"
"gcp-observability MCP로 특정 사용자 ID로 발생한 모든 로그를 찾아줘"
```

**반환 정보:**
- 로그 메시지
- 타임스탬프
- 로그 레벨
- 리소스 정보
- 레이블 및 메타데이터

### 11.2 메트릭 조회 (Cloud Monitoring)

**기능 설명:**
Cloud Monitoring API를 통해 프로젝트의 메트릭 데이터를 조회할 수 있습니다.

**주요 기능:**
- CPU 사용량 모니터링
- 메모리 사용량 모니터링
- 네트워크 트래픽 모니터링
- API 응답 시간 모니터링
- 커스텀 메트릭 조회
- 시간 시리즈 데이터 조회

**사용 예시:**
```
"gcp-observability MCP로 최근 24시간 동안의 CPU 사용량 메트릭을 보여줘"
"gcp-observability MCP로 API 응답 시간이 1초를 초과한 메트릭을 찾아줘"
"gcp-observability MCP로 메모리 사용량이 높은 시간대를 확인해줘"
"gcp-observability MCP로 특정 서비스의 트래픽 메트릭을 분석해줘"
```

**반환 정보:**
- 메트릭 타입
- 데이터 포인트 (시간, 값)
- 리소스 정보
- 메트릭 레이블

### 11.3 트레이스 조회 (Cloud Trace)

**기능 설명:**
Cloud Trace API를 통해 애플리케이션의 분산 트레이싱 데이터를 조회할 수 있습니다.

**주요 기능:**
- 트레이스 검색
- 트레이스 상세 정보 조회
- 느린 트레이스 식별
- 트레이스 시간 범위별 조회
- 서비스별 트레이스 필터링

**사용 예시:**
```
"gcp-observability MCP로 최근 발생한 느린 트레이스를 찾아줘"
"gcp-observability MCP로 특정 API 엔드포인트의 트레이스를 분석해줘"
"gcp-observability MCP로 응답 시간이 2초를 초과한 트레이스를 보여줘"
"gcp-observability MCP로 특정 사용자 요청의 전체 트레이스를 추적해줘"
```

**반환 정보:**
- 트레이스 ID
- 트레이스 시간
- 스팬(span) 정보
- 서비스 간 호출 관계
- 성능 메트릭

### 11.4 오류 보고서 확인 (Error Reporting)

**기능 설명:**
Error Reporting API를 통해 프로젝트의 오류 그룹을 조회하고 분석할 수 있습니다.

**주요 기능:**
- 오류 그룹 목록 조회
- 오류 통계 조회
- 오류 발생 빈도 분석
- 오류 상세 정보 확인
- 시간 범위별 오류 조회

**사용 예시:**
```
"gcp-observability MCP로 최근 발생한 오류 그룹을 보여줘"
"gcp-observability MCP로 오늘 발생한 모든 오류를 분석해줘"
"gcp-observability MCP로 가장 많이 발생한 오류를 찾아줘"
"gcp-observability MCP로 특정 오류의 발생 빈도를 확인해줘"
```

**반환 정보:**
- 오류 그룹 ID
- 오류 메시지
- 발생 횟수
- 영향받은 사용자 수
- 첫 발생 시간 및 마지막 발생 시간
- 스택 트레이스

### 11.5 통합 사용 시나리오

#### 시나리오 1: 프로덕션 문제 진단

```
1. "gcp-observability MCP로 최근 1시간 동안 발생한 ERROR 로그를 보여줘"
2. "gcp-observability MCP로 해당 오류의 트레이스를 분석해줘"
3. "gcp-observability MCP로 관련 메트릭을 확인해줘"
4. "gcp-observability MCP로 오류 그룹의 상세 정보를 보여줘"
```

#### 시나리오 2: 성능 최적화

```
1. "gcp-observability MCP로 느린 트레이스를 찾아줘"
2. "gcp-observability MCP로 해당 트레이스의 상세 정보를 분석해줘"
3. "gcp-observability MCP로 관련 메트릭을 확인해줘"
4. "gcp-observability MCP로 성능 개선 포인트를 제시해줘"
```

#### 시나리오 3: 모니터링 대시보드 구성

```
1. "gcp-observability MCP로 최근 24시간 동안의 주요 메트릭을 요약해줘"
2. "gcp-observability MCP로 오류 발생 트렌드를 분석해줘"
3. "gcp-observability MCP로 시스템 상태를 종합적으로 평가해줘"
```

---

## 12. AI 에이전트 활용 가이드

### 12.1 자연어 명령 패턴

**기본 패턴:**
```
"[MCP 서버 이름] MCP로 [작업]을 수행해줘"
```

**예시:**
- `"gcp-observability MCP로 최근 에러 로그를 보여줘"`
- `"gcp-observability MCP로 CPU 사용량 메트릭을 확인해줘"`

### 12.2 조건부 검색

**패턴:**
```
"[MCP 서버 이름] MCP로 [조건]에 해당하는 [데이터 타입]을 찾아줘"
```

**예시:**
- `"gcp-observability MCP로 'database' 키워드가 포함된 로그를 찾아줘"`
- `"gcp-observability MCP로 응답 시간이 1초를 초과한 트레이스를 찾아줘"`

### 12.3 분석 요청

**패턴:**
```
"[MCP 서버 이름] MCP로 [데이터]를 분석하고 [결과]를 제시해줘"
```

**예시:**
- `"gcp-observability MCP로 최근 오류를 분석하고 원인을 파악해줘"`
- `"gcp-observability MCP로 성능 메트릭을 분석하고 개선점을 제시해줘"`

### 12.4 시간 범위 지정

**패턴:**
```
"[MCP 서버 이름] MCP로 [시간 범위] 동안의 [데이터 타입]을 보여줘"
```

**예시:**
- `"gcp-observability MCP로 최근 1시간 동안의 에러 로그를 보여줘"`
- `"gcp-observability MCP로 오늘 발생한 모든 오류를 분석해줘"`
- `"gcp-observability MCP로 지난 주의 성능 메트릭을 요약해줘"`

---

## 13. 실제 사용 예시

### 13.1 일일 모니터링 체크리스트

```
"gcp-observability MCP로 오늘 발생한 모든 오류를 요약해줘"
"gcp-observability MCP로 최근 24시간 동안의 시스템 성능을 평가해줘"
"gcp-observability MCP로 주의가 필요한 이슈를 찾아줘"
```

### 13.2 배포 후 검증

```
"gcp-observability MCP로 최근 배포 이후 발생한 새로운 에러를 찾아줘"
"gcp-observability MCP로 배포 후 성능 메트릭 변화를 분석해줘"
"gcp-observability MCP로 배포 후 오류율 변화를 확인해줘"
```

### 13.3 문제 해결 워크플로우

```
1. "gcp-observability MCP로 사용자가 보고한 문제와 관련된 로그를 찾아줘"
2. "gcp-observability MCP로 해당 시간대의 트레이스를 분석해줘"
3. "gcp-observability MCP로 관련 메트릭을 확인해줘"
4. "gcp-observability MCP로 문제의 근본 원인을 분석해줘"
```

---

이 문서는 Google Cloud MCP 서버에 대한 포괄적인 가이드입니다. 추가 질문이나 특정 기능에 대한 더 자세한 설명이 필요하면 언제든지 요청하세요.

