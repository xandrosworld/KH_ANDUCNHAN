-- ═══════════════════════════════════════════════════════════════════════════
--  Seed 011: SVP Test Accounts
--  Sổ Đỏ Vạn Phúc - 13 tài khoản test với các vai trò khác nhau
--  Run after 010_svp_roles_auth.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- Bcrypt hash cho tất cả password test (password = 'Test@123')
-- Hash: $2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq
SET @test_hash = '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq';

-- ─── 13 Test Users ───────────────────────────────────────────────────────────

-- 1. Admin
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000001', 'SVP000001', 'admin@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Quản Trị Viên', '0900000001', 'admin', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 2. Giám Đốc
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000002', 'SVP000002', 'giamdoc@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Nguyễn Văn Giám Đốc', '0900000002', 'admin', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 3. Trưởng Phòng
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000003', 'SVP000003', 'truongphong@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Trần Văn Phòng', '0900000003', 'agent', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 4. Chuyên Gia A
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000004', 'SVP000004', 'chuyengia.a@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Lê Chuyên Gia A', '0900000004', 'agent', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 5. Chuyên Gia B
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000005', 'SVP000005', 'chuyengia.b@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Phạm Chuyên Gia B', '0900000005', 'agent', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 6. Chuyên Viên
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000006', 'SVP000006', 'chuyenvien@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Hoàng Chuyên Viên', '0900000006', 'agent', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 7. CTV Khách
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000007', 'SVP000007', 'ctv.khach@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Ngô CTV Khách', '0900000007', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 8. CTV Nguồn
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000008', 'SVP000008', 'ctv.nguon@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Đỗ CTV Nguồn', '0900000008', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 9. Chủ Nhà
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000009', 'SVP000009', 'chunha@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Vũ Chủ Nhà', '0900000009', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 10. Khách Mua
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000010', 'SVP000010', 'khachmua@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Đinh Khách Mua', '0900000010', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 11. Người Giới Thiệu
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000011', 'SVP000011', 'gioithieu@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Bùi Giới Thiệu', '0900000011', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 12. Đối Tác
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000012', 'SVP000012', 'doitac@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Công ty Đối Tác ABC', '0900000012', 'user', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- 13. Đa Vai Trò (3 roles)
INSERT INTO `users` (`id`, `svp_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `referral_code`)
VALUES ('svp_user_000013', 'SVP000013', 'nhieuvaitro@sodovanphuc.vn', '$2y$10$8KzQ1X3PqMvR5nU7bJ2YeOw1fHgC4tL9xD6sA0iE2kY8mN3oP5rWq', 'Đa Vai Trò', '0900000013', 'agent', 'active', 'SVPSVP000')
ON DUPLICATE KEY UPDATE `svp_id` = VALUES(`svp_id`), `full_name` = VALUES(`full_name`), `role` = VALUES(`role`), `status` = VALUES(`status`), `referral_code` = VALUES(`referral_code`);

-- ─── Fix referral_code uniqueness (each user gets a unique code) ─────────────
UPDATE `users` SET `referral_code` = 'SVPSVP00' WHERE `id` = 'svp_user_000001' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_02' WHERE `id` = 'svp_user_000002' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_03' WHERE `id` = 'svp_user_000003' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_04' WHERE `id` = 'svp_user_000004' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_05' WHERE `id` = 'svp_user_000005' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_06' WHERE `id` = 'svp_user_000006' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_07' WHERE `id` = 'svp_user_000007' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_08' WHERE `id` = 'svp_user_000008' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_09' WHERE `id` = 'svp_user_000009' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_10' WHERE `id` = 'svp_user_000010' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_11' WHERE `id` = 'svp_user_000011' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_12' WHERE `id` = 'svp_user_000012' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');
UPDATE `users` SET `referral_code` = 'SVPSVP00_13' WHERE `id` = 'svp_user_000013' AND (`referral_code` IS NULL OR `referral_code` = 'SVPSVP000');


-- ─── SVP User Roles (status = approved for all test accounts) ────────────────

-- 1. Admin
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000001', 'admin', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 2. Giám Đốc
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000002', 'giam_doc', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 3. Trưởng Phòng
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000003', 'truong_phong', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 4. Chuyên Gia A
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000004', 'chuyen_gia', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 5. Chuyên Gia B
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000005', 'chuyen_gia', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 6. Chuyên Viên
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000006', 'chuyen_vien', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 7. CTV Khách
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000007', 'ctv_khach', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 8. CTV Nguồn
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000008', 'ctv_nguon', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 9. Chủ Nhà
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000009', 'chu_nha', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 10. Khách Mua
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000010', 'khach_mua', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 11. Người Giới Thiệu
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000011', 'nguoi_gioi_thieu', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 12. Đối Tác
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000012', 'doi_tac', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

-- 13. Đa Vai Trò — 3 roles
INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000013', 'chuyen_gia', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000013', 'chuyen_vien', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();

INSERT INTO `svp_user_roles` (`user_id`, `role_slug`, `status`, `approved_by`, `approved_at`)
VALUES ('svp_user_000013', 'nguoi_gioi_thieu', 'approved', 'svp_user_000001', NOW())
ON DUPLICATE KEY UPDATE `status` = 'approved', `approved_at` = NOW();
