param(
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
    [string]$OutputPath = 'backend/config/config.php',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $deployDir

function ConvertTo-PhpString {
    param([string]$Value)
    return ($Value -replace '\\', '\\' -replace "'", "\\'")
}

function New-HexSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    } finally {
        $rng.Dispose()
    }
    return (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
}

function New-BcryptHash {
    param([string]$Password)
    $php = Get-Command php -ErrorAction SilentlyContinue
    if (-not $php) {
        throw 'PHP CLI was not found. Pass -AdminPasswordHash with a bcrypt hash, or run this script on a machine with php in PATH.'
    }
    $hash = & $php.Source -r 'echo password_hash($argv[1], PASSWORD_BCRYPT);' -- $Password
    if ($LASTEXITCODE -ne 0 -or -not $hash) {
        throw 'Failed to generate ADMIN_PASSWORD_HASH with PHP CLI.'
    }
    return [string]$hash
}

function ConvertTo-Hex {
    param([byte[]]$Bytes)
    return (($Bytes | ForEach-Object { $_.ToString('x2') }) -join '')
}

function New-Pbkdf2Hash {
    param(
        [string]$Password,
        [int]$Iterations = 310000
    )

    $salt = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($salt)
    } finally {
        $rng.Dispose()
    }

    $derive = [System.Security.Cryptography.Rfc2898DeriveBytes]::new(
        $Password,
        $salt,
        $Iterations,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try {
        $hash = $derive.GetBytes(32)
    } finally {
        $derive.Dispose()
    }

    return "pbkdf2_sha256`$$Iterations`$$(ConvertTo-Hex $salt)`$$(ConvertTo-Hex $hash)"
}

function New-AdminPasswordHash {
    param([string]$Password)

    $php = Get-Command php -ErrorAction SilentlyContinue
    if ($php) {
        return New-BcryptHash -Password $Password
    }

    return New-Pbkdf2Hash -Password $Password
}

function Assert-StrongAdminPassword {
    param([string]$Password)

    if ([string]::IsNullOrWhiteSpace($Password)) {
        throw 'Admin password must not be empty.'
    }

    if ($Password.Length -lt 14) {
        throw 'Admin password must be at least 14 characters.'
    }

    $classes = 0
    if ($Password -cmatch '[a-z]') { $classes++ }
    if ($Password -cmatch '[A-Z]') { $classes++ }
    if ($Password -match '\d') { $classes++ }
    if ($Password -match '[^A-Za-z0-9]') { $classes++ }

    if ($classes -lt 3) {
        throw 'Admin password must include at least 3 of these groups: lowercase letters, uppercase letters, numbers, symbols.'
    }

    foreach ($weakWord in @('password', 'matkhau', 'admin', 'vanphuc', 'sodovanphuc', '123456', 'qwerty')) {
        if ($Password -match [regex]::Escape($weakWord)) {
            throw "Admin password contains weak word: $weakWord"
        }
    }
}

if (-not $AdminPasswordHash) {
    if (-not $AdminPassword) {
        throw 'Provide either -AdminPasswordHash or -AdminPassword.'
    }
    Assert-StrongAdminPassword -Password $AdminPassword
    $AdminPasswordHash = New-AdminPasswordHash -Password $AdminPassword
}

if ($AdminPasswordHash -notmatch '^\$2[aby]\$\d{2}\$' -and $AdminPasswordHash -notmatch '^pbkdf2_sha256\$\d+\$[a-fA-F0-9]{32,}\$[a-fA-F0-9]{64}$') {
    throw 'Admin password hash must be bcrypt or pbkdf2_sha256.'
}

if (-not $JwtSecret) {
    $JwtSecret = New-HexSecret
}

if ($JwtSecret -notmatch '^[a-fA-F0-9]{64}$') {
    throw 'JWT secret must be 64 hex characters.'
}

if (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $appRoot $OutputPath
}

if ((Test-Path -LiteralPath $OutputPath) -and -not $Force) {
    throw "Output config already exists: $OutputPath. Use -Force to overwrite."
}

$templatePath = Join-Path $appRoot 'backend/config/config.example.php'
$content = Get-Content -LiteralPath $templatePath -Raw

$replacements = @{
    DB_HOST = $DbHost
    DB_NAME = $DbName
    DB_USER = $DbUser
    DB_PASS = $DbPass
    ADMIN_USERNAME = $AdminUsername
    ADMIN_PASSWORD_HASH = $AdminPasswordHash
    JWT_SECRET = $JwtSecret
    MAIL_FROM = $MailFrom
    ADMIN_EMAIL = $AdminEmail
    SMTP_HOST = $SmtpHost
    SMTP_USER = $SmtpUser
    SMTP_PASS = $SmtpPass
    SMTP_SECURE = $SmtpSecure
    AI_GEMINI_KEY = $AiGeminiKey
}

foreach ($name in $replacements.Keys) {
    $value = ConvertTo-PhpString ([string]$replacements[$name])
    $pattern = "define\('$([regex]::Escape($name))',\s*'((?:\\'|[^'])*)'\);"
    $replacement = "define('$name', '$value');"
    $content = [regex]::Replace($content, $pattern, { param($match) $replacement })
}

$content = [regex]::Replace($content, "define\('SMTP_PORT',\s*\d+\);", "define('SMTP_PORT', $SmtpPort);")

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, $content, $utf8NoBom)

& (Join-Path $deployDir 'verify-hosting-config.ps1') -ConfigPath $OutputPath

Write-Host ''
Write-Host "Hosting config created: $OutputPath"
Write-Host 'Do not commit or include this file in release zips.'
