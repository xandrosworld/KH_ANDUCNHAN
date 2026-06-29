# So Do Van Phuc

Internal real-estate operations system for sodovanphuc.vn.

## Quick Start

```bash
npm install
npm run dev
npm run lint
npm run build
npm run release
npm run prehost
npm run prehost:proof
```

`npm run prehost` is the full pre-hosting gate: PHP syntax parse, PowerShell syntax parse, config template/dry-run verification, API/SQL contract verification, lint, build, Playwright smoke tests, release packaging, checksum generation, release verification, then an exact upload zip drill.

`npm run prehost:proof` is the lazy-safe gate: it runs `prehost`, generates the pre-upload report, updates docs to the newest release, runs `final-prehosting-audit.ps1`, and writes `qa/prehosting-proof/<release>/PREHOSTING_PROOF.md`.

## Main Routes

| Route | Description |
| --- | --- |
| `/`, `/sign-in` | Login screen |
| `/register`, `/dang-ky` | Public registration with multiple role selection |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/pending-approval`, `/select-role` | Approval waiting screen and role switcher |
| `/chu-nha`, `/chu-nha/gui-ban`, `/chu-nha/nha-cua-toi` | Owner dashboard, submit property and owned properties |
| `/khach-mua`, `/khach-mua/tim-nha`, `/khach-mua/yeu-thich` | Buyer dashboard, search and favorites |
| `/chuyen-gia`, `/chuyen-gia/dang-nha`, `/chuyen-gia/kho-nha` | Expert dashboard, property submission and property stock |
| `/chuyen-vien`, `/chuyen-vien/khach-hang`, `/chuyen-vien/them-khach`, `/chuyen-vien/tim-nha`, `/chuyen-vien/lich-xem` | Specialist customer and viewing workflows |
| `/ctv`, `/ctv/cong-viec` | Contributor workspace |
| `/gioi-thieu`, `/gioi-thieu/ma-gioi-thieu` | Referral workspace and QR/link |
| `/quan-tri` | Admin dashboard |
| `/quan-tri/nguoi-dung` | User and role overview |
| `/quan-tri/duyet-vai-tro` | Role approval queue |
| `/quan-tri/nha`, `/quan-tri/khach-hang` | Admin property and customer overview |
| `/quan-tri/cau-hinh` | Configurable data lists and role approval settings |
| `/quan-tri/nhat-ky` | System activity history |
| `/profile`, `/notifications` | User profile and notifications |

## Deploy

Use the latest package in:

```text
release/sodovanphuc-20260628-214600/sodovanphuc-full-public_html.zip
```

Before uploading a new package, run:

```bash
npm run prehost:proof
```

After Mat Bao gives the database credentials, generate the real `config.php` instead of editing by hand:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/new-hosting-config.ps1 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..." -Force
npm run config:verify
```

`-AdminPassword` must be a strong password: at least 14 characters, with at least 3 of lowercase, uppercase, number and symbol, and without weak words like `admin`, `vanphuc`, `password` or `123456`.

Preferred: prepare a complete configured upload zip and local upload manifest from the latest release:

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

The generated `sodovanphuc-configured-public_html.zip` contains real secrets, so use it only for the actual hosting upload and do not commit or share it.

After uploading the configured zip and getting a PASS acceptance report, clean the local secret artifacts:

```powershell
powershell -ExecutionPolicy Bypass -File deploy/cleanup-real-upload-artifacts.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -ConfirmUploadedAndAccepted
```

Each release also includes `UPLOAD_THIS_PACKAGE.txt`; open that first to avoid uploading the wrong zip.

Before or during DNS/SSL cutover, generate the domain report:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/domain-cutover-report-vanphuc.ps1
```

It writes `DOMAIN_CUTOVER_REPORT.md` with root/www DNS, SSL, HTTP->HTTPS and canonical redirect status. When DNS/SSL should be final, rerun it with `-RequireReady`.

After upload, SSL, `config.php` and DB import, let the watcher retry the final gate instead of rerunning checks by hand:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
```

This one-command post-upload autopilot writes `DOMAIN_CUTOVER_REPORT.md`, waits for hosting readiness, runs the acceptance report, verifies `ACCEPTANCE_REPORT.md` says `Final status: PASS`, and writes `HOSTING_HANDOFF_COMPLETE.md`.

