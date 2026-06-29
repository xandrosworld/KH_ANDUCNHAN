<?php
/**
 * So Do Van Phuc API - Main Entry Point
 *
 * All /api/* requests are routed here via .htaccess.
 * This file registers all route handlers and dispatches the request.
 */

// ─── Error Handling ──────────────────────────────────────────────────────────
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

function gfz_load_env_file(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        if ($key === '') {
            continue;
        }

        $value = trim($value);
        if (
            strlen($value) >= 2 &&
            (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

gfz_load_env_file(__DIR__ . '/../../.env');
gfz_load_env_file(__DIR__ . '/../.env');

// ─── Load Config ─────────────────────────────────────────────────────────────
$configPath = __DIR__ . '/../config/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok'    => false,
        'error' => 'Server configuration missing. Copy config.example.php to config.php',
    ]);
    exit;
}
require_once $configPath;

function gfz_config_string(string $constantName, ?string $envName = null): string
{
    if (defined($constantName)) {
        $constantValue = constant($constantName);
        if (is_string($constantValue) && trim($constantValue) !== '') {
            return trim($constantValue);
        }
    }

    $envValue = getenv($envName ?: $constantName);
    return is_string($envValue) ? trim($envValue) : '';
}

// ─── Load Libraries ──────────────────────────────────────────────────────────
require_once __DIR__ . '/../lib/Response.php';
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Router.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/JwtAuth.php';
require_once __DIR__ . '/../lib/Upload.php';
require_once __DIR__ . '/../lib/Mailer.php';

// ─── CORS ────────────────────────────────────────────────────────────────────
Response::cors();

if (defined('ENABLE_LEGACY_AUTO_EXPIRE') && ENABLE_LEGACY_AUTO_EXPIRE) {

// ─── Auto-Expire Check (runs once per day, piggybacks on traffic) ────────────
(function () {
    $lockFile = sys_get_temp_dir() . '/gf_expire_check.lock';
    $lastRun = @file_get_contents($lockFile);
    $today = date('Y-m-d');
    if ($lastRun === $today) return; // Already ran today

    // Write lock immediately to prevent concurrent runs
    @file_put_contents($lockFile, $today);

    try {
        $db = Database::getInstance();

        // 1. Auto-expire overdue listings
        $db->prepare("UPDATE properties SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()")->execute();

        // 2. Notify owners of listings expiring within 3 days
        $soon = $db->prepare("
            SELECT p.id, p.address, p.city, p.state, p.expires_at, p.contact_email
            FROM properties p
            WHERE p.status = 'active'
              AND p.expires_at IS NOT NULL
              AND p.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
              AND (p.expiry_notified IS NULL OR p.expiry_notified = 0)
        ");
        $soon->execute();

        foreach ($soon->fetchAll(PDO::FETCH_ASSOC) as $listing) {
            $email = $listing['contact_email'] ?? '';
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;
            $address = trim(($listing['address'] ?? '') . ', ' . ($listing['city'] ?? '') . ', ' . ($listing['state'] ?? ''));
            Mailer::notifyListingExpiring($email, $address, $listing['expires_at']);
            $db->prepare("UPDATE properties SET expiry_notified = 1 WHERE id = :id")->execute(['id' => $listing['id']]);
        }
    } catch (Exception $e) {
        error_log('[AUTO-EXPIRE] ' . $e->getMessage());
    }
})();
}

// ─── Parse JSON Body ─────────────────────────────────────────────────────────
$input = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (
    in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'], true) &&
    stripos($contentType, 'application/json') !== false
) {
    $rawBody = file_get_contents('php://input');
    if ($rawBody) {
        $decoded = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $input = $decoded;
        }
    }
}

// ─── Router Setup ────────────────────────────────────────────────────────────
// Shared input/media helpers.
function gfz_input_value(array $input, string $snakeKey, ?string $camelKey = null): ?string
{
    if (array_key_exists($snakeKey, $input)) {
        $value = $input[$snakeKey];
    } elseif ($camelKey !== null && array_key_exists($camelKey, $input)) {
        $value = $input[$camelKey];
    } else {
        return null;
    }

    if ($value === null) {
        return null;
    }

    $value = trim((string) $value);
    return $value === '' ? null : $value;
}

function gfz_optional_http_url(array $input, string $snakeKey, ?string $camelKey = null): ?string
{
    $value = gfz_input_value($input, $snakeKey, $camelKey);
    if ($value === null) {
        return null;
    }

    if (
        !filter_var($value, FILTER_VALIDATE_URL) ||
        !preg_match('/^https?:\/\//i', $value)
    ) {
        Response::error("Invalid URL for {$snakeKey}. Use http:// or https://", 400);
    }

    return $value;
}

function gfz_social_url_params(array $input): array
{
    return [
        'facebook_url'  => gfz_optional_http_url($input, 'facebook_url', 'facebookUrl'),
        'instagram_url' => gfz_optional_http_url($input, 'instagram_url', 'instagramUrl'),
        'tiktok_url'    => gfz_optional_http_url($input, 'tiktok_url', 'tiktokUrl'),
        'x_url'         => gfz_optional_http_url($input, 'x_url', 'xUrl'),
        'whatsapp_url'  => gfz_optional_http_url($input, 'whatsapp_url', 'whatsappUrl'),
    ];
}

