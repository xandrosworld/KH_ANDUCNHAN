-- Migration 009: make base property image seed imports idempotent.
-- Allows seed.sql to be safely re-run without duplicating sample image rows.

SET NAMES utf8mb4;

DELETE pi1
FROM `property_images` pi1
JOIN `property_images` pi2
  ON pi1.`property_id` = pi2.`property_id`
  AND LEFT(pi1.`image_url`, 255) = LEFT(pi2.`image_url`, 255)
  AND pi1.`id` > pi2.`id`;

SET @svp_ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `property_images` ADD UNIQUE INDEX `uq_property_image_url` (`property_id`, `image_url`(255))',
    'SELECT 1'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'property_images'
    AND index_name = 'uq_property_image_url'
);
PREPARE svp_stmt FROM @svp_ddl;
EXECUTE svp_stmt;
DEALLOCATE PREPARE svp_stmt;
