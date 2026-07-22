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

function svp_access_context(): array
{
    $payload = Auth::getPayload();
    if (!$payload) {
        return [null, null];
    }

    $activeRole = (string) ($payload['role'] ?? $payload['activeRole'] ?? '');
    if ($activeRole === '' && !empty($payload['roles']) && is_array($payload['roles'])) {
        foreach ($payload['roles'] as $role) {
            if (($role['status'] ?? '') === 'approved') {
                $activeRole = (string) ($role['slug'] ?? '');
                break;
            }
        }
    }

    return [$activeRole ?: null, (string) ($payload['sub'] ?? $payload['id'] ?? '')];
}

function svp_apply_property_access_filter(array $property): array
{
    [$activeRole, $userId] = svp_access_context();
    if (function_exists('svp_filter_property_by_role')) {
        return svp_filter_property_by_role($property, $activeRole, $userId);
    }
    return $property;
}

function svp_uid(string $prefix): string
{
    return $prefix . '_' . date('ymdHis') . '_' . bin2hex(random_bytes(4));
}

function svp_role_approval_definitions(): array
{
    return [
        ['slug' => 'khach_mua', 'label' => 'Khách mua', 'group' => 'Cơ bản', 'description' => 'Tìm nguồn nhà phù hợp nhu cầu', 'requiresApproval' => false, 'isActive' => true, 'sortOrder' => 10],
        ['slug' => 'chu_nha', 'label' => 'Chủ nhà', 'group' => 'Cơ bản', 'description' => 'Gửi thông tin nhà cần bán', 'requiresApproval' => false, 'isActive' => true, 'sortOrder' => 20],
        ['slug' => 'nguoi_gioi_thieu', 'label' => 'CTV giới thiệu nhân sự', 'group' => 'Cơ bản', 'description' => 'Giới thiệu nhân sự - nhận ghi nhận hệ thống', 'requiresApproval' => false, 'isActive' => true, 'sortOrder' => 30],
        ['slug' => 'ctv_khach', 'label' => 'CTV giới thiệu khách', 'group' => 'Cơ bản', 'description' => 'Cộng tác viên giới thiệu khách mua', 'requiresApproval' => false, 'isActive' => true, 'sortOrder' => 40],
        ['slug' => 'ctv_nguon', 'label' => 'CTV giới thiệu nguồn', 'group' => 'Cơ bản', 'description' => 'Giới thiệu chủ nhà hoặc nguồn nhà phù hợp', 'requiresApproval' => false, 'isActive' => true, 'sortOrder' => 50],
        ['slug' => 'doi_tac', 'label' => 'Đối tác', 'group' => 'Đối tác', 'description' => 'Kết nối dịch vụ hỗ trợ giao dịch', 'requiresApproval' => false, 'isActive' => false, 'sortOrder' => 60],
        ['slug' => 'chuyen_vien', 'label' => 'Cộng tác viên', 'group' => 'Nhân sự', 'description' => 'Tìm khách mua nhà', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 110],
        ['slug' => 'chuyen_gia', 'label' => 'Chuyên gia', 'group' => 'Nhân sự', 'description' => 'Tìm chủ bán nhà', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 120],
        ['slug' => 'hoc_vien', 'label' => 'Học viên', 'group' => 'Nhân sự', 'description' => 'Theo dõi việc cần làm và đào tạo nội bộ', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 125],
        ['slug' => 'tro_ly', 'label' => 'Trợ lý', 'group' => 'Nhân sự', 'description' => 'Hỗ trợ vận hành và quản lý hồ sơ', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 130],
        ['slug' => 'thu_ky', 'label' => 'Thư ký', 'group' => 'Nhân sự', 'description' => 'Theo dõi hồ sơ và lịch làm việc', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 140],
        ['slug' => 'truong_phong', 'label' => 'Trưởng phòng', 'group' => 'Quản lý', 'description' => 'Quản lý đội nhóm', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 210],
        ['slug' => 'pho_phong', 'label' => 'Phó phòng', 'group' => 'Quản lý', 'description' => 'Hỗ trợ quản lý phòng', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 220],
        ['slug' => 'giam_doc_khoi', 'label' => 'Giám đốc Khối', 'group' => 'Quản lý', 'description' => 'Quản lý cấp Khối', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 230],
        ['slug' => 'pho_giam_doc_khoi', 'label' => 'Phó Giám đốc Khối', 'group' => 'Quản lý', 'description' => 'Hỗ trợ quản lý cấp Khối', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 240],
        ['slug' => 'giam_doc', 'label' => 'Giám đốc Khu vực', 'group' => 'Quản lý', 'description' => 'Quản lý cấp Khu vực', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 250],
        ['slug' => 'pho_giam_doc_khu_vuc', 'label' => 'Phó Giám đốc Khu vực', 'group' => 'Quản lý', 'description' => 'Hỗ trợ quản lý cấp Khu vực', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 260],
        ['slug' => 'giam_doc_dieu_hanh', 'label' => 'Giám đốc Điều hành', 'group' => 'Quản lý', 'description' => 'Điều hành hệ thống', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 270],
        ['slug' => 'pho_giam_doc_dieu_hanh', 'label' => 'Phó Giám đốc Điều hành', 'group' => 'Quản lý', 'description' => 'Hỗ trợ điều hành hệ thống', 'requiresApproval' => true, 'isActive' => false, 'sortOrder' => 280],
        ['slug' => 'admin_tong', 'label' => 'Admin tổng', 'group' => 'Quản lý', 'description' => 'Quyền cao nhất dành cho chủ sở hữu hệ thống', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 890],
        ['slug' => 'admin', 'label' => 'Quản trị hệ thống', 'group' => 'Quản lý', 'description' => 'Quản trị toàn bộ hệ thống', 'requiresApproval' => true, 'isActive' => true, 'sortOrder' => 900],
    ];
}

function svp_role_approval_default_for(string $roleSlug): bool
{
    foreach (svp_role_approval_definitions() as $role) {
        if ($role['slug'] === $roleSlug) {
            return (bool) $role['requiresApproval'];
        }
    }
    return true;
}

function svp_role_definition_by_slug(string $roleSlug): ?array
{
    foreach (svp_role_approval_definitions() as $role) {
        if ($role['slug'] === $roleSlug) {
            return $role;
        }
    }
    return null;
}

function svp_role_setting_from_option(array $row): array
{
    $option = svp_option_to_response($row);
    $metadata = is_array($option['metadata'] ?? null) ? $option['metadata'] : [];
    $slug = (string) $option['value'];
    $definition = svp_role_definition_by_slug($slug);

    return [
        'id' => $option['id'],
        'slug' => $slug,
        'label' => $option['label'],
        'description' => (string) ($metadata['description'] ?? $definition['description'] ?? ''),
        'roleGroup' => (string) ($metadata['roleGroup'] ?? $definition['group'] ?? 'Khác'),
        'requiresApproval' => (bool) ($metadata['requiresApproval'] ?? $definition['requiresApproval'] ?? true),
        'registrationEnabled' => !in_array($slug, ['admin_tong', 'admin'], true) && $option['isActive'] !== false,
        'systemRole' => (bool) ($metadata['systemRole'] ?? (bool) $definition),
        'customRole' => (bool) ($metadata['customRole'] ?? !$definition),
        'sortOrder' => $option['sortOrder'],
    ];
}

function svp_role_registration_enabled_from_config(PDO $db, string $roleSlug): bool
{
    $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim($roleSlug)));
    if ($roleSlug === '' || in_array($roleSlug, ['admin_tong', 'admin'], true)) return false;

    try {
        svp_ensure_role_approval_config($db);
        $stmt = $db->prepare(
            "SELECT is_active
             FROM svp_config_options
             WHERE group_id = 'account_role_approval' AND value = :role
             LIMIT 1"
        );
        $stmt->execute(['role' => $roleSlug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? ((int) ($row['is_active'] ?? 0) === 1) : false;
    } catch (Throwable $e) {
        error_log('[SVP_ROLE_REGISTRATION_CONFIG] ' . $e->getMessage());
    }

    return false;
}

function svp_role_display_name_from_config(PDO $db, string $roleSlug): string
{
    $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim($roleSlug)));
    if ($roleSlug === '') return '';

    try {
        svp_ensure_role_approval_config($db);
        $stmt = $db->prepare(
            "SELECT label
             FROM svp_config_options
             WHERE group_id = 'account_role_approval' AND value = :role
             LIMIT 1"
        );
        $stmt->execute(['role' => $roleSlug]);
        $label = (string) ($stmt->fetchColumn() ?: '');
        if (trim($label) !== '') return $label;
    } catch (Throwable $e) {
        error_log('[SVP_ROLE_DISPLAY_CONFIG] ' . $e->getMessage());
    }

    $definition = svp_role_definition_by_slug($roleSlug);
    return $definition['label'] ?? $roleSlug;
}

