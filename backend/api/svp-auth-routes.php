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
    foreach ($slugs as $slug) {
        if (svp_payload_has_approved_role($payload, $slug)) return $payload;
    }
    Response::error('Bạn không có quyền truy cập', 403);
    return $payload; // unreachable
}

function svp_payload_has_approved_role(array $payload, string $slug): bool {
    $roles = $payload['roles'] ?? [];
    if (!is_array($roles)) return false;
    foreach ($roles as $role) {
        if (($role['slug'] ?? '') === $slug && ($role['status'] ?? '') === 'approved') {
            return true;
        }
    }
    return false;
}

function svp_is_owner_admin_payload(array $payload): bool {
    return svp_payload_has_approved_role($payload, 'admin_tong');
}

function svp_admin_controlled_role_slugs(): array {
    return ['admin_tong', 'admin'];
}

function svp_is_admin_controlled_role(string $roleSlug): bool {
    return in_array($roleSlug, svp_admin_controlled_role_slugs(), true);
}

function svp_user_has_approved_role(PDO $db, string $userId, string $roleSlug): bool {
    $stmt = $db->prepare(
        "SELECT 1
         FROM svp_user_roles
         WHERE user_id = :uid AND role_slug = :role AND status = 'approved'
         LIMIT 1"
    );
    $stmt->execute(['uid' => $userId, 'role' => $roleSlug]);
    return (bool) $stmt->fetchColumn();
}

function svp_user_has_any_approved_role(PDO $db, string $userId, array $roleSlugs): bool {
    foreach ($roleSlugs as $roleSlug) {
        if (svp_user_has_approved_role($db, $userId, (string) $roleSlug)) return true;
    }
    return false;
}

function svp_owner_admin_count(PDO $db): int {
    $stmt = $db->prepare(
        "SELECT COUNT(DISTINCT user_id)
         FROM svp_user_roles
         WHERE role_slug = 'admin_tong' AND status = 'approved'"
    );
    $stmt->execute();
    return (int) $stmt->fetchColumn();
}

function svp_owner_admin_exists(PDO $db): bool {
    return svp_owner_admin_count($db) > 0;
}

function svp_can_bootstrap_owner_admin(PDO $db, array $payload, string $roleSlug): bool {
    return $roleSlug === 'admin_tong'
        && !svp_owner_admin_exists($db)
        && svp_payload_has_approved_role($payload, 'admin');
}

function svp_assert_can_assign_role(PDO $db, array $payload, string $targetUserId, string $roleSlug): void {
    $targetIsAdminControlled = svp_user_has_any_approved_role($db, $targetUserId, svp_admin_controlled_role_slugs());
    if ($targetIsAdminControlled
        && !svp_is_owner_admin_payload($payload)
        && !svp_can_bootstrap_owner_admin($db, $payload, $roleSlug)) {
        Response::error('Chỉ Admin tổng mới có quyền chỉnh tài khoản quản trị.', 403);
    }

    if (!svp_is_admin_controlled_role($roleSlug)) return;

    if ($roleSlug === 'admin_tong') {
        $targetAlreadyOwner = svp_user_has_approved_role($db, $targetUserId, 'admin_tong');
        if (!$targetAlreadyOwner && svp_owner_admin_exists($db)) {
            Response::error('Hệ thống chỉ dùng một tài khoản Admin tổng cho chủ sở hữu.', 403);
        }
    }

    if (svp_is_owner_admin_payload($payload) || svp_can_bootstrap_owner_admin($db, $payload, $roleSlug)) {
        return;
    }

    Response::error('Chỉ Admin tổng mới có quyền cấp hoặc chỉnh quyền quản trị.', 403);
}

function svp_assert_can_remove_role(PDO $db, array $payload, string $targetUserId, string $roleSlug): void {
    if (svp_user_has_any_approved_role($db, $targetUserId, svp_admin_controlled_role_slugs())
        && !svp_is_owner_admin_payload($payload)) {
        Response::error('Chỉ Admin tổng mới có quyền chỉnh tài khoản quản trị.', 403);
    }

    if (svp_is_admin_controlled_role($roleSlug)) {
        if (!svp_is_owner_admin_payload($payload)) {
            Response::error('Chỉ Admin tổng mới có quyền gỡ quyền quản trị.', 403);
        }
        if ($roleSlug === 'admin_tong') {
            if ($targetUserId === (string) ($payload['sub'] ?? '')) {
                Response::error('Không thể tự gỡ quyền Admin tổng của tài khoản đang dùng.', 400);
            }
            if (svp_user_has_approved_role($db, $targetUserId, 'admin_tong') && svp_owner_admin_count($db) <= 1) {
                Response::error('Không thể gỡ Admin tổng cuối cùng của hệ thống.', 400);
            }
        }
        return;
    }

    if (!svp_payload_has_approved_role($payload, 'admin') && !svp_is_owner_admin_payload($payload)) {
        Response::error('Bạn không có quyền gỡ vai trò của tài khoản này.', 403);
    }
}

function svp_assert_can_manage_admin_target(PDO $db, array $payload, string $targetUserId): void {
    if (!svp_user_has_any_approved_role($db, $targetUserId, svp_admin_controlled_role_slugs())) return;
    if (svp_is_owner_admin_payload($payload)) return;
    Response::error('Chỉ Admin tổng mới có quyền thao tác với tài khoản quản trị.', 403);
}

function svp_management_role_slugs(): array {
    return [
        'admin_tong',
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
    try {
        return svp_role_display_name_from_config(Database::getInstance(), $roleSlug);
    } catch (Throwable $e) {
        error_log('[SVP_ROLE_NAME_CONFIG] ' . $e->getMessage());
    }

    $names = [
        'admin_tong' => 'Admin tổng',
        'admin' => 'Quản trị',
        'giam_doc' => 'Giám đốc Khu vực',
        'truong_phong' => 'Trưởng phòng',
        'chuyen_gia' => 'Chuyên gia',
        'chuyen_vien' => 'Cộng tác viên',
        'hoc_vien' => 'Học viên',
        'ctv_khach' => 'CTV giới thiệu khách',
        'ctv_nguon' => 'CTV giới thiệu nguồn',
        'chu_nha' => 'Chủ nhà',
        'khach_mua' => 'Khách mua',
        'nguoi_gioi_thieu' => 'CTV giới thiệu nhân sự',
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

function svp_visibility_keys_for_role(?string $activeRole): array {
    $map = [
        null => ['vl_dau_khach_duoi_lop4', 'public_buyer'],
        '' => ['vl_dau_khach_duoi_lop4', 'public_buyer'],
        'khach_mua' => ['vl_dau_khach_duoi_lop4', 'public_buyer'],
        'chuyen_vien' => ['vl_lop4', 'specialist_collaborator'],
        'ctv_khach' => ['vl_lop4', 'specialist_collaborator'],
        'ctv_nguon' => ['vl_lop8', 'source_collaborator'],
        'chuyen_gia' => ['vl_tot_nghiep', 'assigned_expert', 'vl_chuyen_gia', 'expert_network'],
        'admin_tong' => ['vl_vinh_danh', 'management_admin'],
        'admin' => ['vl_vinh_danh', 'management_admin'],
        'giam_doc' => ['vl_vinh_danh', 'management_admin'],
        'truong_phong' => ['vl_vinh_danh', 'management_admin'],
    ];
    return $map[$activeRole ?? ''] ?? [];
}

function svp_property_excludes_role(array $property, ?string $activeRole): bool {
    $extra = $property['extra'] ?? [];
    if (is_string($extra)) {
        $extra = json_decode($extra, true) ?: [];
    }
    if (!is_array($extra)) return false;
    $excluded = $extra['excludedVisibilityIds'] ?? [];
    if (!is_array($excluded) || empty($excluded)) return false;
    return count(array_intersect($excluded, svp_visibility_keys_for_role($activeRole))) > 0;
}

function svp_filter_property_by_role(array $property, ?string $activeRole, ?string $userId): array {
    $full = function_exists('svp_management_role_slugs') ? svp_management_role_slugs() : ['admin', 'giam_doc', 'truong_phong'];
    if (in_array($activeRole, $full)) return $property;

    if (svp_property_excludes_role($property, $activeRole)) return [];

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
    if (in_array($roleSlug, svp_admin_controlled_role_slugs(), true)) Response::error('Vai trò quản trị cần được cấp bởi quản trị viên hiện hữu', 403);
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
    if (in_array($roleSlug, svp_admin_controlled_role_slugs(), true)) Response::error('Vai trò quản trị cần được cấp bởi quản trị viên hiện hữu', 403);

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

    $items = array_map('svp_role_setting_from_option', $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/role-approval-settings/{slug}', function ($params) {
    $payload = svp_require_management_role();
    $db = Database::getInstance();
    svp_ensure_role_approval_config($db);

    $slug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) ($params['slug'] ?? ''))));
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    if ($slug === '') {
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

    if (svp_is_admin_controlled_role($slug) && !svp_is_owner_admin_payload($payload)) {
        Response::error('Chỉ Admin tổng mới có quyền chỉnh cấu hình vai trò quản trị.', 403);
    }

    $metadata = svp_json_decode($old['metadata_json'] ?? null, []);
    if (array_key_exists('requiresApproval', $input)) {
        $metadata['requiresApproval'] = (bool) $input['requiresApproval'];
    }
    if (array_key_exists('description', $input)) {
        $metadata['description'] = trim((string) $input['description']);
    }
    if (array_key_exists('roleGroup', $input)) {
        $metadata['roleGroup'] = trim((string) $input['roleGroup']) ?: ($metadata['roleGroup'] ?? 'Khác');
    }

    $label = array_key_exists('label', $input) ? trim((string) $input['label']) : (string) $old['label'];
    if ($label === '') Response::error('Tên vai trò không được để trống', 400);
    $sortOrder = array_key_exists('sortOrder', $input) ? (int) $input['sortOrder'] : (int) $old['sort_order'];
    $isActive = (int) ($old['is_active'] ?? 1);
    if (array_key_exists('registrationEnabled', $input)) {
        $isActive = svp_is_admin_controlled_role($slug) ? 1 : (int) (bool) $input['registrationEnabled'];
    }

    $update = $db->prepare(
        "UPDATE svp_config_options
         SET label = :label,
             metadata_json = :metadata_json,
             sort_order = :sort_order,
             is_active = :is_active
         WHERE id = :id"
    );
    $update->execute([
        'label' => $label,
        'metadata_json' => svp_json_encode($metadata),
        'sort_order' => $sortOrder,
        'is_active' => $isActive,
        'id' => $old['id'],
    ]);

    $stmt->execute(['role' => $slug]);
    $next = $stmt->fetch(PDO::FETCH_ASSOC);
    svp_insert_audit($db, $payload['sub'] ?? null, 'update', 'role_approval_setting', $slug, $old, $next);

    Response::json(['item' => svp_role_setting_from_option($next)]);
});

