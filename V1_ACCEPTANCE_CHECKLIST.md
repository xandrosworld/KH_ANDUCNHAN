# V1 Acceptance Checklist - So Do Van Phuc

Ngay 29/06/2026

## Trang thai da kiem

- Build frontend: PASS (`npm run build`)
- PHP syntax: PASS (`npm run php:parse`)
- Visual/mobile/desktop smoke: PASS 98/98 (`npm run test:visual`)
- Hosting smoke domain `https://sodovanphuc.vn`: PASS truoc commit moi (`npm run hosting:smoke`)

## V1 dang dap ung

- Dang nhap/dang ky theo luong moi: ho ten, dien thoai, email, ma gioi thieu, mat khau, chon mot hoac nhieu vai tro.
- Tai khoan co ban duoc dung ngay; vai tro tu Chuyen vien tro len co the cho duyet rieng.
- Admin cau hinh loai tai khoan nao can duyet/duoc dung ngay.
- Admin cau hinh ten truong nhap lieu nha cho cac field quan trong.
- Admin cau hinh danh muc van hanh: cong ty, tag nha, trang thai nha, quyen xem, tieu chi diem ky nha, phan khuc gia, trang thai khach.
- Form Chu nha gui ban co phap ly/vi tri, GPS, so to/thua dat, quy hoach, gia, anh nha.
- Form Chuyen gia dang nha co CCCD, GPS, so to/thua dat, quy hoach, hoa hong, dia chi bao mat, ghi chu noi bo, anh so/hd/selfie.
- Kiem tra trung nha theo dia chi, so so, so to, thua dat, SĐT chu nha va GPS.
- Upload anh form Chu nha/Chuyen gia gui dung field backend `images`.
- Chi tiet nha Chuyen gia hien thi lai cac field V1 moi.
- API danh sach/chi tiet nha loc du lieu nhay cam theo vai tro.
- Public/Khach mua khong thay dia chi chinh xac, GPS, chu nha, SĐT, so/giay to, hoa hong, ghi chu noi bo.
- Media nha loc anh nhay cam: public/nhom khong du quyen khong thay anh so, hop dong, selfie, ho so duyet.
- Quyen xem da bo ngon ngu source cu kieu Lop 4/Lop 8.

## Can tiep tuc truoc ban giao chinh thuc

- Test live sau khi deploy commit moi: hosting smoke, browser smoke, dang nhap admin neu co mat khau.
- Tao user that cho cac vai tro chinh va test luong tren live: Chu nha, Khach mua, Nguoi gioi thieu, CTV, Chuyen vien, Chuyen gia, Admin.
- Lam sach du lieu smoke/demo tren live va seed du lieu mau co hon.
- Rasoat tiep UI theo anh khach gui cho tung dashboard mobile.
- Doi logo/asset cuoi cung neu khach gui ban chinh thuc.
