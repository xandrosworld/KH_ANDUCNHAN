param(
    [string]$ReleasePath = '',
    [string]$PhpPath = '',
    [switch]$RequirePhp,
    [switch]$KeepWorkDir
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Resolve-DefaultReleasePath {
    $scriptParent = Split-Path -Parent $scriptDir
    if (Test-Path -LiteralPath (Join-Path $scriptParent 'CHECKSUMS-SHA256.txt')) {
        return $scriptParent
    }

    $releaseRoot = Join-Path $root 'release'
    if (Test-Path -LiteralPath $releaseRoot) {
        $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
            Where-Object { $_.Name -like 'sodovanphuc-*' } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($latest) {
            return $latest.FullName
        }
    }

    throw 'Could not infer release path. Run this from release/tools or pass -ReleasePath.'
}

function Resolve-ToolPath {
    param(
        [string]$ToolName,
        [string]$ReleaseRoot
    )

    $sameFolder = Join-Path $scriptDir $ToolName
    if (Test-Path -LiteralPath $sameFolder) {
        return $sameFolder
    }

    $releaseTool = Join-Path $ReleaseRoot "tools\$ToolName"
    if (Test-Path -LiteralPath $releaseTool) {
        return $releaseTool
    }

    $sourceTool = Join-Path $root "deploy\$ToolName"
    if (Test-Path -LiteralPath $sourceTool) {
        return $sourceTool
    }

    throw "Could not locate $ToolName."
}

function Assert-Path {
    param(
        [string]$Path,
        [string]$Message
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw $Message
    }
    Write-Check $Message
}

function Copy-DirectoryContents {
    param(
        [string]$Source,
        [string]$Destination
    )

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$realUploadPreparer = Resolve-ToolPath 'prepare-real-upload.ps1' $release

Assert-Path (Join-Path $release 'full\public_html\index.html') 'source release full/public_html exists'
Assert-Path (Join-Path $release 'sodovanphuc-full-public_html.zip') 'source release base upload zip exists'
Assert-Path $realUploadPreparer 'real upload preparation wrapper exists'

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("svp-configured-zip-dryrun-" + [guid]::NewGuid().ToString('N'))
$tempRelease = Join-Path $tempRoot 'release'
$configuredZip = Join-Path $tempRelease 'sodovanphuc-configured-public_html.zip'
$configuredChecksum = Join-Path $tempRelease 'sodovanphuc-configured-public_html.sha256.txt'
$realUploadManifest = Join-Path $tempRelease 'REAL_UPLOAD_READY.md'

try {
    New-Item -ItemType Directory -Force -Path $tempRelease | Out-Null
    Copy-DirectoryContents $release $tempRelease
    Write-Check 'temporary release copy created for configured zip dry-run'

    $previousDbPass = [Environment]::GetEnvironmentVariable('SVP_DB_PASS', 'Process')
    $previousAdminPassword = [Environment]::GetEnvironmentVariable('SVP_ADMIN_PASSWORD', 'Process')
    try {
        [Environment]::SetEnvironmentVariable('SVP_DB_PASS', 'svp_configured_zip_dryrun', 'Process')
        [Environment]::SetEnvironmentVariable('SVP_ADMIN_PASSWORD', 'ConfiguredZipDryRun!234', 'Process')

        $prepareArgs = @{
            ReleasePath = $tempRelease
            DbHost = '127.0.0.1'
            DbName = 'svp_configured_zip_dryrun'
            DbUser = 'svp_configured_zip_dryrun'
            Force = $true
        }
        if ($PhpPath) {
            $prepareArgs.PhpPath = $PhpPath
        }

        & $realUploadPreparer @prepareArgs
    } finally {
        [Environment]::SetEnvironmentVariable('SVP_DB_PASS', $previousDbPass, 'Process')
        [Environment]::SetEnvironmentVariable('SVP_ADMIN_PASSWORD', $previousAdminPassword, 'Process')
    }

    Assert-Path $configuredZip 'configured dry-run zip exists in temp release'
    Assert-Path $configuredChecksum 'configured dry-run checksum exists in temp release'
    Assert-Path $realUploadManifest 'real upload manifest exists in temp release'

    $manifestText = Get-Content -LiteralPath $realUploadManifest -Raw
    if ($manifestText -match 'svp_configured_zip_dryrun|ConfiguredZipDryRun') {
        throw 'Real upload manifest leaked dry-run credential values.'
    }
    Write-Check 'real upload manifest does not contain dry-run credential values'
} finally {
    if (-not $KeepWorkDir) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Kept configured zip dry-run work directory: $tempRoot"
    }
}

Write-Host ''
Write-Host 'Configured upload zip dry-run passed without touching the real release folder.'
