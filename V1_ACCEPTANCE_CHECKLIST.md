# V1 Acceptance Checklist - So Do Van Phuc

Ngay 29/06/2026

## Trang thai da kiem

- Build frontend: PASS 29/06/2026 sau dot bo sung quy trinh dang nha V1 (`npm run build`)
- PHP syntax: PASS 29/06/2026 sau dot bo sung quy trinh dang nha V1 (`npm run php:parse`)
- Visual/mobile/desktop smoke: PASS 100/100 29/06/2026 sau dot bo sung workflow admin cau hinh duyet tai khoan/ten truong (`npm run test:visual`)
- Hosting smoke domain `https://sodovanphuc.vn`: PASS sau deploy commit `fc73dfd` (`npm run hosting:smoke`)
- Live write workflow smoke domain `https://sodovanphuc.vn`: PASS 30/06/2026 (`npm run hosting:smoke:write`) - da test admin auth, upload live, tao/xoa inquiry/report/schedule, tao/cap nhat/xoa property, media, customer, customer need, viewing schedule, referral, audit va cleanup thanh cong.
- Live browser smoke domain `https://sodovanphuc.vn`: PASS 36/36 tren mobile + desktop 30/06/2026 (`npm run hosting:browser`) - dang nhap admin live, redirect route bao ve, public routes, khong runtime/HTTP failure.
- Hosting acceptance domain `https://sodovanphuc.vn`: PASS 30/06/2026 (`npm run hosting:acceptance`) - report tai `qa/hosting-acceptance/20260630-003032/ACCEPTANCE_REPORT.md`.
- Temp admin live da duoc tao rieng de test, da cleanup bang workflow, da xoa GitHub secret va file mat khau local sau khi test.

## V1 dang dap ung

- Dang nhap/dang ky theo luong moi: ho ten, dien thoai, email, ma gioi thieu, mat khau, chon mot hoac nhieu vai tro.
- Tai khoan co ban duoc dung ngay; vai tro tu Chuyen vien tro len co the cho duyet rieng.
- Admin cau hinh loai tai khoan nao can duyet/duoc dung ngay theo tung vai tro.
- Dang ky moi va xin them vai tro deu doc cau hinh duyet tai khoan tai thoi diem tao yeu cau.
- Admin cau hinh ten truong nhap lieu nha cho cac field quan trong, giup doi ten goi ma khong sua code.
- Da co workflow visual rieng cho Admin doi "Chuyen vien" tu can duyet sang dung ngay va doi ten field "Ten chu nha" thanh ten moi tren man Cau hinh van hanh.
- Admin cau hinh danh muc van hanh: cong ty, tag nha, trang thai nha, quyen xem, tieu chi diem ky nha, phan khuc gia, trang thai khach.
- Form Chu nha gui ban co phap ly/vi tri, GPS, so to/thua dat, quy hoach, gia, anh nha, link video neu co va checkbox xac nhan thong tin dung/quy trinh lien he xac minh.
- Form Chuyen gia dang nha co CCCD, email chu nha, GPS, so to/thua dat, quy hoach, hoa hong, hop dong trich thuong/tinh trang ky, dia chi bao mat, ghi chu noi bo, link video, anh so/hd/selfie.
- Form Chuyen gia bat buoc kiem tra trung va hoan tat checklist xac minh truoc khi gui duyet: dung chu nha, chong trung, giay to/so, quy hoach, hoa hong, san sang phan phoi.
- Kiem tra trung nha theo dia chi, so so, so to, thua dat, SĐT chu nha va GPS.
- Upload anh form Chu nha/Chuyen gia gui dung field backend `images`.
- Chi tiet nha Chuyen gia hien thi lai cac field V1 moi, gom email chu nha, hop dong, video va checklist xac minh.
- API danh sach/chi tiet nha loc du lieu nhay cam theo vai tro.
- Public/Khach mua khong thay dia chi chinh xac, GPS, chu nha, SĐT, so/giay to, hoa hong, ghi chu noi bo.
- Media nha loc anh nhay cam: public/nhom khong du quyen khong thay anh so, hop dong, selfie, ho so duyet.
- Quyen xem da bo ngon ngu source cu kieu Lop 4/Lop 8.
- Da lam sach/nang cap UI mobile va desktop cho cac man V1 chinh: Chu nha dashboard/nha cua toi, Khach mua dashboard/tim nha/yeu thich, Chuyen gia dashboard/kho nha, Chuyen vien dashboard/khach hang/them khach/tim nha/lich xem, Admin dashboard/nguoi dung/duyet vai tro/nha/khach hang/nhat ky.
- Nhat ky he thong hien thi theo ngon ngu van hanh, khong show JSON/raw log cho nguoi dung cuoi.
- Da sua loi CSS global ep mau heading lam chu banner mobile bi toi tren nen toi; heading hien tai lay mau theo component.
- Workflow visual da test: dang nhap vao dung dashboard, Chuyen gia dung AI mo ta va dang nha, Chuyen vien tao khach mua, Profile doi mat khau/xin them vai tro.
- Workflow visual Chuyen gia da test theo luong moi: nhap nguon, ghi ghi chu xu ly trung, bam kiem tra trung, tick checklist xac minh, dung AI viet mo ta, gui duyet.
- Live write smoke da test API nghiep vu that tren hosting: tao nha, doc chi tiet, cap nhat nha, upload/tao media, kiem timeline/version, tao khach, nhu cau, lich xem, referral, audit va cleanup thanh cong.
- Admin live dashboard/API da test qua browser sau dang nhap; endpoint `/api/svp/admin/dashboard` da sua de chay dung voi schema live.
- Deploy GitHub Actions da them reset PHP OPcache sau moi lan upload de tranh server chay PHP cache cu.

## Yeu cau moi 29/06/2026 19:28

- Khach yeu cau admin tu cai dat duoc loai tai khoan nao can duyet hoac khong can duyet trong tuong lai.
- Trang thai V1: da co trong Admin > Cau hinh van hanh > Duyet tai khoan; da them test thao tac luu tren mobile/desktop.
- Khach yeu cau ten goi cac truong du lieu linh hoat nhat co the.
- Trang thai V1: da co nhom Admin > Cau hinh van hanh > Ten truong nhap lieu nha cho cac truong dang nha quan trong; da them test thao tac doi ten field tren mobile/desktop.
- Ngoai V1: neu muon them chuc danh dong, vai tro dong, pham vi du lieu, uy quyen theo thoi gian va ma tran quyen tung module thi tinh vao module phan quyen to chuc nang cao.

## Can tiep tuc truoc ban giao chinh thuc

- Tao user that cho cac vai tro chinh va test luong tren live: Chu nha, Khach mua, Nguoi gioi thieu, CTV, Chuyen vien, Chuyen gia, Admin.
- Seed du lieu mau co hon neu muon demo cho khach bang data dep thay vi so lieu rong.
- Rasoat tiep UI theo anh khach gui cho tung dashboard mobile.
- Doi logo/asset cuoi cung neu khach gui ban chinh thuc.
