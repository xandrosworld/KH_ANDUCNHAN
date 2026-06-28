param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [int]$WaitTimeoutMinutes = 90,
    [int]$WaitIntervalSeconds = 60,
    [int]$WaitMaxAttempts = 0,
    [switch]$IncludeWriteWorkflow,
    [switch]$SkipBrowserSmoke,
    [switch]$SkipWait,
    [switch]$CleanupConfiguredArtifacts,
    [switch]$ConfirmUploadedAndAccepted,
    [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

if ($WaitTimeoutMinutes -lt 1) {
    throw 'WaitTimeoutMinutes must be at least 1.'
}
if ($WaitIntervalSeconds -lt 10) {
    throw 'WaitIntervalSeconds must be at least 10.'
}
if ($WaitMaxAttempts -lt 0) {
    throw 'WaitMaxAttempts must be 0 for unlimited attempts until timeout, or a positive number.'
}
if ($CleanupConfiguredArtifacts -and -not $ConfirmUploadedAndAccepted) {
    throw 'CleanupConfiguredArtifacts requires -ConfirmUploadedAndAccepted.'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Domain = $Domain.Trim().TrimEnd('/')

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

    $siblingTool = Join-Path $scriptDir $ToolName
    if (Test-Path -LiteralPath $siblingTool) {
        return $siblingTool
    }

    $releaseTool = Join-Path $ReleaseRoot "tools\$ToolName"
    if (Test-Path -LiteralPath $releaseTool) {
        return $releaseTool
    }

    if ($AppRoot) {
        $deployTool = Join-Path $AppRoot "deploy\$ToolName"
        if (Test-Path -LiteralPath $deployTool) {
            return $deployTool
        }
    }

    throw "Missing tool: $ToolName"
}

function New-HandoffOutputDir {
    param(
        [string]$RequestedOutputDir,
        [string]$AppRoot,
        [string]$ReleaseRoot
    )

    if ($RequestedOutputDir) {
        $path = $RequestedOutputDir
    } elseif ($AppRoot) {
        $path = Join-Path $AppRoot "qa\hosting-complete\$timestamp"
    } else {
        $path = Join-Path $ReleaseRoot "hosting-complete-reports\$timestamp"
    }

    New-Item -ItemType Directory -Force -Path $path | Out-Null
    return (Resolve-Path -LiteralPath $path).Path
}

function ConvertTo-CommandLine {
    param(
        [string]$ScriptPath,
        [string[]]$Arguments
    )

    $parts = @('powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
    return ($parts -join ' ')
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

    Set-Content -LiteralPath $logPath -Encoding UTF8 -Value @(
        "Command: $(ConvertTo-CommandLine -ScriptPath $ScriptPath -Arguments $Arguments)",
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
    $stdout = ($process.StandardOutput.ReadToEnd()) -replace "`0", ''
    $stderr = ($process.StandardError.ReadToEnd()) -replace "`0", ''
    $process.WaitForExit()
    $exitCode = $process.ExitCode

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

function Find-ReportFile {
    param(
        [string]$Root,
        [string]$Name
    )

    if (-not (Test-Path -LiteralPath $Root)) {
        return ''
    }

    $file = Get-ChildItem -LiteralPath $Root -Recurse -Filter $Name -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($file) {
        return $file.FullName
    }

    return ''
}

function Write-HandoffReport {
    param(
        [string]$FinalStatus,
        [string]$DomainCutoverReport,
        [string]$WaitReport,
        [string]$AcceptanceReport,
        [string]$CleanupStatus,
        [string]$Message
    )

    $reportPath = Join-Path $script:reportDir 'HOSTING_HANDOFF_COMPLETE.md'
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('# So Do Van Phuc Hosting Handoff Complete') | Out-Null
    $lines.Add('') | Out-Null
    $lines.Add("- Final status: $FinalStatus") | Out-Null
    $lines.Add("- Domain: https://$Domain") | Out-Null
    $lines.Add("- Generated: $((Get-Date).ToString('s'))") | Out-Null
    $lines.Add("- Release root: $script:releaseRoot") | Out-Null
    $lines.Add("- Report folder: $script:reportDir") | Out-Null
    $lines.Add("- Wait step: $(if ($SkipWait) { 'skipped' } else { 'enabled' })") | Out-Null
    $lines.Add("- Write workflow smoke: $(if ($IncludeWriteWorkflow) { 'enabled' } else { 'disabled' })") | Out-Null
    $lines.Add("- Browser smoke: $(if ($SkipBrowserSmoke) { 'skipped' } else { 'enabled' })") | Out-Null
    $lines.Add("- Cleanup configured artifacts: $CleanupStatus") | Out-Null
    if ($ExpectedIp) {
        $lines.Add("- Expected IP: $ExpectedIp") | Out-Null
    }
    if ($DomainCutoverReport) {
        $lines.Add("- Domain cutover report: $DomainCutoverReport") | Out-Null
    }
    if ($WaitReport) {
        $lines.Add("- Wait report: $WaitReport") | Out-Null
    }
    if ($AcceptanceReport) {
        $lines.Add("- Acceptance report: $AcceptanceReport") | Out-Null
    }
    if ($Message) {
        $lines.Add("- Message: $Message") | Out-Null
    }
    $lines.Add('') | Out-Null
    $lines.Add('| Step | Status | Exit Code | Duration | Log |') | Out-Null
    $lines.Add('| --- | --- | ---: | ---: | --- |') | Out-Null
    foreach ($result in $script:results) {
        $lines.Add((ConvertTo-MarkdownTableLine $result)) | Out-Null
    }
    $lines.Add('') | Out-Null
    if ($FinalStatus -eq 'PASS') {
        $lines.Add('Ready for handoff. Wait gate and acceptance report passed.') | Out-Null
    } else {
        $lines.Add('Do not hand over. Open the referenced log/report first.') | Out-Null
    }

    Set-Content -LiteralPath $reportPath -Encoding UTF8 -Value $lines
    return $reportPath
}

$appRoot = Find-AppRoot $scriptDir
$script:releaseRoot = Resolve-ReleaseRoot $appRoot
$script:reportDir = New-HandoffOutputDir $OutputDir $appRoot $script:releaseRoot
$script:results = New-Object System.Collections.Generic.List[object]
$script:hasFailure = $false

$domainCutoverScript = Resolve-ToolPath 'domain-cutover-report-vanphuc.ps1' $script:releaseRoot $appRoot
$waitScript = Resolve-ToolPath 'wait-vanphuc-hosting-ready.ps1' $script:releaseRoot $appRoot
$acceptanceScript = Resolve-ToolPath 'acceptance-report-vanphuc-hosting.ps1' $script:releaseRoot $appRoot
$cleanupScript = Resolve-ToolPath 'cleanup-real-upload-artifacts.ps1' $script:releaseRoot $appRoot

$cutoverOutputDir = Join-Path $script:reportDir 'domain-cutover'
$waitReportRoot = Join-Path $script:reportDir 'wait'
$acceptanceOutputDir = Join-Path $script:reportDir 'acceptance'
$cleanupStatus = if ($CleanupConfiguredArtifacts) { 'requested' } else { 'not requested' }
$domainCutoverReport = ''
$waitReport = ''
$acceptanceReport = ''

try {
    $cutoverArgs = @('-Domain', $Domain, '-OutputDir', $cutoverOutputDir)
    if ($ExpectedIp) {
        $cutoverArgs += @('-ExpectedIp', $ExpectedIp)
    }

    Invoke-LoggedPowerShellStep `
        -Name 'Domain DNS/SSL cutover report' `
        -LogName '01-domain-cutover-report.log' `
        -ScriptPath $domainCutoverScript `
        -Arguments $cutoverArgs

    $domainCutoverReport = Join-Path $cutoverOutputDir 'DOMAIN_CUTOVER_REPORT.md'
    if (-not (Test-Path -LiteralPath $domainCutoverReport)) {
        throw "Domain cutover report was not written: $domainCutoverReport"
    }

    if (-not $SkipWait) {
        $waitArgs = @(
            '-Domain', $Domain,
            '-TimeoutMinutes', [string]$WaitTimeoutMinutes,
            '-IntervalSeconds', [string]$WaitIntervalSeconds,
            '-ReportRoot', $waitReportRoot
        )
        if ($ExpectedIp) {
            $waitArgs += @('-ExpectedIp', $ExpectedIp)
        }
        if ($WaitMaxAttempts -gt 0) {
            $waitArgs += @('-MaxAttempts', [string]$WaitMaxAttempts)
        }
        if ($IncludeWriteWorkflow) {
            $waitArgs += '-IncludeWriteWorkflow'
        }
        if ($SkipBrowserSmoke) {
            $waitArgs += '-SkipBrowserSmoke'
        }

        Invoke-LoggedPowerShellStep `
            -Name 'Wait for hosting readiness' `
            -LogName '02-wait-hosting-ready.log' `
            -ScriptPath $waitScript `
            -Arguments $waitArgs

        $waitReport = Find-ReportFile -Root $waitReportRoot -Name 'HOSTING_WAIT_REPORT.md'
    }

    if (-not $script:hasFailure) {
        $acceptanceArgs = @('-Domain', $Domain, '-OutputDir', $acceptanceOutputDir)
        if ($ExpectedIp) {
            $acceptanceArgs += @('-ExpectedIp', $ExpectedIp)
        }
        if ($IncludeWriteWorkflow) {
            $acceptanceArgs += '-IncludeWriteWorkflow'
        }
        if ($SkipBrowserSmoke) {
            $acceptanceArgs += '-SkipBrowserSmoke'
        }

        Invoke-LoggedPowerShellStep `
            -Name 'Final acceptance report' `
            -LogName '03-acceptance-report.log' `
            -ScriptPath $acceptanceScript `
            -Arguments $acceptanceArgs

        $acceptanceReport = Join-Path $acceptanceOutputDir 'ACCEPTANCE_REPORT.md'
        if (-not (Test-Path -LiteralPath $acceptanceReport)) {
            throw "Acceptance report was not written: $acceptanceReport"
        }

        $acceptanceText = Get-Content -LiteralPath $acceptanceReport -Raw
        if (-not $acceptanceText.Contains('- Final status: PASS')) {
            throw "Acceptance report is not PASS: $acceptanceReport"
        }
    }

    if (-not $script:hasFailure -and $CleanupConfiguredArtifacts) {
        $cleanupArgs = @('-ReleasePath', $script:releaseRoot, '-ConfirmUploadedAndAccepted')
        Invoke-LoggedPowerShellStep `
            -Name 'Clean local configured upload artifacts' `
            -LogName '04-cleanup-configured-artifacts.log' `
            -ScriptPath $cleanupScript `
            -Arguments $cleanupArgs
        $cleanupStatus = 'completed'
    } elseif (-not $CleanupConfiguredArtifacts) {
        $cleanupStatus = 'not requested'
    }

    $finalStatus = if ($script:hasFailure) { 'FAIL' } else { 'PASS' }
    $reportPath = Write-HandoffReport -FinalStatus $finalStatus -DomainCutoverReport $domainCutoverReport -WaitReport $waitReport -AcceptanceReport $acceptanceReport -CleanupStatus $cleanupStatus -Message ''
    Write-Host ''
    Write-Host "Hosting handoff autopilot report:"
    Write-Host $reportPath

    if ($finalStatus -ne 'PASS') {
        throw "Hosting handoff autopilot failed. See report: $reportPath"
    }

    Write-Host ''
    Write-Host "Hosting handoff autopilot passed for https://$Domain"
} catch {
    $reportPath = Write-HandoffReport -FinalStatus 'FAIL' -DomainCutoverReport $domainCutoverReport -WaitReport $waitReport -AcceptanceReport $acceptanceReport -CleanupStatus $cleanupStatus -Message $_.Exception.Message
    Write-Host ''
    Write-Host "Hosting handoff autopilot report:"
    Write-Host $reportPath
    throw
}
