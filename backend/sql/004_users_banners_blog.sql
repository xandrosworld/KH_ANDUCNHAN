-- ═══════════════════════════════════════════════════════════════════════════
--  Migration 004: Users, Banners, Blog tables
--  Run on production DB after schema.sql + previous migrations.
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL DEFAULT '',
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` ENUM('user','agent','admin') DEFAULT 'user',
  `status` ENUM('active','suspended','unverified') DEFAULT 'unverified',
  `avatar_url` VARCHAR(1000) DEFAULT NULL,
  `reset_token` VARCHAR(255) DEFAULT NULL,
  `reset_token_expires` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Banners ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `image_url` VARCHAR(1000) NOT NULL,
  `link_url` VARCHAR(1000) DEFAULT NULL,
  `position` ENUM('hero','sidebar','listing','footer') DEFAULT 'hero',
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `starts_at` DATETIME DEFAULT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_position` (`position`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Blog Posts ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `excerpt` TEXT DEFAULT NULL,
  `content` LONGTEXT NOT NULL,
  `cover_image` VARCHAR(1000) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT 'news',
  `tags` VARCHAR(500) DEFAULT NULL,
  `author_name` VARCHAR(200) DEFAULT 'So Do Van Phuc',
  `status` ENUM('draft','published','archived') DEFAULT 'draft',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_slug` (`slug`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Add owner_id to properties (link listing to user) ──────────────────────

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `owner_id` VARCHAR(64) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'owner_id'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD INDEX `idx_owner_id` (`owner_id`)',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND index_name = 'idx_owner_id'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;
