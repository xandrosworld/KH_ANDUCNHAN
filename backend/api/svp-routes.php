<?php
/**
 * So Do Van Phuc API routes.
 *
 * This file extends the inherited PHP router without touching older endpoints.
 * Tables are defined in sql/sodovanphuc_schema.sql.
 */

function svp_json_encode($value): ?string
{
    if ($value === null) return null;
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function svp_json_decode(?string $value, $fallback = [])
{
    if (!$value) return $fallback;
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function svp_actor_id(): ?string
{
    $payload = Auth::getPayload();
    if (!$payload) return null;
    return (string) ($payload['sub'] ?? $payload['id'] ?? $payload['email'] ?? '');
}

function svp_uid(string $prefix): string
{
    return $prefix . '_' . date('ymdHis') . '_' . bin2hex(random_bytes(4));
}

function svp_next_property_code(PDO $db): string
{
    $count = (int) $db->query('SELECT COUNT(*) FROM svp_properties')->fetchColumn();
    return 'SVP' . str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
}

function svp_option_to_response(array $row): array
{
    return [
        'id'        => (string) $row['id'],
        'groupId'   => (string) $row['group_id'],
        'label'     => (string) $row['label'],
        'value'     => (string) $row['value'],
        'score'     => $row['score'] === null ? null : (float) $row['score'],
        'metadata'  => svp_json_decode($row['metadata_json'] ?? null, null),
        'sortOrder' => (int) ($row['sort_order'] ?? 0),
        'isActive'  => (bool) ($row['is_active'] ?? 1),
    ];
}

function svp_property_to_response(array $row): array
{
    return [
        'id'             => (string) $row['id'],
        'code'           => (string) $row['code'],
        'title'          => (string) $row['title'],
        'description'    => (string) ($row['description'] ?? ''),
        'ownerName'      => (string) ($row['owner_name'] ?? ''),
        'ownerPhone'     => (string) ($row['owner_phone'] ?? ''),
        'bookSerial'     => (string) ($row['book_serial'] ?? ''),
        'price'          => (float) ($row['price'] ?? 0),
        'priceUnit'      => (string) ($row['price_unit'] ?? 'VND'),
        'areaM2'         => $row['area_m2'] === null ? null : (float) $row['area_m2'],
        'district'       => (string) ($row['district'] ?? ''),
        'ward'           => (string) ($row['ward'] ?? ''),
        'address'        => (string) ($row['address'] ?? ''),
        'hiddenAddress'  => (string) ($row['hidden_address'] ?? ''),
        'companyUnitId'  => (string) ($row['company_unit_id'] ?? ''),
        'statusId'       => (string) ($row['status_id'] ?? ''),
        'expertId'       => (string) ($row['expert_id'] ?? ''),
        'assignedUserId' => (string) ($row['assigned_user_id'] ?? ''),
        'signingScore'   => (float) ($row['signing_score'] ?? 0),
        'visibilityIds'  => svp_json_decode($row['visibility_json'] ?? null, []),
        'tagIds'         => svp_json_decode($row['tags_json'] ?? null, []),
        'extra'          => svp_json_decode($row['extra_json'] ?? null, []),
        'createdBy'      => (string) ($row['created_by'] ?? ''),
        'updatedBy'      => (string) ($row['updated_by'] ?? ''),
        'createdAt'      => (string) ($row['created_at'] ?? ''),
        'updatedAt'      => (string) ($row['updated_at'] ?? ''),
    ];
}

function svp_insert_audit(PDO $db, ?string $actorId, string $action, string $entityType, ?string $entityId, $oldValue, $newValue): void
{
    $stmt = $db->prepare(
        'INSERT INTO svp_audit_logs (actor_id, action, entity_type, entity_id, old_json, new_json, ip_address, user_agent)
         VALUES (:actor_id, :action, :entity_type, :entity_id, :old_json, :new_json, :ip_address, :user_agent)'
    );
    $stmt->execute([
        'actor_id'   => $actorId,
        'action'     => $action,
        'entity_type'=> $entityType,
        'entity_id'  => $entityId,
        'old_json'   => svp_json_encode($oldValue),
        'new_json'   => svp_json_encode($newValue),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
    ]);
}

function svp_insert_property_version(PDO $db, string $propertyId, array $snapshot, ?string $actorId, string $note): void
{
    $stmt = $db->prepare('SELECT COALESCE(MAX(version_no), 0) + 1 FROM svp_property_versions WHERE property_id = :id');
    $stmt->execute(['id' => $propertyId]);
    $versionNo = (int) $stmt->fetchColumn();
    $insert = $db->prepare(
        'INSERT INTO svp_property_versions (property_id, version_no, snapshot_json, changed_by, change_note)
         VALUES (:property_id, :version_no, :snapshot_json, :changed_by, :change_note)'
    );
    $insert->execute([
        'property_id'   => $propertyId,
        'version_no'    => $versionNo,
        'snapshot_json' => svp_json_encode($snapshot),
        'changed_by'    => $actorId,
        'change_note'   => $note,
    ]);
}

function svp_delete_row_by_id(PDO $db, string $table, string $entityType, string $id, ?string $actorId): bool
{
    $select = $db->prepare("SELECT * FROM `{$table}` WHERE id = :id LIMIT 1");
    $select->execute(['id' => $id]);
    $oldRow = $select->fetch(PDO::FETCH_ASSOC);
    if (!$oldRow) {
        return false;
    }

    $delete = $db->prepare("DELETE FROM `{$table}` WHERE id = :id");
    $delete->execute(['id' => $id]);
    svp_insert_audit($db, $actorId, 'delete', $entityType, $id, $oldRow, ['deleted' => true]);
    return $delete->rowCount() > 0;
}

function svp_insert_property_timeline(PDO $db, string $propertyId, string $eventType, string $title, ?string $description, ?string $actorId, $payload): void
{
    $stmt = $db->prepare(
        'INSERT INTO svp_property_timeline (property_id, event_type, title, description, actor_id, payload_json)
         VALUES (:property_id, :event_type, :title, :description, :actor_id, :payload_json)'
    );
    $stmt->execute([
        'property_id'  => $propertyId,
        'event_type'   => $eventType,
        'title'        => $title,
        'description'  => $description,
        'actor_id'     => $actorId,
        'payload_json' => svp_json_encode($payload),
    ]);
}

$router->add('GET', '/api/svp/config', function () {
    $db = Database::getInstance();
    $groups = $db->query('SELECT * FROM svp_config_groups ORDER BY sort_order ASC, name ASC')->fetchAll(PDO::FETCH_ASSOC);
    $options = $db->query('SELECT * FROM svp_config_options ORDER BY sort_order ASC, label ASC')->fetchAll(PDO::FETCH_ASSOC);

    $groupMap = [];
    foreach ($groups as $group) {
        $id = (string) $group['id'];
        $groupMap[$id] = [
            'id'          => $id,
            'name'        => (string) $group['name'],
            'description' => $group['description'],
            'sortOrder'   => (int) ($group['sort_order'] ?? 0),
            'isSystem'    => (bool) ($group['is_system'] ?? 0),
            'options'     => [],
        ];
    }

    foreach ($options as $option) {
        $groupId = (string) $option['group_id'];
        if (!isset($groupMap[$groupId])) continue;
        $groupMap[$groupId]['options'][] = svp_option_to_response($option);
    }

    Response::json(['groups' => array_values($groupMap)]);
});

$router->add('POST', '/api/svp/config/options', function () use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();

    $groupId = trim((string) ($input['groupId'] ?? $input['group_id'] ?? ''));
    $label = trim((string) ($input['label'] ?? ''));
    $value = trim((string) ($input['value'] ?? strtolower(preg_replace('/\s+/', '_', $label))));
    if ($groupId === '' || $label === '') {
        Response::error('groupId and label are required', 400);
    }

    $item = [
        'id' => svp_uid('opt'),
        'group_id' => $groupId,
        'label' => $label,
        'value' => $value,
        'score' => isset($input['score']) ? (float) $input['score'] : null,
        'metadata_json' => svp_json_encode($input['metadata'] ?? null),
        'sort_order' => (int) ($input['sortOrder'] ?? $input['sort_order'] ?? 0),
        'is_active' => isset($input['isActive']) ? (int) (bool) $input['isActive'] : 1,
    ];

    $stmt = $db->prepare(
        'INSERT INTO svp_config_options (id, group_id, label, value, score, metadata_json, sort_order, is_active)
         VALUES (:id, :group_id, :label, :value, :score, :metadata_json, :sort_order, :is_active)'
    );
    $stmt->execute($item);
    svp_insert_audit($db, svp_actor_id(), 'create', 'config_option', $item['id'], null, $item);

    Response::json(['item' => svp_option_to_response($item)], 201);
});

$router->add('PUT', '/api/svp/config/options/{id}', function ($params) use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = (string) $params['id'];

    $stmt = $db->prepare('SELECT * FROM svp_config_options WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Config option not found');

    $next = [
        'label' => trim((string) ($input['label'] ?? $old['label'])),
        'value' => trim((string) ($input['value'] ?? $old['value'])),
        'score' => array_key_exists('score', $input) ? $input['score'] : $old['score'],
        'metadata_json' => array_key_exists('metadata', $input) ? svp_json_encode($input['metadata']) : $old['metadata_json'],
        'sort_order' => (int) ($input['sortOrder'] ?? $input['sort_order'] ?? $old['sort_order']),
        'is_active' => array_key_exists('isActive', $input) ? (int) (bool) $input['isActive'] : (int) $old['is_active'],
        'id' => $id,
    ];

    $update = $db->prepare(
        'UPDATE svp_config_options
         SET label = :label, value = :value, score = :score, metadata_json = :metadata_json, sort_order = :sort_order, is_active = :is_active
         WHERE id = :id'
    );
    $update->execute($next);
    svp_insert_audit($db, svp_actor_id(), 'update', 'config_option', $id, $old, $next);

    $stmt->execute(['id' => $id]);
    Response::json(['item' => svp_option_to_response($stmt->fetch(PDO::FETCH_ASSOC))]);
});

