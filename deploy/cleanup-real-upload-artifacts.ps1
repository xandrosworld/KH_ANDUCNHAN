param(
    [string]$ReleasePath = '',
    [switch]$ConfirmUploadedAndAccepted,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptParent = Split-Path -Parent $scriptDir

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Resolve-DefaultReleasePath {
    if (Test-Path -LiteralPath (Join-Path $scriptParent 'CHECKSUMS-SHA256.txt')) {
        return $scriptParent
    }

    $appRoot = Split-Path -Parent $scriptDir
    $releaseRoot = Join-Path $appRoot 'release'
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

function Assert-PathInsideRelease {
    param(
        [string]$ReleaseRoot,
        [string]$TargetPath
    )

    $trimChars = @([char][System.IO.Path]::DirectorySeparatorChar, [char][System.IO.Path]::AltDirectorySeparatorChar)
    $resolvedRelease = [System.IO.Path]::GetFullPath($ReleaseRoot).TrimEnd($trimChars)
    $resolvedTarget = [System.IO.Path]::GetFullPath($TargetPath)
    $releasePrefix = $resolvedRelease + [System.IO.Path]::DirectorySeparatorChar

    if (-not $resolvedTarget.StartsWith($releasePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to clean path outside release root: $resolvedTarget"
    }
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path

$artifactNames = @(
    'sodovanphuc-configured-public_html.zip',
    'sodovanphuc-configured-public_html.sha256.txt',
    'configured-public_html',
    'REAL_UPLOAD_READY.md'
)

$artifacts = @()
foreach ($artifactName in $artifactNames) {
    $artifactPath = Join-Path $release $artifactName
    Assert-PathInsideRelease -ReleaseRoot $release -TargetPath $artifactPath
    if (Test-Path -LiteralPath $artifactPath) {
        $artifacts += $artifactPath
    }
}

if ($artifacts.Count -eq 0) {
    Write-Check 'no local configured upload artifacts found'
    Write-Host "Release is clean: $release"
    return
}

Write-Host 'Local configured upload artifacts found:'
$artifacts | ForEach-Object { Write-Host "- $_" }

if ($DryRun) {
    Write-Host ''
    Write-Host 'Dry run only. Nothing was deleted.'
    return
}

if (-not $ConfirmUploadedAndAccepted) {
    throw 'Cleanup refused. Upload the configured zip, run the acceptance report to PASS, then rerun with -ConfirmUploadedAndAccepted.'
}

foreach ($artifact in $artifacts) {
    $item = Get-Item -LiteralPath $artifact -Force
    if ($item.PSIsContainer) {
        Remove-Item -LiteralPath $artifact -Recurse -Force
    } else {
        Remove-Item -LiteralPath $artifact -Force
    }
    Write-Check "removed local configured upload artifact: $artifact"
}

Write-Host ''
Write-Host "Local configured upload artifacts cleaned for release: $release"
