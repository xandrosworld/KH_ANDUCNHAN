-- Migration 007: Add expiry_notified flag to properties table
-- Tracks which listings have received an expiry warning email
-- so we don't send duplicate notifications.

SET NAMES utf8mb4;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `expiry_notified` TINYINT(1) DEFAULT 0',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'expiry_notified'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

-- Reset the flag when a listing is renewed (expires_at changed)
-- This is handled in application code when updating expires_at.