function svp_ensure_role_approval_config(PDO $db): void
{
    $db->prepare(
        "INSERT INTO svp_config_groups (id, name, description, sort_order, is_system)
         VALUES ('account_role_approval', 'Duyệt tài khoản', 'Cấu hình loại tài khoản nào được dùng ngay hoặc cần quản trị viên duyệt', 5, 1)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           sort_order = VALUES(sort_order),
           is_system = VALUES(is_system)"
    )->execute();

    $stmt = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, 'account_role_approval', :label, :value, :metadata_json, :sort_order, :is_active)
         ON DUPLICATE KEY UPDATE
           sort_order = VALUES(sort_order),
           metadata_json = CASE
             WHEN metadata_json IS NULL OR metadata_json = '' THEN VALUES(metadata_json)
             ELSE metadata_json
           END"
    );

    foreach (svp_role_approval_definitions() as $role) {
        $stmt->execute([
            'id' => 'role_approval_' . $role['slug'],
            'label' => $role['label'],
            'value' => $role['slug'],
            'metadata_json' => svp_json_encode([
                'requiresApproval' => (bool) $role['requiresApproval'],
                'roleGroup' => $role['group'],
                'description' => $role['description'] ?? '',
                'systemRole' => true,
                'customRole' => false,
            ]),
            'sort_order' => (int) $role['sortOrder'],
            'is_active' => !empty($role['isActive']) ? 1 : 0,
        ]);
    }

    svp_restore_public_registration_roles_20260722($db);
}

function svp_restore_public_registration_roles_20260722(PDO $db): void
{
    static $checked = false;
    if ($checked) return;
    $checked = true;

    $migrationId = 'restore_public_registration_roles_20260722';
    try {
        $marker = $db->prepare(
            "SELECT 1
             FROM svp_audit_logs
             WHERE entity_type = 'system_migration' AND entity_id = :id
             LIMIT 1"
        );
        $marker->execute(['id' => $migrationId]);
        if ($marker->fetchColumn()) return;

        $activeSlugs = [
            'khach_mua',
            'chu_nha',
            'nguoi_gioi_thieu',
            'ctv_khach',
            'ctv_nguon',
            'chuyen_vien',
            'chuyen_gia',
            'hoc_vien',
            'truong_phong',
        ];
        $targetSlugs = array_merge($activeSlugs, ['giam_doc_khoi']);
        $select = $db->prepare(
            "SELECT *
             FROM svp_config_options
             WHERE group_id = 'account_role_approval' AND value = :slug
             LIMIT 1"
        );
        $update = $db->prepare(
            "UPDATE svp_config_options
             SET label = :label,
                 metadata_json = :metadata_json,
                 is_active = :is_active
             WHERE id = :id"
        );

        $db->beginTransaction();
        foreach ($targetSlugs as $slug) {
            $definition = svp_role_definition_by_slug($slug);
            if (!$definition) continue;

            $select->execute(['slug' => $slug]);
            $old = $select->fetch(PDO::FETCH_ASSOC);
            if (!$old) continue;

            $metadata = svp_json_decode($old['metadata_json'] ?? null, []);
            $metadata['description'] = (string) ($definition['description'] ?? '');
            $metadata['requiresApproval'] = (bool) $definition['requiresApproval'];
            $metadata['roleGroup'] = (string) $definition['group'];
            $metadata['systemRole'] = true;
            $metadata['customRole'] = false;
            $isActive = in_array($slug, $activeSlugs, true) ? 1 : 0;

            $update->execute([
                'label' => (string) $definition['label'],
                'metadata_json' => svp_json_encode($metadata),
                'is_active' => $isActive,
                'id' => $old['id'],
            ]);

            svp_insert_audit($db, 'system', 'restore', 'role_approval_setting', $slug, $old, [
                'label' => (string) $definition['label'],
                'description' => (string) ($definition['description'] ?? ''),
                'isActive' => (bool) $isActive,
            ]);
        }
        svp_insert_audit($db, 'system', 'apply', 'system_migration', $migrationId, null, [
            'activeRoleSlugs' => $activeSlugs,
            'disabledRoleSlugs' => ['giam_doc_khoi'],
        ]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('[SVP_ROLE_REGISTRATION_RESTORE] ' . $e->getMessage());
    }
}

function svp_property_field_locked_keys(): array
{
    return [
        'ownerName',
        'ownerPhone',
        'title',
        'province',
        'district',
        'ward',
        'price',
        'description',
        'houseImages',
    ];
}

function svp_role_requires_approval_from_config(PDO $db, string $roleSlug): bool
{
    $roleSlug = preg_replace('/[^a-z0-9_]/', '', strtolower(trim($roleSlug)));
    if ($roleSlug === '') return true;

    try {
        svp_ensure_role_approval_config($db);
        $stmt = $db->prepare(
            "SELECT metadata_json
             FROM svp_config_options
             WHERE group_id = 'account_role_approval' AND value = :role
             LIMIT 1"
        );
        $stmt->execute(['role' => $roleSlug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $metadata = svp_json_decode($row['metadata_json'] ?? null, []);
            if (array_key_exists('requiresApproval', $metadata)) {
                return (bool) $metadata['requiresApproval'];
            }
        }
    } catch (Throwable $e) {
        error_log('[SVP_ROLE_APPROVAL_CONFIG] ' . $e->getMessage());
    }

    return svp_role_approval_default_for($roleSlug);
}

function svp_property_field_label_definitions(): array
{
    return [
        ['key' => 'ownerName', 'label' => 'Tên chủ nhà', 'sortOrder' => 10],
        ['key' => 'ownerPhone', 'label' => 'SĐT chủ nhà', 'sortOrder' => 20],
        ['key' => 'ownerEmail', 'label' => 'Email chủ nhà', 'sortOrder' => 30],
        ['key' => 'ownerCccd', 'label' => 'CCCD/CMND chủ nhà', 'sortOrder' => 40],
        ['key' => 'ownerNote', 'label' => 'Ghi chú về chủ nhà', 'sortOrder' => 50],
        ['key' => 'title', 'label' => 'Tiêu đề tin', 'sortOrder' => 60],
        ['key' => 'propertyType', 'label' => 'Loại bất động sản', 'sortOrder' => 70],
        ['key' => 'province', 'label' => 'Tỉnh/Thành phố', 'sortOrder' => 75],
        ['key' => 'street', 'label' => 'Số nhà + Tên đường', 'sortOrder' => 80],
        ['key' => 'ward', 'label' => 'Phường/Xã', 'sortOrder' => 90],
        ['key' => 'district', 'label' => 'Quận/Huyện', 'sortOrder' => 100],
        ['key' => 'gpsCoordinates', 'label' => 'Tọa độ/GPS', 'sortOrder' => 110],
        ['key' => 'area', 'label' => 'Diện tích (m²)', 'sortOrder' => 120],
        ['key' => 'bedrooms', 'label' => 'Phòng ngủ', 'sortOrder' => 130],
        ['key' => 'bathrooms', 'label' => 'WC', 'sortOrder' => 140],
        ['key' => 'floors', 'label' => 'Số tầng', 'sortOrder' => 150],
        ['key' => 'direction', 'label' => 'Hướng nhà', 'sortOrder' => 160],
        ['key' => 'bookSerial', 'label' => 'Số sổ/Seri sổ', 'sortOrder' => 170],
        ['key' => 'bookSheet', 'label' => 'Số tờ', 'sortOrder' => 180],
        ['key' => 'bookParcel', 'label' => 'Thửa đất', 'sortOrder' => 190],
        ['key' => 'legalStatus', 'label' => 'Tình trạng pháp lý', 'sortOrder' => 200],
        ['key' => 'planningStatus', 'label' => 'Thông tin quy hoạch', 'sortOrder' => 210],
        ['key' => 'price', 'label' => 'Giá chào (VNĐ)', 'sortOrder' => 220],
        ['key' => 'commission', 'label' => 'Hoa hồng', 'sortOrder' => 230],
        ['key' => 'commissionNote', 'label' => 'Ghi chú hoa hồng', 'sortOrder' => 240],
        ['key' => 'contractStatus', 'label' => 'Hợp đồng trích thưởng/tình trạng ký', 'sortOrder' => 250],
        ['key' => 'internalNote', 'label' => 'Ghi chú nội bộ', 'sortOrder' => 260],
        ['key' => 'videoUrl', 'label' => 'Link video nhà', 'sortOrder' => 270],
        ['key' => 'description', 'label' => 'Mô tả thêm về nhà', 'sortOrder' => 280],
        ['key' => 'houseImages', 'label' => 'Ảnh nhà', 'sortOrder' => 290],
        ['key' => 'bookImages', 'label' => 'Ảnh sổ đỏ/sổ hồng', 'sortOrder' => 300],
        ['key' => 'contractImages', 'label' => 'Hợp đồng/tài liệu', 'sortOrder' => 310],
        ['key' => 'ownerSelfie', 'label' => 'Ảnh tự sướng với nhà', 'sortOrder' => 320],
    ];
}

function svp_ensure_property_field_label_config(PDO $db): void
{
    $db->prepare(
        "INSERT INTO svp_config_groups (id, name, description, sort_order, is_system)
         VALUES ('property_field_labels', 'Tên trường nhập liệu nhà', 'Admin đổi tên các trường quan trọng trong form đăng nhà mà không cần sửa chương trình', 6, 1)
         ON DUPLICATE KEY UPDATE
           description = VALUES(description),
           sort_order = VALUES(sort_order),
           is_system = VALUES(is_system)"
    )->execute();

    $stmt = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, 'property_field_labels', :label, :value, :metadata_json, :sort_order, 1)
         ON DUPLICATE KEY UPDATE
           sort_order = VALUES(sort_order),
           metadata_json = CASE
             WHEN metadata_json IS NULL OR metadata_json = '' THEN VALUES(metadata_json)
             ELSE metadata_json
           END"
    );

    foreach (svp_property_field_label_definitions() as $field) {
        $stmt->execute([
            'id' => 'field_label_' . $field['key'],
            'label' => $field['label'],
            'value' => $field['key'],
            'metadata_json' => svp_json_encode([
                'scope' => 'property',
                'editableLabel' => true,
                'locked' => in_array($field['key'], svp_property_field_locked_keys(), true),
            ]),
            'sort_order' => (int) $field['sortOrder'],
        ]);
    }

    $legacyOwnerSelfieLabel = 'Ảnh selfie với ' . 'chủ nhà';
    $db->prepare(
        "UPDATE svp_config_options
         SET label = 'Ảnh tự sướng với nhà'
         WHERE id = 'field_label_ownerSelfie'
           AND group_id = 'property_field_labels'
           AND label = :legacy_label"
    )->execute(['legacy_label' => $legacyOwnerSelfieLabel]);
}

