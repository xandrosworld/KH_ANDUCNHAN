<?php
/**
 * Sổ Đỏ Vạn Phúc - V1 auth routes.
 * These routes are registered before the legacy auth route file so the V1
 * registration and login flow can override older single-role behavior.
 */

function svp_v1_auth_payload(): ?array {
    $token = Auth::extractToken();
    if (!$token) return null;
    return JwtAuth::verifyToken($token);
}

function svp_v1_auth_require(): array {
    $payload = svp_v1_auth_payload();
    if (!$payload) Response::error('Phiên đăng nhập đã hết hạn', 401);
    return $payload;
}

function svp_v1_ensure_account_status_column(PDO $db): void {
    try {
        $db->exec("ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER referral_code");
    } catch (Throwable $e) {
        // Column already exists, or the host blocks ALTER for this request.
    }

    try {
        $db->exec("ALTER TABLE users ADD INDEX idx_account_status (account_status)");
    } catch (Throwable $e) {
        // Index already exists.
    }
}

function svp_v1_ensure_profile_columns(PDO $db): void {
    try {
        $db->exec("ALTER TABLE users ADD COLUMN cccd VARCHAR(20) DEFAULT NULL AFTER phone");
    } catch (Throwable $e) {
        // Column already exists.
    }

    try {
        $db->exec("ALTER TABLE users ADD COLUMN profile_json LONGTEXT DEFAULT NULL AFTER avatar_url");
    } catch (Throwable $e) {
        // Column already exists.
    }
}

function svp_v1_profile_from_user(array $user): array {
    $profile = svp_json_decode($user['profile_json'] ?? null, []);
    if (!is_array($profile)) $profile = [];

    $defaults = [
        'cccd' => (string) ($user['cccd'] ?? ''),
        'hasCertificate' => false,
        'certificateUrl' => '',
        'address' => [
            'province' => '',
            'district' => '',
            'ward' => '',
            'street' => '',
            'houseNumber' => '',
        ],
        'educationLevel' => '',
        'bio' => '',
        'bankInfo' => [
            'bankName' => '',
            'accountNumber' => '',
            'accountHolder' => '',
        ],
    ];

    $profile = array_replace_recursive($defaults, $profile);
    if (!empty($user['cccd'])) $profile['cccd'] = (string) $user['cccd'];
    return $profile;
}

function svp_v1_user_is_locked(array $user): bool {
    return strtolower((string) ($user['account_status'] ?? 'active')) === 'locked';
}

function svp_v1_input_string(array $input, string ...$keys): string {
    foreach ($keys as $key) {
        if (!array_key_exists($key, $input)) continue;
        $value = $input[$key];
        if (is_array($value)) {
            $value = reset($value);
        }
        if (is_scalar($value)) {
            return trim((string) $value);
        }
    }
    return '';
}

function svp_v1_password_matches(string $password, string $storedHash): bool {
    if ($storedHash === '') {
        return false;
    }

    try {
        return password_verify($password, $storedHash);
    } catch (Throwable $e) {
        error_log('SVP V1 password verify error: ' . $e->getMessage());
        return false;
    }
}

function svp_v1_public_roles(): array {
    return ['khach_mua', 'chu_nha', 'nguoi_gioi_thieu', 'ctv_khach', 'ctv_nguon', 'doi_tac'];
}

function svp_v1_role_requires_approval(string $roleSlug): bool {
    try {
        return svp_role_requires_approval_from_config(Database::getInstance(), $roleSlug);
    } catch (Throwable $e) {
        error_log('[SVP_V1_ROLE_APPROVAL] ' . $e->getMessage());
    }
    return !in_array($roleSlug, svp_v1_public_roles(), true);
}

function svp_v1_role_label(string $roleSlug): string {
    try {
        return svp_role_display_name_from_config(Database::getInstance(), $roleSlug);
    } catch (Throwable $e) {
        error_log('[SVP_V1_ROLE_LABEL] ' . $e->getMessage());
    }
    return $roleSlug;
}

function svp_v1_mail_send(string $to, string $subject, string $body): void {
    try {
        Mailer::send($to, $subject, $body);
    } catch (Throwable $e) {
        error_log('[SVP_MAIL] ' . $e->getMessage());
    }
}

