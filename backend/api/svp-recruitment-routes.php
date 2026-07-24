<?php
/** Recruitment CMS, applications and candidate pipeline. */

function svp_recruitment_positions(): array
{
    return [
        'chuyen_vien' => 'Chuyên viên / Cộng tác viên / Đầu khách',
        'chuyen_gia' => 'Chuyên gia / Đầu chủ',
        'truong_phong' => 'Trưởng phòng / Leader',
    ];
}

function svp_recruitment_sections_default(): array
{
    return [
        [
            'key' => 'introduction',
            'title' => 'Tuyển gấp nhiều vị trí môi giới bất động sản',
            'body' => 'Sổ Đỏ Vạn Phúc đang tuyển Chuyên viên, Cộng tác viên, Đầu khách, Chuyên gia, Đầu chủ và Trưởng phòng. Ứng viên gửi thông tin qua website sẽ được đội ngũ nhân sự liên hệ trực tiếp qua điện thoại để xác nhận, hỗ trợ lựa chọn lộ trình phù hợp và trao đổi cơ hội làm việc cùng Mr Ân Đức Nhân.',
        ],
        [
            'key' => 'positions',
            'title' => 'Các vị trí đang tuyển',
            'items' => array_values(svp_recruitment_positions()),
        ],
        [
            'key' => 'about',
            'title' => 'Môi trường làm nghề chuyên nghiệp',
            'body' => 'Sổ Đỏ hướng tới mô hình môi giới bất động sản chuyên nghiệp, minh bạch và chú trọng tuân thủ pháp luật. Đây là nơi quy tụ nhiều nhân sự giàu kinh nghiệm đến từ các doanh nghiệp môi giới chuyên nghiệp, quy mô lớn và có lịch sử phát triển lâu năm trên thị trường.',
        ],
        [
            'key' => 'recruiter',
            'title' => 'Làm việc và phát triển cùng Mr Ân Đức Nhân',
            'body' => "Mr Ân Đức Nhân hiện là Giám đốc Vạn Phúc và Giám đốc Phát triển Nhân lực - Sổ Đỏ Miền Nam.\n\nVới gần 10 năm lãnh đạo, đào tạo và đồng hành cùng nhiều thế hệ môi giới bất động sản, anh đã hỗ trợ nhiều thành viên từ điểm xuất phát chưa biết nghề, chưa có kinh nghiệm từng bước xây dựng phương pháp làm việc đúng đắn và đạt kết quả nổi bật.",
        ],
        [
            'key' => 'development',
            'title' => 'Cơ hội dành cho người nghiêm túc',
            'body' => 'Mỗi người có năng lực, điều kiện và tốc độ phát triển khác nhau. Khi được định hướng đúng, làm đúng việc và kiên trì đủ lâu, kết quả hoàn toàn có thể thay đổi. Chương trình tuyển dụng phù hợp với cả người đã có kinh nghiệm và người đang muốn bắt đầu với nghề.',
        ],
        [
            'key' => 'process',
            'title' => 'Quy trình ứng tuyển',
            'items' => [
                'Chọn vị trí phù hợp và gửi thông tin ứng tuyển trên website.',
                'Nhân sự liên hệ trực tiếp qua điện thoại để xác nhận thông tin.',
                'Trao đổi định hướng, lịch phỏng vấn hoặc lịch đào tạo phù hợp.',
                'Kích hoạt vai trò sau khi hoàn tất bước xác nhận cần thiết.',
            ],
        ],
        [
            'key' => 'closing',
            'title' => 'Bắt đầu từ một lựa chọn đúng',
            'body' => 'Bạn chưa cần phải biết mọi thứ ngay từ đầu. Điều quan trọng là thái độ nghiêm túc, tinh thần học hỏi và sự kiên trì với con đường đã chọn.',
        ],
    ];
}

