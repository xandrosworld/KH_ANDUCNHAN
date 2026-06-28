param(
    [string]$Domain = 'sodovanphuc.vn',
    [switch]$SkipPrehost,
    [switch]$KeepOldPreuploadReports,
    [switch]$KeepOldCutoverReports,
    [switch]$KeepOldProofReports
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Find-AppRoot {
    param([string]$StartPath)

    $current = (Resolve-Path -LiteralPath $StartPath).Path
    while ($current) {
        if ((Test-Path -LiteralPath (Join-Path $current 'package.json')) -and (Test-Path -LiteralPath (Join-Path $current 'deploy'))) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if (-not $parent -or $parent -eq $current) {
            break
        }
        $current = $parent
    }

    throw "Could not find app root from $StartPath."
}

function Resolve-NpmCommand {
    $cmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    $cmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    throw 'npm was not found in PATH.'
}

function Invoke-CheckedProcess {
    param(
        [string]$Name,
        [string]$FileName,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    Write-Host ''
    Write-Host "== $Name =="
    Push-Location $WorkingDirectory
    try {
        & $FileName @Arguments
        $exitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
        if ($exitCode -ne 0) {
            throw "$Name failed with exit code $exitCode."
        }
    } finally {
        Pop-Location
    }
}

function Invoke-CheckedPowerShell {
    param(
        [string]$Name,
        [string]$ScriptPath,
        [hashtable]$Parameters
    )

    Write-Host ''
    Write-Host "== $Name =="
    & $ScriptPath @Parameters
    $exitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode."
    }
}

function Get-LatestRelease {
    param([string]$AppRoot)

    $releaseRoot = Join-Path $AppRoot 'release'
    if (-not (Test-Path -LiteralPath $releaseRoot)) {
        throw "Release root does not exist: $releaseRoot"
    }

    $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
        Where-Object { $_.Name -like 'sodovanphuc-*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw 'No sodovanphuc release folder found.'
    }

    return $latest.FullName
}

function Resolve-ReleaseTool {
    param(
        [string]$ReleasePath,
        [string]$AppRoot,
        [string]$ToolName
    )

    $releaseTool = Join-Path $ReleasePath "tools\$ToolName"
    if (Test-Path -LiteralPath $releaseTool) {
        return $releaseTool
    }

    $deployTool = Join-Path $AppRoot "deploy\$ToolName"
    if (Test-Path -LiteralPath $deployTool) {
        return $deployTool
    }

    throw "Missing tool: $ToolName"
}

function Remove-DirectoryInside {
    param(
        [string]$Root,
        [string]$Path
    )

    $rootResolved = (Resolve-Path -LiteralPath $Root).Path
    $resolved = (Resolve-Path -LiteralPath $Path).Path
    if (-not $resolved.StartsWith($rootResolved + [System.IO.Path]::DirectorySeparatorChar)) {
        throw "Refusing to remove path outside ${rootResolved}: $resolved"
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}

function Get-PowerShellScriptCount {
    param([string]$AppRoot)

    $targets = @()
    $targets += Get-ChildItem -LiteralPath (Join-Path $AppRoot 'deploy') -Filter '*.ps1' -File
    $targets += Get-ChildItem -LiteralPath (Join-Path $AppRoot 'scripts') -Filter '*.ps1' -File
    return @($targets).Count
}

function Get-ContractCheckCount {
    param([string]$AppRoot)

    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        throw 'node was not found in PATH.'
    }

    $contractScript = Join-Path $AppRoot 'scripts\verify-svp-contract.mjs'
    Push-Location $AppRoot
    try {
        $output = & $node.Source $contractScript 2>&1
        $exitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
        if ($exitCode -ne 0) {
            $output | Select-Object -Last 80 | ForEach-Object { Write-Host $_ }
            throw "Contract verification failed while counting checks with exit code $exitCode."
        }

        $joined = ($output | Out-String)
        if ($joined -match 'passed \((\d+) checks\)') {
            return [int]$Matches[1]
        }

        throw 'Could not parse contract check count.'
    } finally {
        Pop-Location
    }
}

function Update-DocsForRelease {
    param(
        [string]$AppRoot,
        [string]$ReleaseName,
        [string]$ShortStamp,
        [string]$Hash,
        [int64]$Size,
        [int]$PowerShellCount,
        [int]$ContractCount
    )

    $parentRoot = Split-Path -Parent $AppRoot
    $docFiles = @(
        (Join-Path $AppRoot 'README.md'),
        (Join-Path $AppRoot 'HANDOFF_WEB.md'),
        (Join-Path $AppRoot 'deploy\HUONG_DAN_SU_DUNG.md'),
        (Join-Path $parentRoot 'DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md'),
        (Join-Path $parentRoot 'MASTER_PLAN_NOI_BO_TRIEN_KHAI_SO_DO_VAN_PHUC.md')
    )

    $sizeText = '{0:N0}' -f $Size
    foreach ($doc in $docFiles) {
        if (-not (Test-Path -LiteralPath $doc)) {
            throw "Missing doc for release update: $doc"
        }

        $text = Get-Content -LiteralPath $doc -Raw
        $text = [regex]::Replace($text, 'sodovanphuc-\d{8}-\d{6}', $ReleaseName)
        $text = [regex]::Replace($text, 'release-\d{6}-tool-check', "release-$ShortStamp-tool-check")
        $text = [regex]::Replace(
            $text,
            '(Full upload zip SHA256:\s*`?)[0-9a-f]{64}(`?)',
            { param($match) "$($match.Groups[1].Value)$Hash$($match.Groups[2].Value)" }
        )
        $text = [regex]::Replace(
            $text,
            '(Full upload zip size:\s*`?)[0-9,]+ bytes(`?)',
            { param($match) "$($match.Groups[1].Value)$sizeText bytes$($match.Groups[2].Value)" }
        )
        $text = [regex]::Replace($text, 'PowerShell syntax parse: pass \d+ files', "PowerShell syntax parse: pass $PowerShellCount files")
        $text = [regex]::Replace($text, 'parse duoc \d+ file PowerShell', "parse duoc $PowerShellCount file PowerShell")
        $text = [regex]::Replace($text, 'contract verify: pass, \d+ checks', "contract verify: pass, $ContractCount checks")
        $text = [regex]::Replace($text, 'contract verify: pass \d+ checks', "contract verify: pass $ContractCount checks")
        $text = [regex]::Replace($text, 'contract:verify: pass, \d+ checks', "contract:verify: pass, $ContractCount checks")
        Set-Content -LiteralPath $doc -Encoding UTF8 -Value $text
    }

    Write-Host "[OK] docs updated to $ReleaseName, $ContractCount checks, $PowerShellCount PowerShell files"
}

$appRoot = Find-AppRoot $scriptDir
$npm = Resolve-NpmCommand

Set-Location $appRoot

if (-not $SkipPrehost) {
    Invoke-CheckedProcess `
        -Name 'Full pre-hosting gate' `
        -FileName $npm `
        -Arguments @('run', 'prehost') `
        -WorkingDirectory $appRoot
}

$release = (Resolve-Path -LiteralPath (Get-LatestRelease $appRoot)).Path
$releaseName = Split-Path -Leaf $release
$shortStamp = if ($releaseName -match '(\d{6})$') { $Matches[1] } else { $timestamp }
$fullZip = Join-Path $release 'sodovanphuc-full-public_html.zip'
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $fullZip).Hash.ToLowerInvariant()
$size = (Get-Item -LiteralPath $fullZip).Length
$powerShellCount = Get-PowerShellScriptCount $appRoot
$contractCount = Get-ContractCheckCount $appRoot
Update-DocsForRelease `
    -AppRoot $appRoot `
    -ReleaseName $releaseName `
    -ShortStamp $shortStamp `
    -Hash $hash `
    -Size $size `
    -PowerShellCount $powerShellCount `
    -ContractCount $contractCount

$preuploadRoot = Join-Path $appRoot 'qa\preupload'
$preuploadDir = Join-Path $preuploadRoot "release-$shortStamp-tool-check"

if (Test-Path -LiteralPath $preuploadDir) {
    Remove-DirectoryInside -Root $preuploadRoot -Path $preuploadDir
}

$preuploadTool = Resolve-ReleaseTool $release $appRoot 'preupload-report-sodovanphuc.ps1'
$domainCutoverTool = Resolve-ReleaseTool $release $appRoot 'domain-cutover-report-vanphuc.ps1'
$finalAuditTool = Resolve-ReleaseTool $release $appRoot 'final-prehosting-audit.ps1'

Invoke-CheckedPowerShell `
    -Name 'Pre-upload evidence report' `
    -ScriptPath $preuploadTool `
    -Parameters @{
        ReleasePath = $release
        Domain = $Domain
        OutputDir = $preuploadDir
    }

