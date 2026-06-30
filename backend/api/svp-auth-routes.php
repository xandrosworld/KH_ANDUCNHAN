<?php
/**
 * Sổ Đỏ Vạn Phúc - Auth & Admin Routes
 * Included by index.php after svp-routes.php
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function svp_auth_payload(): ?array {
    $token = Auth::extractToken();
    if (!$token) return null;
    return JwtAuth::verifyToken($token);
}

function svp_auth_require(): array {
    $payload = svp_auth_payload();
    if (!$payload) Response::error('Phiên đăng nhập hết hạn', 401);
    return $payload;
}

function svp_require_role(string ...$slugs): array {
    $payload = svp_auth_require();
    $roles = $payload['roles'] ?? [];
    foreach ($roles as $r) {
        if (in_array($r['slug'] ?? '', $slugs) && ($r['status'] ?? '') === 'approved') {
            return $payload;
        }
    }
    Response::error('Bạn không có quyền truy cập', 403);
    return $payload; // unreachable
}

function svp_management_role_slugs(): array {
    return [
        'admin',
        'giam_doc_dieu_hanh',
        'pho_giam_doc_dieu_hanh',
        'giam_doc',
        'pho_giam_doc_khu_vuc',
        'giam_doc_khoi',
        'pho_giam_doc_khoi',
        'truong_phong',
        'pho_phong',
        'tro_ly',
        'thu_ky',
    ];
}

function svp_require_management_role(): array {
    return svp_require_role(...svp_management_role_slugs());
}

function svp_generate_svp_id(PDO $db): string {
    $stmt = $db->query("SELECT COUNT(*) as c FROM users WHERE svp_id IS NOT NULL AND svp_id != ''");
    $count = (int) ($stmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
    return 'SVP' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
}

function svp_generate_referral_code(string $svpId): string {
    $digits = preg_replace('/\D+/', '', $svpId) ?: '0';
    return 'SVP' . str_pad(substr($digits, -6), 6, '0', STR_PAD_LEFT) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
}

function svp_public_role_slugs(): array {
    return ['khach_mua', 'chu_nha', 'nguoi_gioi_thieu', 'ctv_khach', 'ctv_nguon', 'doi_tac'];
}

function svp_role_requires_approval(string $roleSlug): bool {
    try {
        return svp_role_requires_approval_from_config(Database::getInstance(), $roleSlug);
    } catch (Throwable $e) {
        error_log('[SVP_ROLE_APPROVAL] ' . $e->getMessage());
    }
    return !in_array($roleSlug, svp_public_role_slugs(), true);
}

function svp_role_name(string $roleSlug): string {
    $names = [
        'admin' => 'Quản trị',
        'giam_doc' => 'Giám đốc Khu vực',
        'truong_phong' => 'Trưởng phòng',
        'chuyen_gia' => 'Chuyên gia',
        'chuyen_vien' => 'Chuyên viên',
        'ctv_khach' => 'CTV giới thiệu',
        'ctv_nguon' => 'CTV giới thiệu nguồn',
        'chu_nha' => 'Chủ nhà',
        'khach_mua' => 'Khách mua',
        'nguoi_gioi_thieu' => 'Người giới thiệu',
        'doi_tac' => 'Đối tác',
        'tro_ly' => 'Trợ lý',
        'thu_ky' => 'Thư ký',
        'pho_phong' => 'Phó phòng',
        'giam_doc_khoi' => 'Giám đốc Khối',
        'pho_giam_doc_khoi' => 'Phó Giám đốc Khối',
        'pho_giam_doc_khu_vuc' => 'Phó Giám đốc Khu vực',
        'giam_doc_dieu_hanh' => 'Giám đốc Điều hành',
        'pho_giam_doc_dieu_hanh' => 'Phó Giám đốc Điều hành',
    ];
    return $names[$roleSlug] ?? $roleSlug;
}

function svp_normalize_role_slugs(array $input): array {
    $roleSlugs = [];
    if (isset($input['role_slugs']) && is_array($input['role_slugs'])) {
        $roleSlugs = $input['role_slugs'];
    } elseif (isset($input['roleSlugs']) && is_array($input['roleSlugs'])) {
        $roleSlugs = $input['roleSlugs'];
    } else {
        $single = trim((string) ($input['roleSlug'] ?? $input['role_slug'] ?? ''));
        if ($single !== '') $roleSlugs = [$single];
    }

    $clean = [];
    foreach ($roleSlugs as $roleSlug) {
        $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) $roleSlug)));
        if ($roleSlug !== '' && !in_array($roleSlug, $clean, true)) {
            $clean[] = $roleSlug;
        }
    }
    return $clean;
}

function svp_get_user_roles(PDO $db, string $userId): array {
    $stmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
    $stmt->execute(['uid' => $userId]);
    return array_map(function ($r) {
        return [
            'slug' => $r['role_slug'],
            'name' => svp_role_name($r['role_slug']),
            'status' => $r['status'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function svp_build_user_payload(array $user, array $roles, string $activeRole = ''): array {
    if ($activeRole === '') {
        foreach ($roles as $role) {
            if (($role['status'] ?? '') === 'approved') {
                $activeRole = $role['slug'];
                break;
            }
        }
    }

    return [
        'id' => $user['id'],
        'svpId' => $user['svp_id'] ?? '',
        'email' => $user['email'] ?? '',
        'phone' => $user['phone'] ?? '',
        'fullName' => $user['full_name'] ?? '',
        'avatar' => $user['avatar_url'] ?? '',
        'referralCode' => $user['referral_code'] ?? '',
        'roles' => $roles,
        'activeRole' => $activeRole,
    ];
}

function svp_build_login_response(array $user, array $roles): array {
    $approved = array_values(array_filter($roles, fn($r) => ($r['status'] ?? '') === 'approved'));
    $pending = array_values(array_filter($roles, fn($r) => ($r['status'] ?? '') === 'pending'));
    $activeRole = $approved[0]['slug'] ?? '';
    $userPayload = svp_build_user_payload($user, $roles, $activeRole);

    if (empty($approved)) {
        return [
            'hasApprovedRole' => false,
            'payload' => [
                'error' => 'Tài khoản đang chờ phê duyệt',
                'message' => 'Tài khoản đang chờ phê duyệt',
                'user' => $userPayload,
                'pendingRoles' => $pending,
                'requiresApproval' => true,
                'accountStatus' => 'cho_phe_duyet',
            ],
        ];
    }

    $token = JwtAuth::createToken([
        'sub' => $user['id'],
        'email' => $user['email'],
        'fullName' => $user['full_name'],
        'roles' => $roles,
        'role' => $activeRole,
    ]);

    return [
        'hasApprovedRole' => true,
        'payload' => [
            'token' => $token,
            'user' => $userPayload,
            'approvedRoles' => $approved,
            'pendingRoles' => $pending,
            'requiresApproval' => !empty($pending),
            'accountStatus' => !empty($pending) ? 'duoc_dung_ngay_va_cho_duyet' : 'duoc_dung_ngay',
        ],
    ];
}

function svp_strip_property_sensitive_fields(array $property, bool $hideExactLocation = false, bool $hideLegalIdentifiers = false): array {
    $sensitive = [
        'ownerName',
        'ownerPhone',
        'commission',
        'commissionNote',
        'internalNote',
        'contractMedia',
        'owner_name',
        'owner_phone',
        'internal_note',
        'hiddenAddress',
        'hidden_address',
    ];

    foreach ($sensitive as $key) unset($property[$key]);

    $extra = is_array($property['extra'] ?? null) ? $property['extra'] : [];
    foreach (['ownerCccd', 'ownerNote', 'commission', 'commissionNote', 'internalNote'] as $key) unset($extra[$key]);

    if ($hideLegalIdentifiers) {
        foreach (['bookSerial', 'book_serial'] as $key) unset($property[$key]);
        foreach (['bookSerial', 'bookSheet', 'bookParcel'] as $key) unset($extra[$key]);
    }

    if ($hideExactLocation) {
        foreach (['address', 'street', 'gps_lat', 'gps_lng'] as $key) unset($property[$key]);
        unset($extra['gpsCoordinates']);
    }

    $property['extra'] = $extra;
    return $property;
}

function svp_filter_property_by_role(array $property, ?string $activeRole, ?string $userId): array {
    $full = function_exists('svp_management_role_slugs') ? svp_management_role_slugs() : ['admin', 'giam_doc', 'truong_phong'];
    if (in_array($activeRole, $full)) return $property;

    if (!$activeRole) {
        $status = $property['status_id'] ?? $property['statusId'] ?? '';
        if (!in_array($status, ['active', 'st_active'], true)) return [];
        return svp_strip_property_sensitive_fields($property, true, true);
    }

    if ($activeRole === 'chuyen_gia') {
        if (($property['created_by'] ?? $property['createdBy'] ?? '') === $userId) return $property;
        return svp_strip_property_sensitive_fields($property);
    }

    if (in_array($activeRole, ['chuyen_vien', 'ctv_khach'])) {
        return svp_strip_property_sensitive_fields($property);
    }

    if ($activeRole === 'ctv_nguon') {
        return array_intersect_key($property, array_flip(['id', 'code', 'address', 'bookSerial', 'book_serial', 'district', 'ward']));
    }

    if ($activeRole === 'chu_nha') {
        if (($property['created_by'] ?? $property['createdBy'] ?? '') !== $userId) return [];
        return $property;
    }

    if ($activeRole === 'khach_mua') {
        $status = $property['status_id'] ?? $property['statusId'] ?? '';
        if (!in_array($status, ['active', 'st_active'], true)) return [];
        return svp_strip_property_sensitive_fields($property, true, true);
    }

    // nguoi_gioi_thieu, doi_tac - no property access
    return [];
}

function svp_ensure_favorites_table(PDO $db): void {
    $db->exec("
        CREATE TABLE IF NOT EXISTS svp_favorites (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          property_id VARCHAR(64) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_property (user_id, property_id),
          INDEX idx_user_id (user_id),
          INDEX idx_property_id (property_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

$router->add('POST', '/api/svp/auth/register', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $password = trim($input['password'] ?? '');
    $roleSlug = trim($input['roleSlug'] ?? $input['role_slug'] ?? '');
    if ($roleSlug === 'admin') Response::error('Vai trò quản trị cần được cấp bởi quản trị viên hiện hữu', 403);
    $referralCode = trim($input['referralCode'] ?? $input['referral_code'] ?? '');

    if (!$fullName || !$email || !$password || !$roleSlug) {
        Response::error('Vui lòng điền đầy đủ thông tin', 400);
    }

    // Check email exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) Response::error('Email đã được sử dụng', 409);

    $userId = bin2hex(random_bytes(16));
    $svpId = svp_generate_svp_id($db);
    $refCode = svp_generate_referral_code($svpId);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare("INSERT INTO users (id, full_name, email, phone, password_hash, svp_id, referral_code, created_at) VALUES (:id, :fn, :email, :phone, :pw, :svpId, :ref, NOW())");
    $stmt->execute(['id' => $userId, 'fn' => $fullName, 'email' => $email, 'phone' => $phone, 'pw' => $hash, 'svpId' => $svpId, 'ref' => $refCode]);

    // Create role application
    $db->prepare("INSERT INTO svp_role_applications (user_id, role_slug, status, created_at) VALUES (:uid, :role, 'pending', NOW())")->execute(['uid' => $userId, 'role' => $roleSlug]);

    // Create user role (pending)
    $db->prepare("INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at) VALUES (:uid, :role, 'pending', NOW())")->execute(['uid' => $userId, 'role' => $roleSlug]);

    // Handle referral
    if ($referralCode) {
        $stmt = $db->prepare("SELECT id FROM users WHERE referral_code = :code LIMIT 1");
        $stmt->execute(['code' => $referralCode]);
        $referrer = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($referrer) {
            $refId = bin2hex(random_bytes(16));
            $db->prepare("INSERT INTO svp_referrals (id, referrer_user_id, referred_user_id, referral_code, referral_type, status) VALUES (:id, :ruid, :uid, :code, 'other', 'new')")
               ->execute(['id' => $refId, 'ruid' => $referrer['id'], 'uid' => $userId, 'code' => $referralCode]);
            $db->prepare("UPDATE users SET referred_by = :ref WHERE id = :id")->execute(['ref' => $referrer['id'], 'id' => $userId]);
        }
    }

    Response::json([
        'message' => 'Đăng ký thành công, vui lòng chờ duyệt',
        'user' => ['id' => $userId, 'svpId' => $svpId, 'email' => $email, 'fullName' => $fullName],
    ], 201);
});

$router->add('POST', '/api/svp/auth/login', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = trim($input['email'] ?? $input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');

    if (!$email || !$password) Response::error('Vui lòng nhập email/số điện thoại và mật khẩu', 400);

    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email OR phone = :phone LIMIT 1");
    $stmt->execute(['email' => $email, 'phone' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
        Response::error('Email hoặc mật khẩu không đúng', 401);
    }

    // Get all roles
    $stmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid");
    $stmt->execute(['uid' => $user['id']]);
    $roles = array_map(function ($r) {
        return ['slug' => $r['role_slug'], 'status' => $r['status']];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    $approved = array_filter($roles, fn($r) => $r['status'] === 'approved');

    if (empty($approved)) {
        Response::json([
            'error' => 'Tài khoản chưa được duyệt',
            'user' => ['id' => $user['id'], 'email' => $user['email'], 'fullName' => $user['full_name'], 'roles' => $roles],
        ], 403);
        return;
    }

    $activeRole = reset($approved)['slug'];

    $token = JwtAuth::createToken([
        'sub' => $user['id'],
        'email' => $user['email'],
        'fullName' => $user['full_name'],
        'roles' => $roles,
        'role' => $activeRole, // backward compat
    ]);

    Response::json([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'svpId' => $user['svp_id'] ?? '',
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'fullName' => $user['full_name'],
            'avatar' => $user['avatar_url'] ?? '',
            'referralCode' => $user['referral_code'] ?? '',
            'roles' => $roles,
        ],
        'activeRole' => $activeRole,
    ]);
});

$router->add('GET', '/api/svp/auth/me', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::error('Người dùng không tồn tại', 404);

    $stmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid");
    $stmt->execute(['uid' => $user['id']]);
    $roles = array_map(fn($r) => ['slug' => $r['role_slug'], 'status' => $r['status']], $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json([
        'user' => [
            'id' => $user['id'],
            'svpId' => $user['svp_id'] ?? '',
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'fullName' => $user['full_name'],
            'avatar' => $user['avatar_url'] ?? '',
            'referralCode' => $user['referral_code'] ?? '',
            'roles' => $roles,
        ],
    ]);
});

$router->add('POST', '/api/svp/auth/change-password', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :id");
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $currentPassword = (string) ($input['currentPassword'] ?? $input['current_password'] ?? '');
    $newPassword = (string) ($input['newPassword'] ?? $input['new_password'] ?? $input['password'] ?? '');

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        Response::error('Mật khẩu hiện tại không đúng', 400);
    }

    if (strlen($newPassword) < 6) {
        Response::error('Mật khẩu mới cần tối thiểu 6 ký tự', 400);
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $db->prepare("UPDATE users SET password_hash = :pw WHERE id = :id")->execute(['pw' => $hash, 'id' => $payload['sub']]);
    Response::json(['message' => 'Đổi mật khẩu thành công']);
});

$svpAvatarHandler = function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();

    if (empty($_FILES['avatar'])) Response::error('Vui lòng chọn ảnh', 400);

    $url = Upload::handleAvatarUpload($_FILES['avatar']);
    $db->prepare("UPDATE users SET avatar_url = :url WHERE id = :id")->execute(['url' => $url, 'id' => $payload['sub']]);

    Response::json(['avatar' => $url]);
};

$router->add('POST', '/api/svp/auth/avatar', $svpAvatarHandler);
$router->add('POST', '/api/svp/auth/upload-avatar', $svpAvatarHandler);

$router->add('POST', '/api/svp/auth/register-role', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $roleSlug = trim($input['roleSlug'] ?? $input['role_slug'] ?? '');
    $reason = trim($input['reason'] ?? '');

    if (!$roleSlug) Response::error('Vui lòng chọn vai trò', 400);
    if ($roleSlug === 'admin') Response::error('Vai trò quản trị cần được cấp bởi quản trị viên hiện hữu', 403);

    // Check if already has this role
    $stmt = $db->prepare("SELECT id FROM svp_user_roles WHERE user_id = :uid AND role_slug = :role LIMIT 1");
    $stmt->execute(['uid' => $payload['sub'], 'role' => $roleSlug]);
    if ($stmt->fetch()) Response::error('Bạn đã có vai trò này', 409);

    $db->prepare("INSERT INTO svp_role_applications (user_id, role_slug, status, reason, created_at) VALUES (:uid, :role, 'pending', :reason, NOW())")
       ->execute(['uid' => $payload['sub'], 'role' => $roleSlug, 'reason' => $reason]);

    $db->prepare("INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at) VALUES (:uid, :role, 'pending', NOW())")
       ->execute(['uid' => $payload['sub'], 'role' => $roleSlug]);

    Response::json(['message' => 'Đã gửi yêu cầu thêm vai trò']);
});

$router->add('POST', '/api/svp/auth/forgot-password', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = strtolower(trim($input['email'] ?? ''));

    // Always return success to not reveal if email exists
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = $db->prepare("SELECT id, full_name FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::json(['message' => 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu']);
            return;
        }

        $token = bin2hex(random_bytes(32));
        $db->prepare("UPDATE users SET reset_token = :token, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = :id")
           ->execute(['token' => $token, 'id' => $user['id']]);

        $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'sodovanphuc.vn';
        $resetUrl = "{$scheme}://{$host}/reset-password?token={$token}&email=" . urlencode($email);
        $name = htmlspecialchars($user['full_name'] ?: 'anh/chị', ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');
        $body = "
            <h2>Đặt lại mật khẩu Sổ Đỏ Vạn Phúc</h2>
            <p>Xin chào <strong>{$name}</strong>,</p>
            <p>Anh/chị vừa yêu cầu đặt lại mật khẩu. Vui lòng bấm nút bên dưới để tạo mật khẩu mới.</p>
            <p style='margin:24px 0;text-align:center'>
                <a href='{$safeUrl}' style='background:#D32F2F;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block'>Đặt lại mật khẩu</a>
            </p>
            <p style='color:#666;font-size:13px'>Liên kết có hiệu lực trong 1 giờ. Nếu không phải anh/chị yêu cầu, vui lòng bỏ qua email này.</p>
            <p style='color:#666;font-size:13px;word-break:break-all'>Hoặc copy link: <a href='{$safeUrl}'>{$safeUrl}</a></p>
        ";
        Mailer::send($email, 'Đặt lại mật khẩu Sổ Đỏ Vạn Phúc', $body);
    }

    Response::json(['message' => 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu']);
});

$router->add('POST', '/api/svp/auth/reset-password', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $token = trim($input['token'] ?? '');
    $newPassword = trim($input['newPassword'] ?? $input['new_password'] ?? $input['password'] ?? '');

    if (!$token || !$newPassword) Response::error('Thông tin không hợp lệ', 400);

    $stmt = $db->prepare("SELECT id FROM users WHERE reset_token = :token AND reset_token_expires > NOW() LIMIT 1");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) Response::error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $db->prepare("UPDATE users SET password_hash = :pw, reset_token = NULL, reset_token_expires = NULL WHERE id = :id")
       ->execute(['pw' => $hash, 'id' => $user['id']]);

    Response::json(['message' => 'Đặt lại mật khẩu thành công']);
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

$router->add('GET', '/api/svp/admin/role-approval-settings', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    svp_ensure_role_approval_config($db);

    $stmt = $db->prepare(
        "SELECT *
         FROM svp_config_options
         WHERE group_id = 'account_role_approval'
         ORDER BY sort_order ASC, label ASC"
    );
    $stmt->execute();

    $items = array_map(function ($row) {
        $option = svp_option_to_response($row);
        $metadata = $option['metadata'] ?? [];
        return [
            'id' => $option['id'],
            'slug' => $option['value'],
            'label' => $option['label'],
            'roleGroup' => $metadata['roleGroup'] ?? 'Khác',
            'requiresApproval' => (bool) ($metadata['requiresApproval'] ?? true),
            'sortOrder' => $option['sortOrder'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/role-approval-settings/{slug}', function ($params) {
    $payload = svp_require_management_role();
    $db = Database::getInstance();
    svp_ensure_role_approval_config($db);

    $slug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) ($params['slug'] ?? ''))));
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    if ($slug === '' || !array_key_exists('requiresApproval', $input)) {
        Response::error('Thông tin cấu hình không hợp lệ', 400);
    }

    $stmt = $db->prepare(
        "SELECT *
         FROM svp_config_options
         WHERE group_id = 'account_role_approval' AND value = :role
         LIMIT 1"
    );
    $stmt->execute(['role' => $slug]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy loại tài khoản');

    $metadata = svp_json_decode($old['metadata_json'] ?? null, []);
    $metadata['requiresApproval'] = (bool) $input['requiresApproval'];

    $update = $db->prepare(
        "UPDATE svp_config_options
         SET metadata_json = :metadata_json
         WHERE id = :id"
    );
    $update->execute([
        'metadata_json' => svp_json_encode($metadata),
        'id' => $old['id'],
    ]);

    $stmt->execute(['role' => $slug]);
    $next = $stmt->fetch(PDO::FETCH_ASSOC);
    svp_insert_audit($db, $payload['sub'] ?? null, 'update', 'role_approval_setting', $slug, $old, $next);

    $option = svp_option_to_response($next);
    Response::json([
        'item' => [
            'id' => $option['id'],
            'slug' => $option['value'],
            'label' => $option['label'],
            'roleGroup' => $option['metadata']['roleGroup'] ?? 'Khác',
            'requiresApproval' => (bool) ($option['metadata']['requiresApproval'] ?? true),
            'sortOrder' => $option['sortOrder'],
        ],
    ]);
});

function svp_admin_random_password(int $length = 14): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    $password = '';
    $max = strlen($alphabet) - 1;
    for ($i = 0; $i < $length; $i++) {
        $password .= $alphabet[random_int(0, $max)];
    }
    return $password;
}

function svp_admin_ensure_notifications_table(PDO $db): void {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS svp_notifications (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NULL,
            kind VARCHAR(50) NOT NULL DEFAULT 'admin_notice',
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_created (user_id, created_at),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function svp_admin_csv_download(string $filename, array $headers, array $rows): void {
    while (ob_get_level() > 0) ob_end_clean();
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . addcslashes($filename, '"\\') . '"');
    header('Cache-Control: no-store, no-cache');

    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, array_map(fn($value) => is_scalar($value) || $value === null ? (string) $value : svp_json_encode($value), $row));
    }
    fclose($out);
    exit;
}

$router->add('GET', '/api/svp/admin/dashboard', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    $countRows = function (string $table, bool $preferActive = false) use ($db): int {
        $allowed = ['users', 'svp_role_applications', 'svp_properties', 'svp_customers', 'svp_viewing_schedules', 'svp_referrals'];
        if (!in_array($table, $allowed, true)) {
            return 0;
        }
        $where = '';
        if ($preferActive) {
            $column = $db->prepare("
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = :table_name
                  AND column_name = 'deleted_at'
            ");
            $column->execute(['table_name' => $table]);
            if ((int) $column->fetchColumn() > 0) {
                $where = ' WHERE deleted_at IS NULL';
            }
        }
        return (int) $db->query("SELECT COUNT(*) FROM {$table}{$where}")->fetchColumn();
    };

    $totalUsers = $countRows('users');
    $pendingApps = (int) $db->query("SELECT COUNT(*) FROM svp_role_applications WHERE status = 'pending'")->fetchColumn();
    $totalProperties = $countRows('svp_properties', true);
    $totalCustomers = $countRows('svp_customers', true);
    $totalSchedules = $countRows('svp_viewing_schedules');
    $totalReferrals = $countRows('svp_referrals');

    Response::json([
        'totalUsers' => $totalUsers,
        'pendingApplications' => $pendingApps,
        'totalProperties' => $totalProperties,
        'totalCustomers' => $totalCustomers,
        'totalSchedules' => $totalSchedules,
        'totalReferrals' => $totalReferrals,
    ]);
});

$router->add('GET', '/api/svp/admin/role-applications', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    $status = trim($_GET['status'] ?? 'pending');

    $stmt = $db->prepare("
        SELECT ra.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone, u.svp_id
        FROM svp_role_applications ra
        LEFT JOIN users u ON u.id = ra.user_id
        WHERE ra.status = :status
        ORDER BY ra.created_at DESC
    ");
    $stmt->execute(['status' => $status]);
    $items = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'userId' => $r['user_id'],
            'userName' => $r['user_name'],
            'userEmail' => $r['user_email'],
            'userPhone' => $r['user_phone'] ?? '',
            'svpId' => $r['svp_id'] ?? '',
            'roleSlug' => $r['role_slug'],
            'status' => $r['status'],
            'reason' => $r['reason'] ?? '',
            'adminNotes' => $r['admin_notes'] ?? '',
            'createdAt' => $r['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/role-applications/{id}', function ($params) {
    $payload = svp_require_management_role();
    $db = Database::getInstance();
    $id = (int) ($params['id'] ?? 0);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $status = trim($input['status'] ?? '');
    $notes = trim($input['adminNotes'] ?? '');

    if (!in_array($status, ['approved', 'rejected'])) Response::error('Trạng thái không hợp lệ', 400);

    // Update application
    $db->prepare("UPDATE svp_role_applications SET status = :s, admin_notes = :n, reviewed_by = :by, reviewed_at = NOW() WHERE id = :id")
       ->execute(['s' => $status, 'n' => $notes, 'by' => $payload['sub'], 'id' => $id]);

    // Get application to find user_id and role_slug
    $stmt = $db->prepare("SELECT user_id, role_slug FROM svp_role_applications WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($app) {
        $db->prepare("UPDATE svp_user_roles SET status = :s, approved_by = :by, approved_at = NOW() WHERE user_id = :uid AND role_slug = :role")
           ->execute(['s' => $status, 'by' => $payload['sub'], 'uid' => $app['user_id'], 'role' => $app['role_slug']]);

        // Audit
        svp_insert_audit($db, $payload['sub'], $status === 'approved' ? 'approve' : 'reject', 'role_application', (string) $id, null, ['roleSlug' => $app['role_slug'], 'userId' => $app['user_id']]);
    }

    Response::json(['message' => $status === 'approved' ? 'Đã duyệt' : 'Đã từ chối']);
});

$router->add('GET', '/api/svp/admin/users', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);

    $stmt = $db->query("SELECT id, full_name, email, phone, svp_id, avatar_url, referral_code, account_status, created_at FROM users ORDER BY created_at DESC LIMIT 500");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($users as $u) {
        $rStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid");
        $rStmt->execute(['uid' => $u['id']]);
        $roles = array_map(fn($r) => ['slug' => $r['role_slug'], 'status' => $r['status']], $rStmt->fetchAll(PDO::FETCH_ASSOC));

        $result[] = [
            'id' => $u['id'],
            'fullName' => $u['full_name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? '',
            'svpId' => $u['svp_id'] ?? '',
            'avatar' => $u['avatar_url'] ?? '',
            'accountStatus' => $u['account_status'] ?? 'active',
            'roles' => $roles,
            'createdAt' => $u['created_at'],
        ];
    }

    Response::json(['items' => $result, 'total' => count($result)]);
});

$router->add('PATCH', '/api/svp/admin/users/{id}', function ($params) {
    $payload = svp_require_role('admin');
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $fields = [];
    $data = ['id' => $id];
    foreach (['full_name' => 'fullName', 'phone' => 'phone', 'email' => 'email'] as $col => $key) {
        if (isset($input[$key])) {
            $fields[] = "{$col} = :{$col}";
            $data[$col] = trim($input[$key]);
        }
    }

    if (!empty($fields)) {
        $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id")->execute($data);
    }

    // Manage roles if provided
    if (isset($input['addRole'])) {
        $db->prepare("INSERT IGNORE INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_by, approved_at) VALUES (:uid, :role, 'approved', NOW(), :by, NOW())")
           ->execute(['uid' => $id, 'role' => $input['addRole'], 'by' => $payload['sub']]);
    }

    Response::json(['message' => 'Đã cập nhật']);
});

// ─── Property Enhancements ──────────────────────────────────────────────────

$router->add('POST', '/api/svp/admin/users/{id}/account-status', function ($params) {
    $payload = svp_require_role('admin');
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $status = trim((string) ($input['accountStatus'] ?? ''));

    if (!in_array($status, ['active', 'locked'], true)) Response::error('Trang thai tai khoan khong hop le', 400);
    if ($id === ($payload['sub'] ?? '') && $status === 'locked') Response::error('Khong the tu khoa tai khoan quan tri dang dung', 400);

    $stmt = $db->prepare("SELECT id, full_name, email, account_status FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Khong tim thay tai khoan');

    $db->prepare("UPDATE users SET account_status = :status WHERE id = :id")->execute(['status' => $status, 'id' => $id]);

    $stmt->execute(['id' => $id]);
    $next = $stmt->fetch(PDO::FETCH_ASSOC);
    svp_insert_audit($db, $payload['sub'], $status === 'locked' ? 'lock' : 'unlock', 'user', $id, $old, $next);

    Response::json(['message' => $status === 'locked' ? 'Da tam khoa tai khoan' : 'Da mo khoa tai khoan', 'item' => $next]);
});

$router->add('POST', '/api/svp/admin/users/{id}/reset-password', function ($params) {
    $payload = svp_require_role('admin');
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');

    $stmt = $db->prepare("SELECT id, full_name, email, phone FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::notFound('Khong tim thay tai khoan');

    $tempPassword = svp_admin_random_password();
    $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id")
       ->execute(['hash' => password_hash($tempPassword, PASSWORD_DEFAULT), 'id' => $id]);

    svp_insert_audit($db, $payload['sub'], 'reset_password', 'user', $id, null, [
        'userId' => $id,
        'email' => $user['email'] ?? '',
        'temporary' => true,
    ]);

    Response::json([
        'message' => 'Da tao mat khau tam',
        'tempPassword' => $tempPassword,
        'user' => [
            'id' => $user['id'],
            'fullName' => $user['full_name'] ?? '',
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
        ],
    ]);
});

$router->add('GET', '/api/svp/admin/export', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);

    $type = preg_replace('/[^a-z_]/', '', strtolower((string) ($_GET['type'] ?? 'users')));
    $today = date('Ymd-His');

    if ($type === 'users') {
        $stmt = $db->query("
            SELECT u.svp_id, u.full_name, u.phone, u.email, u.account_status, GROUP_CONCAT(CONCAT(r.role_slug, ':', r.status) ORDER BY r.id SEPARATOR '; ') as roles, u.created_at
            FROM users u
            LEFT JOIN svp_user_roles r ON r.user_id = u.id
            GROUP BY u.id, u.svp_id, u.full_name, u.phone, u.email, u.account_status, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 2000
        ");
        svp_admin_csv_download("svp-users-{$today}.csv", ['SVP ID', 'Ho ten', 'Dien thoai', 'Email', 'Trang thai', 'Vai tro', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'properties') {
        $stmt = $db->query("
            SELECT code, title, owner_name, owner_phone, district, ward, price, area_m2, status_id, created_at
            FROM svp_properties
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 3000
        ");
        svp_admin_csv_download("svp-properties-{$today}.csv", ['Ma tin', 'Tieu de', 'Chu nha', 'Dien thoai', 'Quan/Huyen', 'Phuong/Xa', 'Gia', 'Dien tich', 'Trang thai', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'customers') {
        $stmt = $db->query("
            SELECT full_name, phone, email, demand_type, budget_min, budget_max, district, status_id, created_at
            FROM svp_customers
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 3000
        ");
        svp_admin_csv_download("svp-customers-{$today}.csv", ['Ho ten', 'Dien thoai', 'Email', 'Nhu cau', 'Ngan sach tu', 'Ngan sach den', 'Khu vuc', 'Trang thai', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'role_applications') {
        $stmt = $db->query("
            SELECT u.svp_id, u.full_name, u.phone, u.email, ra.role_slug, ra.status, ra.reason, ra.admin_notes, ra.created_at, ra.reviewed_at
            FROM svp_role_applications ra
            LEFT JOIN users u ON u.id = ra.user_id
            ORDER BY ra.created_at DESC
            LIMIT 2000
        ");
        svp_admin_csv_download("svp-role-applications-{$today}.csv", ['SVP ID', 'Ho ten', 'Dien thoai', 'Email', 'Vai tro', 'Trang thai', 'Ly do', 'Ghi chu', 'Ngay gui', 'Ngay duyet'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    Response::error('Loai du lieu xuat khong hop le', 400);
});

$router->add('GET', '/api/svp/admin/notifications', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    svp_admin_ensure_notifications_table($db);

    $stmt = $db->query("SELECT id, user_id, title, body, kind, is_read, created_at FROM svp_notifications ORDER BY created_at DESC LIMIT 50");
    Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('POST', '/api/svp/admin/notifications', function () {
    $payload = svp_require_role('admin');
    $db = Database::getInstance();
    svp_admin_ensure_notifications_table($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $title = trim((string) ($input['title'] ?? ''));
    $body = trim((string) ($input['body'] ?? ''));
    if ($title === '') Response::error('Vui long nhap tieu de thong bao', 400);

    $id = 'notice_' . bin2hex(random_bytes(12));
    $db->prepare("INSERT INTO svp_notifications (id, user_id, title, body, kind, is_read, created_at) VALUES (:id, NULL, :title, :body, 'admin_notice', 0, NOW())")
       ->execute(['id' => $id, 'title' => $title, 'body' => $body]);

    svp_insert_audit($db, $payload['sub'], 'create', 'notification', $id, null, ['title' => $title, 'body' => $body]);

    Response::json([
        'message' => 'Da gui thong bao',
        'item' => ['id' => $id, 'title' => $title, 'body' => $body, 'kind' => 'admin_notice'],
    ]);
});

$router->add('DELETE', '/api/svp/admin/notifications/{id}', function ($params) {
    $payload = svp_require_role('admin');
    $db = Database::getInstance();
    svp_admin_ensure_notifications_table($db);
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('Thong bao khong hop le', 400);

    $db->prepare("DELETE FROM svp_notifications WHERE id = :id")->execute(['id' => $id]);
    svp_insert_audit($db, $payload['sub'], 'delete', 'notification', $id, null, ['deleted' => true]);
    Response::json(['message' => 'Da xoa thong bao']);
});

$router->add('GET', '/api/svp/notifications', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    svp_admin_ensure_notifications_table($db);

    $stmt = $db->prepare("
        SELECT id, title, body, kind, is_read, created_at
        FROM svp_notifications
        WHERE user_id IS NULL OR user_id = :uid
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute(['uid' => $payload['sub']]);
    Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
});

$router->add('POST', '/api/svp/properties/check-duplicate', function () {
    svp_auth_require();
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $address = trim($input['address'] ?? '');
    $bookSerial = trim($input['bookSerial'] ?? '');
    $bookSheet = trim($input['bookSheet'] ?? '');
    $bookParcel = trim($input['bookParcel'] ?? '');
    $ownerPhone = trim($input['ownerPhone'] ?? '');
    $gpsCoordinates = trim($input['gpsCoordinates'] ?? '');

    $conditions = [];
    $params = [];

    if ($address) {
        $conditions[] = "address LIKE :addr";
        $params['addr'] = '%' . $address . '%';
    }
    if ($bookSerial) {
        $conditions[] = "book_serial = :bs";
        $params['bs'] = $bookSerial;
    }
    if ($bookSheet) {
        $conditions[] = "extra_json LIKE :book_sheet";
        $params['book_sheet'] = '%' . $bookSheet . '%';
    }
    if ($bookParcel) {
        $conditions[] = "extra_json LIKE :book_parcel";
        $params['book_parcel'] = '%' . $bookParcel . '%';
    }
    if ($ownerPhone) {
        $conditions[] = "owner_phone = :op";
        $params['op'] = $ownerPhone;
    }
    if ($gpsCoordinates) {
        $conditions[] = "extra_json LIKE :gps";
        $params['gps'] = '%' . $gpsCoordinates . '%';
    }

    if (empty($conditions)) {
        Response::json(['matches' => [], 'total' => 0]);
        return;
    }

    $where = '(' . implode(' OR ', $conditions) . ') AND deleted_at IS NULL';
    $stmt = $db->prepare("SELECT id, code, title, address, district, book_serial, status_id FROM svp_properties WHERE {$where} LIMIT 10");
    $stmt->execute($params);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::json(['matches' => $matches, 'total' => count($matches)]);
});

$router->add('PATCH', '/api/svp/properties/{id}/status', function ($params) {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $statusId = trim($input['statusId'] ?? '');

    if (!$id || !$statusId) Response::error('Thông tin không hợp lệ', 400);

    // Get old status
    $stmt = $db->prepare("SELECT status_id FROM svp_properties WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound();

    $db->prepare("UPDATE svp_properties SET status_id = :s WHERE id = :id")->execute(['s' => $statusId, 'id' => $id]);

    // Timeline
    $tlId = bin2hex(random_bytes(16));
    $db->prepare("INSERT INTO svp_property_timeline (id, property_id, action, actor_id, note, created_at) VALUES (:id, :pid, :action, :actor, :note, NOW())")
       ->execute(['id' => $tlId, 'pid' => $id, 'action' => 'status_change', 'actor' => $payload['sub'], 'note' => "Đổi trạng thái: {$old['status_id']} → {$statusId}"]);

    // Audit
    svp_insert_audit($db, $payload['sub'], 'update', 'property', $id, ['statusId' => $old['status_id']], ['statusId' => $statusId]);

    Response::json(['message' => 'Đã cập nhật trạng thái']);
});

// ─── Favorites ────────────────────────────────────────────────────────────────

$router->add('GET', '/api/svp/favorites', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    svp_ensure_favorites_table($db);

    $stmt = $db->prepare("
        SELECT f.id, f.property_id, f.created_at, p.title, p.price, p.district, p.ward, p.area_m2, p.extra_json
        FROM svp_favorites f
        LEFT JOIN svp_properties p ON p.id = f.property_id
        WHERE f.user_id = :uid
        ORDER BY f.created_at DESC
    ");
    $stmt->execute(['uid' => $payload['sub']]);
    $items = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'propertyId' => $r['property_id'],
            'title' => $r['title'] ?? '',
            'price' => (float) ($r['price'] ?? 0),
            'district' => $r['district'] ?? '',
            'ward' => $r['ward'] ?? '',
            'area' => $r['area_m2'] ?? '',
            'areaM2' => isset($r['area_m2']) ? (float) $r['area_m2'] : null,
            'bedrooms' => (string) (svp_json_decode($r['extra_json'] ?? null, [])['bedrooms'] ?? ''),
            'createdAt' => $r['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json(['items' => $items]);
});

$router->add('POST', '/api/svp/favorites', function () {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    svp_ensure_favorites_table($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $propertyId = trim($input['propertyId'] ?? '');
    if (!$propertyId) Response::error('propertyId is required', 400);

    $db->prepare("INSERT IGNORE INTO svp_favorites (user_id, property_id, created_at) VALUES (:uid, :pid, NOW())")
       ->execute(['uid' => $payload['sub'], 'pid' => $propertyId]);

    Response::json(['message' => 'Đã lưu']);
});

$router->add('DELETE', '/api/svp/favorites/{id}', function ($params) {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    svp_ensure_favorites_table($db);
    $id = (int) ($params['id'] ?? 0);

    $db->prepare("DELETE FROM svp_favorites WHERE id = :id AND user_id = :uid")->execute(['id' => $id, 'uid' => $payload['sub']]);
    Response::json(['message' => 'Đã xóa']);
});
