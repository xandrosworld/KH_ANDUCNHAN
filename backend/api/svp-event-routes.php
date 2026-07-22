<?php
/** Event CMS, event registration and shared brand assets. */

function svp_event_sections_default(): array
{
    return [
        [
            'key' => 'introduction',
            'title' => 'Làm đúng để đi xa',
            'body' => 'Nghề môi giới bất động sản có thể mang lại thu nhập cao. Để phát triển lâu dài, người làm nghề cần kết hợp kỹ năng, bản lĩnh, hiểu đúng pháp luật, tuân thủ quy định và xây dựng phương pháp làm việc minh bạch.',
        ],
        [
            'key' => 'audience',
            'title' => 'Sự kiện dành cho ai?',
            'items' => [
                'Anh chị em đang làm nghề môi giới bất động sản.',
                'Người đang tìm hiểu và muốn bước vào nghề.',
                'Người muốn nâng cao thu nhập nhưng vẫn tuân thủ đầy đủ quy định pháp luật.',
                'Người muốn xây dựng sự nghiệp chuyên nghiệp, minh bạch và lâu dài.',
                'Người muốn thích nghi và phát triển qua những giai đoạn biến động của thị trường.',
            ],
        ],
        [
            'key' => 'speaker',
            'title' => 'Người chia sẻ',
            'body' => 'Với 10 năm lãnh đạo và phát triển Vạn Phúc trong nhóm đơn vị có kết quả kinh doanh bền vững, Mr Ân Đức Nhân đã trực tiếp đào tạo, định hướng và đồng hành cùng nhiều thế hệ môi giới. Nhiều thành viên từ điểm xuất phát chưa biết nghề đã từng bước xây dựng phương pháp làm việc đúng đắn, rèn luyện nghiêm túc và đạt kết quả nổi bật.',
        ],
        [
            'key' => 'company',
            'title' => 'Về Sổ Đỏ',
            'body' => 'Sổ Đỏ hướng tới mô hình môi giới bất động sản chuyên nghiệp, minh bạch, tuân thủ pháp luật và phát triển bền vững. Hệ thống quy tụ đội ngũ giàu kinh nghiệm, cơ chế hợp tác rõ ràng cùng hoạt động đào tạo và hỗ trợ nâng cao năng lực.',
        ],
        [
            'key' => 'agenda',
            'title' => 'Nội dung chia sẻ',
            'items' => [
                'Làm nghề môi giới như thế nào để đúng pháp luật.',
                'Những điều cần hiểu về hợp đồng, hoa hồng và nghĩa vụ thuế.',
                'Sự khác biệt giữa làm nghề tự phát và làm nghề chuyên nghiệp trong một doanh nghiệp dịch vụ môi giới hoặc sàn giao dịch bất động sản.',
                'Những sai lầm có thể dẫn đến rủi ro pháp lý và tài chính.',
                'Bản đồ xây dựng năng lực để nâng cao thu nhập chính đáng.',
                'Con đường phát triển từ người chưa biết nghề đến người có kết quả tốt.',
                'Cách tồn tại, thích nghi và phát triển trong giai đoạn thị trường khó khăn.',
                'Tư duy xây dựng sự nghiệp môi giới bền vững trong thời đại ứng dụng dữ liệu và trí tuệ nhân tạo.',
            ],
        ],
        [
            'key' => 'benefits',
            'title' => 'Giá trị nhận được',
            'items' => [
                'Nhìn rõ hơn con đường nghề nghiệp và các yêu cầu tuân thủ.',
                'Biết những nhóm năng lực cần rèn luyện để cải thiện thu nhập.',
                'Tiếp cận tài liệu, nội dung hữu ích và thông báo chương trình trong nhóm Zalo.',
                'Nhận lịch chính thức cùng đường dẫn phòng Zoom từ Ban Tổ chức.',
            ],
        ],
        [
            'key' => 'closing',
            'title' => 'Làm đúng để đi xa',
            'body' => 'Có năng lực để thu nhập cao. Có đạo đức và kỷ luật để phát triển bền vững.',
        ],
    ];
}

