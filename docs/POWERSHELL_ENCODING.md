# PowerShell 한글 인코딩 문제 해결 가이드

## 문제
PowerShell 터미널에서 한글이 깨져서 표시되는 문제가 발생할 수 있습니다.
예: `{"category":"愿?⑤돱??,"msg":"getNewsByCategoryAction ?깃났"}`

## 원인
PowerShell의 기본 출력 인코딩이 UTF-8이 아니기 때문에 발생합니다.

## 해결 방법

### 방법 1: 자동 설정 스크립트 실행 (권장)

프로젝트 루트에서 다음 명령어를 실행하세요:

```powershell
npm run setup:encoding
```

또는 직접 실행:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-powershell-encoding.ps1
```

이 스크립트는:
- 현재 PowerShell 세션의 인코딩을 UTF-8로 설정
- PowerShell 프로필에 UTF-8 설정을 영구적으로 추가
- 이후 모든 PowerShell 세션에서 자동으로 UTF-8 인코딩 적용

### 방법 2: 수동 설정

#### 현재 세션만 설정
PowerShell에서 다음 명령어를 실행:

```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

#### 영구 설정 (프로필에 추가)
PowerShell 프로필을 열고 다음 내용을 추가:

```powershell
notepad $PROFILE
```

다음 내용을 추가:

```powershell
# UTF-8 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

### 방법 3: 개발 서버 실행 시 자동 적용

UTF-8 인코딩이 적용된 상태로 개발 서버를 실행:

```powershell
npm run dev:utf8
```

## 확인 방법

설정이 제대로 적용되었는지 확인:

```powershell
# 현재 코드 페이지 확인 (65001이면 UTF-8)
chcp

# 출력 인코딩 확인
$OutputEncoding.EncodingName
```

## 추가 참고사항

### VS Code 터미널
VS Code의 통합 터미널을 사용하는 경우, VS Code 설정에서 다음을 확인하세요:

1. `File > Preferences > Settings` (또는 `Ctrl + ,`)
2. `terminal.integrated.encoding` 검색
3. 값이 `utf8`로 설정되어 있는지 확인

또는 `settings.json`에 직접 추가:

```json
{
  "terminal.integrated.encoding": "utf8"
}
```

### Windows 터미널
Windows Terminal을 사용하는 경우, 기본적으로 UTF-8을 지원하므로 별도 설정이 필요 없습니다.

## 문제가 계속되는 경우

1. **PowerShell 버전 확인**: PowerShell 5.1 이상 사용 권장
2. **폰트 확인**: 터미널 폰트가 한글을 지원하는지 확인 (예: "Consolas", "Cascadia Code")
3. **프로필 재로드**: 설정 후 PowerShell을 재시작하거나 `.$PROFILE` 명령어로 프로필을 다시 로드

## 관련 파일

- `scripts/setup-powershell-encoding.ps1`: 자동 설정 스크립트
- `package.json`: `setup:encoding` 및 `dev:utf8` 스크립트


