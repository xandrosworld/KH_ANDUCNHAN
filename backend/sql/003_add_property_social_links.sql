-- Migration 003: property social link fields.

SET NAMES utf8mb4;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `facebook_url` VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'facebook_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `instagram_url` VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'instagram_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `tiktok_url` VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'tiktok_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `x_url` VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'x_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `whatsapp_url` VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'whatsapp_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;