$router->add('GET', '/api/svp/properties', function () {
    $db = Database::getInstance();
    $where = ['deleted_at IS NULL'];
    $params = [];

    if (!empty($_GET['q'])) {
        $where[] = '(title LIKE :q_title OR owner_name LIKE :q_owner_name OR owner_phone LIKE :q_owner_phone OR book_serial LIKE :q_book_serial OR address LIKE :q_address)';
        $search = '%' . $_GET['q'] . '%';
        $params['q_title'] = $search;
        $params['q_owner_name'] = $search;
        $params['q_owner_phone'] = $search;
        $params['q_book_serial'] = $search;
        $params['q_address'] = $search;
    }
    if (!empty($_GET['district'])) {
        $where[] = 'district = :district';
        $params['district'] = $_GET['district'];
    }
    if (!empty($_GET['companyUnitId'])) {
        $where[] = 'company_unit_id = :company';
        $params['company'] = $_GET['companyUnitId'];
    }
    if (!empty($_GET['statusId'])) {
        $where[] = 'status_id = :status';
        $params['status'] = $_GET['statusId'];
    }

    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM svp_properties {$whereSql} ORDER BY updated_at DESC LIMIT 200");
    $stmt->execute($params);
    $items = array_map('svp_property_to_response', $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/properties', function () use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('prop');
    $code = svp_next_property_code($db);

    $row = [
        'id' => $id,
        'code' => $code,
        'title' => trim((string) ($input['title'] ?? '')),
        'description' => trim((string) ($input['description'] ?? '')),
        'owner_name' => trim((string) ($input['ownerName'] ?? $input['owner_name'] ?? '')),
        'owner_phone' => trim((string) ($input['ownerPhone'] ?? $input['owner_phone'] ?? '')),
        'book_serial' => trim((string) ($input['bookSerial'] ?? $input['book_serial'] ?? '')),
        'price' => (float) ($input['price'] ?? 0),
        'price_unit' => trim((string) ($input['priceUnit'] ?? $input['price_unit'] ?? 'VND')),
        'area_m2' => isset($input['areaM2']) ? (float) $input['areaM2'] : null,
        'district' => trim((string) ($input['district'] ?? '')),
        'ward' => trim((string) ($input['ward'] ?? '')),
        'address' => trim((string) ($input['address'] ?? '')),
        'hidden_address' => trim((string) ($input['hiddenAddress'] ?? $input['hidden_address'] ?? '')),
        'company_unit_id' => trim((string) ($input['companyUnitId'] ?? $input['company_unit_id'] ?? '')),
        'status_id' => trim((string) ($input['statusId'] ?? $input['status_id'] ?? 'st_new')),
        'expert_id' => trim((string) ($input['expertId'] ?? $input['expert_id'] ?? '')),
        'assigned_user_id' => trim((string) ($input['assignedUserId'] ?? $input['assigned_user_id'] ?? '')),
        'signing_score' => (float) ($input['signingScore'] ?? $input['signing_score'] ?? 0),
        'visibility_json' => svp_json_encode($input['visibilityIds'] ?? $input['visibility_ids'] ?? []),
        'tags_json' => svp_json_encode($input['tagIds'] ?? $input['tag_ids'] ?? []),
        'extra_json' => svp_json_encode($input['extra'] ?? []),
        'created_by' => $actorId,
        'updated_by' => $actorId,
    ];

    if ($row['title'] === '') Response::error('title is required', 400);

    $stmt = $db->prepare(
        'INSERT INTO svp_properties
        (id, code, title, description, owner_name, owner_phone, book_serial, price, price_unit, area_m2,
         district, ward, address, hidden_address, company_unit_id, status_id, expert_id, assigned_user_id,
         signing_score, visibility_json, tags_json, extra_json, created_by, updated_by)
         VALUES
        (:id, :code, :title, :description, :owner_name, :owner_phone, :book_serial, :price, :price_unit, :area_m2,
         :district, :ward, :address, :hidden_address, :company_unit_id, :status_id, :expert_id, :assigned_user_id,
         :signing_score, :visibility_json, :tags_json, :extra_json, :created_by, :updated_by)'
    );
    $stmt->execute($row);

    $select = $db->prepare('SELECT * FROM svp_properties WHERE id = :id');
    $select->execute(['id' => $id]);
    $created = $select->fetch(PDO::FETCH_ASSOC);
    $response = svp_property_to_response($created);

    svp_insert_property_version($db, $id, $response, $actorId, 'created');
    svp_insert_property_timeline($db, $id, 'created', 'Tao nha', null, $actorId, $response);
    svp_insert_audit($db, $actorId, 'create', 'property', $id, null, $response);

    Response::json(['item' => $response], 201);
});

$router->add('GET', '/api/svp/properties/{id}', function ($params) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM svp_properties WHERE (id = :id OR code = :code) AND deleted_at IS NULL LIMIT 1');
    $stmt->execute(['id' => $params['id'], 'code' => $params['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) Response::notFound('Property not found');
    Response::json(['item' => svp_property_to_response($row)]);
});

$router->add('PUT', '/api/svp/properties/{id}', function ($params) use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = (string) $params['id'];

    $stmt = $db->prepare('SELECT * FROM svp_properties WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Property not found');

    $fields = [
        'title' => 'title',
        'description' => 'description',
        'ownerName' => 'owner_name',
        'ownerPhone' => 'owner_phone',
        'bookSerial' => 'book_serial',
        'price' => 'price',
        'priceUnit' => 'price_unit',
        'areaM2' => 'area_m2',
        'district' => 'district',
        'ward' => 'ward',
        'address' => 'address',
        'hiddenAddress' => 'hidden_address',
        'companyUnitId' => 'company_unit_id',
        'statusId' => 'status_id',
        'expertId' => 'expert_id',
        'assignedUserId' => 'assigned_user_id',
        'signingScore' => 'signing_score',
    ];

    $set = [];
    $paramsSql = ['id' => $id, 'updated_by' => $actorId];
    foreach ($fields as $camel => $column) {
        if (!array_key_exists($camel, $input) && !array_key_exists($column, $input)) continue;
        $value = $input[$camel] ?? $input[$column];
        $set[] = "{$column} = :{$column}";
        $paramsSql[$column] = $value;
    }
    if (array_key_exists('visibilityIds', $input)) {
        $set[] = 'visibility_json = :visibility_json';
        $paramsSql['visibility_json'] = svp_json_encode($input['visibilityIds']);
    }
    if (array_key_exists('tagIds', $input)) {
        $set[] = 'tags_json = :tags_json';
        $paramsSql['tags_json'] = svp_json_encode($input['tagIds']);
    }
    if (array_key_exists('extra', $input)) {
        $set[] = 'extra_json = :extra_json';
        $paramsSql['extra_json'] = svp_json_encode($input['extra']);
    }

    if (empty($set)) Response::error('No fields to update', 400);
    $set[] = 'updated_by = :updated_by';
    $sql = 'UPDATE svp_properties SET ' . implode(', ', $set) . ' WHERE id = :id';
    $db->prepare($sql)->execute($paramsSql);

    $stmt->execute(['id' => $id]);
    $new = $stmt->fetch(PDO::FETCH_ASSOC);
    $response = svp_property_to_response($new);
    svp_insert_property_version($db, $id, $response, $actorId, 'updated');
    svp_insert_property_timeline($db, $id, 'updated', 'Cap nhat nha', null, $actorId, ['old' => svp_property_to_response($old), 'new' => $response]);
    svp_insert_audit($db, $actorId, 'update', 'property', $id, svp_property_to_response($old), $response);

    Response::json(['item' => $response]);
});

$router->add('DELETE', '/api/svp/properties/{id}', function ($params) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = (string) $params['id'];
    $db->prepare('UPDATE svp_properties SET deleted_at = NOW(), updated_by = :actor WHERE id = :id')
       ->execute(['actor' => $actorId, 'id' => $id]);
    svp_insert_audit($db, $actorId, 'delete', 'property', $id, null, ['deleted' => true]);
    Response::json(['deleted' => true]);
});

$router->add('GET', '/api/svp/properties/{id}/timeline', function ($params) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM svp_property_timeline WHERE property_id = :id ORDER BY created_at DESC LIMIT 100');
    $stmt->execute(['id' => $params['id']]);
    $items = array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'propertyId' => (string) $row['property_id'],
            'eventType' => (string) $row['event_type'],
            'title' => (string) $row['title'],
            'description' => $row['description'],
            'actorId' => $row['actor_id'],
            'payload' => svp_json_decode($row['payload_json'] ?? null, null),
            'createdAt' => (string) $row['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items]);
});

$router->add('GET', '/api/svp/properties/{id}/versions', function ($params) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM svp_property_versions WHERE property_id = :id ORDER BY version_no DESC LIMIT 50');
    $stmt->execute(['id' => $params['id']]);
    $items = array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'propertyId' => (string) $row['property_id'],
            'versionNo' => (int) $row['version_no'],
            'snapshot' => svp_json_decode($row['snapshot_json'] ?? null, []),
            'changedBy' => $row['changed_by'],
            'changeNote' => $row['change_note'],
            'createdAt' => (string) $row['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items]);
});

$router->add('GET', '/api/svp/properties/{id}/media', function ($params) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM svp_property_media WHERE property_id = :id ORDER BY sort_order ASC, created_at DESC LIMIT 100');
    $stmt->execute(['id' => $params['id']]);
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'propertyId' => (string) $row['property_id'],
            'mediaType' => (string) ($row['media_type'] ?? 'image'),
            'url' => (string) $row['url'],
            'caption' => (string) ($row['caption'] ?? ''),
            'sortOrder' => (int) ($row['sort_order'] ?? 0),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items]);
});

