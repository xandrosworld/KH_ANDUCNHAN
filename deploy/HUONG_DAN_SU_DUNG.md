# Huong Dan Deploy - So Do Van Phuc

Domain chinh thuc:

```text
sodovanphuc.vn
```

## Goi Nen Upload

```text
app/release/sodovanphuc-20260628-214600/sodovanphuc-full-public_html.zip
```

Goi nay phu hop voi Mat Bao CS2 Linux tam thoi: frontend nam tai `public_html`, backend nam tai `public_html/backend`.

## Cau Hinh Sau Upload

Copy:

```text
public_html/backend/config/config.example.php
```

thanh:

```text
public_html/backend/config/config.php
```

Dien thong tin database, admin password hash, JWT secret, mail/SMTP do Mat Bao cung cap.

Neu muon tranh sua tay, chay script tao config o may local sau khi co thong tin DB:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File deploy/new-hosting-config.ps1 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..." -Force
npm run config:verify
```

`-AdminPassword` phai la mat khau manh: toi thieu 14 ky tu, co it nhat 3 nhom chu thuong/chu hoa/so/ky tu dac biet, va khong chua cac tu yeu nhu `admin`, `vanphuc`, `password`, `123456`.

Nen dung lenh nay khi da co DB that, de tao goi upload configured va manifest an toan:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File deploy/prepare-real-upload.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..."
```

Lua chon an toan hon de khong luu secret vao command history:

```powershell
$env:SVP_DB_PASS = "..."
$env:SVP_ADMIN_PASSWORD = "..."
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File deploy/prepare-real-upload.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..."
Remove-Item Env:\SVP_DB_PASS, Env:\SVP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

Lenh nay tao `sodovanphuc-configured-public_html.zip`, drill chinh zip configured do, verify manifest va ghi `REAL_UPLOAD_READY.md` khong chua credential.

Lenh cap thap neu can:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File deploy/build-configured-public-html.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -DbName "..." -DbUser "..." -DbPass "..." -AdminPassword "..." -Force
```

Goi `sodovanphuc-configured-public_html.zip` co chua secret that, chi dung de upload len hosting that va khong commit/chia se.

Sau khi upload configured zip va acceptance report PASS, don cac artifact secret local:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File deploy/cleanup-real-upload-artifacts.ps1 -ReleasePath release/sodovanphuc-20260628-214600 -ConfirmUploadedAndAccepted
```

Trong release co file `UPLOAD_THIS_PACKAGE.txt`; mo file nay truoc de tranh upload nham zip.

Truoc hoac trong luc tro DNS/bat SSL, tao report cutover domain:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/domain-cutover-report-vanphuc.ps1
```

Lenh nay ghi `DOMAIN_CUTOVER_REPORT.md`, gom DNS root/www, SSL, HTTP->HTTPS va canonical redirect. Khi DNS/SSL da chot, them `-RequireReady` de lenh fail neu con loi cutover.

Sau khi upload, bat SSL, tao `config.php` va import DB, neu can cho DNS/SSL/API on dinh thi de watcher tu retry:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow
```

Lenh autopilot nay ghi `DOMAIN_CUTOVER_REPORT.md`, doi hosting ready, chay acceptance report, xac nhan `ACCEPTANCE_REPORT.md` la `Final status: PASS` va ghi `HOSTING_HANDOFF_COMPLETE.md`.

Neu chi muon wait/retry rieng:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow
```

Lenh nay ghi `hosting-wait-reports/<timestamp>/HOSTING_WAIT_REPORT.md` kem log tung lan thu.

Lenh tong de do phai test tay truoc hosting:

```powershell
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
npm run prehost:proof
```

Lenh nay chay `prehost`, cap nhat tai lieu sang release moi nhat, tao pre-upload report, chay final audit va ghi `qa/prehosting-proof/<release>/PREHOSTING_PROOF.md`.

Truoc khi upload, chay `npm run preupload:report` de luu bang chung local vao `qa/preupload/<timestamp>/PREUPLOAD_REPORT.md`. Report nay gom ca buoc bung dung zip upload vao `public_html` tam, tao config tam va test frontend/API.