function svp_ensure_site_display_config(PDO $db): void
{
    $db->prepare(
        "INSERT INTO svp_config_groups (id, name, description, sort_order, is_system)
         VALUES ('site_display', 'Hiển thị website', 'Logo, tên hệ thống, khẩu hiệu và nội dung chân trang hiển thị công khai.', 7, 1)
         ON DUPLICATE KEY UPDATE
           description = VALUES(description),
           sort_order = VALUES(sort_order),
           is_system = VALUES(is_system)"
    )->execute();

    $defaults = [
        ['id' => 'site_logo_url', 'label' => 'Logo', 'value' => '/logo11.png', 'sortOrder' => 10],
        ['id' => 'site_banner_url', 'label' => 'Banner trang chủ', 'value' => '/assets/svp-auth-hero.png', 'sortOrder' => 20],
        ['id' => 'site_name', 'label' => 'Tên website', 'value' => 'Sổ Đỏ Vạn Phúc', 'sortOrder' => 30],
        ['id' => 'site_slogan_line_1', 'label' => 'Khẩu hiệu dòng 1', 'value' => 'Hệ điều hành nghề Môi giới', 'sortOrder' => 40],
        ['id' => 'site_slogan_line_2', 'label' => 'Khẩu hiệu dòng 2', 'value' => 'Thổ cư Việt Nam', 'sortOrder' => 50],
        ['id' => 'site_footer_text', 'label' => 'Chân trang', 'value' => 'Sổ Đỏ Vạn Phúc - hệ thống quản lý nguồn nhà và khách hàng.', 'sortOrder' => 60],
    ];

    $stmt = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, 'site_display', :label, :value, :metadata_json, :sort_order, 1)
         ON DUPLICATE KEY UPDATE
           sort_order = VALUES(sort_order),
           metadata_json = CASE
             WHEN metadata_json IS NULL OR metadata_json = '' THEN VALUES(metadata_json)
             ELSE metadata_json
           END"
    );

    foreach ($defaults as $item) {
        $stmt->execute([
            'id' => $item['id'],
            'label' => $item['label'],
            'value' => $item['value'],
            'metadata_json' => svp_json_encode(['inputType' => 'text']),
            'sort_order' => $item['sortOrder'],
        ]);
    }
}

