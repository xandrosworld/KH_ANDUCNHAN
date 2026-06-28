# So Do Van Phuc - Internal Handoff

This project has been converted for the So Do Van Phuc MVP and domain:

```text
sodovanphuc.vn
```

## Current Release

```text
release/sodovanphuc-20260628-214600/
```

Upload this package for Mat Bao CS2 same-domain hosting:

```text
release/sodovanphuc-20260628-214600/sodovanphuc-full-public_html.zip
```

Pre-hosting gate already available:

```bash
npm run prehost:proof
```

It runs `prehost`, updates docs to the newest release, writes a pre-upload report, runs the final pre-hosting audit, and writes `qa/prehosting-proof/<release>/PREHOSTING_PROOF.md`.

## Required Hosting Config

After upload, copy:

```text
backend/config/config.example.php
```

to:

```text
backend/config/config.php
```

Then fill the Mat Bao database credentials, admin password hash, JWT secret and SMTP/mail values.

Safer local option after Mat Bao provides DB credentials:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/new-hosting-config.ps1 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..." -Force
npm run config:verify
```

`-AdminPassword` must be strong: at least 14 characters, with at least 3 of lowercase, uppercase, number and symbol, and without weak words like `admin`, `vanphuc`, `password` or `123456`.

Preferred upload shortcut after DB credentials are known:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/prepare-real-upload.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..."
```

Safer option to keep secrets out of command history:

```powershell
$env:SVP_DB_PASS = "..."
$env:SVP_ADMIN_PASSWORD = "..."
powershell -ExecutionPolicy Bypass -File deploy/prepare-real-upload.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..."
Remove-Item Env:\SVP_DB_PASS, Env:\SVP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

This creates `sodovanphuc-configured-public_html.zip`, drills that configured zip, verifies its manifest, and writes `REAL_UPLOAD_READY.md` without credential values.

Lower-level configured zip command:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/build-configured-public-html.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..." -Force
```

This also creates `sodovanphuc-configured-public_html.zip`, a ready-to-upload package with `public_html/backend/config/config.php` already generated. It contains real secrets, so keep it local/private.

After uploading the configured zip and getting a PASS acceptance report, clean the local secret artifacts:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/cleanup-real-upload-artifacts.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -ConfirmUploadedAndAccepted
```

Each release includes `UPLOAD_THIS_PACKAGE.txt`; open that first to see the exact zip to upload and the final acceptance command.

Before or during DNS/SSL cutover, run:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/domain-cutover-report-vanphuc.ps1
```

It writes `DOMAIN_CUTOVER_REPORT.md` with root/www DNS, SSL, HTTP->HTTPS and canonical redirect status. When DNS/SSL should be final, add `-RequireReady` to make the command fail on any remaining cutover issue.

After upload, SSL, `config.php` and DB import, use the watcher if DNS/SSL/API readiness is still settling:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
```

This post-upload autopilot writes `DOMAIN_CUTOVER_REPORT.md`, waits, runs the acceptance report, verifies `ACCEPTANCE_REPORT.md` says `Final status: PASS`, and writes `HOSTING_HANDOFF_COMPLETE.md`.

For wait/retry only:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
```

It retries the final ready gate and writes `hosting-wait-reports/<timestamp>/HOSTING_WAIT_REPORT.md`.

Before uploading, `npm run preupload:report` writes `qa/preupload/<timestamp>/PREUPLOAD_REPORT.md` with release/package/upload-drill/runtime/audit/manifest evidence.

Then run `npm run final:audit`; it calls `final-prehosting-audit.ps1` to confirm the docs, checksum, upload zip, pre-upload report and no-secret state all point to the same release.

The one-command version is `npm run prehost:proof`.

To directly drill the exact upload zip locally:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-release-upload-drill.ps1 -RequirePhp
```

This drill also logs in with a temporary admin credential, uploads a 1x1 PNG through `/api/uploads`, and confirms the image is served from `backend/uploads`.

To safely dry-run configured zip creation in a temp release copy:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp
```

If PHP CLI is available locally, run the release PHP router smoke too:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-php-runtime.ps1 -RequirePhp
```

Import SQL with the one-file bundle first:

```text
backend/sql/sodovanphuc_import_all.sql
```

It installs the full database in the right order: base app schema, required migrations, base seed, SVP schema, SVP seed and verification. The base and SVP seed rows use `ON DUPLICATE KEY UPDATE`, so re-running refreshes default rows instead of duplicating them. Upgrade migrations use `information_schema` + prepared DDL for MySQL/MariaDB compatibility and do not need `DELIMITER`/procedure support. If phpMyAdmin rejects the bundled file, use the split-file fallback:

```text
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
backend/sql/seed.sql
backend/sql/sodovanphuc_schema.sql
backend/sql/sodovanphuc_seed.sql
backend/sql/sodovanphuc_verify.sql
backend/sql/database_verify.sql
```

The verify rows should return `PASS` or `OK`.

Use these public URL values for the first deployment:

```text
BASE_URL=https://sodovanphuc.vn/backend
FRONTEND_URL=https://sodovanphuc.vn
CORS_ORIGINS=https://sodovanphuc.vn, https://www.sodovanphuc.vn
```

Healthcheck:

```text
https://sodovanphuc.vn/api/svp/health
```

DNS before handoff: `sodovanphuc.vn` and `www.sodovanphuc.vn` must resolve to the same hosting target. The root `.htaccess` redirects `www` to `https://sodovanphuc.vn`, and `npm run hosting:diagnose` fails when `www` still points to a different old host.

After DNS, DB import and `config.php` are ready on Mat Bao, run:

```bash
npm run hosting:ready
```

This final gate runs the release self-check, strict diagnostic, API smoke test and live browser smoke test. It checks DNS/SSL, canonical redirect, security headers, the main pages, `/api/svp/health`, AI proxy JSON/fallback, required PHP extensions, `backend/uploads` and PHP temp writability, SVP config/collection APIs, blank-screen/runtime failures, SPA fallback, responsive overflow, and confirms backend internals are not publicly readable. If it fails, run `npm run hosting:diagnose` to see the failure table or `npm run hosting:browser` for browser-only checks.

After the first live DB import is confirmed, run `npm run hosting:ready:write` once to exercise the real write workflow: property create/update/media, timeline, versions, customer need, viewing schedule, referral, audit log, real multipart image upload with admin cleanup when `SVP_LIVE_ADMIN_PASSWORD` is set, and a real browser property form submission. It cleans the temporary uploaded image/customer/need/schedule/referral records and soft-deletes the temporary properties.

To verify the configured admin password/JWT/login form without putting the password into report files, set it only in the current PowerShell session before the ready/acceptance command:

```powershell
$env:SVP_LIVE_ADMIN_USERNAME = "admin"
$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
```

For a saved handoff proof, run `npm run hosting:acceptance`. It includes the API + live browser UI write workflow, optional admin API/JWT + browser login smoke and real image upload/delete smoke when `SVP_LIVE_ADMIN_PASSWORD` is set, and writes `qa/hosting-acceptance/<timestamp>/ACCEPTANCE_REPORT.md` with logs for each gate.

```powershell
Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

## Source Of Truth

Use these files before deploy or handoff:

```text
../MASTER_PLAN_NOI_BO_TRIEN_KHAI_SO_DO_VAN_PHUC.md
../DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md
release/sodovanphuc-20260628-214600/RELEASE_NOTES.txt
```













































