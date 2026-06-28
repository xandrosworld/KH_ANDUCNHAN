-- ═══════════════════════════════════════════════════════════════════════════
--  So Do Van Phuc Database Schema
--  MySQL / MariaDB — InnoDB + UTF8MB4
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── Properties ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `listing_type` ENUM('sale','rent') NOT NULL DEFAULT 'sale',
  `property_type` VARCHAR(100) DEFAULT 'Single Family',
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `bedrooms` INT DEFAULT 0,
  `bathrooms` INT DEFAULT 0,
  `sqft` INT DEFAULT 0,
  `address` VARCHAR(500) NOT NULL,
  `city` VARCHAR(100) DEFAULT '',
  `state` VARCHAR(100) DEFAULT '',
  `zip` VARCHAR(20) DEFAULT '',
  `latitude` DECIMAL(10,7) DEFAULT NULL,
  `longitude` DECIMAL(10,7) DEFAULT NULL,
  `description` TEXT,
  `status` ENUM('active','pending','hidden','expired') DEFAULT 'active',
  `is_vip` TINYINT(1) DEFAULT 0,
  `expires_at` DATETIME DEFAULT NULL,
  `expiry_notified` TINYINT(1) DEFAULT 0,
  `youtube_url` VARCHAR(500) DEFAULT NULL,
  `facebook_url` VARCHAR(500) DEFAULT NULL,
  `instagram_url` VARCHAR(500) DEFAULT NULL,
  `tiktok_url` VARCHAR(500) DEFAULT NULL,
  `x_url` VARCHAR(500) DEFAULT NULL,
  `whatsapp_url` VARCHAR(500) DEFAULT NULL,
  `video_url` VARCHAR(1000) DEFAULT NULL,
  `contact_name` VARCHAR(200) DEFAULT NULL,
  `contact_phone` VARCHAR(50) DEFAULT NULL,
  `contact_email` VARCHAR(200) DEFAULT NULL,
  `owner_id` VARCHAR(64) DEFAULT NULL,
  `likes_count` INT DEFAULT 0,
  `main_image` VARCHAR(1000) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_listing_type` (`listing_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_city` (`city`),
  INDEX `idx_state` (`state`),
  INDEX `idx_price` (`price`),
  INDEX `idx_bedrooms` (`bedrooms`),
  INDEX `idx_property_type` (`property_type`),
  INDEX `idx_is_vip` (`is_vip`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Property Images ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `property_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` VARCHAR(64) NOT NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_property_id` (`property_id`),
  UNIQUE KEY `uq_property_image_url` (`property_id`, `image_url`(255)),
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Inquiries ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `message` TEXT,
  `status` ENUM('new','read','replied') DEFAULT 'new',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reports ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) DEFAULT NULL,
  `property_address` VARCHAR(500) DEFAULT '',
  `reason` ENUM('spam','incorrect','scam','duplicate','other') DEFAULT 'other',
  `description` TEXT,
  `contact_email` VARCHAR(200) DEFAULT NULL,
  `status` ENUM('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Schedules ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) DEFAULT NULL,
  `property_address` VARCHAR(500) DEFAULT '',
  `name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(200) DEFAULT NULL,
  `date` VARCHAR(20) DEFAULT NULL,
  `time` VARCHAR(20) DEFAULT NULL,
  `message` TEXT,
  `status` ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  `paypal_order_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
