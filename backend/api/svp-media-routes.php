<?php
/** Shared media library for administration content and brand assets. */

function svp_ensure_media_schema(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS svp_media_library (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      url VARCHAR(1000) NOT NULL,
      original_name VARCHAR(255) DEFAULT NULL,
      title VARCHAR(255) DEFAULT NULL,
      alt_text VARCHAR(500) DEFAULT NULL,
      mime_type VARCHAR(100) DEFAULT NULL,
      file_size BIGINT UNSIGNED DEFAULT NULL,
      width INT UNSIGNED DEFAULT NULL,
      height INT UNSIGNED DEFAULT NULL,
      source_context VARCHAR(80) NOT NULL DEFAULT 'media_library',
      created_by VARCHAR(64) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      UNIQUE KEY uq_svp_media_library_url (url(191)),
      INDEX idx_svp_media_library_created (deleted_at, created_at),
      INDEX idx_svp_media_library_source (source_context, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $seed = $db->prepare("INSERT INTO svp_media_library
      (id,url,original_name,title,alt_text,mime_type,source_context)
      VALUES (:id,:url,:original_name,:title,:alt_text,:mime_type,:source_context)
      ON DUPLICATE KEY UPDATE title=VALUES(title),alt_text=VALUES(alt_text),source_context=VALUES(source_context),deleted_at=NULL");
    foreach ([
        ['media_seed_logo','/logo11.png','logo11.png','Logo Sổ Đỏ Vạn Phúc','Logo Sổ Đỏ Vạn Phúc','image/png','branding_logo'],
        ['media_seed_auth_banner','/assets/svp-auth-hero.png','svp-auth-hero.png','Banner trang đăng nhập','Không gian bất động sản Sổ Đỏ Vạn Phúc','image/png','branding_banner'],
        ['media_seed_event_banner','/assets/events/lam-nghe-moi-gioi-dung-luat.png','lam-nghe-moi-gioi-dung-luat.png','Banner sự kiện môi giới đúng luật','Sự kiện làm nghề môi giới đúng luật','image/png','event_banner'],
        ['media_seed_recruitment_banner','/assets/recruitment/tuyen-dung-moi-gioi-van-phuc.jpg','tuyen-dung-moi-gioi-van-phuc.jpg','Banner tuyển dụng Vạn Phúc','Đội ngũ môi giới bất động sản Vạn Phúc','image/jpeg','recruitment_banner'],
    ] as $row) {
        $seed->execute([
            'id' => $row[0], 'url' => $row[1], 'original_name' => $row[2], 'title' => $row[3],
            'alt_text' => $row[4], 'mime_type' => $row[5], 'source_context' => $row[6],
        ]);
    }
}

function svp_media_source_context(string $value): string
{
    $clean = preg_replace('/[^a-z0-9_-]/', '', strtolower(trim($value)));
    return substr($clean ?: 'media_library', 0, 80);
}

function svp_media_response(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'url' => (string) $row['url'],
        'originalName' => (string) ($row['original_name'] ?? ''),
        'title' => (string) ($row['title'] ?? ''),
        'altText' => (string) ($row['alt_text'] ?? ''),
        'mimeType' => (string) ($row['mime_type'] ?? ''),
        'fileSize' => $row['file_size'] === null ? null : (int) $row['file_size'],
        'width' => $row['width'] === null ? null : (int) $row['width'],
        'height' => $row['height'] === null ? null : (int) $row['height'],
        'sourceContext' => (string) ($row['source_context'] ?? 'media_library'),
        'createdBy' => (string) ($row['created_by'] ?? ''),
        'createdByName' => (string) ($row['created_by_name'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
    ];
}

function svp_media_register_upload(
    PDO $db,
    string $url,
    ?string $actorId,
    string $sourceContext,
    array $metadata = []
): array {
    svp_ensure_media_schema($db);
    $existing = $db->prepare('SELECT * FROM svp_media_library WHERE url=:url LIMIT 1');
    $existing->execute(['url' => $url]);
    $old = $existing->fetch(PDO::FETCH_ASSOC);
    $id = $old['id'] ?? svp_uid('media');
    $originalName = trim((string) ($metadata['originalName'] ?? ''));
    $title = trim((string) ($metadata['title'] ?? pathinfo($originalName, PATHINFO_FILENAME)));
    $altText = trim((string) ($metadata['altText'] ?? $title));
    $stmt = $db->prepare("INSERT INTO svp_media_library
      (id,url,original_name,title,alt_text,mime_type,file_size,width,height,source_context,created_by,deleted_at)
      VALUES (:id,:url,:original_name,:title,:alt_text,:mime_type,:file_size,:width,:height,:source_context,:created_by,NULL)
      ON DUPLICATE KEY UPDATE
        original_name=VALUES(original_name),title=VALUES(title),alt_text=VALUES(alt_text),
        mime_type=VALUES(mime_type),file_size=VALUES(file_size),width=VALUES(width),height=VALUES(height),
        source_context=VALUES(source_context),created_by=COALESCE(created_by,VALUES(created_by)),deleted_at=NULL");
    $stmt->execute([
        'id' => $id,
        'url' => $url,
        'original_name' => substr($originalName, 0, 255),
        'title' => substr($title, 0, 255),
        'alt_text' => substr($altText, 0, 500),
        'mime_type' => substr((string) ($metadata['mimeType'] ?? ''), 0, 100) ?: null,
        'file_size' => isset($metadata['fileSize']) ? (int) $metadata['fileSize'] : null,
        'width' => isset($metadata['width']) ? (int) $metadata['width'] : null,
        'height' => isset($metadata['height']) ? (int) $metadata['height'] : null,
        'source_context' => svp_media_source_context($sourceContext),
        'created_by' => $actorId ?: null,
    ]);
    $nextStmt = $db->prepare('SELECT * FROM svp_media_library WHERE url=:url LIMIT 1');
    $nextStmt->execute(['url' => $url]);
    $next = $nextStmt->fetch(PDO::FETCH_ASSOC);
    svp_insert_audit($db, $actorId, $old ? 'update' : 'upload', 'media_library', (string) $next['id'], $old ?: null, $next);
    return $next;
}

function svp_media_normalize_uploads(array $files): array
{
    if (!isset($files['name'])) return [];
    if (!is_array($files['name'])) return [$files];
    $items = [];
    foreach ($files['name'] as $index => $name) {
        if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
        $items[] = [
            'name' => $name,
            'type' => $files['type'][$index] ?? '',
            'tmp_name' => $files['tmp_name'][$index] ?? '',
            'error' => $files['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $files['size'][$index] ?? 0,
        ];
    }
    return $items;
}

function svp_media_upload_metadata(array $files): array
{
    $metadata = [];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach (svp_media_normalize_uploads($files) as $file) {
        $dimensions = @getimagesize($file['tmp_name']);
        $metadata[] = [
            'originalName' => (string) $file['name'],
            'mimeType' => (string) $finfo->file($file['tmp_name']),
            'fileSize' => (int) $file['size'],
            'width' => is_array($dimensions) ? (int) $dimensions[0] : null,
            'height' => is_array($dimensions) ? (int) $dimensions[1] : null,
        ];
    }
    return $metadata;
}

$router->add('GET', '/api/svp/admin/media', function () {
    svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance(); svp_ensure_media_schema($db);
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(60, max(12, (int) ($_GET['limit'] ?? 36)));
    $offset = ($page - 1) * $limit;
    $where = ['m.deleted_at IS NULL']; $params = [];
    if (!empty($_GET['source'])) {
        $where[] = 'm.source_context=:source';
        $params['source'] = svp_media_source_context((string) $_GET['source']);
    }
    if (!empty($_GET['q'])) {
        $query = '%' . trim((string) $_GET['q']) . '%';
        $where[] = '(m.title LIKE :q_title OR m.original_name LIKE :q_original OR m.alt_text LIKE :q_alt)';
        $params['q_title'] = $query; $params['q_original'] = $query; $params['q_alt'] = $query;
    }
    $whereSql = implode(' AND ', $where);
    $count = $db->prepare("SELECT COUNT(*) FROM svp_media_library m WHERE {$whereSql}");
    $count->execute($params);
    $stmt = $db->prepare("SELECT m.*,u.full_name created_by_name
      FROM svp_media_library m LEFT JOIN users u ON u.id=m.created_by
      WHERE {$whereSql} ORDER BY m.created_at DESC,m.id DESC LIMIT {$limit} OFFSET {$offset}");
    $stmt->execute($params);
    $items = array_map('svp_media_response', $stmt->fetchAll(PDO::FETCH_ASSOC));
    $sources = $db->query("SELECT source_context,COUNT(*) total FROM svp_media_library WHERE deleted_at IS NULL GROUP BY source_context ORDER BY total DESC")->fetchAll(PDO::FETCH_ASSOC);
    Response::json([
        'items' => $items,
        'total' => (int) $count->fetchColumn(),
        'page' => $page,
        'limit' => $limit,
        'sources' => array_map(function ($row) { return ['value' => $row['source_context'], 'total' => (int) $row['total']]; }, $sources),
    ]);
});

$router->add('POST', '/api/svp/admin/media', function () {
    $payload = svp_require_role('admin_tong', 'admin');
    $files = $_FILES['images'] ?? ($_FILES['image'] ?? null);
    if (!$files) Response::error('Vui lòng chọn ít nhất một ảnh JPG, PNG hoặc WebP.', 400);
    $normalized = svp_media_normalize_uploads($files);
    if (!$normalized) Response::error('Không nhận được tệp ảnh hợp lệ.', 400);
    if (count($normalized) > 12) Response::error('Mỗi lượt chỉ được tải tối đa 12 ảnh.', 400);

    $metadata = svp_media_upload_metadata($files);
    $urls = Upload::handleUpload($files);
    $db = Database::getInstance(); svp_ensure_media_schema($db);
    $items = [];
    $source = svp_media_source_context((string) ($_POST['sourceContext'] ?? 'media_library'));
    foreach ($urls as $index => $url) {
        $row = svp_media_register_upload($db, $url, (string) $payload['sub'], $source, $metadata[$index] ?? []);
        $items[] = svp_media_response($row);
    }
    Response::json(['items' => $items, 'total' => count($items)], 201);
});

$router->add('PATCH', '/api/svp/admin/media/{id}', function ($params) {
    $payload = svp_require_role('admin_tong', 'admin');
    $db = Database::getInstance(); svp_ensure_media_schema($db);
    $stmt = $db->prepare('SELECT * FROM svp_media_library WHERE id=:id AND deleted_at IS NULL');
    $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy ảnh trong kho.');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $title = substr(trim((string) ($input['title'] ?? $old['title'])), 0, 255);
    $altText = substr(trim((string) ($input['altText'] ?? $old['alt_text'])), 0, 500);
    $db->prepare('UPDATE svp_media_library SET title=:title,alt_text=:alt_text WHERE id=:id')->execute([
        'title' => $title, 'alt_text' => $altText, 'id' => $params['id'],
    ]);
    $next = array_merge($old, ['title' => $title, 'alt_text' => $altText]);
    svp_insert_audit($db, (string) $payload['sub'], 'update', 'media_library', (string) $params['id'], $old, $next);
    Response::json(['item' => svp_media_response($next)]);
});

$router->add('DELETE', '/api/svp/admin/media/{id}', function ($params) {
    $payload = svp_require_role('admin_tong');
    $db = Database::getInstance(); svp_ensure_media_schema($db);
    $stmt = $db->prepare('SELECT * FROM svp_media_library WHERE id=:id AND deleted_at IS NULL');
    $stmt->execute(['id' => $params['id']]); $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Không tìm thấy ảnh trong kho.');
    $db->prepare('UPDATE svp_media_library SET deleted_at=NOW() WHERE id=:id')->execute(['id' => $params['id']]);
    svp_insert_audit($db, (string) $payload['sub'], 'delete', 'media_library', (string) $params['id'], $old, ['hiddenFromLibrary' => true]);
    Response::json(['deleted' => true, 'id' => (string) $params['id']]);
});