$router->add('POST', '/api/svp/admin/role-approval-settings', function () {
    $payload = svp_require_management_role();
    $db = Database::getInstance();
    svp_ensure_role_approval_config($db);

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $label = trim((string) ($input['label'] ?? ''));
    $slug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) ($input['slug'] ?? ''))));
    if ($slug === '' && $label !== '') {
        $base = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $label) ?: $label;
        $slug = preg_replace('/[^a-z0-9_]+/', '_', strtolower(trim($base)));
        $slug = trim($slug, '_');
    }
    if ($label === '' || $slug === '' || svp_is_admin_controlled_role($slug)) {
        Response::error('Tên hoặc mã vai trò không hợp lệ', 400);
    }

    $check = $db->prepare("SELECT id FROM svp_config_options WHERE group_id = 'account_role_approval' AND value = :slug LIMIT 1");
    $check->execute(['slug' => $slug]);
    if ($check->fetch()) Response::error('Mã vai trò đã tồn tại', 409);

    $metadata = [
        'requiresApproval' => array_key_exists('requiresApproval', $input) ? (bool) $input['requiresApproval'] : true,
        'roleGroup' => trim((string) ($input['roleGroup'] ?? 'Khác')) ?: 'Khác',
        'description' => trim((string) ($input['description'] ?? '')),
        'systemRole' => false,
        'customRole' => true,
    ];
    $item = [
        'id' => 'role_approval_' . $slug,
        'group_id' => 'account_role_approval',
        'label' => $label,
        'value' => $slug,
        'score' => null,
        'metadata_json' => svp_json_encode($metadata),
        'sort_order' => (int) ($input['sortOrder'] ?? 500),
        'is_active' => array_key_exists('registrationEnabled', $input) ? (int) (bool) $input['registrationEnabled'] : 1,
    ];

    $insert = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, :group_id, :label, :value, :metadata_json, :sort_order, :is_active)"
    );
    $insert->execute($item);
    svp_insert_audit($db, $payload['sub'] ?? null, 'create', 'role_approval_setting', $slug, null, $item);

    Response::json(['item' => svp_role_setting_from_option($item)], 201);
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
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
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

