# So Do Van Phuc Backend API

Backend PHP/MySQL cho he thong noi bo So Do Van Phuc, toi uu de deploy tren Mat Bao CS2 Linux theo domain chinh:

```text
https://sodovanphuc.vn
```

## Cach Deploy Mac Dinh

Dung goi:

```text
sodovanphuc-full-public_html.zip
```

Giai nen vao hosting de co cau truc:

```text
public_html/index.html
public_html/assets/...
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
public_html/backend/sql/seed.sql
public_html/backend/sql/sodovanphuc_import_all.sql
public_html/backend/sql/sodovanphuc_schema.sql
public_html/backend/sql/sodovanphuc_seed.sql
public_html/backend/sql/sodovanphuc_verify.sql
public_html/backend/sql/database_verify.sql
```

Frontend se goi API qua duong dan cung domain:

```text
https://sodovanphuc.vn/api/*
```

Apache rewrite trong `public_html/.htaccess` se dua request `/api/*` ve:

```text
public_html/backend/api/index.php
```

## Cau Hinh Backend

Sau khi upload, copy:

```text
public_html/backend/config/config.example.php
```

thanh:

```text
public_html/backend/config/config.php
```

Dien gia tri that:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sodovanphuc_db');
define('DB_USER', 'sodovanphuc_user');
define('DB_PASS', 'replace_with_database_password');

define('BASE_URL', 'https://sodovanphuc.vn/backend');
define('FRONTEND_URL', 'https://sodovanphuc.vn');

define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD_HASH', '$2y$10$REPLACE_WITH_REAL_BCRYPT_HASH');
define('JWT_SECRET', 'replace_with_64_char_random_hex_string');
```

Mail mac dinh neu khach chua mua email rieng:

```php
define('MAIL_FROM', 'contact@sodovanphuc.vn');
define('ADMIN_EMAIL', 'contact@sodovanphuc.vn');
```

## Database

Tao MySQL database tren Mat Bao, sau do import trong phpMyAdmin uu tien bang file gop:

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

## Healthcheck

Sau khi co `config.php` va import database, mo:

```text
https://sodovanphuc.vn/api/svp/health
```

Ket qua mong doi:

```json
{
  "ok": true,
  "data": {
    "service": "so-do-van-phuc-api",
    "status": "ready",
    "database": {
      "connected": true,
      "schemaReady": true,
      "seedReady": true,
      "missingTables": [],
      "missingSeedGroups": [],
      "configOptionCount": 55
    }
  }
}
```

## API Chinh

```text
GET    /api/svp/health
GET    /api/svp/dashboard
GET    /api/svp/config
GET    /api/svp/properties
POST   /api/svp/properties
GET    /api/svp/properties/{id}
PUT    /api/svp/properties/{id}
POST   /api/svp/properties/{id}/media
GET    /api/svp/customers
POST   /api/svp/customers
GET    /api/svp/customer-needs
POST   /api/svp/customer-needs
GET    /api/svp/viewing-schedules
POST   /api/svp/viewing-schedules
GET    /api/svp/referrals
POST   /api/svp/referrals
GET    /api/svp/audit-logs
```

## Bao Mat Hosting

Release da co `.htaccess` de:

- Chan doc truc tiep `backend/config`, `backend/lib`, `backend/sql`.
- Chan file nhay cam nhu `.env`, `.sql`, `.log`, `.bak`.
- Tat PHP/script execution trong `backend/uploads`.
- Giu header `Authorization` cho JWT.

Sau khi hosting that san sang, chay tu may local:

```bash
cd C:\Users\Admin\Desktop\KHACHHANG\BDS_anduc\app
npm run hosting:smoke
```

Lenh nay kiem tra route chinh, healthcheck, va dam bao cac file noi bo khong public.

## Mode Nang Cap Sau Nay

Neu sau nay tach API subdomain, build lai frontend voi:

```text
VITE_API_BASE_URL=https://api.sodovanphuc.vn
```

Va doi backend:

```text
BASE_URL=https://api.sodovanphuc.vn
FRONTEND_URL=https://sodovanphuc.vn
```

Dot deploy hien tai khong can tao subdomain API.
