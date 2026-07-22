-- So Do Van Phuc schema extension
-- Run after the base backend schema/migrations if legacy endpoints are needed.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `svp_config_groups` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  `is_system` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_config_options` (
  `id` VARCHAR(64) NOT NULL,
  `group_id` VARCHAR(64) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  `score` DECIMAL(10,2) DEFAULT NULL,
  `metadata_json` LONGTEXT DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_option` (`group_id`, `value`),
  INDEX `idx_group_active` (`group_id`, `is_active`),
  CONSTRAINT `fk_svp_config_options_group`
    FOREIGN KEY (`group_id`) REFERENCES `svp_config_groups`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_form_schemas` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `json_schema` LONGTEXT NOT NULL,
  `ui_schema` LONGTEXT DEFAULT NULL,
  `version` INT DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_form_schema_code_version` (`code`, `version`),
  INDEX `idx_code_active` (`code`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_properties` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `title` VARCHAR(220) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `owner_name` VARCHAR(200) DEFAULT NULL,
  `owner_phone` VARCHAR(50) DEFAULT NULL,
  `book_serial` VARCHAR(120) DEFAULT NULL,
  `price` DECIMAL(18,2) DEFAULT 0.00,
  `price_unit` VARCHAR(40) DEFAULT 'VND',
  `area_m2` DECIMAL(12,2) DEFAULT NULL,
  `district` VARCHAR(120) DEFAULT NULL,
  `ward` VARCHAR(120) DEFAULT NULL,
  `address` VARCHAR(500) DEFAULT NULL,
  `hidden_address` VARCHAR(500) DEFAULT NULL,
  `company_unit_id` VARCHAR(64) DEFAULT NULL,
  `status_id` VARCHAR(64) DEFAULT NULL,
  `expert_id` VARCHAR(64) DEFAULT NULL,
  `assigned_user_id` VARCHAR(64) DEFAULT NULL,
  `signing_score` DECIMAL(10,2) DEFAULT 0,
  `visibility_json` LONGTEXT DEFAULT NULL,
  `tags_json` LONGTEXT DEFAULT NULL,
  `extra_json` LONGTEXT DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `updated_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp_properties_code` (`code`),
  INDEX `idx_price` (`price`),
  INDEX `idx_area` (`area_m2`),
  INDEX `idx_district_ward` (`district`, `ward`),
  INDEX `idx_company` (`company_unit_id`),
  INDEX `idx_status` (`status_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_property_media` (
  `id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) NOT NULL,
  `media_type` ENUM('image','video','document','house','book','contract','selfie','other') DEFAULT 'image',
  `url` VARCHAR(1000) NOT NULL,
  `caption` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_media_property` (`property_id`),
  CONSTRAINT `fk_svp_property_media_property`
    FOREIGN KEY (`property_id`) REFERENCES `svp_properties`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_property_versions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `property_id` VARCHAR(64) NOT NULL,
  `version_no` INT NOT NULL,
  `snapshot_json` LONGTEXT NOT NULL,
  `changed_by` VARCHAR(64) DEFAULT NULL,
  `change_note` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_svp_property_version` (`property_id`, `version_no`),
  INDEX `idx_property_versions_property` (`property_id`),
  CONSTRAINT `fk_svp_property_versions_property`
    FOREIGN KEY (`property_id`) REFERENCES `svp_properties`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_property_timeline` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `property_id` VARCHAR(64) NOT NULL,
  `event_type` VARCHAR(80) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `actor_id` VARCHAR(64) DEFAULT NULL,
  `payload_json` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_property_timeline_property` (`property_id`, `created_at`),
  CONSTRAINT `fk_svp_property_timeline_property`
    FOREIGN KEY (`property_id`) REFERENCES `svp_properties`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` VARCHAR(64) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` VARCHAR(80) DEFAULT NULL,
  `old_json` LONGTEXT DEFAULT NULL,
  `new_json` LONGTEXT DEFAULT NULL,
  `ip_address` VARCHAR(80) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_actor` (`actor_id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_comments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` VARCHAR(80) NOT NULL DEFAULT 'property',
  `entity_id` VARCHAR(80) NOT NULL,
  `body` TEXT NOT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  INDEX `idx_comments_entity` (`entity_type`, `entity_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_customers` (
  `id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(200) DEFAULT NULL,
  `source` VARCHAR(120) DEFAULT NULL,
  `status_id` VARCHAR(64) DEFAULT NULL,
  `assigned_user_id` VARCHAR(64) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customer_phone` (`phone`),
  INDEX `idx_customer_status` (`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_customer_needs` (
  `id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `districts_json` LONGTEXT DEFAULT NULL,
  `budget_min` DECIMAL(18,2) DEFAULT NULL,
  `budget_max` DECIMAL(18,2) DEFAULT NULL,
  `area_min` DECIMAL(12,2) DEFAULT NULL,
  `area_max` DECIMAL(12,2) DEFAULT NULL,
  `tags_json` LONGTEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status_id` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_need_customer` (`customer_id`),
  CONSTRAINT `fk_svp_customer_needs_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `svp_customers`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_viewing_schedules` (
  `id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) DEFAULT NULL,
  `property_id` VARCHAR(64) DEFAULT NULL,
  `scheduled_at` DATETIME DEFAULT NULL,
  `status` ENUM('pending','confirmed','done','cancelled') DEFAULT 'pending',
  `note` TEXT DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_viewing_customer` (`customer_id`),
  INDEX `idx_viewing_property` (`property_id`),
  INDEX `idx_viewing_scheduled` (`scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_referrals` (
  `id` VARCHAR(64) NOT NULL,
  `referrer_user_id` VARCHAR(64) DEFAULT NULL,
  `referred_user_id` VARCHAR(64) DEFAULT NULL,
  `referral_code` VARCHAR(80) NOT NULL,
  `referral_type` ENUM('staff','owner','buyer','partner','other') DEFAULT 'other',
  `status` ENUM('new','activated','rejected') DEFAULT 'new',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_referrer` (`referrer_user_id`),
  INDEX `idx_referred` (`referred_user_id`),
  INDEX `idx_referral_code` (`referral_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_favorites` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_property` (`user_id`, `property_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_property_id` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `property_id` VARCHAR(64) DEFAULT NULL,
  `customer_id` VARCHAR(64) DEFAULT NULL,
  `price` DECIMAL(18,2) DEFAULT NULL,
  `status` ENUM('new','showing','deposit','notary','completed','cancelled') DEFAULT 'new',
  `note` TEXT DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction_property` (`property_id`),
  INDEX `idx_transaction_customer` (`customer_id`),
  INDEX `idx_transaction_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_finance_entries` (
  `id` VARCHAR(64) NOT NULL,
  `transaction_id` VARCHAR(64) DEFAULT NULL,
  `entry_type` ENUM('income','expense','debt','commission') NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `note` TEXT DEFAULT NULL,
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_finance_transaction` (`transaction_id`),
  INDEX `idx_finance_type` (`entry_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_recruitment_candidates` (
  `id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `source_referral_code` VARCHAR(80) DEFAULT NULL,
  `pipeline_status` ENUM('registered','contacted','interview','training','activated','active','rejected') DEFAULT 'registered',
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidate_status` (`pipeline_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_training_contents` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content_type` ENUM('video','document','article','notice','quiz','livestream') DEFAULT 'article',
  `content_url` VARCHAR(1000) DEFAULT NULL,
  `body` LONGTEXT DEFAULT NULL,
  `status` ENUM('draft','published','archived') DEFAULT 'draft',
  `created_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_training_status` (`status`),
  INDEX `idx_training_type` (`content_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_reputation_scores` (
  `user_id` VARCHAR(64) NOT NULL,
  `score` DECIMAL(10,2) DEFAULT 0,
  `criteria_json` LONGTEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svp_notifications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT DEFAULT NULL,
  `kind` VARCHAR(80) DEFAULT 'system',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notification_user` (`user_id`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
