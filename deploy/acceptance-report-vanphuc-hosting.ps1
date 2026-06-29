param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [switch]$IncludeWriteWorkflow,
    [switch]$SkipBrowserSmoke,
    [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Domain = $Domain.Trim().TrimEnd('/')
$baseUrl = "https://$Domain"

function Find-AppRoot {
    param([string]$StartPath)

    $current = (Resolve-Path -LiteralPath $StartPath).Path
    while ($current) {
        if (
            (Test-Path -LiteralPath (Join-Path $current 'package.json')) -and
            (Test-Path -LiteralPath (Join-Path $current 'deploy')) -and
            (Test-Path -LiteralPath (Join-Path $current 'qa'))
        ) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if (-not $parent -or $parent -eq $current) {
            break
        }
        $current = $parent
    }

    return $null
}

function Resolve-ReleaseRoot {
    param([string]$AppRoot)

    $scriptParent = Split-Path -Parent $scriptDir
    if (Test-Path -LiteralPath (Join-Path $scriptParent 'CHECKSUMS-SHA256.txt')) {
        return $scriptParent
    }

    if ($AppRoot) {
        $releaseRoot = Join-Path $AppRoot 'release'
        if (Test-Path -LiteralPath $releaseRoot) {
            $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
                Where-Object { $_.Name -like 'sodovanphuc-*' } |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($latest) {
                return $latest.FullName
            }
        }
    }

    throw 'Could not infer release root. Run from app/deploy, release/tools, or pass scripts inside the app workspace.'
}

function Resolve-ToolPath {
    param(
        [string]$ToolName,
        [string]$ReleaseRoot,
        [string]$AppRoot
    )

    if ($AppRoot) {
        $deployTool = Join-Path $AppRoot "deploy\$ToolName"
        if (Test-Path -LiteralPath $deployTool) {
            return $deployTool
        }
    }

    $releaseTool = Join-Path $ReleaseRoot "tools\$ToolName"
    if (Test-Path -LiteralPath $releaseTool) {
        return $releaseTool
    }

    throw "Missing tool: $ToolName"
}

function New-ReportOutputDir {
    param(
        [string]$RequestedOutputDir,
        [string]$AppRoot,
        [string]$ReleaseRoot
    )

    if ($RequestedOutputDir) {
        $path = $RequestedOutputDir
    } elseif ($AppRoot) {
        $path = Join-Path $AppRoot "qa\hosting-acceptance\$timestamp"
    } else {
        $path = Join-Path $ReleaseRoot "acceptance-reports\$timestamp"
    }

    New-Item -ItemType Directory -Force -Path $path | Out-Null
    return (Resolve-Path -LiteralPath $path).Path
}

function Invoke-LoggedPowerShellStep {
    param(
        [string]$Name,
        [string]$LogName,
        [string]$ScriptPath,
        [string[]]$Arguments
    )

    $logPath = Join-Path $script:reportDir $LogName
    $started = Get-Date
    $status = 'PASS'
    $exitCode = 0
    $message = ''

    Write-Host ''
    Write-Host "== $Name =="

    $commandLine = @('powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
    Set-Content -LiteralPath $logPath -Encoding UTF8 -Value @(
        "Command: $($commandLine -join ' ')",
        "Started: $($started.ToString('s'))",
        ''
    )

    $processArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
    $escapedArgs = $processArgs | ForEach-Object {
        $arg = [string]$_
        if ($arg -match '[\s"]') {
            '"' + ($arg -replace '"', '\"') + '"'
        } else {
            $arg
        }
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = 'powershell.exe'
    $startInfo.Arguments = ($escapedArgs -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    $exitCode = $process.ExitCode
    $stdout = $stdout -replace "`0", ''
    $stderr = $stderr -replace "`0", ''

    if ($stdout) {
        Write-Host $stdout
        Add-Content -LiteralPath $logPath -Encoding UTF8 -Value $stdout
    }
    if ($stderr) {
        Write-Host $stderr
        Add-Content -LiteralPath $logPath -Encoding UTF8 -Value $stderr
    }

    if ($exitCode -ne 0) {
        $status = 'FAIL'
        $message = "exit code $exitCode"
        $script:hasFailure = $true
    }

    $ended = Get-Date
    $duration = [math]::Round(($ended - $started).TotalSeconds, 1)

    Add-Content -LiteralPath $logPath -Encoding UTF8 -Value @(
        '',
        "Ended: $($ended.ToString('s'))",
        "Status: $status",
        "ExitCode: $exitCode",
        "DurationSeconds: $duration"
    )

    $script:results.Add([pscustomobject]@{
        Step = $Name
        Status = $status
        ExitCode = $exitCode
        DurationSeconds = $duration
        Log = $logPath
        Message = $message
    }) | Out-Null
}

function ConvertTo-MarkdownTableLine {
    param([pscustomobject]$Result)

    $logName = Split-Path -Leaf $Result.Log
    return "| $($Result.Step) | $($Result.Status) | $($Result.ExitCode) | $($Result.DurationSeconds)s | $logName |"
}

$appRoot = Find-AppRoot $scriptDir
$releaseRoot = Resolve-ReleaseRoot $appRoot
$script:reportDir = New-ReportOutputDir $OutputDir $appRoot $releaseRoot
$script:results = New-Object System.Collections.Generic.List[object]
$script:hasFailure = $false

$packageVerifier = Resolve-ToolPath 'verify-release-package.ps1' $releaseRoot $appRoot
$diagnoseScript = Resolve-ToolPath 'diagnose-vanphuc-hosting.ps1' $releaseRoot $appRoot
$smokeScript = Resolve-ToolPath 'smoke-vanphuc-hosting.ps1' $releaseRoot $appRoot
$browserSmokeScript = Resolve-ToolPath 'browser-smoke-vanphuc-hosting.ps1' $releaseRoot $appRoot

Invoke-LoggedPowerShellStep `
    -Name 'Release package self-check' `
    -LogName '01-release-package.log' `
    -ScriptPath $packageVerifier `
    -Arguments @('-ReleasePath', $releaseRoot)

$diagnoseArgs = @('-Domain', $Domain, '-RequireReady')
if ($ExpectedIp) {
    $diagnoseArgs += @('-ExpectedIp', $ExpectedIp)
}
Invoke-LoggedPowerShellStep `
    -Name 'Strict hosting diagnostic' `
    -LogName '02-hosting-diagnostic.log' `
    -ScriptPath $diagnoseScript `
    -Arguments $diagnoseArgs

$smokeArgs = @('-BaseUrl', $baseUrl)
if ($IncludeWriteWorkflow) {
    $smokeArgs += '-IncludeWriteWorkflow'
}
Invoke-LoggedPowerShellStep `
    -Name 'API and workflow smoke' `
    -LogName '03-api-smoke.log' `
    -ScriptPath $smokeScript `
    -Arguments $smokeArgs

if (-not $SkipBrowserSmoke) {
    $browserArgs = @('-Domain', $Domain)
    if ($IncludeWriteWorkflow) {
        $browserArgs += '-IncludeWriteWorkflow'
    }

    Invoke-LoggedPowerShellStep `
        -Name 'Live browser smoke' `
        -LogName '04-browser-smoke.log' `
        -ScriptPath $browserSmokeScript `
        -Arguments $browserArgs
}

$reportPath = Join-Path $script:reportDir 'ACCEPTANCE_REPORT.md'
$finalStatus = if ($script:hasFailure) { 'FAIL' } else { 'PASS' }
$browserArtifacts = if ($appRoot) { Join-Path $appRoot 'qa\hosting-screenshots' } else { 'See Playwright output in the app workspace.' }
$adminUsernameForReport = [Environment]::GetEnvironmentVariable('SVP_LIVE_ADMIN_USERNAME')
if (-not $adminUsernameForReport) {
    $adminUsernameForReport = 'admin'
}
$adminAuthMode = if ([Environment]::GetEnvironmentVariable('SVP_LIVE_ADMIN_PASSWORD')) {
    "enabled for username '$adminUsernameForReport' via SVP_LIVE_ADMIN_PASSWORD"
} else {
    'skipped; set SVP_LIVE_ADMIN_PASSWORD to test API JWT auth and browser login form'
}

$reportLines = New-Object System.Collections.Generic.List[string]
$reportLines.Add('# So Do Van Phuc Hosting Acceptance Report') | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add("- Final status: $finalStatus") | Out-Null
$reportLines.Add("- Domain: $baseUrl") | Out-Null
$reportLines.Add("- Generated: $((Get-Date).ToString('s'))") | Out-Null
$reportLines.Add("- Release root: $releaseRoot") | Out-Null
$reportLines.Add("- Report folder: $script:reportDir") | Out-Null
$reportLines.Add("- Write workflow smoke: $(if ($IncludeWriteWorkflow) { 'enabled' } else { 'disabled' })") | Out-Null
$reportLines.Add("- Admin auth smoke: $adminAuthMode") | Out-Null
$reportLines.Add("- Browser smoke: $(if ($SkipBrowserSmoke) { 'skipped' } else { 'enabled' })") | Out-Null
$reportLines.Add("- Browser artifacts: $browserArtifacts") | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add('| Step | Status | Exit Code | Duration | Log |') | Out-Null
$reportLines.Add('| --- | --- | ---: | ---: | --- |') | Out-Null
foreach ($result in $script:results) {
    $reportLines.Add((ConvertTo-MarkdownTableLine $result)) | Out-Null
}
$reportLines.Add('') | Out-Null
if ($script:hasFailure) {
    $reportLines.Add('Do not hand over. At least one acceptance step failed; open the referenced log file first.') | Out-Null
} else {
    $reportLines.Add('Ready for handoff. All acceptance steps passed.') | Out-Null
}

Set-Content -LiteralPath $reportPath -Encoding UTF8 -Value $reportLines

Write-Host ''
Write-Host "Acceptance report written:"
Write-Host $reportPath

if ($script:hasFailure) {
    throw "Hosting acceptance failed. See report: $reportPath"
}

Write-Host ''
Write-Host "Hosting acceptance passed for $baseUrl"