function svp_ensure_public_page_config(PDO $db): void
{
    $db->prepare(
        "INSERT INTO svp_config_groups (id, name, description, sort_order, is_system)
         VALUES ('public_pages', 'Trang giới thiệu / tin tức', 'Nội dung công khai dạng đơn giản để hiển thị ở cuối trang đăng nhập.', 8, 1)
         ON DUPLICATE KEY UPDATE
           description = VALUES(description),
           sort_order = VALUES(sort_order),
           is_system = VALUES(is_system)"
    )->execute();

    $newsDefaults = [
        [
            'id' => 'public_news_v1',
            'label' => 'Kết nối nhu cầu mua bán nhà rõ ràng hơn',
            'value' => 'news_v1',
            'body' => "Với nhà thổ cư, thông tin ban đầu càng rõ thì việc kết nối càng nhanh. Khách mua nên ghi cụ thể khu vực, tầm tài chính, mục đích mua, thời gian dự kiến và những tiêu chí bắt buộc.\n\nChủ nhà cũng nên cung cấp địa chỉ, hiện trạng, pháp lý, giá kỳ vọng và lịch xem nhà phù hợp. Đội ngũ Sổ Đỏ Vạn Phúc tiếp nhận dữ liệu theo từng nhu cầu để giảm nhầm lẫn và phản hồi đúng người phụ trách.",
        ],
        [
            'id' => 'public_news_expert',
            'label' => 'Nguồn nhà được kiểm tra và lưu trữ tập trung',
            'value' => 'news_expert',
            'body' => "Một nguồn nhà tốt không chỉ có địa chỉ và giá bán. Thông tin cần được ghi lại theo mã nguồn, khu vực, diện tích, mặt tiền, hướng, hiện trạng, pháp lý và người phụ trách.\n\nKhi dữ liệu được lưu tập trung, đội ngũ tư vấn dễ kiểm tra lịch sử xử lý, tránh hỏi lại nhiều lần và giúp khách mua nhận được thông tin nhất quán hơn.",
        ],
        [
            'id' => 'public_news_referral',
            'label' => 'Thông tin liên hệ được chuyển đúng người phụ trách',
            'value' => 'news_referral',
            'body' => "Trong giao dịch thổ cư, cùng một khách hàng có thể trao đổi với nhiều người ở các thời điểm khác nhau. Nếu thông tin không được ghi nhận rõ, đội ngũ rất dễ trùng việc hoặc bỏ sót lịch hẹn.\n\nSổ Đỏ Vạn Phúc ghi nhận nhu cầu, thông tin giới thiệu và người phụ trách để việc chăm sóc khách hàng có mạch theo dõi rõ ràng hơn.",
        ],
        [
            'id' => 'public_news_phap_ly_so_do',
            'label' => 'Kiểm tra sổ đỏ trước khi đi xem nhà',
            'value' => 'news_phap_ly_so_do',
            'body' => "Sổ đỏ là một trong những thông tin quan trọng nhất khi đánh giá nhà thổ cư. Người mua nên hỏi trước về loại giấy tờ, tên chủ sở hữu, diện tích trên sổ, diện tích sử dụng thực tế và tình trạng thế chấp nếu có.\n\nViệc kiểm tra sớm không thay thế bước rà soát pháp lý chuyên sâu, nhưng giúp hai bên tiết kiệm thời gian và tránh những căn nhà chưa phù hợp với nhu cầu giao dịch.",
        ],
        [
            'id' => 'public_news_kiem_tra_quy_hoach',
            'label' => 'Quy hoạch và hiện trạng: hai bước không nên bỏ qua',
            'value' => 'news_kiem_tra_quy_hoach',
            'body' => "Một căn nhà có thể đẹp về vị trí nhưng vẫn cần kiểm tra thêm thông tin quy hoạch, lộ giới, hiện trạng xây dựng và khả năng sử dụng lâu dài. Đây là những yếu tố ảnh hưởng trực tiếp đến quyết định mua bán.\n\nNgười mua nên ghi lại câu hỏi trước khi xem nhà, còn chủ nhà nên chuẩn bị sẵn thông tin liên quan để quá trình trao đổi minh bạch và nhanh hơn.",
        ],
        [
            'id' => 'public_news_dinh_gia_tho_cu',
            'label' => 'Định giá nhà thổ cư cần nhìn đủ nhiều góc',
            'value' => 'news_dinh_gia_tho_cu',
            'body' => "Giá nhà thổ cư không chỉ phụ thuộc vào diện tích. Vị trí, độ rộng ngõ, mặt tiền, hình dáng thửa đất, chất lượng xây dựng, pháp lý và thanh khoản khu vực đều có thể tạo khác biệt lớn.\n\nKhi tư vấn giá, nên so sánh với các căn tương đồng và ghi rõ lý do điều chỉnh. Cách làm này giúp chủ nhà đặt kỳ vọng hợp lý hơn và giúp khách mua hiểu vì sao căn nhà có mức giá đó.",
        ],
        [
            'id' => 'public_news_xem_nha_lan_dau',
            'label' => 'Đi xem nhà lần đầu nên chuẩn bị gì',
            'value' => 'news_xem_nha_lan_dau',
            'body' => "Trước khi đi xem nhà, khách mua nên xác định rõ ngân sách, nguồn tiền, khu vực ưu tiên và các điểm không thể thỏa hiệp như số phòng ngủ, chỗ để xe hoặc khoảng cách đi làm.\n\nTrong buổi xem, nên chú ý ánh sáng, thông gió, kết cấu, lối vào, tiếng ồn, hàng xóm và khả năng sửa chữa. Ghi chú ngay sau khi xem sẽ giúp việc so sánh giữa các căn chính xác hơn.",
        ],
        [
            'id' => 'public_news_chu_nha_chuan_bi_ban',
            'label' => 'Chủ nhà chuẩn bị hồ sơ bán nhà thế nào cho gọn',
            'value' => 'news_chu_nha_chuan_bi_ban',
            'body' => "Chủ nhà nên chuẩn bị trước bản chụp sổ đỏ, thông tin diện tích, hiện trạng nhà, ảnh chụp thực tế, lịch xem nhà và mức giá mong muốn. Những thông tin này giúp đội ngũ tư vấn tiếp cận khách mua phù hợp hơn.\n\nNếu căn nhà có điểm cần giải thích như ngõ vào, phần sửa chữa hoặc lịch sử cho thuê, chủ nhà nên nói rõ từ đầu. Minh bạch sớm thường giúp quá trình thương lượng nhẹ nhàng hơn.",
        ],
        [
            'id' => 'public_news_khach_mua_lap_nhu_cau',
            'label' => 'Khách mua mô tả nhu cầu càng rõ càng dễ tìm đúng nhà',
            'value' => 'news_khach_mua_lap_nhu_cau',
            'body' => "Một yêu cầu mua nhà tốt nên có khu vực, khoảng giá, diện tích mong muốn, mục đích mua, thời gian chốt và các tiêu chí ưu tiên. Nếu có thể, khách mua nên nói rõ tiêu chí nào bắt buộc và tiêu chí nào có thể linh hoạt.\n\nKhi nhu cầu được mô tả rõ, đội ngũ tư vấn không phải gửi quá nhiều căn không phù hợp. Khách mua cũng tiết kiệm thời gian và dễ ra quyết định hơn.",
        ],
        [
            'id' => 'public_news_thuong_luong_gia',
            'label' => 'Thương lượng giá nhà cần dữ liệu và thiện chí',
            'value' => 'news_thuong_luong_gia',
            'body' => "Thương lượng hiệu quả không chỉ là trả thấp hay giữ giá cao. Hai bên nên dựa trên dữ liệu về căn nhà, mặt bằng khu vực, tình trạng pháp lý, chi phí sửa chữa và mức độ sẵn sàng giao dịch.\n\nMột đề xuất rõ lý do thường dễ được lắng nghe hơn. Khi người mua và chủ nhà cùng hiểu cơ sở của mức giá, cuộc trao đổi sẽ bớt căng thẳng và có khả năng đi đến kết quả hơn.",
        ],
        [
            'id' => 'public_news_dat_coc_an_toan',
            'label' => 'Đặt cọc mua bán nhà: rõ điều kiện trước khi ký',
            'value' => 'news_dat_coc_an_toan',
            'body' => "Trước khi đặt cọc, hai bên nên thống nhất rõ giá bán, thời hạn công chứng, trách nhiệm thuế phí, tình trạng bàn giao, giấy tờ cần chuẩn bị và điều kiện hoàn cọc nếu có.\n\nNội dung đặt cọc nên được đọc kỹ và lưu lại đầy đủ. Với giao dịch giá trị lớn, việc hỏi ý kiến chuyên môn khi cần thiết sẽ giúp các bên yên tâm hơn trước khi ký.",
        ],
        [
            'id' => 'public_news_hem_ngo_mat_tien',
            'label' => 'Nhà trong ngõ và nhà mặt phố khác nhau ở điểm nào',
            'value' => 'news_hem_ngo_mat_tien',
            'body' => "Nhà mặt phố thường có lợi thế nhận diện, kinh doanh và thanh khoản, nhưng giá cao và có thể ồn hơn. Nhà trong ngõ lại phù hợp với nhu cầu ở yên tĩnh, ngân sách mềm hơn, nhưng cần xem kỹ độ rộng ngõ và khả năng tiếp cận.\n\nKhông có lựa chọn nào đúng cho tất cả mọi người. Điều quan trọng là xác định mục đích mua để ở, cho thuê hay đầu tư trước khi so sánh.",
        ],
        [
            'id' => 'public_news_nha_co_dong_tien',
            'label' => 'Cách nhìn tiềm năng của một căn nhà thổ cư',
            'value' => 'news_nha_co_dong_tien',
            'body' => "Tiềm năng của nhà thổ cư có thể đến từ vị trí, hạ tầng xung quanh, khả năng cải tạo, nhu cầu thuê, hoặc sự khan hiếm nguồn hàng trong khu vực. Tuy vậy, tiềm năng cần được nhìn cùng rủi ro và thời gian nắm giữ.\n\nNgười mua nên tách cảm xúc yêu thích căn nhà khỏi các con số cơ bản. Khi ghi rõ kỳ vọng, chi phí và phương án sử dụng, quyết định mua sẽ chắc tay hơn.",
        ],
        [
            'id' => 'public_news_mua_o_va_dau_tu',
            'label' => 'Mua để ở và mua đầu tư nên tách tiêu chí',
            'value' => 'news_mua_o_va_dau_tu',
            'body' => "Mua để ở thường ưu tiên sự tiện lợi hằng ngày, môi trường sống, trường học, chỗ để xe và cảm giác phù hợp của gia đình. Mua đầu tư lại cần quan tâm nhiều hơn đến thanh khoản, khả năng cho thuê và biên an toàn về giá.\n\nKhi hai mục tiêu bị trộn lẫn, người mua dễ phân vân. Việc xác định mục tiêu chính ngay từ đầu giúp đội ngũ tư vấn chọn nguồn nhà sát hơn.",
        ],
        [
            'id' => 'public_news_anh_video_nha',
            'label' => 'Ảnh và video nhà giúp tiết kiệm thời gian cho cả hai bên',
            'value' => 'news_anh_video_nha',
            'body' => "Ảnh rõ sáng, đủ góc và video ngắn đi từ ngoài vào trong giúp khách mua hình dung nhanh hiện trạng căn nhà. Chủ nhà nên ưu tiên ảnh thật, không chỉnh sửa quá mức và thể hiện đúng không gian.\n\nVới đội ngũ tư vấn, hình ảnh đầy đủ giúp sàng lọc nhu cầu trước khi hẹn xem. Điều này giảm lịch xem không phù hợp và giúp buổi gặp trực tiếp chất lượng hơn.",
        ],
        [
            'id' => 'public_news_tranh_trung_nguon',
            'label' => 'Tránh trùng nguồn khi làm việc với cộng tác viên',
            'value' => 'news_tranh_trung_nguon',
            'body' => "Nguồn nhà cần được ghi nhận rõ người giới thiệu, thời điểm tiếp nhận, thông tin chủ nhà và trạng thái xử lý. Đây là cách giảm tranh chấp nội bộ và giữ sự công bằng cho cộng tác viên.\n\nKhi mọi nguồn được lưu theo mã và lịch sử xử lý, đội ngũ phụ trách dễ biết ai đang theo việc, nguồn nào cần gọi lại và nguồn nào đã có kết quả.",
        ],
        [
            'id' => 'public_news_cham_soc_khach_mua',
            'label' => 'Chăm sóc khách mua sau lần tư vấn đầu tiên',
            'value' => 'news_cham_soc_khach_mua',
            'body' => "Sau buổi tư vấn đầu tiên, điều quan trọng là ghi lại phản hồi của khách mua: thích điểm nào, chưa phù hợp điểm nào, ngân sách có thay đổi không và thời gian ra quyết định ra sao.\n\nNhững ghi chú này giúp lần tư vấn sau sát nhu cầu hơn. Khách mua cũng cảm nhận được sự chuyên nghiệp khi không phải nhắc lại toàn bộ câu chuyện từ đầu.",
        ],
        [
            'id' => 'public_news_hop_dong_trich_thuong',
            'label' => 'Ghi nhận thỏa thuận phí môi giới cho rõ ràng',
            'value' => 'news_hop_dong_trich_thuong',
            'body' => "Trong một giao dịch có nhiều người tham gia, thỏa thuận phí môi giới và nguyên tắc chia sẻ nên được ghi nhận sớm. Điều này giúp các bên hiểu quyền lợi, trách nhiệm và cách phối hợp.\n\nSự rõ ràng về thỏa thuận không chỉ bảo vệ đội ngũ làm việc mà còn giúp chủ nhà, khách mua yên tâm hơn khi giao dịch qua một hệ thống có quy trình.",
        ],
        [
            'id' => 'public_news_vai_tro_cong_tac_vien',
            'label' => 'Vai trò cộng tác viên trong hệ thống nguồn nhà',
            'value' => 'news_vai_tro_cong_tac_vien',
            'body' => "Cộng tác viên có thể hỗ trợ phát hiện nguồn nhà, giới thiệu khách mua hoặc kết nối thông tin tại khu vực quen thuộc. Vai trò này rất hữu ích nếu thông tin được gửi đúng chuẩn và cập nhật thường xuyên.\n\nKhi cộng tác viên làm việc trên cùng một hệ thống, đội ngũ phụ trách dễ phản hồi trạng thái nguồn, tránh bỏ sót công sức và giữ nhịp phối hợp lâu dài.",
        ],
        [
            'id' => 'public_news_du_lieu_minh_bach',
            'label' => 'Dữ liệu minh bạch giúp giao dịch bớt rủi ro',
            'value' => 'news_du_lieu_minh_bach',
            'body' => "Giao dịch bất động sản cần sự tin cậy. Dữ liệu càng minh bạch về nguồn nhà, pháp lý, trạng thái chăm sóc và lịch sử trao đổi thì các bên càng dễ kiểm tra lại khi cần.\n\nSổ Đỏ Vạn Phúc hướng tới cách làm rõ người, rõ việc, rõ trạng thái. Khi dữ liệu được chuẩn hóa, đội ngũ tư vấn phục vụ khách hàng nhanh hơn và chuyên nghiệp hơn.",
        ],
    ];

    $newsImageMap = [
        'public_news_v1' => '/assets/news/news-connect-demand.jpg',
        'public_news_expert' => '/assets/news/news-source-database.jpg',
        'public_news_referral' => '/assets/news/news-referral-handoff.jpg',
        'public_news_phap_ly_so_do' => '/assets/news/news-legal-red-book.jpg',
        'public_news_kiem_tra_quy_hoach' => '/assets/news/news-planning-check.jpg',
        'public_news_dinh_gia_tho_cu' => '/assets/news/news-pricing-analysis.jpg',
        'public_news_xem_nha_lan_dau' => '/assets/news/news-first-viewing.jpg',
        'public_news_chu_nha_chuan_bi_ban' => '/assets/news/news-owner-sale-prep.jpg',
        'public_news_khach_mua_lap_nhu_cau' => '/assets/news/news-buyer-criteria.jpg',
        'public_news_thuong_luong_gia' => '/assets/news/news-price-negotiation.jpg',
        'public_news_dat_coc_an_toan' => '/assets/news/news-safe-deposit.jpg',
        'public_news_hem_ngo_mat_tien' => '/assets/news/news-alley-vs-street.jpg',
        'public_news_nha_co_dong_tien' => '/assets/news/news-townhouse-potential.jpg',
        'public_news_mua_o_va_dau_tu' => '/assets/news/news-live-vs-invest.jpg',
        'public_news_anh_video_nha' => '/assets/news/news-photo-video-tour.jpg',
        'public_news_tranh_trung_nguon' => '/assets/news/news-duplicate-source.jpg',
        'public_news_cham_soc_khach_mua' => '/assets/news/news-buyer-followup.jpg',
        'public_news_hop_dong_trich_thuong' => '/assets/news/news-brokerage-fee.jpg',
        'public_news_vai_tro_cong_tac_vien' => '/assets/news/news-collaborator-role.jpg',
        'public_news_du_lieu_minh_bach' => '/assets/news/news-transparent-data.jpg',
    ];

    $defaults = [
        [
            'id' => 'public_page_about',
            'label' => 'Giới thiệu',
            'value' => 'about',
            'sortOrder' => 10,
            'metadata' => [
                'type' => 'about',
                'subtitle' => 'Hệ thống kết nối nguồn nhà, khách mua và đội ngũ môi giới Sổ Đỏ Vạn Phúc.',
                'body' => 'Sổ Đỏ Vạn Phúc giúp chủ nhà gửi thông tin bán nhà, khách mua để lại nhu cầu và đội ngũ phụ trách xử lý dữ liệu tập trung, rõ trạng thái, đúng phân quyền.',
                'imageUrl' => '/logo11.png',
                'videoUrl' => '',
                'linkUrl' => '',
            ],
        ],
    ];

    foreach ($newsDefaults as $index => $item) {
        $defaults[] = [
            'id' => $item['id'],
            'label' => $item['label'],
            'value' => $item['value'],
            'sortOrder' => 110 + ($index * 10),
            'isActive' => true,
            'metadata' => [
                'type' => 'news',
                'body' => $item['body'],
                'imageUrl' => $newsImageMap[$item['id']] ?? '/assets/news/news-connect-demand.jpg',
                'videoUrl' => '',
                'linkUrl' => '',
            ],
        ];
    }

    $stmt = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, 'public_pages', :label, :value, :metadata_json, :sort_order, :is_active)
         ON DUPLICATE KEY UPDATE
           sort_order = VALUES(sort_order),
           label = CASE
             WHEN id LIKE 'public_news_%'
             THEN VALUES(label)
             WHEN id IN ('public_news_v1', 'public_news_expert', 'public_news_referral')
               AND (
                 label LIKE '%V1%'
                 OR label LIKE '%Cập nhật vận hành%'
                 OR label LIKE '%Thao tác nhanh trên điện thoại%'
                 OR label LIKE '%Chuyên gia gửi nguồn nhà chờ duyệt%'
                 OR label LIKE '%Mã giới thiệu ghi nhận nguồn người dùng%'
               )
             THEN VALUES(label)
             ELSE label
           END,
           metadata_json = CASE
             WHEN id LIKE 'public_news_%'
             THEN VALUES(metadata_json)
             WHEN metadata_json IS NULL OR metadata_json = ''
               OR metadata_json LIKE '%V1%'
               OR metadata_json LIKE '%admin%'
               OR metadata_json LIKE '%phase%'
               OR metadata_json LIKE '%mở rộng sau%'
               OR metadata_json LIKE '%Các màn đăng nhập%'
               OR metadata_json LIKE '%Nguồn mới sau khi gửi%'
               OR metadata_json LIKE '%Mỗi tài khoản có mã%'
               OR metadata_json LIKE '%chuyên viên và chuyên gia%'
             THEN VALUES(metadata_json)
             ELSE metadata_json
           END,
           is_active = CASE
             WHEN id LIKE 'public_news_%'
             THEN VALUES(is_active)
             WHEN id IN ('public_news_v1', 'public_news_expert', 'public_news_referral')
               AND (
                 label LIKE '%V1%'
                 OR label LIKE '%Cập nhật vận hành%'
                 OR label LIKE '%Thao tác nhanh trên điện thoại%'
                 OR label LIKE '%Chuyên gia gửi nguồn nhà chờ duyệt%'
                 OR label LIKE '%Mã giới thiệu ghi nhận nguồn người dùng%'
                 OR metadata_json LIKE '%Các màn đăng nhập%'
                 OR metadata_json LIKE '%Nguồn mới sau khi gửi%'
                 OR metadata_json LIKE '%Mỗi tài khoản có mã%'
               )
             THEN VALUES(is_active)
             ELSE is_active
           END"
    );

    foreach ($defaults as $item) {
        $stmt->execute([
            'id' => $item['id'],
            'label' => $item['label'],
            'value' => $item['value'],
            'metadata_json' => svp_json_encode($item['metadata']),
            'sort_order' => $item['sortOrder'],
            'is_active' => !array_key_exists('isActive', $item) || !empty($item['isActive']) ? 1 : 0,
        ]);
    }
}

