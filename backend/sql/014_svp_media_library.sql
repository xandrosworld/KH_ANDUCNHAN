-- Shared media library for all SVP administration screens.
-- Safe to run repeatedly.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `svp_media_library` (
  `id` VARCHAR(64) NOT NULL,
  `url` VARCHAR(1000) NOT NULL,
  `original_name` VARCHAR(255) DEFAULT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `alt_text` VARCHAR(500) DEFAULT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `file_size` BIGINT UNSIGNED DEFAULT NULL,
  `width` INT UNSIGNED DEFAULT NULL,
  `height` INT UNSIGNED DEFAULT NULL,
  `source_context` VARCHAR(80) NOT NULL DEFAULT 'media_library',
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_media_library_url` (`url`),
  INDEX `idx_svp_media_library_created` (`deleted_at`, `created_at`),
  INDEX `idx_svp_media_library_source` (`source_context`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `svp_media_library`
  (`id`, `url`, `original_name`, `title`, `alt_text`, `mime_type`, `source_context`)
VALUES
  ('media_seed_logo', '/logo11.png', 'logo11.png', 'Logo Sổ Đỏ Vạn Phúc', 'Logo Sổ Đỏ Vạn Phúc', 'image/png', 'branding_logo'),
  ('media_seed_auth_banner', '/assets/svp-auth-hero.png', 'svp-auth-hero.png', 'Banner trang đăng nhập', 'Không gian bất động sản Sổ Đỏ Vạn Phúc', 'image/png', 'branding_banner'),
  ('media_seed_event_banner', '/assets/events/lam-nghe-moi-gioi-dung-luat.png', 'lam-nghe-moi-gioi-dung-luat.png', 'Banner sự kiện môi giới đúng luật', 'Sự kiện làm nghề môi giới đúng luật', 'image/png', 'event_banner'),
  ('media_seed_recruitment_banner', '/assets/recruitment/tuyen-dung-moi-gioi-van-phuc.jpg', 'tuyen-dung-moi-gioi-van-phuc.jpg', 'Banner tuyển dụng Vạn Phúc', 'Đội ngũ môi giới bất động sản Vạn Phúc', 'image/jpeg', 'recruitment_banner')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `alt_text` = VALUES(`alt_text`),
  `source_context` = VALUES(`source_context`),
  `deleted_at` = NULL;
