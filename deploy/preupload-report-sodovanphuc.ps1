param(
    [string]$ReleasePath = '',
    [string]$Domain = 'sodovanphuc.vn',
    [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$script:results = New-Object System.Collections.Generic.List[object]
$script:hasFailure = $false

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

    return $null
}

function Resolve-DefaultReleasePath {
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

    throw 'Could not infer release path. Run from app/deploy, release/tools, or pass -ReleasePath.'
}

function Resolve-ToolPath {
    param(
        [string]$ToolName,
        [string]$ReleaseRoot,
        [string]$AppRoot
    )

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

function New-ReportOutputDir {
    param(
        [string]$RequestedOutputDir,
        [string]$AppRoot,
        [string]$ReleaseRoot
    )

    if ($RequestedOutputDir) {
        $path = $RequestedOutputDir
    } elseif ($AppRoot) {
        $path = Join-Path $AppRoot "qa\preupload\$timestamp"
    } else {
        $path = Join-Path $ReleaseRoot "preupload-reports\$timestamp"
    }

    New-Item -ItemType Directory -Force -Path $path | Out-Null
    return (Resolve-Path -LiteralPath $path).Path
}

function Invoke-LoggedProcess {
    param(
        [string]$Name,
        [string]$LogName,
        [string]$FileName,
        [string[]]$Arguments,
        [string]$WorkingDirectory = '',
        [switch]$AllowFailure
    )

    $logPath = Join-Path $script:reportDir $LogName
    $started = Get-Date
    $status = 'PASS'
    $exitCode = 0
    $message = ''

    Write-Host ''
    Write-Host "== $Name =="

    Set-Content -LiteralPath $logPath -Encoding UTF8 -Value @(
        "Command: $FileName $($Arguments -join ' ')",
        "Started: $($started.ToString('s'))",
        ''
    )

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FileName
    $escapedArgs = $Arguments | ForEach-Object {
        $arg = [string]$_
        if ($arg -match '[\s"]') {
            '"' + ($arg -replace '"', '\"') + '"'
        } else {
            $arg
        }
    }
    $startInfo.Arguments = ($escapedArgs -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true
    if ($WorkingDirectory) {
        $startInfo.WorkingDirectory = $WorkingDirectory
    }

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
        if ($AllowFailure) {
            $status = 'EXPECTED_FAIL'
            $message = "exit code $exitCode"
        } else {
            $status = 'FAIL'
            $message = "exit code $exitCode"
            $script:hasFailure = $true
        }
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

function Invoke-LoggedPowerShell {
    param(
        [string]$Name,
        [string]$LogName,
        [string]$ScriptPath,
        [string[]]$Arguments = @(),
        [switch]$AllowFailure
    )

    Invoke-LoggedProcess `
        -Name $Name `
        -LogName $LogName `
        -FileName 'powershell.exe' `
        -Arguments (@('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments) `
        -AllowFailure:$AllowFailure
}

function Resolve-NpmCommand {
    param([string]$AppRoot)

    $candidates = @()
    if ($env:ProgramFiles) {
        $candidates += Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
    }
    if ($env:APPDATA) {
        $candidates += Join-Path $env:APPDATA 'npm\npm.cmd'
    }

    $commands = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue
    foreach ($command in $commands) {
        $candidates += $command.Source
    }

    foreach ($candidate in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (-not (Test-Path -LiteralPath $candidate)) {
            continue
        }
        $resolved = (Resolve-Path -LiteralPath $candidate).Path
        if ($AppRoot -and $resolved.StartsWith($AppRoot, [StringComparison]::OrdinalIgnoreCase)) {
            continue
        }
        return $resolved
    }

    throw 'Could not resolve a system npm.cmd outside the app folder.'
}

function ConvertTo-MarkdownTableLine {
    param([pscustomobject]$Result)

    $logName = Split-Path -Leaf $Result.Log
    return "| $($Result.Step) | $($Result.Status) | $($Result.ExitCode) | $($Result.DurationSeconds)s | $logName |"
}

function Assert-ZipManifest {
    param([string]$ReleaseRoot)

    $logPath = Join-Path $script:reportDir '06-zip-manifest.log'
    $started = Get-Date
    $status = 'PASS'
    $exitCode = 0
    $message = ''

    try {
        $zipPath = Join-Path $ReleaseRoot 'sodovanphuc-full-public_html.zip'
        if (-not (Test-Path -LiteralPath $zipPath)) {
            throw "Missing full zip: $zipPath"
        }

        $zipList = tar -tf $zipPath
        $required = @(
            'public_html/index.html',
            'public_html/.htaccess',
            'public_html/backend/api/index.php',
            'public_html/backend/config/config.example.php',
            'public_html/backend/sql/schema.sql',
            'public_html/backend/sql/002_add_property_video_url.sql',
            'public_html/backend/sql/003_add_property_social_links.sql',
            'public_html/backend/sql/004_users_banners_blog.sql',
            'public_html/backend/sql/005_chat_messages.sql',
            'public_html/backend/sql/006_property_likes.sql',
            'public_html/backend/sql/007_add_coordinates.sql',
            'public_html/backend/sql/007_add_expiry_notified.sql',
            'public_html/backend/sql/008_bank_transfers.sql',
            'public_html/backend/sql/009_property_image_unique.sql',
            'public_html/backend/sql/seed.sql',
            'public_html/backend/sql/sodovanphuc_import_all.sql',
            'public_html/backend/sql/sodovanphuc_schema.sql',
            'public_html/backend/sql/sodovanphuc_seed.sql',
            'public_html/backend/sql/sodovanphuc_verify.sql',
            'public_html/backend/sql/database_verify.sql',
            'public_html/backend/uploads/.htaccess'
        )
        $forbidden = @(
            'public_html/.env',
            'public_html/.env.local',
            'public_html/.git/',
            'public_html/.github/',
            'public_html/node_modules/',
            'public_html/src/',
            'public_html/package.json',
            'public_html/package-lock.json',
            'public_html/pnpm-lock.yaml',
            'public_html/yarn.lock',
            'public_html/tsconfig.json',
            'public_html/vite.config.ts',
            'public_html/backend/config/config.php',
            'public_html/backend/.env',
            'public_html/backend/api/debug_test.php',
            'public_html/backend/composer.json',
            'public_html/backend/composer.lock',
            'public_html/backend/uploads/music/',
            'public_html/music/',
            'public_html/tools/',
            'public_html/POST_UPLOAD_CHECKLIST.md',
            'public_html/UPLOAD_THIS_PACKAGE.txt',
            'public_html/REAL_UPLOAD_READY.md'
        )

        $lines = New-Object System.Collections.Generic.List[string]
        $lines.Add("Manifest: $zipPath") | Out-Null
        foreach ($item in $required) {
            if (-not ($zipList -contains $item)) {
                throw "Missing required zip item: $item"
            }
            $lines.Add("[OK] required: $item") | Out-Null
        }
        foreach ($item in $forbidden) {
            if ($zipList -contains $item -or ($zipList | Where-Object { $_.StartsWith($item) })) {
                throw "Forbidden zip item exists: $item"
            }
            $lines.Add("[OK] absent: $item") | Out-Null
        }
        foreach ($suffix in @('.map', '.ts', '.tsx')) {
            $badEntries = @($zipList | Where-Object {
                $_.StartsWith('public_html/') -and $_.EndsWith($suffix, [System.StringComparison]::OrdinalIgnoreCase)
            })
            if ($badEntries.Count -gt 0) {
                throw "Forbidden development/source artifact suffix exists in zip: $suffix"
            }
            $lines.Add("[OK] absent suffix in public_html: $suffix") | Out-Null
        }

        Set-Content -LiteralPath $logPath -Encoding UTF8 -Value $lines
        Write-Host ($lines -join [Environment]::NewLine)
    } catch {
        $status = 'FAIL'
        $exitCode = 1
        $message = $_.Exception.Message
        $script:hasFailure = $true
        Set-Content -LiteralPath $logPath -Encoding UTF8 -Value $message
        Write-Host $message
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
        Step = 'Full zip manifest safety'
        Status = $status
        ExitCode = $exitCode
        DurationSeconds = $duration
        Log = $logPath
        Message = $message
    }) | Out-Null
}

$appRoot = Find-AppRoot $scriptDir
if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath $appRoot
}
$releaseRoot = (Resolve-Path -LiteralPath $ReleasePath).Path
$script:reportDir = New-ReportOutputDir $OutputDir $appRoot $releaseRoot

$packageVerifier = Resolve-ToolPath 'verify-release-package.ps1' $releaseRoot $appRoot
$uploadDrill = Resolve-ToolPath 'test-release-upload-drill.ps1' $releaseRoot $appRoot
$configuredZipDryRun = Resolve-ToolPath 'test-configured-upload-zip-dryrun.ps1' $releaseRoot $appRoot
$phpRuntimeSmoke = Resolve-ToolPath 'test-php-runtime.ps1' $releaseRoot $appRoot
$diagnoseScript = Resolve-ToolPath 'diagnose-vanphuc-hosting.ps1' $releaseRoot $appRoot

Invoke-LoggedPowerShell `
    -Name 'Release package self-check' `
    -LogName '01-release-package.log' `
    -ScriptPath $packageVerifier `
    -Arguments @('-ReleasePath', $releaseRoot)

Invoke-LoggedPowerShell `
    -Name 'Exact upload zip drill' `
    -LogName '02-upload-drill.log' `
    -ScriptPath $uploadDrill `
    -Arguments @('-ReleasePath', $releaseRoot, '-RequirePhp')

Invoke-LoggedPowerShell `
    -Name 'Configured upload zip dry-run' `
    -LogName '03-configured-upload-zip-dryrun.log' `
    -ScriptPath $configuredZipDryRun `
    -Arguments @('-ReleasePath', $releaseRoot, '-RequirePhp')

Invoke-LoggedPowerShell `
    -Name 'Release PHP runtime strict smoke' `
    -LogName '04-php-runtime.log' `
    -ScriptPath $phpRuntimeSmoke `
    -Arguments @('-RequirePhp')

if ($appRoot) {
    $npmCommand = Resolve-NpmCommand $appRoot
    Invoke-LoggedProcess `
        -Name 'npm audit low severity' `
        -LogName '05-npm-audit.log' `
        -FileName $npmCommand `
        -Arguments @('audit', '--audit-level=low') `
        -WorkingDirectory $appRoot
}

Assert-ZipManifest $releaseRoot

Invoke-LoggedPowerShell `
    -Name 'Live domain diagnostic snapshot' `
    -LogName '07-hosting-diagnostic-snapshot.log' `
    -ScriptPath $diagnoseScript `
    -Arguments @('-Domain', $Domain, '-RequireReady') `
    -AllowFailure

$reportPath = Join-Path $script:reportDir 'PREUPLOAD_REPORT.md'
$finalStatus = if ($script:hasFailure) { 'FAIL' } else { 'PASS' }
$fullZip = Join-Path $releaseRoot 'sodovanphuc-full-public_html.zip'
$uploadPointer = Join-Path $releaseRoot 'UPLOAD_THIS_PACKAGE.txt'

$reportLines = New-Object System.Collections.Generic.List[string]
$reportLines.Add('# So Do Van Phuc Pre-Upload Report') | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add("- Final status: $finalStatus") | Out-Null
$reportLines.Add("- Generated: $((Get-Date).ToString('s'))") | Out-Null
$reportLines.Add("- Domain: https://$Domain") | Out-Null
$reportLines.Add("- Release root: $releaseRoot") | Out-Null
$reportLines.Add("- Upload zip: $fullZip") | Out-Null
$reportLines.Add("- Upload pointer: $uploadPointer") | Out-Null
$reportLines.Add("- Report folder: $script:reportDir") | Out-Null
$reportLines.Add('') | Out-Null
$reportLines.Add('| Step | Status | Exit Code | Duration | Log |') | Out-Null
$reportLines.Add('| --- | --- | ---: | ---: | --- |') | Out-Null
foreach ($result in $script:results) {
    $reportLines.Add((ConvertTo-MarkdownTableLine $result)) | Out-Null
}
$reportLines.Add('') | Out-Null
$reportLines.Add('Notes:') | Out-Null
$reportLines.Add('- EXPECTED_FAIL on live domain diagnostic is acceptable before upload/SSL/config/DB are done.') | Out-Null
$reportLines.Add('- Do not hand over after upload until `acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow` passes.') | Out-Null

Set-Content -LiteralPath $reportPath -Encoding UTF8 -Value $reportLines

Write-Host ''
Write-Host "Pre-upload report written:"
Write-Host $reportPath

if ($script:hasFailure) {
    throw "Pre-upload report failed. See report: $reportPath"
}

Write-Host ''
Write-Host "Pre-upload checks passed for $fullZip"