function svp_ensure_v1_visibility_labels(PDO $db): void
{
    $updates = [
        'vl_dau_khach_duoi_lop4' => ['label' => 'Công khai cho khách mua', 'value' => 'public_buyer'],
        'vl_lop4' => ['label' => 'Chuyên viên/CTV khách', 'value' => 'specialist_collaborator'],
        'vl_lop8' => ['label' => 'CTV nguồn', 'value' => 'source_collaborator'],
        'vl_tot_nghiep' => ['label' => 'Chuyên gia phụ trách', 'value' => 'assigned_expert'],
        'vl_vinh_danh' => ['label' => 'Quản lý/Admin', 'value' => 'management_admin'],
        'vl_chuyen_gia' => ['label' => 'Chuyên gia toàn hệ thống', 'value' => 'expert_network'],
    ];

    $stmt = $db->prepare(
        "UPDATE svp_config_options
         SET label = :label, value = :value
         WHERE id = :id
           AND group_id = 'visibility_levels'
           AND (label LIKE '%Lớp%' OR label LIKE '%VINH DANH%' OR value IN ('dau_khach_duoi_lop4', 'lop4', 'lop8', 'tot_nghiep', 'vinh_danh', 'chuyen_gia'))"
    );

    foreach ($updates as $id => $item) {
        $stmt->execute([
            'id' => $id,
            'label' => $item['label'],
            'value' => $item['value'],
        ]);
    }
}

function svp_ensure_v1_company_unit_labels(PDO $db): void
{
    $stmt = $db->prepare(
        "UPDATE svp_config_options
         SET label = REPLACE(label, 'Tuấn 123', 'Sổ Đỏ')
         WHERE group_id = 'company_units'
           AND label LIKE 'Tuấn 123%'"
    );
    $stmt->execute();
}

