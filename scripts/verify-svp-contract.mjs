import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');

const rel = (...parts) => path.join(appRoot, ...parts);
const read = (...parts) => readFileSync(rel(...parts), 'utf8');

const checks = [];

function pass(message) {
  checks.push(message);
  console.log(`[OK] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  pass(message);
}

function assertFile(parts, message) {
  const filePath = rel(...parts);
  assert(existsSync(filePath), `${message}: ${path.relative(appRoot, filePath)}`);
}

function assertIncludes(content, needle, message) {
  assert(content.includes(needle), message);
}

function tableBlock(schema, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = schema.match(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? \`${escaped}\` \\(([\\s\\S]*?)\\) ENGINE=`, 'm'));
  if (!match) throw new Error(`Missing SQL table: ${tableName}`);
  return match[1];
}

function columnMap(block) {
  return Object.fromEntries(
    [...block.matchAll(/^\s*`([^`]+)`\s+([^,\n]+)/gm)].map((match) => [match[1], match[2].trim()])
  );
}

function assertColumn(schema, tableName, columnName, expectedText) {
  const block = tableBlock(schema, tableName);
  const columns = columnMap(block);
  assert(Boolean(columns[columnName]), `${tableName}.${columnName} exists`);
  if (expectedText) {
    assert(columns[columnName].toUpperCase().includes(expectedText.toUpperCase()), `${tableName}.${columnName} contains ${expectedText}`);
  }
}

function assertRoute(routes, method, route) {
  assertIncludes(routes, `$router->add('${method}', '${route}'`, `${method} ${route} is registered`);
}

function countMatches(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

assertFile(['backend', 'sql', 'schema.sql'], 'Base schema file exists');
assertFile(['backend', 'sql', '002_add_property_video_url.sql'], 'Base property video migration exists');
assertFile(['backend', 'sql', '003_add_property_social_links.sql'], 'Base property social links migration exists');
assertFile(['backend', 'sql', '004_users_banners_blog.sql'], 'Base users/banners/blog migration exists');
assertFile(['backend', 'sql', '005_chat_messages.sql'], 'Base messages migration exists');
assertFile(['backend', 'sql', '006_property_likes.sql'], 'Base property likes migration exists');
assertFile(['backend', 'sql', '007_add_coordinates.sql'], 'Base property coordinates migration exists');
assertFile(['backend', 'sql', '007_add_expiry_notified.sql'], 'Base expiry notification migration exists');
assertFile(['backend', 'sql', '008_bank_transfers.sql'], 'Base bank transfers migration exists');
assertFile(['backend', 'sql', '009_property_image_unique.sql'], 'Base property image uniqueness migration exists');
assertFile(['backend', 'sql', '014_svp_media_library.sql'], 'Media library migration exists');
assertFile(['backend', 'sql', 'seed.sql'], 'Base seed file exists');
assertFile(['backend', 'sql', 'sodovanphuc_schema.sql'], 'SVP schema file exists');
assertFile(['backend', 'sql', 'sodovanphuc_seed.sql'], 'SVP seed file exists');
assertFile(['backend', 'sql', 'sodovanphuc_verify.sql'], 'SVP post-import SQL verifier exists');
assertFile(['backend', 'sql', 'database_verify.sql'], 'Full database SQL verifier exists');
assertFile(['backend', 'api', 'svp-routes.php'], 'SVP route file exists');
assertFile(['backend', 'api', 'index.php'], 'PHP router entry exists');
assertFile(['backend', 'api', 'svp-media-routes.php'], 'Media library route file exists');
assert(!existsSync(rel('backend', 'api', 'debug_test.php')), 'backend debug_test.php is absent from source');
assertFile(['backend', 'config', 'config.example.php'], 'Backend config example exists');
assert(!existsSync(rel('backend', 'config', 'config.php')), 'real backend config.php is absent from source');
assertFile(['backend', '.htaccess'], 'Backend .htaccess exists');
assertFile(['index.html'], 'Frontend HTML shell exists');
assertFile(['public', '.htaccess'], 'Frontend .htaccess exists');
assertFile(['deploy', 'new-hosting-config.ps1'], 'Hosting config generator exists');
assertFile(['deploy', 'verify-hosting-config.ps1'], 'Hosting config verifier exists');
assertFile(['deploy', 'test-hosting-config-generator.ps1'], 'Hosting config dry-run tester exists');
assertFile(['deploy', 'test-php-runtime.ps1'], 'PHP runtime smoke tester exists');
assertFile(['deploy', 'test-release-upload-drill.ps1'], 'Exact upload zip drill tester exists');
assertFile(['deploy', 'test-configured-upload-zip-dryrun.ps1'], 'Configured upload zip dry-run tester exists');
assertFile(['deploy', 'build-configured-public-html.ps1'], 'Configured public_html zip builder exists');
assertFile(['deploy', 'prepare-real-upload.ps1'], 'Real upload preparation wrapper exists');
assertFile(['deploy', 'cleanup-real-upload-artifacts.ps1'], 'Real upload artifact cleanup tool exists');
assertFile(['deploy', 'domain-cutover-report-vanphuc.ps1'], 'Domain cutover report tool exists');
assertFile(['deploy', 'wait-vanphuc-hosting-ready.ps1'], 'Hosting readiness watcher exists');
assertFile(['deploy', 'smoke-vanphuc-hosting.ps1'], 'Hosting smoke script exists');
assertFile(['deploy', 'browser-smoke-vanphuc-hosting.ps1'], 'Hosting browser smoke script exists');
assertFile(['deploy', 'complete-vanphuc-hosting-handoff.ps1'], 'Post-upload handoff autopilot exists');
assertFile(['deploy', 'acceptance-report-vanphuc-hosting.ps1'], 'Hosting acceptance report script exists');
assertFile(['deploy', 'preupload-report-sodovanphuc.ps1'], 'Pre-upload report script exists');
assertFile(['deploy', 'final-prehosting-audit.ps1'], 'Final pre-hosting audit script exists');
assertFile(['deploy', 'run-prehosting-proof.ps1'], 'One-command pre-hosting proof script exists');
assertFile(['public', 'robots.txt'], 'robots.txt exists');
assertFile(['public', 'sitemap.xml'], 'sitemap.xml exists');
assertFile(['playwright.hosting.config.ts'], 'Hosting Playwright config exists');
assertFile(['qa', 'hosting-live.spec.ts'], 'Hosting live browser spec exists');
assertFile(['src', 'services', 'svpApi.ts'], 'Frontend SVP API client exists');
assertFile(['src', 'types', 'svp.ts'], 'Frontend SVP types exist');

const baseSchema = read('backend', 'sql', 'schema.sql');
const baseSeed = read('backend', 'sql', 'seed.sql');
const propertyVideoMigration = read('backend', 'sql', '002_add_property_video_url.sql');
const propertySocialMigration = read('backend', 'sql', '003_add_property_social_links.sql');
const usersBlogMigration = read('backend', 'sql', '004_users_banners_blog.sql');
const messagesMigration = read('backend', 'sql', '005_chat_messages.sql');
const propertyLikesMigration = read('backend', 'sql', '006_property_likes.sql');
const coordinatesMigration = read('backend', 'sql', '007_add_coordinates.sql');
const expiryMigration = read('backend', 'sql', '007_add_expiry_notified.sql');
const bankTransfersMigration = read('backend', 'sql', '008_bank_transfers.sql');
const imageUniqueMigration = read('backend', 'sql', '009_property_image_unique.sql');
const mediaLibraryMigration = read('backend', 'sql', '014_svp_media_library.sql');
const schema = read('backend', 'sql', 'sodovanphuc_schema.sql');
const seed = read('backend', 'sql', 'sodovanphuc_seed.sql');
const sqlVerify = read('backend', 'sql', 'sodovanphuc_verify.sql');
const databaseVerify = read('backend', 'sql', 'database_verify.sql');
const routes = read('backend', 'api', 'svp-routes.php');
const authRoutes = read('backend', 'api', 'svp-auth-routes.php');
const eventRoutes = read('backend', 'api', 'svp-event-routes.php');
const mediaRoutes = read('backend', 'api', 'svp-media-routes.php');
const routerIndex = read('backend', 'api', 'index.php');
const uploadLib = read('backend', 'lib', 'Upload.php');
const databaseLib = read('backend', 'lib', 'Database.php');
const configExample = read('backend', 'config', 'config.example.php');
const indexHtml = read('index.html');
const backendHtaccess = read('backend', '.htaccess');
const frontendHtaccess = read('public', '.htaccess');
const hostingConfigGenerator = read('deploy', 'new-hosting-config.ps1');
const hostingConfigVerifier = read('deploy', 'verify-hosting-config.ps1');
const hostingConfigDryRun = read('deploy', 'test-hosting-config-generator.ps1');
const phpRuntimeSmoke = read('deploy', 'test-php-runtime.ps1');
const releaseUploadDrill = read('deploy', 'test-release-upload-drill.ps1');
const configuredUploadZipDryRun = read('deploy', 'test-configured-upload-zip-dryrun.ps1');
const configuredZipBuilder = read('deploy', 'build-configured-public-html.ps1');
const realUploadPreparer = read('deploy', 'prepare-real-upload.ps1');
const realUploadCleanup = read('deploy', 'cleanup-real-upload-artifacts.ps1');
const domainCutoverReport = read('deploy', 'domain-cutover-report-vanphuc.ps1');
const hostingWaiter = read('deploy', 'wait-vanphuc-hosting-ready.ps1');
const releaseBuilder = read('deploy', 'build-sodovanphuc-release.ps1');
const releaseVerifier = read('deploy', 'verify-sodovanphuc-release.ps1');
const releasePackageVerifier = read('deploy', 'verify-release-package.ps1');
const hostingSmoke = read('deploy', 'smoke-vanphuc-hosting.ps1');
const hostingBrowserSmoke = read('deploy', 'browser-smoke-vanphuc-hosting.ps1');
const hostingHandoffAutopilot = read('deploy', 'complete-vanphuc-hosting-handoff.ps1');
const hostingAcceptanceReport = read('deploy', 'acceptance-report-vanphuc-hosting.ps1');
const preuploadReport = read('deploy', 'preupload-report-sodovanphuc.ps1');
const finalPrehostingAudit = read('deploy', 'final-prehosting-audit.ps1');
const prehostingProofRunner = read('deploy', 'run-prehosting-proof.ps1');
const localPlaywrightConfig = read('playwright.config.ts');
const hostingPlaywrightConfig = read('playwright.hosting.config.ts');
const hostingLiveSpec = read('qa', 'hosting-live.spec.ts');
const robots = read('public', 'robots.txt');
const sitemap = read('public', 'sitemap.xml');
const seoManager = read('src', 'components', 'SEOManager.tsx');
const propertyApi = read('src', 'services', 'propertyApi.ts');
const aiDescriptionService = read('src', 'services', 'aiDescription.ts');
const inboxPage = read('src', 'pages', 'InboxPage.tsx');
const svpPostPropertyPage = read('src', 'pages', 'SvpPostPropertyPage.tsx');
const languageContext = read('src', 'contexts', 'LanguageContext.tsx');
const inquiryService = read('src', 'services', 'inquiryService.ts');
const reportService = read('src', 'services', 'reportService.ts');
const scheduleService = read('src', 'services', 'scheduleService.ts');
const svpApi = read('src', 'services', 'svpApi.ts');
const svpTypes = read('src', 'types', 'svp.ts');
const eventApi = read('src', 'services', 'eventApi.ts');
const adminEventsPage = read('src', 'pages', 'admin', 'EventsPage.tsx');
const adminSchedulesPage = read('src', 'pages', 'admin', 'SchedulesPage.tsx');
const adminReferralsPage = read('src', 'pages', 'admin', 'ReferralsPage.tsx');
const adminUsersPage = read('src', 'pages', 'admin', 'UsersPage.tsx');
const adminMediaPage = read('src', 'pages', 'admin', 'MediaLibraryPage.tsx');
const mediaField = read('src', 'components', 'admin', 'MediaField.tsx');
const mediaApi = read('src', 'services', 'mediaApi.ts');
const appRoutes = read('src', 'App.tsx');
const sidebar = read('src', 'components', 'Sidebar.tsx');
const adminExport = read('src', 'utils', 'adminExport.ts');
const envExample = read('.env.example');
const gitignore = read('.gitignore');
const packageJson = read('package.json');
const readme = read('README.md');
const handoff = read('HANDOFF_WEB.md');
const backendReadme = read('backend', 'README_BACKEND.md');
const usageGuide = read('deploy', 'HUONG_DAN_SU_DUNG.md');
const rootDeployChecklist = read('..', 'DEPLOY_CHECKLIST_MATBAO_SO_DO_VAN_PHUC.md');
const masterPlan = read('..', 'MASTER_PLAN_NOI_BO_TRIEN_KHAI_SO_DO_VAN_PHUC.md');

const baseTables = [
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
  'bank_transfers',
];

const requiredTables = [
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
  'svp_media_library',
];

for (const table of ['properties', 'property_images', 'inquiries', 'reports', 'schedules']) {
  tableBlock(baseSchema, table);
  pass(`Base SQL table ${table} exists`);
}
assert(!baseSchema.includes('DROP TABLE IF EXISTS'), 'base schema is non-destructive and has no DROP TABLE');
for (const table of ['properties', 'property_images', 'inquiries', 'reports', 'schedules']) {
  assertIncludes(baseSchema, `CREATE TABLE IF NOT EXISTS \`${table}\``, `base schema creates ${table} idempotently`);
}
assertColumn(baseSchema, 'properties', 'latitude', 'DECIMAL');
assertColumn(baseSchema, 'properties', 'longitude', 'DECIMAL');
assertColumn(baseSchema, 'properties', 'owner_id', 'VARCHAR(64)');
assertColumn(baseSchema, 'properties', 'likes_count', 'INT');
assertColumn(baseSchema, 'properties', 'expiry_notified', 'TINYINT(1)');
for (const [migrationText, migrationName] of [
  [propertyVideoMigration, 'property video migration'],
  [propertySocialMigration, 'property social migration'],
  [usersBlogMigration, 'users/blog migration'],
  [propertyLikesMigration, 'property likes migration'],
  [coordinatesMigration, 'coordinates migration'],
  [expiryMigration, 'expiry migration'],
  [imageUniqueMigration, 'property image uniqueness migration'],
]) {
  assert(!/ADD\s+(?:COLUMN|INDEX|UNIQUE INDEX)\s+IF NOT EXISTS/i.test(migrationText), `${migrationName} avoids MariaDB-only ALTER IF NOT EXISTS syntax`);
  assert(!/ADD\s+COLUMN[^\r\n;]*\bAFTER\b/i.test(migrationText), `${migrationName} avoids fragile AFTER column-order dependencies`);
  assertIncludes(migrationText, 'PREPARE svp_stmt FROM @svp_ddl', `${migrationName} uses MySQL/MariaDB-compatible prepared DDL`);
}
assertIncludes(propertyVideoMigration, "column_name = 'video_url'", 'property video migration checks video_url idempotently');
assertIncludes(propertySocialMigration, "column_name = 'facebook_url'", 'property social migration checks facebook_url idempotently');
assertIncludes(propertySocialMigration, "column_name = 'whatsapp_url'", 'property social migration checks whatsapp_url idempotently');
assertIncludes(usersBlogMigration, 'CREATE TABLE IF NOT EXISTS `users`', 'users migration creates users table');
assertIncludes(usersBlogMigration, "column_name = 'owner_id'", 'users migration adds owner_id idempotently');
assertIncludes(usersBlogMigration, "index_name = 'idx_owner_id'", 'users migration adds owner_id index idempotently');
assertIncludes(messagesMigration, 'CREATE TABLE IF NOT EXISTS `messages`', 'messages migration creates messages table');
assertIncludes(propertyLikesMigration, "column_name = 'likes_count'", 'property likes migration adds likes_count idempotently');
assertIncludes(propertyLikesMigration, 'CREATE TABLE IF NOT EXISTS `property_likes`', 'property likes migration creates property_likes table');
assertIncludes(coordinatesMigration, "column_name = 'latitude'", 'coordinates migration adds latitude idempotently');
assertIncludes(coordinatesMigration, "column_name = 'longitude'", 'coordinates migration adds longitude idempotently');
assertIncludes(expiryMigration, "column_name = 'expiry_notified'", 'expiry migration adds expiry_notified idempotently');
assertIncludes(bankTransfersMigration, 'CREATE TABLE IF NOT EXISTS `bank_transfers`', 'bank transfers migration creates bank_transfers table');
assertIncludes(baseSchema, 'UNIQUE KEY `uq_property_image_url` (`property_id`, `image_url`(255))', 'base schema has property image uniqueness key');
assertIncludes(imageUniqueMigration, "index_name = 'uq_property_image_url'", 'property image uniqueness migration is idempotent');
assertIncludes(imageUniqueMigration, 'DELETE pi1', 'property image uniqueness migration removes duplicate image rows before adding unique key');
assertIncludes(databaseVerify, "'00_base_tables' AS check_name", 'full database verifier checks base tables');
assertIncludes(databaseVerify, "'00_property_runtime_columns' AS check_name", 'full database verifier checks runtime property columns');
assertIncludes(databaseVerify, "'00_property_media_columns' AS check_name", 'full database verifier checks property media/social columns');
assertIncludes(databaseVerify, "'00_property_image_unique_key' AS check_name", 'full database verifier checks property image unique key');
assertIncludes(databaseVerify, "'00_svp_tables' AS check_name", 'full database verifier checks SVP tables');
assertIncludes(databaseVerify, "'00_svp_seed_ready' AS check_name", 'full database verifier checks SVP seed readiness');
assertIncludes(baseSeed, "INSERT INTO `properties`", 'base seed includes sample properties');
const baseSeedInsertBlocks = countMatches(baseSeed, /^INSERT INTO `/gm);
const baseSeedUpsertBlocks = countMatches(baseSeed, /ON DUPLICATE KEY UPDATE/g);
assert(baseSeedInsertBlocks === 10, 'base seed has 10 insert blocks for properties and images');
assert(baseSeedInsertBlocks === baseSeedUpsertBlocks, 'every base seed INSERT block is idempotent with ON DUPLICATE KEY UPDATE');

for (const table of requiredTables) {
  tableBlock(schema, table);
  pass(`SQL table ${table} exists`);
}

assertColumn(schema, 'svp_properties', 'visibility_json', 'LONGTEXT');
assertColumn(schema, 'svp_properties', 'tags_json', 'LONGTEXT');
assertColumn(schema, 'svp_properties', 'extra_json', 'LONGTEXT');
assertColumn(schema, 'svp_property_versions', 'snapshot_json', 'LONGTEXT');
assertColumn(schema, 'svp_property_timeline', 'payload_json', 'LONGTEXT');
assertColumn(schema, 'svp_audit_logs', 'old_json', 'LONGTEXT');
assertColumn(schema, 'svp_audit_logs', 'new_json', 'LONGTEXT');
assertColumn(schema, 'svp_property_media', 'id', 'VARCHAR(64)');
assertColumn(schema, 'svp_property_media', 'property_id', 'VARCHAR(64)');
assertColumn(schema, 'svp_property_media', 'media_type', 'ENUM');
assertColumn(schema, 'svp_property_media', 'caption', 'VARCHAR(500)');
assertColumn(schema, 'svp_media_library', 'url', 'VARCHAR(1000)');
assertColumn(schema, 'svp_media_library', 'source_context', 'VARCHAR(80)');
assertColumn(schema, 'svp_media_library', 'deleted_at', 'DATETIME');
assertIncludes(mediaLibraryMigration, 'CREATE TABLE IF NOT EXISTS `svp_media_library`', 'media migration creates the shared media library');
assertIncludes(mediaLibraryMigration, 'ON DUPLICATE KEY UPDATE', 'media migration seeds known assets idempotently');
assertIncludes(mediaLibraryMigration, 'UNIQUE KEY `uq_svp_media_library_url` (`url`(191))', 'media URL uniqueness stays within shared-hosting index limits');

const mediaBlock = tableBlock(schema, 'svp_property_media');
for (const mediaType of ['image', 'video', 'document', 'other']) {
  assert(mediaBlock.includes(`'${mediaType}'`), `svp_property_media.media_type allows ${mediaType}`);
}
assertIncludes(routes, 'INSERT INTO svp_property_media (id, property_id, media_type, url, caption, sort_order)', 'media insert matches SQL columns');
assertIncludes(routes, "Upload::handleUpload($_FILES['images'])", 'SVP media-upload route uses central upload validator');
assertIncludes(routes, "'media_uploaded'", 'SVP media-upload route writes timeline event');
assertIncludes(routes, "'property_media_upload'", 'SVP media-upload route writes batch audit event');
assertIncludes(routes, 'title LIKE :q_title', 'SVP property search avoids reused PDO placeholders');
assert(!routes.includes('title LIKE :q OR owner_name LIKE :q'), 'SVP property search has no repeated :q placeholder');
assertIncludes(routes, 'id = :id OR code = :code', 'SVP property detail avoids reused PDO placeholders');
assert(!routes.includes('id = :id OR code = :id'), 'SVP property detail has no repeated :id placeholder');
assertIncludes(authRoutes, 'full_name LIKE :query_name OR email LIKE :query_email', 'referrer candidate search avoids reused PDO placeholders');
assert(!authRoutes.includes('full_name LIKE :query OR email LIKE :query'), 'referrer candidate search has no repeated :query placeholder');
assertRoute(authRoutes, 'GET', '/api/svp/admin/viewing-schedules');
assertRoute(authRoutes, 'GET', '/api/svp/admin/referrals');
assertRoute(authRoutes, 'GET', '/api/svp/admin/export');
assertIncludes(authRoutes, 'application/vnd.ms-excel', 'admin exports use an Excel workbook MIME type');
assertIncludes(authRoutes, '<?mso-application progid="Excel.Sheet"?>', 'admin exports generate a SpreadsheetML workbook');
assertIncludes(authRoutes, "$type === 'viewing_schedules'", 'admin export supports viewing schedules');
assertIncludes(authRoutes, "$type === 'referrals'", 'admin export supports referral records');
assertIncludes(authRoutes, "$type === 'user_referrals'", 'admin export supports a selected user F1 list');
assertIncludes(adminSchedulesPage, "downloadAdminExport('viewing_schedules')", 'admin schedule list exports to Excel');
assertIncludes(adminReferralsPage, "downloadAdminExport('referrals')", 'admin referral list exports to Excel');
assertIncludes(adminUsersPage, "downloadAdminExport('user_referrals'", 'admin user detail exports the selected F1 list');
assertIncludes(adminExport, ".xls'", 'frontend admin downloads use Excel filenames');
assertIncludes(routes, 'restore_public_registration_roles_20260722', 'role config runs the one-time public registration baseline repair');
assertIncludes(routes, "'khach_mua',\n            'chu_nha',\n            'nguoi_gioi_thieu',\n            'ctv_khach',\n            'ctv_nguon'", 'role repair restores the five public and referral choices');
assertIncludes(routes, "array_merge($activeSlugs, ['giam_doc_khoi'])", 'role repair removes director access from public registration');

const requiredGroups = [
  'company_units',
  'property_tags',
  'property_statuses',
  'visibility_levels',
  'signing_criteria',
  'price_segments',
  'customer_statuses',
];

for (const group of requiredGroups) {
  assertIncludes(seed, `'${group}'`, `seed includes config group ${group}`);
}
for (const option of ['tag_o_to', 'tag_thang_may', 'tag_mo_spa', 'vl_vinh_danh', 'sc_e_contract', 'cs_viewing']) {
  assertIncludes(seed, `'${option}'`, `seed includes option ${option}`);
}
const seedInsertBlocks = countMatches(seed, /^INSERT INTO `/gm);
const seedUpsertBlocks = countMatches(seed, /ON DUPLICATE KEY UPDATE/g);
assert(seedInsertBlocks > 0, 'seed SQL has insert blocks');
assert(seedInsertBlocks === seedUpsertBlocks, 'every seed INSERT block is idempotent with ON DUPLICATE KEY UPDATE');

const requiredRoutes = [
  ['GET', '/api/svp/config'],
  ['POST', '/api/svp/config/options'],
  ['PUT', '/api/svp/config/options/{id}'],
  ['GET', '/api/svp/properties'],
  ['POST', '/api/svp/properties'],
  ['GET', '/api/svp/properties/{id}'],
  ['PUT', '/api/svp/properties/{id}'],
  ['DELETE', '/api/svp/properties/{id}'],
  ['GET', '/api/svp/properties/{id}/timeline'],
  ['GET', '/api/svp/properties/{id}/versions'],
  ['GET', '/api/svp/properties/{id}/media'],
  ['POST', '/api/svp/properties/{id}/media'],
  ['POST', '/api/svp/properties/{id}/media-upload'],
  ['GET', '/api/svp/customers'],
  ['POST', '/api/svp/customers'],
  ['DELETE', '/api/svp/customers/{id}'],
  ['GET', '/api/svp/customer-needs'],
  ['POST', '/api/svp/customer-needs'],
  ['DELETE', '/api/svp/customer-needs/{id}'],
  ['GET', '/api/svp/viewing-schedules'],
  ['POST', '/api/svp/viewing-schedules'],
  ['DELETE', '/api/svp/viewing-schedules/{id}'],
  ['GET', '/api/svp/referrals'],
  ['POST', '/api/svp/referrals'],
  ['DELETE', '/api/svp/referrals/{id}'],
  ['GET', '/api/svp/audit-logs'],
];

for (const [method, route] of requiredRoutes) assertRoute(routes, method, route);

assertIncludes(routerIndex, "require_once __DIR__ . '/svp-routes.php';", 'main PHP router loads SVP routes');
assertIncludes(routerIndex, "require_once __DIR__ . '/svp-media-routes.php';", 'main PHP router loads media library routes');
assertRoute(mediaRoutes, 'GET', '/api/svp/admin/media');
assertRoute(mediaRoutes, 'POST', '/api/svp/admin/media');
assertRoute(mediaRoutes, 'PATCH', '/api/svp/admin/media/{id}');
assertRoute(mediaRoutes, 'DELETE', '/api/svp/admin/media/{id}');
assertIncludes(mediaRoutes, "svp_require_role('admin_tong', 'admin')", 'media browsing and upload allow both administrator roles');
assertIncludes(mediaRoutes, "svp_require_role('admin_tong')", 'only owner admin can hide media');
assertIncludes(mediaRoutes, 'Upload::handleUpload($files)', 'media upload uses the central secure image validator');
assertIncludes(mediaRoutes, 'SET deleted_at=NOW()', 'media removal is a non-destructive soft hide');
assertIncludes(routerIndex, "svp_media_register_upload($db, $url, $actorId, 'admin_upload'", 'legacy admin image uploads also enter the shared media library');
assertIncludes(routerIndex, "UPDATE svp_media_library SET deleted_at=NOW()", 'legacy admin upload cleanup also hides the deleted file from the media library');
assertIncludes(mediaApi, "body.append('images[]', file)", 'frontend media upload sends multiple image files');
assertIncludes(mediaField, 'MediaPickerModal', 'shared image field can select from the media library');
assertIncludes(adminMediaPage, 'Kho Media', 'admin media library page is implemented');
assertIncludes(appRoutes, 'path="/quan-tri/kho-media"', 'media library admin route is registered');
assertIncludes(sidebar, "path: '/quan-tri/kho-media'", 'media library appears in the admin sidebar');
assertIncludes(routerIndex, "$router->add('GET', '/api/svp/health'", 'SVP health route is registered');
assertIncludes(routerIndex, "$router->add('POST', '/api/auth/avatar'", 'avatar upload route is registered');
assertIncludes(routerIndex, 'Upload::handleAvatarUpload($_FILES[\'avatar\'])', 'avatar upload route uses centralized upload validation');
assertIncludes(routerIndex, "$router->add('DELETE', '/api/uploads'", 'admin upload delete route is registered');
assertIncludes(routerIndex, 'Only files inside backend/uploads can be deleted', 'admin upload delete route refuses non-upload paths');
assertIncludes(routerIndex, 'Refusing to delete non-media upload file', 'admin upload delete route refuses dotfiles and non-media files');
assertIncludes(routerIndex, "$router->add('DELETE', '/api/inquiries/{id}'", 'admin inquiry delete route is registered');
assertIncludes(routerIndex, "$router->add('DELETE', '/api/reports/{id}'", 'admin report delete route is registered');
assertIncludes(routerIndex, "$router->add('DELETE', '/api/schedules/{id}'", 'admin schedule delete route is registered');
assertIncludes(routerIndex, 'DELETE FROM inquiries WHERE id = :id', 'admin inquiry delete route removes persisted inquiry');
assertIncludes(routerIndex, 'DELETE FROM reports WHERE id = :id', 'admin report delete route removes persisted report');
assertIncludes(routerIndex, 'DELETE FROM schedules WHERE id = :id', 'admin schedule delete route removes persisted schedule');
for (const table of [...baseTables, ...requiredTables]) {
  assertIncludes(routerIndex, `'${table}'`, `healthcheck expects ${table}`);
}
assertIncludes(routerIndex, 'information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table_name', 'healthcheck uses MariaDB-compatible information_schema table checks');
assert(!routerIndex.includes('SHOW TABLES LIKE :table_name'), 'healthcheck avoids SHOW TABLES placeholders that fail on native PDO MySQL');
assertIncludes(routerIndex, "'seedReady'", 'healthcheck reports seed readiness');
assertIncludes(routerIndex, "'missingSeedGroups'", 'healthcheck reports missing seed groups');
assertIncludes(routerIndex, "'configOptionCount'", 'healthcheck reports config option count');
assertIncludes(routerIndex, "'runtime'", 'healthcheck reports runtime diagnostics');
assertIncludes(routerIndex, "'requiredExtensions'", 'healthcheck reports required PHP extensions');
assertIncludes(routerIndex, "'missingRequiredExtensions'", 'healthcheck reports missing required PHP extensions');
assertIncludes(routerIndex, "'fileUploadsEnabled'", 'healthcheck reports PHP file_uploads state');
assertIncludes(routerIndex, "'storage'", 'healthcheck reports storage diagnostics');
assertIncludes(routerIndex, "'uploadsWritable'", 'healthcheck reports uploads writability');
assertIncludes(routerIndex, "'tempWritable'", 'healthcheck reports PHP temp writability');

assertIncludes(propertyApi, "apiDelete(`/api/inquiries/${encodeURIComponent(id)}`", 'frontend API deletes persisted inquiries');
assertIncludes(propertyApi, "apiDelete(`/api/reports/${encodeURIComponent(id)}`", 'frontend API deletes persisted reports');
assertIncludes(propertyApi, "apiDelete(`/api/schedules/${encodeURIComponent(id)}`", 'frontend API deletes persisted schedules');
assertIncludes(inquiryService, 'apiDeleteInquiry(id)', 'inquiry service uses delete endpoint in API mode');
assertIncludes(reportService, 'apiDeleteReport(id)', 'report service uses delete endpoint in API mode');
assertIncludes(scheduleService, 'apiDeleteSchedule(id)', 'schedule service uses delete endpoint in API mode');
assert(!inquiryService.includes('TODO: Add delete inquiry API endpoint'), 'inquiry API-mode delete is implemented');
assert(!reportService.includes('TODO: Add delete report API endpoint'), 'report API-mode delete is implemented');
assert(!scheduleService.includes('TODO: Add delete schedule API endpoint'), 'schedule API-mode delete is implemented');

for (const endpoint of ['/api/svp/config', '/api/svp/properties', '/api/svp/customers', '/api/svp/customer-needs', '/api/svp/viewing-schedules', '/api/svp/referrals', '/api/svp/audit-logs']) {
  assertIncludes(svpApi, endpoint, `frontend calls ${endpoint}`);
}
assertIncludes(svpTypes, "mediaType: 'image' | 'video' | 'document' | 'other'", 'frontend media types match SQL enum core values');
assertIncludes(svpApi, 'uploadPropertyMediaImages', 'frontend SVP API can upload property media images');
assertIncludes(svpApi, '/api/svp/properties/${encodeURIComponent(propertyId)}/media-upload', 'frontend SVP API calls property media-upload route');
assertIncludes(svpApi, 'readFileAsDataUrl', 'frontend SVP API keeps local fallback for media previews');
assertIncludes(svpPostPropertyPage, 'Ảnh / tài liệu', 'SVP post property form has image/document upload section');
assertIncludes(svpPostPropertyPage, 'Chọn nhiều ảnh: HĐ, sổ đỏ, ảnh nhà, tự sướng', 'SVP post property form matches customer image upload workflow');
assertIncludes(svpPostPropertyPage, 'accept="image/jpeg,image/png,image/webp"', 'SVP post property form limits upload picker to supported image types');
assertIncludes(svpPostPropertyPage, 'pendingMedia.length + selected.length > 41', 'SVP post property form enforces 41-image limit before submit');
assertIncludes(svpPostPropertyPage, 'uploadPropertyMediaImages', 'SVP post property form uploads pending media after property create');
assertIncludes(svpPostPropertyPage, 'Lưu hồ sơ nhà', 'SVP post property form has a production save action');

for (const fileContent of [configExample, robots, sitemap, envExample, indexHtml]) {
  assertIncludes(fileContent, 'sodovanphuc.vn', 'official domain appears in deploy-facing config');
}
assertIncludes(indexHtml, '<link rel="canonical" href="https://sodovanphuc.vn/" />', 'HTML shell has production canonical URL');
assertIncludes(indexHtml, '<meta property="og:url" content="https://sodovanphuc.vn/" />', 'HTML shell has production OG URL');
assertIncludes(indexHtml, '<meta property="og:image" content="https://sodovanphuc.vn/og-image.jpg" />', 'HTML shell has absolute production OG image');
assertIncludes(indexHtml, '<meta name="twitter:image" content="https://sodovanphuc.vn/og-image.jpg" />', 'HTML shell has absolute production Twitter image');
assertIncludes(seoManager, 'setCanonical(currentUrl)', 'runtime SEO updates canonical URL per route');
assertIncludes(seoManager, "setMeta('property', 'og:url', currentUrl)", 'runtime SEO updates OG URL per route');
assertIncludes(routerIndex, "POST', '/api/ai/chat'", 'backend exposes AI chat proxy route');
assertIncludes(propertyApi, '/api/ai/description', 'frontend AI description uses backend proxy route');
assertIncludes(propertyApi, '/api/ai/chat', 'frontend AI chat uses backend proxy route');
assertIncludes(aiDescriptionService, 'generateAiDescription', 'frontend AI description calls backend proxy client');
assertIncludes(aiDescriptionService, 'backend/config/config.php only', 'frontend AI service documents backend-only AI keys');
assert(!aiDescriptionService.includes('VITE_AI_API_KEY'), 'frontend AI service does not read public AI API keys');
assert(!aiDescriptionService.includes('api.openai.com'), 'frontend AI service does not call OpenAI directly');
assert(!aiDescriptionService.includes('generativelanguage.googleapis.com'), 'frontend AI service does not call Gemini directly');
assertIncludes(inboxPage, 'generateAiChatReply', 'inbox AI chat calls backend proxy client');
assertIncludes(inboxPage, 'backend/config/config.php only', 'inbox AI chat documents backend-only AI keys');
assert(!inboxPage.includes('VITE_AI_API_KEY'), 'inbox AI chat does not read public AI API keys');
assert(!inboxPage.includes('api.openai.com'), 'inbox AI chat does not call OpenAI directly');
assert(!inboxPage.includes('generativelanguage.googleapis.com'), 'inbox AI chat does not call Gemini directly');
assert(!envExample.includes('VITE_AI_API_KEY'), 'env example does not expose a public AI key variable');
assert(!languageContext.includes('VITE_AI_API_KEY'), 'language strings do not instruct public AI keys');
assertIncludes(envExample, 'AI_GEMINI_KEY', 'env example points AI keys to backend config');
assertIncludes(configExample, "define('BASE_URL', 'https://sodovanphuc.vn/backend');", 'same-domain BASE_URL is documented');
assertIncludes(configExample, "define('FRONTEND_URL', 'https://sodovanphuc.vn');", 'frontend URL is configured');
assertIncludes(configExample, "define('DB_CONNECT_TIMEOUT', 3);", 'database connect timeout is configured');
assertIncludes(configExample, "'https://www.sodovanphuc.vn'", 'www domain is allowed by CORS');
assertIncludes(configExample, "define('UPLOAD_AVATAR_MAX_SIZE'", 'avatar upload max size is configured');
assertIncludes(configExample, "define('UPLOAD_AVATAR_ALLOWED_TYPES'", 'avatar upload MIME allow-list is configured');
assertIncludes(frontendHtaccess, 'RewriteRule ^api(/.*)?$ backend/api/index.php [QSA,L]', 'same-domain /api rewrite is configured');
assertIncludes(frontendHtaccess, 'https://sodovanphuc.vn%{REQUEST_URI}', 'production canonical HTTPS redirect is configured');
assertIncludes(frontendHtaccess, '^www\\.sodovanphuc\\.vn$', 'www domain redirects to canonical domain');
assertIncludes(frontendHtaccess, 'Options -Indexes', 'frontend disables directory indexes');
assertIncludes(frontendHtaccess, 'Header always set X-Content-Type-Options "nosniff"', 'frontend sets nosniff security header');
assertIncludes(frontendHtaccess, 'Header always set X-Frame-Options "SAMEORIGIN"', 'frontend sets frame protection header');
assertIncludes(frontendHtaccess, 'Header always set Referrer-Policy "strict-origin-when-cross-origin"', 'frontend sets referrer policy');
assertIncludes(backendHtaccess, 'Options -Indexes', 'backend disables directory indexes');
assertIncludes(backendHtaccess, 'RewriteRule ^config(/|$) - [F,L]', 'backend .htaccess blocks config directory');
assertIncludes(backendHtaccess, 'RewriteRule ^lib(/|$) - [F,L]', 'backend .htaccess blocks lib directory');
assertIncludes(backendHtaccess, 'RewriteRule ^sql(/|$) - [F,L]', 'backend .htaccess blocks sql directory');
assertIncludes(backendHtaccess, '<FilesMatch "(^config\\.php$|\\.sql$|\\.env$|composer\\.(json|lock)$)">', 'backend .htaccess blocks sensitive file patterns');
assertIncludes(backendHtaccess, '<IfModule !mod_authz_core.c>', 'backend .htaccess includes Apache 2.2 deny fallback');
assertIncludes(backendHtaccess, 'Order allow,deny', 'backend .htaccess Apache 2.2 fallback denies sensitive files');
assertIncludes(backendHtaccess, 'Header always set X-Content-Type-Options "nosniff"', 'backend sets nosniff security header');
assertIncludes(read('backend', 'uploads', '.htaccess'), '<IfModule mod_mime.c>', 'uploads .htaccess keeps handler removal shared-hosting friendly');
assertIncludes(read('backend', 'uploads', '.htaccess'), 'RemoveHandler .php .phtml', 'uploads .htaccess removes script handlers');
assertIncludes(read('backend', 'uploads', '.htaccess'), 'Require all denied', 'uploads .htaccess blocks executable upload extensions');
assertIncludes(sitemap, 'https://sodovanphuc.vn/dashboard', 'sitemap points to production dashboard');
assertIncludes(robots, 'Sitemap: https://sodovanphuc.vn/sitemap.xml', 'robots points to production sitemap');

const legacyPattern = new RegExp([
  'Global' + 'Forumz',
  'global' + 'forumz',
  'vanphuc\\.edu\\.vn',
  'api\\.vanphuc\\.edu\\.vn',
  'tenmien' + 'cuakhach',
  'api\\.tenmien' + 'cuakhach',
  'contact@vanphuc\\.edu\\.vn',
  'your' + '-domain',
  'api\\.domain\\.com',
].join('|'), 'i');

for (const [name, content] of [
  ['backend config example', configExample],
  ['robots.txt', robots],
  ['sitemap.xml', sitemap],
  ['frontend htaccess', frontendHtaccess],
  ['backend htaccess', backendHtaccess],
]) {
  assert(!legacyPattern.test(content), `${name} has no legacy domain/placeholders`);
}

for (const table of requiredTables) {
  assertIncludes(sqlVerify, `'${table}'`, `SQL verifier checks ${table}`);
}
for (const marker of [
  '01_required_tables',
  '02_property_media_contract',
  '03_json_columns',
  '04_foreign_keys',
  '05_seed_groups',
  '06_seed_options_minimum',
  '07_core_seed_options',
  '08_ready_for_healthcheck',
]) {
  assertIncludes(sqlVerify, marker, `SQL verifier includes ${marker}`);
}
for (const group of requiredGroups) {
  assertIncludes(sqlVerify, `'${group}'`, `SQL verifier checks seed group ${group}`);
}

assertIncludes(uploadLib, 'public static function handleAvatarUpload', 'Upload class validates avatar uploads centrally');
assertIncludes(uploadLib, "self::validateMagicBytes($avatar['tmp_name'], $avatar['name'])", 'avatar upload validates image magic bytes');
assertIncludes(uploadLib, "self::storeUploadedFile($avatar, self::getExtensionFromMime($mimeType), 'avatars')", 'avatar upload stores randomized avatar files');
assertIncludes(databaseLib, 'DB_CONNECT_TIMEOUT', 'database layer reads configured connection timeout');
assertIncludes(databaseLib, 'PDO::ATTR_TIMEOUT', 'database layer uses PDO connection timeout');
assertIncludes(databaseLib, 'max(1, (int) DB_CONNECT_TIMEOUT)', 'database timeout is clamped to at least one second');

for (const protectedPath of [
  '/backend/config/config.example.php',
  '/backend/sql/schema.sql',
  '/backend/sql/002_add_property_video_url.sql',
  '/backend/sql/003_add_property_social_links.sql',
  '/backend/sql/004_users_banners_blog.sql',
  '/backend/sql/005_chat_messages.sql',
  '/backend/sql/006_property_likes.sql',
  '/backend/sql/007_add_coordinates.sql',
  '/backend/sql/007_add_expiry_notified.sql',
  '/backend/sql/008_bank_transfers.sql',
  '/backend/sql/009_property_image_unique.sql',
  '/backend/sql/seed.sql',
  '/backend/sql/sodovanphuc_import_all.sql',
  '/backend/sql/sodovanphuc_schema.sql',
  '/backend/sql/sodovanphuc_seed.sql',
  '/backend/sql/sodovanphuc_verify.sql',
  '/backend/sql/database_verify.sql',
  '/backend/lib/Database.php',
  '/backend/.htaccess',
  '/backend/uploads/.htaccess',
]) {
  assertIncludes(hostingSmoke, protectedPath, `hosting smoke protects ${protectedPath}`);
}
assertIncludes(hostingSmoke, 'is publicly readable', 'hosting smoke fails if protected paths return HTTP 200');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '/backend/sql/sodovanphuc_import_all.sql', 'hosting diagnostic protects one-file import SQL');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '/backend/sql/002_add_property_video_url.sql', 'hosting diagnostic protects property video migration SQL');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '/backend/sql/003_add_property_social_links.sql', 'hosting diagnostic protects property social links migration SQL');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '/backend/sql/009_property_image_unique.sql', 'hosting diagnostic protects property image uniqueness migration SQL');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '/backend/sql/database_verify.sql', 'hosting diagnostic protects full database verifier SQL');
assertIncludes(hostingSmoke, 'Assert-CanonicalRedirect', 'hosting smoke checks canonical HTTP redirect');
assertIncludes(hostingSmoke, 'Assert-SecurityHeaders', 'hosting smoke checks core security headers');
assertIncludes(hostingSmoke, "Invoke-CheckedJson -Path '/api/svp/config'", 'hosting smoke checks SVP config API JSON');
assertIncludes(hostingSmoke, 'Invoke-AiProxySanity', 'hosting smoke implements AI proxy sanity checks');
assertIncludes(hostingSmoke, "AI description proxy sanity smoke", 'hosting smoke checks AI description proxy JSON fallback');
assertIncludes(hostingSmoke, "AI chat proxy sanity smoke", 'hosting smoke checks AI chat proxy JSON fallback');
assertIncludes(hostingSmoke, 'PHP file_uploads is disabled', 'hosting smoke fails when PHP file_uploads is disabled');
for (const endpoint of ['/api/svp/properties', '/api/svp/customers', '/api/svp/customer-needs', '/api/svp/viewing-schedules', '/api/svp/referrals', '/api/svp/audit-logs']) {
  assertIncludes(hostingSmoke, endpoint, `hosting smoke checks ${endpoint}`);
}
assertIncludes(gitignore, 'backend/config/config.php', 'gitignore excludes real backend config');
assertIncludes(gitignore, 'backend/api/debug_test.php', 'gitignore excludes backend debug script');
assertIncludes(gitignore, '.runtime/', 'gitignore excludes local portable runtime tools');
assertIncludes(gitignore, 'qa/', 'gitignore excludes local QA reports and browser artifacts');
assertIncludes(gitignore, 'hosting-wait-reports/', 'gitignore excludes local hosting wait reports');
assertIncludes(gitignore, 'hosting-complete-reports/', 'gitignore excludes local handoff autopilot reports');
assertIncludes(gitignore, 'release/', 'gitignore excludes release work directories and manifests');
assertIncludes(gitignore, '*.zip', 'gitignore excludes configured release zips with secrets');
assertIncludes(packageJson, '"ps:parse"', 'package scripts include PowerShell syntax parse');
assertIncludes(packageJson, '"php:runtime"', 'package scripts include strict PHP runtime smoke');
assertIncludes(packageJson, '"php:runtime:optional"', 'package scripts include optional PHP runtime smoke');
assertIncludes(packageJson, '"release:drill"', 'package scripts include exact upload zip drill');
assertIncludes(packageJson, '"release:configured-dryrun"', 'package scripts include configured upload zip dry-run');
assertIncludes(packageJson, '"config:verify:template"', 'package scripts include hosting config template verifier');
assertIncludes(packageJson, '"config:dryrun"', 'package scripts include hosting config dry-run');
assertIncludes(packageJson, '"preupload:report"', 'package scripts include pre-upload report');
assertIncludes(packageJson, '"final:audit"', 'package scripts include final pre-hosting audit');
assertIncludes(packageJson, '"prehost:proof"', 'package scripts include one-command pre-hosting proof');
assertIncludes(packageJson, '"hosting:diagnose"', 'package scripts include hosting diagnostic');
assertIncludes(packageJson, '"hosting:cutover"', 'package scripts include domain cutover report');
assertIncludes(packageJson, '"hosting:cutover:ready"', 'package scripts include strict domain cutover report');
assertIncludes(packageJson, '"hosting:browser"', 'package scripts include live browser hosting smoke');
assertIncludes(packageJson, '"hosting:wait"', 'package scripts include hosting readiness watcher');
assertIncludes(packageJson, '"hosting:wait:write"', 'package scripts include write workflow hosting readiness watcher');
assertIncludes(packageJson, '"hosting:ready"', 'package scripts include final hosting ready gate');
assertIncludes(packageJson, '"hosting:smoke:write"', 'package scripts include write workflow hosting smoke');
assertIncludes(packageJson, '"hosting:ready:write"', 'package scripts include write workflow ready gate');
assertIncludes(packageJson, '"hosting:complete"', 'package scripts include post-upload handoff autopilot');
assertIncludes(packageJson, '"hosting:complete:safe"', 'package scripts include safe post-upload handoff autopilot');
assertIncludes(packageJson, '"hosting:acceptance"', 'package scripts include full hosting acceptance report');
assertIncludes(packageJson, '"hosting:acceptance:safe"', 'package scripts include safe hosting acceptance report');
assertIncludes(packageJson, 'npm run php:parse && npm run ps:parse && npm run config:verify:template && npm run config:dryrun && npm run php:runtime:optional && npm run contract:verify', 'prehost runs syntax, config and PHP runtime smoke gates before contract verify');
assertIncludes(packageJson, 'npm run release && npm run release:verify && npm run release:drill', 'prehost drills the exact release upload zip after release verification');
assertIncludes(packageJson, 'npm run release:drill && npm run release:configured-dryrun', 'prehost dry-runs the configured upload zip flow after base upload drill');
assertIncludes(hostingConfigGenerator, 'Assert-StrongAdminPassword', 'hosting config generator enforces a strong admin password');
assertIncludes(hostingConfigGenerator, 'Admin password must be at least 14 characters', 'hosting config generator rejects short admin passwords');
assertIncludes(hostingConfigGenerator, "foreach ($weakWord in @('password', 'matkhau', 'admin', 'vanphuc', 'sodovanphuc', '123456', 'qwerty'))", 'hosting config generator rejects common weak admin password words');
assertIncludes(releaseBuilder, 'MAT_KHAU_ADMIN_MANH must be at least 14 characters', 'release builder documents strong admin password requirements');
assertIncludes(hostingConfigDryRun, '-AdminPassword $AdminPassword', 'config dry-run tests admin password based generation');
assertIncludes(hostingConfigDryRun, 'Dry-run config did not contain a supported admin password hash', 'config dry-run checks generated admin hash');
assertIncludes(hostingConfigDryRun, 'Dry-run config did not contain a generated JWT secret', 'config dry-run checks generated JWT secret');
assertIncludes(hostingConfigDryRun, "Weak admin password rejection passed", 'config dry-run proves weak admin passwords are rejected');
assertIncludes(phpRuntimeSmoke, '$RequirePhp', 'PHP runtime smoke supports strict PHP requirement');
assertIncludes(phpRuntimeSmoke, '/api/svp/health', 'PHP runtime smoke checks SVP health route');
assertIncludes(phpRuntimeSmoke, 'PHP runtime required extensions are loaded', 'PHP runtime smoke checks required PHP extensions');
assertIncludes(phpRuntimeSmoke, 'PHP file_uploads is disabled', 'PHP runtime smoke fails when file_uploads is disabled');
assertIncludes(phpRuntimeSmoke, 'PHP runtime upload storage and temp directory are writable', 'PHP runtime smoke checks upload/temp writability');
assertIncludes(phpRuntimeSmoke, '/api/ai/description', 'PHP runtime smoke checks AI description proxy JSON fallback');
assertIncludes(phpRuntimeSmoke, '/api/ai/chat', 'PHP runtime smoke checks AI chat proxy JSON fallback');
assertIncludes(phpRuntimeSmoke, 'PHP runtime AI chat proxy returns JSON fallback when AI key is blank', 'PHP runtime smoke verifies AI chat blank-key fallback');
assertIncludes(phpRuntimeSmoke, "OPTIONS", 'PHP runtime smoke checks CORS preflight');
assertIncludes(phpRuntimeSmoke, '/api/svp/not-a-real-route', 'PHP runtime smoke checks JSON 404 route');
assertIncludes(phpRuntimeSmoke, 'Start-Process', 'PHP runtime smoke starts PHP built-in server');
assertIncludes(phpRuntimeSmoke, 'new-hosting-config.ps1', 'PHP runtime smoke generates temporary config safely');
assertIncludes(phpRuntimeSmoke, "Split-Path -Leaf $rootParent", 'PHP runtime smoke can locate app runtime from release tools');
assertIncludes(phpRuntimeSmoke, ".runtime\\php\\php.exe", 'PHP runtime smoke searches portable PHP runtime');
assertIncludes(releaseUploadDrill, 'sodovanphuc-full-public_html.zip', 'upload drill extracts the exact full public_html zip');
assertIncludes(releaseUploadDrill, 'Expand-Archive', 'upload drill expands the release zip to temp public_html');
assertIncludes(releaseUploadDrill, 'backend\\config\\config.php', 'upload drill generates temporary extracted config.php');
assertIncludes(releaseUploadDrill, 'new-hosting-config.ps1', 'upload drill uses the hosting config generator');
assertIncludes(releaseUploadDrill, 'verify-hosting-config.ps1', 'upload drill verifies the temporary hosting config');
assertIncludes(releaseUploadDrill, '.svp-upload-drill-router.php', 'upload drill uses a temporary same-domain router');
assertIncludes(releaseUploadDrill, '$ZipPath', 'upload drill can drill a specific upload zip path');
assertIncludes(releaseUploadDrill, '$ExpectConfigInZip', 'upload drill can require config.php to be inside the upload zip');
assertIncludes(releaseUploadDrill, '/api/svp/health', 'upload drill checks SVP health through the extracted public_html package');
assertIncludes(releaseUploadDrill, 'upload drill required PHP extensions are loaded', 'upload drill checks required PHP extensions');
assertIncludes(releaseUploadDrill, 'PHP file_uploads is disabled', 'upload drill fails when PHP file_uploads is disabled');
assertIncludes(releaseUploadDrill, 'upload drill upload storage and temp directory are writable', 'upload drill checks upload/temp writability');
assertIncludes(releaseUploadDrill, 'Invoke-DrillMultipartUpload', 'upload drill can POST multipart media');
assertIncludes(releaseUploadDrill, '/api/uploads', 'upload drill exercises the authenticated upload endpoint');
assertIncludes(releaseUploadDrill, 'upload drill uploads a real PNG through multipart and serves it from backend/uploads', 'upload drill verifies uploaded PNG is publicly served');
assertIncludes(releaseUploadDrill, 'upload drill deletes uploaded PNG through admin endpoint', 'upload drill verifies upload cleanup endpoint');
assertIncludes(releaseUploadDrill, 'upload drill verifies uploaded PNG cleanup', 'upload drill verifies uploaded PNG is not readable after cleanup');
assertIncludes(releaseUploadDrill, '/api/svp/properties/$svpPropertyId/media-upload', 'upload drill tests SVP property media-upload route');
assertIncludes(releaseUploadDrill, 'upload drill verifies SVP property media-upload route end to end', 'upload drill verifies SVP media-upload list round trip');
assertIncludes(releaseUploadDrill, 'robots.txt', 'upload drill checks deployed robots.txt');
assertIncludes(releaseUploadDrill, 'sitemap.xml', 'upload drill checks deployed sitemap.xml');
assertIncludes(releaseUploadDrill, '$RequirePhp', 'upload drill supports strict PHP requirement');
assertIncludes(releaseUploadDrill, 'UPLOAD_THIS_PACKAGE.txt', 'upload drill excludes release-only upload pointer from public_html');
assertIncludes(releaseUploadDrill, 'REAL_UPLOAD_READY.md', 'upload drill excludes real upload manifest from public_html');
assertIncludes(configuredUploadZipDryRun, 'prepare-real-upload.ps1', 'configured zip dry-run uses the real upload preparation wrapper');
assertIncludes(configuredUploadZipDryRun, 'svp-configured-zip-dryrun-', 'configured zip dry-run uses an isolated temp release folder');
assertIncludes(configuredUploadZipDryRun, "SetEnvironmentVariable('SVP_DB_PASS'", 'configured zip dry-run passes DB password through a process env secret');
assertIncludes(configuredUploadZipDryRun, "SetEnvironmentVariable('SVP_ADMIN_PASSWORD'", 'configured zip dry-run passes admin password through a process env secret');
assertIncludes(configuredUploadZipDryRun, 'ConfiguredZipDryRun!234', 'configured zip dry-run uses fake credentials');
assertIncludes(configuredUploadZipDryRun, 'real upload manifest does not contain dry-run credential values', 'configured zip dry-run checks the real upload manifest does not leak credentials');
assertIncludes(configuredUploadZipDryRun, 'without touching the real release folder', 'configured zip dry-run documents it does not touch real release artifacts');
assertIncludes(configuredZipBuilder, 'sodovanphuc-configured-public_html.zip', 'configured zip builder creates configured upload zip');
assertIncludes(configuredZipBuilder, "public_html/backend/config/config.php", 'configured zip builder verifies real config in public_html');
assertIncludes(configuredZipBuilder, 'test-release-upload-drill.ps1', 'configured zip builder runs exact upload drill after creating configured zip');
assertIncludes(configuredZipBuilder, 'ExpectConfigInZip = $true', 'configured zip builder drills configured zip with config.php expected');
assertIncludes(configuredZipBuilder, 'AdminPasswordForUploadDrill', 'configured zip builder can pass admin password to upload drill without writing it to reports');
assertIncludes(configuredZipBuilder, 'RequirePhp = $true', 'configured zip builder requires PHP for configured zip drill');
assertIncludes(configuredZipBuilder, '-AiGeminiKey $AiGeminiKey', 'configured zip builder passes backend-only AI key to config generator');
assertIncludes(configuredZipBuilder, '$SkipDrill', 'configured zip builder can explicitly skip drill only when necessary');
assertIncludes(configuredZipBuilder, 'configured zip exact upload drill passed', 'configured zip builder reports configured zip drill proof');
assertIncludes(configuredZipBuilder, 'Configured upload zip created. This file contains real secrets', 'configured zip builder warns about secrets');
assertIncludes(configuredZipBuilder, 'public_html/REAL_UPLOAD_READY.md', 'configured zip builder excludes real upload manifest from public_html');
assertIncludes(realUploadPreparer, 'verify-release-package.ps1', 'real upload preparer verifies base release package first');
assertIncludes(realUploadPreparer, 'Resolve-SecretValue', 'real upload preparer resolves secrets through parameters, env or prompt');
assertIncludes(realUploadPreparer, 'SVP_DB_PASS', 'real upload preparer can read DB password from process env');
assertIncludes(realUploadPreparer, 'SVP_ADMIN_PASSWORD', 'real upload preparer can read admin password from process env');
assertIncludes(realUploadPreparer, 'SVP_AI_GEMINI_KEY', 'real upload preparer can read backend-only AI key from process env');
assertIncludes(realUploadPreparer, '-PromptSecrets', 'real upload preparer can securely prompt for missing secrets');
assertIncludes(realUploadPreparer, 'build-configured-public-html.ps1', 'real upload preparer uses configured zip builder');
assertIncludes(realUploadPreparer, 'AiGeminiKey = $AiGeminiKey', 'real upload preparer passes AI key only into configured backend package');
assertIncludes(realUploadPreparer, 'sodovanphuc-configured-public_html.zip', 'real upload preparer creates configured upload zip');
assertIncludes(realUploadPreparer, 'REAL_UPLOAD_READY.md', 'real upload preparer writes local upload manifest');
assertIncludes(realUploadPreparer, 'READY_FOR_UPLOAD', 'real upload preparer marks final local readiness');
assertIncludes(realUploadPreparer, 'configured upload checksum matches zip', 'real upload preparer verifies configured zip checksum');
assertIncludes(realUploadPreparer, 'without credential values', 'real upload manifest avoids credential values');
assertIncludes(realUploadPreparer, 'real upload manifest has no control characters', 'real upload preparer rejects control characters in manifest');
assertIncludes(realUploadPreparer, '`$env:SVP_LIVE_ADMIN_PASSWORD', 'real upload preparer preserves live admin env command in manifest');
assertIncludes(realUploadPreparer, 'acceptance-report-vanphuc-hosting.ps1 -IncludeWriteWorkflow', 'real upload manifest points to final acceptance gate');
assertIncludes(realUploadPreparer, 'public_html/REAL_UPLOAD_READY.md', 'real upload preparer excludes manifest from public_html');
assertIncludes(realUploadCleanup, '$ConfirmUploadedAndAccepted', 'real upload cleanup requires explicit upload and acceptance confirmation');
assertIncludes(realUploadCleanup, 'sodovanphuc-configured-public_html.zip', 'real upload cleanup removes configured upload zip');
assertIncludes(realUploadCleanup, 'sodovanphuc-configured-public_html.sha256.txt', 'real upload cleanup removes configured upload checksum');
assertIncludes(realUploadCleanup, 'configured-public_html', 'real upload cleanup removes configured work directory');
assertIncludes(realUploadCleanup, 'REAL_UPLOAD_READY.md', 'real upload cleanup removes real upload manifest');
assertIncludes(realUploadCleanup, 'Assert-PathInsideRelease', 'real upload cleanup refuses paths outside the release root');
assertIncludes(realUploadCleanup, 'Remove-Item -LiteralPath $artifact -Recurse -Force', 'real upload cleanup recursively removes only verified configured work directories');
assertIncludes(domainCutoverReport, 'DOMAIN_CUTOVER_REPORT.md', 'domain cutover report writes markdown evidence');
assertIncludes(domainCutoverReport, 'qa\\domain-cutover', 'domain cutover report writes app-level evidence before release');
assertIncludes(domainCutoverReport, 'domain-cutover-reports', 'domain cutover report writes release-level evidence when run from tools');
assertIncludes(domainCutoverReport, 'Resolve-DnsName -Name $Name -Type $Type', 'domain cutover report resolves DNS records');
assertIncludes(domainCutoverReport, 'Root A record', 'domain cutover report checks root A record');
assertIncludes(domainCutoverReport, 'www DNS record', 'domain cutover report checks www DNS');
assertIncludes(domainCutoverReport, 'HTTPS root', 'domain cutover report checks strict HTTPS');
assertIncludes(domainCutoverReport, 'HTTP canonical redirect', 'domain cutover report checks HTTP canonical redirect');
assertIncludes(domainCutoverReport, 'www canonical redirect', 'domain cutover report checks www canonical redirect');
assertIncludes(domainCutoverReport, 'Exact Mat Bao cutover actions:', 'domain cutover report prints exact Mat Bao actions');
assertIncludes(domainCutoverReport, 'typhumoigioi.hoola.vn', 'domain cutover report explicitly calls out the stale www CNAME to remove');
assertIncludes(domainCutoverReport, '$RequireReady -and $finalStatus -ne', 'domain cutover report can fail when strict readiness is required');
assertIncludes(hostingWaiter, 'TimeoutMinutes', 'hosting readiness watcher has timeout control');
assertIncludes(hostingWaiter, 'IntervalSeconds', 'hosting readiness watcher has retry interval control');
assertIncludes(hostingWaiter, 'MaxAttempts', 'hosting readiness watcher can cap attempts for snapshots/tests');
assertIncludes(hostingWaiter, 'ready-vanphuc-hosting.ps1', 'hosting readiness watcher runs final ready gate');
assertIncludes(hostingWaiter, 'diagnose-vanphuc-hosting.ps1', 'hosting readiness watcher supports diagnostic-only mode');
assertIncludes(hostingWaiter, 'HOSTING_WAIT_REPORT.md', 'hosting readiness watcher writes markdown report');
assertIncludes(hostingWaiter, 'RedirectStandardOutput', 'hosting readiness watcher captures stdout into attempt logs');
assertIncludes(hostingWaiter, 'RedirectStandardError', 'hosting readiness watcher captures stderr into attempt logs');
assertIncludes(hostingWaiter, '-IncludeWriteWorkflow', 'hosting readiness watcher can include write workflow');
assertIncludes(hostingWaiter, '-SkipBrowserSmoke', 'hosting readiness watcher can skip browser smoke explicitly');
assertIncludes(hostingWaiter, 'DiagnosticOnly', 'hosting readiness watcher can run diagnostic-only propagation polling');
assertIncludes(hostingWaiter, 'exit 1', 'hosting readiness watcher exits non-zero on timeout');
assertIncludes(hostingHandoffAutopilot, 'wait-vanphuc-hosting-ready.ps1', 'handoff autopilot runs hosting readiness watcher');
assertIncludes(hostingHandoffAutopilot, 'domain-cutover-report-vanphuc.ps1', 'handoff autopilot runs domain cutover report first');
assertIncludes(hostingHandoffAutopilot, 'DOMAIN_CUTOVER_REPORT.md', 'handoff autopilot records domain cutover report');
assertIncludes(hostingHandoffAutopilot, 'Domain DNS/SSL cutover report', 'handoff autopilot names DNS/SSL cutover step');
assertIncludes(hostingHandoffAutopilot, 'acceptance-report-vanphuc-hosting.ps1', 'handoff autopilot runs acceptance report');
assertIncludes(hostingHandoffAutopilot, 'cleanup-real-upload-artifacts.ps1', 'handoff autopilot can clean configured upload artifacts');
assertIncludes(hostingHandoffAutopilot, 'HOSTING_HANDOFF_COMPLETE.md', 'handoff autopilot writes final handoff report');
assertIncludes(hostingHandoffAutopilot, 'ACCEPTANCE_REPORT.md', 'handoff autopilot verifies acceptance report');
assertIncludes(hostingHandoffAutopilot, '- Final status: PASS', 'handoff autopilot requires PASS acceptance status');
assertIncludes(hostingHandoffAutopilot, 'CleanupConfiguredArtifacts requires -ConfirmUploadedAndAccepted', 'handoff autopilot refuses cleanup without confirmation');
assertIncludes(hostingHandoffAutopilot, 'WaitMaxAttempts', 'handoff autopilot exposes wait max attempts');
assertIncludes(hostingHandoffAutopilot, 'SkipWait', 'handoff autopilot can skip wait only when explicitly requested');
assertIncludes(hostingHandoffAutopilot, 'qa\\hosting-complete', 'handoff autopilot writes app-level evidence');
assertIncludes(hostingConfigGenerator, 'New-HexSecret', 'hosting config generator creates JWT secrets');
assertIncludes(hostingConfigGenerator, 'password_hash($argv[1], PASSWORD_BCRYPT)', 'hosting config generator can create bcrypt hashes with PHP CLI');
assertIncludes(hostingConfigGenerator, 'New-Pbkdf2Hash', 'hosting config generator has PHP-free PBKDF2 fallback');
assertIncludes(hostingConfigGenerator, 'Rfc2898DeriveBytes', 'hosting config generator derives PBKDF2 hashes locally');
assertIncludes(hostingConfigGenerator, '-AdminPassword', 'hosting config generator supports plain admin password input');
assertIncludes(hostingConfigGenerator, '$AiGeminiKey', 'hosting config generator accepts backend-only AI Gemini key');
assertIncludes(hostingConfigGenerator, 'AI_GEMINI_KEY = $AiGeminiKey', 'hosting config generator writes AI key only into backend config');
assertIncludes(hostingConfigGenerator, 'UTF8Encoding($false)', 'hosting config generator writes PHP config without UTF-8 BOM');
assertIncludes(hostingConfigGenerator, 'verify-hosting-config.ps1', 'hosting config generator verifies generated config');
assertIncludes(hostingConfigVerifier, 'JWT_SECRET must be 64 hex characters', 'hosting config verifier validates JWT secret');
assertIncludes(hostingConfigVerifier, 'ADMIN_PASSWORD_HASH must be a real bcrypt or pbkdf2_sha256 hash', 'hosting config verifier validates admin password hash');
assertIncludes(hostingConfigVerifier, 'ADMIN_PASSWORD_HASH is a PBKDF2-SHA256 hash', 'hosting config verifier accepts PBKDF2 admin hash');
assertIncludes(hostingConfigVerifier, 'AI_GEMINI_KEY is configured as a backend-only secret', 'hosting config verifier handles backend-only AI key');
assertIncludes(hostingConfigVerifier, 'backend AI proxy will fall back safely', 'hosting config verifier accepts blank backend AI key');
assertIncludes(hostingConfigVerifier, "define('BASE_URL', 'https://sodovanphuc.vn/backend');", 'hosting config verifier validates production BASE_URL');
assertIncludes(routerIndex, 'function gfz_verify_admin_password', 'backend verifies admin password through compatibility helper');
assertIncludes(routerIndex, "hash_pbkdf2('sha256', $password, $salt, $iterations, 64, false)", 'backend verifies PBKDF2 admin password hashes');
assertIncludes(routerIndex, 'password_verify($password, $storedHash)', 'backend remains compatible with bcrypt admin password hashes');
assertIncludes(releaseBuilder, "'new-hosting-config.ps1'", 'release builder copies hosting config generator into release tools');
assertIncludes(releaseBuilder, "'test-php-runtime.ps1'", 'release builder copies PHP runtime smoke into release tools');
assertIncludes(releaseBuilder, "'test-release-upload-drill.ps1'", 'release builder copies exact upload zip drill into release tools');
assertIncludes(releaseBuilder, "'test-configured-upload-zip-dryrun.ps1'", 'release builder copies configured upload zip dry-run into release tools');
assertIncludes(releaseBuilder, "'build-configured-public-html.ps1'", 'release builder copies configured zip builder into release tools');
assertIncludes(releaseBuilder, "'prepare-real-upload.ps1'", 'release builder copies real upload preparation wrapper into tools');
assertIncludes(releaseBuilder, "'cleanup-real-upload-artifacts.ps1'", 'release builder copies real upload artifact cleanup tool into tools');
assertIncludes(releaseBuilder, "'domain-cutover-report-vanphuc.ps1'", 'release builder copies domain cutover report into tools');
assertIncludes(releaseBuilder, "'wait-vanphuc-hosting-ready.ps1'", 'release builder copies hosting readiness watcher into tools');
assertIncludes(releaseBuilder, "'complete-vanphuc-hosting-handoff.ps1'", 'release builder copies post-upload handoff autopilot into tools');
assertIncludes(releaseBuilder, '`$env:SVP_DB_PASS', 'release builder preserves DB password env command in generated docs');
assertIncludes(releaseBuilder, '`$env:SVP_ADMIN_PASSWORD', 'release builder preserves admin password env command in generated docs');
assertIncludes(releaseBuilder, '`$env:SVP_LIVE_ADMIN_PASSWORD', 'release builder preserves live admin password env command in generated docs');
assertIncludes(releaseBuilder, 'Safer command-history-friendly configured zip command', 'release builder writes safer configured zip command into upload pointer');
assertIncludes(releaseBuilder, 'cleanup-real-upload-artifacts.ps1 -ConfirmUploadedAndAccepted', 'release builder documents post-acceptance configured artifact cleanup');
assertIncludes(releaseBuilder, 'domain-cutover-report-vanphuc.ps1', 'release builder documents domain cutover report');
assertIncludes(releaseBuilder, 'DOMAIN_CUTOVER_REPORT.md', 'release builder documents domain cutover report output');
assertIncludes(releaseBuilder, 'wait-vanphuc-hosting-ready.ps1 -IncludeWriteWorkflow', 'release builder documents hosting readiness watcher');
assertIncludes(releaseBuilder, 'HOSTING_WAIT_REPORT.md', 'release builder documents hosting wait report');
assertIncludes(releaseBuilder, 'complete-vanphuc-hosting-handoff.ps1 -IncludeWriteWorkflow', 'release builder documents post-upload handoff autopilot');
assertIncludes(releaseBuilder, 'HOSTING_HANDOFF_COMPLETE.md', 'release builder documents handoff autopilot report');
assertIncludes(releaseBuilder, 'writes `DOMAIN_CUTOVER_REPORT.md`', 'release builder documents handoff autopilot domain cutover output');
assertIncludes(releaseBuilder, 'sodovanphuc_import_all.sql', 'release builder creates one-file SQL import bundle');
assertIncludes(releaseBuilder, 'base app schema, required migrations, base seed, SVP schema, SVP seed, then verification', 'release builder documents full one-file SQL import order');
assertIncludes(releaseBuilder, '002_add_property_video_url.sql', 'release builder bundles property video migration');
assertIncludes(releaseBuilder, '003_add_property_social_links.sql', 'release builder bundles property social links migration');
assertIncludes(releaseBuilder, '004_users_banners_blog.sql', 'release builder bundles base users/banners/blog migration');
assertIncludes(releaseBuilder, '008_bank_transfers.sql', 'release builder bundles bank transfers migration');
assertIncludes(releaseBuilder, '009_property_image_unique.sql', 'release builder bundles property image uniqueness migration');
assertIncludes(releaseBuilder, 'database_verify.sql', 'release builder bundles full database verifier');
assertIncludes(releaseBuilder, "Path = $baseSchemaSqlSource", 'release builder bundles base schema SQL into one-file import');
assertIncludes(releaseBuilder, "Path = $databaseVerifySqlSource", 'release builder bundles full database verifier into one-file import');
assertIncludes(releaseBuilder, "Path = $schemaSqlSource", 'release builder bundles schema SQL into one-file import');
assertIncludes(releaseBuilder, "Path = $seedSqlSource", 'release builder bundles seed SQL into one-file import');
assertIncludes(releaseBuilder, "Path = $verifySqlSource", 'release builder bundles verify SQL into one-file import');
assertIncludes(releaseBuilder, 'Get-Content -LiteralPath $section.Path -Raw', 'release builder writes each SQL section into one-file import');
assertIncludes(releaseBuilder, 'New-Object System.Text.UTF8Encoding($false)', 'release builder writes one-file SQL import without UTF-8 BOM');
assertIncludes(releaseVerifier, 'sql\\sodovanphuc_import_all.sql', 'release verifier requires one-file import SQL in backend stage');
assertIncludes(releaseVerifier, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'release verifier requires one-file import SQL in upload zip');
assertIncludes(releaseVerifier, 'Assert-SqlImportBundleFile', 'release verifier checks one-file SQL import bundle content');
assertIncludes(releaseVerifier, 'same-domain SQL $sqlFile exists inside public_html', 'release verifier requires one-file import SQL in same-domain stage');
assertIncludes(releaseVerifier, "'backend stage one-file import SQL'", 'release verifier checks backend stage one-file SQL import bundle');
assertIncludes(releaseVerifier, "'same-domain one-file import SQL'", 'release verifier checks same-domain one-file SQL import bundle');
assertIncludes(releaseVerifier, 'runs base schema, migrations, seeds, SVP schema, SVP seed and verifiers in order', 'release verifier checks full one-file SQL import order');
assertIncludes(releaseVerifier, 'uses idempotent upserts for seed data', 'release verifier checks one-file SQL seed upserts');
assertIncludes(releaseVerifier, '002_add_property_video_url.sql', 'release verifier requires property video migration');
assertIncludes(releaseVerifier, '003_add_property_social_links.sql', 'release verifier requires property social links migration');
assertIncludes(releaseVerifier, '009_property_image_unique.sql', 'release verifier requires property image uniqueness migration');
assertIncludes(releaseVerifier, 'must not contain destructive DROP TABLE statements', 'release verifier rejects destructive SQL import bundles');
assertIncludes(releaseVerifier, 'must not contain MariaDB-only ALTER IF NOT EXISTS statements', 'release verifier rejects MariaDB-only ALTER IF NOT EXISTS syntax');
assertIncludes(releaseVerifier, 'database_verify.sql', 'release verifier requires full database verifier SQL');
assertIncludes(releaseVerifier, "'00_base_tables' AS check_name", 'release verifier checks full database verifier content');
assertIncludes(releaseVerifier, "'00_property_media_columns' AS check_name", 'release verifier checks property media/social verifier content');
assertIncludes(releaseVerifier, "'00_property_image_unique_key' AS check_name", 'release verifier checks property image unique verifier content');
assertIncludes(releaseVerifier, 'public_html/src/', 'release verifier forbids frontend source folder inside upload zip');
assertIncludes(releaseVerifier, 'public_html/node_modules/', 'release verifier forbids node_modules inside upload zip');
assertIncludes(releaseVerifier, 'deployment stages exclude source maps and TypeScript source artifacts', 'release verifier rejects source maps and TypeScript artifacts in deploy stages');
assertIncludes(releaseVerifier, 'frontend deploy assets contain no public AI provider key or direct provider endpoint', 'release verifier rejects public frontend AI keys/endpoints');
assertIncludes(releaseVerifier, 'Zip contains forbidden development/source artifact suffix', 'release verifier rejects source maps and TypeScript artifacts in upload zip');
assertIncludes(releasePackageVerifier, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'standalone release verifier requires one-file import SQL in upload zip');
assertIncludes(releasePackageVerifier, 'Get-ZipEntryBytes', 'standalone release verifier reads one-file SQL import bytes from zip');
assertIncludes(releasePackageVerifier, 'one-file import SQL in zip has no UTF-8 BOM', 'standalone release verifier checks one-file SQL import has no BOM');
assertIncludes(releasePackageVerifier, "'one-file import SQL in zip'", 'standalone release verifier checks one-file SQL import bundle in zip');
assertIncludes(releasePackageVerifier, 'runs base schema, migrations, seeds, SVP schema, SVP seed and verifiers in order', 'standalone release verifier checks full one-file SQL import order in zip');
assertIncludes(releasePackageVerifier, 'uses idempotent upserts for seed data', 'standalone release verifier checks one-file SQL seed upserts in zip');
assertIncludes(releasePackageVerifier, '002_add_property_video_url.sql', 'standalone release verifier requires property video migration in zip');
assertIncludes(releasePackageVerifier, '003_add_property_social_links.sql', 'standalone release verifier requires property social links migration in zip');
assertIncludes(releasePackageVerifier, '009_property_image_unique.sql', 'standalone release verifier requires property image uniqueness migration in zip');
assertIncludes(releasePackageVerifier, 'must not contain destructive DROP TABLE statements', 'standalone release verifier rejects destructive SQL import bundles');
assertIncludes(releasePackageVerifier, 'must not contain MariaDB-only ALTER IF NOT EXISTS statements', 'standalone release verifier rejects MariaDB-only ALTER IF NOT EXISTS syntax');
assertIncludes(releasePackageVerifier, 'database_verify.sql', 'standalone release verifier requires full database verifier SQL');
assertIncludes(releasePackageVerifier, "'00_base_tables' AS check_name", 'standalone release verifier checks full database verifier content');
assertIncludes(releasePackageVerifier, "'00_property_media_columns' AS check_name", 'standalone release verifier checks property media/social verifier content');
assertIncludes(releasePackageVerifier, "'00_property_image_unique_key' AS check_name", 'standalone release verifier checks property image unique verifier content');
assertIncludes(releasePackageVerifier, 'public_html/src/', 'standalone release verifier forbids frontend source folder inside upload zip');
assertIncludes(releasePackageVerifier, 'public_html/node_modules/', 'standalone release verifier forbids node_modules inside upload zip');
assertIncludes(releasePackageVerifier, 'Full zip contains forbidden development/source artifact suffix', 'standalone release verifier rejects source maps and TypeScript artifacts in upload zip');
assertIncludes(releasePackageVerifier, 'frontend zip assets contain no public AI provider key or direct provider endpoint', 'standalone release verifier rejects public frontend AI keys/endpoints');
assertIncludes(finalPrehostingAudit, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'final pre-hosting audit requires one-file import SQL');
assertIncludes(finalPrehostingAudit, 'public_html/backend/sql/002_add_property_video_url.sql', 'final pre-hosting audit requires property video migration');
assertIncludes(finalPrehostingAudit, 'public_html/backend/sql/003_add_property_social_links.sql', 'final pre-hosting audit requires property social links migration');
assertIncludes(finalPrehostingAudit, 'public_html/backend/sql/009_property_image_unique.sql', 'final pre-hosting audit requires property image uniqueness migration');
assertIncludes(finalPrehostingAudit, 'public_html/backend/sql/database_verify.sql', 'final pre-hosting audit requires full database verifier SQL');
assertIncludes(finalPrehostingAudit, 'public_html/node_modules/', 'final pre-hosting audit forbids node_modules inside upload zip');
assertIncludes(finalPrehostingAudit, 'development artifacts', 'final pre-hosting audit rejects development artifacts in upload zip');
assertIncludes(preuploadReport, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'pre-upload report requires one-file import SQL');
assertIncludes(preuploadReport, 'public_html/backend/sql/002_add_property_video_url.sql', 'pre-upload report requires property video migration');
assertIncludes(preuploadReport, 'public_html/backend/sql/003_add_property_social_links.sql', 'pre-upload report requires property social links migration');
assertIncludes(preuploadReport, 'public_html/backend/sql/009_property_image_unique.sql', 'pre-upload report requires property image uniqueness migration');
assertIncludes(preuploadReport, 'public_html/backend/sql/database_verify.sql', 'pre-upload report requires full database verifier SQL');
assertIncludes(preuploadReport, 'public_html/src/', 'pre-upload report forbids frontend source folder inside upload zip');
assertIncludes(preuploadReport, 'absent suffix in public_html', 'pre-upload report records source map and TypeScript artifact absence');
assertIncludes(releaseUploadDrill, 'backend\\sql\\sodovanphuc_import_all.sql', 'upload drill requires one-file import SQL after extraction');
assertIncludes(releaseUploadDrill, 'backend\\sql\\002_add_property_video_url.sql', 'upload drill requires property video migration after extraction');
assertIncludes(releaseUploadDrill, 'backend\\sql\\003_add_property_social_links.sql', 'upload drill requires property social links migration after extraction');
assertIncludes(releaseUploadDrill, 'backend\\sql\\009_property_image_unique.sql', 'upload drill requires property image uniqueness migration after extraction');
assertIncludes(releaseUploadDrill, 'backend\\sql\\database_verify.sql', 'upload drill requires full database verifier SQL after extraction');
assertIncludes(releaseUploadDrill, 'node_modules', 'upload drill forbids node_modules after extraction');
assertIncludes(releaseUploadDrill, 'extracted upload excludes source maps and TypeScript source artifacts', 'upload drill rejects source maps and TypeScript artifacts after extraction');
assertIncludes(configuredZipBuilder, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'configured zip builder requires one-file import SQL');
assertIncludes(configuredZipBuilder, 'public_html/backend/sql/002_add_property_video_url.sql', 'configured zip builder requires property video migration');
assertIncludes(configuredZipBuilder, 'public_html/backend/sql/003_add_property_social_links.sql', 'configured zip builder requires property social links migration');
assertIncludes(configuredZipBuilder, 'public_html/backend/sql/009_property_image_unique.sql', 'configured zip builder requires property image uniqueness migration');
assertIncludes(configuredZipBuilder, 'public_html/backend/sql/database_verify.sql', 'configured zip builder requires full database verifier SQL');
assertIncludes(realUploadPreparer, 'public_html/backend/sql/sodovanphuc_import_all.sql', 'real upload preparer requires one-file import SQL');
assertIncludes(realUploadPreparer, 'public_html/backend/sql/002_add_property_video_url.sql', 'real upload preparer requires property video migration');
assertIncludes(realUploadPreparer, 'public_html/backend/sql/003_add_property_social_links.sql', 'real upload preparer requires property social links migration');
assertIncludes(realUploadPreparer, 'public_html/backend/sql/009_property_image_unique.sql', 'real upload preparer requires property image uniqueness migration');
assertIncludes(realUploadPreparer, 'public_html/backend/sql/database_verify.sql', 'real upload preparer requires full database verifier SQL');
assertIncludes(readme, 'backend/sql/sodovanphuc_import_all.sql', 'README documents one-file DB import');
assertIncludes(readme, 'backend/sql/002_add_property_video_url.sql', 'README documents property video migration');
assertIncludes(readme, 'backend/sql/003_add_property_social_links.sql', 'README documents property social links migration');
assertIncludes(readme, 'backend/sql/009_property_image_unique.sql', 'README documents property image uniqueness migration');
assertIncludes(readme, 'backend/sql/database_verify.sql', 'README documents full database verifier');
assertIncludes(handoff, 'backend/sql/sodovanphuc_import_all.sql', 'handoff docs document one-file DB import');
assertIncludes(handoff, 'backend/sql/002_add_property_video_url.sql', 'handoff docs document property video migration');
assertIncludes(handoff, 'backend/sql/003_add_property_social_links.sql', 'handoff docs document property social links migration');
assertIncludes(handoff, 'backend/sql/009_property_image_unique.sql', 'handoff docs document property image uniqueness migration');
assertIncludes(handoff, 'backend/sql/database_verify.sql', 'handoff docs document full database verifier');
assertIncludes(backendReadme, 'backend/sql/sodovanphuc_import_all.sql', 'backend README documents one-file DB import');
assertIncludes(backendReadme, 'backend/sql/002_add_property_video_url.sql', 'backend README documents property video migration');
assertIncludes(backendReadme, 'backend/sql/003_add_property_social_links.sql', 'backend README documents property social links migration');
assertIncludes(backendReadme, 'backend/sql/009_property_image_unique.sql', 'backend README documents property image uniqueness migration');
assertIncludes(backendReadme, 'backend/sql/database_verify.sql', 'backend README documents full database verifier');
assertIncludes(usageGuide, 'backend/sql/sodovanphuc_import_all.sql', 'usage guide documents one-file DB import');
assertIncludes(usageGuide, 'backend/sql/002_add_property_video_url.sql', 'usage guide documents property video migration');
assertIncludes(usageGuide, 'backend/sql/003_add_property_social_links.sql', 'usage guide documents property social links migration');
assertIncludes(usageGuide, 'backend/sql/009_property_image_unique.sql', 'usage guide documents property image uniqueness migration');
assertIncludes(usageGuide, 'backend/sql/database_verify.sql', 'usage guide documents full database verifier');
assertIncludes(rootDeployChecklist, 'backend/sql/sodovanphuc_import_all.sql', 'root deploy checklist documents one-file DB import');
assertIncludes(rootDeployChecklist, 'backend/sql/002_add_property_video_url.sql', 'root deploy checklist documents property video migration');
assertIncludes(rootDeployChecklist, 'backend/sql/003_add_property_social_links.sql', 'root deploy checklist documents property social links migration');
assertIncludes(rootDeployChecklist, 'backend/sql/009_property_image_unique.sql', 'root deploy checklist documents property image uniqueness migration');
assertIncludes(rootDeployChecklist, 'backend/sql/database_verify.sql', 'root deploy checklist documents full database verifier');
assertIncludes(masterPlan, 'sodovanphuc_import_all.sql', 'internal master plan documents one-file DB import');
assertIncludes(masterPlan, '002_add_property_video_url.sql', 'internal master plan documents property video migration');
assertIncludes(masterPlan, '003_add_property_social_links.sql', 'internal master plan documents property social links migration');
assertIncludes(masterPlan, '009_property_image_unique.sql', 'internal master plan documents property image uniqueness migration');
assertIncludes(masterPlan, 'database_verify.sql', 'internal master plan documents full database verifier');
assertIncludes(readme, 'wait-vanphuc-hosting-ready.ps1', 'README documents hosting readiness watcher');
assertIncludes(handoff, 'wait-vanphuc-hosting-ready.ps1', 'handoff docs document hosting readiness watcher');
assertIncludes(usageGuide, 'wait-vanphuc-hosting-ready.ps1', 'usage guide documents hosting readiness watcher');
assertIncludes(rootDeployChecklist, 'wait-vanphuc-hosting-ready.ps1', 'root deploy checklist documents hosting readiness watcher');
assertIncludes(masterPlan, 'wait-vanphuc-hosting-ready.ps1', 'internal master plan documents hosting readiness watcher');
assertIncludes(readme, 'domain-cutover-report-vanphuc.ps1', 'README documents domain cutover report');
assertIncludes(handoff, 'domain-cutover-report-vanphuc.ps1', 'handoff docs document domain cutover report');
assertIncludes(usageGuide, 'domain-cutover-report-vanphuc.ps1', 'usage guide documents domain cutover report');
assertIncludes(rootDeployChecklist, 'domain-cutover-report-vanphuc.ps1', 'root deploy checklist documents domain cutover report');
assertIncludes(masterPlan, 'domain-cutover-report-vanphuc.ps1', 'internal master plan documents domain cutover report');
assertIncludes(readme, 'DOMAIN_CUTOVER_REPORT.md', 'README documents domain cutover report output');
assertIncludes(handoff, 'DOMAIN_CUTOVER_REPORT.md', 'handoff docs document domain cutover report output');
assertIncludes(usageGuide, 'DOMAIN_CUTOVER_REPORT.md', 'usage guide documents domain cutover report output');
assertIncludes(rootDeployChecklist, 'DOMAIN_CUTOVER_REPORT.md', 'root deploy checklist documents domain cutover report output');
assertIncludes(masterPlan, 'DOMAIN_CUTOVER_REPORT.md', 'internal master plan documents domain cutover report output');
assertIncludes(readme, 'complete-vanphuc-hosting-handoff.ps1', 'README documents post-upload handoff autopilot');
assertIncludes(handoff, 'complete-vanphuc-hosting-handoff.ps1', 'handoff docs document post-upload handoff autopilot');
assertIncludes(usageGuide, 'complete-vanphuc-hosting-handoff.ps1', 'usage guide documents post-upload handoff autopilot');
assertIncludes(rootDeployChecklist, 'complete-vanphuc-hosting-handoff.ps1', 'root deploy checklist documents post-upload handoff autopilot');
assertIncludes(masterPlan, 'complete-vanphuc-hosting-handoff.ps1', 'internal master plan documents post-upload handoff autopilot');
assertIncludes(readme, 'HOSTING_WAIT_REPORT.md', 'README documents hosting wait report');
assertIncludes(handoff, 'HOSTING_WAIT_REPORT.md', 'handoff docs document hosting wait report');
assertIncludes(usageGuide, 'HOSTING_WAIT_REPORT.md', 'usage guide documents hosting wait report');
assertIncludes(rootDeployChecklist, 'HOSTING_WAIT_REPORT.md', 'root deploy checklist documents hosting wait report');
assertIncludes(masterPlan, 'HOSTING_WAIT_REPORT.md', 'internal master plan documents hosting wait report');
assertIncludes(readme, 'HOSTING_HANDOFF_COMPLETE.md', 'README documents handoff autopilot report');
assertIncludes(handoff, 'HOSTING_HANDOFF_COMPLETE.md', 'handoff docs document handoff autopilot report');
assertIncludes(usageGuide, 'HOSTING_HANDOFF_COMPLETE.md', 'usage guide documents handoff autopilot report');
assertIncludes(rootDeployChecklist, 'HOSTING_HANDOFF_COMPLETE.md', 'root deploy checklist documents handoff autopilot report');
assertIncludes(masterPlan, 'HOSTING_HANDOFF_COMPLETE.md', 'internal master plan documents handoff autopilot report');
assertIncludes(readme, 'ON DUPLICATE KEY UPDATE', 'README documents idempotent default seed import');
assertIncludes(handoff, 'ON DUPLICATE KEY UPDATE', 'handoff docs document idempotent default seed import');
assertIncludes(backendReadme, 'ON DUPLICATE KEY UPDATE', 'backend README documents idempotent default seed import');
assertIncludes(usageGuide, 'ON DUPLICATE KEY UPDATE', 'usage guide documents idempotent default seed import');
assertIncludes(rootDeployChecklist, 'ON DUPLICATE KEY UPDATE', 'root deploy checklist documents idempotent default seed import');
assertIncludes(masterPlan, 'ON DUPLICATE KEY UPDATE', 'internal master plan documents idempotent default seed import');
assertIncludes(releaseBuilder, 'tools/test-php-runtime.ps1', 'release checklist documents PHP runtime smoke');
assertIncludes(releaseBuilder, 'tools/test-release-upload-drill.ps1', 'release checklist documents exact upload zip drill');
assertIncludes(releaseBuilder, 'tools/test-configured-upload-zip-dryrun.ps1', 'release checklist documents configured upload zip dry-run');
assertIncludes(releaseBuilder, 'tools/prepare-real-upload.ps1', 'release checklist documents real upload preparation wrapper');
assertIncludes(releaseBuilder, 'tools/cleanup-real-upload-artifacts.ps1', 'release checklist documents real upload artifact cleanup tool');
assertIncludes(releaseBuilder, 'tools/domain-cutover-report-vanphuc.ps1', 'release checklist documents domain cutover report');
assertIncludes(releaseBuilder, 'tools/wait-vanphuc-hosting-ready.ps1', 'release checklist documents hosting readiness watcher');
assertIncludes(releaseBuilder, 'tools/complete-vanphuc-hosting-handoff.ps1', 'release checklist documents post-upload handoff autopilot');
assertIncludes(releaseBuilder, 'tools/final-prehosting-audit.ps1', 'release checklist documents final pre-hosting audit');
assertIncludes(releaseBuilder, 'npm run prehost:proof', 'release checklist documents one-command pre-hosting proof');
assertIncludes(releaseBuilder, 'sodovanphuc-configured-public_html.zip', 'release checklist documents configured upload zip');
assertIncludes(releaseBuilder, 'REAL_UPLOAD_READY.md', 'release checklist documents real upload manifest');
assertIncludes(releaseBuilder, '-AdminPassword "MAT_KHAU_ADMIN_MANH"', 'release checklist uses admin password instead of precomputed hash');
assertIncludes(releaseBuilder, "'diagnose-vanphuc-hosting.ps1'", 'release builder copies hosting diagnostic into release tools');
assertIncludes(releaseBuilder, "'domain-cutover-report-vanphuc.ps1'", 'release builder copies domain cutover report into release tools');
assertIncludes(releaseBuilder, "'wait-vanphuc-hosting-ready.ps1'", 'release builder copies hosting readiness watcher into release tools');
assertIncludes(releaseBuilder, "'browser-smoke-vanphuc-hosting.ps1'", 'release builder copies hosting browser smoke into release tools');
assertIncludes(releaseBuilder, "'ready-vanphuc-hosting.ps1'", 'release builder copies final hosting ready gate into release tools');
assertIncludes(releaseBuilder, "'complete-vanphuc-hosting-handoff.ps1'", 'release builder copies post-upload handoff autopilot into release tools');
assertIncludes(releaseBuilder, "'acceptance-report-vanphuc-hosting.ps1'", 'release builder copies acceptance report into release tools');
assertIncludes(releaseBuilder, "'preupload-report-sodovanphuc.ps1'", 'release builder copies pre-upload report into release tools');
assertIncludes(releaseBuilder, "'final-prehosting-audit.ps1'", 'release builder copies final pre-hosting audit into release tools');
assertIncludes(releaseBuilder, "'run-prehosting-proof.ps1'", 'release builder copies one-command proof runner into release tools');
assertIncludes(releaseBuilder, 'POST_UPLOAD_CHECKLIST.md', 'release builder writes post-upload checklist');
assertIncludes(releaseBuilder, 'UPLOAD_THIS_PACKAGE.txt', 'release builder writes upload pointer');
assertIncludes(releaseBuilder, 'Final status: PASS', 'release docs block handoff until acceptance report passes');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool new-hosting-config.ps1 exists', 'release verifier requires config generator tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool test-php-runtime.ps1 exists', 'release verifier requires PHP runtime smoke tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool test-release-upload-drill.ps1 exists', 'release verifier requires exact upload zip drill tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool test-configured-upload-zip-dryrun.ps1 exists', 'release verifier requires configured upload zip dry-run tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool build-configured-public-html.ps1 exists', 'release verifier requires configured zip builder tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool prepare-real-upload.ps1 exists', 'release verifier requires real upload preparation wrapper');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool cleanup-real-upload-artifacts.ps1 exists', 'release verifier requires real upload artifact cleanup tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool domain-cutover-report-vanphuc.ps1 exists', 'release verifier requires domain cutover report tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool diagnose-vanphuc-hosting.ps1 exists', 'release verifier requires hosting diagnostic tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool wait-vanphuc-hosting-ready.ps1 exists', 'release verifier requires hosting readiness watcher tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool browser-smoke-vanphuc-hosting.ps1 exists', 'release verifier requires hosting browser smoke tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool ready-vanphuc-hosting.ps1 exists', 'release verifier requires final hosting ready gate');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool complete-vanphuc-hosting-handoff.ps1 exists', 'release verifier requires post-upload handoff autopilot tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool acceptance-report-vanphuc-hosting.ps1 exists', 'release verifier requires acceptance report tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool preupload-report-sodovanphuc.ps1 exists', 'release verifier requires pre-upload report tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool final-prehosting-audit.ps1 exists', 'release verifier requires final pre-hosting audit tool');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool run-prehosting-proof.ps1 exists', 'release verifier requires one-command proof runner tool');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), 'Hosting diagnostic gate', 'ready gate runs strict hosting diagnostic');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), '-RequireReady', 'ready gate requires diagnostic pass status');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), 'Hosting smoke gate', 'ready gate runs hosting smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), 'Hosting browser smoke gate', 'ready gate runs live browser smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), '$SkipBrowserSmoke', 'ready gate can explicitly skip browser smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), '$IncludeWriteWorkflow', 'ready gate can run write workflow smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), '-IncludeWriteWorkflow', 'ready gate passes write workflow flag to smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), '& $browserSmokeScript -Domain $Domain -IncludeWriteWorkflow', 'ready gate passes write workflow flag to live browser smoke');
assertIncludes(read('deploy', 'ready-vanphuc-hosting.ps1'), 'verify-release-package.ps1', 'ready gate runs release package self-check when available');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'HTTP canonical redirect', 'hosting diagnostic checks HTTP canonical redirect');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Get-DnsARecords', 'hosting diagnostic normalizes DNS A record lookup');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'www DNS target', 'hosting diagnostic checks www DNS target');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Point www to the same hosting', 'hosting diagnostic warns when www points to a different host');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Core security headers', 'hosting diagnostic checks core security headers');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'SVP health JSON', 'hosting diagnostic checks SVP health JSON');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'AI proxy JSON', 'hosting diagnostic checks AI proxy JSON');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'safe-not-configured', 'hosting diagnostic accepts backend-only AI blank-key fallback');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Missing required PHP extensions', 'hosting diagnostic reports missing PHP extensions');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'backend/uploads is not writable by PHP', 'hosting diagnostic reports upload writability failures');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Protected backend internals', 'hosting diagnostic checks protected backend internals');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Remediation hints:', 'hosting diagnostic prints remediation hints for failed/warn checks');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Set www.$Domain as a CNAME', 'hosting diagnostic explains how to fix www DNS');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'Enable or reissue SSL for both', 'hosting diagnostic explains how to fix SSL readiness');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'import backend/sql/sodovanphuc_import_all.sql', 'hosting diagnostic explains how to fix health/database readiness');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), 'backend/.htaccess and backend/uploads/.htaccess', 'hosting diagnostic explains how to fix protected backend internals');
assertIncludes(read('deploy', 'diagnose-vanphuc-hosting.ps1'), '$RequireReady -and $failCount -gt 0', 'hosting diagnostic exits non-zero when readiness is required');
assertIncludes(hostingAcceptanceReport, 'ACCEPTANCE_REPORT.md', 'acceptance report writes markdown evidence');
assertIncludes(hostingAcceptanceReport, 'qa\\hosting-acceptance', 'acceptance report writes into QA evidence folder');
assertIncludes(hostingAcceptanceReport, 'verify-release-package.ps1', 'acceptance report runs release package verification');
assertIncludes(hostingAcceptanceReport, 'diagnose-vanphuc-hosting.ps1', 'acceptance report runs strict diagnostic');
assertIncludes(hostingAcceptanceReport, 'smoke-vanphuc-hosting.ps1', 'acceptance report runs API/write smoke');
assertIncludes(hostingAcceptanceReport, 'browser-smoke-vanphuc-hosting.ps1', 'acceptance report runs live browser smoke');
assertIncludes(hostingAcceptanceReport, '$browserArgs += \'-IncludeWriteWorkflow\'', 'acceptance report passes write workflow flag to live browser smoke');
assertIncludes(hostingAcceptanceReport, 'Admin auth smoke', 'acceptance report records admin auth smoke status');
assertIncludes(hostingAcceptanceReport, 'SVP_LIVE_ADMIN_PASSWORD', 'acceptance report documents env-gated admin auth smoke');
assertIncludes(hostingAcceptanceReport, 'Do not hand over', 'acceptance report blocks handoff on failures');
assertIncludes(preuploadReport, 'PREUPLOAD_REPORT.md', 'pre-upload report writes markdown evidence');
assertIncludes(preuploadReport, 'qa\\preupload', 'pre-upload report writes into QA evidence folder');
assertIncludes(preuploadReport, 'verify-release-package.ps1', 'pre-upload report runs release package verification');
assertIncludes(preuploadReport, 'test-release-upload-drill.ps1', 'pre-upload report runs exact upload zip drill');
assertIncludes(preuploadReport, 'Exact upload zip drill', 'pre-upload report names the exact upload zip drill step');
assertIncludes(preuploadReport, 'test-configured-upload-zip-dryrun.ps1', 'pre-upload report runs configured upload zip dry-run');
assertIncludes(preuploadReport, 'Configured upload zip dry-run', 'pre-upload report names the configured upload zip dry-run step');
assertIncludes(preuploadReport, 'test-php-runtime.ps1', 'pre-upload report runs strict PHP runtime smoke');
assertIncludes(preuploadReport, 'npm audit', 'pre-upload report runs npm audit');
assertIncludes(preuploadReport, 'Resolve-NpmCommand', 'pre-upload report resolves a system npm command');
assertIncludes(preuploadReport, '-WorkingDirectory $appRoot', 'pre-upload report runs npm audit in app root');
assertIncludes(preuploadReport, 'Full zip manifest safety', 'pre-upload report checks upload zip manifest');
assertIncludes(preuploadReport, "'-Domain', $Domain, '-RequireReady'", 'pre-upload report captures strict live-domain readiness snapshot');
assertIncludes(preuploadReport, 'EXPECTED_FAIL', 'pre-upload report can record expected live-domain failures before upload');
assertIncludes(finalPrehostingAudit, 'verify-release-package.ps1', 'final pre-hosting audit verifies release package first');
assertIncludes(finalPrehostingAudit, 'tools\\cleanup-real-upload-artifacts.ps1', 'final pre-hosting audit requires cleanup tool in the release');
assertIncludes(finalPrehostingAudit, 'tools\\domain-cutover-report-vanphuc.ps1', 'final pre-hosting audit requires domain cutover report in the release');
assertIncludes(finalPrehostingAudit, 'tools\\wait-vanphuc-hosting-ready.ps1', 'final pre-hosting audit requires hosting readiness watcher in the release');
assertIncludes(finalPrehostingAudit, 'tools\\complete-vanphuc-hosting-handoff.ps1', 'final pre-hosting audit requires post-upload handoff autopilot in the release');
assertIncludes(finalPrehostingAudit, 'sodovanphuc-configured-public_html.zip', 'final pre-hosting audit rejects configured zip artifacts in base release');
assertIncludes(finalPrehostingAudit, 'REAL_UPLOAD_READY.md', 'final pre-hosting audit rejects real upload manifests in base release');
assertIncludes(finalPrehostingAudit, 'config.php', 'final pre-hosting audit rejects config.php secrets in base release');
assertIncludes(finalPrehostingAudit, 'PREUPLOAD_REPORT.md', 'final pre-hosting audit requires pre-upload report evidence');
assertIncludes(finalPrehostingAudit, 'EXPECTED_FAIL', 'final pre-hosting audit accepts expected live-domain failure before upload');
assertIncludes(finalPrehostingAudit, 'only the current release directory remains', 'final pre-hosting audit enforces one current release folder');
assertIncludes(finalPrehostingAudit, 'final-prehosting-audit.ps1', 'final pre-hosting audit requires docs to mention itself');
assertIncludes(finalPrehostingAudit, 'cleanup-real-upload-artifacts.ps1', 'final pre-hosting audit requires docs to mention real upload artifact cleanup');
assertIncludes(finalPrehostingAudit, 'domain-cutover-report-vanphuc.ps1', 'final pre-hosting audit requires docs to mention domain cutover report');
assertIncludes(finalPrehostingAudit, 'wait-vanphuc-hosting-ready.ps1', 'final pre-hosting audit requires docs to mention hosting readiness watcher');
assertIncludes(finalPrehostingAudit, 'complete-vanphuc-hosting-handoff.ps1', 'final pre-hosting audit requires docs to mention post-upload handoff autopilot');
assertIncludes(prehostingProofRunner, "@('run', 'prehost')", 'one-command proof runner executes npm prehost first');
assertIncludes(prehostingProofRunner, 'preupload-report-sodovanphuc.ps1', 'one-command proof runner executes pre-upload report');
assertIncludes(prehostingProofRunner, 'domain-cutover-report-vanphuc.ps1', 'one-command proof runner executes domain cutover report');
assertIncludes(prehostingProofRunner, 'final-prehosting-audit.ps1', 'one-command proof runner executes final audit');
assertIncludes(prehostingProofRunner, 'PREHOSTING_PROOF.md', 'one-command proof runner writes final proof markdown');
assertIncludes(prehostingProofRunner, 'qa\\prehosting-proof', 'one-command proof runner writes proof into QA evidence folder');
assertIncludes(prehostingProofRunner, 'qa\\domain-cutover', 'one-command proof runner writes domain cutover evidence into QA folder');
assertIncludes(prehostingProofRunner, 'DOMAIN_CUTOVER_REPORT.md', 'one-command proof runner records domain cutover report path');
assertIncludes(prehostingProofRunner, 'EXPECTED_FAIL before real upload/SSL/config/DB', 'one-command proof runner records expected pre-upload live-domain state');
assertIncludes(prehostingProofRunner, 'domain-cutover-report-vanphuc.ps1 -RequireReady', 'one-command proof runner prints strict domain cutover command');
assertIncludes(prehostingProofRunner, 'prepare-real-upload.ps1', 'one-command proof runner prints next real DB credential command');
assertIncludes(prehostingProofRunner, 'complete-vanphuc-hosting-handoff.ps1', 'one-command proof runner prints post-upload handoff autopilot command');
assertIncludes(prehostingProofRunner, 'wait-vanphuc-hosting-ready.ps1', 'one-command proof runner prints hosting readiness watcher command');
assertIncludes(prehostingProofRunner, 'cleanup-real-upload-artifacts.ps1', 'one-command proof runner prints post-acceptance cleanup command');
assertIncludes(prehostingProofRunner, 'SVP_LIVE_ADMIN_PASSWORD', 'one-command proof runner prints optional admin auth smoke env setup');
assertIncludes(prehostingProofRunner, 'KeepOldPreuploadReports', 'one-command proof runner can keep old pre-upload reports when requested');
assertIncludes(prehostingProofRunner, 'KeepOldCutoverReports', 'one-command proof runner can keep old domain cutover reports when requested');
assertIncludes(prehostingProofRunner, 'KeepOldProofReports', 'one-command proof runner can keep old proof reports when requested');
assertIncludes(prehostingProofRunner, '$global:LASTEXITCODE = 0', 'one-command proof runner resets expected live-domain failure exit code after success');
assertIncludes(hostingBrowserSmoke, 'playwright.hosting.config.ts', 'browser smoke locates hosting Playwright config');
assertIncludes(hostingBrowserSmoke, 'qa\\hosting-live.spec.ts', 'browser smoke locates live spec');
assertIncludes(hostingBrowserSmoke, 'SVP_HOSTING_BASE_URL', 'browser smoke injects live base URL');
assertIncludes(hostingBrowserSmoke, 'SVP_LIVE_WRITE_WORKFLOW', 'browser smoke can enable live UI write workflow');
assertIncludes(localPlaywrightConfig, 'testIgnore: /hosting-live\\.spec\\.ts/', 'local Playwright QA excludes live hosting spec');
assertIncludes(hostingPlaywrightConfig, 'SVP_HOSTING_BASE_URL', 'hosting Playwright config uses live base URL env');
assertIncludes(hostingPlaywrightConfig, 'hosting-live\\.spec\\.ts', 'hosting Playwright config only runs live spec');
assertIncludes(hostingLiveSpec, 'watchRuntimeFailures', 'live spec watches runtime failures');
assertIncludes(hostingLiveSpec, 'HTTP ${status}: ${type}', 'live spec catches HTTP asset/API failures');
assertIncludes(hostingLiveSpec, 'should not render a blank app shell', 'live spec catches blank app shell');
assertIncludes(hostingLiveSpec, 'unknown live routes use the SPA fallback', 'live spec checks SPA fallback');
assertIncludes(hostingLiveSpec, 'has document horizontal overflow', 'live spec checks responsive overflow');
assertIncludes(hostingLiveSpec, 'Anh va tai lieu', 'live spec checks expert form upload section is visible');
assertIncludes(hostingLiveSpec, 'Anh duyet noi bo', 'live spec checks internal approval media copy is visible');
assertIncludes(hostingLiveSpec, 'SVP_LIVE_WRITE_WORKFLOW', 'live spec gates destructive UI write workflow behind an env flag');
assertIncludes(hostingLiveSpec, 'SVP_LIVE_ADMIN_PASSWORD', 'live spec gates admin browser login behind an env secret');
assertIncludes(hostingLiveSpec, 'live admin login form accepts configured credentials', 'live spec checks admin login form on real hosting');
assertIncludes(hostingLiveSpec, "localStorage.getItem('svp_token')", 'live spec verifies SVP JWT is stored after browser login');
assertIncludes(hostingLiveSpec, 'live UI can create a property through the real expert form and clean it up', 'live spec checks UI property creation on real hosting');
assertIncludes(hostingLiveSpec, "page.request.delete(`/api/svp/properties/", 'live spec cleans up UI-created property through API');
assertIncludes(hostingLiveSpec, 'visibleInputs.nth(2)', 'live spec fills the live expert property form');
assertIncludes(read('deploy', 'build-sodovanphuc-release.ps1'), "'verify-release-package.ps1'", 'release builder copies release package verifier into tools');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'release tool verify-release-package.ps1 exists', 'release verifier requires release package verifier tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Checksum mismatch or missing line', 'standalone release verifier validates artifact checksums');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Get-ZipEntryText', 'standalone release verifier reads critical files inside the full zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), "-replace '\\\\', '/'", 'standalone release verifier normalizes Windows zip entry separators');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'frontend index in zip has production canonical URL', 'standalone release verifier checks canonical URL inside zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'frontend index in zip has absolute production OG image', 'standalone release verifier checks production OG image inside zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'frontend .htaccess in zip redirects to canonical HTTPS domain', 'standalone release verifier checks frontend htaccess canonical redirect inside zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'backend .htaccess in zip includes Apache 2.2 deny fallback', 'standalone release verifier checks backend htaccess Apache fallback inside zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'uploads .htaccess in zip wraps handler removal for shared hosting', 'standalone release verifier checks uploads htaccess handler hardening inside zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'public_html/UPLOAD_THIS_PACKAGE.txt', 'standalone release verifier forbids upload pointer inside public_html zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'public_html/REAL_UPLOAD_READY.md', 'standalone release verifier forbids real upload manifest inside public_html zip');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\test-php-runtime.ps1', 'standalone release verifier requires PHP runtime smoke tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\test-release-upload-drill.ps1', 'standalone release verifier requires exact upload zip drill tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\test-configured-upload-zip-dryrun.ps1', 'standalone release verifier requires configured upload zip dry-run tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\prepare-real-upload.ps1', 'standalone release verifier requires real upload preparation wrapper');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\cleanup-real-upload-artifacts.ps1', 'standalone release verifier requires real upload artifact cleanup tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\domain-cutover-report-vanphuc.ps1', 'standalone release verifier requires domain cutover report tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\wait-vanphuc-hosting-ready.ps1', 'standalone release verifier requires hosting readiness watcher tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\browser-smoke-vanphuc-hosting.ps1', 'standalone release verifier requires browser smoke tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\complete-vanphuc-hosting-handoff.ps1', 'standalone release verifier requires post-upload handoff autopilot tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\acceptance-report-vanphuc-hosting.ps1', 'standalone release verifier requires acceptance report tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\preupload-report-sodovanphuc.ps1', 'standalone release verifier requires pre-upload report tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\final-prehosting-audit.ps1', 'standalone release verifier requires final pre-hosting audit tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools\\run-prehosting-proof.ps1', 'standalone release verifier requires one-command proof runner tool');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Assert-NoControlCharacters', 'standalone release verifier rejects control characters in generated docs');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools/final-prehosting-audit.ps1', 'standalone release verifier validates checklist final pre-hosting audit step');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'npm run prehost:proof', 'standalone release verifier validates checklist one-command proof step');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools/verify-release-package.ps1', 'standalone release verifier validates checklist self-reference');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'tools/domain-cutover-report-vanphuc.ps1', 'standalone release verifier validates checklist domain cutover step');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'DOMAIN_CUTOVER_REPORT.md', 'standalone release verifier validates domain cutover report output mention');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Upload pointer does not name the hosting readiness watcher', 'standalone release verifier validates upload pointer readiness watcher');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Upload pointer does not name the domain cutover report tool', 'standalone release verifier validates upload pointer domain cutover report');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'Upload pointer does not name the post-upload handoff autopilot', 'standalone release verifier validates upload pointer handoff autopilot');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'post-upload checklist exists', 'release verifier requires post-upload checklist');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'upload pointer exists', 'release verifier requires upload pointer');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'frontend index has production canonical URL', 'release verifier checks production canonical URL');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'frontend index has absolute production OG image', 'release verifier checks production OG image');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/verify-release-package.ps1', 'release verifier requires checklist release package step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/preupload-report-sodovanphuc.ps1', 'release verifier requires checklist pre-upload report step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/final-prehosting-audit.ps1', 'release verifier requires checklist final pre-hosting audit step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'npm run prehost:proof', 'release verifier requires checklist one-command proof step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/test-release-upload-drill.ps1', 'release verifier requires checklist exact upload zip drill step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/test-configured-upload-zip-dryrun.ps1', 'release verifier requires checklist configured upload zip dry-run step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/test-php-runtime.ps1', 'release verifier requires checklist PHP runtime smoke step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/prepare-real-upload.ps1', 'release verifier requires checklist real upload preparation step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/cleanup-real-upload-artifacts.ps1', 'release verifier requires checklist real upload artifact cleanup step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/domain-cutover-report-vanphuc.ps1', 'release verifier requires checklist domain cutover report step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/wait-vanphuc-hosting-ready.ps1', 'release verifier requires checklist hosting readiness watcher step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'HOSTING_WAIT_REPORT.md', 'release verifier requires checklist hosting wait report');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/complete-vanphuc-hosting-handoff.ps1', 'release verifier requires checklist handoff autopilot step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'HOSTING_HANDOFF_COMPLETE.md', 'release verifier requires checklist handoff autopilot report');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/build-configured-public-html.ps1', 'release verifier requires checklist configured zip builder step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'upload pointer names hosting readiness watcher', 'release verifier requires upload pointer hosting readiness watcher');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'upload pointer names domain cutover report tool', 'release verifier requires upload pointer domain cutover report');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'upload pointer names post-upload handoff autopilot', 'release verifier requires upload pointer handoff autopilot');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'REAL_UPLOAD_READY.md', 'release verifier requires real upload manifest references');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/diagnose-vanphuc-hosting.ps1', 'release verifier requires checklist diagnostic step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'browser smoke', 'release verifier requires checklist browser smoke step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/ready-vanphuc-hosting.ps1', 'release verifier requires checklist final ready gate');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'tools/acceptance-report-vanphuc-hosting.ps1', 'release verifier requires checklist acceptance report step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), '-IncludeWriteWorkflow', 'release verifier requires checklist write workflow smoke step');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), '$env:SVP_DB_PASS', 'release verifier requires generated docs to preserve DB password env command');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), '$env:SVP_ADMIN_PASSWORD', 'release verifier requires generated docs to preserve prepare admin password env command');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), '$env:SVP_LIVE_ADMIN_PASSWORD', 'release verifier requires generated docs to preserve live admin password env command');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'ACCEPTANCE_REPORT.md says Final status: PASS', 'release verifier requires final acceptance handoff warning');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'Assert-FileHasNoControlCharacters', 'release verifier rejects control characters in generated docs');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'UPLOAD_THIS_PACKAGE.txt', 'standalone release verifier requires upload pointer');
assertIncludes(read('deploy', 'verify-release-package.ps1'), 'upload pointer is usable', 'standalone release verifier validates upload pointer');
assertIncludes(read('deploy', 'verify-release-package.ps1'), '$env:SVP_DB_PASS', 'standalone release verifier requires generated docs to preserve DB password env command');
assertIncludes(read('deploy', 'verify-release-package.ps1'), '$env:SVP_ADMIN_PASSWORD', 'standalone release verifier requires generated docs to preserve prepare admin password env command');
assertIncludes(read('deploy', 'verify-release-package.ps1'), '$env:SVP_LIVE_ADMIN_PASSWORD', 'standalone release verifier requires generated docs to preserve live admin password env command');
assertIncludes(read('deploy', 'verify-sodovanphuc-release.ps1'), 'post-upload checklist markdown fences are valid', 'release verifier validates post-upload checklist markdown fences');
assertIncludes(releaseUploadDrill, 'upload drill frontend index contains production canonical domain', 'upload drill checks production canonical domain in served HTML');
assertIncludes(releaseUploadDrill, 'upload drill frontend index contains production OG image URL', 'upload drill checks production OG image URL in served HTML');

