param(
    [string]$ReleasePath,
    [string]$DbHost = 'localhost',
    [Parameter(Mandatory = $true)][string]$DbName,
    [Parameter(Mandatory = $true)][string]$DbUser,
    [Parameter(Mandatory = $true)][string]$DbPass,
    [string]$AdminUsername = 'admin',
    [string]$AdminPassword,
    [string]$AdminPasswordHash,
    [string]$JwtSecret,
    [string]$MailFrom = 'contact@sodovanphuc.vn',
    [string]$AdminEmail = 'contact@sodovanphuc.vn',
    [string]$SmtpHost = 'localhost',
    [int]$SmtpPort = 25,
    [string]$SmtpUser = 'contact@sodovanphuc.vn',
    [string]$SmtpPass = '',
    [string]$SmtpSecure = '',
    [string]$AiGeminiKey = '',
    [string]$PhpPath = '',
    [switch]$Force,
    [switch]$KeepWorkDir,
    [switch]$SkipDrill
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Resolve-DefaultReleasePath {
    $scriptParent = Split-Path -Parent $scriptDir
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

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$sourcePublicHtml = Join-Path $release 'full\public_html'
$configuredRoot = Join-Path $release 'configured-public_html'
$configuredPublicHtml = Join-Path $configuredRoot 'public_html'
$zipPath = Join-Path $release 'sodovanphuc-configured-public_html.zip'
$checksumPath = Join-Path $release 'sodovanphuc-configured-public_html.sha256.txt'
$generator = Join-Path $scriptDir 'new-hosting-config.ps1'
$uploadDrill = Join-Path $scriptDir 'test-release-upload-drill.ps1'

Assert-Path $sourcePublicHtml 'base full/public_html stage exists'
Assert-Path $generator 'hosting config generator exists'
if (-not $SkipDrill) {
    Assert-Path $uploadDrill 'exact upload zip drill exists'
}

if ((Test-Path -LiteralPath $zipPath) -and -not $Force) {
    throw "Configured zip already exists: $zipPath. Use -Force to overwrite."
}
if ((Test-Path -LiteralPath $configuredRoot) -and -not $Force) {
    throw "Configured work directory already exists: $configuredRoot. Use -Force to overwrite."
}

Remove-Item -LiteralPath $configuredRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $checksumPath -Force -ErrorAction SilentlyContinue

try {
    New-Item -ItemType Directory -Force -Path $configuredRoot | Out-Null
    Copy-Item -LiteralPath $sourcePublicHtml -Destination $configuredRoot -Recurse -Force
    Assert-Path $configuredPublicHtml 'configured public_html work directory created'

    $configOutput = Join-Path $configuredPublicHtml 'backend\config\config.php'
    & $generator `
        -DbHost $DbHost `
        -DbName $DbName `
        -DbUser $DbUser `
        -DbPass $DbPass `
        -AdminUsername $AdminUsername `
        -AdminPassword $AdminPassword `
        -AdminPasswordHash $AdminPasswordHash `
        -JwtSecret $JwtSecret `
        -MailFrom $MailFrom `
        -AdminEmail $AdminEmail `
        -SmtpHost $SmtpHost `
        -SmtpPort $SmtpPort `
        -SmtpUser $SmtpUser `
        -SmtpPass $SmtpPass `
        -SmtpSecure $SmtpSecure `
        -AiGeminiKey $AiGeminiKey `
        -OutputPath $configOutput `
        -Force

    Assert-Path $configOutput 'configured backend/config/config.php exists'

    Compress-Archive -LiteralPath $configuredPublicHtml -DestinationPath $zipPath -Force
    Assert-Path $zipPath 'configured public_html zip created'

    $zipList = tar -tf $zipPath
    foreach ($required in @(
        'public_html/index.html',
        'public_html/.htaccess',
        'public_html/backend/api/index.php',
        'public_html/backend/config/config.php',
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
        'public_html/backend/sql/database_verify.sql'
    )) {
        if (-not ($zipList -contains $required)) {
            throw "Configured zip is missing required item: $required"
        }
    }
    Write-Check 'configured zip contains app, backend and real config.php'

    foreach ($forbidden in @(
        'public_html/backend/api/debug_test.php',
        'public_html/backend/uploads/music/',
        'public_html/music/',
        'public_html/tools/',
        'public_html/POST_UPLOAD_CHECKLIST.md',
        'public_html/REAL_UPLOAD_READY.md'
    )) {
        if ($zipList -contains $forbidden -or ($zipList | Where-Object { $_.StartsWith($forbidden) })) {
            throw "Configured zip contains forbidden item: $forbidden"
        }
    }
    Write-Check 'configured zip excludes debug, legacy media and release-only tools'

    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
    Set-Content -LiteralPath $checksumPath -Value ("{0}  {1}" -f $hash, (Split-Path -Leaf $zipPath)) -Encoding ASCII
    Write-Check 'configured zip checksum created'

    if ($SkipDrill) {
        Write-Host '[SKIP] configured zip exact upload drill skipped by -SkipDrill'
    } else {
        $drillArgs = @{
            ReleasePath = $release
            ZipPath = $zipPath
            ExpectConfigInZip = $true
            RequirePhp = $true
        }
        if ($PhpPath) {
            $drillArgs.PhpPath = $PhpPath
        }
        if ($AdminPassword) {
            $drillArgs.AdminUsernameForUploadDrill = $AdminUsername
            $drillArgs.AdminPasswordForUploadDrill = $AdminPassword
        }

        & $uploadDrill @drillArgs
        Write-Check 'configured zip exact upload drill passed'
    }
} finally {
    if (-not $KeepWorkDir) {
        Remove-Item -LiteralPath $configuredRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Write-Host 'Configured upload zip created. This file contains real secrets; do not commit or share it.'
Write-Host $zipPath