function gfz_count_uploaded_files(array $files): int
{
    if (!isset($files['name'])) {
        return 0;
    }

    if (is_array($files['name'])) {
        $count = 0;
        foreach ($files['name'] as $i => $_name) {
            if (($files['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $count++;
            }
        }
        return $count;
    }

    return (($files['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) ? 0 : 1;
}

function gfz_create_media_upload_token(string $propertyId): ?string
{
    try {
        return JwtAuth::createToken([
            'sub'         => 'public-media-upload',
            'role'        => 'media_upload',
            'property_id' => $propertyId,
        ], 3600);
    } catch (Throwable $e) {
        error_log('Media upload token error: ' . $e->getMessage());
        return null;
    }
}

function gfz_require_media_upload_token(string $propertyId, array $input): void
{
    $token = gfz_input_value($input, 'upload_token', 'uploadToken');
    if (!$token) {
        Response::unauthorized('Missing media upload token');
    }

    $payload = JwtAuth::verifyToken($token);
    if (
        !$payload ||
        ($payload['role'] ?? '') !== 'media_upload' ||
        ($payload['property_id'] ?? '') !== $propertyId
    ) {
        Response::unauthorized('Invalid or expired media upload token');
    }
}

function gfz_verify_admin_password(string $password, string $storedHash): bool
{
    if (preg_match('/^\$2[aby]\$\d{2}\$/', $storedHash)) {
        return password_verify($password, $storedHash);
    }

    if (strpos($storedHash, 'pbkdf2_sha256$') === 0) {
        $parts = explode('$', $storedHash);
        if (count($parts) !== 4) {
            return false;
        }

        [, $iterations, $saltHex, $expectedHex] = $parts;
        $iterations = (int) $iterations;
        if (
            $iterations < 210000 ||
            !ctype_xdigit($saltHex) ||
            !ctype_xdigit($expectedHex) ||
            strlen($expectedHex) !== 64
        ) {
            return false;
        }

        $salt = hex2bin($saltHex);
        if ($salt === false) {
            return false;
        }

        $actualHex = hash_pbkdf2('sha256', $password, $salt, $iterations, 64, false);
        return hash_equals(strtolower($expectedHex), strtolower($actualHex));
    }

    return false;
}

function gfz_attach_property_media(PDO $db, string $propertyId, array $imageUrls, ?string $videoUrl): void
{
    if (!empty($imageUrls)) {
        $countStmt = $db->prepare('SELECT COUNT(*) FROM property_images WHERE property_id = :id');
        $countStmt->execute(['id' => $propertyId]);
        $existingCount = (int) $countStmt->fetchColumn();
        $maxImages = defined('UPLOAD_MAX_IMAGES') ? UPLOAD_MAX_IMAGES : 41;

        if ($existingCount + count($imageUrls) > $maxImages) {
            Response::error("Maximum {$maxImages} images allowed per listing", 400);
        }

        $imgStmt = $db->prepare(
            'INSERT INTO property_images (property_id, image_url, sort_order) VALUES (:pid, :url, :sort)'
        );
        foreach ($imageUrls as $i => $url) {
            $imgStmt->execute([
                'pid'  => $propertyId,
                'url'  => $url,
                'sort' => $existingCount + $i,
            ]);
        }

        if ($existingCount === 0) {
            $db->prepare('UPDATE properties SET main_image = :main_image WHERE id = :id AND (main_image IS NULL OR main_image = "")')
               ->execute(['main_image' => $imageUrls[0], 'id' => $propertyId]);
        }
    }

    if ($videoUrl !== null) {
        $db->prepare('UPDATE properties SET video_url = :video_url WHERE id = :id')
           ->execute(['video_url' => $videoUrl, 'id' => $propertyId]);
    }
}

function gfz_ensure_property_owner_column(PDO $db): void
{
    try {
        $db->exec("ALTER TABLE properties ADD COLUMN owner_id VARCHAR(64) DEFAULT NULL AFTER contact_email");
    } catch (Throwable $e) {
        // Column already exists or the host does not allow ALTER in this request.
    }

    try {
        $db->exec("ALTER TABLE properties ADD INDEX idx_owner_id (owner_id)");
    } catch (Throwable $e) {
        // Index already exists.
    }
}

function gfz_auth_identity(PDO $db, array $payload): array
{
    $id = trim((string) ($payload['sub'] ?? ''));
    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $role = trim((string) ($payload['role'] ?? ''));

    if ($id !== '') {
        try {
            $stmt = $db->prepare('SELECT id, email, role FROM users WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $email = strtolower(trim((string) ($user['email'] ?? $email)));
                $role = trim((string) ($user['role'] ?? $role));
            }
        } catch (Throwable $e) {
            // Keep JWT payload values if the users table is not available.
        }
    }

    return ['id' => $id, 'email' => $email, 'role' => $role];
}

function gfz_owner_can_edit_property(array $property, array $identity): bool
{
    if (($identity['role'] ?? '') === 'admin') {
        return true;
    }

    $ownerId = trim((string) ($property['owner_id'] ?? ''));
    $userId = trim((string) ($identity['id'] ?? ''));
    if ($ownerId !== '' && $userId !== '' && hash_equals($ownerId, $userId)) {
        return true;
    }

    $listingEmail = strtolower(trim((string) ($property['contact_email'] ?? '')));
    $userEmail = strtolower(trim((string) ($identity['email'] ?? '')));
    return $listingEmail !== '' && $userEmail !== '' && hash_equals($listingEmail, $userEmail);
}

function gfz_return_property(PDO $db, string $id): void
{
    $stmt = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$prop) {
        Response::notFound('Property not found');
    }

    $imgStmt = $db->prepare(
        'SELECT image_url FROM property_images WHERE property_id = :id ORDER BY sort_order ASC'
    );
    $imgStmt->execute(['id' => $id]);
    $prop['images'] = array_column($imgStmt->fetchAll(PDO::FETCH_ASSOC), 'image_url');
    $prop['is_vip'] = (bool) ($prop['is_vip'] ?? false);
    $prop['price'] = (float) ($prop['price'] ?? 0);
    $prop['bedrooms'] = (int) ($prop['bedrooms'] ?? 0);
    $prop['bathrooms'] = (int) ($prop['bathrooms'] ?? 0);
    $prop['sqft'] = (int) ($prop['sqft'] ?? 0);

    Response::json($prop);
}

$router = new Router();

// ═════════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═════════════════════════════════════════════════════════════════════════════

function svp_health_payload(): array
{
    $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'fileinfo', 'openssl'];
    $extensionStatus = [];
    $missingExtensions = [];
    foreach ($requiredExtensions as $extension) {
        $loaded = extension_loaded($extension);
        $extensionStatus[$extension] = $loaded;
        if (!$loaded) {
            $missingExtensions[] = $extension;
        }
    }

    $fileUploadsIni = ini_get('file_uploads');
    $fileUploadsEnabled = filter_var($fileUploadsIni, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($fileUploadsEnabled === null) {
        $fileUploadsEnabled = in_array(strtolower((string) $fileUploadsIni), ['1', 'on', 'yes', 'true'], true);
    }

    $uploadBase = dirname(__DIR__) . '/uploads';
    $uploadsProbe = false;
    if (is_dir($uploadBase) && is_writable($uploadBase)) {
        $probePath = @tempnam($uploadBase, 'svp_health_');
        if ($probePath) {
            $uploadsProbe = @file_put_contents($probePath, 'ok') !== false;
            @unlink($probePath);
        }
    }

    $tempDir = sys_get_temp_dir();
    $tempProbe = false;
    if ($tempDir && is_dir($tempDir) && is_writable($tempDir)) {
        $probePath = @tempnam($tempDir, 'svp_health_');
        if ($probePath) {
            $tempProbe = @file_put_contents($probePath, 'ok') !== false;
            @unlink($probePath);
        }
    }

    $runtimeReady = empty($missingExtensions)
        && $fileUploadsEnabled
        && $uploadsProbe
        && $tempProbe
        && is_file($uploadBase . '/.htaccess');

    $payload = [
        'service'   => 'so-do-van-phuc-api',
        'status'    => 'running',
        'timestamp' => date('c'),
        'php'       => PHP_VERSION,
        'version'   => defined('APP_VERSION') ? APP_VERSION : 'local',
        'runtime'   => [
            'requiredExtensions' => $extensionStatus,
            'missingRequiredExtensions' => $missingExtensions,
            'fileUploadsEnabled' => $fileUploadsEnabled,
            'uploadMaxFilesize' => ini_get('upload_max_filesize'),
            'postMaxSize' => ini_get('post_max_size'),
            'maxFileUploads' => ini_get('max_file_uploads'),
        ],
        'storage'   => [
            'uploadsDirExists' => is_dir($uploadBase),
            'uploadsWritable' => $uploadsProbe,
            'uploadsHtaccessPresent' => is_file($uploadBase . '/.htaccess'),
            'tempWritable' => $tempProbe,
        ],
        'database'  => [
            'connected' => false,
            'schemaReady' => false,
            'seedReady' => false,
            'missingTables' => [],
            'missingSeedGroups' => [],
            'configOptionCount' => 0,
        ],
    ];

    $requiredTables = [
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
        'svp_training_contents',
        'svp_reputation_scores',
        'svp_notifications',
    ];

    $requiredSeedGroups = [
        'company_units',
        'property_tags',
        'property_statuses',
        'visibility_levels',
        'signing_criteria',
        'price_segments',
        'customer_statuses',
    ];

    try {
        $db = Database::getInstance();
        $db->query('SELECT 1');
        $payload['database']['connected'] = true;

        $missing = [];
        foreach ($requiredTables as $table) {
            $stmt = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :table_name');
            $stmt->execute(['table_name' => $table]);
            if ((int) $stmt->fetchColumn() === 0) {
                $missing[] = $table;
            }
        }

        $payload['database']['missingTables'] = $missing;
        $payload['database']['schemaReady'] = count($missing) === 0;

        if (!in_array('svp_config_groups', $missing, true) && !in_array('svp_config_options', $missing, true)) {
            $missingSeedGroups = [];
            foreach ($requiredSeedGroups as $groupId) {
                $stmt = $db->prepare('SELECT COUNT(*) FROM svp_config_groups WHERE id = :id');
                $stmt->execute(['id' => $groupId]);
                if ((int) $stmt->fetchColumn() === 0) {
                    $missingSeedGroups[] = $groupId;
                }
            }

            $optionCount = (int) $db->query('SELECT COUNT(*) FROM svp_config_options')->fetchColumn();
            $payload['database']['missingSeedGroups'] = $missingSeedGroups;
            $payload['database']['configOptionCount'] = $optionCount;
            $payload['database']['seedReady'] = count($missingSeedGroups) === 0 && $optionCount >= 50;
        }

        if (!$runtimeReady) {
            $payload['status'] = 'degraded';
        } elseif (count($missing) > 0) {
            $payload['status'] = 'database_connected';
        } elseif (!$payload['database']['seedReady']) {
            $payload['status'] = 'seed_incomplete';
        } else {
            $payload['status'] = 'ready';
        }
    } catch (Exception $e) {
        $payload['status'] = 'degraded';
        $payload['database']['error'] = 'Database connection failed';
        error_log('[SVP_HEALTH] ' . $e->getMessage());
    }

    return $payload;
}

$router->add('GET', '/api/health', function () {
    Response::json(svp_health_payload());
});

$router->add('GET', '/api/svp/health', function () {
    Response::json(svp_health_payload());
});

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH — LOGIN
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/auth/login', function () use ($input) {
    if (empty($input['username']) || empty($input['password'])) {
        Response::error('Username and password are required', 400);
    }

    $username = $input['username'];
    $password = $input['password'];

    // Validate credentials
    if (!defined('ADMIN_USERNAME') || !defined('ADMIN_PASSWORD_HASH')) {
        Response::error('Admin authentication is not configured', 500);
    }

    if ($username !== ADMIN_USERNAME) {
        Response::error('Invalid credentials', 401);
    }

    if (!gfz_verify_admin_password($password, ADMIN_PASSWORD_HASH)) {
        Response::error('Invalid credentials', 401);
    }

    // Issue JWT token
    $ttl = defined('JWT_TTL') ? JWT_TTL : 28800;
    $token = JwtAuth::createToken([
        'sub'  => $username,
        'role' => 'admin',
    ], $ttl);

    Response::json([
        'token'     => $token,
        'expiresIn' => $ttl,
        'tokenType' => 'Bearer',
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — LIST
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/properties', function () {
    $db = Database::getInstance();

    // Lightweight auto-expire: mark overdue listings on each query
    try {
        $db->exec("UPDATE properties SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()");
    } catch (Throwable $e) { /* ignore */ }

    // ── Filters ──────────────────────────────────────────────────────────
    $where  = [];
    $params = [];

    if (!empty($_GET['listingType'])) {
        $where[]  = 'p.listing_type = :listingType';
        $params['listingType'] = $_GET['listingType'];
    }

    if (!empty($_GET['propertyType'])) {
        $where[]  = 'p.property_type = :propertyType';
        $params['propertyType'] = $_GET['propertyType'];
    }

    if (Auth::isAdmin() && !empty($_GET['status'])) {
        // Admin can filter by any status
        $where[]  = 'p.status = :status';
        $params['status'] = $_GET['status'];
    } elseif (!Auth::isAdmin()) {
        // Public: ALWAYS only active properties, ignore ?status param
        $where[] = "p.status = 'active'";
        // Also hide expired listings for public
        $where[] = "(p.expires_at IS NULL OR p.expires_at > NOW())";
    }

    if (isset($_GET['isVip']) && $_GET['isVip'] !== '') {
        $where[]  = 'p.is_vip = :isVip';
        $params['isVip'] = (int) $_GET['isVip'];
    }

    if (!empty($_GET['minPrice'])) {
        $where[]  = 'p.price >= :minPrice';
        $params['minPrice'] = (float) $_GET['minPrice'];
    }

    if (!empty($_GET['maxPrice'])) {
        $where[]  = 'p.price <= :maxPrice';
        $params['maxPrice'] = (float) $_GET['maxPrice'];
    }

    if (!empty($_GET['beds'])) {
        $where[]  = 'p.bedrooms >= :beds';
        $params['beds'] = (int) $_GET['beds'];
    }

    if (!empty($_GET['minSqft'])) {
        $where[]  = 'p.sqft >= :minSqft';
        $params['minSqft'] = (int) $_GET['minSqft'];
    }

    if (!empty($_GET['maxSqft'])) {
        $where[]  = 'p.sqft <= :maxSqft';
        $params['maxSqft'] = (int) $_GET['maxSqft'];
    }

    if (!empty($_GET['q'])) {
        $where[] = '(p.title LIKE :q OR p.address LIKE :q2 OR p.city LIKE :q3 OR p.state LIKE :q4)';
        $searchTerm = '%' . $_GET['q'] . '%';
        $params['q']  = $searchTerm;
        $params['q2'] = $searchTerm;
        $params['q3'] = $searchTerm;
        $params['q4'] = $searchTerm;
    }

    if (!empty($_GET['city'])) {
        $where[] = '(p.city LIKE :city OR p.state LIKE :city2)';
        $params['city']  = '%' . $_GET['city'] . '%';
        $params['city2'] = '%' . $_GET['city'] . '%';
    }

    $whereClause = '';
    if (!empty($where)) {
        $whereClause = 'WHERE ' . implode(' AND ', $where);
    }

    // ── Pagination ───────────────────────────────────────────────────────
    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(200, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    // ── Count total ──────────────────────────────────────────────────────
    $countSql = "SELECT COUNT(*) AS total FROM properties p {$whereClause}";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // ── Fetch properties ─────────────────────────────────────────────────
    $sql = "SELECT p.* FROM properties p {$whereClause}
            ORDER BY p.is_vip DESC, p.created_at DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue(":{$key}", $val, $type);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $properties = $stmt->fetchAll();

    // ── Attach images ────────────────────────────────────────────────────
    if (!empty($properties)) {
        $ids = array_column($properties, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $imgStmt = $db->prepare(
            "SELECT property_id, image_url, sort_order
             FROM property_images
             WHERE property_id IN ({$placeholders})
             ORDER BY sort_order ASC"
        );
        $imgStmt->execute($ids);
        $allImages = $imgStmt->fetchAll();

        // Group images by property_id
        $imageMap = [];
        foreach ($allImages as $img) {
            $imageMap[$img['property_id']][] = $img['image_url'];
        }

        // Attach to each property
        foreach ($properties as &$prop) {
            $prop['images']  = $imageMap[$prop['id']] ?? [];
            $prop['is_vip']  = (bool) $prop['is_vip'];
            $prop['price']   = (float) $prop['price'];
            $prop['bedrooms']  = (int) $prop['bedrooms'];
            $prop['bathrooms'] = (int) $prop['bathrooms'];
            $prop['sqft']      = (int) $prop['sqft'];
        }
        unset($prop);
    }

    Response::json([
        'properties' => $properties,
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — DETAIL
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/user/properties', function () {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();
    gfz_ensure_property_owner_column($db);
    $identity = gfz_auth_identity($db, $payload);

    $where = [];
    $params = [];

    if (!empty($identity['id'])) {
        $where[] = 'p.owner_id = :owner_id';
        $params['owner_id'] = $identity['id'];
    }

    if (!empty($identity['email'])) {
        $where[] = 'LOWER(p.contact_email) = LOWER(:email)';
        $params['email'] = $identity['email'];
    }

    if (empty($where)) {
        Response::json(['properties' => [], 'pagination' => ['page' => 1, 'limit' => 0, 'total' => 0, 'totalPages' => 0]]);
    }

    $whereClause = 'WHERE (' . implode(' OR ', $where) . ')';
    $stmt = $db->prepare("SELECT p.* FROM properties p {$whereClause} ORDER BY p.created_at DESC LIMIT 200");
    foreach ($params as $key => $val) {
        $stmt->bindValue(":{$key}", $val);
    }
    $stmt->execute();
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($properties)) {
        $ids = array_column($properties, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $imgStmt = $db->prepare(
            "SELECT property_id, image_url, sort_order
             FROM property_images
             WHERE property_id IN ({$placeholders})
             ORDER BY sort_order ASC"
        );
        $imgStmt->execute($ids);
        $allImages = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

        $imageMap = [];
        foreach ($allImages as $img) {
            $imageMap[$img['property_id']][] = $img['image_url'];
        }

        foreach ($properties as &$prop) {
            $prop['images'] = $imageMap[$prop['id']] ?? [];
            $prop['is_vip'] = (bool) ($prop['is_vip'] ?? false);
            $prop['price'] = (float) ($prop['price'] ?? 0);
            $prop['bedrooms'] = (int) ($prop['bedrooms'] ?? 0);
            $prop['bathrooms'] = (int) ($prop['bathrooms'] ?? 0);
            $prop['sqft'] = (int) ($prop['sqft'] ?? 0);
        }
        unset($prop);
    }

    Response::json([
        'properties' => $properties,
        'pagination' => [
            'page'       => 1,
            'limit'      => 200,
            'total'      => count($properties),
            'totalPages' => 1,
        ],
    ]);
});

$router->add('GET', '/api/properties/{id}', function ($params) {
    $db   = Database::getInstance();
    $id   = $params['id'];

    $stmt = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        Response::notFound('Property not found');
    }

    // Public users can only see active, non-expired properties
    if (!Auth::isAdmin()) {
        $isActive = ($prop['status'] === 'active');
        $isExpired = !empty($prop['expires_at']) && strtotime($prop['expires_at']) < time();
        if (!$isActive || $isExpired) {
            Response::notFound('Property not found');
        }
    }

    // Fetch images
    $imgStmt = $db->prepare(
        'SELECT image_url, sort_order FROM property_images WHERE property_id = :id ORDER BY sort_order ASC'
    );
    $imgStmt->execute(['id' => $id]);
    $prop['images'] = array_column($imgStmt->fetchAll(), 'image_url');

    // Cast types
    $prop['is_vip']    = (bool) $prop['is_vip'];
    $prop['price']     = (float) $prop['price'];
    $prop['bedrooms']  = (int) $prop['bedrooms'];
    $prop['bathrooms'] = (int) $prop['bathrooms'];
    $prop['sqft']      = (int) $prop['sqft'];

    Response::json($prop);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — PUBLIC SUBMIT (no auth, status=pending, multipart form)
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/public/submit', function () {
    // Rate limit: 1 submission per 30 seconds per IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitFile = sys_get_temp_dir() . '/gfz_submit_' . md5($ip);
    if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 30) {
        Response::error('Too many submissions. Please wait before trying again.', 429);
    }
    touch($rateLimitFile);

    $db = Database::getInstance();
    gfz_ensure_property_owner_column($db);
    $identity = [];
    $payload = Auth::getPayload();
    if ($payload) {
        $identity = gfz_auth_identity($db, $payload);
    }

    // Parse form fields (may come as multipart or JSON)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') !== false) {
        $input = $_POST;
    } else {
        $raw = file_get_contents('php://input');
        $input = $raw ? (json_decode($raw, true) ?: []) : [];
    }

    // Validate required fields
    if (empty($input['title'])) Response::error('Title is required');
    if (empty($input['address'])) Response::error('Address is required');
    if (empty($input['city'])) Response::error('City is required');
    if (empty($input['state'])) Response::error('State is required');
    if (!isset($input['price']) || !is_numeric($input['price']) || $input['price'] <= 0) {
        Response::error('A valid price is required');
    }
    $listingType = $input['listing_type'] ?? $input['listingType'] ?? 'sale';
    if (!in_array($listingType, ['sale', 'rent'], true)) {
        Response::error('listing_type must be "sale" or "rent"');
    }

    // Validate contact info (required for public submissions)
    $contactName  = trim($input['contact_name'] ?? $input['contactName'] ?? '');
    $contactPhone = trim($input['contact_phone'] ?? $input['contactPhone'] ?? '');
    $contactEmail = trim($input['contact_email'] ?? $input['contactEmail'] ?? '');

    if (empty($contactName)) {
        Response::error('Contact name is required', 400);
    }
    if (empty($contactPhone)) {
        Response::error('Contact phone is required', 400);
    }
    if (empty($contactEmail)) {
        Response::error('Contact email is required', 400);
    }
    if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
        Response::error('A valid email address is required', 400);
    }

    $id = 'prop-' . time() . '-' . bin2hex(random_bytes(4));
    $socialUrls = gfz_social_url_params($input);

    // Handle image uploads if present
    $imageUrls = [];
    if (!empty($_FILES['images'])) {
        $maxImages = defined('UPLOAD_MAX_IMAGES') ? UPLOAD_MAX_IMAGES : 41;
        if (isset($_FILES['images']['name']) && is_array($_FILES['images']['name'])) {
            if (count($_FILES['images']['name']) > $maxImages) {
                Response::error("Maximum {$maxImages} images allowed", 400);
            }
        }
        $imageUrls = Upload::handleUpload($_FILES['images']);
    }

    // Handle video upload if present
    $videoUrl = null;
    if (!empty($_FILES['video'])) {
        $videoUrl = Upload::handleVideoUpload($_FILES['video']);
    }

    // Insert property with status=active (auto-approved), is_vip=0 (forced)
    $sql = "INSERT INTO properties
            (id, title, listing_type, property_type, price, bedrooms, bathrooms, sqft,
             address, city, state, zip, latitude, longitude, description, status, is_vip, expires_at,
             youtube_url, facebook_url, instagram_url, tiktok_url, x_url, whatsapp_url,
             video_url, contact_name, contact_phone, contact_email, owner_id, main_image)
            VALUES
            (:id, :title, :listing_type, :property_type, :price, :bedrooms, :bathrooms, :sqft,
             :address, :city, :state, :zip, :latitude, :longitude, :description, 'active', 0, NULL,
             :youtube_url, :facebook_url, :instagram_url, :tiktok_url, :x_url, :whatsapp_url,
             :video_url, :contact_name, :contact_phone, :contact_email, :owner_id, :main_image)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        'id'            => $id,
        'title'         => trim($input['title']),
        'listing_type'  => $listingType,
        'property_type' => trim($input['property_type'] ?? $input['propertyType'] ?? 'Single Family'),
        'price'         => (float) $input['price'],
        'bedrooms'      => (int) ($input['bedrooms'] ?? 0),
        'bathrooms'     => (int) ($input['bathrooms'] ?? 0),
        'sqft'          => (int) ($input['sqft'] ?? 0),
        'address'       => trim($input['address']),
        'city'          => trim($input['city']),
        'state'         => trim($input['state']),
        'zip'           => trim($input['zip'] ?? ''),
        'latitude'      => !empty($input['latitude']) ? (float) $input['latitude'] : null,
        'longitude'     => !empty($input['longitude']) ? (float) $input['longitude'] : null,
        'description'   => trim($input['description'] ?? ''),
        'youtube_url'   => gfz_optional_http_url($input, 'youtube_url', 'youtubeUrl'),
        'facebook_url'  => $socialUrls['facebook_url'],
        'instagram_url' => $socialUrls['instagram_url'],
        'tiktok_url'    => $socialUrls['tiktok_url'],
        'x_url'         => $socialUrls['x_url'],
        'whatsapp_url'  => $socialUrls['whatsapp_url'],
        'video_url'     => $videoUrl,
        'contact_name'  => $contactName,
        'contact_phone' => $contactPhone,
        'contact_email' => $contactEmail,
        'owner_id'      => $identity['id'] ?? null,
        'main_image'    => $imageUrls[0] ?? null,
    ]);

    gfz_attach_property_media($db, $id, $imageUrls, null);

    $mediaToken = gfz_create_media_upload_token($id);

    // Notify admin about the new listing
    $fullAddress = trim(trim($input['address']) . ', ' . trim($input['city']) . ', ' . trim($input['state']), ', ');
    $orderIdForListing = $input['paypal_order_id'] ?? $input['paypalOrderId'] ?? '';
    $isProListing = !empty($orderIdForListing);
    $proFee = $isProListing ? floatval($input['pro_fee'] ?? $input['proFee'] ?? 0) : 0;
    Mailer::notifyNewListing(
        trim($input['title']),
        $listingType,
        (float) $input['price'],
        $fullAddress,
        $contactName,
        $contactEmail,
        $contactPhone,
        $isProListing,
        $proFee
    );

    Response::json([
        'id'               => $id,
        'status'           => 'active',
        'mediaUploadToken' => $mediaToken,
        'message'          => 'Your listing is now live!',
    ], 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — CREATE (Admin only)
// ═════════════════════════════════════════════════════════════════════════════

// Public media upload in small batches after /api/public/submit.
// This avoids shared-hosting max_file_uploads limits while keeping one UX submit.
$router->add('POST', '/api/public/properties/{id}/media', function ($params) {
    $db = Database::getInstance();
    $id = $params['id'];
    $input = $_POST;

    gfz_require_media_upload_token($id, $input);

    $check = $db->prepare('SELECT id FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Property not found');
    }

    if (empty($_FILES['images']) && empty($_FILES['video'])) {
        Response::error('No media provided. Send images[] and/or one video file.', 400);
    }

    $imageCount = !empty($_FILES['images']) ? gfz_count_uploaded_files($_FILES['images']) : 0;
    $batchMax = defined('UPLOAD_BATCH_MAX_IMAGES') ? UPLOAD_BATCH_MAX_IMAGES : 10;
    if ($imageCount > $batchMax) {
        Response::error("Maximum {$batchMax} images allowed per batch", 400);
    }

    if ($imageCount > 0) {
        $countStmt = $db->prepare('SELECT COUNT(*) FROM property_images WHERE property_id = :id');
        $countStmt->execute(['id' => $id]);
        $existingCount = (int) $countStmt->fetchColumn();
        $maxImages = defined('UPLOAD_MAX_IMAGES') ? UPLOAD_MAX_IMAGES : 41;
        if ($existingCount + $imageCount > $maxImages) {
            Response::error("Maximum {$maxImages} images allowed per listing", 400);
        }
    }

    $imageUrls = [];
    if (!empty($_FILES['images'])) {
        $imageUrls = Upload::handleUpload($_FILES['images']);
    }

    $videoUrl = null;
    if (!empty($_FILES['video'])) {
        $videoUrl = Upload::handleVideoUpload($_FILES['video']);
    }

    gfz_attach_property_media($db, $id, $imageUrls, $videoUrl);

    Response::json([
        'id'        => $id,
        'urls'      => $imageUrls,
        'video_url' => $videoUrl,
        'count'     => count($imageUrls),
    ], 201);
});

$router->add('POST', '/api/user/properties/{id}/media', function ($params) {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();
    gfz_ensure_property_owner_column($db);
    $id = $params['id'];
    $identity = gfz_auth_identity($db, $payload);

    $check = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    $property = $check->fetch(PDO::FETCH_ASSOC);
    if (!$property) {
        Response::notFound('Property not found');
    }

    if (!gfz_owner_can_edit_property($property, $identity)) {
        Response::forbidden('You can only edit your own listings');
    }

    if (empty($_FILES['images'])) {
        Response::error('No images provided. Send images[] files.', 400);
    }

    $imageCount = gfz_count_uploaded_files($_FILES['images']);
    $batchMax = defined('UPLOAD_BATCH_MAX_IMAGES') ? UPLOAD_BATCH_MAX_IMAGES : 10;
    if ($imageCount > $batchMax) {
        Response::error("Maximum {$batchMax} images allowed per upload", 400);
    }

    $imageUrls = Upload::handleUpload($_FILES['images']);
    gfz_attach_property_media($db, $id, $imageUrls, null);

    gfz_return_property($db, $id);
});

// Admin property create.
$router->add('POST', '/api/properties', function () use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();

    // Generate ID if not provided
    $id = $input['id'] ?? ('prop-' . time() . '-' . bin2hex(random_bytes(4)));

    // Validate required fields
    if (empty($input['title'])) {
        Response::error('Title is required');
    }
    if (empty($input['address'])) {
        Response::error('Address is required');
    }
    $socialUrls = gfz_social_url_params($input);

    $sql = "INSERT INTO properties
            (id, title, listing_type, property_type, price, bedrooms, bathrooms, sqft,
             address, city, state, zip, latitude, longitude, description, status, is_vip, expires_at,
             youtube_url, facebook_url, instagram_url, tiktok_url, x_url, whatsapp_url,
             video_url, contact_name, contact_phone, contact_email, main_image)
            VALUES
            (:id, :title, :listing_type, :property_type, :price, :bedrooms, :bathrooms, :sqft,
             :address, :city, :state, :zip, :latitude, :longitude, :description, :status, :is_vip, :expires_at,
             :youtube_url, :facebook_url, :instagram_url, :tiktok_url, :x_url, :whatsapp_url,
             :video_url, :contact_name, :contact_phone, :contact_email, :main_image)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        'id'            => $id,
        'title'         => $input['title'],
        'listing_type'  => $input['listing_type'] ?? $input['listingType'] ?? 'sale',
        'property_type' => $input['property_type'] ?? $input['propertyType'] ?? 'Single Family',
        'price'         => (float) ($input['price'] ?? 0),
        'bedrooms'      => (int) ($input['bedrooms'] ?? 0),
        'bathrooms'     => (int) ($input['bathrooms'] ?? 0),
        'sqft'          => (int) ($input['sqft'] ?? 0),
        'address'       => $input['address'],
        'city'          => $input['city'] ?? '',
        'state'         => $input['state'] ?? '',
        'zip'           => $input['zip'] ?? '',
        'latitude'      => !empty($input['latitude']) ? (float) $input['latitude'] : null,
        'longitude'     => !empty($input['longitude']) ? (float) $input['longitude'] : null,
        'description'   => $input['description'] ?? null,
        'status'        => $input['status'] ?? 'active',
        'is_vip'        => (int) ($input['is_vip'] ?? $input['isVip'] ?? 0),
        'expires_at'    => $input['expires_at'] ?? $input['expiresAt'] ?? null,
        'youtube_url'   => gfz_optional_http_url($input, 'youtube_url', 'youtubeUrl'),
        'facebook_url'  => $socialUrls['facebook_url'],
        'instagram_url' => $socialUrls['instagram_url'],
        'tiktok_url'    => $socialUrls['tiktok_url'],
        'x_url'         => $socialUrls['x_url'],
        'whatsapp_url'  => $socialUrls['whatsapp_url'],
        'video_url'     => $input['video_url'] ?? $input['videoUrl'] ?? null,
        'contact_name'  => $input['contact_name'] ?? $input['contactName'] ?? null,
        'contact_phone' => $input['contact_phone'] ?? $input['contactPhone'] ?? null,
        'contact_email' => $input['contact_email'] ?? $input['contactEmail'] ?? null,
        'main_image'    => $input['main_image'] ?? $input['mainImage'] ?? null,
    ]);

    // Insert images
    $images = $input['images'] ?? [];
    if (!empty($images) && is_array($images)) {
        $imgStmt = $db->prepare(
            'INSERT INTO property_images (property_id, image_url, sort_order) VALUES (:pid, :url, :sort)'
        );
        foreach ($images as $i => $url) {
            $imgStmt->execute([
                'pid'  => $id,
                'url'  => $url,
                'sort' => $i,
            ]);
        }
    }

    // Return the created property
    $stmt = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch();
    $prop['images']    = $images;
    $prop['is_vip']    = (bool) $prop['is_vip'];
    $prop['price']     = (float) $prop['price'];
    $prop['bedrooms']  = (int) $prop['bedrooms'];
    $prop['bathrooms'] = (int) $prop['bathrooms'];
    $prop['sqft']      = (int) $prop['sqft'];

    Response::json($prop, 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — UPDATE
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PUT', '/api/user/properties/{id}', function ($params) use ($input) {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();
    gfz_ensure_property_owner_column($db);

    $id = $params['id'];
    $identity = gfz_auth_identity($db, $payload);

    $check = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    $property = $check->fetch(PDO::FETCH_ASSOC);
    if (!$property) {
        Response::notFound('Property not found');
    }

    if (!gfz_owner_can_edit_property($property, $identity)) {
        Response::forbidden('You can only edit your own listings');
    }

    $fields = [
        'title', 'listing_type', 'property_type', 'price', 'bedrooms', 'bathrooms',
        'sqft', 'address', 'city', 'state', 'zip', 'latitude', 'longitude',
        'description', 'status', 'youtube_url', 'facebook_url', 'instagram_url',
        'tiktok_url', 'x_url', 'whatsapp_url', 'video_url', 'contact_name',
        'contact_phone', 'contact_email', 'main_image',
    ];

    $camelMap = [
        'listing_type'  => 'listingType',
        'property_type' => 'propertyType',
        'youtube_url'   => 'youtubeUrl',
        'facebook_url'  => 'facebookUrl',
        'instagram_url' => 'instagramUrl',
        'tiktok_url'    => 'tiktokUrl',
        'x_url'         => 'xUrl',
        'whatsapp_url'  => 'whatsappUrl',
        'video_url'     => 'videoUrl',
        'contact_name'  => 'contactName',
        'contact_phone' => 'contactPhone',
        'contact_email' => 'contactEmail',
        'main_image'    => 'mainImage',
    ];

    $setClauses = [];
    $updateParams = ['id' => $id];
    $requiredText = ['title', 'address', 'city', 'state', 'contact_name', 'contact_phone', 'contact_email'];
    $urlFields = ['youtube_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'x_url', 'whatsapp_url', 'video_url'];

    foreach ($fields as $field) {
        if (array_key_exists($field, $input)) {
            $value = $input[$field];
        } elseif (isset($camelMap[$field]) && array_key_exists($camelMap[$field], $input)) {
            $value = $input[$camelMap[$field]];
        } else {
            continue;
        }

        if (in_array($field, ['title', 'listing_type', 'property_type', 'address', 'city', 'state', 'zip', 'description', 'status', 'contact_name', 'contact_phone', 'contact_email', 'main_image'], true)) {
            $value = trim((string) $value);
        }

        if (in_array($field, $requiredText, true) && $value === '') {
            Response::error("{$field} is required", 400);
        }

        if ($field === 'listing_type' && !in_array($value, ['sale', 'rent'], true)) {
            Response::error('listing_type must be "sale" or "rent"', 400);
        } elseif ($field === 'status' && !in_array($value, ['active', 'hidden'], true)) {
            Response::error('Owners can only set status to active or hidden', 400);
        } elseif ($field === 'price') {
            if (!is_numeric($value) || (float) $value <= 0) {
                Response::error('A valid price is required', 400);
            }
            $value = (float) $value;
        } elseif (in_array($field, ['bedrooms', 'bathrooms', 'sqft'], true)) {
            if ($value !== '' && !is_numeric($value)) {
                Response::error("{$field} must be a number", 400);
            }
            $value = (int) $value;
        } elseif (in_array($field, ['latitude', 'longitude'], true)) {
            $value = ($value === '' || $value === null) ? null : (float) $value;
        } elseif ($field === 'contact_email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            Response::error('A valid email address is required', 400);
        } elseif (in_array($field, $urlFields, true)) {
            $value = trim((string) $value);
            if ($value === '') {
                $value = null;
            } elseif (
                !filter_var($value, FILTER_VALIDATE_URL) ||
                !preg_match('/^https?:\/\//i', $value)
            ) {
                Response::error("Invalid URL for {$field}. Use http:// or https://", 400);
            }
        }

        $setClauses[] = "{$field} = :{$field}";
        $updateParams[$field] = $value;
    }

    if (empty($property['owner_id']) && !empty($identity['id'])) {
        $setClauses[] = 'owner_id = :owner_id';
        $updateParams['owner_id'] = $identity['id'];
    }

    $images = $input['images'] ?? null;
    if (is_array($images)) {
        $cleanImages = [];
        foreach ($images as $url) {
            $url = trim((string) $url);
            if ($url !== '') {
                $cleanImages[] = $url;
            }
        }

        $db->prepare('DELETE FROM property_images WHERE property_id = :id')
           ->execute(['id' => $id]);

        if (!empty($cleanImages)) {
            $imgStmt = $db->prepare(
                'INSERT INTO property_images (property_id, image_url, sort_order) VALUES (:pid, :url, :sort)'
            );
            foreach ($cleanImages as $i => $url) {
                $imgStmt->execute([
                    'pid'  => $id,
                    'url'  => $url,
                    'sort' => $i,
                ]);
            }
        }

        if (!array_key_exists('main_image', $input) && !array_key_exists('mainImage', $input)) {
            $setClauses[] = 'main_image = :main_image';
            $updateParams['main_image'] = $cleanImages[0] ?? null;
        }
    }

    if (!empty($setClauses)) {
        $sql = "UPDATE properties SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateParams);
    }

    gfz_return_property($db, $id);
});

$router->add('PUT', '/api/properties/{id}', function ($params) use ($input) {
    $payload = Auth::requireAuth();
    $db = Database::getInstance();
    gfz_ensure_property_owner_column($db);
    $id = $params['id'];
    $identity = gfz_auth_identity($db, $payload);
    $isAdmin = ($identity['role'] ?? '') === 'admin';

    // Check property exists
    $check = $db->prepare('SELECT * FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    $property = $check->fetch(PDO::FETCH_ASSOC);
    if (!$property) {
        Response::notFound('Property not found');
    }

    if (!$isAdmin && !gfz_owner_can_edit_property($property, $identity)) {
        Response::forbidden('You can only edit your own listings');
    }

    // Build dynamic update. Admin-only fields are appended below.
    $fields = [
        'title', 'listing_type', 'property_type', 'price', 'bedrooms', 'bathrooms',
        'sqft', 'address', 'city', 'state', 'zip', 'description', 'status',
        'youtube_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'x_url',
        'whatsapp_url', 'video_url', 'contact_name',
        'contact_phone', 'contact_email', 'main_image',
    ];
    if ($isAdmin) {
        $fields[] = 'is_vip';
        $fields[] = 'expires_at';
    }

    // Map camelCase to snake_case alternatives
    $camelMap = [
        'listing_type'  => 'listingType',
        'property_type' => 'propertyType',
        'is_vip'        => 'isVip',
        'expires_at'    => 'expiresAt',
        'youtube_url'   => 'youtubeUrl',
        'facebook_url'  => 'facebookUrl',
        'instagram_url' => 'instagramUrl',
        'tiktok_url'    => 'tiktokUrl',
        'x_url'         => 'xUrl',
        'whatsapp_url'  => 'whatsappUrl',
        'video_url'     => 'videoUrl',
        'contact_name'  => 'contactName',
        'contact_phone' => 'contactPhone',
        'contact_email' => 'contactEmail',
        'main_image'    => 'mainImage',
    ];

    $setClauses = [];
    $updateParams = ['id' => $id];
    $urlFields = ['youtube_url', 'facebook_url', 'instagram_url', 'tiktok_url', 'x_url', 'whatsapp_url', 'video_url'];

    foreach ($fields as $field) {
        $value = null;
        if (array_key_exists($field, $input)) {
            $value = $input[$field];
        } elseif (isset($camelMap[$field]) && array_key_exists($camelMap[$field], $input)) {
            $value = $input[$camelMap[$field]];
        } else {
            continue;
        }

        // Type casting
        if ($field === 'price') {
            if (!is_numeric($value) || (float) $value <= 0) {
                Response::error('A valid price is required', 400);
            }
            $value = (float) $value;
        } elseif (in_array($field, ['bedrooms', 'bathrooms', 'sqft'])) {
            $value = (int) $value;
        } elseif ($field === 'is_vip') {
            $value = (int) $value;
        } elseif ($field === 'status') {
            $value = trim((string) $value);
            $allowed = $isAdmin ? ['active', 'pending', 'hidden', 'expired'] : ['active', 'hidden'];
            if (!in_array($value, $allowed, true)) {
                Response::error('Invalid status. Allowed: ' . implode(', ', $allowed), 400);
            }
        } elseif ($field === 'listing_type') {
            $value = trim((string) $value);
            if (!in_array($value, ['sale', 'rent'], true)) {
                Response::error('listing_type must be "sale" or "rent"', 400);
            }
        } elseif ($field === 'contact_email') {
            $value = trim((string) $value);
            if ($value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                Response::error('A valid email address is required', 400);
            }
        } elseif (in_array($field, $urlFields, true)) {
            $value = trim((string) $value);
            if ($value === '') {
                $value = null;
            } elseif (
                !filter_var($value, FILTER_VALIDATE_URL) ||
                !preg_match('/^https?:\/\//i', $value)
            ) {
                Response::error("Invalid URL for {$field}. Use http:// or https://", 400);
            }
        }

        $setClauses[] = "{$field} = :{$field}";
        $updateParams[$field] = $value;
    }

    if (!$isAdmin && empty($property['owner_id']) && !empty($identity['id'])) {
        $setClauses[] = 'owner_id = :owner_id';
        $updateParams['owner_id'] = $identity['id'];
    }

    // Sync images if provided
    $images = $input['images'] ?? null;
    if (is_array($images)) {
        $cleanImages = [];
        foreach ($images as $url) {
            $url = trim((string) $url);
            if ($url !== '') {
                $cleanImages[] = $url;
            }
        }

        // Delete existing images
        $db->prepare('DELETE FROM property_images WHERE property_id = :id')
           ->execute(['id' => $id]);

        // Re-insert
        if (!empty($cleanImages)) {
            $imgStmt = $db->prepare(
                'INSERT INTO property_images (property_id, image_url, sort_order) VALUES (:pid, :url, :sort)'
            );
            foreach ($cleanImages as $i => $url) {
                $imgStmt->execute([
                    'pid'  => $id,
                    'url'  => $url,
                    'sort' => $i,
                ]);
            }
        }

        if (!array_key_exists('main_image', $input) && !array_key_exists('mainImage', $input)) {
            $setClauses[] = 'main_image = :main_image';
            $updateParams['main_image'] = $cleanImages[0] ?? null;
        }
    }

    if (!empty($setClauses)) {
        $sql = "UPDATE properties SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($updateParams);
    }

    gfz_return_property($db, $id);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — DELETE
// ═════════════════════════════════════════════════════════════════════════════

$router->add('DELETE', '/api/properties/{id}', function ($params) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $check = $db->prepare('SELECT id FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Property not found');
    }

    // Foreign key CASCADE will handle property_images deletion
    $db->prepare('DELETE FROM properties WHERE id = :id')
       ->execute(['id' => $id]);

    Response::json(['deleted' => true, 'id' => $id]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — TOGGLE VIP
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PATCH', '/api/properties/{id}/vip', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $stmt = $db->prepare('SELECT id, is_vip FROM properties WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        Response::notFound('Property not found');
    }

    // Toggle or set explicitly
    if (isset($input['is_vip']) || isset($input['isVip'])) {
        $newVip = (int) ($input['is_vip'] ?? $input['isVip']);
    } else {
        $newVip = $prop['is_vip'] ? 0 : 1;
    }

    $db->prepare('UPDATE properties SET is_vip = :vip WHERE id = :id')
       ->execute(['vip' => $newVip, 'id' => $id]);

    Response::json([
        'id'     => $id,
        'is_vip' => (bool) $newVip,
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTIES — UPDATE STATUS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PATCH', '/api/properties/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $check = $db->prepare('SELECT id FROM properties WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Property not found');
    }

    $status = $input['status'] ?? null;
    $allowed = ['active', 'pending', 'hidden', 'expired'];
    if (!$status || !in_array($status, $allowed, true)) {
        Response::error('Invalid status. Allowed: ' . implode(', ', $allowed));
    }

    $db->prepare('UPDATE properties SET status = :status WHERE id = :id')
       ->execute(['status' => $status, 'id' => $id]);

    Response::json([
        'id'     => $id,
        'status' => $status,
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  UPLOADS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/uploads', function () {
    Auth::requireAdmin();

    if (empty($_FILES['images']) && empty($_FILES['video'])) {
        Response::error('No media provided. Send images with field name "images" or one video with field name "video"');
    }

    $urls = [];

    // Enforce image count limit
    $maxImages = defined('UPLOAD_MAX_IMAGES') ? UPLOAD_MAX_IMAGES : 41;
    if (!empty($_FILES['images']) && isset($_FILES['images']['name']) && is_array($_FILES['images']['name'])) {
        if (count($_FILES['images']['name']) > $maxImages) {
            Response::error("Maximum {$maxImages} images allowed per upload", 400);
        }
    }

    if (!empty($_FILES['images'])) {
        $urls = Upload::handleUpload($_FILES['images']);
    }

    $videoUrl = null;
    if (!empty($_FILES['video'])) {
        $videoUrl = Upload::handleVideoUpload($_FILES['video']);
    }

    Response::json([
        'urls'      => $urls,
        'video_url' => $videoUrl,
        'count'     => count($urls),
    ], 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  INQUIRIES — LIST
// ═════════════════════════════════════════════════════════════════════════════

$router->add('DELETE', '/api/uploads', function () use ($input) {
    Auth::requireAdmin();

    $url = trim((string) ($_GET['url'] ?? $input['url'] ?? ''));
    if ($url === '') {
        Response::error('Upload URL is required', 400);
    }

    $path = parse_url($url, PHP_URL_PATH);
    if (!$path) {
        $path = $url;
    }
    $path = rawurldecode($path);

    $relative = null;
    foreach (['/backend/uploads/', '/uploads/'] as $prefix) {
        if (strpos($path, $prefix) === 0) {
            $relative = substr($path, strlen($prefix));
            break;
        }
    }

    if ($relative === null || $relative === '') {
        Response::error('Only files inside backend/uploads can be deleted', 400);
    }
    if (strpos($relative, "\0") !== false || preg_match('#(^|[\\\\/])\\.\\.([\\\\/]|$)#', $relative)) {
        Response::error('Invalid upload path', 400);
    }

    $relative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, ltrim($relative, '/\\'));
    $uploadsBase = realpath(dirname(__DIR__) . '/uploads');
    if (!$uploadsBase) {
        Response::error('Upload directory is not available', 500);
    }

    $targetPath = realpath($uploadsBase . DIRECTORY_SEPARATOR . $relative);
    $uploadsPrefix = rtrim($uploadsBase, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (!$targetPath || strpos($targetPath, $uploadsPrefix) !== 0 || !is_file($targetPath)) {
        Response::notFound('Upload file not found');
    }

    $basename = basename($targetPath);
    $extension = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'm4v'];
    if ($basename === '' || $basename[0] === '.' || !in_array($extension, $allowedExtensions, true)) {
        Response::error('Refusing to delete non-media upload file', 400);
    }

    if (!unlink($targetPath)) {
        Response::error('Failed to delete upload file', 500);
    }

    Response::json([
        'deleted' => true,
        'url'     => $url,
    ]);
});

$router->add('GET', '/api/inquiries', function () {
    Auth::requireAdmin();
    $db = Database::getInstance();

    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = min(200, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $where  = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[]  = 'status = :status';
        $params['status'] = $_GET['status'];
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM inquiries {$whereClause}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $sql = "SELECT * FROM inquiries {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue(":{$key}", $val, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    Response::json([
        'inquiries'  => $stmt->fetchAll(),
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  INQUIRIES — CREATE
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/inquiries', function () use ($input) {
    $db = Database::getInstance();

    if (empty($input['name'])) {
        Response::error('Name is required');
    }
    if (empty($input['email'])) {
        Response::error('Email is required');
    }

    $id = 'inq-' . time() . '-' . bin2hex(random_bytes(4));

    $sql = "INSERT INTO inquiries (id, property_id, name, email, phone, message)
            VALUES (:id, :property_id, :name, :email, :phone, :message)";

    $db->prepare($sql)->execute([
        'id'          => $id,
        'property_id' => $input['property_id'] ?? $input['propertyId'] ?? null,
        'name'        => $input['name'],
        'email'       => $input['email'],
        'phone'       => $input['phone'] ?? null,
        'message'     => $input['message'] ?? null,
    ]);

    $stmt = $db->prepare('SELECT * FROM inquiries WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $inquiry = $stmt->fetch();

    // Send email notification
    $propertyAddress = '';
    $ownerEmail = null;
    $propId = $input['property_id'] ?? $input['propertyId'] ?? null;
    if ($propId) {
        $prop = $db->prepare('SELECT address, city, state, contact_email FROM properties WHERE id = :id');
        $prop->execute(['id' => $propId]);
        $propData = $prop->fetch();
        if ($propData) {
            $propertyAddress = trim($propData['address'] . ', ' . $propData['city'] . ', ' . $propData['state'], ', ');
            $ownerEmail = $propData['contact_email'];
        }
    }
    Mailer::notifyNewInquiry(
        $propertyAddress ?: 'N/A',
        $input['name'],
        $input['email'],
        $input['phone'] ?? '',
        $input['message'] ?? '',
        $ownerEmail
    );

    Response::json($inquiry, 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  INQUIRIES — LIST FOR CURRENT USER (by property contact_email)
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/user/inquiries', function () {
    $payload = Auth::requireAuth();
    $db = Database::getInstance();

    // Get user email from JWT or from users table
    $userEmail = $payload['email'] ?? null;
    if (!$userEmail && !empty($payload['sub'])) {
        $stmt = $db->prepare('SELECT email FROM users WHERE id = :id');
        $stmt->execute(['id' => $payload['sub']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $userEmail = $row['email'] ?? null;
    }

    if (!$userEmail) {
        Response::json(['inquiries' => [], 'total' => 0]);
        return;
    }

    // Find all property IDs owned by this user (matched by contact_email)
    $propStmt = $db->prepare('SELECT id FROM properties WHERE LOWER(contact_email) = LOWER(:email)');
    $propStmt->execute(['email' => $userEmail]);
    $propIds = $propStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($propIds)) {
        Response::json(['inquiries' => [], 'total' => 0]);
        return;
    }

    // Fetch inquiries for those properties
    $placeholders = implode(',', array_fill(0, count($propIds), '?'));
    $sql = "SELECT i.*, p.address as property_address, p.city as property_city
            FROM inquiries i
            LEFT JOIN properties p ON i.property_id = p.id
            WHERE i.property_id IN ({$placeholders})
            ORDER BY i.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($propIds);
    $inquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json([
        'inquiries' => $inquiries,
        'total'     => count($inquiries),
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  INQUIRIES — UPDATE STATUS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PATCH', '/api/inquiries/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $check = $db->prepare('SELECT id FROM inquiries WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Inquiry not found');
    }

    $status  = $input['status'] ?? null;
    $allowed = ['new', 'read', 'replied'];
    if (!$status || !in_array($status, $allowed, true)) {
        Response::error('Invalid status. Allowed: ' . implode(', ', $allowed));
    }

    $db->prepare('UPDATE inquiries SET status = :status WHERE id = :id')
       ->execute(['status' => $status, 'id' => $id]);

    Response::json(['id' => $id, 'status' => $status]);
});


$router->add('DELETE', '/api/inquiries/{id}', function ($params) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $stmt = $db->prepare('DELETE FROM inquiries WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        Response::notFound('Inquiry not found');
    }

    Response::json(['deleted' => true, 'id' => $id]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTS — LIST
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/reports', function () {
    Auth::requireAdmin();
    $db = Database::getInstance();

    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = min(200, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $where  = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[]  = 'status = :status';
        $params['status'] = $_GET['status'];
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM reports {$whereClause}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $sql = "SELECT * FROM reports {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue(":{$key}", $val, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    Response::json([
        'reports'    => $stmt->fetchAll(),
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTS — CREATE
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/reports', function () use ($input) {
    $db = Database::getInstance();

    $id = 'rpt-' . time() . '-' . bin2hex(random_bytes(4));

    $reason  = $input['reason'] ?? 'other';
    $allowed = ['spam', 'incorrect', 'scam', 'duplicate', 'other'];
    if (!in_array($reason, $allowed, true)) {
        $reason = 'other';
    }

    $sql = "INSERT INTO reports (id, property_id, property_address, reason, description, contact_email)
            VALUES (:id, :property_id, :property_address, :reason, :description, :contact_email)";

    $db->prepare($sql)->execute([
        'id'               => $id,
        'property_id'      => $input['property_id'] ?? $input['propertyId'] ?? null,
        'property_address' => $input['property_address'] ?? $input['propertyAddress'] ?? '',
        'reason'           => $reason,
        'description'      => $input['description'] ?? null,
        'contact_email'    => $input['contact_email'] ?? $input['contactEmail'] ?? null,
    ]);

    $stmt = $db->prepare('SELECT * FROM reports WHERE id = :id');
    $stmt->execute(['id' => $id]);

    Response::json($stmt->fetch(), 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTS — UPDATE STATUS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PATCH', '/api/reports/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $check = $db->prepare('SELECT id FROM reports WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Report not found');
    }

    $status  = $input['status'] ?? null;
    $allowed = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!$status || !in_array($status, $allowed, true)) {
        Response::error('Invalid status. Allowed: ' . implode(', ', $allowed));
    }

    $db->prepare('UPDATE reports SET status = :status WHERE id = :id')
       ->execute(['status' => $status, 'id' => $id]);

    Response::json(['id' => $id, 'status' => $status]);
});


$router->add('DELETE', '/api/reports/{id}', function ($params) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $stmt = $db->prepare('DELETE FROM reports WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        Response::notFound('Report not found');
    }

    Response::json(['deleted' => true, 'id' => $id]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  SCHEDULES — LIST
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/schedules', function () {
    Auth::requireAdmin();
    $db = Database::getInstance();

    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = min(200, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $where  = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[]  = 'status = :status';
        $params['status'] = $_GET['status'];
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $db->prepare("SELECT COUNT(*) FROM schedules {$whereClause}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $sql = "SELECT * FROM schedules {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue(":{$key}", $val, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    Response::json([
        'schedules'  => $stmt->fetchAll(),
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  SCHEDULES — CREATE
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/schedules', function () use ($input) {
    $db = Database::getInstance();

    // Validate required fields
    if (empty($input['name'])) {
        Response::error('Name is required');
    }
    if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        Response::error('Valid email is required');
    }
    if (empty($input['phone'])) {
        Response::error('Phone is required');
    }
    if (empty($input['date'])) {
        Response::error('Date is required');
    }
    if (empty($input['time'])) {
        Response::error('Time is required');
    }

    $paypalOrderId = $input['paypal_order_id'] ?? $input['paypalOrderId'] ?? null;
    $paymentVerified = false;

    // Verify PayPal order server-side if provided (skip for bank transfers)
    $isBankTransfer = $paypalOrderId && str_starts_with($paypalOrderId, 'BANK-');
    if ($isBankTransfer) {
        $paymentVerified = true; // Bank transfers are verified manually by admin
    } elseif ($paypalOrderId && defined('PAYPAL_CLIENT_ID') && defined('PAYPAL_SECRET') && PAYPAL_CLIENT_ID && PAYPAL_SECRET) {
        $paypalBase = defined('PAYPAL_SANDBOX') && PAYPAL_SANDBOX
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';

        // Get access token
        $tokenCh = curl_init("{$paypalBase}/v1/oauth2/token");
        curl_setopt_array($tokenCh, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_USERPWD => PAYPAL_CLIENT_ID . ':' . PAYPAL_SECRET,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_TIMEOUT => 15,
        ]);
        $tokenResp = json_decode(curl_exec($tokenCh), true);
        curl_close($tokenCh);

        if (!empty($tokenResp['access_token'])) {
            // Get order details
            $orderCh = curl_init("{$paypalBase}/v2/checkout/orders/{$paypalOrderId}");
            curl_setopt_array($orderCh, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer {$tokenResp['access_token']}",
                    'Content-Type: application/json',
                ],
                CURLOPT_TIMEOUT => 15,
            ]);
            $orderResp = json_decode(curl_exec($orderCh), true);
            curl_close($orderCh);

            if (!empty($orderResp['status']) && $orderResp['status'] === 'COMPLETED') {
                // Verify amount is $9.00 USD
                $amount = $orderResp['purchase_units'][0]['amount']['value'] ?? '0';
                $currency = $orderResp['purchase_units'][0]['amount']['currency_code'] ?? '';
                if ((float) $amount >= 9.00 && strtoupper($currency) === 'USD') {
                    $paymentVerified = true;
                }
            }
        }

        if (!$paymentVerified) {
            Response::error('PayPal payment verification failed. Please try again or contact support.', 400);
        }
    }

    $id = 'sch-' . time() . '-' . bin2hex(random_bytes(4));

    $sql = "INSERT INTO schedules (id, property_id, property_address, name, phone, email, date, time, message, paypal_order_id)
            VALUES (:id, :property_id, :property_address, :name, :phone, :email, :date, :time, :message, :paypal_order_id)";

    $db->prepare($sql)->execute([
        'id'               => $id,
        'property_id'      => $input['property_id'] ?? $input['propertyId'] ?? null,
        'property_address' => $input['property_address'] ?? $input['propertyAddress'] ?? '',
        'name'             => $input['name'],
        'phone'            => $input['phone'] ?? null,
        'email'            => $input['email'] ?? null,
        'date'             => $input['date'] ?? null,
        'time'             => $input['time'] ?? null,
        'message'          => $input['message'] ?? null,
        'paypal_order_id'  => $paymentVerified ? $paypalOrderId : null,
    ]);

    $stmt = $db->prepare('SELECT * FROM schedules WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $schedule = $stmt->fetch(PDO::FETCH_ASSOC);

    // Fallback if fetch fails (e.g. replication delay)
    if (!$schedule) {
        $schedule = [
            'id' => $id,
            'property_id' => $input['property_id'] ?? $input['propertyId'] ?? null,
            'property_address' => $input['property_address'] ?? $input['propertyAddress'] ?? '',
            'name' => $input['name'],
            'phone' => $input['phone'] ?? null,
            'email' => $input['email'] ?? null,
            'date' => $input['date'] ?? null,
            'time' => $input['time'] ?? null,
            'message' => $input['message'] ?? null,
            'paypal_order_id' => $paymentVerified ? $paypalOrderId : null,
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
        ];
    }

    // Send email notification
    $ownerEmail = null;
    $propId = $input['property_id'] ?? $input['propertyId'] ?? null;
    if ($propId) {
        $prop = $db->prepare('SELECT contact_email FROM properties WHERE id = :id');
        $prop->execute(['id' => $propId]);
        $propData = $prop->fetch();
        $ownerEmail = $propData['contact_email'] ?? null;
    }
    Mailer::notifyNewSchedule(
        $input['property_address'] ?? $input['propertyAddress'] ?? 'N/A',
        $input['name'],
        $input['email'] ?? '',
        $input['phone'] ?? '',
        $input['date'] ?? '',
        $input['time'] ?? '',
        $ownerEmail,
        9.00 // deposit amount
    );

    Response::json($schedule, 201);
});

// ═════════════════════════════════════════════════════════════════════════════
//  SCHEDULES — LIST FOR CURRENT USER (by property contact_email)
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/user/schedules', function () {
    $payload = Auth::requireAuth();
    $db = Database::getInstance();

    $userEmail = $payload['email'] ?? null;
    if (!$userEmail && !empty($payload['sub'])) {
        $stmt = $db->prepare('SELECT email FROM users WHERE id = :id');
        $stmt->execute(['id' => $payload['sub']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $userEmail = $row['email'] ?? null;
    }

    if (!$userEmail) {
        Response::json(['schedules' => [], 'total' => 0]);
        return;
    }

    $propStmt = $db->prepare('SELECT id FROM properties WHERE LOWER(contact_email) = LOWER(:email)');
    $propStmt->execute(['email' => $userEmail]);
    $propIds = $propStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($propIds)) {
        Response::json(['schedules' => [], 'total' => 0]);
        return;
    }

    $placeholders = implode(',', array_fill(0, count($propIds), '?'));
    $sql = "SELECT * FROM schedules
            WHERE property_id IN ({$placeholders})
            ORDER BY created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($propIds);
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json([
        'schedules' => $schedules,
        'total'     => count($schedules),
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  SCHEDULES — UPDATE STATUS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('PATCH', '/api/schedules/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $check = $db->prepare('SELECT id FROM schedules WHERE id = :id');
    $check->execute(['id' => $id]);
    if (!$check->fetch()) {
        Response::notFound('Schedule not found');
    }

    $status  = $input['status'] ?? null;
    $allowed = ['pending', 'confirmed', 'cancelled'];
    if (!$status || !in_array($status, $allowed, true)) {
        Response::error('Invalid status. Allowed: ' . implode(', ', $allowed));
    }

    $db->prepare('UPDATE schedules SET status = :status WHERE id = :id')
       ->execute(['status' => $status, 'id' => $id]);

    Response::json(['id' => $id, 'status' => $status]);
});


$router->add('DELETE', '/api/schedules/{id}', function ($params) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = $params['id'];

    $stmt = $db->prepare('DELETE FROM schedules WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() === 0) {
        Response::notFound('Schedule not found');
    }

    Response::json(['deleted' => true, 'id' => $id]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  AI — DESCRIPTION GENERATOR (proxy)
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/ai/description', function () use ($input) {
    // Rate limit: simple per-IP check using temp file
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitFile = sys_get_temp_dir() . '/gfz_ai_' . md5($ip);
    if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 5) {
        Response::error('Too many requests. Please wait a few seconds.', 429);
    }
    touch($rateLimitFile);

    $aiGeminiKey = gfz_config_string('AI_GEMINI_KEY');
    if ($aiGeminiKey === '') {
        Response::error('AI description service is not configured', 503);
    }

    // Build a Vietnamese prompt for the local real-estate workflow.
    $propertyType = trim((string)($input['propertyType'] ?? $input['property_type'] ?? 'nhà đất'));
    $listingType  = trim((string)($input['listingType'] ?? $input['listing_type'] ?? 'sale'));
    $title        = trim((string)($input['title'] ?? ''));
    $price        = trim((string)($input['price'] ?? '0'));
    $bedrooms     = trim((string)($input['bedrooms'] ?? '0'));
    $bathrooms    = trim((string)($input['bathrooms'] ?? '0'));
    $sqft         = trim((string)($input['sqft'] ?? '0'));
    $address      = trim((string)($input['address'] ?? ''));
    $city         = trim((string)($input['city'] ?? ''));
    $state        = trim((string)($input['state'] ?? ''));
    $amenities    = trim((string)($input['amenities'] ?? ''));
    $notes        = trim((string)($input['notes'] ?? ''));

    $action = $listingType === 'rent' ? 'cho thuê' : 'bán';
    $prompt = "Bạn là trợ lý nội dung bất động sản của Sổ Đỏ Vạn Phúc. "
        . "Hãy viết mô tả tiếng Việt cho nguồn {$propertyType} {$action}. "
        . "Bắt buộc dùng tiếng Việt có dấu đầy đủ, không viết tiếng Việt không dấu. "
        . "Không dùng markdown, không phóng đại quá mức, không cam kết pháp lý/tài chính. "
        . "Viết 2-3 đoạn ngắn, giọng chuyên nghiệp, dễ đọc cho môi giới nội bộ.\n\n"
        . "Tiêu đề: {$title}\n"
        . "Giá: {$price} VND\n"
        . "Diện tích: {$sqft} m2\n"
        . "Phòng ngủ: {$bedrooms}; Phòng tắm: {$bathrooms}\n"
        . "Khu vực: {$address}, {$city}, {$state}\n"
        . "Đặc điểm/tag: {$amenities}\n"
        . "Ghi chú thêm: {$notes}";

    // Try Gemini API
    $models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    $description = null;

    foreach ($models as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . rawurlencode($aiGeminiKey);
        $body = json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
        ]);

        $opts = [
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ];
        $ctx = stream_context_create($opts);
        $response = @file_get_contents($url, false, $ctx);

        if ($response === false) {
            continue;
        }

        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if ($text) {
            $description = $text;
            break;
        }
    }

    if (!$description) {
        Response::error('AI service unavailable. Please try again later.', 503);
    }

    Response::json(['description' => $description]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  USER AUTHENTICATION (public — register, login, forgot/reset password)
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/ai/chat', function () use ($input) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rateLimitFile = sys_get_temp_dir() . '/gfz_ai_chat_' . md5($ip);
    if (file_exists($rateLimitFile) && (time() - filemtime($rateLimitFile)) < 3) {
        Response::error('Too many requests. Please wait a few seconds.', 429);
    }
    touch($rateLimitFile);

    $aiGeminiKey = gfz_config_string('AI_GEMINI_KEY');
    if ($aiGeminiKey === '') {
        Response::error('AI chat service is not configured', 503);
    }

    $lang = ($input['lang'] ?? 'en') === 'vi' ? 'vi' : 'en';
    $messages = $input['messages'] ?? [];
    if (!is_array($messages)) {
        Response::error('messages must be an array', 400);
    }

    $recentMessages = array_slice($messages, -10);
    $contents = [];
    $contents[] = [
        'role' => 'user',
        'parts' => [[
            'text' => $lang === 'vi'
                ? 'Bạn là Trợ lý AI Sổ Đỏ Vạn Phúc, hỗ trợ ngắn gọn và thực tế về bất động sản, tìm kiếm nguồn nhà, gợi ý nội dung đăng tin, chăm sóc khách và cách dùng hệ thống. Luôn trả lời bằng tiếng Việt có dấu đầy đủ. Không viết tiếng Việt không dấu. Với quyết định pháp lý hoặc tài chính, hãy khuyên người dùng hỏi chuyên gia có giấy phép.'
                : 'You are So Do Van Phuc AI Assistant, a concise and helpful real estate advisor. Help with property search, market context, mortgage basics, platform usage and listing guidance. For legal or financial decisions, recommend a licensed professional. Always respond in English.',
        ]],
    ];
    $contents[] = [
        'role' => 'model',
        'parts' => [[
            'text' => $lang === 'vi'
                ? 'Đã hiểu. Tôi là Trợ lý AI Sổ Đỏ Vạn Phúc và sẵn sàng hỗ trợ.'
                : 'Understood. I am So Do Van Phuc AI Assistant and ready to help.',
        ]],
    ];

    $hasUserMessage = false;
    foreach ($recentMessages as $message) {
        if (!is_array($message)) {
            continue;
        }
        $text = trim((string)($message['text'] ?? ''));
        if ($text === '') {
            continue;
        }
        if (strlen($text) > 1200) {
            $text = substr($text, 0, 1200);
        }
        $isUser = ($message['sender'] ?? '') === 'me';
        if ($isUser) {
            $hasUserMessage = true;
        }
        $contents[] = [
            'role' => $isUser ? 'user' : 'model',
            'parts' => [['text' => $text]],
        ];
    }

    if (!$hasUserMessage) {
        Response::error('At least one user message is required', 400);
    }

    $models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    $reply = null;
    foreach ($models as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . rawurlencode($aiGeminiKey);
        $body = json_encode(['contents' => $contents]);
        $opts = [
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $body,
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ];
        $ctx = stream_context_create($opts);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) {
            continue;
        }

        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if ($text) {
            $reply = $text;
            break;
        }
    }

    if (!$reply) {
        Response::error('AI chat service unavailable. Please try again later.', 503);
    }

    Response::json(['reply' => $reply]);
});

// --- Register ---
$router->add('POST', '/api/auth/register', function () use ($input) {
    $email    = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $fullName = trim($input['full_name'] ?? $input['fullName'] ?? '');
    $phone    = trim($input['phone'] ?? '');

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Valid email is required', 400);
    }
    if (strlen($password) < 6) {
        Response::error('Password must be at least 6 characters', 400);
    }
    if (!$fullName) {
        Response::error('Full name is required', 400);
    }

    $db = Database::getInstance();

    // Check duplicate
    $check = $db->prepare('SELECT id FROM users WHERE email = :email');
    $check->execute(['email' => strtolower($email)]);
    if ($check->fetch()) {
        Response::error('Email already registered', 409);
    }

    $id = 'user-' . bin2hex(random_bytes(12));
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare('INSERT INTO users (id, email, password_hash, full_name, phone, role, status) VALUES (:id, :email, :hash, :name, :phone, :role, :status)');
    $stmt->execute([
        'id'     => $id,
        'email'  => strtolower($email),
        'hash'   => $hash,
        'name'   => $fullName,
        'phone'  => $phone ?: null,
        'role'   => 'user',
        'status' => 'active',
    ]);

    // Issue JWT
    $token = JwtAuth::createToken([
        'sub'   => $id,
        'role'  => 'user',
        'name'  => $fullName,
        'email' => strtolower($email),
    ]);

    Response::json([
        'id'    => $id,
        'email' => strtolower($email),
        'name'  => $fullName,
        'role'  => 'user',
        'token' => $token,
    ], 201);
});

// --- User Login ---
$router->add('POST', '/api/auth/user-login', function () use ($input) {
    $email    = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        Response::error('Email and password are required', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->execute(['email' => strtolower($email)]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        Response::error('Invalid email or password', 401);
    }

    if ($user['status'] === 'suspended') {
        Response::error('Account is suspended. Contact support.', 403);
    }

    $token = JwtAuth::createToken([
        'sub'   => $user['id'],
        'role'  => $user['role'],
        'name'  => $user['full_name'],
        'email' => strtolower($user['email']),
    ]);

    Response::json([
        'id'    => $user['id'],
        'email' => $user['email'],
        'name'  => $user['full_name'],
        'role'  => $user['role'],
        'token' => $token,
    ]);
});

// --- Forgot Password (generate reset token) ---
$router->add('POST', '/api/auth/forgot-password', function () use ($input) {
    $email = trim($input['email'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Valid email is required', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT id, full_name FROM users WHERE email = :email');
    $stmt->execute(['email' => strtolower($email)]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always return success to prevent email enumeration
    if (!$user) {
        Response::json(['message' => 'If that email exists, a reset link has been sent.']);
        return;
    }

    $token = bin2hex(random_bytes(32));

    $db->prepare('UPDATE users SET reset_token = :token, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = :id')
       ->execute(['token' => $token, 'id' => $user['id']]);

    // Send reset email
    $resetUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
              . '://' . ($_SERVER['HTTP_HOST'] ?? 'sodovanphuc.vn')
              . '/reset-password?token=' . $token . '&email=' . urlencode($email);

    // Also try frontend origin from Referer/Origin header
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($origin) {
        $parsed = parse_url($origin);
        $frontendBase = defined('FRONTEND_URL') && FRONTEND_URL
            ? rtrim(FRONTEND_URL, '/')
            : (($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? 'sodovanphuc.vn'));
        if (isset($parsed['port'])) $frontendBase .= ':' . $parsed['port'];
        $resetUrl = $frontendBase . '/reset-password?token=' . $token . '&email=' . urlencode($email);
    }

    $userName = $user['full_name'] ?: 'User';
    $body = "
        <h2>Password Reset Request</h2>
        <p>Hi <strong>{$userName}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style='margin:24px 0;text-align:center'>
            <a href='{$resetUrl}' style='background:#B88717;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block'>Reset My Password</a>
        </p>
        <p style='color:#888;font-size:13px'>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        <p style='color:#888;font-size:13px;margin-top:12px'>Or copy this link: <br><a href='{$resetUrl}' style='color:#B88717;word-break:break-all'>{$resetUrl}</a></p>
    ";
    Mailer::send($email, 'Reset your ' . (defined('APP_NAME') ? APP_NAME : 'So Do Van Phuc') . ' password', $body);

    Response::json(['message' => 'If that email exists, a reset link has been sent.']);
});

// --- Reset Password ---
$router->add('POST', '/api/auth/reset-password', function () use ($input) {
    $token       = trim($input['token'] ?? '');
    $newPassword = $input['password'] ?? $input['new_password'] ?? '';

    if (!$token) {
        Response::error('Reset token is required', 400);
    }
    if (strlen($newPassword) < 6) {
        Response::error('Password must be at least 6 characters', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT id FROM users WHERE reset_token = :token AND reset_token_expires > NOW()');
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::error('Invalid or expired reset token', 400);
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password_hash = :hash, reset_token = NULL, reset_token_expires = NULL WHERE id = :id')
       ->execute(['hash' => $hash, 'id' => $user['id']]);

    Response::json(['message' => 'Password has been reset successfully.']);
});

// --- Change Password (authenticated user) ---
$router->add('POST', '/api/auth/change-password', function () use ($input) {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $currentPassword = $input['current_password'] ?? '';
    $newPassword     = $input['new_password'] ?? '';

    if (!$currentPassword) {
        Response::error('Current password is required', 400);
    }
    if (strlen($newPassword) < 6) {
        Response::error('New password must be at least 6 characters', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT id, password_hash FROM users WHERE id = :id');
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        Response::error('Current password is incorrect', 400);
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password_hash = :hash WHERE id = :id')
       ->execute(['hash' => $hash, 'id' => $user['id']]);

    Response::json(['message' => 'Password changed successfully.']);
});

// --- Free Post Status (card verified + posts used) ---
$router->add('GET', '/api/auth/free-post-status', function () {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();

    // Ensure column exists
    try {
        $db->exec("ALTER TABLE users ADD COLUMN card_verified TINYINT(1) NOT NULL DEFAULT 0");
    } catch (\PDOException $e) { /* already exists */ }

    // Get card_verified flag
    $stmt = $db->prepare('SELECT email, card_verified FROM users WHERE id = :id');
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::error('User not found', 404);
    }

    // Count non-VIP properties by this user's email
    $countStmt = $db->prepare("SELECT COUNT(*) FROM properties WHERE LOWER(contact_email) = LOWER(:email) AND (is_vip = 0 OR is_vip IS NULL)");
    $countStmt->execute(['email' => $user['email']]);
    $freePostsUsed = (int) $countStmt->fetchColumn();

    $limit = 10;
    Response::json([
        'card_verified' => (bool) ($user['card_verified'] ?? false),
        'free_posts_used' => $freePostsUsed,
        'free_posts_remaining' => max($limit - $freePostsUsed, 0),
        'free_posts_limit' => $limit,
    ]);
});

// --- Verify Card ---
$router->add('POST', '/api/auth/verify-card', function () {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();

    // Ensure column exists (safe ALTER — ignore if already exists)
    try {
        $db->exec("ALTER TABLE users ADD COLUMN card_verified TINYINT(1) NOT NULL DEFAULT 0");
    } catch (\PDOException $e) {
        // Column already exists — ignore
    }

    $db->prepare('UPDATE users SET card_verified = 1 WHERE id = :id')
       ->execute(['id' => $payload['sub']]);

    Response::json(['card_verified' => true, 'message' => 'Card verified successfully.']);
});

// --- Admin: Reset Card Verified ---
$router->add('POST', '/api/admin/reset-card-verified', function () use ($input) {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    // Check admin role
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT role FROM users WHERE id = :id');
    $stmt->execute(['id' => $payload['sub']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$admin || $admin['role'] !== 'admin') {
        Response::forbidden('Admin access required');
    }

    $email = $input['email'] ?? '';
    if (!$email) {
        Response::error('Email is required', 400);
    }

    $update = $db->prepare('UPDATE users SET card_verified = 0 WHERE LOWER(email) = LOWER(:email)');
    $update->execute(['email' => $email]);

    if ($update->rowCount() === 0) {
        Response::error('User not found', 404);
    }

    Response::json(['message' => "Card verification reset for {$email}"]);
});

// --- Get Current User Profile ---
$router->add('GET', '/api/auth/me', function () {
    $payload = Auth::requireAuth();
    if (!isset($payload['sub'])) {
        Response::unauthorized('Invalid token');
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT id, email, full_name, phone, role, status, avatar_url, created_at FROM users WHERE id = :id');
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Might be admin (not in users table)
        Response::json([
            'id'   => $payload['sub'],
            'role' => $payload['role'] ?? 'admin',
            'name' => $payload['name'] ?? 'Admin',
        ]);
        return;
    }

    Response::json($user);
});

// --- Upload avatar ---
$router->add('POST', '/api/auth/avatar', function () {
    $payload = Auth::requireAuth();
    $userId = $payload['sub'];
    $db = Database::getInstance();

    if (empty($_FILES['avatar'])) {
        Response::error('No avatar file uploaded', 400);
    }

    $avatarUrl = Upload::handleAvatarUpload($_FILES['avatar']);

    // Update user record
    $stmt = $db->prepare('UPDATE users SET avatar_url = :url WHERE id = :id');
    $stmt->execute(['url' => $avatarUrl, 'id' => $userId]);

    Response::json(['avatar_url' => $avatarUrl]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  AUTO-EXPIRE LISTINGS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/admin/expire-listings', function () {
    Auth::requireAdmin();

    $db = Database::getInstance();

    // 1. Auto-expire overdue listings
    $stmt = $db->prepare("UPDATE properties SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()");
    $stmt->execute();
    $expiredCount = $stmt->rowCount();

    // 2. Also send warning emails for listings expiring in next 3 days
    $soon = $db->prepare("
        SELECT p.id, p.address, p.city, p.state, p.expires_at, p.contact_email
        FROM properties p
        WHERE p.status = 'active'
          AND p.expires_at IS NOT NULL
          AND p.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
          AND (p.expiry_notified IS NULL OR p.expiry_notified = 0)
    ");
    $soon->execute();
    $soonExpiring = $soon->fetchAll(PDO::FETCH_ASSOC);

    $notifiedCount = 0;
    foreach ($soonExpiring as $listing) {
        $email = $listing['contact_email'] ?? '';
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;

        $address = trim(($listing['address'] ?? '') . ', ' . ($listing['city'] ?? '') . ', ' . ($listing['state'] ?? ''));
        Mailer::notifyListingExpiring($email, $address, $listing['expires_at']);

        $update = $db->prepare("UPDATE properties SET expiry_notified = 1 WHERE id = :id");
        $update->execute(['id' => $listing['id']]);
        $notifiedCount++;
    }

    Response::json([
        'message' => "{$expiredCount} listing(s) expired. {$notifiedCount} owner(s) notified about upcoming expiry.",
        'expired_count' => $expiredCount,
        'notified_count' => $notifiedCount,
    ]);
});

// Also auto-expire on every public listing query (lightweight)
// This is handled by adding WHERE clause in the GET /api/properties route.

// ═════════════════════════════════════════════════════════════════════════════
//  EXPIRY NOTIFICATIONS — Send email to listing owners whose listings expire soon
// ═════════════════════════════════════════════════════════════════════════════

$router->add('POST', '/api/admin/notify-expiring', function () {
    Auth::requireAdmin();

    $db = Database::getInstance();

    // Find listings expiring within 3 days that haven't been notified yet
    $stmt = $db->prepare("
        SELECT p.id, p.address, p.city, p.state, p.expires_at, p.contact_email
        FROM properties p
        WHERE p.status = 'active'
          AND p.expires_at IS NOT NULL
          AND p.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
          AND (p.expiry_notified IS NULL OR p.expiry_notified = 0)
    ");
    $stmt->execute();
    $expiring = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notifiedCount = 0;
    foreach ($expiring as $listing) {
        $email = $listing['contact_email'] ?? '';
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;

        $address = trim(($listing['address'] ?? '') . ', ' . ($listing['city'] ?? '') . ', ' . ($listing['state'] ?? ''));
        $expiresAt = $listing['expires_at'];

        Mailer::notifyListingExpiring($email, $address, $expiresAt);

        // Mark as notified so we don't send duplicate emails
        $update = $db->prepare("UPDATE properties SET expiry_notified = 1 WHERE id = :id");
        $update->execute(['id' => $listing['id']]);

        $notifiedCount++;
    }

    // Also notify admin
    if ($notifiedCount > 0) {
        Mailer::notifyAdmin(
            "{$notifiedCount} listing(s) expiring soon",
            "<p>{$notifiedCount} listing owner(s) were notified that their listings are expiring within 3 days.</p>"
        );
    }

    Response::json([
        'message' => "{$notifiedCount} owner(s) notified about expiring listings.",
        'notified_count' => $notifiedCount,
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROPERTY LIKES
// ═════════════════════════════════════════════════════════════════════════════

// --- Get like count for a property ---
$router->add('GET', '/api/likes/{propertyId}', function ($params) {
    $db = Database::getInstance();
    $propId = $params['propertyId'];
    
    $stmt = $db->prepare('SELECT likes_count FROM properties WHERE id = :id');
    $stmt->execute(['id' => $propId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        Response::notFound('Property not found');
    }
    
    // Check if current visitor already liked (by fingerprint)
    $fingerprint = $_GET['fp'] ?? '';
    $hasLiked = false;
    if ($fingerprint) {
        $check = $db->prepare('SELECT id FROM property_likes WHERE property_id = :pid AND fingerprint = :fp');
        $check->execute(['pid' => $propId, 'fp' => $fingerprint]);
        $hasLiked = (bool) $check->fetch();
    }
    
    Response::json([
        'likes_count' => (int) ($row['likes_count'] ?? 0),
        'has_liked' => $hasLiked,
    ]);
});

// --- Toggle like on a property ---
$router->add('POST', '/api/likes/{propertyId}', function ($params) use ($input) {
    $db = Database::getInstance();
    $propId = $params['propertyId'];
    $fingerprint = $input['fingerprint'] ?? $input['fp'] ?? '';
    
    if (!$fingerprint) {
        Response::error('Fingerprint is required', 400);
    }
    
    // Check if property exists
    $stmt = $db->prepare('SELECT id, likes_count FROM properties WHERE id = :id');
    $stmt->execute(['id' => $propId]);
    $prop = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$prop) {
        Response::notFound('Property not found');
    }
    
    // Check if already liked
    $check = $db->prepare('SELECT id FROM property_likes WHERE property_id = :pid AND fingerprint = :fp');
    $check->execute(['pid' => $propId, 'fp' => $fingerprint]);
    $existing = $check->fetch();
    $alreadyLiked = (bool) $existing;
    $requestedLiked = null;
    if (array_key_exists('liked', $input)) {
        if (is_bool($input['liked'])) {
            $requestedLiked = $input['liked'];
        } else {
            $parsed = filter_var($input['liked'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($parsed !== null) {
                $requestedLiked = $parsed;
            }
        }
    }
    $shouldLike = $requestedLiked === null ? !$alreadyLiked : $requestedLiked;
    $action = 'unchanged';
    $hasLiked = $alreadyLiked;
    
    if (!$shouldLike && $alreadyLiked) {
        // Unlike
        $db->prepare('DELETE FROM property_likes WHERE property_id = :pid AND fingerprint = :fp')
           ->execute(['pid' => $propId, 'fp' => $fingerprint]);
        $db->prepare('UPDATE properties SET likes_count = GREATEST(0, likes_count - 1) WHERE id = :id')
           ->execute(['id' => $propId]);
        $action = 'unliked';
        $hasLiked = false;
    } elseif ($shouldLike && !$alreadyLiked) {
        // Like
        $db->prepare('INSERT INTO property_likes (property_id, fingerprint) VALUES (:pid, :fp)')
           ->execute(['pid' => $propId, 'fp' => $fingerprint]);
        $db->prepare('UPDATE properties SET likes_count = likes_count + 1 WHERE id = :id')
           ->execute(['id' => $propId]);
        $action = 'liked';
        $hasLiked = true;
    }
    
    // Get updated count
    $stmt = $db->prepare('SELECT likes_count FROM properties WHERE id = :id');
    $stmt->execute(['id' => $propId]);
    $newCount = (int) $stmt->fetchColumn();
    
    Response::json([
        'action' => $action,
        'likes_count' => $newCount,
        'has_liked' => $hasLiked,
    ]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  PLATFORM STATISTICS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/stats', function () {
    $db = Database::getInstance();

    // Properties stats
    $totalListings = (int) $db->query("SELECT COUNT(*) FROM properties")->fetchColumn();
    $activeListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'active'")->fetchColumn();
    $saleListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'active' AND listing_type = 'sale'")->fetchColumn();
    $rentListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'active' AND listing_type = 'rent'")->fetchColumn();
    $expiredListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'expired'")->fetchColumn();
    $pendingListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'pending'")->fetchColumn();
    $vipListings = (int) $db->query("SELECT COUNT(*) FROM properties WHERE status = 'active' AND is_vip = 1")->fetchColumn();

    // Users stats
    $totalUsers = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $activeUsers = (int) $db->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
    $latestUserName = null;
    try {
        $latestUser = $db->query("SELECT full_name, email FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        if (!$latestUser) {
            $latestUser = $db->query("SELECT full_name, email FROM users WHERE status != 'suspended' ORDER BY created_at DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        }
        if (!$latestUser) {
            $latestUser = $db->query("SELECT full_name, email FROM users ORDER BY created_at DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        }
        if ($latestUser) {
            $latestUserName = trim((string) ($latestUser['full_name'] ?? ''));
            if ($latestUserName === '') {
                $latestUserName = preg_replace('/@.*/', '', (string) ($latestUser['email'] ?? ''));
            }
        }
    } catch (\Exception $e) {}

    // Inquiries stats
    $totalInquiries = (int) $db->query("SELECT COUNT(*) FROM inquiries")->fetchColumn();
    $newInquiries = (int) $db->query("SELECT COUNT(*) FROM inquiries WHERE status = 'new'")->fetchColumn();

    // Schedules stats
    $totalSchedules = (int) $db->query("SELECT COUNT(*) FROM schedules")->fetchColumn();
    $pendingSchedules = (int) $db->query("SELECT COUNT(*) FROM schedules WHERE status = 'pending'")->fetchColumn();

    // Reports stats
    $totalReports = (int) $db->query("SELECT COUNT(*) FROM reports")->fetchColumn();
    $pendingReports = (int) $db->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'")->fetchColumn();

    // Messages stats
    $totalMessages = (int) $db->query("SELECT COUNT(*) FROM messages")->fetchColumn();

    // Property types breakdown
    $typeBreakdown = $db->query("SELECT property_type, COUNT(*) as count FROM properties WHERE status = 'active' GROUP BY property_type ORDER BY count DESC")->fetchAll(PDO::FETCH_ASSOC);

    // Recent activity (last 7 days)
    $newListings7d = (int) $db->query("SELECT COUNT(*) FROM properties WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $newUsers7d = (int) $db->query("SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $newInquiries7d = (int) $db->query("SELECT COUNT(*) FROM inquiries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();

    // Likes stats
    $totalLikeRows = (int) $db->query("SELECT COUNT(*) FROM property_likes")->fetchColumn();
    $totalPropertyLikes = 0;
    try { $totalPropertyLikes = (int) $db->query("SELECT COALESCE(SUM(likes_count), 0) FROM properties")->fetchColumn(); } catch (\Exception $e) {}
    $totalLikes = max($totalLikeRows, $totalPropertyLikes);

    // Price stats (active only)
    $priceStats = $db->query("SELECT AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price FROM properties WHERE status = 'active' AND price > 0")->fetch(PDO::FETCH_ASSOC);

    // City breakdown (top 5)
    $cityBreakdown = $db->query("SELECT city, state, COUNT(*) as count FROM properties WHERE status = 'active' AND city != '' GROUP BY city, state ORDER BY count DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    // Latest listings (last 5)
    $latestListings = $db->query("SELECT id, title, city, state, price, listing_type, property_type, created_at, main_image FROM properties WHERE status = 'active' ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    // Blog posts count
    $totalBlogPosts = 0;
    try { $totalBlogPosts = (int) $db->query("SELECT COUNT(*) FROM blog_posts")->fetchColumn(); } catch (\Exception $e) {}

    // Banners count
    $totalBanners = 0;
    try { $totalBanners = (int) $db->query("SELECT COUNT(*) FROM banners WHERE is_active = 1")->fetchColumn(); } catch (\Exception $e) {}

    // Today's new listings
    $newListingsToday = (int) $db->query("SELECT COUNT(*) FROM properties WHERE DATE(created_at) = CURDATE()")->fetchColumn();
    $newInquiriesToday = (int) $db->query("SELECT COUNT(*) FROM inquiries WHERE DATE(created_at) = CURDATE()")->fetchColumn();

    Response::json([
        'listings' => [
            'total' => $totalListings,
            'active' => $activeListings,
            'sale' => $saleListings,
            'rent' => $rentListings,
            'expired' => $expiredListings,
            'pending' => $pendingListings,
            'vip' => $vipListings,
        ],
        'users' => [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'latestName' => $latestUserName,
        ],
        'inquiries' => [
            'total' => $totalInquiries,
            'new' => $newInquiries,
        ],
        'schedules' => [
            'total' => $totalSchedules,
            'pending' => $pendingSchedules,
        ],
        'reports' => [
            'total' => $totalReports,
            'pending' => $pendingReports,
        ],
        'messages' => [
            'total' => $totalMessages,
        ],
        'likes' => [
            'total' => $totalLikes,
        ],
        'prices' => [
            'avg' => round((float) ($priceStats['avg_price'] ?? 0)),
            'min' => (int) ($priceStats['min_price'] ?? 0),
            'max' => (int) ($priceStats['max_price'] ?? 0),
        ],
        'propertyTypes' => $typeBreakdown,
        'cityBreakdown' => $cityBreakdown,
        'latestListings' => $latestListings,
        'blogPosts' => $totalBlogPosts,
        'banners' => $totalBanners,
        'recent7days' => [
            'newListings' => $newListings7d,
            'newUsers' => $newUsers7d,
            'newInquiries' => $newInquiries7d,
        ],
        'today' => [
            'newListings' => $newListingsToday,
            'newInquiries' => $newInquiriesToday,
        ],
    ]);
});
//  BANNERS CRUD (Admin)
// ═════════════════════════════════════════════════════════════════════════════

// --- List banners (public: active only; admin: all) ---
$router->add('GET', '/api/banners', function () {
    $db = Database::getInstance();
    $isAdmin = false;
    $isAdmin = Auth::isAdmin();

    if ($isAdmin) {
        $stmt = $db->query('SELECT * FROM banners ORDER BY sort_order ASC, id DESC');
    } else {
        $stmt = $db->query("SELECT * FROM banners WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) ORDER BY sort_order ASC, id DESC");
    }
    $banners = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json(['banners' => $banners]);
});

// --- Create banner (admin) ---
$router->add('POST', '/api/banners', function () use ($input) {
    Auth::requireAdmin();

    $title    = trim($input['title'] ?? '');
    $imageUrl = trim($input['image_url'] ?? $input['imageUrl'] ?? '');
    $linkUrl  = trim($input['link_url'] ?? $input['linkUrl'] ?? '') ?: null;
    $position = $input['position'] ?? 'hero';
    $sortOrder = (int) ($input['sort_order'] ?? $input['sortOrder'] ?? 0);
    $isActive  = isset($input['is_active']) ? (int) $input['is_active'] : 1;
    $startsAt  = $input['starts_at'] ?? $input['startsAt'] ?? null;
    $endsAt    = $input['ends_at'] ?? $input['endsAt'] ?? null;

    if (!$imageUrl) {
        Response::error('image_url is required', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('INSERT INTO banners (title, image_url, link_url, position, sort_order, is_active, starts_at, ends_at) VALUES (:title, :image_url, :link_url, :position, :sort_order, :is_active, :starts_at, :ends_at)');
    $stmt->execute([
        'title'      => $title,
        'image_url'  => $imageUrl,
        'link_url'   => $linkUrl,
        'position'   => $position,
        'sort_order' => $sortOrder,
        'is_active'  => $isActive,
        'starts_at'  => $startsAt,
        'ends_at'    => $endsAt,
    ]);

    $id = (int) $db->lastInsertId();
    Response::json(['id' => $id, 'message' => 'Banner created'], 201);
});

// --- Update banner (admin) ---
$router->add('PUT', '/api/banners/{id}', function ($params) use ($input) {
    Auth::requireAdmin();
    $id = (int) $params['id'];

    $db = Database::getInstance();
    $existing = $db->prepare('SELECT id FROM banners WHERE id = :id');
    $existing->execute(['id' => $id]);
    if (!$existing->fetch()) {
        Response::notFound('Banner not found');
    }

    $fields = [];
    $values = ['id' => $id];
    $map = [
        'title' => 'title', 'image_url' => 'image_url', 'imageUrl' => 'image_url',
        'link_url' => 'link_url', 'linkUrl' => 'link_url',
        'position' => 'position', 'sort_order' => 'sort_order', 'sortOrder' => 'sort_order',
        'is_active' => 'is_active', 'isActive' => 'is_active',
        'starts_at' => 'starts_at', 'startsAt' => 'starts_at',
        'ends_at' => 'ends_at', 'endsAt' => 'ends_at',
    ];

    foreach ($map as $inputKey => $dbCol) {
        if (array_key_exists($inputKey, $input)) {
            $fields[$dbCol] = $input[$inputKey];
            $values[$dbCol] = $input[$inputKey];
        }
    }

    if (empty($fields)) {
        Response::error('No fields to update', 400);
    }

    $setParts = [];
    foreach ($fields as $col => $_) {
        $setParts[] = "`{$col}` = :{$col}";
    }
    $sql = 'UPDATE banners SET ' . implode(', ', $setParts) . ' WHERE id = :id';
    $db->prepare($sql)->execute($values);

    Response::json(['message' => 'Banner updated']);
});

// --- Delete banner (admin) ---
$router->add('DELETE', '/api/banners/{id}', function ($params) {
    Auth::requireAdmin();
    $id = (int) $params['id'];

    $db = Database::getInstance();
    $stmt = $db->prepare('DELETE FROM banners WHERE id = :id');
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        Response::notFound('Banner not found');
    }

    Response::json(['message' => 'Banner deleted']);
});

// ═════════════════════════════════════════════════════════════════════════════
//  BLOG POSTS CRUD
// ═════════════════════════════════════════════════════════════════════════════

// --- List blog posts (public: published only; admin: all) ---
$router->add('GET', '/api/blog', function () {
    $db = Database::getInstance();
    $isAdmin = false;
    $isAdmin = Auth::isAdmin();

    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $category = $_GET['category'] ?? null;

    $where = $isAdmin ? '1=1' : "status = 'published'";
    $params = [];

    if ($category) {
        $where .= ' AND category = :category';
        $params['category'] = $category;
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM blog_posts WHERE {$where}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $params['limit']  = $limit;
    $params['offset'] = $offset;
    $stmt = $db->prepare("SELECT id, slug, title, excerpt, cover_image, category, tags, author_name, status, published_at, created_at FROM blog_posts WHERE {$where} ORDER BY published_at DESC, created_at DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $k => $v) {
        if ($k !== 'limit' && $k !== 'offset') {
            $stmt->bindValue(":{$k}", $v);
        }
    }
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json([
        'posts' => $posts,
        'pagination' => [
            'page'       => $page,
            'limit'      => $limit,
            'total'      => $total,
            'totalPages' => (int) ceil($total / $limit),
        ],
    ]);
});

// --- Get single blog post (by slug or id) ---
$router->add('GET', '/api/blog/{slug}', function ($params) {
    $db = Database::getInstance();
    $slug = $params['slug'];

    // Try by slug first, then by id
    $stmt = $db->prepare('SELECT * FROM blog_posts WHERE slug = :slug OR id = :id LIMIT 1');
    $stmt->execute(['slug' => $slug, 'id' => $slug]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        Response::notFound('Blog post not found');
    }

    // If not admin and not published, deny
    $isAdmin = false;
    $isAdmin = Auth::isAdmin();

    if (!$isAdmin && $post['status'] !== 'published') {
        Response::notFound('Blog post not found');
    }

    Response::json($post);
});

// --- Create blog post (admin) ---
$router->add('POST', '/api/blog', function () use ($input) {
    Auth::requireAdmin();

    $title   = trim($input['title'] ?? '');
    $slug    = trim($input['slug'] ?? '');
    $content = $input['content'] ?? '';
    $excerpt = trim($input['excerpt'] ?? '') ?: null;
    $coverImage = trim($input['cover_image'] ?? $input['coverImage'] ?? '') ?: null;
    $category   = trim($input['category'] ?? 'news');
    $tags       = trim($input['tags'] ?? '') ?: null;
    $authorName = trim($input['author_name'] ?? $input['authorName'] ?? (defined('APP_NAME') ? APP_NAME : 'So Do Van Phuc'));
    $status     = $input['status'] ?? 'draft';

    if (!$title) {
        Response::error('Title is required', 400);
    }
    if (!$content) {
        Response::error('Content is required', 400);
    }

    // Auto-generate slug if not provided
    if (!$slug) {
        $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($title));
        $slug = trim($slug, '-');
        $slug .= '-' . substr(bin2hex(random_bytes(4)), 0, 8);
    }

    $publishedAt = ($status === 'published') ? date('Y-m-d H:i:s') : null;

    $db = Database::getInstance();
    $stmt = $db->prepare('INSERT INTO blog_posts (slug, title, excerpt, content, cover_image, category, tags, author_name, status, published_at) VALUES (:slug, :title, :excerpt, :content, :cover_image, :category, :tags, :author_name, :status, :published_at)');
    $stmt->execute([
        'slug'         => $slug,
        'title'        => $title,
        'excerpt'      => $excerpt,
        'content'      => $content,
        'cover_image'  => $coverImage,
        'category'     => $category,
        'tags'         => $tags,
        'author_name'  => $authorName,
        'status'       => $status,
        'published_at' => $publishedAt,
    ]);

    $id = (int) $db->lastInsertId();
    Response::json(['id' => $id, 'slug' => $slug, 'message' => 'Blog post created'], 201);
});

// --- Update blog post (admin) ---
$router->add('PUT', '/api/blog/{id}', function ($params) use ($input) {
    Auth::requireAdmin();
    $id = $params['id'];

    $db = Database::getInstance();
    $existing = $db->prepare('SELECT * FROM blog_posts WHERE id = :id OR slug = :slug LIMIT 1');
    $existing->execute(['id' => $id, 'slug' => $id]);
    $post = $existing->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        Response::notFound('Blog post not found');
    }

    $fields = [];
    $values = ['id' => $post['id']];
    $allowed = ['title', 'slug', 'excerpt', 'content', 'cover_image', 'coverImage',
                'category', 'tags', 'author_name', 'authorName', 'status'];

    $colMap = ['coverImage' => 'cover_image', 'authorName' => 'author_name'];

    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            $dbCol = $colMap[$key] ?? $key;
            $fields[$dbCol] = $input[$key];
            $values[$dbCol] = $input[$key];
        }
    }

    // Auto-set published_at when publishing
    if (isset($input['status']) && $input['status'] === 'published' && $post['status'] !== 'published') {
        $fields['published_at'] = date('Y-m-d H:i:s');
        $values['published_at'] = date('Y-m-d H:i:s');
    }

    if (empty($fields)) {
        Response::error('No fields to update', 400);
    }

    $setParts = [];
    foreach ($fields as $col => $_) {
        $setParts[] = "`{$col}` = :{$col}";
    }
    $sql = 'UPDATE blog_posts SET ' . implode(', ', $setParts) . ' WHERE id = :id';
    $db->prepare($sql)->execute($values);

    Response::json(['message' => 'Blog post updated']);
});

// --- Delete blog post (admin) ---
$router->add('DELETE', '/api/blog/{id}', function ($params) {
    Auth::requireAdmin();
    $id = $params['id'];

    $db = Database::getInstance();
    $stmt = $db->prepare('DELETE FROM blog_posts WHERE id = :id OR slug = :slug');
    $stmt->execute(['id' => $id, 'slug' => $id]);

    if ($stmt->rowCount() === 0) {
        Response::notFound('Blog post not found');
    }

    Response::json(['message' => 'Blog post deleted']);
});

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN: LIST USERS
// ═════════════════════════════════════════════════════════════════════════════

$router->add('GET', '/api/users', function () {
    Auth::requireAdmin();

    $db = Database::getInstance();
    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $total = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $stmt = $db->prepare('SELECT id, email, full_name, phone, role, status, created_at FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json([
        'users' => $users,
        'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)],
    ]);
});

// --- Update user status (admin) ---
$router->add('PATCH', '/api/users/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();
    $id = $params['id'];
    $status = $input['status'] ?? '';

    if (!in_array($status, ['active', 'suspended', 'unverified'], true)) {
        Response::error('Invalid status. Use: active, suspended, unverified', 400);
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('UPDATE users SET status = :status WHERE id = :id');
    $stmt->execute(['status' => $status, 'id' => $id]);

    if ($stmt->rowCount() === 0) {
        Response::notFound('User not found');
    }

    Response::json(['message' => "User status updated to {$status}"]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT / MESSAGES
// ═════════════════════════════════════════════════════════════════════════════

// --- List conversations for current user ---
$router->add('GET', '/api/messages', function () {
    $payload = Auth::requireAuth();
    $userId = $payload['sub'];
    $db = Database::getInstance();

    $stmt = $db->prepare("
        SELECT m.conversation_id,
               MAX(m.created_at) as last_message_at,
               SUM(CASE WHEN m.is_read = 0 AND m.recipient_id = :uid THEN 1 ELSE 0 END) as unread_count,
               MAX(m.property_id) as property_id
        FROM messages m
        WHERE m.sender_id = :uid2 OR m.recipient_id = :uid3
        GROUP BY m.conversation_id
        ORDER BY last_message_at DESC
    ");
    $stmt->execute(['uid' => $userId, 'uid2' => $userId, 'uid3' => $userId]);
    $conversations = $stmt->fetchAll();

    foreach ($conversations as &$conv) {
        $parts = explode('_', $conv['conversation_id']);
        $otherIds = array_filter($parts, fn($p) => $p !== $userId && strpos($p, 'user-') === 0);
        $otherId = reset($otherIds) ?: '';
        if ($otherId) {
            $u = $db->prepare('SELECT id, full_name, avatar_url FROM users WHERE id = :id');
            $u->execute(['id' => $otherId]);
            $conv['other_user'] = $u->fetch() ?: null;
        }
    }

    Response::json(['conversations' => $conversations]);
});

// --- Get messages in a conversation ---
$router->add('GET', '/api/messages/{conversationId}', function ($params) {
    $payload = Auth::requireAuth();
    $userId = $payload['sub'];
    $convId = $params['conversationId'];
    $db = Database::getInstance();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    // Mark messages as read
    $db->prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = :cid AND recipient_id = :uid AND is_read = 0')
       ->execute(['cid' => $convId, 'uid' => $userId]);

    $stmt = $db->prepare('SELECT * FROM messages WHERE conversation_id = :cid ORDER BY created_at ASC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':cid', $convId);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    Response::json(['messages' => $stmt->fetchAll()]);
});

// --- Send a message ---
$router->add('POST', '/api/messages', function () use ($input) {
    $payload = Auth::requireAuth();
    $senderId = $payload['sub'];
    $senderName = $payload['name'] ?? '';
    $db = Database::getInstance();

    $recipientId = $input['recipient_id'] ?? $input['recipientId'] ?? '';
    $propertyId  = $input['property_id'] ?? $input['propertyId'] ?? null;
    $body        = trim($input['body'] ?? $input['message'] ?? '');

    if (!$recipientId) {
        Response::error('recipient_id is required', 400);
    }
    if (!$body) {
        Response::error('Message body is required', 400);
    }

    // Build deterministic conversation_id from sorted user IDs + property
    $ids = [$senderId, $recipientId];
    sort($ids);
    $convId = implode('_', $ids);
    if ($propertyId) {
        $convId .= '_' . $propertyId;
    }

    $senderEmail = null;
    $u = $db->prepare('SELECT email FROM users WHERE id = :id');
    $u->execute(['id' => $senderId]);
    $row = $u->fetch();
    if ($row) $senderEmail = $row['email'];

    $stmt = $db->prepare('INSERT INTO messages (conversation_id, sender_id, sender_name, sender_email, recipient_id, property_id, body) VALUES (:cid, :sid, :sname, :semail, :rid, :pid, :body)');
    $stmt->execute([
        'cid'    => $convId,
        'sid'    => $senderId,
        'sname'  => $senderName,
        'semail' => $senderEmail,
        'rid'    => $recipientId,
        'pid'    => $propertyId,
        'body'   => $body,
    ]);

    $id = (int) $db->lastInsertId();
    Response::json(['id' => $id, 'conversation_id' => $convId], 201);
});

// --- Get unread count ---
$router->add('GET', '/api/messages/unread/count', function () {
    $payload = Auth::requireAuth();
    $userId = $payload['sub'];
    $db = Database::getInstance();

    $stmt = $db->prepare('SELECT COUNT(*) FROM messages WHERE recipient_id = :uid AND is_read = 0');
    $stmt->execute(['uid' => $userId]);
    $count = (int) $stmt->fetchColumn();

    Response::json(['unread_count' => $count]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  BANK TRANSFERS (SWIFT)
// ═════════════════════════════════════════════════════════════════════════════

// Auto-create table
(function () {
    try {
        $db = Database::getInstance();
        $db->exec("CREATE TABLE IF NOT EXISTS bank_transfers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ref_code VARCHAR(20) NOT NULL UNIQUE,
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            description VARCHAR(500) DEFAULT '',
            purpose ENUM('deposit','pro_listing','verification','other') DEFAULT 'other',
            sender_name VARCHAR(200) DEFAULT '',
            sender_email VARCHAR(200) DEFAULT '',
            user_id INT DEFAULT NULL,
            property_id INT DEFAULT NULL,
            status ENUM('pending','verified','rejected') DEFAULT 'pending',
            admin_note VARCHAR(500) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified_at DATETIME DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {
        error_log('bank_transfers table init: ' . $e->getMessage());
    }
})();

// POST /api/bank-transfers — create a new bank transfer record
$router->add('POST', '/api/bank-transfers', function () use ($input) {
  try {
    $refCode     = trim($input['ref_code'] ?? '');
    $amount      = floatval($input['amount'] ?? 0);
    $currency    = trim($input['currency'] ?? 'USD');
    $description = trim($input['description'] ?? '');
    $purpose     = trim($input['purpose'] ?? 'other');
    $senderName  = trim($input['sender_name'] ?? '');
    $senderEmail = trim($input['sender_email'] ?? '');
    $propertyId  = !empty($input['property_id']) ? intval($input['property_id']) : null;

    if (empty($refCode)) {
        Response::error('Reference code is required', 400);
        return;
    }
    if ($amount <= 0) {
        Response::error('Amount must be positive', 400);
        return;
    }

    $validPurposes = ['deposit', 'pro_listing', 'verification', 'other'];
    if (!in_array($purpose, $validPurposes)) $purpose = 'other';

    // Get user_id from JWT if logged in
    $userId = null;
    try {
        $auth = JwtAuth::fromHeader();
        if ($auth && !empty($auth['user_id'])) {
            $userId = intval($auth['user_id']);
        }
    } catch (\Throwable $e) { /* not logged in, ok */ }

    $db = Database::getInstance();

    // Check duplicate ref_code
    $existing = $db->prepare('SELECT id FROM bank_transfers WHERE ref_code = :rc');
    $existing->execute(['rc' => $refCode]);
    if ($existing->fetch()) {
        Response::error('Duplicate reference code', 409);
        return;
    }

    try {
        $stmt = $db->prepare('INSERT INTO bank_transfers 
            (ref_code, amount, currency, description, purpose, sender_name, sender_email, user_id, property_id, status) 
            VALUES (:rc, :amt, :cur, :dsc, :purp, :sn, :se, :uid, :pid, :st)');
        $stmt->execute([
            'rc'   => $refCode,
            'amt'  => $amount,
            'cur'  => $currency,
            'dsc'  => $description,
            'purp' => $purpose,
            'sn'   => $senderName,
            'se'   => $senderEmail,
            'uid'  => $userId,
            'pid'  => $propertyId,
            'st'   => 'pending',
        ]);
    } catch (\Throwable $e) {
        error_log('bank_transfers INSERT failed: ' . $e->getMessage());
        Response::error('Failed to save transfer: ' . $e->getMessage(), 500);
        return;
    }

    $insertId = intval($db->lastInsertId());

    // ── Email notification to admin (skip for deposit/pro_listing — their own emails cover it) ──
    if (!in_array($purpose, ['deposit', 'pro_listing'], true)) {
        try {
            $purposeLabel = ucfirst(str_replace('_', ' ', $purpose));
            $sn = htmlspecialchars($senderName ?: 'N/A');
            $se = htmlspecialchars($senderEmail ?: 'N/A');
            $rc = htmlspecialchars($refCode);
            $emailBody = "
                <h2>New Bank Transfer Pending</h2>
                <table style='border-collapse:collapse;width:100%'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Reference</td><td style='padding:8px;border-bottom:1px solid #eee'><strong style='font-family:monospace;font-size:16px;color:#B88717'>{$rc}</strong></td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Amount</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>" . number_format($amount, 2) . " {$currency}</strong></td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Purpose</td><td style='padding:8px;border-bottom:1px solid #eee'>{$purposeLabel}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Sender</td><td style='padding:8px;border-bottom:1px solid #eee'>{$sn}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Email</td><td style='padding:8px;border-bottom:1px solid #eee'><a href='mailto:{$se}'>{$se}</a></td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#888'>Description</td><td style='padding:8px;border-bottom:1px solid #eee'>" . htmlspecialchars($description) . "</td></tr>
                </table>
                <p style='margin-top:16px;color:#888;font-size:13px'>Please check your Techcombank account for this transfer and verify it in the admin panel.</p>
                <p style='margin-top:12px'>
                    <a href='" . (defined('FRONTEND_URL') && FRONTEND_URL ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . "/admin' style='background:#B88717;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold'>Go to Admin Panel</a>
                </p>
            ";
            Mailer::notifyAdmin('Bank Transfer: $' . number_format($amount, 2) . ' - ' . $rc, $emailBody);
        } catch (\Throwable $e) {
            error_log('Bank transfer email notification failed: ' . $e->getMessage());
        }
    }

    Response::json([
        'ok'       => true,
        'id'       => $insertId,
        'ref_code' => $refCode,
        'status'   => 'pending',
    ], 201);
  } catch (\Throwable $globalErr) {
    error_log('bank-transfers GLOBAL ERROR: ' . $globalErr->getMessage() . ' in ' . $globalErr->getFile() . ':' . $globalErr->getLine());
    Response::error('Server error: ' . $globalErr->getMessage(), 500);
  }
});

// GET /api/bank-transfers — admin: list all bank transfers
$router->add('GET', '/api/bank-transfers', function () {
    Auth::requireAdmin();
    $db = Database::getInstance();

    $status = $_GET['status'] ?? '';
    $where = '';
    $params = [];
    if (in_array($status, ['pending', 'verified', 'rejected'])) {
        $where = 'WHERE bt.status = :st';
        $params['st'] = $status;
    }

    $rows = $db->prepare("
        SELECT bt.*, u.full_name as user_name, u.email as user_email
        FROM bank_transfers bt
        LEFT JOIN users u ON bt.user_id = u.id
        $where
        ORDER BY bt.created_at DESC
        LIMIT 200
    ");
    $rows->execute($params);

    Response::json(['ok' => true, 'transfers' => $rows->fetchAll(PDO::FETCH_ASSOC)]);
});

// PATCH /api/bank-transfers/{id}/status — admin: verify or reject
$router->add('PATCH', '/api/bank-transfers/{id}/status', function ($params) use ($input) {
    Auth::requireAdmin();

    $id        = intval($params['id']);
    $newStatus = trim($input['status'] ?? '');
    $adminNote = trim($input['admin_note'] ?? '');

    if (!in_array($newStatus, ['verified', 'rejected', 'pending'])) {
        Response::error('Invalid status', 400);
        return;
    }

    $db = Database::getInstance();

    $verifiedAt = ($newStatus === 'verified') ? date('Y-m-d H:i:s') : null;

    $stmt = $db->prepare('UPDATE bank_transfers SET status = :st, admin_note = :note, verified_at = :va WHERE id = :id');
    $stmt->execute([
        'st'   => $newStatus,
        'note' => $adminNote,
        'va'   => $verifiedAt,
        'id'   => $id,
    ]);

    if ($stmt->rowCount() === 0) {
        Response::error('Transfer not found', 404);
        return;
    }

    Response::json(['ok' => true, 'status' => $newStatus]);
});

// ═════════════════════════════════════════════════════════════════════════════
//  DISPATCH
// ═════════════════════════════════════════════════════════════════════════════
//  MUSIC — list available background tracks
// ═════════════════════════════════════════════════════════════════════════════

require_once __DIR__ . '/svp-routes.php';
require_once __DIR__ . '/svp-auth-v1-routes.php';
require_once __DIR__ . '/svp-auth-routes.php';

$router->add('GET', '/api/music', function () {
    $musicDir = __DIR__ . '/../uploads/music';
    $tracks = [];

    if (is_dir($musicDir)) {
        $allowed = ['mp3', 'ogg', 'wav', 'm4a', 'aac'];
        $files = scandir($musicDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, $allowed)) {
                $tracks[] = [
                    'name' => pathinfo($file, PATHINFO_FILENAME),
                    'url'  => defined('BASE_URL') ? BASE_URL . '/uploads/music/' . rawurlencode($file) : '/uploads/music/' . rawurlencode($file),
                ];
            }
        }
    }

    if (!empty($tracks)) {
        shuffle($tracks);
    }

    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    Response::json(['tracks' => $tracks, 'total' => count($tracks)]);
});

// ═════════════════════════════════════════════════════════════════════════════

try {
    $router->dispatch();
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    Response::error('Database error occurred', 500);
} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    Response::error('Internal server error', 500);
}