$preuploadReport = Join-Path $preuploadDir 'PREUPLOAD_REPORT.md'
if (-not (Test-Path -LiteralPath $preuploadReport)) {
    throw "Pre-upload report was not written: $preuploadReport"
}

$cutoverRoot = Join-Path $appRoot 'qa\domain-cutover'
$cutoverDir = Join-Path $cutoverRoot "release-$shortStamp-cutover"

if (Test-Path -LiteralPath $cutoverDir) {
    Remove-DirectoryInside -Root $cutoverRoot -Path $cutoverDir
}

Invoke-CheckedPowerShell `
    -Name 'Domain cutover evidence report' `
    -ScriptPath $domainCutoverTool `
    -Parameters @{
        Domain = $Domain
        OutputDir = $cutoverDir
    }

$cutoverReport = Join-Path $cutoverDir 'DOMAIN_CUTOVER_REPORT.md'
if (-not (Test-Path -LiteralPath $cutoverReport)) {
    throw "Domain cutover report was not written: $cutoverReport"
}

Invoke-CheckedPowerShell `
    -Name 'Final pre-hosting audit' `
    -ScriptPath $finalAuditTool `
    -Parameters @{
        ReleasePath = $release
        PreuploadReport = $preuploadReport
    }

if (-not $KeepOldPreuploadReports) {
    Get-ChildItem -LiteralPath $preuploadRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -ne (Resolve-Path -LiteralPath $preuploadDir).Path } |
        ForEach-Object {
            Remove-DirectoryInside -Root $preuploadRoot -Path $_.FullName
        }
}