function svp_admin_excel_cell(mixed $value, string $styleId = ''): string {
    if (!is_scalar($value) && $value !== null) {
        $value = svp_json_encode($value);
    }
    $raw = preg_replace('/[^\x09\x0A\x0D\x20-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u', '', (string) ($value ?? '')) ?? '';
    $text = htmlspecialchars($raw, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $style = $styleId !== '' ? ' ss:StyleID="' . htmlspecialchars($styleId, ENT_QUOTES | ENT_XML1, 'UTF-8') . '"' : '';
    return '<Cell' . $style . '><Data ss:Type="String">' . $text . '</Data></Cell>';
}

function svp_admin_excel_download(string $filename, string $worksheetName, array $headers, array $rows): void {
    while (ob_get_level() > 0) ob_end_clean();
    $safeName = preg_replace('/[^A-Za-z0-9._-]/', '-', $filename) ?: 'so-do-van-phuc.xls';
    $sheet = preg_replace('/[\\\/?*\[\]:]/u', ' ', trim($worksheetName)) ?: 'Danh sach';
    $sheet = mb_substr($sheet, 0, 31);

    header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . addcslashes($safeName, '"\\') . '"');
    header('Cache-Control: no-store, no-cache');

    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<?mso-application progid="Excel.Sheet"?>';
    echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    echo '<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#C40012" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style></Styles>';
    echo '<Worksheet ss:Name="' . htmlspecialchars($sheet, ENT_QUOTES | ENT_XML1, 'UTF-8') . '"><Table>';
    echo '<Row ss:Height="24">';
    foreach ($headers as $header) echo svp_admin_excel_cell($header, 'Header');
    echo '</Row>';
    foreach ($rows as $row) {
        echo '<Row>';
        foreach ($row as $value) echo svp_admin_excel_cell($value);
        echo '</Row>';
    }
    echo '</Table></Worksheet></Workbook>';
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

$router->add('GET', '/api/svp/admin/viewing-schedules', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    $where = ['1 = 1'];
    $params = [];
    $status = trim((string) ($_GET['status'] ?? ''));
    $query = trim((string) ($_GET['q'] ?? ''));

    if ($status !== '' && in_array($status, ['pending', 'confirmed', 'done', 'cancelled'], true)) {
        $where[] = 's.status = :status';
        $params['status'] = $status;
    }
    if ($query !== '') {
        $like = '%' . $query . '%';
        $where[] = '(c.full_name LIKE :q_customer_name OR c.phone LIKE :q_customer_phone OR c.email LIKE :q_customer_email OR p.code LIKE :q_property_code OR p.title LIKE :q_property_title OR u.full_name LIKE :q_creator_name OR s.note LIKE :q_note)';
        $params += [
            'q_customer_name' => $like,
            'q_customer_phone' => $like,
            'q_customer_email' => $like,
            'q_property_code' => $like,
            'q_property_title' => $like,
            'q_creator_name' => $like,
            'q_note' => $like,
        ];
    }

    $stmt = $db->prepare("SELECT
            s.id, s.customer_id, s.property_id, s.scheduled_at, s.status, s.note, s.created_by, s.created_at,
            c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
            p.code AS property_code, p.title AS property_title, p.owner_name AS property_owner_name, p.owner_phone AS property_owner_phone,
            u.full_name AS creator_name, u.svp_id AS creator_svp_id
        FROM svp_viewing_schedules s
        LEFT JOIN svp_customers c ON c.id = s.customer_id
        LEFT JOIN svp_properties p ON p.id = s.property_id
        LEFT JOIN users u ON u.id = s.created_by
        WHERE " . implode(' AND ', $where) . "
        ORDER BY s.scheduled_at DESC, s.created_at DESC
        LIMIT 1000");
    $stmt->execute($params);
    $items = array_map(fn($row) => [
        'id' => (string) $row['id'],
        'customerId' => (string) ($row['customer_id'] ?? ''),
        'customerName' => (string) ($row['customer_name'] ?? ''),
        'customerPhone' => (string) ($row['customer_phone'] ?? ''),
        'customerEmail' => (string) ($row['customer_email'] ?? ''),
        'propertyId' => (string) ($row['property_id'] ?? ''),
        'propertyCode' => (string) ($row['property_code'] ?? ''),
        'propertyTitle' => (string) ($row['property_title'] ?? ''),
        'propertyOwnerName' => (string) ($row['property_owner_name'] ?? ''),
        'propertyOwnerPhone' => (string) ($row['property_owner_phone'] ?? ''),
        'scheduledAt' => (string) ($row['scheduled_at'] ?? ''),
        'status' => (string) ($row['status'] ?? 'pending'),
        'note' => (string) ($row['note'] ?? ''),
        'createdBy' => (string) ($row['created_by'] ?? ''),
        'creatorName' => (string) ($row['creator_name'] ?? ''),
        'creatorSvpId' => (string) ($row['creator_svp_id'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('GET', '/api/svp/admin/referrals', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    $where = ['1 = 1'];
    $params = [];
    $status = trim((string) ($_GET['status'] ?? ''));
    $type = trim((string) ($_GET['type'] ?? ''));
    $query = trim((string) ($_GET['q'] ?? ''));

    if ($status !== '' && in_array($status, ['new', 'activated', 'rejected'], true)) {
        $where[] = 'r.status = :status';
        $params['status'] = $status;
    }
    if ($type !== '' && in_array($type, ['staff', 'owner', 'buyer', 'partner', 'other'], true)) {
        $where[] = 'r.referral_type = :referral_type';
        $params['referral_type'] = $type;
    }
    if ($query !== '') {
        $like = '%' . $query . '%';
        $where[] = '(r.referral_code LIKE :q_code OR ref.full_name LIKE :q_ref_name OR ref.phone LIKE :q_ref_phone OR ref.email LIKE :q_ref_email OR ref.svp_id LIKE :q_ref_svp OR referred.full_name LIKE :q_referred_name OR referred.phone LIKE :q_referred_phone OR referred.email LIKE :q_referred_email OR referred.svp_id LIKE :q_referred_svp)';
        $params += [
            'q_code' => $like,
            'q_ref_name' => $like,
            'q_ref_phone' => $like,
            'q_ref_email' => $like,
            'q_ref_svp' => $like,
            'q_referred_name' => $like,
            'q_referred_phone' => $like,
            'q_referred_email' => $like,
            'q_referred_svp' => $like,
        ];
    }

    $stmt = $db->prepare("SELECT
            r.id, r.referrer_user_id, r.referred_user_id, r.referral_code, r.referral_type, r.status, r.created_at,
            ref.full_name AS referrer_name, ref.phone AS referrer_phone, ref.email AS referrer_email, ref.svp_id AS referrer_svp_id,
            referred.full_name AS referred_name, referred.phone AS referred_phone, referred.email AS referred_email, referred.svp_id AS referred_svp_id
        FROM svp_referrals r
        LEFT JOIN users ref ON ref.id = r.referrer_user_id
        LEFT JOIN users referred ON referred.id = r.referred_user_id
        WHERE " . implode(' AND ', $where) . "
        ORDER BY r.created_at DESC
        LIMIT 2000");
    $stmt->execute($params);
    $items = array_map(fn($row) => [
        'id' => (string) $row['id'],
        'referrerUserId' => (string) ($row['referrer_user_id'] ?? ''),
        'referrerName' => (string) ($row['referrer_name'] ?? ''),
        'referrerPhone' => (string) ($row['referrer_phone'] ?? ''),
        'referrerEmail' => (string) ($row['referrer_email'] ?? ''),
        'referrerSvpId' => (string) ($row['referrer_svp_id'] ?? ''),
        'referredUserId' => (string) ($row['referred_user_id'] ?? ''),
        'referredName' => (string) ($row['referred_name'] ?? ''),
        'referredPhone' => (string) ($row['referred_phone'] ?? ''),
        'referredEmail' => (string) ($row['referred_email'] ?? ''),
        'referredSvpId' => (string) ($row['referred_svp_id'] ?? ''),
        'referralCode' => (string) ($row['referral_code'] ?? ''),
        'referralType' => (string) ($row['referral_type'] ?? 'other'),
        'status' => (string) ($row['status'] ?? 'new'),
        'createdAt' => (string) ($row['created_at'] ?? ''),
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
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

    $permissionStmt = $db->prepare("SELECT user_id, role_slug FROM svp_role_applications WHERE id = :id LIMIT 1");
    $permissionStmt->execute(['id' => $id]);
    $pendingApp = $permissionStmt->fetch(PDO::FETCH_ASSOC);
    if (!$pendingApp) Response::notFound('Không tìm thấy yêu cầu vai trò');
    svp_assert_can_assign_role($db, $payload, (string) $pendingApp['user_id'], (string) $pendingApp['role_slug']);

    // Update application
    $db->prepare("UPDATE svp_role_applications SET status = :s, admin_notes = :n, reviewed_by = :by, reviewed_at = NOW() WHERE id = :id")
       ->execute(['s' => $status, 'n' => $notes, 'by' => $payload['sub'], 'id' => $id]);

    // Get application to find user_id, role_slug and recipient email.
    $stmt = $db->prepare("
        SELECT a.user_id, a.role_slug, u.full_name, u.email
        FROM svp_role_applications a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($app) {
        $db->prepare("UPDATE svp_user_roles SET status = :s, approved_by = :by, approved_at = NOW() WHERE user_id = :uid AND role_slug = :role")
           ->execute(['s' => $status, 'by' => $payload['sub'], 'uid' => $app['user_id'], 'role' => $app['role_slug']]);

        // Audit
        svp_insert_audit($db, $payload['sub'], $status === 'approved' ? 'approve' : 'reject', 'role_application', (string) $id, null, ['roleSlug' => $app['role_slug'], 'userId' => $app['user_id']]);

        if (!empty($app['email'])) {
            $roleLabelRaw = function_exists('svp_v1_role_label') ? svp_v1_role_label((string) $app['role_slug']) : (string) $app['role_slug'];
            $roleLabel = htmlspecialchars($roleLabelRaw, ENT_QUOTES, 'UTF-8');
            $safeName = htmlspecialchars((string) ($app['full_name'] ?: 'anh/chị'), ENT_QUOTES, 'UTF-8');
            $safeNotes = htmlspecialchars($notes, ENT_QUOTES, 'UTF-8');
            $loginUrl = htmlspecialchars((defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . '/login', ENT_QUOTES, 'UTF-8');
            $subject = $status === 'approved'
                ? 'Vai trò đã được duyệt trên Sổ Đỏ Vạn Phúc'
                : 'Yêu cầu vai trò chưa được duyệt trên Sổ Đỏ Vạn Phúc';
            $body = $status === 'approved'
                ? "
                    <h2>Vai trò đã được duyệt</h2>
                    <p>Chào {$safeName},</p>
                    <p>Vai trò <strong>{$roleLabel}</strong> đã được duyệt. Anh/chị có thể đăng nhập và sử dụng ngay.</p>
                    <p><a href=\"{$loginUrl}\">Đăng nhập Sổ Đỏ Vạn Phúc</a></p>
                "
                : "
                    <h2>Yêu cầu vai trò chưa được duyệt</h2>
                    <p>Chào {$safeName},</p>
                    <p>Vai trò <strong>{$roleLabel}</strong> hiện chưa được duyệt.</p>
                    " . ($safeNotes !== '' ? "<p>Ghi chú từ quản trị: {$safeNotes}</p>" : '') . "
                    <p>Anh/chị có thể bổ sung thông tin và gửi lại khi cần.</p>
                ";

            if (function_exists('svp_v1_mail_send')) {
                svp_v1_mail_send((string) $app['email'], $subject, $body);
            } else {
                try {
                    Mailer::send((string) $app['email'], $subject, $body);
                } catch (Throwable $mailError) {
                    error_log('SVP role application mail failed: ' . $mailError->getMessage());
                }
            }
        }
    }

    Response::json(['message' => $status === 'approved' ? 'Đã duyệt' : 'Đã từ chối']);
});

$router->add('POST', '/api/svp/admin/users', function () {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    if (function_exists('svp_v1_ensure_profile_columns')) {
        svp_v1_ensure_profile_columns($db);
    }
    if (function_exists('svp_ensure_role_approval_config')) {
        svp_ensure_role_approval_config($db);
    }

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fullName = trim((string) ($input['fullName'] ?? $input['full_name'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? ''));
    $password = trim((string) ($input['password'] ?? $input['temporaryPassword'] ?? ''));
    $roleSlugs = svp_normalize_role_slugs($input);
    if (empty($roleSlugs)) $roleSlugs = ['khach_mua'];

    if ($fullName === '' || $email === '' || $phone === '') {
        Response::error('Vui lòng nhập đủ họ tên, email và số điện thoại.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Email chưa đúng định dạng.', 400);
    }
    if ($password === '') {
        $password = svp_admin_random_password(18);
    }
    if (strlen($password) < 6) {
        Response::error('Mật khẩu cần tối thiểu 6 ký tự.', 400);
    }

    foreach ($roleSlugs as $roleSlug) {
        if (svp_is_admin_controlled_role($roleSlug)) {
            if ($roleSlug === 'admin_tong' && svp_owner_admin_exists($db)) {
                Response::error('Hệ thống chỉ dùng một tài khoản Admin tổng cho chủ sở hữu.', 403);
            }
            if (!svp_is_owner_admin_payload($payload) && !svp_can_bootstrap_owner_admin($db, $payload, $roleSlug)) {
                Response::error('Chỉ Admin tổng mới có quyền tạo tài khoản quản trị.', 403);
            }
        }
    }

    $roleStmt = $db->prepare("SELECT value FROM svp_config_options WHERE group_id = 'account_role_approval' AND value = :role LIMIT 1");
    foreach ($roleSlugs as $roleSlug) {
        $roleStmt->execute(['role' => $roleSlug]);
        if (!$roleStmt->fetch(PDO::FETCH_ASSOC)) {
            Response::error('Vai trò không tồn tại trong cấu hình: ' . $roleSlug, 404);
        }
    }

    $check = $db->prepare("SELECT id FROM users WHERE email = :email OR phone = :phone LIMIT 1");
    $check->execute(['email' => $email, 'phone' => $phone]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        Response::error('Email hoặc số điện thoại đã được sử dụng.', 409);
    }

    $userId = bin2hex(random_bytes(16));
    $svpId = svp_generate_svp_id($db);
    $refCode = svp_generate_referral_code($svpId);
    $db->prepare("
        INSERT INTO users (id, full_name, email, phone, password_hash, svp_id, referral_code, account_status, created_at)
        VALUES (:id, :full_name, :email, :phone, :password_hash, :svp_id, :referral_code, 'active', NOW())
    ")->execute([
        'id' => $userId,
        'full_name' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'svp_id' => $svpId,
        'referral_code' => $refCode,
    ]);

    $insertRole = $db->prepare("
        INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_by, approved_at)
        VALUES (:uid, :role, 'approved', NOW(), :by, NOW())
        ON DUPLICATE KEY UPDATE status = 'approved', approved_by = VALUES(approved_by), approved_at = NOW()
    ");
    foreach ($roleSlugs as $roleSlug) {
        $insertRole->execute(['uid' => $userId, 'role' => $roleSlug, 'by' => $payload['sub'] ?? null]);
    }

    $userStmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $userStmt->execute(['id' => $userId]);
    $createdUser = $userStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $roles = svp_get_user_roles($db, $userId);
    $item = svp_build_user_payload($createdUser, $roles);

    svp_insert_audit($db, $payload['sub'] ?? null, 'create', 'user', $userId, null, [
        'user' => $item,
        'createdRoles' => $roleSlugs,
        'createdByAdmin' => true,
    ]);

    if (!empty($email) && function_exists('svp_v1_mail_send')) {
        $safeName = htmlspecialchars($fullName ?: 'anh/chị', ENT_QUOTES, 'UTF-8');
        $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $safePassword = htmlspecialchars($password, ENT_QUOTES, 'UTF-8');
        $loginUrl = htmlspecialchars((defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . '/login', ENT_QUOTES, 'UTF-8');
        $body = "
            <h2>Tài khoản Sổ Đỏ Vạn Phúc đã được tạo</h2>
            <p>Chào {$safeName},</p>
            <p>Quản trị viên đã tạo tài khoản cho anh/chị.</p>
            <p><strong>Email:</strong> {$safeEmail}</p>
            <p><strong>Mật khẩu tạm:</strong> <code>{$safePassword}</code></p>
            <p>Anh/chị vui lòng đăng nhập và đổi lại mật khẩu để bảo mật tài khoản.</p>
            <p><a href=\"{$loginUrl}\">Đăng nhập Sổ Đỏ Vạn Phúc</a></p>
        ";
        svp_v1_mail_send($email, 'Tài khoản Sổ Đỏ Vạn Phúc đã được tạo', $body);
    }

    Response::json([
        'message' => 'Đã tạo tài khoản',
        'tempPassword' => $password,
        'item' => $item,
    ], 201);
});

$router->add('GET', '/api/svp/admin/users', function () {
    svp_require_management_role();
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    if (function_exists('svp_v1_ensure_profile_columns')) {
        svp_v1_ensure_profile_columns($db);
    }

    $stmt = $db->query("
        SELECT
            u.id, u.full_name, u.email, u.phone, u.cccd, u.svp_id, u.avatar_url,
            u.referral_code, u.referred_by, u.profile_json, u.account_status, u.created_at,
            ref.svp_id AS referrer_svp_id,
            ref.full_name AS referrer_name,
            ref.phone AS referrer_phone,
            ref.email AS referrer_email,
            ref.referral_code AS referrer_referral_code
        FROM users u
        LEFT JOIN users ref ON ref.id = u.referred_by
        ORDER BY u.created_at DESC
        LIMIT 500
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($users as $u) {
        $rStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid");
        $rStmt->execute(['uid' => $u['id']]);
        $roles = array_map(fn($r) => ['slug' => $r['role_slug'], 'status' => $r['status']], $rStmt->fetchAll(PDO::FETCH_ASSOC));

        $f1Stmt = $db->prepare("
            SELECT child.id, child.full_name, child.phone, child.email, child.svp_id, child.referral_code,
                   child.account_status, child.created_at,
                   GROUP_CONCAT(CONCAT(roles.role_slug, ':', roles.status) ORDER BY roles.id SEPARATOR ';') AS roles
            FROM users child
            LEFT JOIN svp_user_roles roles ON roles.user_id = child.id
            WHERE child.referred_by = :uid
            GROUP BY child.id, child.full_name, child.phone, child.email, child.svp_id, child.referral_code, child.account_status, child.created_at
            ORDER BY child.created_at DESC
            LIMIT 200
        ");
        $f1Stmt->execute(['uid' => $u['id']]);
        $directReferrals = array_map(function ($row) {
            return [
                'id' => $row['id'],
                'fullName' => $row['full_name'],
                'phone' => $row['phone'] ?? '',
                'email' => $row['email'] ?? '',
                'svpId' => $row['svp_id'] ?? '',
                'referralCode' => $row['referral_code'] ?? '',
                'accountStatus' => $row['account_status'] ?? 'active',
                'roles' => array_values(array_filter(array_map(function ($role) {
                    [$slug, $status] = array_pad(explode(':', $role, 2), 2, '');
                    return $slug !== '' ? ['slug' => $slug, 'status' => $status] : null;
                }, explode(';', (string) ($row['roles'] ?? ''))))),
                'createdAt' => $row['created_at'] ?? '',
            ];
        }, $f1Stmt->fetchAll(PDO::FETCH_ASSOC));

        $result[] = [
            'id' => $u['id'],
            'fullName' => $u['full_name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? '',
            'svpId' => $u['svp_id'] ?? '',
            'avatar' => $u['avatar_url'] ?? '',
            'cccd' => $u['cccd'] ?? '',
            'referralCode' => $u['referral_code'] ?? '',
            'referredBy' => $u['referred_by'] ?? '',
            'profile' => function_exists('svp_v1_profile_from_user') ? svp_v1_profile_from_user($u) : [],
            'referrer' => !empty($u['referred_by']) ? [
                'id' => $u['referred_by'],
                'svpId' => $u['referrer_svp_id'] ?? '',
                'fullName' => $u['referrer_name'] ?? '',
                'phone' => $u['referrer_phone'] ?? '',
                'email' => $u['referrer_email'] ?? '',
                'referralCode' => $u['referrer_referral_code'] ?? '',
            ] : null,
            'directReferrals' => $directReferrals,
            'directReferralCount' => count($directReferrals),
            'accountStatus' => $u['account_status'] ?? 'active',
            'roles' => $roles,
            'createdAt' => $u['created_at'],
        ];
    }

    Response::json(['items' => $result, 'total' => count($result)]);
});

$router->add('GET', '/api/svp/admin/referrer-candidates', function () {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    $query = trim((string) ($_GET['q'] ?? ''));
    $excludeId = trim((string) ($_GET['excludeId'] ?? ''));
    if (mb_strlen($query) < 2) Response::json(['items' => [], 'total' => 0]);
    $stmt = $db->prepare("SELECT id, full_name, phone, email, svp_id, referral_code
      FROM users
      WHERE id <> :exclude_id
        AND (full_name LIKE :query_name OR email LIKE :query_email OR phone LIKE :query_phone OR svp_id LIKE :query_svp_id OR referral_code LIKE :query_referral_code)
      ORDER BY CASE WHEN email = :exact_email OR phone = :exact_phone OR svp_id = :exact_svp_id OR referral_code = :exact_referral_code THEN 0 ELSE 1 END, full_name ASC
      LIMIT 12");
    $like = '%' . $query . '%';
    $stmt->execute([
        'exclude_id' => $excludeId,
        'query_name' => $like,
        'query_email' => $like,
        'query_phone' => $like,
        'query_svp_id' => $like,
        'query_referral_code' => $like,
        'exact_email' => $query,
        'exact_phone' => $query,
        'exact_svp_id' => $query,
        'exact_referral_code' => $query,
    ]);
    $items = array_map(fn($row) => [
        'id' => (string) $row['id'],
        'fullName' => (string) ($row['full_name'] ?? ''),
        'phone' => (string) ($row['phone'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'svpId' => (string) ($row['svp_id'] ?? ''),
        'referralCode' => (string) ($row['referral_code'] ?? ''),
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/users/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    if (function_exists('svp_v1_ensure_profile_columns')) {
        svp_v1_ensure_profile_columns($db);
    }
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $currentStmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $currentStmt->execute(['id' => $id]);
    $oldUser = $currentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$oldUser) Response::notFound('Khong tim thay tai khoan');
    $targetIsAdminControlled = svp_user_has_any_approved_role($db, $id, svp_admin_controlled_role_slugs());

    $fields = [];
    $data = ['id' => $id];
    foreach (['full_name' => 'fullName', 'phone' => 'phone', 'email' => 'email'] as $col => $key) {
        if (isset($input[$key])) {
            $fields[] = "{$col} = :{$col}";
            $data[$col] = trim($input[$key]);
        }
    }

    if (!empty($fields)) {
        if ($targetIsAdminControlled && !svp_is_owner_admin_payload($payload)) {
            Response::error('Chỉ Admin tổng mới có quyền chỉnh tài khoản quản trị.', 403);
        }
        $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id")->execute($data);
    }

    $referrerUserId = trim((string) ($input['referrerUserId'] ?? ''));
    if ($referrerUserId !== '') {
        if ($targetIsAdminControlled && !svp_is_owner_admin_payload($payload)) {
            Response::error('Chỉ Admin tổng mới có quyền chỉnh tài khoản quản trị.', 403);
        }
        if ($referrerUserId === $id) Response::error('Không thể tự gán chính tài khoản làm người giới thiệu.', 400);
        if (($oldUser['referred_by'] ?? '') === $referrerUserId) Response::error('Tài khoản này đã được gán cho người giới thiệu đã chọn.', 409);
        $stmt = $db->prepare('SELECT id, full_name, phone, email, svp_id, referral_code FROM users WHERE id = :referrer_id LIMIT 1');
        $stmt->execute(['referrer_id' => $referrerUserId]);
        $referrer = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$referrer) Response::error('Không tìm thấy tài khoản người giới thiệu đã chọn.', 404);

        $db->prepare("UPDATE users SET referred_by = :ref WHERE id = :id")
           ->execute(['ref' => $referrer['id'], 'id' => $id]);

        $db->prepare("UPDATE svp_referrals SET status = 'rejected' WHERE referred_user_id = :referred_id AND status <> 'rejected'")
           ->execute(['referred_id' => $id]);

        $existingReferral = $db->prepare('SELECT id FROM svp_referrals WHERE referrer_user_id = :referrer_id AND referred_user_id = :referred_id LIMIT 1');
        $existingReferral->execute(['referrer_id' => $referrer['id'], 'referred_id' => $id]);
        $existingReferralId = $existingReferral->fetchColumn();
        if ($existingReferralId) {
            $db->prepare("UPDATE svp_referrals SET referral_code = :code, status = 'activated' WHERE id = :id")->execute([
                'code' => $referrer['referral_code'] ?: '', 'id' => $existingReferralId,
            ]);
        } else {
            $db->prepare("
            INSERT INTO svp_referrals (id, referrer_user_id, referred_user_id, referral_code, referral_type, status)
            VALUES (:id, :referrer_id, :referred_id, :code, 'other', 'activated')
            ")->execute([
                'id' => bin2hex(random_bytes(16)),
                'referrer_id' => $referrer['id'],
                'referred_id' => $id,
                'code' => $referrer['referral_code'] ?: '',
            ]);
        }

        svp_insert_audit($db, $payload['sub'], 'update_referrer', 'user', $id, [
            'referredBy' => $oldUser['referred_by'] ?? null,
        ], [
            'referredBy' => $referrer['id'],
            'referrerName' => $referrer['full_name'] ?? '',
            'referrerSvpId' => $referrer['svp_id'] ?? '',
        ]);
    }

    if (isset($input['addRole'])) {
        $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) $input['addRole'])));
        if ($roleSlug === '') Response::error('Vai tro khong hop le', 400);
        svp_assert_can_assign_role($db, $payload, $id, $roleSlug);
        if (function_exists('svp_ensure_role_approval_config')) {
            svp_ensure_role_approval_config($db);
        }
        $roleStmt = $db->prepare("SELECT label FROM svp_config_options WHERE group_id = 'account_role_approval' AND value = :role LIMIT 1");
        $roleStmt->execute(['role' => $roleSlug]);
        $roleConfig = $roleStmt->fetch(PDO::FETCH_ASSOC);
        if (!$roleConfig) Response::error('Vai tro khong ton tai trong cau hinh', 404);

        $beforeRolesStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
        $beforeRolesStmt->execute(['uid' => $id]);
        $beforeRoles = $beforeRolesStmt->fetchAll(PDO::FETCH_ASSOC);

        $db->prepare("
            INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_by, approved_at)
            VALUES (:uid, :role, 'approved', NOW(), :by, NOW())
            ON DUPLICATE KEY UPDATE status = 'approved', approved_by = VALUES(approved_by), approved_at = NOW()
        ")->execute(['uid' => $id, 'role' => $roleSlug, 'by' => $payload['sub']]);

        $afterRolesStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
        $afterRolesStmt->execute(['uid' => $id]);
        svp_insert_audit($db, $payload['sub'], 'assign_role', 'user', $id, ['roles' => $beforeRoles], [
            'roles' => $afterRolesStmt->fetchAll(PDO::FETCH_ASSOC),
            'assignedRole' => $roleSlug,
            'assignedRoleLabel' => $roleConfig['label'] ?? $roleSlug,
        ]);
    }

    if (isset($input['removeRole'])) {
        $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim((string) $input['removeRole'])));
        if ($roleSlug === '') Response::error('Vai tro khong hop le', 400);
        svp_assert_can_remove_role($db, $payload, $id, $roleSlug);

        $beforeRolesStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
        $beforeRolesStmt->execute(['uid' => $id]);
        $beforeRoles = $beforeRolesStmt->fetchAll(PDO::FETCH_ASSOC);

        $deleteRole = $db->prepare("DELETE FROM svp_user_roles WHERE user_id = :uid AND role_slug = :role");
        $deleteRole->execute(['uid' => $id, 'role' => $roleSlug]);

        $db->prepare("UPDATE svp_role_applications SET status = 'rejected', reviewed_by = :by, reviewed_at = NOW() WHERE user_id = :uid AND role_slug = :role AND status = 'pending'")
           ->execute(['by' => $payload['sub'], 'uid' => $id, 'role' => $roleSlug]);

        $afterRolesStmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
        $afterRolesStmt->execute(['uid' => $id]);
        svp_insert_audit($db, $payload['sub'], 'remove_role', 'user', $id, ['roles' => $beforeRoles], [
            'roles' => $afterRolesStmt->fetchAll(PDO::FETCH_ASSOC),
            'removedRole' => $roleSlug,
        ]);
    }

    if (!empty($fields)) {
        $currentStmt->execute(['id' => $id]);
        svp_insert_audit($db, $payload['sub'], 'update', 'user', $id, $oldUser, $currentStmt->fetch(PDO::FETCH_ASSOC));
    }

    Response::json(['message' => 'Đã cập nhật']);
});

// ─── Property Enhancements ──────────────────────────────────────────────────

$router->add('POST', '/api/svp/admin/users/{id}/account-status', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $status = trim((string) ($input['accountStatus'] ?? ''));

    if (!in_array($status, ['active', 'locked'], true)) Response::error('Trang thai tai khoan khong hop le', 400);
    if ($id === ($payload['sub'] ?? '') && $status === 'locked') Response::error('Khong the tu khoa tai khoan quan tri dang dung', 400);
    svp_assert_can_manage_admin_target($db, $payload, $id);

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
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    svp_assert_can_manage_admin_target($db, $payload, $id);

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

    if (!empty($user['email'])) {
        $safeName = htmlspecialchars((string) ($user['full_name'] ?: 'anh/chị'), ENT_QUOTES, 'UTF-8');
        $safeTempPassword = htmlspecialchars($tempPassword, ENT_QUOTES, 'UTF-8');
        $loginUrl = htmlspecialchars((defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . '/login', ENT_QUOTES, 'UTF-8');
        $body = "
            <h2>Mật khẩu tạm Sổ Đỏ Vạn Phúc</h2>
            <p>Chào {$safeName},</p>
            <p>Quản trị viên vừa tạo mật khẩu tạm cho tài khoản của anh/chị.</p>
            <p><strong>Mật khẩu tạm:</strong> <code>{$safeTempPassword}</code></p>
            <p>Anh/chị vui lòng đăng nhập và đổi lại mật khẩu để bảo mật tài khoản.</p>
            <p><a href=\"{$loginUrl}\">Đăng nhập Sổ Đỏ Vạn Phúc</a></p>
        ";

        if (function_exists('svp_v1_mail_send')) {
            svp_v1_mail_send((string) $user['email'], 'Mật khẩu tạm Sổ Đỏ Vạn Phúc', $body);
        } else {
            try {
                Mailer::send((string) $user['email'], 'Mật khẩu tạm Sổ Đỏ Vạn Phúc', $body);
            } catch (Throwable $mailError) {
                error_log('SVP admin reset password mail failed: ' . $mailError->getMessage());
            }
        }
    }

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
    if (function_exists('svp_v1_ensure_profile_columns')) {
        svp_v1_ensure_profile_columns($db);
    }

    $type = preg_replace('/[^a-z_]/', '', strtolower((string) ($_GET['type'] ?? 'users')));
    $today = date('Ymd-His');

    if ($type === 'users') {
        $stmt = $db->query("
            SELECT
                u.svp_id, u.full_name, u.phone, u.email, u.cccd, u.profile_json,
                u.referral_code, u.account_status,
                ref.svp_id AS referrer_svp_id,
                ref.full_name AS referrer_name,
                GROUP_CONCAT(CONCAT(r.role_slug, ':', r.status) ORDER BY r.id SEPARATOR '; ') as roles,
                u.created_at
            FROM users u
            LEFT JOIN svp_user_roles r ON r.user_id = u.id
            LEFT JOIN users ref ON ref.id = u.referred_by
            GROUP BY u.id, u.svp_id, u.full_name, u.phone, u.email, u.cccd, u.profile_json, u.referral_code, u.account_status, ref.svp_id, ref.full_name, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 2000
        ");
        $rows = array_map(function ($row) {
            $profile = svp_v1_profile_from_user($row);
            $address = $profile['address'] ?? [];
            $bank = $profile['bankInfo'] ?? [];
            return [
                $row['svp_id'] ?? '',
                $row['full_name'] ?? '',
                $row['phone'] ?? '',
                $row['email'] ?? '',
                $row['cccd'] ?? '',
                implode(', ', array_filter([
                    $address['houseNumber'] ?? '',
                    $address['street'] ?? '',
                    $address['ward'] ?? '',
                    $address['district'] ?? '',
                    $address['province'] ?? '',
                ])),
                !empty($profile['hasCertificate']) ? 'Co' : 'Khong',
                $profile['certificateUrl'] ?? '',
                $profile['educationLevel'] ?? '',
                $profile['bio'] ?? '',
                $bank['bankName'] ?? '',
                $bank['accountNumber'] ?? '',
                $bank['accountHolder'] ?? '',
                $row['referral_code'] ?? '',
                trim(($row['referrer_svp_id'] ?? '') . ' ' . ($row['referrer_name'] ?? '')),
                $row['account_status'] ?? '',
                $row['roles'] ?? '',
                $row['created_at'] ?? '',
            ];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
        svp_admin_excel_download("svp-users-{$today}.xls", 'Nguoi dung', ['SVP ID', 'Ho ten', 'Dien thoai', 'Email', 'CCCD', 'Dia chi', 'Co chung chi', 'Anh chung chi', 'Hoc van', 'Mo ta', 'Ngan hang', 'So tai khoan', 'Chu tai khoan', 'Ma gioi thieu', 'Nguoi gioi thieu', 'Trang thai', 'Vai tro', 'Ngay tao'], $rows);
    }

    if ($type === 'user_referrals') {
        $userId = trim((string) ($_GET['userId'] ?? ''));
        if ($userId === '') Response::error('Thieu tai khoan can xuat tuyen F1', 400);
        $userStmt = $db->prepare('SELECT svp_id, full_name FROM users WHERE id = :id LIMIT 1');
        $userStmt->execute(['id' => $userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) Response::notFound('Khong tim thay tai khoan');

        $stmt = $db->prepare("SELECT
                u.svp_id, u.full_name, u.phone, u.email, u.referral_code, u.account_status,
                GROUP_CONCAT(CONCAT(r.role_slug, ':', r.status) ORDER BY r.id SEPARATOR '; ') AS roles,
                u.created_at
            FROM users u
            LEFT JOIN svp_user_roles r ON r.user_id = u.id
            WHERE u.referred_by = :user_id
            GROUP BY u.id, u.svp_id, u.full_name, u.phone, u.email, u.referral_code, u.account_status, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 5000");
        $stmt->execute(['user_id' => $userId]);
        $ownerLabel = trim((string) ($user['svp_id'] ?? '') . ' ' . (string) ($user['full_name'] ?? ''));
        $rows = array_map(fn($row) => array_merge([$ownerLabel], array_values($row)), $stmt->fetchAll(PDO::FETCH_ASSOC));
        svp_admin_excel_download("svp-f1-{$today}.xls", 'Tuyen F1', ['Nguoi gioi thieu', 'SVP ID F1', 'Ho ten F1', 'Dien thoai', 'Email', 'Ma gioi thieu', 'Trang thai', 'Vai tro', 'Ngay tao'], $rows);
    }

    if ($type === 'properties') {
        $stmt = $db->query("
            SELECT code, title, owner_name, owner_phone, district, ward, price, area_m2, status_id, created_at
            FROM svp_properties
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 3000
        ");
        svp_admin_excel_download("svp-properties-{$today}.xls", 'Nguon nha', ['Ma tin', 'Tieu de', 'Chu nha', 'Dien thoai', 'Quan/Huyen', 'Phuong/Xa', 'Gia', 'Dien tich', 'Trang thai', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'customers') {
        $stmt = $db->query("
            SELECT full_name, phone, email, demand_type, budget_min, budget_max, district, status_id, created_at
            FROM svp_customers
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 3000
        ");
        svp_admin_excel_download("svp-customers-{$today}.xls", 'Khach hang', ['Ho ten', 'Dien thoai', 'Email', 'Nhu cau', 'Ngan sach tu', 'Ngan sach den', 'Khu vuc', 'Trang thai', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'role_applications') {
        $stmt = $db->query("
            SELECT u.svp_id, u.full_name, u.phone, u.email, ra.role_slug, ra.status, ra.reason, ra.admin_notes, ra.created_at, ra.reviewed_at
            FROM svp_role_applications ra
            LEFT JOIN users u ON u.id = ra.user_id
            ORDER BY ra.created_at DESC
            LIMIT 2000
        ");
        svp_admin_excel_download("svp-role-applications-{$today}.xls", 'Duyet vai tro', ['SVP ID', 'Ho ten', 'Dien thoai', 'Email', 'Vai tro', 'Trang thai', 'Ly do', 'Ghi chu', 'Ngay gui', 'Ngay duyet'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'viewing_schedules') {
        $stmt = $db->query("SELECT
                s.scheduled_at, s.status,
                c.full_name, c.phone, c.email,
                p.code, p.title, p.owner_name, p.owner_phone,
                u.svp_id, u.full_name AS creator_name,
                s.note, s.created_at
            FROM svp_viewing_schedules s
            LEFT JOIN svp_customers c ON c.id = s.customer_id
            LEFT JOIN svp_properties p ON p.id = s.property_id
            LEFT JOIN users u ON u.id = s.created_by
            ORDER BY s.scheduled_at DESC, s.created_at DESC
            LIMIT 5000");
        svp_admin_excel_download("svp-viewing-schedules-{$today}.xls", 'Lich xem', ['Lich hen', 'Trang thai', 'Khach hang', 'Dien thoai khach', 'Email khach', 'Ma nguon', 'Nguon nha', 'Chu nha', 'Dien thoai chu', 'SVP ID nguoi tao', 'Nguoi tao', 'Ghi chu', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
    }

    if ($type === 'referrals') {
        $stmt = $db->query("SELECT
                r.referral_code, r.referral_type, r.status,
                ref.svp_id, ref.full_name, ref.phone, ref.email,
                referred.svp_id, referred.full_name, referred.phone, referred.email,
                r.created_at
            FROM svp_referrals r
            LEFT JOIN users ref ON ref.id = r.referrer_user_id
            LEFT JOIN users referred ON referred.id = r.referred_user_id
            ORDER BY r.created_at DESC
            LIMIT 5000");
        svp_admin_excel_download("svp-referrals-{$today}.xls", 'Gioi thieu', ['Ma gioi thieu', 'Loai', 'Trang thai', 'SVP ID nguoi gioi thieu', 'Nguoi gioi thieu', 'Dien thoai nguoi gioi thieu', 'Email nguoi gioi thieu', 'SVP ID nguoi duoc gioi thieu', 'Nguoi duoc gioi thieu', 'Dien thoai nguoi duoc gioi thieu', 'Email nguoi duoc gioi thieu', 'Ngay tao'], $stmt->fetchAll(PDO::FETCH_NUM));
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
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_admin_ensure_notifications_table($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $title = trim((string) ($input['title'] ?? ''));
    $body = trim((string) ($input['body'] ?? ''));
    $recipient = trim((string) ($input['recipient'] ?? $input['userId'] ?? ''));
    if ($title === '') Response::error('Vui long nhap tieu de thong bao', 400);

    $userId = null;
    if ($recipient !== '') {
        $stmt = $db->prepare("
            SELECT id
            FROM users
            WHERE id = :exact OR svp_id = :exact OR phone = :exact OR email = :exact
            LIMIT 1
        ");
        $stmt->execute(['exact' => $recipient]);
        $resolved = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$resolved) Response::error('Khong tim thay nguoi nhan thong bao', 404);
        $userId = (string) $resolved['id'];
    }

    $db->prepare("INSERT INTO svp_notifications (user_id, title, body, kind, is_read, created_at) VALUES (:user_id, :title, :body, 'admin_notice', 0, NOW())")
       ->execute(['user_id' => $userId, 'title' => $title, 'body' => $body]);
    $id = (string) $db->lastInsertId();

    svp_insert_audit($db, $payload['sub'], 'create', 'notification', $id, null, ['title' => $title, 'body' => $body, 'userId' => $userId]);

    Response::json([
        'message' => 'Da gui thong bao',
        'item' => ['id' => $id, 'user_id' => $userId, 'title' => $title, 'body' => $body, 'kind' => 'admin_notice'],
    ]);
});

$router->add('DELETE', '/api/svp/admin/notifications/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
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

function svp_property_duplicate_rule(PDO $db, array $input, ?string $excludeId = null): array
{
    $address = trim((string) ($input['address'] ?? ''));
    $street = trim((string) ($input['street'] ?? ''));
    $ward = trim((string) ($input['ward'] ?? ''));
    $district = trim((string) ($input['district'] ?? ''));
    $province = trim((string) ($input['province'] ?? ''));
    $hiddenAddress = trim((string) ($input['hiddenAddress'] ?? $input['hidden_address'] ?? ''));
    $bookSerial = trim((string) ($input['bookSerial'] ?? $input['book_serial'] ?? ''));
    $bookSheet = trim((string) ($input['bookSheet'] ?? ''));
    $bookParcel = trim((string) ($input['bookParcel'] ?? ''));
    $submittedSigningScore = (float) ($input['signingScore'] ?? $input['signing_score'] ?? 0);

    $conditions = [];
    $params = [];
    $addressFields = array_values(array_filter([$address, $hiddenAddress], fn($value) => trim((string) $value) !== ''));

    if ($address !== '') {
        $conditions[] = "p.address LIKE :addr";
        $params['addr'] = '%' . $address . '%';
    }
    if ($hiddenAddress !== '') {
        $conditions[] = "p.hidden_address LIKE :hidden_addr";
        $params['hidden_addr'] = '%' . $hiddenAddress . '%';
    }
    if ($street !== '' && $district !== '') {
        $conditions[] = "(p.address LIKE :street_addr AND p.district = :district_addr)";
        $params['street_addr'] = '%' . $street . '%';
        $params['district_addr'] = $district;
    }
    if ($bookSerial !== '') {
        $conditions[] = "p.book_serial = :bs";
        $params['bs'] = $bookSerial;
    }
    if ($bookSheet !== '') {
        $conditions[] = "p.extra_json LIKE :book_sheet";
        $params['book_sheet'] = '%' . $bookSheet . '%';
    }
    if ($bookParcel !== '') {
        $conditions[] = "p.extra_json LIKE :book_parcel";
        $params['book_parcel'] = '%' . $bookParcel . '%';
    }

    $emptyRule = [
        'hasDuplicates' => false,
        'canSubmit' => true,
        'currentExpertCount' => 0,
        'maxExpertsAllowed' => 3,
        'highestSigningScore' => null,
        'submittedSigningScore' => $submittedSigningScore,
        'message' => 'Chưa thấy nguồn trùng theo địa chỉ, seri sổ, số tờ hoặc số thửa. Có thể lên bài ngay.',
    ];

    if (empty($conditions)) {
        return ['matches' => [], 'total' => 0, 'rule' => $emptyRule];
    }

    $where = '(' . implode(' OR ', $conditions) . ') AND p.deleted_at IS NULL';
    if ($excludeId !== null && $excludeId !== '') {
        $where .= ' AND p.id <> :exclude_id';
        $params['exclude_id'] = $excludeId;
    }

    $stmt = $db->prepare("
        SELECT p.id, p.code, p.title, p.address, p.hidden_address, p.district, p.ward, p.owner_name, p.book_serial, p.status_id, p.expert_id, p.created_by, p.signing_score, p.extra_json,
               COALESCE(expert.full_name, creator.full_name, '') AS expert_name
        FROM svp_properties p
        LEFT JOIN users expert ON expert.id = p.expert_id
        LEFT JOIN users creator ON creator.id = p.created_by
        WHERE {$where}
        ORDER BY p.signing_score DESC, p.created_at ASC
        LIMIT 20
    ");
    $stmt->execute($params);
    $rawMatches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $matches = array_map(function ($row) use ($addressFields, $street, $district, $bookSerial, $bookSheet, $bookParcel) {
        $score = (float) ($row['signing_score'] ?? 0);
        $rowExtra = svp_json_decode($row['extra_json'] ?? null, []);
        $rowAddress = trim((string) ($row['address'] ?? ''));
        $rowHiddenAddress = trim((string) ($row['hidden_address'] ?? ''));
        $rowBookSerial = trim((string) ($row['book_serial'] ?? ''));
        $rowBookSheet = trim((string) ($rowExtra['bookSheet'] ?? ''));
        $rowBookParcel = trim((string) ($rowExtra['bookParcel'] ?? ''));
        $matchTypes = [];
        foreach ($addressFields as $fieldValue) {
            $needle = mb_strtolower(trim((string) $fieldValue), 'UTF-8');
            $haystack = mb_strtolower($rowAddress . ' ' . $rowHiddenAddress, 'UTF-8');
            if ($needle !== '' && (str_contains($haystack, $needle) || str_contains($needle, mb_strtolower($rowAddress, 'UTF-8')))) {
                $matchTypes[] = 'Địa chỉ';
                break;
            }
        }
        if (!in_array('Địa chỉ', $matchTypes, true) && $street !== '' && $district !== '') {
            $haystack = mb_strtolower($rowAddress . ' ' . $rowHiddenAddress, 'UTF-8');
            if (str_contains($haystack, mb_strtolower($street, 'UTF-8')) && (string) ($row['district'] ?? '') === $district) {
                $matchTypes[] = 'Địa chỉ';
            }
        }
        if ($bookSerial !== '' && mb_strtolower($rowBookSerial, 'UTF-8') === mb_strtolower($bookSerial, 'UTF-8')) {
            $matchTypes[] = 'Số seri sổ';
        }
        if ($bookSheet !== '' && $rowBookSheet !== '' && mb_strtolower($rowBookSheet, 'UTF-8') === mb_strtolower($bookSheet, 'UTF-8')) {
            $matchTypes[] = 'Số tờ';
        }
        if ($bookParcel !== '' && $rowBookParcel !== '' && mb_strtolower($rowBookParcel, 'UTF-8') === mb_strtolower($bookParcel, 'UTF-8')) {
            $matchTypes[] = 'Thửa đất';
        }

        return [
            'id' => (string) $row['id'],
            'code' => (string) ($row['code'] ?? ''),
            'title' => (string) ($row['title'] ?? ''),
            'address' => (string) ($row['address'] ?? ''),
            'district' => (string) ($row['district'] ?? ''),
            'ownerName' => (string) ($row['owner_name'] ?? ''),
            'bookSerial' => (string) ($row['book_serial'] ?? ''),
            'bookSheet' => $rowBookSheet,
            'bookParcel' => $rowBookParcel,
            'matchTypes' => array_values(array_unique($matchTypes)),
            'statusId' => (string) ($row['status_id'] ?? ''),
            'expertId' => (string) ($row['expert_id'] ?? ''),
            'createdBy' => (string) ($row['created_by'] ?? ''),
            'expertName' => (string) ($row['expert_name'] ?? ''),
            'signingScore' => $score,
        ];
    }, $rawMatches);
    $matches = array_values(array_filter($matches, fn($item) => !empty($item['matchTypes'])));

    $expertKeys = [];
    $highestSigningScore = null;
    foreach ($matches as $match) {
        $score = (float) ($match['signingScore'] ?? 0);
        if ($highestSigningScore === null || $score > $highestSigningScore) {
            $highestSigningScore = $score;
        }
        $expertKey = (string) (($match['expertId'] ?? '') ?: ($match['createdBy'] ?? '') ?: ($match['id'] ?? ''));
        if ($expertKey !== '') {
            $expertKeys[$expertKey] = true;
        }
    }
    $expertCount = count($expertKeys);
    $hasDuplicates = count($matches) > 0;
    $maxExpertsAllowed = 3;
    $canSubmit = true;
    $message = 'Chưa thấy nguồn trùng theo địa chỉ, seri sổ, số tờ hoặc số thửa. Có thể lên bài ngay.';

    if ($hasDuplicates) {
        if ($expertCount >= $maxExpertsAllowed) {
            $canSubmit = false;
            $message = 'Nguồn trùng đã đủ tối đa 3 Chuyên gia quản lý. Vui lòng báo admin xử lý.';
        } elseif ($highestSigningScore !== null && $submittedSigningScore <= $highestSigningScore) {
            $canSubmit = false;
            $message = 'Nguồn trùng đang có điểm ký cao nhất ' . $highestSigningScore . '. Điểm hiện tại ' . $submittedSigningScore . ' phải cao hơn mới được lên bài.';
        } else {
            $message = 'Nguồn trùng nhưng điểm ký hiện tại cao hơn nguồn cũ. Có thể lên bài, hệ thống vẫn lưu cảnh báo để admin rà soát.';
        }
    }

    return [
        'matches' => $matches,
        'total' => count($matches),
        'rule' => [
            'hasDuplicates' => $hasDuplicates,
            'canSubmit' => $canSubmit,
            'currentExpertCount' => $expertCount,
            'maxExpertsAllowed' => $maxExpertsAllowed,
            'highestSigningScore' => $highestSigningScore,
            'submittedSigningScore' => $submittedSigningScore,
            'message' => $message,
        ],
    ];
}

$router->add('POST', '/api/svp/properties/check-duplicate', function () {
    svp_auth_require();
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    Response::json(svp_property_duplicate_rule($db, $input));
});

$router->add('PATCH', '/api/svp/properties/{id}/status', function ($params) {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $statusId = trim($input['statusId'] ?? '');

    if (!$id || !$statusId) Response::error('Thong tin khong hop le', 400);

    $stmt = $db->prepare("
        SELECT id, status_id, address, hidden_address, district, ward, book_serial, owner_phone, signing_score, extra_json
        FROM svp_properties
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound();

    if ($statusId === 'st_active') {
        $extra = svp_json_decode($old['extra_json'] ?? null, []);
        $ruleResult = svp_property_duplicate_rule($db, [
            'address' => (string) ($old['address'] ?? ''),
            'hiddenAddress' => (string) ($old['hidden_address'] ?? ''),
            'street' => (string) ($extra['street'] ?? ''),
            'ward' => (string) ($old['ward'] ?? ''),
            'district' => (string) ($old['district'] ?? ''),
            'province' => (string) ($extra['province'] ?? ''),
            'bookSerial' => (string) ($old['book_serial'] ?? ''),
            'bookSheet' => (string) ($extra['bookSheet'] ?? ''),
            'bookParcel' => (string) ($extra['bookParcel'] ?? ''),
            'signingScore' => (float) ($old['signing_score'] ?? 0),
        ], $id);
        if (!($ruleResult['rule']['canSubmit'] ?? true)) {
            http_response_code(409);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok' => false,
                'error' => (string) ($ruleResult['rule']['message'] ?? 'Nguồn trùng chưa đủ điều kiện duyệt'),
                'data' => [
                    'duplicateRule' => $ruleResult['rule'],
                    'matches' => $ruleResult['matches'],
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $db->prepare("UPDATE svp_properties SET status_id = :s, updated_by = :actor WHERE id = :id")
       ->execute(['s' => $statusId, 'actor' => $payload['sub'], 'id' => $id]);

    svp_insert_property_timeline($db, $id, 'status_change', 'Doi trang thai nguon nha', "{$old['status_id']} -> {$statusId}", $payload['sub'], [
        'oldStatusId' => $old['status_id'],
        'newStatusId' => $statusId,
    ]);

    svp_insert_audit($db, $payload['sub'], 'update', 'property', $id, ['statusId' => $old['status_id']], ['statusId' => $statusId]);

    Response::json(['message' => 'Da cap nhat trang thai']);
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