function svp_ensure_events_schema(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS svp_events (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      slug VARCHAR(180) NOT NULL,
      title VARCHAR(255) NOT NULL,
      eyebrow VARCHAR(255) DEFAULT NULL,
      summary TEXT DEFAULT NULL,
      speaker_name VARCHAR(180) DEFAULT NULL,
      speaker_title TEXT DEFAULT NULL,
      format_label VARCHAR(180) DEFAULT NULL,
      schedule_label VARCHAR(255) DEFAULT NULL,
      cta_label VARCHAR(180) DEFAULT NULL,
      banner_url VARCHAR(1000) DEFAULT NULL,
      content_json LONGTEXT DEFAULT NULL,
      status ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
      registration_status ENUM('open','closed') NOT NULL DEFAULT 'open',
      published_at DATETIME DEFAULT NULL,
      created_by VARCHAR(64) DEFAULT NULL,
      updated_by VARCHAR(64) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_svp_events_slug (slug),
      INDEX idx_svp_events_status (status, registration_status, published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS svp_event_registrations (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      event_id VARCHAR(64) NOT NULL,
      event_slug VARCHAR(180) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      care_status ENUM('new','contacted','confirmed','joined_group','converted','declined') NOT NULL DEFAULT 'new',
      utm_source VARCHAR(180) DEFAULT NULL,
      utm_medium VARCHAR(180) DEFAULT NULL,
      utm_campaign VARCHAR(180) DEFAULT NULL,
      utm_content VARCHAR(180) DEFAULT NULL,
      utm_term VARCHAR(180) DEFAULT NULL,
      referrer_url VARCHAR(1000) DEFAULT NULL,
      registration_url VARCHAR(1000) DEFAULT NULL,
      note TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      UNIQUE KEY uq_svp_event_user (event_id, user_id),
      INDEX idx_svp_event_reg_status (event_id, care_status, created_at),
      INDEX idx_svp_event_reg_utm (utm_source, utm_campaign)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    try {
        $db->exec("ALTER TABLE svp_event_registrations ADD COLUMN event_slug VARCHAR(180) NOT NULL DEFAULT '' AFTER event_id");
        $db->exec("UPDATE svp_event_registrations r JOIN svp_events e ON e.id = r.event_id SET r.event_slug = e.slug WHERE r.event_slug = ''");
    } catch (Throwable $e) {
        // The column already exists on current installations.
    }

    $stmt = $db->prepare("INSERT INTO svp_events
      (id, slug, title, eyebrow, summary, speaker_name, speaker_title, format_label, schedule_label, cta_label, banner_url, content_json, status, registration_status)
      VALUES
      ('event_lam_nghe_moi_gioi_dung_luat', 'lam-nghe-moi-gioi-dung-luat', :title, :eyebrow, :summary, :speaker, :speaker_title, :format_label, :schedule_label, :cta, :banner, :content, 'draft', 'open')
      ON DUPLICATE KEY UPDATE slug = VALUES(slug)");
    $stmt->execute([
        'title' => 'Làm Nghề Môi Giới Đúng Luật - Thu Nhập Cao - Phát Triển Bền Vững',
        'eyebrow' => 'Sự kiện chia sẻ online hoàn toàn miễn phí',
        'summary' => 'Bí quyết xây dựng sự nghiệp môi giới chuyên nghiệp, minh bạch và bền vững trong thời đại mới.',
        'speaker' => 'Mr Ân Đức Nhân',
        'speaker_title' => "Giám đốc Vạn Phúc - Sổ Đỏ\nGiám đốc Phát triển Nhân lực - Sổ Đỏ Miền Nam",
        'format_label' => 'Online qua Zoom - Miễn phí',
        'schedule_label' => 'Lịch chính thức sẽ được thông báo trong nhóm Zalo',
        'cta' => 'Đăng ký tham dự miễn phí',
        'banner' => '/assets/events/lam-nghe-moi-gioi-dung-luat.png',
        'content' => svp_json_encode([
            'sections' => svp_event_sections_default(),
            'disclaimer' => 'Nội dung chương trình mang tính chia sẻ kinh nghiệm và thông tin chung, không thay thế tư vấn pháp lý hoặc tư vấn thuế chuyên biệt cho từng trường hợp.',
        ]),
    ]);
}

function svp_event_to_response(array $row): array
{
    $content = svp_json_decode($row['content_json'] ?? null, []);
    return [
        'id' => (string) $row['id'],
        'slug' => (string) $row['slug'],
        'title' => (string) $row['title'],
        'eyebrow' => (string) ($row['eyebrow'] ?? ''),
        'summary' => (string) ($row['summary'] ?? ''),
        'speakerName' => (string) ($row['speaker_name'] ?? ''),
        'speakerTitle' => (string) ($row['speaker_title'] ?? ''),
        'formatLabel' => (string) ($row['format_label'] ?? ''),
        'scheduleLabel' => (string) ($row['schedule_label'] ?? ''),
        'ctaLabel' => (string) ($row['cta_label'] ?? 'Đăng ký tham dự'),
        'bannerUrl' => (string) ($row['banner_url'] ?? ''),
        'sections' => is_array($content['sections'] ?? null) ? $content['sections'] : [],
        'disclaimer' => (string) ($content['disclaimer'] ?? ''),
        'status' => (string) ($row['status'] ?? 'draft'),
        'registrationStatus' => (string) ($row['registration_status'] ?? 'open'),
        'publishedAt' => $row['published_at'] ?? null,
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function svp_event_registration_source(array $input): array
{
    return [
        'utm_source' => trim((string) ($input['utmSource'] ?? $input['utm_source'] ?? '')) ?: null,
        'utm_medium' => trim((string) ($input['utmMedium'] ?? $input['utm_medium'] ?? '')) ?: null,
        'utm_campaign' => trim((string) ($input['utmCampaign'] ?? $input['utm_campaign'] ?? '')) ?: null,
        'utm_content' => trim((string) ($input['utmContent'] ?? $input['utm_content'] ?? '')) ?: null,
        'utm_term' => trim((string) ($input['utmTerm'] ?? $input['utm_term'] ?? '')) ?: null,
        'referrer_url' => substr(trim((string) ($input['referrerUrl'] ?? $input['referrer_url'] ?? '')), 0, 1000) ?: null,
        'registration_url' => substr(trim((string) ($input['registrationUrl'] ?? $input['registration_url'] ?? '')), 0, 1000) ?: null,
    ];
}

function svp_event_find(PDO $db, string $idOrSlug, bool $publicOnly = false): ?array
{
    $sql = 'SELECT * FROM svp_events WHERE (id = :id OR slug = :slug)';
    if ($publicOnly) $sql .= " AND status = 'published'";
    $sql .= ' LIMIT 1';
    $stmt = $db->prepare($sql);
    $stmt->execute(['id' => $idOrSlug, 'slug' => $idOrSlug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function svp_event_create_registration(PDO $db, array $event, string $userId, array $source): array
{
    if (($event['registration_status'] ?? '') !== 'open') {
        Response::error('Sự kiện đã đóng đăng ký.', 409);
    }
    $id = svp_uid('eventreg');
    $stmt = $db->prepare("INSERT INTO svp_event_registrations
      (id, event_id, event_slug, user_id, care_status, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer_url, registration_url)
      VALUES (:id, :event_id, :event_slug, :user_id, 'new', :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term, :referrer_url, :registration_url)");
    $stmt->execute(array_merge($source, ['id' => $id, 'event_id' => $event['id'], 'event_slug' => $event['slug'], 'user_id' => $userId]));
    return ['id' => $id, 'eventId' => $event['id'], 'userId' => $userId, 'careStatus' => 'new'];
}

$router->add('GET', '/api/svp/events', function () {
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $rows = $db->query("SELECT * FROM svp_events WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC")->fetchAll(PDO::FETCH_ASSOC);
    Response::json(['items' => array_map('svp_event_to_response', $rows), 'total' => count($rows)]);
});

$router->add('GET', '/api/svp/events/{slug}', function ($params) {
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $row = svp_event_find($db, (string) $params['slug'], true);
    if (!$row) Response::notFound('Không tìm thấy sự kiện.');
    Response::json(['item' => svp_event_to_response($row)]);
});

$router->add('POST', '/api/svp/events/{slug}/register', function ($params) {
    $payload = svp_auth_require();
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $event = svp_event_find($db, (string) $params['slug'], true);
    if (!$event) Response::notFound('Không tìm thấy sự kiện.');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    try {
        $registration = svp_event_create_registration($db, $event, (string) $payload['sub'], svp_event_registration_source($input));
    } catch (PDOException $e) {
        if ((string) $e->getCode() === '23000') Response::error('Bạn đã đăng ký sự kiện này.', 409);
        throw $e;
    }
    svp_insert_audit($db, (string) $payload['sub'], 'register', 'event_registration', $registration['id'], null, $registration);
    Response::json(['message' => 'Đăng ký tham dự thành công.', 'registration' => $registration], 201);
});

$router->add('POST', '/api/svp/events/{slug}/register-new', function ($params) {
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $event = svp_event_find($db, (string) $params['slug'], true);
    if (!$event) Response::notFound('Không tìm thấy sự kiện.');
    if (($event['registration_status'] ?? '') !== 'open') Response::error('Sự kiện đã đóng đăng ký.', 409);

    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fullName = trim((string) ($input['fullName'] ?? $input['full_name'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? ''));
    $password = (string) ($input['password'] ?? '');
    $roleSlugs = svp_v1_normalize_role_slugs($input);
    $roleSlugs = array_values(array_filter($roleSlugs, fn($role) => !in_array($role, ['admin_tong', 'admin'], true)));
    $referralCode = trim((string) ($input['referralCode'] ?? $input['referral_code'] ?? ''));

    if (($input['acceptedTerms'] ?? false) !== true) {
        Response::error('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.', 400);
    }

    if (!$fullName || !$email || !$phone || strlen($password) < 6 || empty($roleSlugs)) {
        Response::error('Vui lòng điền đầy đủ họ tên, điện thoại, email, mật khẩu và ít nhất một nhu cầu/vai trò.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Email chưa đúng định dạng.', 400);
    foreach ($roleSlugs as $roleSlug) {
        if (!svp_role_registration_enabled_from_config($db, $roleSlug)) Response::error('Vai trò đã chọn hiện không mở đăng ký.', 400);
    }
    $check = $db->prepare('SELECT id FROM users WHERE email = :email OR phone = :phone LIMIT 1');
    $check->execute(['email' => $email, 'phone' => $phone]);
    if ($check->fetch()) Response::error('Email hoặc số điện thoại đã tồn tại. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.', 409);

    $db->beginTransaction();
    try {
        $userId = bin2hex(random_bytes(16));
        $svpId = svp_v1_generate_svp_id($db);
        $refCode = svp_v1_generate_referral_code($svpId);
        $db->prepare('INSERT INTO users (id, full_name, email, phone, password_hash, svp_id, referral_code, created_at) VALUES (:id, :name, :email, :phone, :password, :svp_id, :referral_code, NOW())')->execute([
            'id' => $userId, 'name' => $fullName, 'email' => $email, 'phone' => $phone,
            'password' => password_hash($password, PASSWORD_DEFAULT), 'svp_id' => $svpId, 'referral_code' => $refCode,
        ]);
        foreach ($roleSlugs as $roleSlug) {
            $status = svp_v1_role_requires_approval($roleSlug) ? 'pending' : 'approved';
            $db->prepare('INSERT INTO svp_user_roles (user_id, role_slug, status, applied_at, approved_at) VALUES (:user_id, :role_slug, :status, NOW(), :approved_at)')->execute([
                'user_id' => $userId, 'role_slug' => $roleSlug, 'status' => $status,
                'approved_at' => $status === 'approved' ? date('Y-m-d H:i:s') : null,
            ]);
            if ($status === 'pending') {
                $db->prepare("INSERT INTO svp_role_applications (user_id, role_slug, status, reason, created_at) VALUES (:user_id, :role_slug, 'pending', :reason, NOW())")->execute([
                    'user_id' => $userId, 'role_slug' => $roleSlug, 'reason' => 'Đăng ký từ sự kiện ' . $event['title'],
                ]);
            }
        }
        if ($referralCode !== '') {
            $referrer = svp_v1_lookup_referrer($db, $referralCode, $userId);
            if (!$referrer) throw new RuntimeException('Không tìm thấy người giới thiệu đã chọn.');
            $db->prepare("INSERT INTO svp_referrals (id, referrer_user_id, referred_user_id, referral_code, referral_type, status) VALUES (:id, :referrer, :referred, :code, 'other', 'new')")->execute([
                'id' => bin2hex(random_bytes(16)), 'referrer' => $referrer['id'], 'referred' => $userId,
                'code' => $referrer['referral_code'] ?: $referralCode,
            ]);
            $db->prepare('UPDATE users SET referred_by = :referrer WHERE id = :id')->execute(['referrer' => $referrer['id'], 'id' => $userId]);
        }
        $registration = svp_event_create_registration($db, $event, $userId, svp_event_registration_source($input));
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e instanceof RuntimeException) Response::error($e->getMessage(), 400);
        throw $e;
    }

    $roles = svp_v1_get_user_roles($db, $userId);
    svp_v1_send_registration_email($email, $fullName, $svpId, $refCode, $roles);
    Mailer::send($email, 'Đăng ký sự kiện thành công - ' . $event['title'], '<h2>Đăng ký tham dự thành công</h2><p>Xin chào <strong>' . htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8') . '</strong>,</p><p>Ban Tổ chức đã ghi nhận đăng ký của bạn cho sự kiện <strong>' . htmlspecialchars($event['title'], ENT_QUOTES, 'UTF-8') . '</strong>.</p><p>Lịch chính thức và đường dẫn Zoom sẽ được thông báo trong nhóm Zalo.</p>');
    svp_insert_audit($db, $userId, 'register', 'event_registration', $registration['id'], null, array_merge($registration, ['eventSlug' => $event['slug']]));
    $auth = svp_v1_login_payload([
        'id' => $userId, 'svp_id' => $svpId, 'email' => $email, 'phone' => $phone, 'full_name' => $fullName,
        'avatar_url' => '', 'cccd' => '', 'profile_json' => null, 'referral_code' => $refCode,
    ], $roles);
    $data = $auth['data'];
    $data['message'] = 'Đăng ký tài khoản và sự kiện thành công.';
    $data['registration'] = $registration;
    Response::json($data, 201);
});

$router->add('GET', '/api/svp/admin/events', function () {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $rows = $db->query('SELECT e.*, (SELECT COUNT(*) FROM svp_event_registrations r WHERE r.event_id = e.id AND r.deleted_at IS NULL) registration_count FROM svp_events e ORDER BY e.created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(function ($row) {
        $item = svp_event_to_response($row);
        $item['registrationCount'] = (int) ($row['registration_count'] ?? 0);
        return $item;
    }, $rows);
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('GET', '/api/svp/admin/events/{id}', function ($params) {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $row = svp_event_find($db, (string) $params['id']);
    if (!$row) Response::notFound('Không tìm thấy sự kiện.');
    Response::json(['item' => svp_event_to_response($row)]);
});

$router->add('POST', '/api/svp/admin/events', function () {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $title = trim((string) ($input['title'] ?? ''));
    $slug = preg_replace('/[^a-z0-9-]/', '', strtolower(trim((string) ($input['slug'] ?? ''))));
    if ($title === '' || $slug === '') Response::error('Tiêu đề và slug là bắt buộc.', 400);
    $id = svp_uid('event');
    $stmt = $db->prepare("INSERT INTO svp_events (id, slug, title, eyebrow, summary, speaker_name, speaker_title, format_label, schedule_label, cta_label, banner_url, content_json, status, registration_status, created_by, updated_by) VALUES (:id, :slug, :title, :eyebrow, :summary, :speaker, :speaker_title, :format_label, :schedule_label, :cta, :banner, :content, 'draft', 'open', :actor, :actor)");
    $stmt->execute([
        'id' => $id, 'slug' => $slug, 'title' => $title, 'eyebrow' => trim((string) ($input['eyebrow'] ?? '')),
        'summary' => trim((string) ($input['summary'] ?? '')), 'speaker' => trim((string) ($input['speakerName'] ?? '')),
        'speaker_title' => trim((string) ($input['speakerTitle'] ?? '')), 'format_label' => trim((string) ($input['formatLabel'] ?? '')),
        'schedule_label' => trim((string) ($input['scheduleLabel'] ?? '')), 'cta' => trim((string) ($input['ctaLabel'] ?? 'Đăng ký tham dự')),
        'banner' => trim((string) ($input['bannerUrl'] ?? '')), 'content' => svp_json_encode(['sections' => $input['sections'] ?? [], 'disclaimer' => $input['disclaimer'] ?? '']),
        'actor' => (string) $payload['sub'],
    ]);
    $row = svp_event_find($db, $id);
    svp_insert_audit($db, (string) $payload['sub'], 'create', 'event', $id, null, $row);
    Response::json(['item' => svp_event_to_response($row)], 201);
});

$router->add('PUT', '/api/svp/admin/events/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $old = svp_event_find($db, (string) $params['id']);
    if (!$old) Response::notFound('Không tìm thấy sự kiện.');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $status = (string) ($input['status'] ?? $old['status']);
    $registrationStatus = (string) ($input['registrationStatus'] ?? $old['registration_status']);
    if (!in_array($status, ['draft','published','hidden','archived'], true)) Response::error('Trạng thái sự kiện không hợp lệ.', 400);
    if (!in_array($registrationStatus, ['open','closed'], true)) Response::error('Trạng thái đăng ký không hợp lệ.', 400);
    $content = [
        'sections' => array_key_exists('sections', $input) ? $input['sections'] : (svp_json_decode($old['content_json'] ?? null, [])['sections'] ?? []),
        'disclaimer' => array_key_exists('disclaimer', $input) ? $input['disclaimer'] : (svp_json_decode($old['content_json'] ?? null, [])['disclaimer'] ?? ''),
    ];
    $next = [
        'id' => $old['id'], 'slug' => trim((string) ($input['slug'] ?? $old['slug'])), 'title' => trim((string) ($input['title'] ?? $old['title'])),
        'eyebrow' => trim((string) ($input['eyebrow'] ?? $old['eyebrow'])), 'summary' => trim((string) ($input['summary'] ?? $old['summary'])),
        'speaker_name' => trim((string) ($input['speakerName'] ?? $old['speaker_name'])), 'speaker_title' => trim((string) ($input['speakerTitle'] ?? $old['speaker_title'])),
        'format_label' => trim((string) ($input['formatLabel'] ?? $old['format_label'])), 'schedule_label' => trim((string) ($input['scheduleLabel'] ?? $old['schedule_label'])),
        'cta_label' => trim((string) ($input['ctaLabel'] ?? $old['cta_label'])), 'banner_url' => trim((string) ($input['bannerUrl'] ?? $old['banner_url'])),
        'content_json' => svp_json_encode($content), 'status' => $status, 'registration_status' => $registrationStatus,
        'published_at' => $status === 'published' ? ($old['published_at'] ?: date('Y-m-d H:i:s')) : $old['published_at'], 'updated_by' => (string) $payload['sub'],
    ];
    $db->prepare('UPDATE svp_events SET slug=:slug,title=:title,eyebrow=:eyebrow,summary=:summary,speaker_name=:speaker_name,speaker_title=:speaker_title,format_label=:format_label,schedule_label=:schedule_label,cta_label=:cta_label,banner_url=:banner_url,content_json=:content_json,status=:status,registration_status=:registration_status,published_at=:published_at,updated_by=:updated_by WHERE id=:id')->execute($next);
    $row = svp_event_find($db, (string) $old['id']);
    svp_insert_audit($db, (string) $payload['sub'], 'update', 'event', (string) $old['id'], $old, $row);
    Response::json(['item' => svp_event_to_response($row)]);
});

$router->add('GET', '/api/svp/admin/event-registrations', function () {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance();
    svp_ensure_events_schema($db);
    $where = ['r.deleted_at IS NULL']; $params = [];
    if (!empty($_GET['eventId'])) { $where[] = 'r.event_id = :event_id'; $params['event_id'] = $_GET['eventId']; }
    if (!empty($_GET['status'])) { $where[] = 'r.care_status = :status'; $params['status'] = $_GET['status']; }
    if (!empty($_GET['utmSource'])) { $where[] = 'r.utm_source = :utm_source'; $params['utm_source'] = $_GET['utmSource']; }
    if (!empty($_GET['q'])) { $where[] = '(u.full_name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q)'; $params['q'] = '%' . $_GET['q'] . '%'; }
    $stmt = $db->prepare('SELECT r.*, e.title event_title, e.slug event_slug, u.full_name, u.email, u.phone, u.svp_id FROM svp_event_registrations r JOIN svp_events e ON e.id=r.event_id JOIN users u ON u.id=r.user_id WHERE ' . implode(' AND ', $where) . ' ORDER BY r.created_at DESC');
    $stmt->execute($params);
    $items = array_map(function ($row) { return [
        'id' => $row['id'], 'eventId' => $row['event_id'], 'eventTitle' => $row['event_title'], 'eventSlug' => $row['event_slug'],
        'userId' => $row['user_id'], 'fullName' => $row['full_name'], 'email' => $row['email'], 'phone' => $row['phone'], 'svpId' => $row['svp_id'],
        'careStatus' => $row['care_status'], 'utmSource' => $row['utm_source'], 'utmMedium' => $row['utm_medium'], 'utmCampaign' => $row['utm_campaign'],
        'referrerUrl' => $row['referrer_url'], 'note' => $row['note'], 'createdAt' => $row['created_at'],
    ]; }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/event-registrations/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance(); svp_ensure_events_schema($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $status = (string) ($input['careStatus'] ?? '');
    if (!in_array($status, ['new','contacted','confirmed','joined_group','converted','declined'], true)) Response::error('Trạng thái chăm sóc không hợp lệ.', 400);
    $stmt = $db->prepare('SELECT * FROM svp_event_registrations WHERE id=:id AND deleted_at IS NULL'); $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy đăng ký.');
    $db->prepare('UPDATE svp_event_registrations SET care_status=:status,note=:note WHERE id=:id')->execute(['status' => $status, 'note' => trim((string) ($input['note'] ?? $old['note'])), 'id' => $params['id']]);
    svp_insert_audit($db, (string) $payload['sub'], 'update', 'event_registration', (string) $params['id'], $old, ['careStatus' => $status, 'note' => $input['note'] ?? $old['note']]);
    Response::json(['item' => ['id' => $params['id'], 'careStatus' => $status]]);
});

$router->add('DELETE', '/api/svp/admin/event-registrations/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance(); svp_ensure_events_schema($db);
    $stmt = $db->prepare('SELECT * FROM svp_event_registrations WHERE id=:id AND deleted_at IS NULL'); $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy đăng ký.');
    $db->prepare('UPDATE svp_event_registrations SET deleted_at=NOW() WHERE id=:id')->execute(['id' => $params['id']]);
    svp_insert_audit($db, (string) $payload['sub'], 'delete', 'event_registration', (string) $params['id'], $old, ['deleted' => true]);
    Response::json(['deleted' => true]);
});

$router->add('GET', '/api/svp/admin/event-registrations/export', function () {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance(); svp_ensure_events_schema($db);
    $where = ['r.deleted_at IS NULL']; $params = [];
    if (!empty($_GET['eventId'])) { $where[] = 'r.event_id = :event_id'; $params['event_id'] = $_GET['eventId']; }
    if (!empty($_GET['status'])) { $where[] = 'r.care_status = :status'; $params['status'] = $_GET['status']; }
    if (!empty($_GET['utmSource'])) { $where[] = 'r.utm_source = :utm_source'; $params['utm_source'] = $_GET['utmSource']; }
    if (!empty($_GET['q'])) { $where[] = '(u.full_name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q)'; $params['q'] = '%' . $_GET['q'] . '%'; }
    $stmt = $db->prepare('SELECT e.title,u.svp_id,u.full_name,u.phone,u.email,r.care_status,r.utm_source,r.utm_medium,r.utm_campaign,r.referrer_url,r.created_at FROM svp_event_registrations r JOIN svp_events e ON e.id=r.event_id JOIN users u ON u.id=r.user_id WHERE ' . implode(' AND ', $where) . ' ORDER BY r.created_at DESC');
    $stmt->execute($params);
    svp_admin_csv_download('svp-event-registrations-' . date('Y-m-d') . '.csv', ['Sự kiện','SVP ID','Họ tên','Điện thoại','Email','Trạng thái','UTM source','UTM medium','UTM campaign','URL giới thiệu','Ngày đăng ký'], $stmt->fetchAll(PDO::FETCH_NUM));
});

$router->add('POST', '/api/svp/admin/branding/upload', function () {
    $payload = svp_require_role('admin_tong');
    $kind = (string) ($_POST['kind'] ?? 'logo');
    if (!in_array($kind, ['logo','banner'], true)) Response::error('Loại ảnh thương hiệu không hợp lệ.', 400);
    if (empty($_FILES['image'])) Response::error('Vui lòng chọn ảnh JPG, PNG hoặc WebP.', 400);
    $urls = Upload::handleUpload(['name' => [$_FILES['image']['name']], 'type' => [$_FILES['image']['type']], 'tmp_name' => [$_FILES['image']['tmp_name']], 'error' => [$_FILES['image']['error']], 'size' => [$_FILES['image']['size']]]);
    $url = $urls[0] ?? '';
    if ($url === '') Response::error('Không lưu được ảnh thương hiệu.', 500);
    $db = Database::getInstance(); svp_ensure_site_display_config($db);
    $optionId = $kind === 'logo' ? 'site_logo_url' : 'site_banner_url';
    $stmt = $db->prepare('SELECT * FROM svp_config_options WHERE id=:id'); $stmt->execute(['id' => $optionId]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    $db->prepare('UPDATE svp_config_options SET value=:url WHERE id=:id')->execute(['url' => $url, 'id' => $optionId]);
    svp_insert_audit($db, (string) $payload['sub'], 'upload', 'branding', $optionId, $old, ['url' => $url]);
    Response::json(['kind' => $kind, 'url' => $url]);
});

$router->add('POST', '/api/svp/admin/branding/reset', function () {
    $payload = svp_require_role('admin_tong');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $kind = (string) ($input['kind'] ?? 'logo');
    $optionId = $kind === 'banner' ? 'site_banner_url' : 'site_logo_url';
    $value = $kind === 'banner' ? '/assets/svp-auth-hero.png' : '/logo11.png';
    $db = Database::getInstance(); svp_ensure_site_display_config($db);
    $db->prepare('UPDATE svp_config_options SET value=:value WHERE id=:id')->execute(['value' => $value, 'id' => $optionId]);
    svp_insert_audit($db, (string) $payload['sub'], 'reset', 'branding', $optionId, null, ['url' => $value]);
    Response::json(['kind' => $kind, 'url' => $value]);
});
