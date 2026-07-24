param(
    [switch]$SkipBuild,
    [switch]$KeepOld
)

$ErrorActionPreference = 'Stop'

$deployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Split-Path -Parent $deployDir
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$releaseRoot = Join-Path $appRoot "release\sodovanphuc-$timestamp"
$frontendStage = Join-Path $releaseRoot 'frontend'
$backendStage = Join-Path $releaseRoot 'backend'
$fullStage = Join-Path $releaseRoot 'full'
$fullPublicHtml = Join-Path $fullStage 'public_html'
$releaseTools = Join-Path $releaseRoot 'tools'

function New-CleanDirectory {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
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

function Compress-DirectoryContents {
    param(
        [string]$Source,
        [string]$DestinationZip
    )
    $items = Get-ChildItem -LiteralPath $Source -Force
    if (-not $items) {
        throw "Nothing to compress in $Source"
    }
    Compress-Archive -LiteralPath $items.FullName -DestinationPath $DestinationZip -Force
}

Set-Location $appRoot

if (-not $SkipBuild) {
    npm run build
}

$distDir = Join-Path $appRoot 'dist'
$backendDir = Join-Path $appRoot 'backend'

if (-not (Test-Path -LiteralPath (Join-Path $distDir 'index.html'))) {
    throw 'dist/index.html not found. Run npm run build first.'
}

New-CleanDirectory $releaseRoot
New-CleanDirectory $frontendStage
New-CleanDirectory $backendStage
New-CleanDirectory $fullPublicHtml
New-CleanDirectory $releaseTools

Copy-DirectoryContents $distDir $frontendStage

Copy-DirectoryContents (Join-Path $backendDir 'api') (Join-Path $backendStage 'api')
$debugFile = Join-Path $backendStage 'api\debug_test.php'
if (Test-Path -LiteralPath $debugFile) {
    Remove-Item -LiteralPath $debugFile -Force
}

Copy-DirectoryContents (Join-Path $backendDir 'lib') (Join-Path $backendStage 'lib')

New-Item -ItemType Directory -Force -Path (Join-Path $backendStage 'config') | Out-Null
Copy-Item -LiteralPath (Join-Path $backendDir 'config\config.example.php') -Destination (Join-Path $backendStage 'config\config.example.php') -Force

New-Item -ItemType Directory -Force -Path (Join-Path $backendStage 'sql') | Out-Null
$baseSchemaSqlSource = Join-Path $backendDir 'sql\schema.sql'
$propertyVideoSqlSource = Join-Path $backendDir 'sql\002_add_property_video_url.sql'
$propertySocialSqlSource = Join-Path $backendDir 'sql\003_add_property_social_links.sql'
$usersBlogSqlSource = Join-Path $backendDir 'sql\004_users_banners_blog.sql'
$messagesSqlSource = Join-Path $backendDir 'sql\005_chat_messages.sql'
$likesSqlSource = Join-Path $backendDir 'sql\006_property_likes.sql'
$coordinatesSqlSource = Join-Path $backendDir 'sql\007_add_coordinates.sql'
$expirySqlSource = Join-Path $backendDir 'sql\007_add_expiry_notified.sql'
$bankTransfersSqlSource = Join-Path $backendDir 'sql\008_bank_transfers.sql'
$imageUniqueSqlSource = Join-Path $backendDir 'sql\009_property_image_unique.sql'
$eventsSqlSource = Join-Path $backendDir 'sql\012_svp_events_branding.sql'
$recruitmentSqlSource = Join-Path $backendDir 'sql\013_svp_recruitment.sql'
$mediaLibrarySqlSource = Join-Path $backendDir 'sql\014_svp_media_library.sql'
$baseSeedSqlSource = Join-Path $backendDir 'sql\seed.sql'
$schemaSqlSource = Join-Path $backendDir 'sql\sodovanphuc_schema.sql'
$seedSqlSource = Join-Path $backendDir 'sql\sodovanphuc_seed.sql'
$verifySqlSource = Join-Path $backendDir 'sql\sodovanphuc_verify.sql'
$databaseVerifySqlSource = Join-Path $backendDir 'sql\database_verify.sql'
$importAllSqlStage = Join-Path $backendStage 'sql\sodovanphuc_import_all.sql'

$sqlSourceFiles = @(
    $baseSchemaSqlSource,
    $propertyVideoSqlSource,
    $propertySocialSqlSource,
    $usersBlogSqlSource,
    $messagesSqlSource,
    $likesSqlSource,
    $coordinatesSqlSource,
    $expirySqlSource,
    $bankTransfersSqlSource,
    $imageUniqueSqlSource,
    $eventsSqlSource,
    $recruitmentSqlSource,
    $mediaLibrarySqlSource,
    $baseSeedSqlSource,
    $schemaSqlSource,
    $seedSqlSource,
    $verifySqlSource,
    $databaseVerifySqlSource
)
foreach ($sqlSourceFile in $sqlSourceFiles) {
    Copy-Item -LiteralPath $sqlSourceFile -Destination (Join-Path (Join-Path $backendStage 'sql') (Split-Path -Leaf $sqlSourceFile)) -Force
}

$sqlBundleSections = @(
    @{ Marker = '01 base schema: schema.sql'; Path = $baseSchemaSqlSource },
    @{ Marker = '01b base property video: 002_add_property_video_url.sql'; Path = $propertyVideoSqlSource },
    @{ Marker = '01c base property social links: 003_add_property_social_links.sql'; Path = $propertySocialSqlSource },
    @{ Marker = '02 base users/banners/blog: 004_users_banners_blog.sql'; Path = $usersBlogSqlSource },
    @{ Marker = '03 base messages: 005_chat_messages.sql'; Path = $messagesSqlSource },
    @{ Marker = '04 base property likes: 006_property_likes.sql'; Path = $likesSqlSource },
    @{ Marker = '05 base property coordinates: 007_add_coordinates.sql'; Path = $coordinatesSqlSource },
    @{ Marker = '06 base expiry notification flag: 007_add_expiry_notified.sql'; Path = $expirySqlSource },
    @{ Marker = '07 base bank transfers: 008_bank_transfers.sql'; Path = $bankTransfersSqlSource },
    @{ Marker = '07b base property image uniqueness: 009_property_image_unique.sql'; Path = $imageUniqueSqlSource },
    @{ Marker = '07c events and branding: 012_svp_events_branding.sql'; Path = $eventsSqlSource },
    @{ Marker = '07d recruitment: 013_svp_recruitment.sql'; Path = $recruitmentSqlSource },
    @{ Marker = '07e media library: 014_svp_media_library.sql'; Path = $mediaLibrarySqlSource },
    @{ Marker = '08 base seed: seed.sql'; Path = $baseSeedSqlSource },
    @{ Marker = '09 SVP schema: sodovanphuc_schema.sql'; Path = $schemaSqlSource },
    @{ Marker = '10 SVP seed: sodovanphuc_seed.sql'; Path = $seedSqlSource },
    @{ Marker = '11 SVP verifier: sodovanphuc_verify.sql'; Path = $verifySqlSource },
    @{ Marker = '12 full database verifier: database_verify.sql'; Path = $databaseVerifySqlSource }
)

$sqlBundleParts = @(
    '-- So Do Van Phuc one-file import bundle.',
    '-- Import this file in phpMyAdmin to install the full database: base app schema, required migrations, base seed, SVP schema, SVP seed, then verification.',
    '-- Generated by deploy/build-sodovanphuc-release.ps1.'
)
foreach ($section in $sqlBundleSections) {
    $sqlBundleParts += ''
    $sqlBundleParts += "-- ===== $($section.Marker) ====="
    $sqlBundleParts += (Get-Content -LiteralPath $section.Path -Raw)
}
$sqlBundle = $sqlBundleParts -join "`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($importAllSqlStage, $sqlBundle, $utf8NoBom)

New-Item -ItemType Directory -Force -Path (Join-Path $backendStage 'uploads') | Out-Null
$uploadHtaccess = Join-Path $backendDir 'uploads\.htaccess'
if (Test-Path -LiteralPath $uploadHtaccess) {
    Copy-Item -LiteralPath $uploadHtaccess -Destination (Join-Path $backendStage 'uploads\.htaccess') -Force
}

foreach ($file in @('.htaccess', '.user.ini')) {
    $sourceFile = Join-Path $backendDir $file
    if (Test-Path -LiteralPath $sourceFile) {
        Copy-Item -LiteralPath $sourceFile -Destination (Join-Path $backendStage $file) -Force
    }
}

Copy-DirectoryContents $frontendStage $fullPublicHtml
Copy-DirectoryContents $backendStage (Join-Path $fullPublicHtml 'backend')

foreach ($toolFile in @(
    'new-hosting-config.ps1',
    'verify-hosting-config.ps1',
    'test-php-runtime.ps1',
    'test-release-upload-drill.ps1',
    'test-configured-upload-zip-dryrun.ps1',
    'build-configured-public-html.ps1',
    'prepare-real-upload.ps1',
    'cleanup-real-upload-artifacts.ps1',
    'domain-cutover-report-vanphuc.ps1',
    'diagnose-vanphuc-hosting.ps1',
    'wait-vanphuc-hosting-ready.ps1',
    'browser-smoke-vanphuc-hosting.ps1',
    'smoke-vanphuc-hosting.ps1',
    'ready-vanphuc-hosting.ps1',
    'complete-vanphuc-hosting-handoff.ps1',
    'acceptance-report-vanphuc-hosting.ps1',
    'preupload-report-sodovanphuc.ps1',
    'final-prehosting-audit.ps1',
    'run-prehosting-proof.ps1',
    'verify-release-package.ps1'
)) {
    Copy-Item -LiteralPath (Join-Path $deployDir $toolFile) -Destination (Join-Path $releaseTools $toolFile) -Force
}

$notes = @"
So Do Van Phuc release: $timestamp

Artifacts:
- sodovanphuc-frontend.zip: upload contents to public_html for frontend-only/API-subdomain mode.
- sodovanphuc-backend.zip: upload contents to the API document root or public_html/backend.
- sodovanphuc-full-public_html.zip: contains public_html with frontend + backend folder for same-domain shared hosting.
- CHECKSUMS-SHA256.txt: SHA256 hashes to verify the zip files before upload.
- POST_UPLOAD_CHECKLIST.md: exact after-upload checklist.
- tools/: helper scripts for verifying the release package, generating/verifying config.php, drilling the exact public_html upload zip locally, dry-running the configured upload zip flow safely in temp, testing PHP runtime locally when PHP CLI is available, building a configured upload zip, preparing a real upload manifest in one command, cleaning local configured upload artifacts after acceptance, writing a pre-upload report, running the final pre-hosting audit, running the one-command pre-hosting proof, writing the DNS/SSL cutover report, diagnosing hosting state, waiting/retrying until hosting readiness passes, browser smoke-testing, API smoke-testing, running the final handoff gate, running the one-command post-upload handoff autopilot, and writing a final acceptance report.

Not included by design:
- backend/config/config.php
- backend/api/debug_test.php
- backend/uploads/music legacy demo files
- public/music legacy demo files
- node_modules, source code, local release folders

After upload:
1. Create backend/config/config.php on hosting, or generate it locally with tools/new-hosting-config.ps1 after Mat Bao DB credentials are known.
2. Verify config.php with tools/verify-hosting-config.ps1 before upload if it is generated locally.
3. Same-domain CS2 setup:
   - BASE_URL=https://sodovanphuc.vn/backend
   - FRONTEND_URL=https://sodovanphuc.vn
   - CORS_ORIGINS must include https://sodovanphuc.vn and https://www.sodovanphuc.vn
   - Healthcheck: https://sodovanphuc.vn/api/svp/health
4. API-subdomain setup if upgraded later:
   - Frontend VITE_API_BASE_URL=https://api.sodovanphuc.vn before build
   - Backend BASE_URL=https://api.sodovanphuc.vn
   - Backend FRONTEND_URL=https://sodovanphuc.vn
   - Healthcheck: https://api.sodovanphuc.vn/api/svp/health
5. Fastest DB setup: import backend/sql/sodovanphuc_import_all.sql once in phpMyAdmin. It installs the full database: base app schema, required migrations, base sample data, SVP schema, SVP seed, SVP verifier, then full database verifier. Base and SVP seed rows use ON DUPLICATE KEY UPDATE, so re-running refreshes default rows instead of duplicating them. Upgrade migrations use information_schema + prepared DDL for MySQL/MariaDB compatibility and do not need DELIMITER/procedure support.
6. Split-file fallback: import backend/sql/schema.sql, backend/sql/002_add_property_video_url.sql, backend/sql/003_add_property_social_links.sql, backend/sql/004_users_banners_blog.sql, backend/sql/005_chat_messages.sql, backend/sql/006_property_likes.sql, backend/sql/007_add_coordinates.sql, backend/sql/007_add_expiry_notified.sql, backend/sql/008_bank_transfers.sql, backend/sql/009_property_image_unique.sql, backend/sql/seed.sql, backend/sql/sodovanphuc_schema.sql, backend/sql/sodovanphuc_seed.sql, then run backend/sql/sodovanphuc_verify.sql and backend/sql/database_verify.sql. All core checks must show PASS/OK.
7. Confirm healthcheck returns status=ready before handing over. It must also show no missing required PHP extensions and writable backend/uploads plus PHP temp storage.
8. Before upload, run: powershell -ExecutionPolicy Bypass -File tools/preupload-report-sodovanphuc.ps1
9. After the pre-upload report passes, run: powershell -ExecutionPolicy Bypass -File tools/final-prehosting-audit.ps1
10. Easiest from the app root: run npm run prehost:proof to rebuild, drill, report and final-audit in one command.
11. To drill the exact upload zip directly, run: powershell -ExecutionPolicy Bypass -File tools/test-release-upload-drill.ps1 -RequirePhp
12. To dry-run configured upload zip creation without touching this release folder, run: powershell -ExecutionPolicy Bypass -File tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp
13. Optional if PHP CLI is available locally: run tools/test-php-runtime.ps1 -RequirePhp to smoke-test the release PHP router before upload.
14. Best after DB credentials are known: run tools/prepare-real-upload.ps1 to create sodovanphuc-configured-public_html.zip with config.php included, drill it, verify its manifest, and write REAL_UPLOAD_READY.md without credential values.
15. Lower-level option: run tools/build-configured-public-html.ps1 to create sodovanphuc-configured-public_html.zip with config.php included; this command also drills the configured zip by default. Use -SkipDrill only if PHP CLI is unavailable and you accept running the drill separately later.
16. Before/while cutting over DNS and SSL, run: powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1
   It writes DOMAIN_CUTOVER_REPORT.md with the current root/www DNS, SSL, HTTP->HTTPS and canonical redirect status, plus the exact Mat Bao DNS/SSL actions. When ready to enforce it, run with -RequireReady.
17. After DNS/SSL/upload/config/DB import, run: powershell -ExecutionPolicy Bypass -File tools/ready-vanphuc-hosting.ps1
   It runs the release self-check, strict hosting diagnostic, main pages, health, required PHP extensions, upload/temp writability, SVP JSON APIs, canonical redirects, security headers, protected backend internals, and live browser smoke. Use -SkipBrowserSmoke only if the local machine cannot run Node/Playwright.
   To test the configured admin login too, set SVP_LIVE_ADMIN_USERNAME and SVP_LIVE_ADMIN_PASSWORD in the current shell before running the gate.
18. If DNS/SSL/upload/config/DB propagation is still settling, let the watcher retry for you: powershell -ExecutionPolicy Bypass -File tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
   It retries the same readiness gate until it passes or times out, writes hosting-wait-reports/<timestamp>/HOSTING_WAIT_REPORT.md, and keeps every attempt log so you do not have to rerun checks manually.
19. For the closest replacement for manual testing, run: powershell -ExecutionPolicy Bypass -File tools/ready-vanphuc-hosting.ps1 -IncludeWriteWorkflow
   This additionally creates marked AUTO-SMOKE property/customer/need/schedule/referral records through the API, verifies timeline/version/media/audit, optionally verifies admin API/JWT auth and real image upload/delete when SVP_LIVE_ADMIN_PASSWORD is set, runs a live browser UI property form creation with cleanup plus optional browser login form smoke, cleans the temporary uploaded image/customer/need/schedule/referral records, and soft-deletes the temporary properties.
20. To keep proof for handoff, run: powershell -ExecutionPolicy Bypass -File tools/acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow
   It runs the same final checks and writes qa/hosting-acceptance/<timestamp>/ACCEPTANCE_REPORT.md with per-step logs.
21. One-command post-upload autopilot after upload/config/DB/SSL: powershell -ExecutionPolicy Bypass -File tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
   It writes DOMAIN_CUTOVER_REPORT.md, waits for readiness, writes HOSTING_WAIT_REPORT.md, runs the acceptance report, verifies ACCEPTANCE_REPORT.md says Final status: PASS, and writes HOSTING_HANDOFF_COMPLETE.md.
22. After the configured zip has been uploaded and ACCEPTANCE_REPORT.md says Final status: PASS, clean local configured upload artifacts with: powershell -ExecutionPolicy Bypass -File tools/cleanup-real-upload-artifacts.ps1 -ConfirmUploadedAndAccepted
"@

Set-Content -LiteralPath (Join-Path $releaseRoot 'RELEASE_NOTES.txt') -Value $notes -Encoding UTF8

$uploadPointer = @"
SO DO VAN PHUC - UPLOAD THIS PACKAGE

Release: $timestamp
Domain: https://sodovanphuc.vn

Base upload zip:
sodovanphuc-full-public_html.zip

Use this base zip before DB credentials are known. It does not contain backend/config/config.php or real secrets.

If Mat Bao DB credentials are already known, create a configured zip first:
powershell -ExecutionPolicy Bypass -File tools/prepare-real-upload.ps1 -DbName "TEN_DB" -DbUser "USER_DB" -DbPass "PASS_DB" -AdminPassword "MAT_KHAU_ADMIN_MANH"

This writes REAL_UPLOAD_READY.md and keeps the configured zip local/private. To keep secrets out of command history, set `$env:SVP_DB_PASS` and `$env:SVP_ADMIN_PASSWORD`, then omit -DbPass and -AdminPassword from this command.
MAT_KHAU_ADMIN_MANH must be at least 14 characters, use at least 3 of lowercase/uppercase/number/symbol, and avoid weak words like admin, vanphuc, password or 123456.

Safer command-history-friendly configured zip command:
`$env:SVP_DB_PASS = "PASS_DB"
`$env:SVP_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH"
powershell -ExecutionPolicy Bypass -File tools/prepare-real-upload.ps1 -DbName "TEN_DB" -DbUser "USER_DB"
Remove-Item Env:\SVP_DB_PASS, Env:\SVP_ADMIN_PASSWORD -ErrorAction SilentlyContinue

Lower-level configured zip command:
powershell -ExecutionPolicy Bypass -File tools/build-configured-public-html.ps1 -DbName "TEN_DB" -DbUser "USER_DB" -DbPass "PASS_DB" -AdminPassword "MAT_KHAU_ADMIN_MANH" -Force

Then upload:
sodovanphuc-configured-public_html.zip

Never upload:
- backend source from the app workspace
- node_modules
- configured-public_html work folder
- old release folders

Before upload:
powershell -ExecutionPolicy Bypass -File tools/preupload-report-sodovanphuc.ps1

Final local audit after the pre-upload report:
powershell -ExecutionPolicy Bypass -File tools/final-prehosting-audit.ps1

One-command full pre-hosting proof from the app root:
npm run prehost:proof

Direct exact upload zip drill:
powershell -ExecutionPolicy Bypass -File tools/test-release-upload-drill.ps1 -RequirePhp

Safe configured upload zip dry-run:
powershell -ExecutionPolicy Bypass -File tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp

DNS/SSL cutover report:
powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1

After upload, SSL, config.php and DB import:
`$env:SVP_LIVE_ADMIN_USERNAME = "admin"
`$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
powershell -ExecutionPolicy Bypass -File tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue

Fallback if you want separate steps instead of autopilot:
powershell -ExecutionPolicy Bypass -File tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
powershell -ExecutionPolicy Bypass -File tools/acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow

After ACCEPTANCE_REPORT.md says Final status: PASS, clean local configured upload artifacts:
powershell -ExecutionPolicy Bypass -File tools/cleanup-real-upload-artifacts.ps1 -ConfirmUploadedAndAccepted

Do not hand over until ACCEPTANCE_REPORT.md says Final status: PASS.
"@

Set-Content -LiteralPath (Join-Path $releaseRoot 'UPLOAD_THIS_PACKAGE.txt') -Value $uploadPointer -Encoding UTF8

$checklist = @"
# So Do Van Phuc - Post Upload Checklist

Release: $timestamp
Domain: https://sodovanphuc.vn

## 1. Upload

Before uploading, verify this release package:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/verify-release-package.ps1
~~~

For the fullest local proof before upload, run:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/preupload-report-sodovanphuc.ps1
~~~

This writes qa/preupload/<timestamp>/PREUPLOAD_REPORT.md.

Then run the final pre-hosting audit:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/final-prehosting-audit.ps1
~~~

From the app root, the one-command version is:

~~~powershell
npm run prehost:proof
~~~

It rebuilds the release, runs the upload drill, configured dry-run, pre-upload report and final audit, then writes qa/prehosting-proof/<release>/PREHOSTING_PROOF.md.

To directly drill the exact upload zip, extract it to temp public_html, generate a temporary config, and test frontend/API routing:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/test-release-upload-drill.ps1 -RequirePhp
~~~

To safely test the configured upload zip flow with fake credentials in a temp release copy:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp
~~~

Before or during DNS/SSL cutover, create the domain report:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1
~~~

It writes `DOMAIN_CUTOVER_REPORT.md` with root/www DNS, SSL, HTTP->HTTPS and canonical redirect status. When DNS/SSL should be final, enforce it:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/domain-cutover-report-vanphuc.ps1 -RequireReady
~~~

If PHP CLI is available locally, smoke-test the release PHP router too:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/test-php-runtime.ps1 -RequirePhp
~~~

Upload and extract:

~~~text
sodovanphuc-full-public_html.zip
~~~

Expected hosting structure:

~~~text
public_html/index.html
public_html/.htaccess
public_html/backend/api/index.php
public_html/backend/config/config.example.php
public_html/backend/sql/schema.sql
public_html/backend/sql/002_add_property_video_url.sql
public_html/backend/sql/003_add_property_social_links.sql
public_html/backend/sql/004_users_banners_blog.sql
public_html/backend/sql/005_chat_messages.sql
public_html/backend/sql/006_property_likes.sql
public_html/backend/sql/007_add_coordinates.sql
public_html/backend/sql/007_add_expiry_notified.sql
public_html/backend/sql/008_bank_transfers.sql
public_html/backend/sql/009_property_image_unique.sql
public_html/backend/sql/012_svp_events_branding.sql
public_html/backend/sql/013_svp_recruitment.sql
public_html/backend/sql/014_svp_media_library.sql
public_html/backend/sql/seed.sql
public_html/backend/sql/sodovanphuc_import_all.sql
public_html/backend/sql/sodovanphuc_schema.sql
public_html/backend/sql/sodovanphuc_seed.sql
public_html/backend/sql/sodovanphuc_verify.sql
public_html/backend/sql/database_verify.sql
~~~

## 2. Create Config

After Mat Bao gives DB credentials, create config locally from this release folder:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/new-hosting-config.ps1 -DbName "TEN_DB" -DbUser "USER_DB" -DbPass "PASS_DB" -AdminPassword "MAT_KHAU_ADMIN_MANH" -Force
~~~

MAT_KHAU_ADMIN_MANH must be at least 14 characters, use at least 3 of lowercase/uppercase/number/symbol, and avoid weak words like admin, vanphuc, password or 123456.

Or create a configured upload zip in one step:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/prepare-real-upload.ps1 -DbName "TEN_DB" -DbUser "USER_DB" -DbPass "PASS_DB" -AdminPassword "MAT_KHAU_ADMIN_MANH"
~~~

This command creates sodovanphuc-configured-public_html.zip, runs tools/test-release-upload-drill.ps1 -ExpectConfigInZip -RequirePhp against it, verifies the configured zip manifest, and writes REAL_UPLOAD_READY.md without credential values.

Safer command-history-friendly version:

~~~powershell
`$env:SVP_DB_PASS = "PASS_DB"
`$env:SVP_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH"
powershell -ExecutionPolicy Bypass -File tools/prepare-real-upload.ps1 -DbName "TEN_DB" -DbUser "USER_DB"
Remove-Item Env:\SVP_DB_PASS, Env:\SVP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
~~~

Lower-level command if needed:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/build-configured-public-html.ps1 -DbName "TEN_DB" -DbUser "USER_DB" -DbPass "PASS_DB" -AdminPassword "MAT_KHAU_ADMIN_MANH" -Force
~~~

This creates:

~~~text
sodovanphuc-configured-public_html.zip
~~~

Only upload this configured zip to the real hosting. It contains secrets.

If you used tools/new-hosting-config.ps1 instead of the configured zip flow, then verify:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/verify-hosting-config.ps1
~~~

and upload the generated:

~~~text
backend/config/config.php
~~~

to:

~~~text
public_html/backend/config/config.php
~~~

Skip this manual config.php upload when using sodovanphuc-configured-public_html.zip, because that zip already contains backend/config/config.php.

## 3. Import Database

Import in phpMyAdmin:

~~~text
backend/sql/sodovanphuc_import_all.sql
~~~

This preferred one-file import installs the full database in the correct order: base app schema, required migrations, base seed, SVP schema, SVP seed and verification. Base and SVP seed rows use ON DUPLICATE KEY UPDATE, so re-running the import refreshes default rows instead of duplicating them. Upgrade migrations use information_schema + prepared DDL for MySQL/MariaDB compatibility and do not need DELIMITER/procedure support. If phpMyAdmin has trouble with the bundled file, use the split-file fallback:

~~~text
backend/sql/schema.sql
backend/sql/002_add_property_video_url.sql
backend/sql/003_add_property_social_links.sql
backend/sql/004_users_banners_blog.sql
backend/sql/005_chat_messages.sql
backend/sql/006_property_likes.sql
backend/sql/007_add_coordinates.sql
backend/sql/007_add_expiry_notified.sql
backend/sql/008_bank_transfers.sql
backend/sql/009_property_image_unique.sql
backend/sql/012_svp_events_branding.sql
backend/sql/013_svp_recruitment.sql
backend/sql/014_svp_media_library.sql
backend/sql/seed.sql
backend/sql/sodovanphuc_schema.sql
backend/sql/sodovanphuc_seed.sql
backend/sql/sodovanphuc_verify.sql
backend/sql/database_verify.sql
~~~

The verifier rows must show PASS or OK.

## 4. Check Domain

Open:

~~~text
https://sodovanphuc.vn/api/svp/health
~~~

Required status:

~~~text
ready
~~~

## 5. Final Handoff Gate

The shortest post-upload autopilot is:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
~~~

   It writes `DOMAIN_CUTOVER_REPORT.md`, waits until the hosting is ready, writes `HOSTING_WAIT_REPORT.md`, runs the full acceptance report, confirms `ACCEPTANCE_REPORT.md` says `Final status: PASS`, and writes `HOSTING_HANDOFF_COMPLETE.md`.

If DNS/SSL/upload/config/DB propagation is still settling, let this watcher retry the final gate and keep logs for you:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
~~~

It writes `hosting-wait-reports/<timestamp>/HOSTING_WAIT_REPORT.md` and attempt logs. Use this instead of manually rerunning the ready gate while DNS, SSL, or DB credentials are settling.

Run one final gate from this release folder:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/ready-vanphuc-hosting.ps1
~~~

This also runs a live Playwright browser smoke from the app workspace to catch blank pages, JavaScript errors, missing assets, and SPA fallback problems. Use -SkipBrowserSmoke only if this machine cannot run Node/Playwright.

To include admin login/JWT verification in the final gate, set these environment variables in the current shell before running the ready or acceptance command:

~~~powershell
`$env:SVP_LIVE_ADMIN_USERNAME = "admin"
`$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
~~~

For a full workflow smoke that replaces manual click-testing, run:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/ready-vanphuc-hosting.ps1 -IncludeWriteWorkflow
~~~

This creates marked AUTO-SMOKE records through the API, verifies property create/update/media/timeline/version/audit plus customer/need/viewing/referral, verifies admin API/JWT auth and real image upload/delete when SVP_LIVE_ADMIN_PASSWORD is set, runs a live browser UI property form creation with cleanup, optionally verifies browser admin login form, cleans the temporary uploaded image/customer/need/schedule/referral records, and soft-deletes the temporary properties. Audit log rows remain as the execution proof.

To save proof for handoff, run the acceptance report gate:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow
~~~

It writes qa/hosting-acceptance/<timestamp>/ACCEPTANCE_REPORT.md and separate logs for release package verification, strict hosting diagnostic, API/write workflow/admin-auth smoke, and live browser smoke including the UI form write workflow and optional login form smoke.

After ACCEPTANCE_REPORT.md says Final status: PASS and the configured zip has already been uploaded, clean local configured upload artifacts:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/cleanup-real-upload-artifacts.ps1 -ConfirmUploadedAndAccepted
~~~

If this fails and you need details, run the lower-level checks:

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/diagnose-vanphuc-hosting.ps1 -RequireReady
powershell -ExecutionPolicy Bypass -File tools/smoke-vanphuc-hosting.ps1
powershell -ExecutionPolicy Bypass -File tools/smoke-vanphuc-hosting.ps1 -IncludeWriteWorkflow
powershell -ExecutionPolicy Bypass -File tools/browser-smoke-vanphuc-hosting.ps1
~~~

This checks pages, health, required PHP extensions, upload/temp writability, SVP JSON APIs, canonical domain files, protected backend internals, and live browser runtime behavior.

Do not hand over until acceptance-report-vanphuc-hosting.ps1 passes and ACCEPTANCE_REPORT.md says Final status: PASS.
"@

Set-Content -LiteralPath (Join-Path $releaseRoot 'POST_UPLOAD_CHECKLIST.md') -Value $checklist -Encoding UTF8

Compress-DirectoryContents $frontendStage (Join-Path $releaseRoot 'sodovanphuc-frontend.zip')
Compress-DirectoryContents $backendStage (Join-Path $releaseRoot 'sodovanphuc-backend.zip')
Compress-Archive -LiteralPath $fullPublicHtml -DestinationPath (Join-Path $releaseRoot 'sodovanphuc-full-public_html.zip') -Force

$zipNames = @(
    'sodovanphuc-frontend.zip',
    'sodovanphuc-backend.zip',
    'sodovanphuc-full-public_html.zip'
)
$checksumLines = foreach ($zipName in $zipNames) {
    $zipPath = Join-Path $releaseRoot $zipName
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath
    "{0}  {1}" -f $hash.Hash.ToLowerInvariant(), $zipName
}
Set-Content -LiteralPath (Join-Path $releaseRoot 'CHECKSUMS-SHA256.txt') -Value $checksumLines -Encoding ASCII

if (-not $KeepOld) {
    $releaseParent = Join-Path $appRoot 'release'
    Get-ChildItem -LiteralPath $releaseParent -Directory |
        Where-Object { $_.Name -like 'sodovanphuc-*' -and $_.FullName -ne $releaseRoot } |
        ForEach-Object {
            if (-not $_.FullName.StartsWith($releaseParent + [System.IO.Path]::DirectorySeparatorChar)) {
                throw "Refusing to remove release outside release root: $($_.FullName)"
            }
            Remove-Item -LiteralPath $_.FullName -Recurse -Force
        }
}

Write-Host "Release created: $releaseRoot"
Write-Host "Frontend zip: sodovanphuc-frontend.zip"
Write-Host "Backend zip: sodovanphuc-backend.zip"
Write-Host "Full zip: sodovanphuc-full-public_html.zip"
Write-Host "Checksums: CHECKSUMS-SHA256.txt"