$router->add('POST', '/api/svp/properties/{id}/media', function ($params) use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('media');
    $row = [
        'id' => $id,
        'property_id' => (string) $params['id'],
        'media_type' => trim((string) ($input['mediaType'] ?? $input['media_type'] ?? 'image')),
        'url' => trim((string) ($input['url'] ?? '')),
        'caption' => trim((string) ($input['caption'] ?? '')),
        'sort_order' => (int) ($input['sortOrder'] ?? $input['sort_order'] ?? 0),
    ];
    if ($row['url'] === '') Response::error('url is required', 400);
    $stmt = $db->prepare(
        'INSERT INTO svp_property_media (id, property_id, media_type, url, caption, sort_order)
         VALUES (:id, :property_id, :media_type, :url, :caption, :sort_order)'
    );
    $stmt->execute($row);
    $response = [
        'id' => $id,
        'propertyId' => $row['property_id'],
        'mediaType' => $row['media_type'],
        'url' => $row['url'],
        'caption' => $row['caption'],
        'sortOrder' => $row['sort_order'],
        'createdAt' => date('c'),
    ];
    svp_insert_property_timeline($db, $row['property_id'], 'media_added', 'Them media', $row['caption'], $actorId, $response);
    svp_insert_audit($db, $actorId, 'create', 'property_media', $id, null, $response);
    Response::json(['item' => $response], 201);
});

