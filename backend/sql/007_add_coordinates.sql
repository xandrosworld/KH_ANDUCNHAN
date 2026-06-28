-- Add latitude/longitude columns to properties table for map pin sync
SET NAMES utf8mb4;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `latitude` DECIMAL(10,7) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'latitude'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `properties` ADD COLUMN `longitude` DECIMAL(10,7) DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'longitude'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;