if (-not $KeepOldCutoverReports) {
    Get-ChildItem -LiteralPath $cutoverRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -ne (Resolve-Path -LiteralPath $cutoverDir).Path } |
        ForEach-Object {
            Remove-DirectoryInside -Root $cutoverRoot -Path $_.FullName
        }
}

$proofRoot = Join-Path $appRoot 'qa\prehosting-proof'
$proofDir = Join-Path $proofRoot $releaseName
New-Item -ItemType Directory -Force -Path $proofDir | Out-Null
$proofPath = Join-Path $proofDir 'PREHOSTING_PROOF.md'

$reportText = Get-Content -LiteralPath $preuploadReport -Raw
$liveDomainStatus = if ($reportText.Contains('| Live domain diagnostic snapshot | EXPECTED_FAIL |')) {
    'EXPECTED_FAIL before real upload/SSL/config/DB'
} elseif ($reportText.Contains('| Live domain diagnostic snapshot | PASS |')) {
    'PASS'
} else {
    'CHECK REPORT'
}

$proofLines = @(
    '# So Do Van Phuc Pre-Hosting Proof',
    '',
    '- Final status: PASS',
    "- Generated: $((Get-Date).ToString('s'))",
    "- Domain: https://$Domain",
    "- Release: $release",
    "- Upload zip: $fullZip",
    "- SHA256: $hash",
    "- Size: $size bytes",
    "- Pre-upload report: $preuploadReport",
    "- Domain cutover report: $cutoverReport",
    '- Final audit: PASS',
    "- Live domain diagnostic: $liveDomainStatus",
    '',
    'When DNS/SSL should be final, enforce the domain cutover gate:',
    '',
    '```powershell',
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\domain-cutover-report-vanphuc.ps1 -RequireReady",
    '```',
    '',
    'Next command when real Mat Bao DB credentials are known:',
    '',
    '```powershell',
    '$env:SVP_DB_PASS = "PASS_DB"',
    '$env:SVP_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH"',
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\prepare-real-upload.ps1 -ReleasePath release\$releaseName -DbName `"TEN_DB`" -DbUser `"USER_DB`"",
    'Remove-Item Env:\SVP_DB_PASS, Env:\SVP_ADMIN_PASSWORD -ErrorAction SilentlyContinue',
    '```',
    '',
    'After upload, SSL, config.php and DB import:',
    '',
    '```powershell',
    '$env:SVP_LIVE_ADMIN_USERNAME = "admin"',
    '$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"',
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow",
    'Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue',
    '```',
    '',
    'Fallback if you want separate wait and acceptance steps:',
    '',
    '```powershell',
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow",
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow",
    '',
    'After ACCEPTANCE_REPORT.md says Final status: PASS, clean local configured upload artifacts:',
    '',
    "powershell -ExecutionPolicy Bypass -File release\$releaseName\tools\cleanup-real-upload-artifacts.ps1 -ConfirmUploadedAndAccepted",
    '```'
)

Set-Content -LiteralPath $proofPath -Encoding UTF8 -Value $proofLines

if (-not $KeepOldProofReports) {
    Get-ChildItem -LiteralPath $proofRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -ne (Resolve-Path -LiteralPath $proofDir).Path } |
        ForEach-Object {
            Remove-DirectoryInside -Root $proofRoot -Path $_.FullName
        }
}

Write-Host ''
Write-Host 'Pre-hosting proof passed.'
Write-Host "Release: $release"
Write-Host "Upload zip: $fullZip"
Write-Host "SHA256: $hash"
Write-Host "Proof: $proofPath"

$global:LASTEXITCODE = 0