function svp_v1_mail_notify_admin(string $subject, string $body): void {
    try {
        Mailer::notifyAdmin($subject, $body);
    } catch (Throwable $e) {
        error_log('[SVP_MAIL_ADMIN] ' . $e->getMessage());
    }
}

function svp_v1_send_registration_email(string $email, string $fullName, string $svpId, string $refCode, array $roles): void {
    $approved = [];
    $pending = [];
    foreach ($roles as $role) {
        $label = htmlspecialchars(svp_v1_role_label((string) ($role['slug'] ?? '')), ENT_QUOTES, 'UTF-8');
        if (($role['status'] ?? '') === 'approved') {
            $approved[] = $label;
        } else {
            $pending[] = $label;
        }
    }

    $safeName = htmlspecialchars($fullName ?: 'anh/chị', ENT_QUOTES, 'UTF-8');
    $safeSvpId = htmlspecialchars($svpId, ENT_QUOTES, 'UTF-8');
    $safeRef = htmlspecialchars($refCode, ENT_QUOTES, 'UTF-8');
    $loginUrl = htmlspecialchars((defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . '/login', ENT_QUOTES, 'UTF-8');
    $approvedText = $approved ? implode(', ', $approved) : 'Chưa có vai trò dùng ngay';
    $pendingText = $pending ? implode(', ', $pending) : 'Không có';

    $body = "
        <h2>Chào mừng đến với Sổ Đỏ Vạn Phúc</h2>
        <p>Xin chào <strong>{$safeName}</strong>, tài khoản của anh/chị đã được tạo thành công.</p>
        <table style='border-collapse:collapse;width:100%;margin:16px 0'>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>SVP ID</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$safeSvpId}</strong></td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>Mã giới thiệu</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$safeRef}</strong></td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>Vai trò dùng ngay</td><td style='padding:8px;border-bottom:1px solid #eee'>{$approvedText}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>Vai trò chờ duyệt</td><td style='padding:8px;border-bottom:1px solid #eee'>{$pendingText}</td></tr>
        </table>
        <p style='margin:20px 0;text-align:center'>
            <a href='{$loginUrl}' style='background:#c40012;color:#fff;padding:12px 22px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block'>Vào hệ thống</a>
        </p>
    ";
    svp_v1_mail_send($email, 'Tài khoản Sổ Đỏ Vạn Phúc đã được tạo', $body);
}

