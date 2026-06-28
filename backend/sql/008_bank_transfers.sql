-- Migration 008: Bank transfer records
-- Keeps payment proof records available immediately after database import.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `bank_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ref_code` VARCHAR(20) NOT NULL UNIQUE,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `description` VARCHAR(500) DEFAULT '',
  `purpose` ENUM('deposit','pro_listing','verification','other') DEFAULT 'other',
  `sender_name` VARCHAR(200) DEFAULT '',
  `sender_email` VARCHAR(200) DEFAULT '',
  `user_id` INT DEFAULT NULL,
  `property_id` INT DEFAULT NULL,
  `status` ENUM('pending','verified','rejected') DEFAULT 'pending',
  `admin_note` VARCHAR(500) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `verified_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