function svp_ensure_v1_price_segments(PDO $db): void
{
    $segments = [
        ['id' => 'price_segments_under_3b', 'label' => 'Nhỏ 3', 'value' => 'under_3b', 'min' => 0, 'max' => 3000000000, 'sortOrder' => 10],
        ['id' => 'price_segments_3_6b', 'label' => '3 đến 6', 'value' => '3_6b', 'min' => 3000000000, 'max' => 6000000000, 'sortOrder' => 20],
        ['id' => 'price_segments_6_10b', 'label' => '6 đến 10', 'value' => '6_10b', 'min' => 6000000000, 'max' => 10000000000, 'sortOrder' => 30],
        ['id' => 'price_segments_10_20b', 'label' => '10 đến 20', 'value' => '10_20b', 'min' => 10000000000, 'max' => 20000000000, 'sortOrder' => 40],
        ['id' => 'price_segments_trieu_do', 'label' => 'Triệu đô', 'value' => '20_50b', 'min' => 20000000000, 'max' => 50000000000, 'sortOrder' => 50],
        ['id' => 'price_segments_ty_phu', 'label' => 'Tỷ phú', 'value' => '50_100b', 'min' => 50000000000, 'max' => 100000000000, 'sortOrder' => 60],
        ['id' => 'price_segments_dai_ty_phu', 'label' => 'Đại tỷ phú', 'value' => 'over_100b', 'min' => 100000000000, 'max' => null, 'sortOrder' => 70],
    ];

    $stmt = $db->prepare(
        "INSERT INTO svp_config_options (id, group_id, label, value, metadata_json, sort_order, is_active)
         VALUES (:id, 'price_segments', :label, :value, :metadata_json, :sort_order, 1)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           value = VALUES(value),
           metadata_json = VALUES(metadata_json),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active)"
    );

    foreach ($segments as $item) {
        $stmt->execute([
            'id' => $item['id'],
            'label' => $item['label'],
            'value' => $item['value'],
            'metadata_json' => svp_json_encode(['min' => $item['min'], 'max' => $item['max']]),
            'sort_order' => $item['sortOrder'],
        ]);
    }
}

function svp_next_property_code(PDO $db): string
{
    $count = (int) $db->query('SELECT COUNT(*) FROM svp_properties')->fetchColumn();
    return 'SVP' . str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
}

function svp_normalize_property_status(string $status): string
{
    $status = trim($status);
    if ($status === '') return '';
    $map = [
        'new' => 'st_new',
        'draft' => 'st_new',
        'pending' => 'st_new',
        'active' => 'st_active',
        'deposit' => 'st_deposit',
        'sold' => 'st_sold',
        'paused' => 'st_paused',
        'hidden' => 'st_hidden',
    ];
    return $map[$status] ?? $status;
}

function svp_option_to_response(array $row): array
{
    return [
        'id'        => (string) $row['id'],
        'groupId'   => (string) $row['group_id'],
        'label'     => (string) $row['label'],
        'value'     => (string) $row['value'],
        'score'     => !isset($row['score']) || $row['score'] === null ? null : (float) $row['score'],
        'metadata'  => svp_json_decode($row['metadata_json'] ?? null, null),
        'sortOrder' => (int) ($row['sort_order'] ?? 0),
        'isActive'  => (bool) ($row['is_active'] ?? 1),
    ];
}

