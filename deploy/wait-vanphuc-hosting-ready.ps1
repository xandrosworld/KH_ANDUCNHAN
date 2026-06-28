param(
    [string]$Domain = 'sodovanphuc.vn',
    [string]$ExpectedIp = '',
    [int]$TimeoutMinutes = 90,
    [int]$IntervalSeconds = 60,
    [int]$MaxAttempts = 0,
    [switch]$IncludeWriteWorkflow,
    [switch]$SkipBrowserSmoke,
    [switch]$DiagnosticOnly,
    [string]$ReportRoot = ''
)

$ErrorActionPreference = 'Stop'

if ($TimeoutMinutes -lt 1) {
    throw 'TimeoutMinutes must be at least 1.'
}
if ($IntervalSeconds -lt 10) {
    throw 'IntervalSeconds must be at least 10 to avoid hammering the hosting provider.'
}
if ($MaxAttempts -lt 0) {
    throw 'MaxAttempts must be 0 for unlimited attempts until timeout, or a positive number.'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$diagnoseScript = Join-Path $scriptDir 'diagnose-vanphuc-hosting.ps1'
$readyScript = Join-Path $scriptDir 'ready-vanphuc-hosting.ps1'

if (-not (Test-Path -LiteralPath $diagnoseScript)) {
    throw "Missing diagnostic script: $diagnoseScript"
}
if (-not $DiagnosticOnly -and -not (Test-Path -LiteralPath $readyScript)) {
    throw "Missing ready gate script: $readyScript"
}

if (-not $ReportRoot) {
    $baseDir = Split-Path -Parent $scriptDir
    $ReportRoot = Join-Path $baseDir 'hosting-wait-reports'
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportDir = Join-Path $ReportRoot "wait-$timestamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$started = Get-Date
$deadline = $started.AddMinutes($TimeoutMinutes)
$mode = if ($DiagnosticOnly) { 'diagnostic-only' } else { 'full-ready-gate' }
$attemptRows = New-Object System.Collections.Generic.List[object]

function New-ScriptArguments {
    if ($DiagnosticOnly) {
        $scriptArguments = @('-Domain', $Domain, '-RequireReady')
        if ($ExpectedIp) {
            $scriptArguments += @('-ExpectedIp', $ExpectedIp)
        }
        return $scriptArguments
    }

    $scriptArguments = @('-Domain', $Domain)
    if ($ExpectedIp) {
        $scriptArguments += @('-ExpectedIp', $ExpectedIp)
    }
    if ($IncludeWriteWorkflow) {
        $scriptArguments += '-IncludeWriteWorkflow'
    }
    if ($SkipBrowserSmoke) {
        $scriptArguments += '-SkipBrowserSmoke'
    }
    return $scriptArguments
}

function Invoke-Attempt {
    param(
        [int]$Attempt,
        [string]$LogPath
    )

    $targetScript = if ($DiagnosticOnly) { $diagnoseScript } else { $readyScript }
    $scriptArgs = New-ScriptArguments
    $processArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $targetScript) + $scriptArgs
    $escapedArgs = $processArgs | ForEach-Object {
        $arg = [string]$_
        if ($arg -match '[\s"]') {
            '"' + ($arg -replace '"', '\"') + '"'
        } else {
            $arg
        }
    }

    Set-Content -LiteralPath $LogPath -Encoding UTF8 -Value @(
        "Command: powershell.exe $($escapedArgs -join ' ')",
        ''
    )

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

    if ($stdout) {
        Write-Host $stdout
        Add-Content -LiteralPath $LogPath -Encoding UTF8 -Value $stdout
    }
    if ($stderr) {
        Write-Host $stderr
        Add-Content -LiteralPath $LogPath -Encoding UTF8 -Value $stderr
    }

    return [int]$process.ExitCode
}

function Write-WaitReport {
    param(
        [string]$FinalStatus,
        [string]$LastMessage
    )

    $reportPath = Join-Path $reportDir 'HOSTING_WAIT_REPORT.md'
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('# So Do Van Phuc Hosting Wait Report') | Out-Null
    $lines.Add('') | Out-Null
    $lines.Add("- Final status: $FinalStatus") | Out-Null
    $lines.Add("- Domain: https://$Domain") | Out-Null
    $lines.Add("- Mode: $mode") | Out-Null
    $lines.Add("- Started: $($started.ToString('s'))") | Out-Null
    $lines.Add("- Ended: $((Get-Date).ToString('s'))") | Out-Null
    $lines.Add("- Timeout minutes: $TimeoutMinutes") | Out-Null
    $lines.Add("- Interval seconds: $IntervalSeconds") | Out-Null
    $lines.Add("- Max attempts: $MaxAttempts") | Out-Null
    $lines.Add("- Include write workflow: $([bool]$IncludeWriteWorkflow)") | Out-Null
    $lines.Add("- Skip browser smoke: $([bool]$SkipBrowserSmoke)") | Out-Null
    if ($ExpectedIp) {
        $lines.Add("- Expected IP: $ExpectedIp") | Out-Null
    }
    if ($LastMessage) {
        $lines.Add("- Last message: $LastMessage") | Out-Null
    }
    $lines.Add('') | Out-Null
    $lines.Add('| Attempt | Status | Exit Code | Started | Ended | Log |') | Out-Null
    $lines.Add('| ---: | --- | ---: | --- | --- | --- |') | Out-Null

    foreach ($row in $attemptRows) {
        $relativeLog = Split-Path -Leaf $row.Log
        $lines.Add("| $($row.Attempt) | $($row.Status) | $($row.ExitCode) | $($row.Started) | $($row.Ended) | $relativeLog |") | Out-Null
    }

    Set-Content -LiteralPath $reportPath -Encoding UTF8 -Value $lines
    return $reportPath
}

Write-Host ''
Write-Host "Waiting for So Do Van Phuc hosting readiness: https://$Domain"
Write-Host "Mode: $mode"
Write-Host "Timeout: $TimeoutMinutes minute(s); interval: $IntervalSeconds second(s)"
if ($MaxAttempts -gt 0) {
    Write-Host "Max attempts: $MaxAttempts"
}
Write-Host "Report folder: $reportDir"

$attempt = 0
while ((Get-Date) -lt $deadline) {
    $attempt++
    $attemptStarted = Get-Date
    $logPath = Join-Path $reportDir ("attempt-{0:D2}.log" -f $attempt)

    Write-Host ''
    Write-Host "== Attempt $attempt at $($attemptStarted.ToString('s')) =="

    $exitCode = Invoke-Attempt -Attempt $attempt -LogPath $logPath
    $attemptEnded = Get-Date
    $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $attemptRows.Add([pscustomobject]@{
        Attempt = $attempt
        Status = $status
        ExitCode = $exitCode
        Started = $attemptStarted.ToString('s')
        Ended = $attemptEnded.ToString('s')
        Log = $logPath
    }) | Out-Null

    if ($exitCode -eq 0) {
        $reportPath = Write-WaitReport -FinalStatus 'PASS' -LastMessage "Readiness passed on attempt $attempt."
        Write-Host ''
        Write-Host "Hosting readiness passed on attempt $attempt."
        Write-Host "Report: $reportPath"
        exit 0
    }

    if ($MaxAttempts -gt 0 -and $attempt -ge $MaxAttempts) {
        break
    }

    $remaining = [math]::Ceiling(($deadline - (Get-Date)).TotalSeconds)
    if ($remaining -le 0) {
        break
    }

    $sleepSeconds = [math]::Min($IntervalSeconds, $remaining)
    Write-Host ''
    Write-Host "Not ready yet. Sleeping $sleepSeconds second(s), then retrying..."
    Start-Sleep -Seconds $sleepSeconds
}

$failureReport = Write-WaitReport -FinalStatus 'FAIL' -LastMessage 'Timed out before hosting readiness passed.'
Write-Host ''
Write-Host "Hosting readiness did not pass before timeout."
Write-Host "Report: $failureReport"
exit 1
