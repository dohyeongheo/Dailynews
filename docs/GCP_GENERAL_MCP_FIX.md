# gcp-general MCP 서버 연결 문제 해결 가이드

**작성일**: 2025-12-31
**문제**: `gcp-general` (`@google-cloud/gcloud-mcp`) 서버 연결 실패
**원인**: `gcloud` CLI가 설치되지 않음

## 문제 원인

`@google-cloud/gcloud-mcp`는 `gcloud` CLI 도구를 필요로 합니다. 에러 메시지:

```
ERROR: Unable to start gcloud mcp server: gcloud executable not found.
```

### 차이점

- ✅ **`@google-cloud/observability-mcp`**: `gcloud` CLI 불필요 (직접 API 호출)
- ❌ **`@google-cloud/gcloud-mcp`**: `gcloud` CLI **필수**

## 해결 방법

### 방법 1: gcloud CLI 설치 (권장)

#### Windows 설치 방법

1. **Google Cloud SDK 설치 프로그램 다운로드**

   - 공식 다운로드 페이지: https://cloud.google.com/sdk/docs/install-sdk#windows
   - 또는 직접 다운로드: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe

2. **설치 프로그램 실행**

   - 다운로드한 `GoogleCloudSDKInstaller.exe` 실행
   - 설치 마법사 따라하기
   - **중요**: "Add to PATH" 옵션 선택

3. **설치 확인**

   ```powershell
   # 새 PowerShell 창 열기 (PATH 업데이트를 위해)
   gcloud --version
   ```

4. **인증 설정**

   ```powershell
   gcloud auth activate-service-account --key-file="C:\Users\Dohyeongheo\Desktop\Cursor\Dailynews\gen-lang-client-0408997230-2932de6cee8b.json"
   gcloud config set project gen-lang-client-0408997230
   ```

5. **Cursor 재시작**
   - Cursor를 완전히 종료한 후 다시 시작
   - MCP 서버 연결 상태 확인

### 방법 2: gcloud CLI 없이 사용 (대안)

`gcloud` CLI 설치가 어려운 경우, 다음 대안을 고려할 수 있습니다:

#### 옵션 A: gcp-general 제거 (빌링 정보 불필요한 경우)

`mcp.json`에서 `gcp-general` 설정을 제거하고 `gcp-observability`만 사용:

```json
{
  "mcpServers": {
    // ... 다른 서버들 ...
    "gcp-observability": {
      "command": "npx",
      "args": ["-y", "@google-cloud/observability-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "gen-lang-client-0408997230",
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\Dohyeongheo\\Desktop\\Cursor\\Dailynews\\gen-lang-client-0408997230-2932de6cee8b.json"
      }
    }
    // gcp-general 제거
  }
}
```

#### 옵션 B: google-cloud-mcp (krzko) 사용

`gcloud` CLI 없이 작동하는 서드파티 MCP 서버 사용:

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

**참고**: `GOOGLE_PRIVATE_KEY`는 서비스 계정 키 파일에서 추출해야 합니다.

## 현재 상태

- ✅ **gcp-observability**: 정상 작동 (`gcloud` CLI 불필요)
- ❌ **gcp-general**: 연결 실패 (`gcloud` CLI 필요)

## 권장 사항

1. **빌링 정보가 필요한 경우**: `gcloud` CLI 설치 (방법 1) ⭐ 권장
2. **빌링 정보가 불필요한 경우**: `gcp-general` 제거하고 `gcp-observability`만 사용
3. **빌링 정보가 필요하지만 `gcloud` CLI 설치가 어려운 경우**: `google-cloud-mcp` (krzko) 사용

## 참고 자료

- Google Cloud SDK 설치 가이드: https://cloud.google.com/sdk/docs/install
- Windows 설치 가이드: https://cloud.google.com/sdk/docs/install-sdk#windows
- `@google-cloud/gcloud-mcp` GitHub: https://github.com/googleapis/gcloud-mcp
- `google-cloud-mcp` (krzko) GitHub: https://github.com/krzko/google-cloud-mcp