Sau do chay `npm run final:audit`; lenh nay goi `final-prehosting-audit.ps1` de xac nhan tai lieu, checksum, zip upload, pre-upload report va trang thai khong co secret deu dang tro dung release hien tai.

Neu muon chay rieng buoc drill dung zip upload:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-release-upload-drill.ps1 -RequirePhp
```

Buoc drill nay cung login admin tam, upload PNG 1x1 qua `/api/uploads` va doc lai file tu `backend/uploads`.

Neu muon test rieng luong tao configured zip bang credential gia trong temp folder:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-configured-upload-zip-dryrun.ps1 -RequirePhp
```

Neu may local co PHP CLI, co the test router PHP cua release truoc khi upload:

```powershell
powershell -ExecutionPolicy Bypass -File release/sodovanphuc-20260628-214600/tools/test-php-runtime.ps1 -RequirePhp
```

Gia tri URL:

```text
BASE_URL=https://sodovanphuc.vn/backend
FRONTEND_URL=https://sodovanphuc.vn
CORS_ORIGINS=https://sodovanphuc.vn, https://www.sodovanphuc.vn
```

Import SQL uu tien bang file gop:

```text
backend/sql/sodovanphuc_import_all.sql
```

File nay cai full database: base app schema, cac migration can thiet, seed mau nen, SVP schema, SVP seed, SVP verify va full database verify dung thu tu. Seed mau nen va seed cau hinh mac dinh SVP dung `ON DUPLICATE KEY UPDATE`, nen neu import lai thi chi cap nhat dong mac dinh, khong nhan doi du lieu seed. Migration upgrade dung `information_schema` + prepared DDL de tuong thich MySQL/MariaDB va khong can `DELIMITER`/procedure support. Neu phpMyAdmin khong nhan file gop thi dung fallback theo dung thu tu:

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

Sau import, cac dong verify chinh can hien `PASS` hoac `OK`.

Kiem tra:

```text
https://sodovanphuc.vn/api/svp/health
```

Sau khi healthcheck `status=ready`, chay smoke test domain that:

```bash
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
npm run hosting:ready
```

Lenh nay la cong ban giao cuoi: tu chay self-check release, diagnose strict, API smoke test va live browser smoke test. No kiem tra DNS/SSL, route chinh, API healthcheck, required PHP extensions, quyen ghi `backend/uploads` va PHP temp, API config/collection, security headers, canonical redirect, loi runtime/trang trang/SPA fallback/overflow va cac file noi bo `backend/config`, `backend/sql`, `backend/lib` khong bi public. Neu fail, chay `npm run hosting:diagnose` de xem bang loi hoac `npm run hosting:browser` de kiem rieng trinh duyet.

Sau khi import DB that thanh cong, chay them mot lan `npm run hosting:ready:write` de test workflow ghi du lieu tren hosting that: tao/sua nha, media, timeline, version, khach hang, nhu cau, lich xem, referral, audit log, upload anh multipart that kem cleanup admin neu co `SVP_LIVE_ADMIN_PASSWORD`, va tao nha qua form trinh duyet that. Lenh nay tu don file anh upload tam/customer/need/schedule/referral tam va soft-delete cac nha test.

De test luon mat khau admin/JWT/form dang nhap ma khong ghi mat khau vao report, set tam bien moi truong trong phien PowerShell hien tai:

```powershell
$env:SVP_LIVE_ADMIN_USERNAME = "admin"
$env:SVP_LIVE_ADMIN_PASSWORD = "MAT_KHAU_ADMIN_MANH_DA_DUNG_KHI_TAO_CONFIG"
```

Neu muon co bang chung ban giao luu thanh file, chay `npm run hosting:acceptance`. Lenh nay gom ca API write workflow + live browser UI write workflow, them admin API/JWT + browser login smoke va upload/delete anh that neu co `SVP_LIVE_ADMIN_PASSWORD`, va ghi report vao `qa/hosting-acceptance/<timestamp>/ACCEPTANCE_REPORT.md`.

```powershell
Remove-Item Env:\SVP_LIVE_ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

Release moi co `CHECKSUMS-SHA256.txt` de doi chieu zip truoc khi upload.

Checklist day du nam tai:

```text
../../DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md
```













