assertIncludes(hostingSmoke, '$IncludeWriteWorkflow', 'hosting smoke supports write workflow flag');
assertIncludes(hostingSmoke, 'healthcheck required PHP extensions are loaded', 'hosting smoke verifies required PHP extensions');
assertIncludes(hostingSmoke, 'healthcheck upload storage and PHP temp directory are writable', 'hosting smoke verifies upload/temp writability');
assertIncludes(hostingSmoke, 'Invoke-AdminAuthSmoke', 'hosting smoke implements optional admin auth smoke');
assertIncludes(hostingSmoke, 'SVP_LIVE_ADMIN_PASSWORD', 'hosting smoke gates admin auth smoke behind an env secret');
assertIncludes(hostingSmoke, '/api/auth/login', 'hosting smoke verifies admin login endpoint when credentials are provided');
assertIncludes(hostingSmoke, '/api/auth/me', 'hosting smoke verifies issued admin JWT against /api/auth/me');
assertIncludes(hostingSmoke, 'Invoke-LiveUploadWorkflowSmoke', 'hosting smoke implements live multipart upload workflow');
assertIncludes(hostingSmoke, 'live upload smoke multipart image upload returns JSON', 'hosting smoke uploads a real PNG through live /api/uploads');
assertIncludes(hostingSmoke, 'live upload smoke deleted uploaded PNG through admin endpoint', 'hosting smoke deletes live uploaded PNG');
assertIncludes(hostingSmoke, 'live upload smoke verified uploaded PNG cleanup', 'hosting smoke verifies live uploaded PNG cleanup');
assertIncludes(hostingSmoke, 'Invoke-LiveUploadWorkflowSmoke -Token $liveAdminToken', 'write workflow smoke runs live upload workflow first');
assertIncludes(hostingSmoke, 'Invoke-BaseAdminDeleteSmoke -Token $liveAdminToken', 'write workflow smoke runs base admin delete smoke');
assertIncludes(hostingSmoke, 'base admin smoke created inquiry', 'hosting smoke creates a base inquiry before delete');
assertIncludes(hostingSmoke, 'base admin smoke deleted inquiry', 'hosting smoke deletes a base inquiry');
assertIncludes(hostingSmoke, 'base admin smoke deleted report', 'hosting smoke deletes a base report');
assertIncludes(hostingSmoke, 'base admin smoke deleted schedule', 'hosting smoke deletes a base schedule');
assertIncludes(hostingSmoke, 'base admin smoke verified inquiry deletion', 'hosting smoke verifies base inquiry deletion');
assertIncludes(hostingSmoke, 'base admin smoke verified report deletion', 'hosting smoke verifies base report deletion');
assertIncludes(hostingSmoke, 'base admin smoke verified schedule deletion', 'hosting smoke verifies base schedule deletion');
assertIncludes(hostingSmoke, 'Invoke-WriteWorkflowSmoke', 'hosting smoke implements write workflow smoke');
assertIncludes(hostingSmoke, 'Invoke-CleanupDelete', 'hosting smoke can clean write workflow records');
assertIncludes(hostingSmoke, '$cleanupFailures = @()', 'hosting smoke tracks cleanup failures');
assertIncludes(hostingSmoke, 'Write workflow smoke passed but cleanup failed', 'hosting smoke fails when cleanup fails after successful workflow');
assertIncludes(hostingSmoke, 'returned deleted=false', 'hosting smoke treats deleted=false cleanup as failure');
assertIncludes(hostingSmoke, "POST' -Path '/api/svp/properties'", 'write workflow creates property');
assertIncludes(hostingSmoke, "PUT' -Path \"/api/svp/properties/$propertyId\"", 'write workflow updates property');
assertIncludes(hostingSmoke, "POST' -Path \"/api/svp/properties/$propertyId/media\"", 'write workflow creates property media');
assertIncludes(hostingSmoke, '/api/svp/properties/$propertyId/media-upload', 'write workflow can upload SVP property media through multipart route');
assertIncludes(hostingSmoke, 'write smoke cleaned uploaded SVP property PNG', 'write workflow cleans uploaded SVP property PNG when admin token is available');
assertIncludes(hostingSmoke, "GET' -Path \"/api/svp/properties/$propertyId/timeline\"", 'write workflow verifies timeline');
assertIncludes(hostingSmoke, "GET' -Path \"/api/svp/properties/$propertyId/versions\"", 'write workflow verifies versions');
assertIncludes(hostingSmoke, "POST' -Path '/api/svp/customers'", 'write workflow creates customer');
assertIncludes(hostingSmoke, "POST' -Path '/api/svp/customer-needs'", 'write workflow creates customer need');
assertIncludes(hostingSmoke, "POST' -Path '/api/svp/viewing-schedules'", 'write workflow creates viewing schedule');
assertIncludes(hostingSmoke, "POST' -Path '/api/svp/referrals'", 'write workflow creates referral');
assertIncludes(hostingSmoke, "GET' -Path \"/api/svp/audit-logs?entityId=", 'write workflow verifies audit logs');
assertIncludes(hostingSmoke, 'EscapeDataString($entityId)', 'write workflow filters audit log by entity id');
assertIncludes(routes, "'entityId' => 'entity_id'", 'audit log API supports entityId filter');
assertIncludes(routes, "'entityType' => 'entity_type'", 'audit log API supports entityType filter');
assertIncludes(routes, "'action' => 'action'", 'audit log API supports action filter');
assertIncludes(routes, "LIMIT :limit", 'audit log API supports bounded limit');
assertIncludes(hostingSmoke, "DELETE' -Path \"/api/svp/properties/$propertyId\"", 'write workflow soft-deletes temporary property');
assertIncludes(hostingSmoke, '/api/svp/referrals/$([uri]::EscapeDataString($referralId))', 'write workflow cleans referral');
assertIncludes(hostingSmoke, '/api/svp/viewing-schedules/$([uri]::EscapeDataString($scheduleId))', 'write workflow cleans viewing schedule');
assertIncludes(hostingSmoke, '/api/svp/customer-needs/$([uri]::EscapeDataString($needId))', 'write workflow cleans customer need');
assertIncludes(hostingSmoke, '/api/svp/customers/$([uri]::EscapeDataString($customerId))', 'write workflow cleans customer');
assertIncludes(hostingSmoke, 'finally {', 'write workflow cleanup runs in finally');
assertIncludes(routes, 'function svp_delete_row_by_id', 'SVP API has audited cleanup delete helper');
assert(countMatches(eventRoutes, /u\.full_name LIKE :q_name OR u\.email LIKE :q_email OR u\.phone LIKE :q_phone/g) === 2, 'event registration list and Excel export use unique PDO search placeholders');
assert(countMatches(eventRoutes, /u\.full_name LIKE :q OR u\.email LIKE :q OR u\.phone LIKE :q/g) === 0, 'event registration search does not reuse named PDO placeholders');
assertIncludes(eventRoutes, "'draft', 'open', :created_by, :updated_by", 'event creation uses unique PDO placeholders for audit actors');
assert(!eventRoutes.includes("'draft', 'open', :actor, :actor"), 'event creation does not reuse the actor PDO placeholder');
assertIncludes(adminEventsPage, 'setRegistrations([]); setMessage(e.message)', 'event registration UI clears stale rows when filtering fails');
assertIncludes(eventApi, 'window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)', 'event Excel export keeps its object URL alive until browser download starts');
assertIncludes(hostingSmoke, 'AUTO-SMOKE', 'write workflow marks generated records');

console.log('');
console.log(`SVP contract verification passed (${checks.length} checks).`);
