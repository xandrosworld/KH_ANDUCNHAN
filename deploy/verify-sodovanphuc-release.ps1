param(
    [string]$ReleasePath
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $deployDir

function Write-Check {
    param([string]$Message)
    Write-Host "[OK] $Message"
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

function Assert-NoMatch {
    param(
        [string[]]$Targets,
        [string]$Pattern,
        [string]$Message
    )
    $matches = rg -n --hidden --glob "!*.zip" --glob "!*.png" --glob "!*.jpg" --glob "!*.jpeg" --glob "!*.webp" --glob "!*.svg" --glob "!*.ico" $Pattern @Targets 2>$null
    if ($LASTEXITCODE -eq 0) {
        $matches | Select-Object -First 40 | ForEach-Object { Write-Host $_ }
        throw $Message
    }
    if ($LASTEXITCODE -gt 1) {
        throw "Search failed while checking: $Message"
    }
    Write-Check $Message
}

function Assert-Match {
    param(
        [string[]]$Targets,
        [string]$Pattern,
        [string]$Message
    )
    $null = rg -n --hidden $Pattern @Targets 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
    Write-Check $Message
}

function Assert-TextContains {
    param(
        [string]$Path,
        [string]$Needle,
        [string]$Message
    )
    $content = Get-Content -LiteralPath $Path -Raw
    if (-not $content.Contains($Needle)) {
        throw $Message
    }
    Write-Check $Message
}

function Assert-FileHasNoControlCharacters {
    param(
        [string]$Path,
        [string]$Message
    )

    $content = Get-Content -LiteralPath $Path -Raw
    for ($i = 0; $i -lt $content.Length; $i++) {
        $code = [int][char]$content[$i]
        if ($code -lt 32 -and $code -notin @(10, 13)) {
            throw "$Message contains control character code $code at index $i."
        }
    }
    Write-Check $Message
}

function Assert-TextContentContains {
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

function Assert-FileHasNoUtf8Bom {
    param(
        [string]$Path,
        [string]$Message
    )

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
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

function Assert-SqlImportBundleFile {
    param(
        [string]$Path,
        [string]$MessagePrefix
    )

    Assert-FileHasNoUtf8Bom $Path "$MessagePrefix has no UTF-8 BOM"
    $text = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($Path))
    Assert-TextContentContains $text '-- So Do Van Phuc one-file import bundle.' "$MessagePrefix has one-file import header"
    Assert-TextContentContains $text '-- ===== 01 base schema: schema.sql =====' "$MessagePrefix has base schema section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `properties`' "$MessagePrefix contains idempotent base property schema"
    Assert-TextContentContains $text 'UNIQUE KEY `uq_property_image_url`' "$MessagePrefix contains property image unique key"
    if ($text.Contains('DROP TABLE IF EXISTS')) {
        throw "$MessagePrefix must not contain destructive DROP TABLE statements"
    }
    if ($text -match 'ADD\s+(COLUMN|INDEX|UNIQUE INDEX)\s+IF NOT EXISTS') {
        throw "$MessagePrefix must not contain MariaDB-only ALTER IF NOT EXISTS statements"
    }
    if ($text -match 'ADD\s+COLUMN[^\r\n;]*\bAFTER\b') {
        throw "$MessagePrefix must not contain fragile AFTER column-order dependencies"
    }
    Assert-TextContentContains $text '-- ===== 01b base property video: 002_add_property_video_url.sql =====' "$MessagePrefix has property video migration marker"
    Assert-TextContentContains $text "column_name = 'video_url'" "$MessagePrefix contains idempotent property video migration"
    Assert-TextContentContains $text '-- ===== 01c base property social links: 003_add_property_social_links.sql =====' "$MessagePrefix has property social migration marker"
    Assert-TextContentContains $text "column_name = 'facebook_url'" "$MessagePrefix contains idempotent property social migration"
    Assert-TextContentContains $text '-- ===== 02 base users/banners/blog: 004_users_banners_blog.sql =====' "$MessagePrefix has users/banners/blog section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `users`' "$MessagePrefix contains users schema"
    Assert-TextContentContains $text '-- ===== 03 base messages: 005_chat_messages.sql =====' "$MessagePrefix has messages section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `messages`' "$MessagePrefix contains messages schema"
    Assert-TextContentContains $text '-- ===== 04 base property likes: 006_property_likes.sql =====' "$MessagePrefix has property likes section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `property_likes`' "$MessagePrefix contains property likes schema"
    Assert-TextContentContains $text '-- ===== 07 base bank transfers: 008_bank_transfers.sql =====' "$MessagePrefix has bank transfers section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `bank_transfers`' "$MessagePrefix contains bank transfers schema"
    Assert-TextContentContains $text '-- ===== 07b base property image uniqueness: 009_property_image_unique.sql =====' "$MessagePrefix has property image uniqueness section marker"
    Assert-TextContentContains $text "index_name = 'uq_property_image_url'" "$MessagePrefix contains idempotent property image unique migration"
    Assert-TextContentContains $text '-- ===== 08 base seed: seed.sql =====' "$MessagePrefix has base seed section marker"
    Assert-TextContentContains $text 'INSERT INTO `properties`' "$MessagePrefix contains base property seed"
    Assert-TextContentContains $text '-- ===== 09 SVP schema: sodovanphuc_schema.sql =====' "$MessagePrefix has SVP schema section marker"
    Assert-TextContentContains $text 'CREATE TABLE IF NOT EXISTS `svp_properties`' "$MessagePrefix contains property schema"
    Assert-TextContentContains $text '-- ===== 10 SVP seed: sodovanphuc_seed.sql =====' "$MessagePrefix has SVP seed section marker"
    Assert-TextContentContains $text "('tag_o_to', 'property_tags'" "$MessagePrefix contains core property tag seed"
    Assert-TextContentContains $text 'ON DUPLICATE KEY UPDATE' "$MessagePrefix uses idempotent upserts for seed data"
    Assert-TextContentContains $text '-- ===== 11 SVP verifier: sodovanphuc_verify.sql =====' "$MessagePrefix has SVP verifier section marker"
    Assert-TextContentContains $text "'01_required_tables' AS check_name" "$MessagePrefix contains post-import required table verifier"
    Assert-TextContentContains $text '-- ===== 12 full database verifier: database_verify.sql =====' "$MessagePrefix has full database verifier section marker"
    Assert-TextContentContains $text "'00_base_tables' AS check_name" "$MessagePrefix contains base table verifier"
    Assert-TextContentContains $text "'00_property_media_columns' AS check_name" "$MessagePrefix contains property media/social verifier"
    Assert-TextContentContains $text "'00_property_image_unique_key' AS check_name" "$MessagePrefix contains property image unique key verifier"
    Assert-TextNeedlesInOrder $text @(
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

function Get-LatestRelease {
    $releaseRoot = Join-Path $appRoot 'release'
    if (-not (Test-Path -LiteralPath $releaseRoot)) {
        throw "Release root does not exist: $releaseRoot"
    }
    $latest = Get-ChildItem -LiteralPath $releaseRoot -Directory |
        Where-Object { $_.Name -like 'sodovanphuc-*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $latest) {
        throw 'No sodovanphuc release folder found.'
    }
    return $latest.FullName
}

if (-not $ReleasePath) {
    $ReleasePath = Get-LatestRelease
}

$release = (Resolve-Path -LiteralPath $ReleasePath).Path
$frontend = Join-Path $release 'frontend'
$backend = Join-Path $release 'backend'
$full = Join-Path $release 'full\public_html'
$fullBackend = Join-Path $full 'backend'
$tools = Join-Path $release 'tools'

Assert-Path $frontend 'frontend stage exists'
Assert-Path $backend 'backend stage exists'
Assert-Path $full 'full/public_html stage exists'
Assert-Path (Join-Path $release 'sodovanphuc-full-public_html.zip') 'full public_html zip exists'
Assert-Path (Join-Path $release 'sodovanphuc-frontend.zip') 'frontend zip exists'
Assert-Path (Join-Path $release 'sodovanphuc-backend.zip') 'backend zip exists'
Assert-Path (Join-Path $release 'RELEASE_NOTES.txt') 'release notes exist'
Assert-Path (Join-Path $release 'POST_UPLOAD_CHECKLIST.md') 'post-upload checklist exists'
Assert-Path (Join-Path $release 'UPLOAD_THIS_PACKAGE.txt') 'upload pointer exists'
Assert-Path (Join-Path $release 'CHECKSUMS-SHA256.txt') 'SHA256 checksum file exists'
Assert-Path (Join-Path $tools 'new-hosting-config.ps1') 'release tool new-hosting-config.ps1 exists'
Assert-Path (Join-Path $tools 'verify-hosting-config.ps1') 'release tool verify-hosting-config.ps1 exists'
Assert-Path (Join-Path $tools 'test-php-runtime.ps1') 'release tool test-php-runtime.ps1 exists'
Assert-Path (Join-Path $tools 'test-release-upload-drill.ps1') 'release tool test-release-upload-drill.ps1 exists'
Assert-Path (Join-Path $tools 'test-configured-upload-zip-dryrun.ps1') 'release tool test-configured-upload-zip-dryrun.ps1 exists'
Assert-Path (Join-Path $tools 'build-configured-public-html.ps1') 'release tool build-configured-public-html.ps1 exists'
Assert-Path (Join-Path $tools 'prepare-real-upload.ps1') 'release tool prepare-real-upload.ps1 exists'
Assert-Path (Join-Path $tools 'cleanup-real-upload-artifacts.ps1') 'release tool cleanup-real-upload-artifacts.ps1 exists'
Assert-Path (Join-Path $tools 'domain-cutover-report-vanphuc.ps1') 'release tool domain-cutover-report-vanphuc.ps1 exists'
Assert-Path (Join-Path $tools 'diagnose-vanphuc-hosting.ps1') 'release tool diagnose-vanphuc-hosting.ps1 exists'
Assert-Path (Join-Path $tools 'wait-vanphuc-hosting-ready.ps1') 'release tool wait-vanphuc-hosting-ready.ps1 exists'
Assert-Path (Join-Path $tools 'browser-smoke-vanphuc-hosting.ps1') 'release tool browser-smoke-vanphuc-hosting.ps1 exists'
Assert-Path (Join-Path $tools 'smoke-vanphuc-hosting.ps1') 'release tool smoke-vanphuc-hosting.ps1 exists'
Assert-Path (Join-Path $tools 'ready-vanphuc-hosting.ps1') 'release tool ready-vanphuc-hosting.ps1 exists'
Assert-Path (Join-Path $tools 'complete-vanphuc-hosting-handoff.ps1') 'release tool complete-vanphuc-hosting-handoff.ps1 exists'
Assert-Path (Join-Path $tools 'acceptance-report-vanphuc-hosting.ps1') 'release tool acceptance-report-vanphuc-hosting.ps1 exists'
Assert-Path (Join-Path $tools 'preupload-report-sodovanphuc.ps1') 'release tool preupload-report-sodovanphuc.ps1 exists'
Assert-Path (Join-Path $tools 'final-prehosting-audit.ps1') 'release tool final-prehosting-audit.ps1 exists'
Assert-Path (Join-Path $tools 'run-prehosting-proof.ps1') 'release tool run-prehosting-proof.ps1 exists'
Assert-Path (Join-Path $tools 'verify-release-package.ps1') 'release tool verify-release-package.ps1 exists'

Assert-Path (Join-Path $frontend 'index.html') 'frontend index.html exists'
Assert-Path (Join-Path $frontend '.htaccess') 'frontend .htaccess exists'
Assert-Path (Join-Path $frontend 'robots.txt') 'frontend robots.txt exists'
Assert-Path (Join-Path $frontend 'sitemap.xml') 'frontend sitemap.xml exists'
Assert-Path (Join-Path $backend '.htaccess') 'backend .htaccess exists'
Assert-Path (Join-Path $backend 'api\index.php') 'backend api/index.php exists'
Assert-Path (Join-Path $backend 'config\config.example.php') 'backend config example exists'
foreach ($sqlFile in @(
    'schema.sql',
    '002_add_property_video_url.sql',
    '003_add_property_social_links.sql',
    '004_users_banners_blog.sql',
    '005_chat_messages.sql',
    '006_property_likes.sql',
    '007_add_coordinates.sql',
    '007_add_expiry_notified.sql',
    '008_bank_transfers.sql',
    '009_property_image_unique.sql',
    'seed.sql',
    'sodovanphuc_import_all.sql',
    'sodovanphuc_schema.sql',
    'sodovanphuc_seed.sql',
    'sodovanphuc_verify.sql',
    'database_verify.sql'
)) {
    Assert-Path (Join-Path $backend "sql\$sqlFile") "backend SQL $sqlFile exists"
    Assert-Path (Join-Path $fullBackend "sql\$sqlFile") "same-domain SQL $sqlFile exists inside public_html"
}
Assert-Path (Join-Path $backend 'sql\sodovanphuc_schema.sql') 'svp schema exists'
Assert-Path (Join-Path $backend 'sql\sodovanphuc_seed.sql') 'svp seed exists'
Assert-Path (Join-Path $backend 'sql\sodovanphuc_verify.sql') 'svp post-import verifier exists'
Assert-Path (Join-Path $fullBackend 'api\index.php') 'same-domain backend api exists inside public_html'
Assert-SqlImportBundleFile (Join-Path $backend 'sql\sodovanphuc_import_all.sql') 'backend stage one-file import SQL'
Assert-SqlImportBundleFile (Join-Path $fullBackend 'sql\sodovanphuc_import_all.sql') 'same-domain one-file import SQL'

$frontendIndex = Join-Path $frontend 'index.html'
Assert-TextContains $frontendIndex '<link rel="canonical" href="https://sodovanphuc.vn/"' 'frontend index has production canonical URL'
Assert-TextContains $frontendIndex '<meta property="og:url" content="https://sodovanphuc.vn/"' 'frontend index has production OG URL'
Assert-TextContains $frontendIndex '<meta property="og:image" content="https://sodovanphuc.vn/og-image.jpg"' 'frontend index has absolute production OG image'
Assert-TextContains $frontendIndex '<meta name="twitter:image" content="https://sodovanphuc.vn/og-image.jpg"' 'frontend index has absolute production Twitter image'

$backendHtaccess = Join-Path $backend '.htaccess'
Assert-TextContains $backendHtaccess 'Options -Indexes' 'backend .htaccess disables directory indexes'
Assert-TextContains $backendHtaccess 'RewriteRule ^config(/|$) - [F,L]' 'backend .htaccess blocks config directory'
Assert-TextContains $backendHtaccess 'RewriteRule ^lib(/|$) - [F,L]' 'backend .htaccess blocks lib directory'
Assert-TextContains $backendHtaccess 'RewriteRule ^sql(/|$) - [F,L]' 'backend .htaccess blocks sql directory'
Assert-TextContains $backendHtaccess '<FilesMatch "(^config\.php$|\.sql$|\.env$|composer\.(json|lock)$)">' 'backend .htaccess blocks sensitive file patterns'
Assert-TextContains $backendHtaccess '<IfModule !mod_authz_core.c>' 'backend .htaccess includes Apache 2.2 deny fallback'
Assert-TextContains $backendHtaccess 'Order allow,deny' 'backend .htaccess Apache 2.2 fallback denies sensitive files'
Assert-TextContains $backendHtaccess 'Header always set X-Content-Type-Options "nosniff"' 'backend .htaccess sets nosniff header'

$frontendHtaccess = Join-Path $frontend '.htaccess'
Assert-TextContains $frontendHtaccess 'Options -Indexes' 'frontend .htaccess disables directory indexes'
Assert-TextContains $frontendHtaccess 'Header always set X-Content-Type-Options "nosniff"' 'frontend .htaccess sets nosniff header'
Assert-TextContains $frontendHtaccess 'Header always set X-Frame-Options "SAMEORIGIN"' 'frontend .htaccess sets frame protection header'
Assert-TextContains $frontendHtaccess 'Header always set Referrer-Policy "strict-origin-when-cross-origin"' 'frontend .htaccess sets referrer policy'
Assert-TextContains $frontendHtaccess 'https://sodovanphuc.vn%{REQUEST_URI}' 'frontend .htaccess redirects to canonical HTTPS domain'
Assert-TextContains $frontendHtaccess '^www\.sodovanphuc\.vn$' 'frontend .htaccess redirects www to canonical domain'

$uploadsHtaccess = Join-Path $backend 'uploads\.htaccess'
Assert-TextContains $uploadsHtaccess 'Options -Indexes' 'uploads .htaccess disables directory indexes'
Assert-TextContains $uploadsHtaccess '<IfModule mod_mime.c>' 'uploads .htaccess wraps handler removal for shared hosting'
Assert-TextContains $uploadsHtaccess 'RemoveHandler .php .phtml' 'uploads .htaccess removes script handlers'
Assert-TextContains $uploadsHtaccess 'Require all denied' 'uploads .htaccess blocks executable upload extensions'

$postUploadChecklist = Join-Path $release 'POST_UPLOAD_CHECKLIST.md'
Assert-FileHasNoControlCharacters $postUploadChecklist 'post-upload checklist has no control characters'
Assert-TextContains $postUploadChecklist '~~~powershell' 'post-upload checklist has PowerShell command blocks'
Assert-TextContains $postUploadChecklist 'tools/verify-release-package.ps1' 'post-upload checklist mentions release package verifier'
Assert-TextContains $postUploadChecklist 'tools/preupload-report-sodovanphuc.ps1' 'post-upload checklist mentions pre-upload report tool'
Assert-TextContains $postUploadChecklist 'tools/final-prehosting-audit.ps1' 'post-upload checklist mentions final pre-hosting audit tool'
Assert-TextContains $postUploadChecklist 'npm run prehost:proof' 'post-upload checklist mentions one-command pre-hosting proof'
Assert-TextContains $postUploadChecklist 'tools/test-release-upload-drill.ps1' 'post-upload checklist mentions exact upload zip drill tool'
Assert-TextContains $postUploadChecklist 'tools/test-configured-upload-zip-dryrun.ps1' 'post-upload checklist mentions configured upload zip dry-run tool'
Assert-TextContains $postUploadChecklist 'tools/test-php-runtime.ps1' 'post-upload checklist mentions PHP runtime smoke tool'
Assert-TextContains $postUploadChecklist 'tools/prepare-real-upload.ps1' 'post-upload checklist mentions real upload preparation tool'
Assert-TextContains $postUploadChecklist 'tools/cleanup-real-upload-artifacts.ps1' 'post-upload checklist mentions real upload artifact cleanup tool'
Assert-TextContains $postUploadChecklist 'tools/domain-cutover-report-vanphuc.ps1' 'post-upload checklist mentions domain cutover report tool'
Assert-TextContains $postUploadChecklist 'DOMAIN_CUTOVER_REPORT.md' 'post-upload checklist mentions domain cutover report'
Assert-TextContains $postUploadChecklist 'tools/build-configured-public-html.ps1' 'post-upload checklist mentions configured upload zip builder'
Assert-TextContains $postUploadChecklist 'sodovanphuc-configured-public_html.zip' 'post-upload checklist names configured upload zip'
Assert-TextContains $postUploadChecklist 'REAL_UPLOAD_READY.md' 'post-upload checklist names real upload manifest'
Assert-TextContains $postUploadChecklist 'tools/diagnose-vanphuc-hosting.ps1' 'post-upload checklist mentions hosting diagnostic tool'
Assert-TextContains $postUploadChecklist 'tools/wait-vanphuc-hosting-ready.ps1' 'post-upload checklist mentions hosting readiness watcher'
Assert-TextContains $postUploadChecklist 'HOSTING_WAIT_REPORT.md' 'post-upload checklist mentions hosting wait report'
Assert-TextContains $postUploadChecklist 'browser smoke' 'post-upload checklist mentions browser smoke'
Assert-TextContains $postUploadChecklist 'tools/smoke-vanphuc-hosting.ps1' 'post-upload checklist mentions release smoke tool'
Assert-TextContains $postUploadChecklist 'tools/ready-vanphuc-hosting.ps1' 'post-upload checklist mentions final hosting ready gate'
Assert-TextContains $postUploadChecklist 'tools/complete-vanphuc-hosting-handoff.ps1' 'post-upload checklist mentions post-upload handoff autopilot'
Assert-TextContains $postUploadChecklist 'HOSTING_HANDOFF_COMPLETE.md' 'post-upload checklist mentions handoff autopilot report'
Assert-TextContains $postUploadChecklist 'tools/acceptance-report-vanphuc-hosting.ps1' 'post-upload checklist mentions acceptance report gate'
Assert-TextContains $postUploadChecklist '-IncludeWriteWorkflow' 'post-upload checklist mentions write workflow smoke'
Assert-TextContains $postUploadChecklist '$env:SVP_LIVE_ADMIN_USERNAME' 'post-upload checklist preserves live admin username env command'
Assert-TextContains $postUploadChecklist '$env:SVP_LIVE_ADMIN_PASSWORD' 'post-upload checklist preserves live admin password env command'
Assert-TextContains $postUploadChecklist '$env:SVP_DB_PASS' 'post-upload checklist preserves DB password env command'
Assert-TextContains $postUploadChecklist '$env:SVP_ADMIN_PASSWORD' 'post-upload checklist preserves prepare admin password env command'
Assert-TextContains $postUploadChecklist 'ACCEPTANCE_REPORT.md says Final status: PASS' 'post-upload checklist includes final acceptance handoff warning'
Write-Check 'post-upload checklist markdown fences are valid'

Assert-FileHasNoControlCharacters (Join-Path $release 'RELEASE_NOTES.txt') 'release notes have no control characters'
Assert-FileHasNoControlCharacters (Join-Path $release 'UPLOAD_THIS_PACKAGE.txt') 'upload pointer has no control characters'

$forbiddenPaths = @(
    (Join-Path $frontend 'music'),
    (Join-Path $frontend '.env'),
    (Join-Path $frontend '.env.local'),
    (Join-Path $frontend '.git'),
    (Join-Path $frontend '.github'),
    (Join-Path $frontend 'node_modules'),
    (Join-Path $frontend 'src'),
    (Join-Path $frontend 'package.json'),
    (Join-Path $frontend 'package-lock.json'),
    (Join-Path $frontend 'pnpm-lock.yaml'),
    (Join-Path $frontend 'yarn.lock'),
    (Join-Path $frontend 'tsconfig.json'),
    (Join-Path $frontend 'vite.config.ts'),
    (Join-Path $full 'music'),
    (Join-Path $full '.env'),
    (Join-Path $full '.env.local'),
    (Join-Path $full '.git'),
    (Join-Path $full '.github'),
    (Join-Path $full 'node_modules'),
    (Join-Path $full 'src'),
    (Join-Path $full 'package.json'),
    (Join-Path $full 'package-lock.json'),
    (Join-Path $full 'pnpm-lock.yaml'),
    (Join-Path $full 'yarn.lock'),
    (Join-Path $full 'tsconfig.json'),
    (Join-Path $full 'vite.config.ts'),
    (Join-Path $backend 'config\config.php'),
    (Join-Path $backend '.env'),
    (Join-Path $backend 'api\debug_test.php'),
    (Join-Path $backend 'composer.json'),
    (Join-Path $backend 'composer.lock'),
    (Join-Path $backend 'uploads\music'),
    (Join-Path $fullBackend 'config\config.php'),
    (Join-Path $fullBackend '.env'),
    (Join-Path $fullBackend 'api\debug_test.php'),
    (Join-Path $fullBackend 'composer.json'),
    (Join-Path $fullBackend 'composer.lock'),
    (Join-Path $fullBackend 'uploads\music')
)
foreach ($path in $forbiddenPaths) {
    if (Test-Path -LiteralPath $path) {
        throw "Forbidden deploy path exists: $path"
    }
}
Write-Check 'forbidden deploy files are absent'

foreach ($deployRoot in @($frontend, $full)) {
    $badDevArtifacts = @(Get-ChildItem -LiteralPath $deployRoot -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name.EndsWith('.map', [System.StringComparison]::OrdinalIgnoreCase) -or
        $_.Name.EndsWith('.ts', [System.StringComparison]::OrdinalIgnoreCase) -or
        $_.Name.EndsWith('.tsx', [System.StringComparison]::OrdinalIgnoreCase)
    })
    if ($badDevArtifacts.Count -gt 0) {
        $badDevArtifacts | Select-Object -First 20 -ExpandProperty FullName | ForEach-Object { Write-Host $_ }
        throw "Deployment stage contains development/source artifact under: $deployRoot"
    }
}
Write-Check 'deployment stages exclude source maps and TypeScript source artifacts'

$forbiddenFrontendSecrets = @(
    'VITE_AI_API_KEY',
    'api.openai.com',
    'generativelanguage.googleapis.com'
)
foreach ($deployRoot in @($frontend, $full)) {
    $frontendTextFiles = @(Get-ChildItem -LiteralPath $deployRoot -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch '\\backend\\' -and
        ($_.Name.EndsWith('.js', [System.StringComparison]::OrdinalIgnoreCase) -or $_.Name.EndsWith('.html', [System.StringComparison]::OrdinalIgnoreCase))
    })
    foreach ($file in $frontendTextFiles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw
        foreach ($forbiddenText in $forbiddenFrontendSecrets) {
            if ($content.Contains($forbiddenText)) {
                throw "Frontend deploy file contains forbidden public AI key/provider text: $($file.FullName) -> $forbiddenText"
            }
        }
    }
}
Write-Check 'frontend deploy assets contain no public AI provider key or direct provider endpoint'

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

$uploadPointer = Join-Path $release 'UPLOAD_THIS_PACKAGE.txt'
Assert-TextContains $uploadPointer 'sodovanphuc-full-public_html.zip' 'upload pointer names base upload zip'
Assert-TextContains $uploadPointer 'sodovanphuc-configured-public_html.zip' 'upload pointer names configured upload zip'
Assert-TextContains $uploadPointer 'prepare-real-upload.ps1' 'upload pointer names real upload preparation tool'
Assert-TextContains $uploadPointer 'cleanup-real-upload-artifacts.ps1' 'upload pointer names real upload artifact cleanup tool'
Assert-TextContains $uploadPointer 'domain-cutover-report-vanphuc.ps1' 'upload pointer names domain cutover report tool'
Assert-TextContains $uploadPointer 'wait-vanphuc-hosting-ready.ps1' 'upload pointer names hosting readiness watcher'
Assert-TextContains $uploadPointer 'complete-vanphuc-hosting-handoff.ps1' 'upload pointer names post-upload handoff autopilot'
Assert-TextContains $uploadPointer 'REAL_UPLOAD_READY.md' 'upload pointer names real upload manifest'
Assert-TextContains $uploadPointer 'preupload-report-sodovanphuc.ps1' 'upload pointer names pre-upload report'
Assert-TextContains $uploadPointer 'final-prehosting-audit.ps1' 'upload pointer names final pre-hosting audit'
Assert-TextContains $uploadPointer 'npm run prehost:proof' 'upload pointer names one-command pre-hosting proof'
Assert-TextContains $uploadPointer '$env:SVP_DB_PASS' 'upload pointer preserves DB password env command'
Assert-TextContains $uploadPointer '$env:SVP_ADMIN_PASSWORD' 'upload pointer preserves prepare admin password env command'
Assert-TextContains $uploadPointer '$env:SVP_LIVE_ADMIN_USERNAME' 'upload pointer preserves live admin username env command'
Assert-TextContains $uploadPointer '$env:SVP_LIVE_ADMIN_PASSWORD' 'upload pointer preserves live admin password env command'
Assert-TextContains $uploadPointer 'acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow' 'upload pointer names final acceptance gate'
Assert-TextContains $uploadPointer 'Final status: PASS' 'upload pointer blocks handoff until final report passes'

$targets = @($frontend, $backend, $full, $tools, (Join-Path $release 'RELEASE_NOTES.txt'), (Join-Path $release 'POST_UPLOAD_CHECKLIST.md'), $uploadPointer)
Assert-Match $targets 'sodovanphuc\.vn' 'official domain sodovanphuc.vn is present'
Assert-Match $targets 'So Do Van Phuc' 'official brand is present'
Assert-NoMatch $targets $legacyPattern 'legacy domains/placeholders are absent'

$checksumPath = Join-Path $release 'CHECKSUMS-SHA256.txt'
$checksumLines = Get-Content -LiteralPath $checksumPath
foreach ($zipName in @(
    'sodovanphuc-frontend.zip',
    'sodovanphuc-backend.zip',
    'sodovanphuc-full-public_html.zip'
)) {
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $release $zipName)).Hash.ToLowerInvariant()
    $expectedLine = "{0}  {1}" -f $hash, $zipName
    if ($checksumLines -notcontains $expectedLine) {
        throw "Checksum mismatch or missing line for $zipName"
    }
}
Write-Check 'checksum file matches zip artifacts'

$zipList = tar -tf (Join-Path $release 'sodovanphuc-full-public_html.zip')
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
        throw "Zip is missing required item: $required"
    }
}
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
        throw "Zip contains forbidden item: $forbidden"
    }
}
foreach ($forbiddenSuffix in @('.map', '.ts', '.tsx')) {
    $badEntries = @($zipList | Where-Object {
        $_.StartsWith('public_html/') -and $_.EndsWith($forbiddenSuffix, [System.StringComparison]::OrdinalIgnoreCase)
    })
    if ($badEntries.Count -gt 0) {
        $badEntries | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
        throw "Zip contains forbidden development/source artifact suffix: $forbiddenSuffix"
    }
}
Write-Check 'full zip manifest is safe for public_html upload'

Write-Host ""
Write-Host "Release verification passed:"
Write-Host $release
