param(
    [string]$ReleasePath,
    [string]$DbHost = 'localhost',
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPass,
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
    [switch]$PromptSecrets,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Assert-NoControlCharacters {
    param(
        [string]$Text,
        [string]$Message
    )

    for ($i = 0; $i -lt $Text.Length; $i++) {
        $code = [int][char]$Text[$i]
        if ($code -lt 32 -and $code -notin @(10, 13)) {
            throw "$Message contains control character code $code at index $i."
        }
    }
    Write-Check $Message
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

function Assert-ZipEntry {
    param(
        [string[]]$ZipList,
        [string]$Entry,
        [string]$Message
    )
    if (-not ($ZipList -contains $Entry)) {
        throw "Configured upload zip is missing required item: $Entry"
    }
    Write-Check $Message
}

function Assert-ZipEntryAbsent {
    param(
        [string[]]$ZipList,
        [string]$Entry,
        [string]$Message
    )
    if ($ZipList -contains $Entry -or ($ZipList | Where-Object { $_.StartsWith($Entry) })) {
        throw "Configured upload zip contains forbidden item: $Entry"
    }
    Write-Check $Message
}

function Resolve-ValueFromEnv {
    param(
        [string]$Value,
        [string]$EnvName,
        [string]$Name,
        [bool]$Required
    )

    if (-not [string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $envValue = [Environment]::GetEnvironmentVariable($EnvName, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        Write-Check "$Name loaded from env:$EnvName"
        return $envValue
    }

    if ($Required) {
        throw "Provide -$Name or set `$env:$EnvName."
    }

    return $Value
}

function Convert-SecureStringToPlainText {
    param([securestring]$Value)

    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Resolve-SecretValue {
    param(
        [string]$Value,
        [string]$EnvName,
        [string]$Name,
        [bool]$Required,
        [string]$Prompt
    )

    if (-not [string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $envValue = [Environment]::GetEnvironmentVariable($EnvName, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        Write-Check "$Name loaded from env:$EnvName"
        return $envValue
    }

    if ($PromptSecrets -and $Required) {
        $secureValue = Read-Host -Prompt $Prompt -AsSecureString
        $plainValue = Convert-SecureStringToPlainText $secureValue
        if ([string]::IsNullOrWhiteSpace($plainValue)) {
            throw "$Name must not be empty."
        }
        Write-Check "$Name read from secure prompt"
        return $plainValue
    }

    if ($Required) {
        throw "Provide -$Name, set `$env:$EnvName, or pass -PromptSecrets."
    }

    return $Value
}

$DbName = Resolve-ValueFromEnv $DbName 'SVP_DB_NAME' 'DbName' $true
$DbUser = Resolve-ValueFromEnv $DbUser 'SVP_DB_USER' 'DbUser' $true
$DbPass = Resolve-SecretValue $DbPass 'SVP_DB_PASS' 'DbPass' $true 'Mat Bao database password'

if (-not $AdminPasswordHash -and -not $AdminPassword) {
    $AdminPasswordHash = Resolve-ValueFromEnv $AdminPasswordHash 'SVP_ADMIN_PASSWORD_HASH' 'AdminPasswordHash' $false
}

if (-not $AdminPasswordHash -and -not $AdminPassword) {
    $AdminPassword = Resolve-SecretValue $AdminPassword 'SVP_ADMIN_PASSWORD' 'AdminPassword' $true 'Admin password used to create config.php'
}

if (-not $JwtSecret) {
    $JwtSecret = Resolve-ValueFromEnv $JwtSecret 'SVP_JWT_SECRET' 'JwtSecret' $false
}

if (-not $SmtpPass) {
    $SmtpPass = Resolve-SecretValue $SmtpPass 'SVP_SMTP_PASS' 'SmtpPass' $false ''
}

if (-not $AiGeminiKey) {
    $AiGeminiKey = Resolve-SecretValue $AiGeminiKey 'SVP_AI_GEMINI_KEY' 'AiGeminiKey' $false ''
}

if (-not $AdminPassword -and -not $AdminPasswordHash) {
    throw 'Provide either -AdminPassword or -AdminPasswordHash.'
}

if ($AdminPassword -and $AdminPasswordHash) {
    throw 'Provide only one of -AdminPassword or -AdminPasswordHash, not both.'
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$verifyPackage = Join-Path $scriptDir 'verify-release-package.ps1'
$builder = Join-Path $scriptDir 'build-configured-public-html.ps1'
$configuredZip = Join-Path $release 'sodovanphuc-configured-public_html.zip'
$checksumPath = Join-Path $release 'sodovanphuc-configured-public_html.sha256.txt'
$manifestPath = Join-Path $release 'REAL_UPLOAD_READY.md'

Assert-Path (Join-Path $release 'sodovanphuc-full-public_html.zip') 'base upload zip exists'
Assert-Path $verifyPackage 'release package verifier exists'
Assert-Path $builder 'configured upload zip builder exists'

& $verifyPackage -ReleasePath $release
Write-Check 'base release package self-check passed'

$builderArgs = @{
    ReleasePath = $release
    DbHost = $DbHost
    DbName = $DbName
    DbUser = $DbUser
    DbPass = $DbPass
    AdminUsername = $AdminUsername
    MailFrom = $MailFrom
    AdminEmail = $AdminEmail
    SmtpHost = $SmtpHost
    SmtpPort = $SmtpPort
    SmtpUser = $SmtpUser
    SmtpPass = $SmtpPass
    SmtpSecure = $SmtpSecure
    AiGeminiKey = $AiGeminiKey
}

if ($AdminPassword) {
    $builderArgs.AdminPassword = $AdminPassword
}
if ($AdminPasswordHash) {
    $builderArgs.AdminPasswordHash = $AdminPasswordHash
}
if ($JwtSecret) {
    $builderArgs.JwtSecret = $JwtSecret
}
if ($PhpPath) {
    $builderArgs.PhpPath = $PhpPath
}
if ($Force) {
    $builderArgs.Force = $true
}

& $builder @builderArgs

Assert-Path $configuredZip 'configured upload zip exists'
Assert-Path $checksumPath 'configured upload checksum exists'

$zipList = tar -tf $configuredZip
Assert-ZipEntry $zipList 'public_html/index.html' 'configured upload contains frontend index'
Assert-ZipEntry $zipList 'public_html/.htaccess' 'configured upload contains frontend htaccess'
Assert-ZipEntry $zipList 'public_html/backend/api/index.php' 'configured upload contains API router'
Assert-ZipEntry $zipList 'public_html/backend/config/config.php' 'configured upload contains real config.php'
foreach ($requiredSqlEntry in @(
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
    Assert-ZipEntry $zipList $requiredSqlEntry "configured upload contains $requiredSqlEntry"
}

Assert-ZipEntryAbsent $zipList 'public_html/backend/api/debug_test.php' 'configured upload excludes debug script'
Assert-ZipEntryAbsent $zipList 'public_html/backend/uploads/music/' 'configured upload excludes legacy backend music'
Assert-ZipEntryAbsent $zipList 'public_html/music/' 'configured upload excludes legacy frontend music'
Assert-ZipEntryAbsent $zipList 'public_html/tools/' 'configured upload excludes release tools'
Assert-ZipEntryAbsent $zipList 'public_html/POST_UPLOAD_CHECKLIST.md' 'configured upload excludes release checklist'
Assert-ZipEntryAbsent $zipList 'public_html/UPLOAD_THIS_PACKAGE.txt' 'configured upload excludes upload pointer'
Assert-ZipEntryAbsent $zipList 'public_html/REAL_UPLOAD_READY.md' 'configured upload excludes real upload manifest'

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $configuredZip).Hash.ToLowerInvariant()
$checksumLine = Get-Content -LiteralPath $checksumPath -Raw
if (-not $checksumLine.Contains($hash)) {
    throw 'Configured upload checksum file does not match the zip hash.'
}
Write-Check 'configured upload checksum matches zip'

$zipSize = (Get-Item -LiteralPath $configuredZip).Length
$generatedAt = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
$manifest = @"
# So Do Van Phuc Real Upload Ready

- Final status: READY_FOR_UPLOAD
- Generated: $generatedAt
- Domain: https://sodovanphuc.vn
- Release root: $release
- Upload this zip: $configuredZip
- SHA256: $hash
- Size: $zipSize bytes

This configured zip contains real backend/config/config.php secrets. Keep it local/private and upload only to the real Mat Bao hosting account.
If AI description/chat features should call Gemini through the backend proxy, set `SVP_AI_GEMINI_KEY` before generating this package. The key is written only into backend/config/config.php, never into frontend JS or reports.

## Upload

1. In Mat Bao File Manager, extract this zip into the domain document root so it creates public_html/.
2. Confirm SSL is enabled for sodovanphuc.vn and www.sodovanphuc.vn.
3. Import `public_html/backend/sql/sodovanphuc_import_all.sql` in phpMyAdmin. This installs the full database: base app schema, required migrations, base seed, SVP schema, SVP seed and verification in the correct order. Base and SVP seed rows use `ON DUPLICATE KEY UPDATE`, so reruns refresh default rows instead of duplicating them.
4. If phpMyAdmin has trouble with the bundled file, import the split-file fallback in this order:
   - public_html/backend/sql/schema.sql
   - public_html/backend/sql/002_add_property_video_url.sql
   - public_html/backend/sql/003_add_property_social_links.sql
   - public_html/backend/sql/004_users_banners_blog.sql
   - public_html/backend/sql/005_chat_messages.sql
   - public_html/backend/sql/006_property_likes.sql
   - public_html/backend/sql/007_add_coordinates.sql
   - public_html/backend/sql/007_add_expiry_notified.sql
   - public_html/backend/sql/008_bank_transfers.sql
   - public_html/backend/sql/009_property_image_unique.sql
   - public_html/backend/sql/seed.sql
   - public_html/backend/sql/sodovanphuc_schema.sql
   - public_html/backend/sql/sodovanphuc_seed.sql
   - public_html/backend/sql/sodovanphuc_verify.sql
   - public_html/backend/sql/database_verify.sql
5. The SQL verifier rows must show PASS or OK.
6. Open https://sodovanphuc.vn/api/svp/health; required final status is ready.
7. Run final acceptance from this release folder. To also verify admin API/JWT auth and the browser login form, set the admin password only as a temporary environment variable:

~~~powershell
`$env:SVP_LIVE_ADMIN_USERNAME = "$AdminUsername"
`$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
powershell -ExecutionPolicy Bypass -File tools/acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow
Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue
~~~

Do not hand over until ACCEPTANCE_REPORT.md says Final status: PASS.
"@

Assert-NoControlCharacters $manifest 'real upload manifest has no control characters'
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding UTF8
Write-Check 'real upload manifest written without credential values'

Write-Host ''
Write-Host 'Real configured upload package is ready:'
Write-Host $configuredZip
Write-Host "SHA256: $hash"
Write-Host "Manifest: $manifestPath"
