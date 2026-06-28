param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [switch]$IncludeWriteWorkflow,
    [switch]$SkipBrowserSmoke
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$diagnoseScript = Join-Path $scriptDir 'diagnose-vanphuc-hosting.ps1'
$smokeScript = Join-Path $scriptDir 'smoke-vanphuc-hosting.ps1'
$browserSmokeScript = Join-Path $scriptDir 'browser-smoke-vanphuc-hosting.ps1'
$packageVerifier = Join-Path $scriptDir 'verify-release-package.ps1'

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Script
    )

    Write-Host ''
    Write-Host "== $Name =="
    $global:LASTEXITCODE = $null
    & $Script
    if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

if (-not (Test-Path -LiteralPath $diagnoseScript)) {
    throw "Missing diagnostic script: $diagnoseScript"
}
if (-not (Test-Path -LiteralPath $smokeScript)) {
    throw "Missing smoke script: $smokeScript"
}
if (-not $SkipBrowserSmoke -and -not (Test-Path -LiteralPath $browserSmokeScript)) {
    throw "Missing browser smoke script: $browserSmokeScript"
}

if (Test-Path -LiteralPath $packageVerifier) {
    Invoke-Step 'Release package self-check' {
        & $packageVerifier
    }
}

Invoke-Step 'Hosting diagnostic gate' {
    if ($ExpectedIp) {
        & $diagnoseScript -Domain $Domain -ExpectedIp $ExpectedIp -RequireReady
    } else {
        & $diagnoseScript -Domain $Domain -RequireReady
    }
}

Invoke-Step 'Hosting smoke gate' {
    if ($IncludeWriteWorkflow) {
        & $smokeScript -BaseUrl "https://$Domain" -IncludeWriteWorkflow
    } else {
        & $smokeScript -BaseUrl "https://$Domain"
    }
}

if (-not $SkipBrowserSmoke) {
    Invoke-Step 'Hosting browser smoke gate' {
        if ($IncludeWriteWorkflow) {
            & $browserSmokeScript -Domain $Domain -IncludeWriteWorkflow
        } else {
            & $browserSmokeScript -Domain $Domain
        }
    }
}

Write-Host ''
Write-Host "Hosting ready for handoff: https://$Domain"
