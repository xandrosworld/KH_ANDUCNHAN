param(
    [string]$Domain = 'sodovanphuc.vn',
    [switch]$IncludeWriteWorkflow
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Find-AppRoot {
    $current = $scriptDir
    for ($i = 0; $i -lt 8; $i++) {
        if (
            (Test-Path -LiteralPath (Join-Path $current 'package.json')) -and
            (Test-Path -LiteralPath (Join-Path $current 'playwright.hosting.config.ts')) -and
            (Test-Path -LiteralPath (Join-Path $current 'qa\hosting-live.spec.ts'))
        ) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if (-not $parent -or $parent -eq $current) {
            break
        }
        $current = $parent
    }

    throw 'Could not find app root with package.json, playwright.hosting.config.ts and qa/hosting-live.spec.ts. Run this from the app workspace or release/tools inside it.'
}

$appRoot = Find-AppRoot
$playwrightCmd = Join-Path $appRoot 'node_modules\.bin\playwright.cmd'

if (-not (Test-Path -LiteralPath $playwrightCmd)) {
    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $npx) {
        throw 'Playwright CLI was not found in node_modules and npx is unavailable. Run npm install before browser smoke.'
    }
    $playwrightCmd = $npx.Source
}

$baseUrl = "https://$Domain"
Write-Host "Running live browser smoke for $baseUrl"

Push-Location $appRoot
try {
    $env:SVP_HOSTING_BASE_URL = $baseUrl
    if ($IncludeWriteWorkflow) {
        $env:SVP_LIVE_WRITE_WORKFLOW = '1'
    } else {
        Remove-Item Env:\SVP_LIVE_WRITE_WORKFLOW -ErrorAction SilentlyContinue
    }

    if ($playwrightCmd.EndsWith('npx.cmd', [System.StringComparison]::OrdinalIgnoreCase) -or $playwrightCmd.EndsWith('npx.ps1', [System.StringComparison]::OrdinalIgnoreCase) -or (Split-Path -Leaf $playwrightCmd) -eq 'npx') {
        & $playwrightCmd playwright test --config=playwright.hosting.config.ts
    } else {
        & $playwrightCmd test --config=playwright.hosting.config.ts
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Live browser smoke failed with exit code $LASTEXITCODE"
    }
} finally {
    Remove-Item Env:\SVP_HOSTING_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:\SVP_LIVE_WRITE_WORKFLOW -ErrorAction SilentlyContinue
    Pop-Location
}

if ($IncludeWriteWorkflow) {
    Write-Check "live browser smoke and UI write workflow passed for $baseUrl"
} else {
    Write-Check "live browser smoke passed for $baseUrl"
}
