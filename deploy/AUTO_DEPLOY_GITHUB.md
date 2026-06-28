# Auto deploy từ GitHub lên hosting Mắt Bão

Workflow đã nằm tại `.github/workflows/deploy.yml`.

Khi push lên nhánh `main`, GitHub Actions sẽ:

1. Cài dependency bằng `npm ci`.
2. Build frontend bằng `npm run build`.
3. Đóng gói `dist/` và `backend/`.
4. Upload lên VPS qua SSH bằng tar stream.
5. Giữ nguyên `backend/config/config.php` và `backend/uploads/` trên server.
6. Gọi `https://sodovanphuc.vn/api/svp/health` để smoke test.

## GitHub Secrets cần tạo

Vào repo GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`.

Tạo các secret sau:

- `MATBAO_SSH_HOST`: IP hoặc host SSH của VPS.
- `MATBAO_SSH_USER`: user SSH có quyền ghi vào webroot.
- `MATBAO_SSH_PRIVATE_KEY`: private key SSH dùng riêng cho GitHub Actions.
- `MATBAO_SSH_PORT`: port SSH, thường là `22`.
- `MATBAO_WEBROOT`: thư mục public web, hiện dùng `/var/www/vanphuc/public_html`.

## Tạo SSH key deploy

Tạo key riêng cho GitHub Actions ở máy local:

```bash
ssh-keygen -t ed25519 -C "github-actions-sodovanphuc" -f .github_sodovanphuc_deploy -N ""
```

Đưa public key vào server:

```bash
cat .github_sodovanphuc_deploy.pub
```

Copy nội dung public key, SSH vào VPS rồi thêm vào:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Copy nội dung private key `.github_sodovanphuc_deploy` vào GitHub secret `MATBAO_SSH_PRIVATE_KEY`.

## Lưu ý vận hành

- Không commit `backend/config/config.php`.
- Không commit file `.env`, zip release, ảnh QA, log, hoặc upload thật của khách.
- Workflow không tự import SQL để tránh động vào dữ liệu thật khi gần bàn giao.
- Nếu có thay đổi schema DB, chạy migration thủ công trước hoặc sau deploy rồi kiểm lại healthcheck.
