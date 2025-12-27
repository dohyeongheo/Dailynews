# PowerShell UTF-8 인코딩 설정 스크립트
# 이 스크립트를 실행하면 현재 세션과 프로필에 UTF-8 인코딩이 설정됩니다.

Write-Host "PowerShell UTF-8 인코딩 설정 중..." -ForegroundColor Green

# 현재 세션의 출력 인코딩을 UTF-8로 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# 코드 페이지를 UTF-8 (65001)로 변경
chcp 65001 | Out-Null

Write-Host "✓ 현재 세션의 인코딩이 UTF-8로 설정되었습니다." -ForegroundColor Green

# PowerShell 프로필 경로 확인
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path -Parent $profilePath

# 프로필 디렉토리가 없으면 생성
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "✓ PowerShell 프로필 디렉토리를 생성했습니다: $profileDir" -ForegroundColor Green
}

# 프로필 파일에 UTF-8 설정 추가
$utf8Settings = @"

# UTF-8 인코딩 설정 (자동 추가됨)
`$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

"@

# 프로필 파일이 없거나 UTF-8 설정이 없으면 추가
if (-not (Test-Path $profilePath)) {
    Set-Content -Path $profilePath -Value $utf8Settings -Encoding UTF8
    Write-Host "✓ PowerShell 프로필을 생성하고 UTF-8 설정을 추가했습니다: $profilePath" -ForegroundColor Green
} elseif (-not (Get-Content $profilePath -Raw).Contains("UTF-8 인코딩 설정")) {
    Add-Content -Path $profilePath -Value $utf8Settings -Encoding UTF8
    Write-Host "✓ PowerShell 프로필에 UTF-8 설정을 추가했습니다: $profilePath" -ForegroundColor Green
} else {
    Write-Host "✓ PowerShell 프로필에 이미 UTF-8 설정이 있습니다." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "설정 완료! 다음 PowerShell 세션부터 자동으로 UTF-8 인코딩이 적용됩니다." -ForegroundColor Cyan
Write-Host "현재 세션에서도 이미 적용되었습니다." -ForegroundColor Cyan