$router->add('POST', '/api/svp/properties/{id}/media-upload', function ($params) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $propertyId = (string) $params['id'];

    $exists = $db->prepare('SELECT id FROM svp_properties WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $exists->execute(['id' => $propertyId]);
    if (!$exists->fetch(PDO::FETCH_ASSOC)) {
        Response::notFound('Property not found');
    }

    if (empty($_FILES['images'])) {
        Response::error('No images provided. Send image files with field name "images".', 400);
    }

    $caption = trim((string) ($_POST['caption'] ?? 'Anh / tai lieu nha'));
    $category = trim((string) ($_POST['category'] ?? 'property_image'));
    $urls = Upload::handleUpload($_FILES['images']);

    $orderStmt = $db->prepare('SELECT COALESCE(MAX(sort_order), 0) FROM svp_property_media WHERE property_id = :id');
    $orderStmt->execute(['id' => $propertyId]);
    $sortOrder = (int) $orderStmt->fetchColumn();

    $items = [];
    $insert = $db->prepare(
        'INSERT INTO svp_property_media (id, property_id, media_type, url, caption, sort_order)
         VALUES (:id, :property_id, :media_type, :url, :caption, :sort_order)'
    );

    foreach ($urls as $index => $url) {
        $id = svp_uid('media');
        $itemCaption = $caption;
        if (count($urls) > 1) {
            $itemCaption .= ' #' . ($index + 1);
        }

        $row = [
            'id' => $id,
            'property_id' => $propertyId,
            'media_type' => 'image',
            'url' => $url,
            'caption' => $itemCaption,
            'sort_order' => $sortOrder + $index + 1,
        ];
        $insert->execute($row);

        $response = [
            'id' => $id,
            'propertyId' => $propertyId,
            'mediaType' => 'image',
            'url' => $url,
            'caption' => $itemCaption,
            'sortOrder' => $row['sort_order'],
            'createdAt' => date('c'),
        ];
        $items[] = $response;
        svp_insert_audit($db, $actorId, 'create', 'property_media', $id, null, $response);
    }

    svp_insert_property_timeline(
        $db,
        $propertyId,
        'media_uploaded',
        'Upload anh / tai lieu',
        $caption,
        $actorId,
        ['category' => $category, 'count' => count($items)]
    );
    svp_insert_audit($db, $actorId, 'create', 'property_media_upload', $propertyId, null, ['category' => $category, 'items' => $items]);

    Response::json(['items' => $items, 'total' => count($items)], 201);
});

