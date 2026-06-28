-- ═══════════════════════════════════════════════════════════════════════════
--  Migration 006: Property Likes
-- ═══════════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- Add likes_count column to properties
SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `likes_count` INT DEFAULT 0',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'likes_count'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

-- Property likes tracking table
CREATE TABLE IF NOT EXISTS `property_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` VARCHAR(64) NOT NULL,
  `fingerprint` VARCHAR(128) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_prop_fp` (`property_id`, `fingerprint`),
  INDEX `idx_property_id` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
