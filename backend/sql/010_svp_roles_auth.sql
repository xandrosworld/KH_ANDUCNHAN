-- ═══════════════════════════════════════════════════════════════════════════
--  Migration 010: SVP Roles & Auth Tables
--  Sổ Đỏ Vạn Phúc - Hệ thống phân quyền vai trò
--  Run after 004_users_banners_blog.sql + sodovanphuc_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ─── Extend users table with SVP-specific columns ────────────────────────────
-- Using prepared statement pattern for safe "ADD COLUMN IF NOT EXISTS"

-- svp_id: Mã nhân viên SVP (e.g. SVP000001)
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `svp_id` VARCHAR(64) DEFAULT NULL AFTER `id`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'svp_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Unique index on svp_id
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD UNIQUE KEY `uq_svp_id` (`svp_id`)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'uq_svp_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- cccd: Căn cước công dân
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `cccd` VARCHAR(20) DEFAULT NULL AFTER `phone`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'cccd'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- referral_code: Mã giới thiệu của user này
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `referral_code` VARCHAR(80) DEFAULT NULL AFTER `cccd`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'referral_code'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Unique index on referral_code
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD UNIQUE KEY `uq_referral_code` (`referral_code`)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'uq_referral_code'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- referred_by: user_id của người giới thiệu
SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `referred_by` VARCHAR(64) DEFAULT NULL AFTER `referral_code`',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'referred_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ─── SVP User Roles ─────────────────────────────────────────────────────────
-- Mỗi user có thể có nhiều vai trò, mỗi vai trò có trạng thái riêng.

CREATE TABLE IF NOT EXISTS `svp_user_roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `role_slug` VARCHAR(50) NOT NULL COMMENT 'admin, giam_doc, truong_phong, chuyen_gia, chuyen_vien, hoc_vien, ctv_khach, ctv_nguon, chu_nha, khach_mua, nguoi_gioi_thieu, doi_tac',
  `status` ENUM('pending','approved','rejected','disabled') DEFAULT 'pending',
  `applied_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `approved_by` VARCHAR(64) DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_user_role` (`user_id`, `role_slug`),
  INDEX `idx_role_slug` (`role_slug`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── SVP Role Applications ──────────────────────────────────────────────────
-- Lưu lịch sử đơn xin cấp vai trò, admin duyệt/từ chối.

CREATE TABLE IF NOT EXISTS `svp_role_applications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `role_slug` VARCHAR(50) NOT NULL,
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `reason` TEXT COMMENT 'Lý do đăng ký vai trò',
  `reviewed_by` VARCHAR(64) DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `admin_notes` TEXT COMMENT 'Ghi chú của admin khi duyệt',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_role_slug` (`role_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── SVP Favorites (Buyer Wishlist) ─────────────────────────────────────────
-- Danh sách yêu thích của người mua.

CREATE TABLE IF NOT EXISTS `svp_favorites` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_property` (`user_id`, `property_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_property_id` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