function svp_property_to_response(array $row): array
{
    $extra = svp_json_decode($row['extra_json'] ?? null, []);
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
        'province'       => (string) ($extra['province'] ?? ''),
        'address'        => (string) ($row['address'] ?? ''),
        'hiddenAddress'  => (string) ($row['hidden_address'] ?? ''),
        'companyUnitId'  => (string) ($row['company_unit_id'] ?? ''),
        'statusId'       => (string) ($row['status_id'] ?? ''),
        'expertId'       => (string) ($row['expert_id'] ?? ''),
        'assignedUserId' => (string) ($row['assigned_user_id'] ?? ''),
        'signingScore'   => (float) ($row['signing_score'] ?? 0),
        'visibilityIds'  => svp_json_decode($row['visibility_json'] ?? null, []),
        'tagIds'         => svp_json_decode($row['tags_json'] ?? null, []),
        'extra'          => $extra,
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

function svp_ensure_comments_table(PDO $db): void
{
    $db->exec("
        CREATE TABLE IF NOT EXISTS svp_comments (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          entity_type VARCHAR(80) NOT NULL DEFAULT 'property',
          entity_id VARCHAR(80) NOT NULL,
          body TEXT NOT NULL,
          created_by VARCHAR(64) DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME DEFAULT NULL,
          INDEX idx_comments_entity (entity_type, entity_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

$router->add('GET', '/api/svp/config', function () {
    $db = Database::getInstance();
    svp_ensure_role_approval_config($db);
    svp_ensure_property_field_label_config($db);
    svp_ensure_site_display_config($db);
    svp_ensure_public_page_config($db);
    svp_ensure_v1_visibility_labels($db);
    svp_ensure_v1_company_unit_labels($db);
    svp_ensure_v1_price_segments($db);
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
    if ($groupId === 'site_display' && function_exists('svp_auth_require')) {
        $brandingPayload = svp_auth_require();
        if (!function_exists('svp_is_owner_admin_payload') || !svp_is_owner_admin_payload($brandingPayload)) {
            Response::error('Chỉ Admin tổng mới có quyền thay đổi thương hiệu website.', 403);
        }
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
    if (($old['group_id'] ?? '') === 'site_display' && function_exists('svp_auth_require')) {
        $brandingPayload = svp_auth_require();
        if (!function_exists('svp_is_owner_admin_payload') || !svp_is_owner_admin_payload($brandingPayload)) {
            Response::error('Chỉ Admin tổng mới có quyền thay đổi thương hiệu website.', 403);
        }
    }

    $next = [
        'label' => trim((string) ($input['label'] ?? $old['label'])),
        'value' => trim((string) ($input['value'] ?? $old['value'])),
        'score' => array_key_exists('score', $input) ? $input['score'] : $old['score'],
        'metadata_json' => array_key_exists('metadata', $input) ? svp_json_encode($input['metadata']) : $old['metadata_json'],
        'sort_order' => (int) ($input['sortOrder'] ?? $input['sort_order'] ?? $old['sort_order']),
        'is_active' => array_key_exists('isActive', $input) ? (int) (bool) $input['isActive'] : (int) $old['is_active'],
        'id' => $id,
    ];

    if (($old['group_id'] ?? '') === 'property_field_labels'
        && (int) $next['is_active'] === 0
        && in_array((string) ($old['value'] ?? ''), svp_property_field_locked_keys(), true)) {
        Response::error('Trường bắt buộc của form đăng nhà không thể ẩn.', 400);
    }

    if (($old['group_id'] ?? '') === 'account_role_approval'
        && in_array((string) ($old['value'] ?? ''), ['admin_tong', 'admin'], true)
        && (int) $next['is_active'] === 0) {
        Response::error('Vai trò quản trị hệ thống không thể ẩn.', 400);
    }

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

$router->add('POST', '/api/svp/config/options/reorder', function () use ($input) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $items = $input['items'] ?? $input['order'] ?? [];
    if (!is_array($items) || empty($items)) {
        Response::error('items is required', 400);
    }

    $oldStmt = $db->query('SELECT id, sort_order FROM svp_config_options');
    $old = $oldStmt->fetchAll(PDO::FETCH_ASSOC);
    $update = $db->prepare('UPDATE svp_config_options SET sort_order = :sort_order WHERE id = :id');
    $updated = [];
    foreach ($items as $index => $item) {
        $id = is_array($item) ? (string) ($item['id'] ?? '') : (string) $item;
        if ($id === '') continue;
        $sortOrder = is_array($item) && isset($item['sortOrder'])
            ? (int) $item['sortOrder']
            : (($index + 1) * 10);
        $update->execute(['id' => $id, 'sort_order' => $sortOrder]);
        $updated[] = ['id' => $id, 'sortOrder' => $sortOrder];
    }

    svp_insert_audit($db, svp_actor_id(), 'reorder', 'config_option', 'bulk', $old, $updated);
    Response::json(['items' => $updated, 'total' => count($updated)]);
});

$router->add('DELETE', '/api/svp/config/options/{id}', function ($params) {
    Auth::requireAdmin();
    $db = Database::getInstance();
    $id = (string) ($params['id'] ?? '');
    if ($id === '') Response::error('Config option id is required', 400);

    $stmt = $db->prepare('SELECT * FROM svp_config_options WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) Response::notFound('Config option not found');
    if (($old['group_id'] ?? '') === 'site_display' && function_exists('svp_auth_require')) {
        $brandingPayload = svp_auth_require();
        if (!function_exists('svp_is_owner_admin_payload') || !svp_is_owner_admin_payload($brandingPayload)) {
            Response::error('Chỉ Admin tổng mới có quyền thay đổi thương hiệu website.', 403);
        }
    }

    $metadata = svp_json_decode($old['metadata_json'] ?? null, []);
    $isLocked = !empty($metadata['locked'])
        || (($old['group_id'] ?? '') === 'property_field_labels' && in_array((string) ($old['value'] ?? ''), svp_property_field_locked_keys(), true))
        || (($old['group_id'] ?? '') === 'account_role_approval' && in_array((string) ($old['value'] ?? ''), ['admin_tong', 'admin'], true));
    if ($isLocked) {
        Response::error('Mục hệ thống không thể xóa, chỉ có thể sửa hoặc ẩn khi được phép.', 400);
    }

    $db->prepare('DELETE FROM svp_config_options WHERE id = :id')->execute(['id' => $id]);
    svp_insert_audit($db, svp_actor_id(), 'delete', 'config_option', $id, $old, ['deleted' => true]);
    Response::json(['deleted' => true]);
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
        $params['status'] = svp_normalize_property_status((string) $_GET['statusId']);
    }
    if (!empty($_GET['createdBy'])) {
        $where[] = 'created_by = :created_by';
        $params['created_by'] = (string) $_GET['createdBy'];
    }
    if (!empty($_GET['expertId'])) {
        $where[] = 'expert_id = :expert_id';
        $params['expert_id'] = (string) $_GET['expertId'];
    }
    if (!empty($_GET['assignedUserId'])) {
        $where[] = 'assigned_user_id = :assigned_user_id';
        $params['assigned_user_id'] = (string) $_GET['assignedUserId'];
    }
    if (isset($_GET['priceMin']) && $_GET['priceMin'] !== '') {
        $where[] = 'price >= :price_min';
        $params['price_min'] = (float) $_GET['priceMin'];
    }
    if (isset($_GET['priceMax']) && $_GET['priceMax'] !== '') {
        $where[] = 'price <= :price_max';
        $params['price_max'] = (float) $_GET['priceMax'];
    }
    if (isset($_GET['areaMin']) && $_GET['areaMin'] !== '') {
        $where[] = 'area_m2 >= :area_min';
        $params['area_min'] = (float) $_GET['areaMin'];
    }
    if (isset($_GET['areaMax']) && $_GET['areaMax'] !== '') {
        $where[] = 'area_m2 <= :area_max';
        $params['area_max'] = (float) $_GET['areaMax'];
    }

    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $stmt = $db->prepare("SELECT * FROM svp_properties {$whereSql} ORDER BY updated_at DESC LIMIT 200");
    $stmt->execute($params);
    $items = array_values(array_filter(array_map(function ($row) {
        return svp_apply_property_access_filter(svp_property_to_response($row));
    }, $stmt->fetchAll(PDO::FETCH_ASSOC))));
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
        'area_m2' => isset($input['areaM2']) ? (float) $input['areaM2'] : (isset($input['area']) ? (float) $input['area'] : null),
        'district' => trim((string) ($input['district'] ?? '')),
        'ward' => trim((string) ($input['ward'] ?? '')),
        'address' => trim((string) ($input['address'] ?? '')),
        'hidden_address' => trim((string) ($input['hiddenAddress'] ?? $input['hidden_address'] ?? '')),
        'company_unit_id' => trim((string) ($input['companyUnitId'] ?? $input['company_unit_id'] ?? '')),
        'status_id' => svp_normalize_property_status(trim((string) ($input['statusId'] ?? $input['status_id'] ?? 'st_new'))),
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

    $extra = is_array($input['extra'] ?? null) ? $input['extra'] : [];
    $shouldEnforceDuplicateRule = !empty($input['enforceDuplicateRule']) || !empty($extra['enforceDuplicateRule']);
    if ($shouldEnforceDuplicateRule) {
        $ruleResult = function_exists('svp_property_duplicate_rule')
            ? svp_property_duplicate_rule($db, [
                'address' => $row['address'],
                'hiddenAddress' => $row['hidden_address'],
                'street' => (string) ($extra['street'] ?? ''),
                'ward' => $row['ward'],
                'district' => $row['district'],
                'province' => (string) ($extra['province'] ?? ''),
                'bookSerial' => $row['book_serial'],
                'bookSheet' => (string) ($extra['bookSheet'] ?? ''),
                'bookParcel' => (string) ($extra['bookParcel'] ?? ''),
                'signingScore' => $row['signing_score'],
            ])
            : ['matches' => [], 'rule' => ['hasDuplicates' => false, 'canSubmit' => true, 'message' => '']];
        $rule = $ruleResult['rule'] ?? [];
        if (!empty($rule['hasDuplicates']) && empty($rule['canSubmit'])) {
            $matches = array_slice($ruleResult['matches'] ?? [], 0, 3);
            $targets = array_map(function ($item) {
                return trim(implode(' - ', array_filter([
                    !empty($item['matchTypes']) ? ('Trùng ' . implode(', ', $item['matchTypes'])) : '',
                    (string) ($item['code'] ?? $item['id'] ?? ''),
                    (string) ($item['title'] ?? ''),
                    (string) ($item['expertName'] ?? ''),
                    isset($item['signingScore']) ? ((string) $item['signingScore'] . ' điểm') : '',
                ])));
            }, $matches);
            $suffix = count($targets) ? ' Trùng với: ' . implode('; ', $targets) . '.' : '';
            Response::error((string) ($rule['message'] ?? 'Nguồn trùng chưa đủ điều kiện đăng.') . $suffix, 409);
        }
    }

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
    svp_insert_property_timeline($db, $id, 'created', 'Tạo nhà', null, $actorId, $response);
    svp_insert_audit($db, $actorId, 'create', 'property', $id, null, $response);

    Response::json(['item' => $response], 201);
});

$router->add('GET', '/api/svp/properties/{id}', function ($params) {
    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT * FROM svp_properties WHERE (id = :id OR code = :code) AND deleted_at IS NULL LIMIT 1');
    $stmt->execute(['id' => $params['id'], 'code' => $params['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) Response::notFound('Property not found');
    $item = svp_apply_property_access_filter(svp_property_to_response($row));
    if (empty($item)) Response::notFound('Property not found');
    Response::json(['item' => $item]);
});

$router->add('GET', '/api/svp/properties/{id}/comments', function ($params) {
    $db = Database::getInstance();
    svp_ensure_comments_table($db);
    $propertyId = (string) ($params['id'] ?? '');
    if ($propertyId === '') Response::error('Property id is required', 400);

    $stmt = $db->prepare("
        SELECT c.id, c.entity_id, c.body, c.created_by, c.created_at, u.full_name, u.svp_id
        FROM svp_comments c
        LEFT JOIN users u ON u.id = c.created_by
        WHERE c.entity_type = 'property' AND c.entity_id = :property_id AND c.deleted_at IS NULL
        ORDER BY c.created_at ASC
        LIMIT 100
    ");
    $stmt->execute(['property_id' => $propertyId]);

    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'propertyId' => (string) $row['entity_id'],
            'body' => (string) $row['body'],
            'createdBy' => (string) ($row['created_by'] ?? ''),
            'authorName' => (string) ($row['full_name'] ?? 'Thành viên'),
            'authorSvpId' => (string) ($row['svp_id'] ?? ''),
            'createdAt' => (string) $row['created_at'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    Response::json(['items' => $items, 'total' => count($items)]);
});

$router->add('POST', '/api/svp/properties/{id}/comments', function ($params) {
    $payload = function_exists('svp_auth_require') ? svp_auth_require() : (Auth::getPayload() ?: null);
    if (!$payload) Response::error('Phiên đăng nhập hết hạn', 401);
    $db = Database::getInstance();
    svp_ensure_comments_table($db);
    $propertyId = (string) ($params['id'] ?? '');
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $body = trim((string) ($input['body'] ?? ''));
    if ($propertyId === '' || $body === '') Response::error('Vui lòng nhập nội dung bình luận', 400);
    if (mb_strlen($body, 'UTF-8') > 1000) Response::error('Bình luận quá dài', 400);

    $db->prepare("
        INSERT INTO svp_comments (entity_type, entity_id, body, created_by, created_at)
        VALUES ('property', :property_id, :body, :created_by, NOW())
    ")->execute([
        'property_id' => $propertyId,
        'body' => $body,
        'created_by' => (string) ($payload['sub'] ?? ''),
    ]);
    $id = (string) $db->lastInsertId();
    svp_insert_audit($db, (string) ($payload['sub'] ?? ''), 'create', 'property_comment', $id, null, [
        'propertyId' => $propertyId,
        'body' => $body,
    ]);

    Response::json([
        'item' => [
            'id' => $id,
            'propertyId' => $propertyId,
            'body' => $body,
            'createdBy' => (string) ($payload['sub'] ?? ''),
            'authorName' => (string) ($payload['fullName'] ?? $payload['name'] ?? 'Bạn'),
            'createdAt' => date('Y-m-d H:i:s'),
        ],
    ], 201);
});

$router->add('DELETE', '/api/svp/properties/{id}/comments/{commentId}', function ($params) {
    $payload = function_exists('svp_auth_require') ? svp_auth_require() : (Auth::getPayload() ?: null);
    if (!$payload) Response::error('Phiên đăng nhập hết hạn', 401);
    $db = Database::getInstance();
    svp_ensure_comments_table($db);
    $propertyId = (string) ($params['id'] ?? '');
    $commentId = (string) ($params['commentId'] ?? '');
    if ($propertyId === '' || $commentId === '') Response::error('Thông tin bình luận không hợp lệ', 400);

    $stmt = $db->prepare("SELECT * FROM svp_comments WHERE id = :id AND entity_type = 'property' AND entity_id = :property_id AND deleted_at IS NULL LIMIT 1");
    $stmt->execute(['id' => $commentId, 'property_id' => $propertyId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$comment) Response::notFound('Comment not found');

    $propStmt = $db->prepare('SELECT created_by, expert_id FROM svp_properties WHERE id = :id LIMIT 1');
    $propStmt->execute(['id' => $propertyId]);
    $property = $propStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $actorId = (string) ($payload['sub'] ?? '');
    $roles = $payload['roles'] ?? [];
    $isAdmin = false;
    foreach ($roles as $role) {
        if (in_array(($role['slug'] ?? ''), ['admin_tong', 'admin'], true) && ($role['status'] ?? '') === 'approved') {
            $isAdmin = true;
            break;
        }
    }
    $canDelete = $isAdmin
        || $actorId === (string) ($comment['created_by'] ?? '')
        || $actorId === (string) ($property['created_by'] ?? '')
        || $actorId === (string) ($property['expert_id'] ?? '');
    if (!$canDelete) Response::error('Bạn không có quyền xóa bình luận này', 403);

    $db->prepare('UPDATE svp_comments SET deleted_at = NOW() WHERE id = :id')->execute(['id' => $commentId]);
    svp_insert_audit($db, $actorId, 'delete', 'property_comment', $commentId, $comment, ['deleted' => true]);
    Response::json(['deleted' => true]);
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
    [$activeRole, $userId] = svp_access_context();
    $canSeeSensitiveMedia = false;
    $fullRoles = function_exists('svp_management_role_slugs') ? svp_management_role_slugs() : ['admin'];
    if ($activeRole && in_array($activeRole, $fullRoles, true)) {
        $canSeeSensitiveMedia = true;
    } elseif ($activeRole === 'chuyen_gia') {
        $propertyStmt = $db->prepare('SELECT created_by, expert_id FROM svp_properties WHERE id = :id OR code = :code LIMIT 1');
        $propertyStmt->execute(['id' => $params['id'], 'code' => $params['id']]);
        $propertyRow = $propertyStmt->fetch(PDO::FETCH_ASSOC);
        $canSeeSensitiveMedia = $propertyRow && in_array($userId, [(string) ($propertyRow['created_by'] ?? ''), (string) ($propertyRow['expert_id'] ?? '')], true);
    }

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
    if (!$canSeeSensitiveMedia) {
        $items = array_values(array_filter($items, function ($item) {
            $caption = strtolower((string) ($item['caption'] ?? ''));
            foreach (['private_approval', 'approval_document', 'red_book', 'contract_document', 'internal_only', 'duyet noi bo'] as $marker) {
                if (str_contains($caption, $marker)) return false;
            }
            return true;
        }));
    }
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
        $itemCaption = str_contains($caption, $category . ':') ? $caption : ($category . ': ' . $caption);
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
    $where = ['1=1'];
    $params = [];
    $assignedTo = trim((string) ($_GET['assignedTo'] ?? $_GET['assignedUserId'] ?? ''));
    if ($assignedTo !== '') {
        $where[] = 'assigned_user_id = :assigned_to';
        $params['assigned_to'] = $assignedTo;
    }
    if (!empty($_GET['q'])) {
        $where[] = '(full_name LIKE :q OR phone LIKE :q OR email LIKE :q)';
        $params['q'] = '%' . (string) $_GET['q'] . '%';
    }
    if (!empty($_GET['statusId'])) {
        $where[] = 'status_id = :status';
        $params['status'] = (string) $_GET['statusId'];
    }
    $stmt = $db->prepare('SELECT * FROM svp_customers WHERE ' . implode(' AND ', $where) . ' ORDER BY updated_at DESC LIMIT 200');
    $stmt->execute($params);
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

    if (!$canSeeSensitiveMedia) {
        $legacyOwnerSelfieCaption = 'Ảnh selfie với ' . 'chủ nhà';
        $sensitiveCaptions = ['approval_document', 'red_book', 'contract_document', 'owner_selfie', 'Ảnh duyệt hồ sơ', 'Sổ đỏ / giấy tờ', 'Hợp đồng / tài liệu', $legacyOwnerSelfieCaption, 'Ảnh tự sướng với nhà'];
        $items = array_values(array_filter($items, function ($item) use ($sensitiveCaptions) {
            return !in_array((string) ($item['caption'] ?? ''), $sensitiveCaptions, true);
        }));
    }

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

$router->add('GET', '/api/svp/my-system', function () {
    $payload = function_exists('svp_auth_require') ? svp_auth_require() : (Auth::getPayload() ?: null);
    if (!$payload) Response::error('Phiên đăng nhập hết hạn', 401);
    $db = Database::getInstance();
    $userId = (string) ($payload['sub'] ?? '');

    $userStmt = $db->prepare('SELECT id, full_name, phone, email, svp_id, referral_code, referred_by, created_at FROM users WHERE id = :id LIMIT 1');
    $userStmt->execute(['id' => $userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) Response::notFound('Không tìm thấy tài khoản');

    $formatReferralUser = function (array $row, int $level = 1): array {
        return [
            'id' => (string) $row['id'],
            'fullName' => (string) ($row['full_name'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'svpId' => (string) ($row['svp_id'] ?? ''),
            'referralCode' => (string) ($row['referral_code'] ?? ''),
            'referredBy' => (string) ($row['referred_by'] ?? ''),
            'accountStatus' => (string) ($row['account_status'] ?? 'active'),
            'createdAt' => (string) ($row['created_at'] ?? ''),
            'level' => $level,
            'children' => [],
        ];
    };

    $directReferrals = [];
    $indirectReferrals = [];
    $childrenByParent = [];
    $visited = [$userId => true];
    $parentIds = [$userId];
    $level = 1;
    $totalLoaded = 0;

    while (!empty($parentIds) && $level <= 5 && $totalLoaded < 500) {
        $placeholders = [];
        $params = [];
        foreach (array_values($parentIds) as $index => $parentId) {
            $key = 'p' . $level . '_' . $index;
            $placeholders[] = ':' . $key;
            $params[$key] = $parentId;
        }

        $sql = '
            SELECT id, full_name, phone, email, svp_id, referral_code, referred_by, account_status, created_at
            FROM users
            WHERE referred_by IN (' . implode(',', $placeholders) . ')
            ORDER BY created_at DESC
            LIMIT 500
        ';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) {
            break;
        }

        $nextParentIds = [];
        foreach ($rows as $row) {
            $id = (string) ($row['id'] ?? '');
            if ($id === '' || isset($visited[$id])) {
                continue;
            }
            $visited[$id] = true;
            $item = $formatReferralUser($row, $level);
            $parentId = (string) ($row['referred_by'] ?? '');
            $childrenByParent[$parentId][] = $item;
            if ($level === 1) {
                $directReferrals[] = $item;
            } else {
                $indirectReferrals[] = $item;
            }
            $nextParentIds[] = $id;
            $totalLoaded++;
            if ($totalLoaded >= 500) {
                break 2;
            }
        }

        $parentIds = $nextParentIds;
        $level++;
    }

    $buildTree = function (string $parentId) use (&$buildTree, &$childrenByParent): array {
        return array_map(function (array $item) use (&$buildTree) {
            $item['children'] = $buildTree($item['id']);
            return $item;
        }, $childrenByParent[$parentId] ?? []);
    };

    $code = (string) ($user['referral_code'] ?? '');
    Response::json([
        'user' => [
            'id' => (string) $user['id'],
            'fullName' => (string) ($user['full_name'] ?? ''),
            'phone' => (string) ($user['phone'] ?? ''),
            'email' => (string) ($user['email'] ?? ''),
            'svpId' => (string) ($user['svp_id'] ?? ''),
            'referralCode' => $code,
            'referralLink' => 'https://sodovanphuc.vn/register?ref=' . rawurlencode($code),
        ],
        'directReferrals' => $directReferrals,
        'directReferralCount' => count($directReferrals),
        'indirectReferrals' => $indirectReferrals,
        'indirectReferralCount' => count($indirectReferrals),
        'referralTree' => $buildTree($userId),
        'treeDepthLoaded' => min($level - 1, 5),
    ]);
});

$router->add('GET', '/api/svp/referrals', function () {
    $db = Database::getInstance();
    $where = [];
    $params = [];
    if (!empty($_GET['referralCode'])) {
        $where[] = 'r.referral_code = :referral_code';
        $params['referral_code'] = (string) $_GET['referralCode'];
    }
    if (!empty($_GET['referrerUserId'])) {
        $where[] = 'r.referrer_user_id = :referrer_user_id';
        $params['referrer_user_id'] = (string) $_GET['referrerUserId'];
    }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
    $stmt = $db->prepare("
        SELECT r.*, u.full_name AS referred_name, u.phone AS referred_phone, u.email AS referred_email, u.svp_id AS referred_svp_id
        FROM svp_referrals r
        LEFT JOIN users u ON u.id = r.referred_user_id
        {$whereSql}
        ORDER BY r.created_at DESC
        LIMIT 200
    ");
    $stmt->execute($params);
    $items = array_map(function ($row) {
        return [
            'id' => (string) $row['id'],
            'referrerUserId' => $row['referrer_user_id'],
            'referredUserId' => $row['referred_user_id'],
            'referredName' => (string) ($row['referred_name'] ?? ''),
            'referredPhone' => (string) ($row['referred_phone'] ?? ''),
            'referredEmail' => (string) ($row['referred_email'] ?? ''),
            'referredSvpId' => (string) ($row['referred_svp_id'] ?? ''),
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
