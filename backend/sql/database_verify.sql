-- So Do Van Phuc full database verifier
-- Run after sodovanphuc_import_all.sql, or as the last section inside it.

SET NAMES utf8mb4;

SELECT
  '00_base_tables' AS check_name,
  IF(COUNT(DISTINCT table_name) = 11, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(DISTINCT table_name), '/11 base tables present') AS details
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'properties',
    'property_images',
    'inquiries',
    'reports',
    'schedules',
    'users',
    'banners',
    'blog_posts',
    'messages',
    'property_likes',
    'bank_transfers'
  );

SELECT
  '00_property_runtime_columns' AS check_name,
  IF(COUNT(DISTINCT column_name) = 5, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(DISTINCT column_name), '/5 runtime property columns present') AS details
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'properties'
  AND column_name IN (
    'latitude',
    'longitude',
    'owner_id',
    'likes_count',
    'expiry_notified'
  );

SELECT
  '00_property_media_columns' AS check_name,
  IF(COUNT(DISTINCT column_name) = 6, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(DISTINCT column_name), '/6 property media/social columns present') AS details
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'properties'
  AND column_name IN (
    'video_url',
    'facebook_url',
    'instagram_url',
    'tiktok_url',
    'x_url',
    'whatsapp_url'
  );

SELECT
  '00_base_seed_properties' AS check_name,
  IF(COUNT(*) >= 5, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(*), ' seed/base properties present') AS details
FROM properties;

SELECT
  '00_property_image_unique_key' AS check_name,
  IF(COUNT(DISTINCT seq_in_index) = 2, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(DISTINCT seq_in_index), '/2 unique property image key columns present') AS details
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'property_images'
  AND index_name = 'uq_property_image_url'
  AND non_unique = 0
  AND column_name IN ('property_id', 'image_url');

SELECT
  '00_svp_tables' AS check_name,
  IF(COUNT(DISTINCT table_name) = 23, 'PASS', 'FAIL') AS status,
  CONCAT(COUNT(DISTINCT table_name), '/23 SVP tables present') AS details
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'svp_config_groups',
    'svp_config_options',
    'svp_form_schemas',
    'svp_properties',
    'svp_property_media',
    'svp_property_versions',
    'svp_property_timeline',
    'svp_audit_logs',
    'svp_comments',
    'svp_customers',
    'svp_customer_needs',
    'svp_viewing_schedules',
    'svp_referrals',
    'svp_transactions',
    'svp_finance_entries',
    'svp_recruitment_candidates',
    'svp_recruitment_posts',
    'svp_training_contents',
    'svp_reputation_scores',
    'svp_notifications',
    'svp_events',
    'svp_event_registrations',
    'svp_media_library'
  );

SELECT
  '00_svp_seed_ready' AS check_name,
  IF(
    (SELECT COUNT(*) FROM svp_config_groups WHERE id IN (
      'company_units',
      'property_tags',
      'property_statuses',
      'visibility_levels',
      'signing_criteria',
      'price_segments',
      'customer_statuses'
    )) = 7
    AND (SELECT COUNT(*) FROM svp_config_options) >= 50,
    'PASS',
    'FAIL'
  ) AS status,
  CONCAT(
    (SELECT COUNT(*) FROM svp_config_groups WHERE id IN (
      'company_units',
      'property_tags',
      'property_statuses',
      'visibility_levels',
      'signing_criteria',
      'price_segments',
      'customer_statuses'
    )),
    '/7 seed groups, ',
    (SELECT COUNT(*) FROM svp_config_options),
    ' config options'
  ) AS details;