$router->add('GET', '/api/svp/customers', function () {
    $db = Database::getInstance();
    $stmt = $db->query('SELECT * FROM svp_customers ORDER BY updated_at DESC LIMIT 200');
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'fullName' => (string) $row['full_name'],
            'phone' => (string) $row['phone'],
            'email' => (string) ($row['email'] ?? ''),
            'source' => (string) ($row['source'] ?? ''),
            'statusId' => (string) ($row['status_id'] ?? ''),
            'assignedUserId' => (string) ($row['assigned_user_id'] ?? ''),
            'note' => (string) ($row['note'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/customers', function () use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('cus');
    $row = [
        'id' => $id,
        'full_name' => trim((string) ($input['fullName'] ?? $input['full_name'] ?? '')),
        'phone' => trim((string) ($input['phone'] ?? '')),
        'email' => trim((string) ($input['email'] ?? '')),
        'source' => trim((string) ($input['source'] ?? '')),
        'status_id' => trim((string) ($input['statusId'] ?? $input['status_id'] ?? 'cs_new')),
        'assigned_user_id' => trim((string) ($input['assignedUserId'] ?? $input['assigned_user_id'] ?? '')),
        'note' => trim((string) ($input['note'] ?? '')),
        'created_by' => $actorId,
    ];
    if ($row['full_name'] === '' || $row['phone'] === '') Response::error('fullName and phone are required', 400);
    $stmt = $db->prepare(
        'INSERT INTO svp_customers (id, full_name, phone, email, source, status_id, assigned_user_id, note, created_by)
         VALUES (:id, :full_name, :phone, :email, :source, :status_id, :assigned_user_id, :note, :created_by)'
    );
    $stmt->execute($row);
    svp_insert_audit($db, $actorId, 'create', 'customer', $id, null, $row);
    Response::json(['item' => [
        'id' => $id,
        'fullName' => $row['full_name'],
        'phone' => $row['phone'],
        'email' => $row['email'],
        'source' => $row['source'],
        'statusId' => $row['status_id'],
        'assignedUserId' => $row['assigned_user_id'],
        'note' => $row['note'],
        'createdAt' => date('c'),
    ]], 201);
});

$router->add('DELETE', '/api/svp/customers/{id}', function ($params) {
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('customer id is required', 400);
    $deleted = svp_delete_row_by_id($db, 'svp_customers', 'customer', $id, svp_actor_id());
    Response::json(['deleted' => $deleted]);
});

$router->add('GET', '/api/svp/customer-needs', function () {
    $db = Database::getInstance();
    $customerId = trim((string) ($_GET['customerId'] ?? ''));
    if ($customerId !== '') {
        $stmt = $db->prepare('SELECT * FROM svp_customer_needs WHERE customer_id = :customer_id ORDER BY updated_at DESC LIMIT 200');
        $stmt->execute(['customer_id' => $customerId]);
    } else {
        $stmt = $db->query('SELECT * FROM svp_customer_needs ORDER BY updated_at DESC LIMIT 200');
    }
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'customerId' => (string) $row['customer_id'],
            'districtIds' => svp_json_decode($row['districts_json'] ?? null, []),
            'budgetMin' => isset($row['budget_min']) ? (float) $row['budget_min'] : null,
            'budgetMax' => isset($row['budget_max']) ? (float) $row['budget_max'] : null,
            'areaMin' => isset($row['area_min']) ? (float) $row['area_min'] : null,
            'areaMax' => isset($row['area_max']) ? (float) $row['area_max'] : null,
            'tagIds' => svp_json_decode($row['tags_json'] ?? null, []),
            'description' => (string) ($row['description'] ?? ''),
            'statusId' => (string) ($row['status_id'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/customer-needs', function () use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('need');
    $row = [
        'id' => $id,
        'customer_id' => trim((string) ($input['customerId'] ?? $input['customer_id'] ?? '')),
        'districts_json' => svp_json_encode($input['districtIds'] ?? $input['district_ids'] ?? []),
        'budget_min' => isset($input['budgetMin']) ? (float) $input['budgetMin'] : null,
        'budget_max' => isset($input['budgetMax']) ? (float) $input['budgetMax'] : null,
        'area_min' => isset($input['areaMin']) ? (float) $input['areaMin'] : null,
        'area_max' => isset($input['areaMax']) ? (float) $input['areaMax'] : null,
        'tags_json' => svp_json_encode($input['tagIds'] ?? $input['tag_ids'] ?? []),
        'description' => trim((string) ($input['description'] ?? '')),
        'status_id' => trim((string) ($input['statusId'] ?? $input['status_id'] ?? 'new')),
    ];
    if ($row['customer_id'] === '') Response::error('customerId is required', 400);
    $stmt = $db->prepare(
        'INSERT INTO svp_customer_needs
        (id, customer_id, districts_json, budget_min, budget_max, area_min, area_max, tags_json, description, status_id)
        VALUES (:id, :customer_id, :districts_json, :budget_min, :budget_max, :area_min, :area_max, :tags_json, :description, :status_id)'
    );
    $stmt->execute($row);
    $response = [
        'id' => $id,
        'customerId' => $row['customer_id'],
        'districtIds' => svp_json_decode($row['districts_json'], []),
        'budgetMin' => $row['budget_min'],
        'budgetMax' => $row['budget_max'],
        'areaMin' => $row['area_min'],
        'areaMax' => $row['area_max'],
        'tagIds' => svp_json_decode($row['tags_json'], []),
        'description' => $row['description'],
        'statusId' => $row['status_id'],
        'createdAt' => date('c'),
    ];
    svp_insert_audit($db, $actorId, 'create', 'customer_need', $id, null, $response);
    Response::json(['item' => $response], 201);
});

$router->add('DELETE', '/api/svp/customer-needs/{id}', function ($params) {
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('customer need id is required', 400);
    $deleted = svp_delete_row_by_id($db, 'svp_customer_needs', 'customer_need', $id, svp_actor_id());
    Response::json(['deleted' => $deleted]);
});

$router->add('GET', '/api/svp/viewing-schedules', function () {
    $db = Database::getInstance();
    $stmt = $db->query('SELECT * FROM svp_viewing_schedules ORDER BY scheduled_at DESC, created_at DESC LIMIT 200');
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'customerId' => $row['customer_id'],
            'propertyId' => $row['property_id'],
            'scheduledAt' => $row['scheduled_at'],
            'status' => (string) ($row['status'] ?? 'pending'),
            'note' => (string) ($row['note'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/viewing-schedules', function () use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('view');
    $row = [
        'id' => $id,
        'customer_id' => trim((string) ($input['customerId'] ?? $input['customer_id'] ?? '')),
        'property_id' => trim((string) ($input['propertyId'] ?? $input['property_id'] ?? '')),
        'scheduled_at' => trim((string) ($input['scheduledAt'] ?? $input['scheduled_at'] ?? '')),
        'status' => trim((string) ($input['status'] ?? 'pending')),
        'note' => trim((string) ($input['note'] ?? '')),
        'created_by' => $actorId,
    ];
    if ($row['customer_id'] === '') Response::error('customerId is required', 400);
    $stmt = $db->prepare(
        'INSERT INTO svp_viewing_schedules
        (id, customer_id, property_id, scheduled_at, status, note, created_by)
        VALUES (:id, :customer_id, :property_id, :scheduled_at, :status, :note, :created_by)'
    );
    $stmt->execute($row);
    $response = [
        'id' => $id,
        'customerId' => $row['customer_id'],
        'propertyId' => $row['property_id'],
        'scheduledAt' => $row['scheduled_at'],
        'status' => $row['status'],
        'note' => $row['note'],
        'createdAt' => date('c'),
    ];
    svp_insert_audit($db, $actorId, 'create', 'viewing_schedule', $id, null, $response);
    Response::json(['item' => $response], 201);
});

$router->add('DELETE', '/api/svp/viewing-schedules/{id}', function ($params) {
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('viewing schedule id is required', 400);
    $deleted = svp_delete_row_by_id($db, 'svp_viewing_schedules', 'viewing_schedule', $id, svp_actor_id());
    Response::json(['deleted' => $deleted]);
});

$router->add('GET', '/api/svp/referrals', function () {
    $db = Database::getInstance();
    $stmt = $db->query('SELECT * FROM svp_referrals ORDER BY created_at DESC LIMIT 200');
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'referrerUserId' => $row['referrer_user_id'],
            'referredUserId' => $row['referred_user_id'],
            'referralCode' => (string) $row['referral_code'],
            'referralType' => (string) ($row['referral_type'] ?? 'other'),
            'status' => (string) ($row['status'] ?? 'new'),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/referrals', function () use ($input) {
    $db = Database::getInstance();
    $actorId = svp_actor_id();
    $id = svp_uid('ref');
    $row = [
        'id' => $id,
        'referrer_user_id' => trim((string) ($input['referrerUserId'] ?? $input['referrer_user_id'] ?? '')),
        'referred_user_id' => trim((string) ($input['referredUserId'] ?? $input['referred_user_id'] ?? '')),
        'referral_code' => trim((string) ($input['referralCode'] ?? $input['referral_code'] ?? '')),
        'referral_type' => trim((string) ($input['referralType'] ?? $input['referral_type'] ?? 'other')),
        'status' => trim((string) ($input['status'] ?? 'new')),
    ];
    if ($row['referral_code'] === '') Response::error('referralCode is required', 400);
    $stmt = $db->prepare(
        'INSERT INTO svp_referrals
        (id, referrer_user_id, referred_user_id, referral_code, referral_type, status)
        VALUES (:id, :referrer_user_id, :referred_user_id, :referral_code, :referral_type, :status)'
    );
    $stmt->execute($row);
    $response = [
        'id' => $id,
        'referrerUserId' => $row['referrer_user_id'],
        'referredUserId' => $row['referred_user_id'],
        'referralCode' => $row['referral_code'],
        'referralType' => $row['referral_type'],
        'status' => $row['status'],
        'createdAt' => date('c'),
    ];
    svp_insert_audit($db, $actorId, 'create', 'referral', $id, null, $response);
    Response::json(['item' => $response], 201);
});

$router->add('DELETE', '/api/svp/referrals/{id}', function ($params) {
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('referral id is required', 400);
    $deleted = svp_delete_row_by_id($db, 'svp_referrals', 'referral', $id, svp_actor_id());
    Response::json(['deleted' => $deleted]);
});

$router->add('GET', '/api/svp/audit-logs', function () {
    $db = Database::getInstance();
    $where = [];
    $params = [];

    foreach ([
        'entityId' => 'entity_id',
        'entityType' => 'entity_type',
        'action' => 'action',
        'actorId' => 'actor_id',
    ] as $queryKey => $column) {
        if (isset($_GET[$queryKey]) && trim((string) $_GET[$queryKey]) !== '') {
            $where[] = "{$column} = :{$queryKey}";
            $params[$queryKey] = trim((string) $_GET[$queryKey]);
        }
    }

    $limit = min(500, max(1, (int) ($_GET['limit'] ?? 300)));
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $stmt = $db->prepare("SELECT * FROM svp_audit_logs {$whereClause} ORDER BY created_at DESC LIMIT :limit");
    foreach ($params as $key => $value) {
        $stmt->bindValue(":{$key}", $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $items = array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'actorId' => $row['actor_id'],
            'action' => (string) $row['action'],
            'entityType' => (string) $row['entity_type'],
            'entityId' => $row['entity_id'],
            'oldValue' => svp_json_decode($row['old_json'] ?? null, null),
            'newValue' => svp_json_decode($row['new_json'] ?? null, null),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    Response::json(['items' => $items, 'total' => count($items)]);
});
