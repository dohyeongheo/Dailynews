# Google Cloud CLI (gcloud) 설치 가이드

**작성일**: 2025-12-31
**목적**: `@google-cloud/gcloud-mcp` MCP 서버 사용을 위한 gcloud CLI 설치

## 개요

`@google-cloud/gcloud-mcp` MCP 서버는 `gcloud` CLI 도구를 필요로 합니다. 이 가이드는 Windows 환경에서 gcloud CLI를 설치하고 설정하는 방법을 설명합니다.

---

## 1. 설치 방법

### 방법 1: 설치 프로그램 사용 (권장)

#### 1단계: 설치 프로그램 다운로드

**옵션 A: 웹 브라우저에서 다운로드**
- https://cloud.google.com/sdk/docs/install-sdk#windows
- 또는 직접 다운로드: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

**옵션 B: PowerShell에서 다운로드**
```powershell
$ProgressPreference = 'SilentlyContinue'
(New-Object Net.WebClient).DownloadFile(
    "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe",
    "$env:TEMP\GoogleCloudSDKInstaller.exe"
)
Write-Host "다운로드 완료: $env:TEMP\GoogleCloudSDKInstaller.exe"
```

#### 2단계: 설치 프로그램 실행

1. 다운로드한 `GoogleCloudSDKInstaller.exe` 실행
2. 설치 마법사 따라하기:
   - **중요**: "Add to PATH" 옵션을 **반드시 선택**
   - 설치 경로는 기본값 사용 권장
3. 설치 완료 대기

#### 3단계: 설치 확인

**새 PowerShell 창을 열어서** (PATH 업데이트를 위해):

```powershell
gcloud --version
```

예상 출력:
```
Google Cloud SDK 470.0.0
bq 2.1.2
core 2024.03.22
gcloud-crc32c 1.0.0
gsutil 5.27
```

---

## 2. 인증 설정

### 2.1 서비스 계정 인증

```powershell
gcloud auth activate-service-account --key-file="C:\Users\Dohyeongheo\Desktop\Cursor\Dailynews\gen-lang-client-0408997230-2932de6cee8b.json"
```

### 2.2 프로젝트 설정

```powershell
gcloud config set project gen-lang-client-0408997230
```

### 2.3 설정 확인

```powershell
gcloud config list
```

예상 출력:
```
[core]
account = id-cursor-mcp@gen-lang-client-0408997230.iam.gserviceaccount.com
project = gen-lang-client-0408997230
```

---

## 3. MCP 서버 연결 확인

### 3.1 Cursor 재시작

1. Cursor 완전히 종료
2. Cursor 다시 시작
3. MCP 서버 상태 확인

### 3.2 연결 테스트

다음 명령으로 테스트:
```
"gcp-general MCP로 프로젝트의 리소스 목록을 보여줘"
```

---

## 4. 문제 해결

### 문제 1: "gcloud is not recognized"

**원인**: PATH에 gcloud가 추가되지 않음

**해결 방법**:
1. 설치 프로그램을 다시 실행
2. "Add to PATH" 옵션 확인
3. 또는 수동으로 PATH 추가:
   ```powershell
   # gcloud 설치 경로 확인 (일반적으로)
   $gcloudPath = "$env:ProgramFiles\Google\Cloud SDK\google-cloud-sdk\bin"
   $env:Path += ";$gcloudPath"
   ```

### 문제 2: "Authentication failed"

**원인**: 서비스 계정 키 파일 경로 오류 또는 권한 부족

**해결 방법**:
1. 키 파일 경로 확인:
   ```powershell
   Test-Path "C:\Users\Dohyeongheo\Desktop\Cursor\Dailynews\gen-lang-client-0408997230-2932de6cee8b.json"
   ```
2. 키 파일 권한 확인
3. 인증 다시 시도

### 문제 3: "Project not found"

**원인**: 프로젝트 ID 오류

**해결 방법**:
1. 프로젝트 ID 확인:
   ```powershell
   gcloud projects list
   ```
2. 올바른 프로젝트 ID로 설정:
   ```powershell
   gcloud config set project [올바른-프로젝트-ID]
   ```

---

## 5. 설치 후 확인 사항

### ✅ 체크리스트

- [ ] `gcloud --version` 명령어가 정상 작동
- [ ] `gcloud auth list`에서 서비스 계정이 표시됨
- [ ] `gcloud config get-value project`가 올바른 프로젝트 ID 반환
- [ ] Cursor 재시작 후 `gcp-general` MCP 서버 연결 성공

---

## 6. 추가 정보

### gcloud CLI 주요 명령어

```powershell
# 버전 확인
gcloud --version

# 인증된 계정 확인
gcloud auth list

# 현재 프로젝트 확인
gcloud config get-value project

# 프로젝트 목록 확인
gcloud projects list

# 설정 확인
gcloud config list
```

### 참고 자료

- Google Cloud SDK 공식 문서: https://cloud.google.com/sdk/docs
- Windows 설치 가이드: https://cloud.google.com/sdk/docs/install-sdk#windows
- gcloud CLI 명령어 참조: https://cloud.google.com/sdk/gcloud/reference

---

**작성자**: AI Agent
**최종 업데이트**: 2025-12-31



