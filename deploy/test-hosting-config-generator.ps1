param(
    [string]$AdminPassword = 'LocalDryRunStrong!234'
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-config-dryrun-{0}.php" -f ([guid]::NewGuid().ToString('N')))
$weakTempPath = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-config-weak-dryrun-{0}.php" -f ([guid]::NewGuid().ToString('N')))

try {
    & (Join-Path $deployDir 'new-hosting-config.ps1') `
        -DbName 'dryrun_db' `
        -DbUser 'dryrun_user' `
        -DbPass 'dryrun_pass_123' `
        -AdminPassword $AdminPassword `
        -OutputPath $tempPath `
        -Force

    $content = Get-Content -LiteralPath $tempPath -Raw
    if ($content -match 'REPLACE_WITH|replace_with|your_password|changeme') {
        throw 'Dry-run config still contains placeholder text.'
    }
    if ($content -notmatch 'define\(''ADMIN_PASSWORD_HASH'',\s*''(\$2[aby]\$\d{2}\$|pbkdf2_sha256\$)') {
        throw 'Dry-run config did not contain a supported admin password hash.'
    }
    if ($content -notmatch 'define\(''JWT_SECRET'',\s*''[a-fA-F0-9]{64}''\);') {
        throw 'Dry-run config did not contain a generated JWT secret.'
    }

    Write-Host ''
    Write-Host "Hosting config generator dry-run passed."

    $weakRejected = $false
    try {
        & (Join-Path $deployDir 'new-hosting-config.ps1') `
            -DbName 'dryrun_db' `
            -DbUser 'dryrun_user' `
            -DbPass 'dryrun_pass_123' `
            -AdminPassword 'password123' `
            -OutputPath $weakTempPath `
            -Force
    } catch {
        if ($_.Exception.Message -match 'Admin password') {
            $weakRejected = $true
        } else {
            throw
        }
    }

    if (-not $weakRejected) {
        throw 'Weak admin password was not rejected.'
    }

    Write-Host "Weak admin password rejection passed."
} finally {
    Remove-Item -LiteralPath $tempPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $weakTempPath -Force -ErrorAction SilentlyContinue
}