If you want only the wait/retry layer, run:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
```

It writes `hosting-wait-reports/<timestamp>/HOSTING_WAIT_REPORT.md` with every attempt log.

For a saved local proof before upload, run:

```powershell
npm run preupload:report
```

It writes `qa/preupload/<timestamp>/PREUPLOAD_REPORT.md`.

Then run the final local audit against the latest release and matching report:

```powershell
npm run final:audit
```

That command runs `deploy/final-prehosting-audit.ps1`.

To directly drill the exact upload zip locally:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-release-upload-drill.ps1 -RequirePhp
```

This drill also logs in with a temporary admin credential, uploads a 1x1 PNG through `/api/uploads`, and confirms the image is served from `backend/uploads`.

To safely test configured zip creation in a temp release copy:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp
```

If PHP CLI is installed locally, run this extra strict router smoke before upload:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-php-runtime.ps1 -RequirePhp
```

For Mat Bao CS2 same-domain setup, upload the full package to `public_html`, then configure:

```text
BASE_URL=https://sodovanphuc.vn/backend
FRONTEND_URL=https://sodovanphuc.vn
Healthcheck=https://sodovanphuc.vn/api/svp/health
```

DNS before handoff: `sodovanphuc.vn` and `www.sodovanphuc.vn` must land on the same hosting target, with `www` redirecting to `https://sodovanphuc.vn`. `npm run hosting:diagnose` fails if `www` still points to a different old host.

After DB import and `config.php` are done on the real hosting, run:

```bash
npm run hosting:ready
```

`hosting:ready` runs the release self-check, strict diagnostic, API smoke test, and live browser smoke test. If it fails, use `npm run hosting:diagnose` for the failure table and `npm run hosting:browser` for browser-only checks. The gate verifies DNS/SSL, pages, API JSON, AI proxy JSON/fallback, required PHP extensions, `backend/uploads` and PHP temp writability, security headers, canonical redirect, blank-screen/runtime failures, SPA fallback, responsive overflow, and that backend internals such as `backend/config`, `backend/sql` and `backend/lib` are not publicly readable.

After the first real upload/import succeeds, run `npm run hosting:ready:write` once to verify create/update/media/timeline/version/customer/referral/audit workflows on the live database, a real multipart image upload with admin cleanup when `SVP_LIVE_ADMIN_PASSWORD` is set, and a real browser property form submission. It cleans the temporary uploaded image/customer/need/schedule/referral records after verification and soft-deletes the temporary properties.

To also test the configured admin login without writing the password into reports, set it only in the current PowerShell session before the ready/acceptance command:

```powershell
$env:SVP_LIVE_ADMIN_USERNAME = "admin"
$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
```

For the least manual final check, run `npm run hosting:acceptance`. It runs the full API + live browser UI write workflow gate, optional admin API/JWT + browser login smoke and real image upload/delete smoke when `SVP_LIVE_ADMIN_PASSWORD` is set, and writes `qa/hosting-acceptance/<timestamp>/ACCEPTANCE_REPORT.md` with per-step logs.

```powershell
Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

The root checklist is the source of truth:

```text
../DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md
```

On Mat Bao, import `backend/sql/sodovanphuc_import_all.sql` in phpMyAdmin first. It installs the full database: base app schema, required migrations, base sample data, SVP schema, SVP seed, SVP verifier, then `backend/sql/database_verify.sql`. The base and SVP seed rows use `ON DUPLICATE KEY UPDATE`, so re-running refreshes default rows instead of duplicating them. Upgrade migrations use `information_schema` + prepared DDL for MySQL/MariaDB compatibility and do not need `DELIMITER`/procedure support. If phpMyAdmin rejects the bundled file, import the split files in this order: `backend/sql/schema.sql`, `backend/sql/002_add_property_video_url.sql`, `backend/sql/003_add_property_social_links.sql`, `backend/sql/004_users_banners_blog.sql`, `backend/sql/005_chat_messages.sql`, `backend/sql/006_property_likes.sql`, `backend/sql/007_add_coordinates.sql`, `backend/sql/007_add_expiry_notified.sql`, `backend/sql/008_bank_transfers.sql`, `backend/sql/009_property_image_unique.sql`, `backend/sql/seed.sql`, `backend/sql/sodovanphuc_schema.sql`, `backend/sql/sodovanphuc_seed.sql`, then run `backend/sql/sodovanphuc_verify.sql` and `backend/sql/database_verify.sql`; the core checks must show `PASS` or `OK`.













































