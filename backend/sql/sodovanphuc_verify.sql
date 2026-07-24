-- So Do Van Phuc post-import verification.
-- Run this in phpMyAdmin after sodovanphuc_schema.sql and sodovanphuc_seed.sql.

SET NAMES utf8mb4;

SELECT '00_database' AS check_name, DATABASE() AS detail, 'INFO' AS status;

SELECT
  '01_required_tables' AS check_name,
  COUNT(*) AS actual,
  23 AS expected,
  IF(COUNT(*) = 23, 'PASS', 'FAIL') AS status
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
  required_tables.table_name,
  IF(actual_tables.table_name IS NULL, 'MISSING', 'OK') AS status
FROM (
  SELECT 'svp_config_groups' AS table_name UNION ALL
  SELECT 'svp_config_options' UNION ALL
  SELECT 'svp_form_schemas' UNION ALL
  SELECT 'svp_properties' UNION ALL
  SELECT 'svp_property_media' UNION ALL
  SELECT 'svp_property_versions' UNION ALL
  SELECT 'svp_property_timeline' UNION ALL
  SELECT 'svp_audit_logs' UNION ALL
  SELECT 'svp_comments' UNION ALL
  SELECT 'svp_customers' UNION ALL
  SELECT 'svp_customer_needs' UNION ALL
  SELECT 'svp_viewing_schedules' UNION ALL
  SELECT 'svp_referrals' UNION ALL
  SELECT 'svp_transactions' UNION ALL
  SELECT 'svp_finance_entries' UNION ALL
  SELECT 'svp_recruitment_candidates' UNION ALL
  SELECT 'svp_recruitment_posts' UNION ALL
  SELECT 'svp_training_contents' UNION ALL
  SELECT 'svp_reputation_scores' UNION ALL
  SELECT 'svp_notifications' UNION ALL
  SELECT 'svp_events' UNION ALL
  SELECT 'svp_event_registrations' UNION ALL
  SELECT 'svp_media_library'
) AS required_tables
LEFT JOIN information_schema.tables AS actual_tables
  ON actual_tables.table_schema = DATABASE()
 AND actual_tables.table_name = required_tables.table_name
ORDER BY required_tables.table_name;

SELECT
  '02_property_media_contract' AS check_name,
  SUM(CASE WHEN column_name = 'id' AND data_type = 'varchar' AND character_maximum_length = 64 THEN 1 ELSE 0 END)
  + SUM(CASE WHEN column_name = 'property_id' AND data_type = 'varchar' AND character_maximum_length = 64 THEN 1 ELSE 0 END)
  + SUM(CASE WHEN column_name = 'caption' AND data_type = 'varchar' AND character_maximum_length = 500 THEN 1 ELSE 0 END)
  + SUM(CASE WHEN column_name = 'media_type' AND column_type LIKE '%image%' AND column_type LIKE '%video%' AND column_type LIKE '%document%' AND column_type LIKE '%other%' THEN 1 ELSE 0 END) AS actual,
  4 AS expected,
  IF(
    SUM(CASE WHEN column_name = 'id' AND data_type = 'varchar' AND character_maximum_length = 64 THEN 1 ELSE 0 END)
    + SUM(CASE WHEN column_name = 'property_id' AND data_type = 'varchar' AND character_maximum_length = 64 THEN 1 ELSE 0 END)
    + SUM(CASE WHEN column_name = 'caption' AND data_type = 'varchar' AND character_maximum_length = 500 THEN 1 ELSE 0 END)
    + SUM(CASE WHEN column_name = 'media_type' AND column_type LIKE '%image%' AND column_type LIKE '%video%' AND column_type LIKE '%document%' AND column_type LIKE '%other%' THEN 1 ELSE 0 END) = 4,
    'PASS',
    'FAIL'
  ) AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'svp_property_media';

SELECT
  '03_json_columns' AS check_name,
  COUNT(*) AS actual,
  8 AS expected,
  IF(COUNT(*) = 8, 'PASS', 'FAIL') AS status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND data_type = 'longtext'
  AND CONCAT(table_name, '.', column_name) IN (
    'svp_config_options.metadata_json',
    'svp_properties.visibility_json',
    'svp_properties.tags_json',
    'svp_properties.extra_json',
    'svp_property_versions.snapshot_json',
    'svp_property_timeline.payload_json',
    'svp_audit_logs.old_json',
    'svp_audit_logs.new_json'
  );

SELECT
  '04_foreign_keys' AS check_name,
  COUNT(*) AS actual,
  5 AS expected,
  IF(COUNT(*) >= 5, 'PASS', 'FAIL') AS status
FROM information_schema.referential_constraints
WHERE constraint_schema = DATABASE()
  AND constraint_name IN (
    'fk_svp_config_options_group',
    'fk_svp_property_media_property',
    'fk_svp_property_versions_property',
    'fk_svp_property_timeline_property',
    'fk_svp_customer_needs_customer'
  );

SELECT
  '05_seed_groups' AS check_name,
  COUNT(*) AS actual,
  7 AS expected,
  IF(COUNT(*) = 7, 'PASS', 'FAIL') AS status
FROM svp_config_groups
WHERE id IN (
  'company_units',
  'property_tags',
  'property_statuses',
  'visibility_levels',
  'signing_criteria',
  'price_segments',
  'customer_statuses'
);

SELECT
  '06_seed_options_minimum' AS check_name,
  COUNT(*) AS actual,
  50 AS expected_minimum,
  IF(COUNT(*) >= 50, 'PASS', 'FAIL') AS status
FROM svp_config_options;

SELECT
  '07_core_seed_options' AS check_name,
  COUNT(*) AS actual,
  6 AS expected,
  IF(COUNT(*) = 6, 'PASS', 'FAIL') AS status
FROM svp_config_options
WHERE id IN (
  'tag_o_to',
  'tag_thang_may',
  'tag_mo_spa',
  'vl_vinh_danh',
  'sc_e_contract',
  'cs_viewing'
);

SELECT
  group_id,
  COUNT(*) AS option_count,
  IF(COUNT(*) > 0, 'PASS', 'FAIL') AS status
FROM svp_config_options
GROUP BY group_id
ORDER BY group_id;

SELECT
  '08_ready_for_healthcheck' AS check_name,
  'If all FAIL/MISSING rows above are absent, /api/svp/health should return status=ready.' AS detail,
  'INFO' AS status;
