param(
    [string]$ConfigPath = 'backend/config/config.php',
    [switch]$AllowTemplate
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $deployDir

if (-not [System.IO.Path]::IsPathRooted($ConfigPath)) {
    $ConfigPath = Join-Path $appRoot $ConfigPath
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}

$content = Get-Content -LiteralPath $ConfigPath -Raw

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
}

function Assert-Contains {
    param(
        [string]$Needle,
        [string]$Message
    )
    if (-not $content.Contains($Needle)) {
        throw $Message
    }
    Write-Check $Message
}

function Get-PhpStringConstant {
    param([string]$Name)
    $escaped = [regex]::Escape($Name)
    $match = [regex]::Match($content, "define\('$escaped',\s*'((?:\\'|[^'])*)'\);")
    if (-not $match.Success) {
        throw "Missing PHP string constant: $Name"
    }
    return $match.Groups[1].Value -replace "\\'", "'"
}

function Assert-NoPlaceholder {
    param(
        [string]$Value,
        [string]$Name
    )
    if ($Value -match 'replace_with|REPLACE_WITH|your_password|your_|changeme|example') {
        throw "$Name still contains a placeholder value."
    }
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "$Name must not be empty."
    }
    Write-Check "$Name is filled"
}

function Test-AdminPasswordHash {
    param([string]$Hash)

    if ($Hash -match '^\$2[aby]\$\d{2}\$' -and $Hash -notmatch 'REPLACE_WITH') {
        Write-Check 'ADMIN_PASSWORD_HASH is a bcrypt hash'
        return
    }

    $match = [regex]::Match($Hash, '^pbkdf2_sha256\$(\d+)\$([a-fA-F0-9]{32,})\$([a-fA-F0-9]{64})$')
    if ($match.Success) {
        $iterations = [int]$match.Groups[1].Value
        if ($iterations -lt 210000) {
            throw 'ADMIN_PASSWORD_HASH PBKDF2 iterations must be at least 210000.'
        }
        Write-Check 'ADMIN_PASSWORD_HASH is a PBKDF2-SHA256 hash'
        return
    }

    throw 'ADMIN_PASSWORD_HASH must be a real bcrypt or pbkdf2_sha256 hash.'
}

$legacyPattern = @(
    'Global' + 'Forumz',
    'global' + 'forumz',
    'sodovanphuc\.vn',
    'api\.sodovanphuc\.vn',
    'tenmien' + 'cuakhach',
    'api\.tenmien' + 'cuakhach',
    'contact@sodovanphuc\.vn',
    'your' + '-domain',
    'api\.domain\.com'
) -join '|'

if ($content -match $legacyPattern) {
    throw 'Config contains legacy domain/placeholder text.'
}
Write-Check 'config has no legacy domain/placeholders'

Assert-Contains "define('APP_ENV', 'production');" 'APP_ENV is production'
Assert-Contains "define('BASE_URL', 'https://sodovanphuc.vn/backend');" 'BASE_URL is same-domain backend URL'
Assert-Contains "define('FRONTEND_URL', 'https://sodovanphuc.vn');" 'FRONTEND_URL is production domain'
Assert-Contains "define('DB_CONNECT_TIMEOUT', 3);" 'DB_CONNECT_TIMEOUT keeps healthcheck fail-fast'
Assert-Contains "'https://sodovanphuc.vn'" 'CORS includes production domain'
Assert-Contains "'https://www.sodovanphuc.vn'" 'CORS includes www production domain'
Assert-Contains "define('ENABLE_LEGACY_AUTO_EXPIRE', false);" 'legacy auto-expire is disabled'
Assert-Contains "define('UPLOAD_MAX_IMAGES', 41);" 'property upload image limit is configured'
Assert-Contains "define('UPLOAD_MAX_VIDEOS', 1);" 'property upload video limit is configured'
Assert-Contains "define('UPLOAD_AVATAR_MAX_SIZE', 5 * 1024 * 1024);" 'avatar upload limit is configured'

if (-not $AllowTemplate) {
    $dbHost = Get-PhpStringConstant 'DB_HOST'
    $dbName = Get-PhpStringConstant 'DB_NAME'
    $dbUser = Get-PhpStringConstant 'DB_USER'
    $dbPass = Get-PhpStringConstant 'DB_PASS'
    $adminHash = Get-PhpStringConstant 'ADMIN_PASSWORD_HASH'
    $jwtSecret = Get-PhpStringConstant 'JWT_SECRET'
    $mailFrom = Get-PhpStringConstant 'MAIL_FROM'
    $adminEmail = Get-PhpStringConstant 'ADMIN_EMAIL'
    $aiGeminiKey = Get-PhpStringConstant 'AI_GEMINI_KEY'

    Assert-NoPlaceholder $dbHost 'DB_HOST'
    Assert-NoPlaceholder $dbName 'DB_NAME'
    Assert-NoPlaceholder $dbUser 'DB_USER'
    Assert-NoPlaceholder $dbPass 'DB_PASS'
    Assert-NoPlaceholder $mailFrom 'MAIL_FROM'
    Assert-NoPlaceholder $adminEmail 'ADMIN_EMAIL'

    Test-AdminPasswordHash $adminHash

    if ($jwtSecret -notmatch '^[a-fA-F0-9]{64}$') {
        throw 'JWT_SECRET must be 64 hex characters.'
    }
    Write-Check 'JWT_SECRET is 64 hex characters'

    if (-not [string]::IsNullOrWhiteSpace($aiGeminiKey)) {
        if ($aiGeminiKey -match 'replace_with|REPLACE_WITH|your_|changeme|example') {
            throw 'AI_GEMINI_KEY contains a placeholder value.'
        }
        Write-Check 'AI_GEMINI_KEY is configured as a backend-only secret'
    } else {
        Write-Check 'AI_GEMINI_KEY is blank; backend AI proxy will fall back safely'
    }
} else {
    Assert-Contains "define('DB_PASS', 'replace_with_database_password');" 'template keeps DB password placeholder'
    Assert-Contains 'define(''ADMIN_PASSWORD_HASH'', ''$2y$10$REPLACE_WITH_REAL_BCRYPT_HASH'');' 'template keeps bcrypt placeholder'
    Assert-Contains "define('JWT_SECRET', 'replace_with_64_char_random_hex_string');" 'template keeps JWT placeholder'
    Assert-Contains "define('AI_GEMINI_KEY', '');" 'template keeps AI key backend-only and blank by default'
}

Write-Host ''
Write-Host "Config verification passed: $ConfigPath"