function svp_ensure_recruitment_schema(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS svp_recruitment_posts (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      slug VARCHAR(180) NOT NULL,
      title VARCHAR(255) NOT NULL,
      eyebrow VARCHAR(255) DEFAULT NULL,
      summary TEXT DEFAULT NULL,
      recruiter_name VARCHAR(180) DEFAULT NULL,
      recruiter_title TEXT DEFAULT NULL,
      cta_label VARCHAR(180) DEFAULT NULL,
      banner_url VARCHAR(1000) DEFAULT NULL,
      content_json LONGTEXT DEFAULT NULL,
      content_revision INT UNSIGNED NOT NULL DEFAULT 1,
      status ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
      application_status ENUM('open','closed') NOT NULL DEFAULT 'open',
      published_at DATETIME DEFAULT NULL,
      created_by VARCHAR(64) DEFAULT NULL,
      updated_by VARCHAR(64) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_svp_recruitment_posts_slug (slug),
      INDEX idx_svp_recruitment_posts_status (status, application_status, published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS svp_recruitment_candidates (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      post_id VARCHAR(64) DEFAULT NULL,
      post_slug VARCHAR(180) DEFAULT NULL,
      user_id VARCHAR(64) DEFAULT NULL,
      full_name VARCHAR(200) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      position_slug VARCHAR(80) DEFAULT NULL,
      source_referral_code VARCHAR(80) DEFAULT NULL,
      pipeline_status ENUM('registered','contacted','interview','training','activated','active','rejected') DEFAULT 'registered',
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
      UNIQUE KEY uq_svp_recruitment_post_user (post_id, user_id),
      INDEX idx_candidate_status (pipeline_status),
      INDEX idx_candidate_post (post_id, position_slug, created_at),
      INDEX idx_candidate_utm (utm_source, utm_campaign)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $candidateColumns = [
        'post_id' => 'VARCHAR(64) DEFAULT NULL AFTER id',
        'post_slug' => 'VARCHAR(180) DEFAULT NULL AFTER post_id',
        'user_id' => 'VARCHAR(64) DEFAULT NULL AFTER post_slug',
        'email' => 'VARCHAR(255) DEFAULT NULL AFTER phone',
        'position_slug' => 'VARCHAR(80) DEFAULT NULL AFTER email',
        'utm_source' => 'VARCHAR(180) DEFAULT NULL AFTER pipeline_status',
        'utm_medium' => 'VARCHAR(180) DEFAULT NULL AFTER utm_source',
        'utm_campaign' => 'VARCHAR(180) DEFAULT NULL AFTER utm_medium',
        'utm_content' => 'VARCHAR(180) DEFAULT NULL AFTER utm_campaign',
        'utm_term' => 'VARCHAR(180) DEFAULT NULL AFTER utm_content',
        'referrer_url' => 'VARCHAR(1000) DEFAULT NULL AFTER utm_term',
        'registration_url' => 'VARCHAR(1000) DEFAULT NULL AFTER referrer_url',
        'updated_at' => 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
        'deleted_at' => 'DATETIME DEFAULT NULL AFTER updated_at',
    ];
    foreach ($candidateColumns as $column => $definition) {
        try { $db->exec("ALTER TABLE svp_recruitment_candidates ADD COLUMN {$column} {$definition}"); } catch (Throwable $e) { }
    }
    try { $db->exec('ALTER TABLE svp_recruitment_candidates ADD UNIQUE KEY uq_svp_recruitment_post_user (post_id, user_id)'); } catch (Throwable $e) { }
    try { $db->exec('ALTER TABLE svp_recruitment_candidates ADD INDEX idx_candidate_post (post_id, position_slug, created_at)'); } catch (Throwable $e) { }
    try { $db->exec('ALTER TABLE svp_recruitment_candidates ADD INDEX idx_candidate_utm (utm_source, utm_campaign)'); } catch (Throwable $e) { }

    $content = svp_json_encode([
        'sections' => svp_recruitment_sections_default(),
        'disclaimer' => 'Thông tin tuyển dụng nhằm mục đích giới thiệu cơ hội nghề nghiệp. Vị trí, quyền lợi và lộ trình cụ thể sẽ được trao đổi trực tiếp trong quá trình xác nhận ứng tuyển.',
    ]);
    $stmt = $db->prepare("INSERT INTO svp_recruitment_posts
      (id, slug, title, eyebrow, summary, recruiter_name, recruiter_title, cta_label, banner_url, content_json, content_revision, status, application_status, published_at)
      VALUES
      ('recruitment_van_phuc_01', 'tuyen-dung-moi-gioi-van-phuc', :title, :eyebrow, :summary, :recruiter_name, :recruiter_title, :cta, :banner, :content, 1, 'published', 'open', NOW())
      ON DUPLICATE KEY UPDATE slug = VALUES(slug)");
    $stmt->execute([
        'title' => 'Tuyển Dụng Chuyên Viên / Cộng Tác Viên / Đầu Khách, Chuyên Gia / Đầu Chủ, Trưởng Phòng / Leader',
        'eyebrow' => 'Cơ hội nghề nghiệp tại Sổ Đỏ Vạn Phúc',
        'summary' => 'Ứng tuyển để được đội ngũ nhân sự liên hệ trực tiếp, xác nhận thông tin và hỗ trợ lựa chọn lộ trình phù hợp.',
        'recruiter_name' => 'Mr Ân Đức Nhân',
        'recruiter_title' => "Giám đốc Vạn Phúc\nGiám đốc Phát triển Nhân lực - Sổ Đỏ Miền Nam",
        'cta' => 'Ứng tuyển ngay',
        'banner' => '/assets/recruitment/tuyen-dung-moi-gioi-van-phuc.jpg',
        'content' => $content,
    ]);
}

function svp_recruitment_banner_url(array $row): string
{
    $banner = trim((string) ($row['banner_url'] ?? ''));
    if ($banner !== '') return $banner;
    if (($row['slug'] ?? '') === 'congtacvientuyendung') return '/assets/recruitment/ctv-tuyen-dung-nhan-su.jpg';
    return '/assets/recruitment/tuyen-dung-moi-gioi-van-phuc.jpg';
}

function svp_recruitment_post_response(array $row): array
{
    $content = svp_json_decode($row['content_json'] ?? null, []);
    return [
        'id' => (string) $row['id'], 'slug' => (string) $row['slug'], 'title' => (string) $row['title'],
        'eyebrow' => (string) ($row['eyebrow'] ?? ''), 'summary' => (string) ($row['summary'] ?? ''),
        'recruiterName' => (string) ($row['recruiter_name'] ?? ''), 'recruiterTitle' => (string) ($row['recruiter_title'] ?? ''),
        'ctaLabel' => (string) ($row['cta_label'] ?? 'Ứng tuyển ngay'), 'bannerUrl' => svp_recruitment_banner_url($row),
        'sections' => is_array($content['sections'] ?? null) ? $content['sections'] : [],
        'disclaimer' => (string) ($content['disclaimer'] ?? ''), 'status' => (string) ($row['status'] ?? 'draft'),
        'applicationStatus' => (string) ($row['application_status'] ?? 'open'), 'publishedAt' => $row['published_at'] ?? null,
        'createdAt' => $row['created_at'] ?? null, 'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function svp_recruitment_find(PDO $db, string $idOrSlug, bool $publicOnly = false): ?array
{
    $sql = 'SELECT * FROM svp_recruitment_posts WHERE (id=:id OR slug=:slug)';
    if ($publicOnly) $sql .= " AND status='published'";
    $sql .= ' LIMIT 1';
    $stmt = $db->prepare($sql); $stmt->execute(['id' => $idOrSlug, 'slug' => $idOrSlug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function svp_recruitment_source(array $input): array
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

function svp_recruitment_position(string $value): string
{
    $value = trim($value);
    if (!array_key_exists($value, svp_recruitment_positions())) Response::error('Vui lòng chọn một vị trí ứng tuyển hợp lệ.', 400);
    return $value;
}

function svp_recruitment_ensure_role(PDO $db, string $userId, string $roleSlug, string $reason): void
{
    $stmt = $db->prepare('SELECT status FROM svp_user_roles WHERE user_id=:user_id AND role_slug=:role_slug LIMIT 1');
    $stmt->execute(['user_id' => $userId, 'role_slug' => $roleSlug]);
    $current = $stmt->fetchColumn();
    if ($current === 'approved') return;
    if ($current) {
        $db->prepare("UPDATE svp_user_roles SET status='pending', applied_at=NOW(), approved_by=NULL, approved_at=NULL WHERE user_id=:user_id AND role_slug=:role_slug")->execute(['user_id' => $userId, 'role_slug' => $roleSlug]);
    } else {
        $db->prepare("INSERT INTO svp_user_roles (user_id,role_slug,status,applied_at) VALUES (:user_id,:role_slug,'pending',NOW())")->execute(['user_id' => $userId, 'role_slug' => $roleSlug]);
    }
    $pending = $db->prepare("SELECT id FROM svp_role_applications WHERE user_id=:user_id AND role_slug=:role_slug AND status='pending' LIMIT 1");
    $pending->execute(['user_id' => $userId, 'role_slug' => $roleSlug]);
    if (!$pending->fetchColumn()) {
        $db->prepare("INSERT INTO svp_role_applications (user_id,role_slug,status,reason,created_at) VALUES (:user_id,:role_slug,'pending',:reason,NOW())")->execute(['user_id' => $userId, 'role_slug' => $roleSlug, 'reason' => $reason]);
    }
}

function svp_recruitment_create_candidate(PDO $db, array $post, string $userId, string $positionSlug, array $source, string $referralCode = ''): array
{
    if (($post['application_status'] ?? '') !== 'open') Response::error('Bài tuyển dụng đã đóng nhận hồ sơ.', 409);
    $stmt = $db->prepare('SELECT full_name,email,phone FROM users WHERE id=:id LIMIT 1'); $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::notFound('Không tìm thấy tài khoản ứng tuyển.');
    $id = svp_uid('candidate');
    $db->prepare("INSERT INTO svp_recruitment_candidates
      (id,post_id,post_slug,user_id,full_name,phone,email,position_slug,source_referral_code,pipeline_status,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer_url,registration_url)
      VALUES (:id,:post_id,:post_slug,:user_id,:full_name,:phone,:email,:position_slug,:source_referral_code,'registered',:utm_source,:utm_medium,:utm_campaign,:utm_content,:utm_term,:referrer_url,:registration_url)")->execute(array_merge($source, [
        'id' => $id, 'post_id' => $post['id'], 'post_slug' => $post['slug'], 'user_id' => $userId,
        'full_name' => $user['full_name'], 'phone' => $user['phone'], 'email' => $user['email'],
        'position_slug' => $positionSlug, 'source_referral_code' => $referralCode ?: null,
    ]));
    return ['id' => $id, 'postId' => $post['id'], 'userId' => $userId, 'positionSlug' => $positionSlug, 'pipelineStatus' => 'registered'];
}

$router->add('GET', '/api/svp/recruitment', function () {
    $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $rows = $db->query("SELECT * FROM svp_recruitment_posts WHERE status='published' ORDER BY COALESCE(published_at,created_at) DESC")->fetchAll(PDO::FETCH_ASSOC);
    Response::json(['items' => array_map('svp_recruitment_post_response', $rows), 'total' => count($rows)]);
});

$router->add('GET', '/api/svp/recruitment/{slug}', function ($params) {
    $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $row = svp_recruitment_find($db, (string) $params['slug'], true);
    if (!$row) Response::notFound('Không tìm thấy bài tuyển dụng.');
    Response::json(['item' => svp_recruitment_post_response($row), 'positions' => svp_recruitment_positions()]);
});

$router->add('POST', '/api/svp/recruitment/{slug}/apply', function ($params) {
    $payload = svp_auth_require(); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $post = svp_recruitment_find($db, (string) $params['slug'], true); if (!$post) Response::notFound('Không tìm thấy bài tuyển dụng.');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $position = svp_recruitment_position((string) ($input['positionSlug'] ?? ''));
    $db->beginTransaction();
    try {
        svp_recruitment_ensure_role($db, (string) $payload['sub'], $position, 'Ứng tuyển từ bài ' . $post['title']);
        $candidate = svp_recruitment_create_candidate($db, $post, (string) $payload['sub'], $position, svp_recruitment_source($input), trim((string) ($input['referralCode'] ?? '')));
        $db->commit();
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ((string) $e->getCode() === '23000') Response::error('Bạn đã ứng tuyển bài này.', 409);
        throw $e;
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
    svp_insert_audit($db, (string) $payload['sub'], 'apply', 'recruitment_candidate', $candidate['id'], null, $candidate);
    Response::json(['message' => 'Ứng tuyển thành công. Nhân sự sẽ liên hệ trực tiếp với bạn.', 'candidate' => $candidate], 201);
});

$router->add('POST', '/api/svp/recruitment/{slug}/apply-new', function ($params) {
    $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $post = svp_recruitment_find($db, (string) $params['slug'], true); if (!$post) Response::notFound('Không tìm thấy bài tuyển dụng.');
    if (($post['application_status'] ?? '') !== 'open') Response::error('Bài tuyển dụng đã đóng nhận hồ sơ.', 409);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fullName = trim((string) ($input['fullName'] ?? '')); $email = strtolower(trim((string) ($input['email'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? '')); $password = (string) ($input['password'] ?? '');
    $position = svp_recruitment_position((string) ($input['positionSlug'] ?? ''));
    $referralCode = trim((string) ($input['referralCode'] ?? ''));
    if (($input['acceptedTerms'] ?? false) !== true) Response::error('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.', 400);
    if ($fullName === '' || $phone === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) Response::error('Vui lòng điền đúng họ tên, điện thoại, email và mật khẩu tối thiểu 6 ký tự.', 400);
    $check = $db->prepare('SELECT id FROM users WHERE email=:email OR phone=:phone LIMIT 1'); $check->execute(['email' => $email, 'phone' => $phone]);
    if ($check->fetch()) Response::error('Email hoặc số điện thoại đã tồn tại. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.', 409);

    $db->beginTransaction();
    try {
        $userId = bin2hex(random_bytes(16)); $svpId = svp_v1_generate_svp_id($db); $newReferralCode = svp_v1_generate_referral_code($svpId);
        $db->prepare('INSERT INTO users (id,full_name,email,phone,password_hash,svp_id,referral_code,created_at) VALUES (:id,:name,:email,:phone,:password,:svp_id,:referral_code,NOW())')->execute([
            'id' => $userId, 'name' => $fullName, 'email' => $email, 'phone' => $phone, 'password' => password_hash($password, PASSWORD_DEFAULT), 'svp_id' => $svpId, 'referral_code' => $newReferralCode,
        ]);
        svp_recruitment_ensure_role($db, $userId, $position, 'Ứng tuyển từ bài ' . $post['title']);
        if ($referralCode !== '') {
            $referrer = svp_v1_lookup_referrer($db, $referralCode, $userId);
            if (!$referrer) throw new RuntimeException('Không tìm thấy người giới thiệu đã chọn.');
            $db->prepare("INSERT INTO svp_referrals (id,referrer_user_id,referred_user_id,referral_code,referral_type,status) VALUES (:id,:referrer,:referred,:code,'staff','new')")->execute([
                'id' => bin2hex(random_bytes(16)), 'referrer' => $referrer['id'], 'referred' => $userId, 'code' => $referrer['referral_code'] ?: $referralCode,
            ]);
            $db->prepare('UPDATE users SET referred_by=:referrer WHERE id=:id')->execute(['referrer' => $referrer['id'], 'id' => $userId]);
        }
        $candidate = svp_recruitment_create_candidate($db, $post, $userId, $position, svp_recruitment_source($input), $referralCode);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e instanceof RuntimeException) Response::error($e->getMessage(), 400);
        throw $e;
    }
    $roles = svp_v1_get_user_roles($db, $userId);
    svp_v1_send_registration_email($email, $fullName, $svpId, $newReferralCode, $roles);
    Mailer::send($email, 'Ứng tuyển thành công - Sổ Đỏ Vạn Phúc', '<h2>Ứng tuyển đã được ghi nhận</h2><p>Xin chào <strong>' . htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8') . '</strong>,</p><p>Đội ngũ nhân sự đã nhận thông tin ứng tuyển vị trí <strong>' . htmlspecialchars(svp_recruitment_positions()[$position], ENT_QUOTES, 'UTF-8') . '</strong> và sẽ liên hệ trực tiếp với bạn.</p>');
    svp_insert_audit($db, $userId, 'apply', 'recruitment_candidate', $candidate['id'], null, $candidate);
    $auth = svp_v1_login_payload(['id' => $userId, 'svp_id' => $svpId, 'email' => $email, 'phone' => $phone, 'full_name' => $fullName, 'avatar_url' => '', 'cccd' => '', 'profile_json' => null, 'referral_code' => $newReferralCode], $roles);
    $data = $auth['data']; $data['message'] = 'Đăng ký tài khoản và ứng tuyển thành công.'; $data['candidate'] = $candidate;
    Response::json($data, 201);
});

$router->add('GET', '/api/svp/admin/recruitment-posts', function () {
    svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $rows = $db->query('SELECT p.*,(SELECT COUNT(*) FROM svp_recruitment_candidates c WHERE c.post_id=p.id AND c.deleted_at IS NULL) candidate_count FROM svp_recruitment_posts p ORDER BY p.created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(function ($row) { $item = svp_recruitment_post_response($row); $item['candidateCount'] = (int) ($row['candidate_count'] ?? 0); return $item; }, $rows);
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('GET', '/api/svp/admin/recruitment-posts/{id}', function ($params) {
    svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $row = svp_recruitment_find($db, (string) $params['id']); if (!$row) Response::notFound('Không tìm thấy bài tuyển dụng.');
    Response::json(['item' => svp_recruitment_post_response($row)]);
});

$router->add('POST', '/api/svp/admin/recruitment-posts', function () {
    $payload = svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: []; $title = trim((string) ($input['title'] ?? ''));
    $slug = preg_replace('/[^a-z0-9-]/', '', strtolower(trim((string) ($input['slug'] ?? ''))));
    if ($title === '' || $slug === '') Response::error('Tiêu đề và slug là bắt buộc.', 400);
    $id = svp_uid('recruitment');
    $db->prepare("INSERT INTO svp_recruitment_posts (id,slug,title,eyebrow,summary,recruiter_name,recruiter_title,cta_label,banner_url,content_json,status,application_status,created_by,updated_by) VALUES (:id,:slug,:title,:eyebrow,:summary,:recruiter_name,:recruiter_title,:cta_label,:banner_url,:content_json,'draft','open',:created_by,:updated_by)")->execute([
        'id' => $id, 'slug' => $slug, 'title' => $title, 'eyebrow' => trim((string) ($input['eyebrow'] ?? '')), 'summary' => trim((string) ($input['summary'] ?? '')),
        'recruiter_name' => trim((string) ($input['recruiterName'] ?? '')), 'recruiter_title' => trim((string) ($input['recruiterTitle'] ?? '')),
        'cta_label' => trim((string) ($input['ctaLabel'] ?? 'Ứng tuyển ngay')), 'banner_url' => trim((string) ($input['bannerUrl'] ?? '')),
        'content_json' => svp_json_encode(['sections' => $input['sections'] ?? [], 'disclaimer' => $input['disclaimer'] ?? '']),
        'created_by' => (string) $payload['sub'], 'updated_by' => (string) $payload['sub'],
    ]);
    $row = svp_recruitment_find($db, $id); svp_insert_audit($db, (string) $payload['sub'], 'create', 'recruitment_post', $id, null, $row);
    Response::json(['item' => svp_recruitment_post_response($row)], 201);
});

$router->add('PUT', '/api/svp/admin/recruitment-posts/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $old = svp_recruitment_find($db, (string) $params['id']); if (!$old) Response::notFound('Không tìm thấy bài tuyển dụng.');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $title = trim((string) ($input['title'] ?? $old['title']));
    $slug = preg_replace('/[^a-z0-9-]/', '', strtolower(trim((string) ($input['slug'] ?? $old['slug']))));
    if ($title === '' || $slug === '') Response::error('Tiêu đề và slug là bắt buộc.', 400);
    $status = (string) ($input['status'] ?? $old['status']); $applicationStatus = (string) ($input['applicationStatus'] ?? $old['application_status']);
    if (!in_array($status, ['draft','published','hidden','archived'], true)) Response::error('Trạng thái bài tuyển dụng không hợp lệ.', 400);
    if (!in_array($applicationStatus, ['open','closed'], true)) Response::error('Trạng thái nhận hồ sơ không hợp lệ.', 400);
    $oldContent = svp_json_decode($old['content_json'] ?? null, []);
    $next = [
        'id' => $old['id'], 'slug' => $slug, 'title' => $title,
        'eyebrow' => trim((string) ($input['eyebrow'] ?? $old['eyebrow'])), 'summary' => trim((string) ($input['summary'] ?? $old['summary'])),
        'recruiter_name' => trim((string) ($input['recruiterName'] ?? $old['recruiter_name'])), 'recruiter_title' => trim((string) ($input['recruiterTitle'] ?? $old['recruiter_title'])),
        'cta_label' => trim((string) ($input['ctaLabel'] ?? $old['cta_label'])), 'banner_url' => trim((string) ($input['bannerUrl'] ?? $old['banner_url'])),
        'content_json' => svp_json_encode(['sections' => $input['sections'] ?? ($oldContent['sections'] ?? []), 'disclaimer' => $input['disclaimer'] ?? ($oldContent['disclaimer'] ?? '')]),
        'status' => $status, 'application_status' => $applicationStatus,
        'published_at' => $status === 'published' ? ($old['published_at'] ?: date('Y-m-d H:i:s')) : $old['published_at'], 'updated_by' => (string) $payload['sub'],
    ];
    $db->prepare('UPDATE svp_recruitment_posts SET slug=:slug,title=:title,eyebrow=:eyebrow,summary=:summary,recruiter_name=:recruiter_name,recruiter_title=:recruiter_title,cta_label=:cta_label,banner_url=:banner_url,content_json=:content_json,status=:status,application_status=:application_status,published_at=:published_at,updated_by=:updated_by WHERE id=:id')->execute($next);
    $row = svp_recruitment_find($db, (string) $old['id']); svp_insert_audit($db, (string) $payload['sub'], 'update', 'recruitment_post', (string) $old['id'], $old, $row);
    Response::json(['item' => svp_recruitment_post_response($row)]);
});

function svp_recruitment_candidate_filters(): array
{
    $where = ['c.deleted_at IS NULL']; $params = [];
    if (!empty($_GET['postId'])) { $where[] = 'c.post_id=:post_id'; $params['post_id'] = $_GET['postId']; }
    if (!empty($_GET['status'])) { $where[] = 'c.pipeline_status=:status'; $params['status'] = $_GET['status']; }
    if (!empty($_GET['position'])) { $where[] = 'c.position_slug=:position'; $params['position'] = $_GET['position']; }
    if (!empty($_GET['utmSource'])) { $where[] = 'c.utm_source=:utm_source'; $params['utm_source'] = $_GET['utmSource']; }
    if (!empty($_GET['q'])) {
        $query = '%' . $_GET['q'] . '%'; $where[] = '(c.full_name LIKE :q_name OR c.email LIKE :q_email OR c.phone LIKE :q_phone)';
        $params['q_name'] = $query; $params['q_email'] = $query; $params['q_phone'] = $query;
    }
    return [$where, $params];
}

$router->add('GET', '/api/svp/admin/recruitment-candidates', function () {
    svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    [$where, $params] = svp_recruitment_candidate_filters();
    $stmt = $db->prepare('SELECT c.*,p.title post_title,u.svp_id FROM svp_recruitment_candidates c LEFT JOIN svp_recruitment_posts p ON p.id=c.post_id LEFT JOIN users u ON u.id=c.user_id WHERE ' . implode(' AND ', $where) . ' ORDER BY c.created_at DESC'); $stmt->execute($params);
    $positions = svp_recruitment_positions();
    $items = array_map(function ($row) use ($positions) { return [
        'id' => $row['id'], 'postId' => $row['post_id'], 'postTitle' => $row['post_title'] ?: 'Ứng tuyển chung', 'postSlug' => $row['post_slug'], 'userId' => $row['user_id'],
        'fullName' => $row['full_name'], 'phone' => $row['phone'], 'email' => $row['email'], 'svpId' => $row['svp_id'],
        'positionSlug' => $row['position_slug'], 'positionLabel' => $positions[$row['position_slug']] ?? $row['position_slug'], 'pipelineStatus' => $row['pipeline_status'],
        'referralCode' => $row['source_referral_code'], 'utmSource' => $row['utm_source'], 'utmCampaign' => $row['utm_campaign'], 'note' => $row['note'], 'createdAt' => $row['created_at'],
    ]; }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('PATCH', '/api/svp/admin/recruitment-candidates/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $input = json_decode(file_get_contents('php://input'), true) ?: []; $status = (string) ($input['pipelineStatus'] ?? '');
    if (!in_array($status, ['registered','contacted','interview','training','activated','active','rejected'], true)) Response::error('Trạng thái ứng viên không hợp lệ.', 400);
    $stmt = $db->prepare('SELECT * FROM svp_recruitment_candidates WHERE id=:id AND deleted_at IS NULL'); $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy ứng viên.');
    $note = trim((string) ($input['note'] ?? $old['note']));
    $db->prepare('UPDATE svp_recruitment_candidates SET pipeline_status=:status,note=:note WHERE id=:id')->execute(['status' => $status, 'note' => $note, 'id' => $params['id']]);
    svp_insert_audit($db, (string) $payload['sub'], 'update', 'recruitment_candidate', (string) $params['id'], $old, ['pipelineStatus' => $status, 'note' => $note]);
    Response::json(['item' => ['id' => $params['id'], 'pipelineStatus' => $status, 'note' => $note]]);
});

$router->add('DELETE', '/api/svp/admin/recruitment-candidates/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    $stmt = $db->prepare('SELECT * FROM svp_recruitment_candidates WHERE id=:id AND deleted_at IS NULL');
    $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy ứng viên.');
    $db->prepare('UPDATE svp_recruitment_candidates SET deleted_at=NOW() WHERE id=:id')->execute(['id' => $params['id']]);
    svp_insert_audit($db, (string) $payload['sub'], 'delete', 'recruitment_candidate', (string) $params['id'], $old, ['deletedAt' => date('Y-m-d H:i:s')]);
    Response::json(['deleted' => true, 'id' => (string) $params['id']]);
});

$router->add('GET', '/api/svp/admin/recruitment-candidates/export', function () {
    svp_require_role('admin_tong', 'admin'); $db = Database::getInstance(); svp_ensure_recruitment_schema($db);
    [$where, $params] = svp_recruitment_candidate_filters();
    $stmt = $db->prepare('SELECT p.title,u.svp_id,c.full_name,c.phone,c.email,c.position_slug,c.pipeline_status,c.source_referral_code,c.utm_source,c.utm_medium,c.utm_campaign,c.created_at FROM svp_recruitment_candidates c LEFT JOIN svp_recruitment_posts p ON p.id=c.post_id LEFT JOIN users u ON u.id=c.user_id WHERE ' . implode(' AND ', $where) . ' ORDER BY c.created_at DESC'); $stmt->execute($params);
    $positions = svp_recruitment_positions(); $rows = array_map(function ($row) use ($positions) { $row[5] = $positions[$row[5]] ?? $row[5]; return $row; }, $stmt->fetchAll(PDO::FETCH_NUM));
    svp_admin_excel_download('svp-recruitment-candidates-' . date('Y-m-d') . '.xls', 'Ung vien tuyen dung', ['Bài tuyển dụng','SVP ID','Họ tên','Điện thoại','Email','Vị trí','Trạng thái','Mã giới thiệu','UTM source','UTM medium','UTM campaign','Ngày ứng tuyển'], $rows);
});
