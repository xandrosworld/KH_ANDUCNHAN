-- Recruitment content and candidate pipeline for So Do Van Phuc.
-- Safe to run more than once on a fresh or partially installed database.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `svp_recruitment_posts` (
  `id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `eyebrow` VARCHAR(255) DEFAULT NULL,
  `summary` TEXT DEFAULT NULL,
  `recruiter_name` VARCHAR(180) DEFAULT NULL,
  `recruiter_title` TEXT DEFAULT NULL,
  `cta_label` VARCHAR(180) DEFAULT NULL,
  `banner_url` VARCHAR(1000) DEFAULT NULL,
  `content_json` LONGTEXT DEFAULT NULL,
  `content_revision` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
  `application_status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `published_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `updated_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_recruitment_posts_slug` (`slug`),
  INDEX `idx_svp_recruitment_posts_status` (`status`, `application_status`, `published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_recruitment_candidates` (
  `id` VARCHAR(64) NOT NULL,
  `post_id` VARCHAR(64) DEFAULT NULL,
  `post_slug` VARCHAR(180) DEFAULT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `position_slug` VARCHAR(80) DEFAULT NULL,
  `source_referral_code` VARCHAR(80) DEFAULT NULL,
  `pipeline_status` ENUM('registered','contacted','interview','training','activated','active','rejected') DEFAULT 'registered',
  `utm_source` VARCHAR(180) DEFAULT NULL,
  `utm_medium` VARCHAR(180) DEFAULT NULL,
  `utm_campaign` VARCHAR(180) DEFAULT NULL,
  `utm_content` VARCHAR(180) DEFAULT NULL,
  `utm_term` VARCHAR(180) DEFAULT NULL,
  `referrer_url` VARCHAR(1000) DEFAULT NULL,
  `registration_url` VARCHAR(1000) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_recruitment_post_user` (`post_id`, `user_id`),
  INDEX `idx_candidate_status` (`pipeline_status`),
  INDEX `idx_candidate_post` (`post_id`, `position_slug`, `created_at`),
  INDEX `idx_candidate_utm` (`utm_source`, `utm_campaign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