function svp_v1_notify_admin_role_request(string $fullName, string $email, string $phone, array $roleSlugs): void {
    $safeName = htmlspecialchars($fullName ?: 'Chưa có tên', ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safePhone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
    $labels = array_map(fn($role) => htmlspecialchars(svp_v1_role_label((string) $role), ENT_QUOTES, 'UTF-8'), $roleSlugs);
    $roleText = $labels ? implode(', ', $labels) : 'Không có';
    $adminUrl = htmlspecialchars((defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://sodovanphuc.vn') . '/quan-tri/duyet-vai-tro', ENT_QUOTES, 'UTF-8');

    $body = "
        <h2>Có yêu cầu vai trò cần duyệt</h2>
        <p><strong>{$safeName}</strong> vừa đăng ký/xin thêm vai trò cần quản trị duyệt.</p>
        <table style='border-collapse:collapse;width:100%;margin:16px 0'>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>Email</td><td style='padding:8px;border-bottom:1px solid #eee'>{$safeEmail}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>SĐT</td><td style='padding:8px;border-bottom:1px solid #eee'>{$safePhone}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#777'>Vai trò</td><td style='padding:8px;border-bottom:1px solid #eee'><strong>{$roleText}</strong></td></tr>
        </table>
        <p style='margin:20px 0;text-align:center'>
            <a href='{$adminUrl}' style='background:#c40012;color:#fff;padding:12px 22px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block'>Mở trang duyệt vai trò</a>
        </p>
    ";
    svp_v1_mail_notify_admin('Sổ Đỏ Vạn Phúc: yêu cầu vai trò cần duyệt', $body);
}

function svp_v1_role_name(string $roleSlug): string {
    try {
        return svp_role_display_name_from_config(Database::getInstance(), $roleSlug);
    } catch (Throwable $e) {
        error_log('[SVP_V1_ROLE_NAME_CONFIG] ' . $e->getMessage());
    }

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

function svp_v1_normalize_role_slugs(array $input): array {
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

function svp_v1_generate_svp_id(PDO $db): string {
    $stmt = $db->query("SELECT COUNT(*) as c FROM users WHERE svp_id IS NOT NULL AND svp_id != ''");
    $count = (int) ($stmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
    return 'SVP' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
}

function svp_v1_generate_referral_code(string $svpId): string {
    $digits = preg_replace('/\D+/', '', $svpId) ?: '0';
    return 'SVP' . str_pad(substr($digits, -6), 6, '0', STR_PAD_LEFT) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
}

function svp_v1_lookup_referrer(PDO $db, string $lookup, string $excludeUserId = ''): ?array {
    $lookup = trim($lookup);
    if ($lookup === '') return null;

    $lookupLower = strtolower($lookup);
    $lookupDigits = preg_replace('/\D+/', '', $lookup);
    $whereExclude = $excludeUserId !== '' ? 'AND id <> :exclude_id' : '';
    $stmt = $db->prepare("
        SELECT id, full_name, phone, email, svp_id, referral_code
        FROM users
        WHERE 1 = 1
          {$whereExclude}
          AND (
            LOWER(referral_code) = :where_referral
            OR LOWER(svp_id) = :where_svp
            OR phone = :where_phone
            OR LOWER(email) = :where_email
            OR (:where_digits_guard != '' AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '.', ''), '-', ''), '+', '') = :where_digits)
          )
        ORDER BY
          CASE
            WHEN LOWER(referral_code) = :sort_referral THEN 1
            WHEN LOWER(svp_id) = :sort_svp THEN 2
            WHEN phone = :sort_phone THEN 3
            WHEN :sort_digits_guard != '' AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '.', ''), '-', ''), '+', '') = :sort_digits THEN 4
            WHEN LOWER(email) = :sort_email THEN 5
            ELSE 6
          END,
          created_at DESC
        LIMIT 1
    ");
    $params = [
        'where_referral' => $lookupLower,
        'where_svp' => $lookupLower,
        'where_phone' => $lookup,
        'where_email' => $lookupLower,
        'where_digits_guard' => $lookupDigits,
        'where_digits' => $lookupDigits,
        'sort_referral' => $lookupLower,
        'sort_svp' => $lookupLower,
        'sort_phone' => $lookup,
        'sort_digits_guard' => $lookupDigits,
        'sort_digits' => $lookupDigits,
        'sort_email' => $lookupLower,
    ];
    if ($excludeUserId !== '') {
        $params['exclude_id'] = $excludeUserId;
    }
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function svp_v1_public_referrer_payload(array $row): array {
    $phone = (string) ($row['phone'] ?? '');
    $maskedPhone = $phone !== '' && strlen($phone) >= 7
        ? substr($phone, 0, 4) . '***' . substr($phone, -3)
        : $phone;

    return [
        'id' => (string) ($row['id'] ?? ''),
        'fullName' => (string) ($row['full_name'] ?? ''),
        'svpId' => (string) ($row['svp_id'] ?? ''),
        'phone' => $maskedPhone,
        'referralCode' => (string) ($row['referral_code'] ?? ''),
    ];
}

function svp_v1_get_user_roles(PDO $db, string $userId): array {
    $stmt = $db->prepare("SELECT role_slug, status FROM svp_user_roles WHERE user_id = :uid ORDER BY id ASC");
    $stmt->execute(['uid' => $userId]);
    return array_map(function ($r) {
        return [
            'slug' => $r['role_slug'],
            'name' => svp_v1_role_name($r['role_slug']),
            'status' => $r['status'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function svp_v1_user_payload(array $user, array $roles, string $activeRole = ''): array {
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
        'cccd' => $user['cccd'] ?? '',
        'referralCode' => $user['referral_code'] ?? '',
        'referredBy' => $user['referred_by'] ?? '',
        'profile' => svp_v1_profile_from_user($user),
        'accountStatus' => $user['account_status'] ?? 'active',
        'roles' => $roles,
        'activeRole' => $activeRole,
    ];
}

function svp_v1_login_payload(array $user, array $roles): array {
    $approved = array_values(array_filter($roles, fn($r) => ($r['status'] ?? '') === 'approved'));
    $pending = array_values(array_filter($roles, fn($r) => ($r['status'] ?? '') === 'pending'));
    $activeRole = $approved[0]['slug'] ?? '';
    $userPayload = svp_v1_user_payload($user, $roles, $activeRole);

    if (empty($approved)) {
        return [
            'status' => 403,
            'data' => [
                'error' => 'Tài khoản đang chờ phê duyệt',
                'message' => 'Tài khoản đang chờ phê duyệt',
                'user' => $userPayload,
                'pendingRoles' => $pending,
                'requiresApproval' => true,
                'accountStatus' => 'cho_phe_duyet',
            ],
        ];
    }

    try {
        $token = JwtAuth::createToken([
            'sub' => $user['id'],
            'email' => $user['email'],
            'fullName' => $user['full_name'],
            'roles' => $roles,
            'role' => $activeRole,
        ]);
    } catch (Throwable $e) {
        error_log('SVP V1 auth token error: ' . $e->getMessage());
        Response::error('May chu chua san sang tao phien dang nhap. Vui long lien he quan tri vien.', 503);
    }

    return [
        'status' => 200,
        'data' => [
            'token' => $token,
            'user' => $userPayload,
            'approvedRoles' => $approved,
            'pendingRoles' => $pending,
            'requiresApproval' => !empty($pending),
            'accountStatus' => !empty($pending) ? 'duoc_dung_ngay_va_cho_duyet' : 'duoc_dung_ngay',
        ],
    ];
}

$router->add('POST', '/api/svp/auth/register', function () {
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    svp_v1_ensure_profile_columns($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $password = trim($input['password'] ?? '');
    $roleSlugs = svp_v1_normalize_role_slugs($input);
    $roleSlugs = array_values(array_filter($roleSlugs, fn($role) => $role !== 'admin'));
    $referralCode = trim($input['referralCode'] ?? $input['referral_code'] ?? '');

    if (!$fullName || !$email || !$phone || !$password || empty($roleSlugs)) {
        Response::error('Vui lòng điền đầy đủ thông tin đăng ký', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Email chưa đúng định dạng', 400);
    }
    if (strlen($password) < 6) {
        Response::error('Mật khẩu cần tối thiểu 6 ký tự', 400);
    }

    foreach ($roleSlugs as $roleSlug) {
        if (!svp_role_registration_enabled_from_config($db, $roleSlug)) {
            Response::error('Vai trò "' . svp_role_display_name_from_config($db, $roleSlug) . '" đang tạm ẩn khỏi đăng ký.', 400);
        }
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email OR phone = :phone LIMIT 1");
    $stmt->execute(['email' => $email, 'phone' => $phone]);
    if ($stmt->fetch()) Response::error('Email hoặc số điện thoại đã được sử dụng', 409);

    $userId = bin2hex(random_bytes(16));
    $svpId = svp_v1_generate_svp_id($db);
    $refCode = svp_v1_generate_referral_code($svpId);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare("INSERT INTO users (id, full_name, email, phone, password_hash, svp_id, referral_code, created_at) VALUES (:id, :fn, :email, :phone, :pw, :svpId, :ref, NOW())");
    $stmt->execute([
        'id' => $userId,
        'fn' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'pw' => $hash,
        'svpId' => $svpId,
        'ref' => $refCode,
    ]);

    foreach ($roleSlugs as $roleSlug) {
        $status = svp_v1_role_requires_approval($roleSlug) ? 'pending' : 'approved';
        $db->prepare("INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_at) VALUES (:uid, :role, :status, NOW(), :approvedAt)")
           ->execute([
               'uid' => $userId,
               'role' => $roleSlug,
               'status' => $status,
               'approvedAt' => $status === 'approved' ? date('Y-m-d H:i:s') : null,
           ]);

        if ($status === 'pending') {
            $db->prepare("INSERT INTO svp_role_applications (user_id, role_slug, status, created_at) VALUES (:uid, :role, 'pending', NOW())")
               ->execute(['uid' => $userId, 'role' => $roleSlug]);
        }
    }

    if ($referralCode) {
        $referrer = svp_v1_lookup_referrer($db, $referralCode, $userId);
        if ($referrer) {
            $refId = bin2hex(random_bytes(16));
            $db->prepare("INSERT INTO svp_referrals (id, referrer_user_id, referred_user_id, referral_code, referral_type, status) VALUES (:id, :ruid, :uid, :code, 'other', 'new')")
               ->execute(['id' => $refId, 'ruid' => $referrer['id'], 'uid' => $userId, 'code' => $referrer['referral_code'] ?: $referralCode]);
            $db->prepare("UPDATE users SET referred_by = :ref WHERE id = :id")->execute(['ref' => $referrer['id'], 'id' => $userId]);
        }
    }

    $user = [
        'id' => $userId,
        'svp_id' => $svpId,
        'email' => $email,
        'phone' => $phone,
        'full_name' => $fullName,
        'avatar_url' => '',
        'cccd' => '',
        'profile_json' => null,
        'referral_code' => $refCode,
    ];
    $roles = svp_v1_get_user_roles($db, $userId);
    svp_v1_send_registration_email($email, $fullName, $svpId, $refCode, $roles);

    $pendingRoleSlugs = array_values(array_map(
        fn($role) => (string) ($role['slug'] ?? ''),
        array_filter($roles, fn($role) => ($role['status'] ?? '') === 'pending')
    ));
    if ($pendingRoleSlugs) {
        svp_v1_notify_admin_role_request($fullName, $email, $phone, $pendingRoleSlugs);
    }

    $auth = svp_v1_login_payload($user, $roles);
    $data = $auth['data'];
    $data['message'] = $auth['status'] === 200
        ? 'Đăng ký thành công'
        : 'Đăng ký thành công, tài khoản đang chờ phê duyệt';

    Response::json($data, 201);
});

$router->add('GET', '/api/svp/auth/referrer-lookup', function () {
    $db = Database::getInstance();
    $lookup = trim((string) ($_GET['lookup'] ?? $_GET['q'] ?? ''));
    if ($lookup === '' || strlen($lookup) < 3) {
        Response::error('Nhập mã, số điện thoại hoặc email người giới thiệu', 400);
    }

    $referrer = svp_v1_lookup_referrer($db, $lookup);
    if (!$referrer) Response::notFound('Không tìm thấy người giới thiệu phù hợp');

    Response::json(['item' => svp_v1_public_referrer_payload($referrer)]);
});

$router->add('POST', '/api/svp/auth/login', function () {
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    svp_v1_ensure_profile_columns($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $identifier = svp_v1_input_string($input, 'email', 'identifier');
    $password = svp_v1_input_string($input, 'password');

    if (!$identifier || !$password) Response::error('Vui lòng nhập email/số điện thoại và mật khẩu', 400);

    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email OR phone = :phone LIMIT 1");
    $stmt->execute(['email' => $identifier, 'phone' => $identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $isAdminAlias = defined('ADMIN_USERNAME') && hash_equals((string) ADMIN_USERNAME, $identifier);
    if (!$user && $isAdminAlias) {
        $stmt = $db->query(
            "SELECT u.*
             FROM users u
             LEFT JOIN svp_user_roles r ON r.user_id = u.id AND r.role_slug = 'admin'
             WHERE u.email = 'admin@sodovanphuc.vn' OR r.role_slug = 'admin'
             ORDER BY CASE WHEN u.email = 'admin@sodovanphuc.vn' THEN 0 ELSE 1 END, u.created_at ASC
             LIMIT 1"
        );
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $storedHash = is_array($user) ? (string)($user['password_hash'] ?? '') : '';
    $passwordMatches = is_array($user) && svp_v1_password_matches($password, $storedHash);
    if (!$passwordMatches && $isAdminAlias && defined('ADMIN_PASSWORD_HASH') && function_exists('gfz_verify_admin_password')) {
        $passwordMatches = gfz_verify_admin_password($password, (string) ADMIN_PASSWORD_HASH);
    }

    if (!$user || !$passwordMatches) {
        Response::error('Email, số điện thoại hoặc mật khẩu không đúng', 401);
    }
    if (svp_v1_user_is_locked($user)) {
        Response::error('Tài khoản đang tạm khóa. Vui lòng liên hệ quản trị viên.', 423);
    }

    $roles = svp_v1_get_user_roles($db, $user['id']);
    $auth = svp_v1_login_payload($user, $roles);
    Response::json($auth['data'], $auth['status']);
});

$router->add('GET', '/api/svp/auth/me', function () {
    $payload = svp_v1_auth_require();
    $db = Database::getInstance();
    svp_v1_ensure_account_status_column($db);
    svp_v1_ensure_profile_columns($db);

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::error('Người dùng không tồn tại', 404);
    if (svp_v1_user_is_locked($user)) {
        Response::error('Tài khoản đang tạm khóa. Vui lòng liên hệ quản trị viên.', 423);
    }

    $roles = svp_v1_get_user_roles($db, $user['id']);
    Response::json(['user' => svp_v1_user_payload($user, $roles, $payload['role'] ?? '')]);
});

$router->add('PATCH', '/api/svp/auth/profile', function () {
    $payload = svp_v1_auth_require();
    $db = Database::getInstance();
    svp_v1_ensure_profile_columns($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::error('Nguoi dung khong ton tai', 404);

    $oldProfile = svp_v1_profile_from_user($user);
    $nextProfile = $oldProfile;
    $allowed = ['hasCertificate', 'certificateUrl', 'address', 'educationLevel', 'bio', 'bankInfo'];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $input)) {
            $nextProfile[$key] = $input[$key];
        }
    }

    $cccd = trim((string) ($input['cccd'] ?? $input['profile']['cccd'] ?? $oldProfile['cccd'] ?? ''));
    $nextProfile['cccd'] = $cccd;

    $db->prepare("UPDATE users SET cccd = :cccd, profile_json = :profile WHERE id = :id")
       ->execute([
           'cccd' => $cccd,
           'profile' => svp_json_encode($nextProfile),
           'id' => $payload['sub'],
       ]);

    $stmt->execute(['id' => $payload['sub']]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);
    $roles = svp_v1_get_user_roles($db, $payload['sub']);
    svp_insert_audit($db, $payload['sub'], 'update', 'user_profile', $payload['sub'], $oldProfile, $nextProfile);

    Response::json(['message' => 'Da luu ho so', 'user' => svp_v1_user_payload($updated, $roles, $payload['role'] ?? '')]);
});

$router->add('POST', '/api/svp/auth/certificate', function () {
    $payload = svp_v1_auth_require();
    $db = Database::getInstance();
    svp_v1_ensure_profile_columns($db);
    if (empty($_FILES['certificate'])) Response::error('Vui long chon anh chung chi', 400);

    $urls = Upload::handleUpload($_FILES['certificate']);
    $url = $urls[0] ?? '';
    if ($url === '') Response::error('Khong tai duoc anh chung chi', 400);

    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $payload['sub']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::error('Nguoi dung khong ton tai', 404);

    $profile = svp_v1_profile_from_user($user);
    $oldProfile = $profile;
    $profile['hasCertificate'] = true;
    $profile['certificateUrl'] = $url;

    $db->prepare("UPDATE users SET profile_json = :profile WHERE id = :id")
       ->execute(['profile' => svp_json_encode($profile), 'id' => $payload['sub']]);
    svp_insert_audit($db, $payload['sub'], 'upload', 'user_certificate', $payload['sub'], $oldProfile, $profile);

    Response::json(['certificateUrl' => $url, 'profile' => $profile]);
});

$router->add('POST', '/api/svp/auth/change-password', function () {
    $payload = svp_v1_auth_require();
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

$svpV1AvatarHandler = function () {
    $payload = svp_v1_auth_require();
    $db = Database::getInstance();
    if (empty($_FILES['avatar'])) Response::error('Vui lòng chọn ảnh', 400);
    $url = Upload::handleAvatarUpload($_FILES['avatar']);
    $db->prepare("UPDATE users SET avatar_url = :url WHERE id = :id")->execute(['url' => $url, 'id' => $payload['sub']]);
    Response::json(['avatar' => $url]);
};

$router->add('POST', '/api/svp/auth/avatar', $svpV1AvatarHandler);
$router->add('POST', '/api/svp/auth/upload-avatar', $svpV1AvatarHandler);

$router->add('POST', '/api/svp/auth/register-role', function () {
    $payload = svp_v1_auth_require();
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $roleSlug = svp_v1_normalize_role_slugs(['role_slug' => $input['roleSlug'] ?? $input['role_slug'] ?? ''])[0] ?? '';
    $reason = trim($input['reason'] ?? '');

    if (!$roleSlug) Response::error('Vui lòng chọn vai trò', 400);
    if ($roleSlug === 'admin') Response::error('Vai trò quản trị cần được cấp bởi quản trị viên hiện hữu', 403);
    if (!svp_role_registration_enabled_from_config($db, $roleSlug)) {
        Response::error('Vai trò "' . svp_role_display_name_from_config($db, $roleSlug) . '" đang tạm ẩn khỏi đăng ký.', 400);
    }

    $stmt = $db->prepare("SELECT id FROM svp_user_roles WHERE user_id = :uid AND role_slug = :role LIMIT 1");
    $stmt->execute(['uid' => $payload['sub'], 'role' => $roleSlug]);
    if ($stmt->fetch()) Response::error('Bạn đã có vai trò này', 409);

    $status = svp_v1_role_requires_approval($roleSlug) ? 'pending' : 'approved';
    $db->prepare("INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_at) VALUES (:uid, :role, :status, NOW(), :approvedAt)")
       ->execute([
           'uid' => $payload['sub'],
           'role' => $roleSlug,
           'status' => $status,
           'approvedAt' => $status === 'approved' ? date('Y-m-d H:i:s') : null,
       ]);

    if ($status === 'pending') {
        $db->prepare("INSERT INTO svp_role_applications (user_id, role_slug, status, reason, created_at) VALUES (:uid, :role, 'pending', :reason, NOW())")
           ->execute(['uid' => $payload['sub'], 'role' => $roleSlug, 'reason' => $reason]);
    }

    $userStmt = $db->prepare("SELECT full_name, email, phone FROM users WHERE id = :id LIMIT 1");
    $userStmt->execute(['id' => $payload['sub']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    if ($status === 'pending') {
        svp_v1_notify_admin_role_request(
            (string) ($user['full_name'] ?? ''),
            (string) ($user['email'] ?? ''),
            (string) ($user['phone'] ?? ''),
            [$roleSlug]
        );
    } elseif (!empty($user['email'])) {
        $roleLabel = htmlspecialchars(svp_v1_role_label($roleSlug), ENT_QUOTES, 'UTF-8');
        svp_v1_mail_send((string) $user['email'], 'Vai trò mới đã được mở trên Sổ Đỏ Vạn Phúc', "
            <h2>Vai trò đã được kích hoạt</h2>
            <p>Vai trò <strong>{$roleLabel}</strong> đã được mở cho tài khoản của anh/chị.</p>
            <p>Anh/chị có thể đăng nhập và chọn vai trò này để sử dụng ngay.</p>
        ");
    }

    Response::json(['message' => $status === 'approved' ? 'Đã thêm vai trò' : 'Đã gửi yêu cầu thêm vai trò']);
});

$router->add('POST', '/api/svp/auth/forgot-password', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = strtolower(trim($input['email'] ?? ''));

    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = $db->prepare("SELECT id, full_name FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            $db->prepare("UPDATE users SET reset_token = :token, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = :id")
               ->execute(['token' => $token, 'id' => $user['id']]);
            $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'sodovanphuc.vn';
            $resetUrl = "{$scheme}://{$host}/reset-password?token={$token}&email=" . urlencode($email);
            $name = htmlspecialchars($user['full_name'] ?: 'anh/chị', ENT_QUOTES, 'UTF-8');
            $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');
            $body = "<h2>Đặt lại mật khẩu Sổ Đỏ Vạn Phúc</h2><p>Xin chào <strong>{$name}</strong>,</p><p>Anh/chị vừa yêu cầu đặt lại mật khẩu. Vui lòng bấm liên kết bên dưới để tạo mật khẩu mới.</p><p><a href='{$safeUrl}'>Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 1 giờ.</p>";
            Mailer::send($email, 'Đặt lại mật khẩu Sổ Đỏ Vạn Phúc', $body);
        }
    }

    Response::json(['message' => 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu']);
});

$router->add('POST', '/api/svp/auth/reset-password', function () {
    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $token = trim($input['token'] ?? '');
    $newPassword = trim($input['newPassword'] ?? $input['new_password'] ?? $input['password'] ?? '');

    if (!$token || !$newPassword) Response::error('Thông tin không hợp lệ', 400);
    if (strlen($newPassword) < 6) Response::error('Mật khẩu cần tối thiểu 6 ký tự', 400);

    $stmt = $db->prepare("SELECT id FROM users WHERE reset_token = :token AND reset_token_expires > NOW() LIMIT 1");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $db->prepare("UPDATE users SET password_hash = :pw, reset_token = NULL, reset_token_expires = NULL WHERE id = :id")
       ->execute(['pw' => $hash, 'id' => $user['id']]);
    Response::json(['message' => 'Đặt lại mật khẩu thành công']);
});
