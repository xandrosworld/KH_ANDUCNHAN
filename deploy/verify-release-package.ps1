param(
    [string]$ReleasePath
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

function Assert-TextContains {
    param(
        [string]$Text,
        [string]$Needle,
        [string]$Message
    )
    if (-not $Text.Contains($Needle)) {
        throw $Message
    }
    Write-Check $Message
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

function Assert-NoUtf8BomBytes {
    param(
        [byte[]]$Bytes,
        [string]$Message
    )

    if ($Bytes.Length -ge 3 -and $Bytes[0] -eq 0xEF -and $Bytes[1] -eq 0xBB -and $Bytes[2] -eq 0xBF) {
        throw "$Message starts with a UTF-8 BOM."
    }
    Write-Check $Message
}

function Assert-TextNeedlesInOrder {
    param(
        [string]$Text,
        [string[]]$Needles,
        [string]$Message
    )

    $position = -1
    foreach ($needle in $Needles) {
        $nextPosition = $Text.IndexOf($needle, $position + 1, [System.StringComparison]::Ordinal)
        if ($nextPosition -lt 0) {
            throw "$Message is missing ordered marker: $needle"
        }
        if ($nextPosition -le $position) {
            throw "$Message has markers out of order: $needle"
        }
        $position = $nextPosition
    }
    Write-Check $Message
}

function Assert-SqlImportBundleText {
    param(
        [string]$Text,
        [string]$MessagePrefix
    )

    Assert-TextContains $Text '-- So Do Van Phuc one-file import bundle.' "$MessagePrefix has one-file import header"
    Assert-TextContains $Text '-- ===== 01 base schema: schema.sql =====' "$MessagePrefix has base schema section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `properties`' "$MessagePrefix contains idempotent base property schema"
    Assert-TextContains $Text 'UNIQUE KEY `uq_property_image_url`' "$MessagePrefix contains property image unique key"
    if ($Text.Contains('DROP TABLE IF EXISTS')) {
        throw "$MessagePrefix must not contain destructive DROP TABLE statements"
    }
    if ($Text -match 'ADD\s+(COLUMN|INDEX|UNIQUE INDEX)\s+IF NOT EXISTS') {
        throw "$MessagePrefix must not contain MariaDB-only ALTER IF NOT EXISTS statements"
    }
    if ($Text -match 'ADD\s+COLUMN[^\r\n;]*\bAFTER\b') {
        throw "$MessagePrefix must not contain fragile AFTER column-order dependencies"
    }
    Assert-TextContains $Text '-- ===== 01b base property video: 002_add_property_video_url.sql =====' "$MessagePrefix has property video migration marker"
    Assert-TextContains $Text "column_name = 'video_url'" "$MessagePrefix contains idempotent property video migration"
    Assert-TextContains $Text '-- ===== 01c base property social links: 003_add_property_social_links.sql =====' "$MessagePrefix has property social migration marker"
    Assert-TextContains $Text "column_name = 'facebook_url'" "$MessagePrefix contains idempotent property social migration"
    Assert-TextContains $Text '-- ===== 02 base users/banners/blog: 004_users_banners_blog.sql =====' "$MessagePrefix has users/banners/blog section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `users`' "$MessagePrefix contains users schema"
    Assert-TextContains $Text '-- ===== 03 base messages: 005_chat_messages.sql =====' "$MessagePrefix has messages section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `messages`' "$MessagePrefix contains messages schema"
    Assert-TextContains $Text '-- ===== 04 base property likes: 006_property_likes.sql =====' "$MessagePrefix has property likes section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `property_likes`' "$MessagePrefix contains property likes schema"
    Assert-TextContains $Text '-- ===== 07 base bank transfers: 008_bank_transfers.sql =====' "$MessagePrefix has bank transfers section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `bank_transfers`' "$MessagePrefix contains bank transfers schema"
    Assert-TextContains $Text '-- ===== 07b base property image uniqueness: 009_property_image_unique.sql =====' "$MessagePrefix has property image uniqueness section marker"
    Assert-TextContains $Text "index_name = 'uq_property_image_url'" "$MessagePrefix contains idempotent property image unique migration"
    Assert-TextContains $Text '-- ===== 08 base seed: seed.sql =====' "$MessagePrefix has base seed section marker"
    Assert-TextContains $Text 'INSERT INTO `properties`' "$MessagePrefix contains base property seed"
    Assert-TextContains $Text '-- ===== 09 SVP schema: sodovanphuc_schema.sql =====' "$MessagePrefix has SVP schema section marker"
    Assert-TextContains $Text 'CREATE TABLE IF NOT EXISTS `svp_properties`' "$MessagePrefix contains property schema"
    Assert-TextContains $Text '-- ===== 10 SVP seed: sodovanphuc_seed.sql =====' "$MessagePrefix has SVP seed section marker"
    Assert-TextContains $Text "('tag_o_to', 'property_tags'" "$MessagePrefix contains core property tag seed"
    Assert-TextContains $Text 'ON DUPLICATE KEY UPDATE' "$MessagePrefix uses idempotent upserts for seed data"
    Assert-TextContains $Text '-- ===== 11 SVP verifier: sodovanphuc_verify.sql =====' "$MessagePrefix has SVP verifier section marker"
    Assert-TextContains $Text "'01_required_tables' AS check_name" "$MessagePrefix contains post-import required table verifier"
    Assert-TextContains $Text '-- ===== 12 full database verifier: database_verify.sql =====' "$MessagePrefix has full database verifier section marker"
    Assert-TextContains $Text "'00_base_tables' AS check_name" "$MessagePrefix contains base table verifier"
    Assert-TextContains $Text "'00_property_media_columns' AS check_name" "$MessagePrefix contains property media/social verifier"
    Assert-TextContains $Text "'00_property_image_unique_key' AS check_name" "$MessagePrefix contains property image unique key verifier"
    Assert-TextNeedlesInOrder $Text @(
        '-- ===== 01 base schema: schema.sql =====',
        'CREATE TABLE IF NOT EXISTS `properties`',
        '-- ===== 01b base property video: 002_add_property_video_url.sql =====',
        "column_name = 'video_url'",
        '-- ===== 01c base property social links: 003_add_property_social_links.sql =====',
        "column_name = 'facebook_url'",
        '-- ===== 02 base users/banners/blog: 004_users_banners_blog.sql =====',
        'CREATE TABLE IF NOT EXISTS `users`',
        '-- ===== 07b base property image uniqueness: 009_property_image_unique.sql =====',
        "index_name = 'uq_property_image_url'",
        '-- ===== 08 base seed: seed.sql =====',
        'INSERT INTO `properties`',
        '-- ===== 09 SVP schema: sodovanphuc_schema.sql =====',
        'CREATE TABLE IF NOT EXISTS `svp_properties`',
        '-- ===== 10 SVP seed: sodovanphuc_seed.sql =====',
        "('tag_o_to', 'property_tags'",
        '-- ===== 11 SVP verifier: sodovanphuc_verify.sql =====',
        "'01_required_tables' AS check_name",
        '-- ===== 12 full database verifier: database_verify.sql =====',
        "'00_base_tables' AS check_name",
        "'00_property_media_columns' AS check_name",
        "'00_property_image_unique_key' AS check_name"
    ) "$MessagePrefix runs base schema, migrations, seeds, SVP schema, SVP seed and verifiers in order"
}

function Get-ZipEntryBytes {
    param(
        [string]$ZipPath,
        [string]$EntryName
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entry = $zip.Entries |
            Where-Object { ($_.FullName -replace '\\', '/') -eq $EntryName } |
            Select-Object -First 1
        if (-not $entry) {
            throw "Missing zip entry: $EntryName"
        }
        $stream = $entry.Open()
        try {
            $memory = New-Object System.IO.MemoryStream
            try {
                $stream.CopyTo($memory)
                return $memory.ToArray()
            } finally {
                $memory.Dispose()
            }
        } finally {
            $stream.Dispose()
        }
    } finally {
        $zip.Dispose()
    }
}

function Get-ZipEntryText {
    param(
        [string]$ZipPath,
        [string]$EntryName
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entry = $zip.Entries |
            Where-Object { ($_.FullName -replace '\\', '/') -eq $EntryName } |
            Select-Object -First 1
        if (-not $entry) {
            throw "Missing zip entry: $EntryName"
        }
        $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
        try {
            return $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
        }
    } finally {
        $zip.Dispose()
    }
}

if (-not $ReleasePath) {
    $ReleasePath = Resolve-DefaultReleasePath
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$checksumPath = Join-Path $release 'CHECKSUMS-SHA256.txt'
$fullZip = Join-Path $release 'sodovanphuc-full-public_html.zip'
$frontendZip = Join-Path $release 'sodovanphuc-frontend.zip'
$backendZip = Join-Path $release 'sodovanphuc-backend.zip'

Assert-Path $checksumPath 'checksum file exists'
Assert-Path $fullZip 'full public_html zip exists'
Assert-Path $frontendZip 'frontend zip exists'
Assert-Path $backendZip 'backend zip exists'
Assert-Path (Join-Path $release 'POST_UPLOAD_CHECKLIST.md') 'post-upload checklist exists'
Assert-Path (Join-Path $release 'RELEASE_NOTES.txt') 'release notes exist'
Assert-Path (Join-Path $release 'UPLOAD_THIS_PACKAGE.txt') 'upload pointer exists'
Assert-Path (Join-Path $release 'tools\new-hosting-config.ps1') 'config generator tool exists'
Assert-Path (Join-Path $release 'tools\verify-hosting-config.ps1') 'config verifier tool exists'
Assert-Path (Join-Path $release 'tools\test-php-runtime.ps1') 'PHP runtime smoke tool exists'
Assert-Path (Join-Path $release 'tools\test-release-upload-drill.ps1') 'exact upload zip drill tool exists'
Assert-Path (Join-Path $release 'tools\test-configured-upload-zip-dryrun.ps1') 'configured upload zip dry-run tool exists'
Assert-Path (Join-Path $release 'tools\build-configured-public-html.ps1') 'configured public_html zip builder tool exists'
Assert-Path (Join-Path $release 'tools\prepare-real-upload.ps1') 'real upload preparation tool exists'
Assert-Path (Join-Path $release 'tools\cleanup-real-upload-artifacts.ps1') 'real upload artifact cleanup tool exists'
Assert-Path (Join-Path $release 'tools\domain-cutover-report-vanphuc.ps1') 'domain cutover report tool exists'
Assert-Path (Join-Path $release 'tools\diagnose-vanphuc-hosting.ps1') 'hosting diagnostic tool exists'
Assert-Path (Join-Path $release 'tools\wait-vanphuc-hosting-ready.ps1') 'hosting readiness watcher tool exists'
Assert-Path (Join-Path $release 'tools\browser-smoke-vanphuc-hosting.ps1') 'hosting browser smoke tool exists'
Assert-Path (Join-Path $release 'tools\smoke-vanphuc-hosting.ps1') 'hosting smoke tool exists'
Assert-Path (Join-Path $release 'tools\ready-vanphuc-hosting.ps1') 'hosting ready gate tool exists'
Assert-Path (Join-Path $release 'tools\complete-vanphuc-hosting-handoff.ps1') 'post-upload handoff autopilot tool exists'
Assert-Path (Join-Path $release 'tools\acceptance-report-vanphuc-hosting.ps1') 'hosting acceptance report tool exists'
Assert-Path (Join-Path $release 'tools\preupload-report-sodovanphuc.ps1') 'pre-upload report tool exists'
Assert-Path (Join-Path $release 'tools\final-prehosting-audit.ps1') 'final pre-hosting audit tool exists'
Assert-Path (Join-Path $release 'tools\run-prehosting-proof.ps1') 'one-command pre-hosting proof tool exists'
Assert-Path (Join-Path $release 'tools\verify-release-package.ps1') 'release package verifier tool exists'

$checksumLines = Get-Content -LiteralPath $checksumPath
foreach ($zipName in @(
    'sodovanphuc-frontend.zip',
    'sodovanphuc-backend.zip',
    'sodovanphuc-full-public_html.zip'
)) {
    $zipPath = Join-Path $release $zipName
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()
    $expectedLine = "{0}  {1}" -f $hash, $zipName
    if ($checksumLines -notcontains $expectedLine) {
        throw "Checksum mismatch or missing line for $zipName"
    }
}
Write-Check 'checksum file matches all zip artifacts'

$zipList = tar -tf $fullZip
foreach ($required in @(
    'public_html/index.html',
    'public_html/.htaccess',
    'public_html/robots.txt',
    'public_html/sitemap.xml',
    'public_html/backend/.htaccess',
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
)) {
    if (-not ($zipList -contains $required)) {
        throw "Full zip is missing required item: $required"
    }
}
Write-Check 'full zip contains required public_html files'

foreach ($forbidden in @(
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
)) {
    if ($zipList -contains $forbidden -or ($zipList | Where-Object { $_.StartsWith($forbidden) })) {
        throw "Full zip contains forbidden item: $forbidden"
    }
}

foreach ($forbiddenSuffix in @('.map', '.ts', '.tsx')) {
    $badEntries = @($zipList | Where-Object {
        $_.StartsWith('public_html/') -and $_.EndsWith($forbiddenSuffix, [System.StringComparison]::OrdinalIgnoreCase)
    })
    if ($badEntries.Count -gt 0) {
        $badEntries | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
        throw "Full zip contains forbidden development/source artifact suffix: $forbiddenSuffix"
    }
}

$frontendTextEntries = @($zipList | Where-Object {
    $_ -eq 'public_html/index.html' -or
    ($_.StartsWith('public_html/assets/') -and $_.EndsWith('.js', [System.StringComparison]::OrdinalIgnoreCase))
})
$forbiddenFrontendSecrets = @(
    'VITE_AI_API_KEY',
    'api.openai.com',
    'generativelanguage.googleapis.com'
)
foreach ($entry in $frontendTextEntries) {
    $entryText = Get-ZipEntryText $fullZip $entry
    foreach ($forbiddenText in $forbiddenFrontendSecrets) {
        if ($entryText.Contains($forbiddenText)) {
            throw "Frontend zip entry $entry contains forbidden public AI key/provider text: $forbiddenText"
        }
    }
}
Write-Check 'frontend zip assets contain no public AI provider key or direct provider endpoint'

Write-Check 'full zip excludes secrets, debug files, legacy media, release-only tools and development artifacts'

$importAllSqlBytes = Get-ZipEntryBytes $fullZip 'public_html/backend/sql/sodovanphuc_import_all.sql'
Assert-NoUtf8BomBytes $importAllSqlBytes 'one-file import SQL in zip has no UTF-8 BOM'
$importAllSql = [System.Text.Encoding]::UTF8.GetString($importAllSqlBytes)
Assert-SqlImportBundleText $importAllSql 'one-file import SQL in zip'

$frontendIndex = Get-ZipEntryText $fullZip 'public_html/index.html'
Assert-TextContains $frontendIndex '<link rel="canonical" href="https://sodovanphuc.vn/"' 'frontend index in zip has production canonical URL'
Assert-TextContains $frontendIndex '<meta property="og:url" content="https://sodovanphuc.vn/"' 'frontend index in zip has production OG URL'
Assert-TextContains $frontendIndex '<meta property="og:image" content="https://sodovanphuc.vn/og-image.jpg"' 'frontend index in zip has absolute production OG image'
Assert-TextContains $frontendIndex '<meta name="twitter:image" content="https://sodovanphuc.vn/og-image.jpg"' 'frontend index in zip has absolute production Twitter image'

$frontendHtaccess = Get-ZipEntryText $fullZip 'public_html/.htaccess'
Assert-TextContains $frontendHtaccess 'https://sodovanphuc.vn%{REQUEST_URI}' 'frontend .htaccess in zip redirects to canonical HTTPS domain'
Assert-TextContains $frontendHtaccess 'RewriteRule ^api(/.*)?$ backend/api/index.php [QSA,L]' 'frontend .htaccess in zip routes same-domain API requests'
Assert-TextContains $frontendHtaccess 'Header always set X-Content-Type-Options "nosniff"' 'frontend .htaccess in zip sets nosniff header'

$backendHtaccess = Get-ZipEntryText $fullZip 'public_html/backend/.htaccess'
Assert-TextContains $backendHtaccess 'RewriteRule ^config(/|$) - [F,L]' 'backend .htaccess in zip blocks config directory'
Assert-TextContains $backendHtaccess 'RewriteRule ^lib(/|$) - [F,L]' 'backend .htaccess in zip blocks lib directory'
Assert-TextContains $backendHtaccess 'RewriteRule ^sql(/|$) - [F,L]' 'backend .htaccess in zip blocks sql directory'
Assert-TextContains $backendHtaccess '<FilesMatch "(^config\.php$|\.sql$|\.env$|composer\.(json|lock)$)">' 'backend .htaccess in zip blocks sensitive file patterns'
Assert-TextContains $backendHtaccess '<IfModule !mod_authz_core.c>' 'backend .htaccess in zip includes Apache 2.2 deny fallback'
Assert-TextContains $backendHtaccess 'Order allow,deny' 'backend .htaccess in zip Apache 2.2 fallback denies sensitive files'
Assert-TextContains $backendHtaccess 'Header always set X-Content-Type-Options "nosniff"' 'backend .htaccess in zip sets nosniff header'

$uploadsHtaccess = Get-ZipEntryText $fullZip 'public_html/backend/uploads/.htaccess'
Assert-TextContains $uploadsHtaccess 'Options -Indexes' 'uploads .htaccess in zip disables directory indexes'
Assert-TextContains $uploadsHtaccess '<IfModule mod_mime.c>' 'uploads .htaccess in zip wraps handler removal for shared hosting'
Assert-TextContains $uploadsHtaccess 'RemoveHandler .php .phtml' 'uploads .htaccess in zip removes script handlers'
Assert-TextContains $uploadsHtaccess 'Require all denied' 'uploads .htaccess in zip blocks executable upload extensions'

$releaseNotes = Get-Content -LiteralPath (Join-Path $release 'RELEASE_NOTES.txt') -Raw
Assert-NoControlCharacters $releaseNotes 'release notes have no control characters'

$checklist = Get-Content -LiteralPath (Join-Path $release 'POST_UPLOAD_CHECKLIST.md') -Raw
Assert-NoControlCharacters $checklist 'post-upload checklist has no control characters'
if (-not $checklist.Contains('tools/verify-release-package.ps1')) {
    throw 'Post-upload checklist does not mention the release package verifier.'
}
if (-not $checklist.Contains('tools/preupload-report-sodovanphuc.ps1')) {
    throw 'Post-upload checklist does not mention the pre-upload report tool.'
}
if (-not $checklist.Contains('tools/final-prehosting-audit.ps1')) {
    throw 'Post-upload checklist does not mention the final pre-hosting audit tool.'
}
if (-not $checklist.Contains('npm run prehost:proof')) {
    throw 'Post-upload checklist does not mention the one-command pre-hosting proof.'
}
if (-not $checklist.Contains('tools/test-php-runtime.ps1')) {
    throw 'Post-upload checklist does not mention the PHP runtime smoke tool.'
}
if (-not $checklist.Contains('tools/test-release-upload-drill.ps1')) {
    throw 'Post-upload checklist does not mention the exact upload zip drill tool.'
}
if (-not $checklist.Contains('tools/test-configured-upload-zip-dryrun.ps1')) {
    throw 'Post-upload checklist does not mention the configured upload zip dry-run tool.'
}
if (-not $checklist.Contains('tools/prepare-real-upload.ps1')) {
    throw 'Post-upload checklist does not mention the real upload preparation tool.'
}
if (-not $checklist.Contains('tools/cleanup-real-upload-artifacts.ps1')) {
    throw 'Post-upload checklist does not mention the real upload artifact cleanup tool.'
}
if (-not $checklist.Contains('tools/domain-cutover-report-vanphuc.ps1')) {
    throw 'Post-upload checklist does not mention the domain cutover report tool.'
}
if (-not $checklist.Contains('DOMAIN_CUTOVER_REPORT.md')) {
    throw 'Post-upload checklist does not mention the domain cutover report.'
}
if (-not $checklist.Contains('REAL_UPLOAD_READY.md')) {
    throw 'Post-upload checklist does not mention the real upload manifest.'
}
if (-not $checklist.Contains('tools/diagnose-vanphuc-hosting.ps1')) {
    throw 'Post-upload checklist does not mention the hosting diagnostic tool.'
}
if (-not $checklist.Contains('tools/wait-vanphuc-hosting-ready.ps1')) {
    throw 'Post-upload checklist does not mention the hosting readiness watcher.'
}
if (-not $checklist.Contains('HOSTING_WAIT_REPORT.md')) {
    throw 'Post-upload checklist does not mention the hosting wait report.'
}
if (-not $checklist.Contains('browser smoke')) {
    throw 'Post-upload checklist does not mention the browser smoke.'
}
if (-not $checklist.Contains('tools/build-configured-public-html.ps1')) {
    throw 'Post-upload checklist does not mention the configured upload zip builder.'
}
if (-not $checklist.Contains('tools/smoke-vanphuc-hosting.ps1')) {
    throw 'Post-upload checklist does not mention the release smoke tool.'
}
if (-not $checklist.Contains('tools/ready-vanphuc-hosting.ps1')) {
    throw 'Post-upload checklist does not mention the final hosting ready gate.'
}
if (-not $checklist.Contains('tools/complete-vanphuc-hosting-handoff.ps1')) {
    throw 'Post-upload checklist does not mention the post-upload handoff autopilot.'
}
if (-not $checklist.Contains('HOSTING_HANDOFF_COMPLETE.md')) {
    throw 'Post-upload checklist does not mention the handoff autopilot report.'
}
if (-not $checklist.Contains('tools/acceptance-report-vanphuc-hosting.ps1')) {
    throw 'Post-upload checklist does not mention the acceptance report gate.'
}
if (-not $checklist.Contains('-IncludeWriteWorkflow')) {
    throw 'Post-upload checklist does not mention the write workflow smoke.'
}
if (-not $checklist.Contains('$env:SVP_LIVE_ADMIN_USERNAME')) {
    throw 'Post-upload checklist does not preserve the live admin username env command.'
}
if (-not $checklist.Contains('$env:SVP_LIVE_ADMIN_PASSWORD')) {
    throw 'Post-upload checklist does not preserve the live admin password env command.'
}
if (-not $checklist.Contains('$env:SVP_DB_PASS')) {
    throw 'Post-upload checklist does not preserve the DB password env command.'
}
if (-not $checklist.Contains('$env:SVP_ADMIN_PASSWORD')) {
    throw 'Post-upload checklist does not preserve the prepare admin password env command.'
}
if (-not $checklist.Contains('ACCEPTANCE_REPORT.md says Final status: PASS')) {
    throw 'Post-upload checklist does not include the final acceptance handoff warning.'
}
Write-Check 'post-upload checklist is usable'

$uploadPointer = Get-Content -LiteralPath (Join-Path $release 'UPLOAD_THIS_PACKAGE.txt') -Raw
Assert-NoControlCharacters $uploadPointer 'upload pointer has no control characters'
if (-not $uploadPointer.Contains('sodovanphuc-full-public_html.zip')) {
    throw 'Upload pointer does not name the base upload zip.'
}
if (-not $uploadPointer.Contains('sodovanphuc-configured-public_html.zip')) {
    throw 'Upload pointer does not name the configured upload zip.'
}
if (-not $uploadPointer.Contains('prepare-real-upload.ps1')) {
    throw 'Upload pointer does not name the real upload preparation tool.'
}
if (-not $uploadPointer.Contains('cleanup-real-upload-artifacts.ps1')) {
    throw 'Upload pointer does not name the real upload artifact cleanup tool.'
}
if (-not $uploadPointer.Contains('domain-cutover-report-vanphuc.ps1')) {
    throw 'Upload pointer does not name the domain cutover report tool.'
}
if (-not $uploadPointer.Contains('REAL_UPLOAD_READY.md')) {
    throw 'Upload pointer does not name the real upload manifest.'
}
if (-not $uploadPointer.Contains('preupload-report-sodovanphuc.ps1')) {
    throw 'Upload pointer does not name the pre-upload report tool.'
}
if (-not $uploadPointer.Contains('wait-vanphuc-hosting-ready.ps1')) {
    throw 'Upload pointer does not name the hosting readiness watcher.'
}
if (-not $uploadPointer.Contains('complete-vanphuc-hosting-handoff.ps1')) {
    throw 'Upload pointer does not name the post-upload handoff autopilot.'
}
if (-not $uploadPointer.Contains('final-prehosting-audit.ps1')) {
    throw 'Upload pointer does not name the final pre-hosting audit tool.'
}
if (-not $uploadPointer.Contains('npm run prehost:proof')) {
    throw 'Upload pointer does not name the one-command pre-hosting proof.'
}
if (-not $uploadPointer.Contains('$env:SVP_DB_PASS')) {
    throw 'Upload pointer does not preserve the DB password env command.'
}
if (-not $uploadPointer.Contains('$env:SVP_ADMIN_PASSWORD')) {
    throw 'Upload pointer does not preserve the prepare admin password env command.'
}
if (-not $uploadPointer.Contains('$env:SVP_LIVE_ADMIN_USERNAME')) {
    throw 'Upload pointer does not preserve the live admin username env command.'
}
if (-not $uploadPointer.Contains('$env:SVP_LIVE_ADMIN_PASSWORD')) {
    throw 'Upload pointer does not preserve the live admin password env command.'
}
if (-not $uploadPointer.Contains('acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow')) {
    throw 'Upload pointer does not name the final acceptance gate.'
}
if (-not $uploadPointer.Contains('Final status: PASS')) {
    throw 'Upload pointer does not block handoff until final report passes.'
}
Write-Check 'upload pointer is usable'

Write-Host ''
Write-Host "Release package verification passed:"
Write-Host $release
