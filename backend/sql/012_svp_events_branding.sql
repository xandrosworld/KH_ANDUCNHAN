-- Events, registrations and shared branding for So Do Van Phuc.
-- Safe to run more than once.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `svp_events` (
  `id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `eyebrow` VARCHAR(255) DEFAULT NULL,
  `summary` TEXT DEFAULT NULL,
  `speaker_name` VARCHAR(180) DEFAULT NULL,
  `speaker_title` TEXT DEFAULT NULL,
  `format_label` VARCHAR(180) DEFAULT NULL,
  `schedule_label` VARCHAR(255) DEFAULT NULL,
  `cta_label` VARCHAR(180) DEFAULT NULL,
  `banner_url` VARCHAR(1000) DEFAULT NULL,
  `content_json` LONGTEXT DEFAULT NULL,
  `content_revision` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
  `registration_status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `published_at` DATETIME DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `updated_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_events_slug` (`slug`),
  INDEX `idx_svp_events_status` (`status`, `registration_status`, `published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_event_registrations` (
  `id` VARCHAR(64) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `event_slug` VARCHAR(180) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `care_status` ENUM('new','contacted','confirmed','joined_group','converted','declined') NOT NULL DEFAULT 'new',
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
  UNIQUE KEY `uq_svp_event_user` (`event_id`, `user_id`),
  INDEX `idx_svp_event_reg_status` (`event_id`, `care_status`, `created_at`),
  INDEX `idx_svp_event_reg_utm` (`utm_source`, `utm_campaign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
