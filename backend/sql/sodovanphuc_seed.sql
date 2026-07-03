-- Sổ Đỏ Vạn Phúc default config data
-- Run after sodovanphuc_schema.sql.

SET NAMES utf8mb4;

INSERT INTO `svp_config_groups` (`id`, `name`, `description`, `sort_order`, `is_system`) VALUES
('account_role_approval', 'Duyệt tài khoản', 'Cấu hình loại tài khoản nào được dùng ngay hoặc cần quản trị viên duyệt', 5, 1),
('property_field_labels', 'Tên trường nhập liệu nhà', 'Admin đổi tên các trường quan trọng trong form đăng nhà mà không cần sửa chương trình', 6, 1),
('company_units', 'Công ty thành viên', 'Danh sách công ty/đội nhóm thành viên', 10, 1),
('property_tags', 'Đặc điểm nhà', 'Tag/đặc điểm tìm kiếm nhà', 20, 1),
('property_statuses', 'Trạng thái nhà', 'Trạng thái xử lý nhà', 30, 1),
('visibility_levels', 'Quyền xem', 'Cấp quyền xem thông tin nhà', 40, 1),
('signing_criteria', 'Tiêu chí điểm ký nhà', 'Tiêu chí tính điểm ký nhà', 50, 1),
('price_segments', 'Phân khúc giá', 'Khoảng giá để lọc nhanh', 60, 1),
('customer_statuses', 'Trạng thái khách', 'Trạng thái khách hàng/nhu cầu', 70, 1)
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`description` = VALUES(`description`),
`sort_order` = VALUES(`sort_order`),
`is_system` = VALUES(`is_system`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `metadata_json`, `sort_order`, `is_active`) VALUES
('role_approval_khach_mua', 'account_role_approval', 'Khách mua', 'khach_mua', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 10, 1),
('role_approval_chu_nha', 'account_role_approval', 'Chủ nhà', 'chu_nha', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 20, 1),
('role_approval_nguoi_gioi_thieu', 'account_role_approval', 'Người giới thiệu', 'nguoi_gioi_thieu', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 30, 1),
('role_approval_ctv_khach', 'account_role_approval', 'CTV giới thiệu khách', 'ctv_khach', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 40, 1),
('role_approval_ctv_nguon', 'account_role_approval', 'CTV giới thiệu nguồn', 'ctv_nguon', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 50, 1),
('role_approval_doi_tac', 'account_role_approval', 'Đối tác', 'doi_tac', '{"requiresApproval":false,"roleGroup":"Cơ bản"}', 60, 1),
('role_approval_chuyen_vien', 'account_role_approval', 'Chuyên viên', 'chuyen_vien', '{"requiresApproval":true,"roleGroup":"Nhân sự"}', 110, 1),
('role_approval_chuyen_gia', 'account_role_approval', 'Chuyên gia', 'chuyen_gia', '{"requiresApproval":true,"roleGroup":"Nhân sự"}', 120, 1),
('role_approval_tro_ly', 'account_role_approval', 'Trợ lý', 'tro_ly', '{"requiresApproval":true,"roleGroup":"Nhân sự"}', 130, 1),
('role_approval_thu_ky', 'account_role_approval', 'Thư ký', 'thu_ky', '{"requiresApproval":true,"roleGroup":"Nhân sự"}', 140, 1),
('role_approval_truong_phong', 'account_role_approval', 'Trưởng phòng', 'truong_phong', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 210, 1),
('role_approval_pho_phong', 'account_role_approval', 'Phó phòng', 'pho_phong', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 220, 1),
('role_approval_giam_doc_khoi', 'account_role_approval', 'Giám đốc Khối', 'giam_doc_khoi', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 230, 1),
('role_approval_pho_giam_doc_khoi', 'account_role_approval', 'Phó Giám đốc Khối', 'pho_giam_doc_khoi', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 240, 1),
('role_approval_giam_doc', 'account_role_approval', 'Giám đốc Khu vực', 'giam_doc', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 250, 1),
('role_approval_pho_giam_doc_khu_vuc', 'account_role_approval', 'Phó Giám đốc Khu vực', 'pho_giam_doc_khu_vuc', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 260, 1),
('role_approval_giam_doc_dieu_hanh', 'account_role_approval', 'Giám đốc Điều hành', 'giam_doc_dieu_hanh', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 270, 1),
('role_approval_pho_giam_doc_dieu_hanh', 'account_role_approval', 'Phó Giám đốc Điều hành', 'pho_giam_doc_dieu_hanh', '{"requiresApproval":true,"roleGroup":"Quản lý"}', 280, 1),
('role_approval_admin', 'account_role_approval', 'Quản trị hệ thống', 'admin', '{"requiresApproval":true,"roleGroup":"Quản trị"}', 900, 1)
ON DUPLICATE KEY UPDATE
`label` = VALUES(`label`),
`sort_order` = VALUES(`sort_order`),
`is_active` = VALUES(`is_active`),
`metadata_json` = IF(`metadata_json` IS NULL OR `metadata_json` = '', VALUES(`metadata_json`), `metadata_json`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `metadata_json`, `sort_order`, `is_active`) VALUES
('field_label_ownerName', 'property_field_labels', 'Tên chủ nhà', 'ownerName', '{"scope":"property","editableLabel":true}', 10, 1),
('field_label_ownerPhone', 'property_field_labels', 'SĐT chủ nhà', 'ownerPhone', '{"scope":"property","editableLabel":true}', 20, 1),
('field_label_ownerCccd', 'property_field_labels', 'CCCD/CMND chủ nhà', 'ownerCccd', '{"scope":"property","editableLabel":true}', 30, 1),
('field_label_ownerNote', 'property_field_labels', 'Ghi chú về chủ nhà', 'ownerNote', '{"scope":"property","editableLabel":true}', 40, 1),
('field_label_title', 'property_field_labels', 'Tiêu đề tin', 'title', '{"scope":"property","editableLabel":true}', 50, 1),
('field_label_propertyType', 'property_field_labels', 'Loại bất động sản', 'propertyType', '{"scope":"property","editableLabel":true}', 60, 1),
('field_label_street', 'property_field_labels', 'Số nhà + Tên đường', 'street', '{"scope":"property","editableLabel":true}', 70, 1),
('field_label_ward', 'property_field_labels', 'Phường/Xã', 'ward', '{"scope":"property","editableLabel":true}', 80, 1),
('field_label_district', 'property_field_labels', 'Quận/Huyện', 'district', '{"scope":"property","editableLabel":true}', 90, 1),
('field_label_gpsCoordinates', 'property_field_labels', 'Tọa độ/GPS', 'gpsCoordinates', '{"scope":"property","editableLabel":true}', 100, 1),
('field_label_area', 'property_field_labels', 'Diện tích (m²)', 'area', '{"scope":"property","editableLabel":true}', 110, 1),
('field_label_bedrooms', 'property_field_labels', 'Phòng ngủ', 'bedrooms', '{"scope":"property","editableLabel":true}', 120, 1),
('field_label_bathrooms', 'property_field_labels', 'WC', 'bathrooms', '{"scope":"property","editableLabel":true}', 130, 1),
('field_label_floors', 'property_field_labels', 'Số tầng', 'floors', '{"scope":"property","editableLabel":true}', 140, 1),
('field_label_direction', 'property_field_labels', 'Hướng nhà', 'direction', '{"scope":"property","editableLabel":true}', 150, 1),
('field_label_bookSerial', 'property_field_labels', 'Số sổ/Seri sổ', 'bookSerial', '{"scope":"property","editableLabel":true}', 160, 1),
('field_label_bookSheet', 'property_field_labels', 'Số tờ', 'bookSheet', '{"scope":"property","editableLabel":true}', 170, 1),
('field_label_bookParcel', 'property_field_labels', 'Thửa đất', 'bookParcel', '{"scope":"property","editableLabel":true}', 180, 1),
('field_label_legalStatus', 'property_field_labels', 'Tình trạng pháp lý', 'legalStatus', '{"scope":"property","editableLabel":true}', 190, 1),
('field_label_planningStatus', 'property_field_labels', 'Thông tin quy hoạch', 'planningStatus', '{"scope":"property","editableLabel":true}', 200, 1),
('field_label_price', 'property_field_labels', 'Giá chào (VNĐ)', 'price', '{"scope":"property","editableLabel":true}', 210, 1),
('field_label_commission', 'property_field_labels', 'Hoa hồng', 'commission', '{"scope":"property","editableLabel":true}', 220, 1),
('field_label_commissionNote', 'property_field_labels', 'Ghi chú hoa hồng', 'commissionNote', '{"scope":"property","editableLabel":true}', 230, 1),
('field_label_internalNote', 'property_field_labels', 'Ghi chú nội bộ', 'internalNote', '{"scope":"property","editableLabel":true}', 240, 1),
('field_label_description', 'property_field_labels', 'Mô tả thêm về nhà', 'description', '{"scope":"property","editableLabel":true}', 250, 1),
('field_label_houseImages', 'property_field_labels', 'Ảnh nhà', 'houseImages', '{"scope":"property","editableLabel":true}', 260, 1),
('field_label_bookImages', 'property_field_labels', 'Ảnh sổ đỏ/sổ hồng', 'bookImages', '{"scope":"property","editableLabel":true}', 270, 1),
('field_label_contractImages', 'property_field_labels', 'Hợp đồng/tài liệu', 'contractImages', '{"scope":"property","editableLabel":true}', 280, 1),
('field_label_ownerSelfie', 'property_field_labels', 'Ảnh tự sướng với nhà', 'ownerSelfie', '{"scope":"property","editableLabel":true}', 290, 1)
ON DUPLICATE KEY UPDATE
`sort_order` = VALUES(`sort_order`),
`is_active` = VALUES(`is_active`),
`metadata_json` = IF(`metadata_json` IS NULL OR `metadata_json` = '', VALUES(`metadata_json`), `metadata_json`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('cu_tuan123_binh_chanh', 'company_units', 'Sổ Đỏ Bình Chánh', 'tuan123_binh_chanh', 10, 1),
('cu_tuan123_binh_duong', 'company_units', 'Sổ Đỏ Bình Dương', 'tuan123_binh_duong', 20, 1),
('cu_tuan123_binh_thanh_phu_nhuan', 'company_units', 'Sổ Đỏ Bình Thạnh Phú Nhuận', 'tuan123_binh_thanh_phu_nhuan', 30, 1),
('cu_tuan123_binh_tan', 'company_units', 'Sổ Đỏ Bình Tân', 'tuan123_binh_tan', 40, 1),
('cu_tuan123_cho_lon', 'company_units', 'Sổ Đỏ Chợ Lớn', 'tuan123_cho_lon', 50, 1),
('cu_tuan123_di_an', 'company_units', 'Sổ Đỏ Dĩ An', 'tuan123_di_an', 60, 1),
('cu_tuan123_go_vap_quan_12', 'company_units', 'Sổ Đỏ Gò Vấp Quận 12', 'tuan123_go_vap_quan_12', 70, 1),
('cu_tuan123_hoc_mon', 'company_units', 'Sổ Đỏ Hóc Môn', 'tuan123_hoc_mon', 80, 1),
('cu_tuan123_mien_nam', 'company_units', 'Sổ Đỏ Miền Nam', 'tuan123_mien_nam', 90, 1),
('cu_tuan123_mien_tay', 'company_units', 'Sổ Đỏ Miền Tây', 'tuan123_mien_tay', 100, 1),
('cu_tuan123_mien_dong', 'company_units', 'Sổ Đỏ Miền Đông', 'tuan123_mien_dong', 110, 1),
('cu_tuan123_phu_my_hung', 'company_units', 'Sổ Đỏ Phú Mỹ Hưng', 'tuan123_phu_my_hung', 120, 1),
('cu_tuan123_thuan_an', 'company_units', 'Sổ Đỏ Thuận An', 'tuan123_thuan_an', 130, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('tag_o_to', 'property_tags', 'Ô tô', 'o_to', 10, 1),
('tag_mat_pho', 'property_tags', 'Mặt phố', 'mat_pho', 20, 1),
('tag_kinh_doanh', 'property_tags', 'Kinh doanh', 'kinh_doanh', 30, 1),
('tag_chung_cu', 'property_tags', 'Chung cư', 'chung_cu', 40, 1),
('tag_dong_tien', 'property_tags', 'Dòng tiền', 'dong_tien', 50, 1),
('tag_thang_may', 'property_tags', 'Thang máy', 'thang_may', 60, 1),
('tag_hem', 'property_tags', 'Hẻm', 'hem', 70, 1),
('tag_san_thuong', 'property_tags', 'Sân thượng', 'san_thuong', 80, 1),
('tag_chinh_chu', 'property_tags', 'Chính chủ', 'chinh_chu', 90, 1),
('tag_gap', 'property_tags', 'Gấp', 'gap', 100, 1),
('tag_dau_tu', 'property_tags', 'Đầu tư', 'dau_tu', 110, 1),
('tag_cho_thue', 'property_tags', 'Cho thuê', 'cho_thue', 120, 1),
('tag_gan_metro', 'property_tags', 'Gần metro', 'gan_metro', 130, 1),
('tag_mo_spa', 'property_tags', 'Mở spa', 'mo_spa', 140, 1),
('tag_mat_tien', 'property_tags', 'Mặt tiền', 'mat_tien', 150, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('st_new', 'property_statuses', 'Mới đăng', 'new', 10, 1),
('st_active', 'property_statuses', 'Đang bán', 'active', 20, 1),
('st_deposit', 'property_statuses', 'Đã cọc', 'deposit', 30, 1),
('st_sold', 'property_statuses', 'Đã bán', 'sold', 40, 1),
('st_paused', 'property_statuses', 'Tạm dừng', 'paused', 50, 1),
('st_hidden', 'property_statuses', 'Ẩn', 'hidden', 60, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('vl_dau_khach_duoi_lop4', 'visibility_levels', 'Công khai cho khách mua', 'public_buyer', 10, 1),
('vl_lop4', 'visibility_levels', 'Chuyên viên/CTV khách', 'specialist_collaborator', 20, 1),
('vl_lop8', 'visibility_levels', 'CTV nguồn', 'source_collaborator', 30, 1),
('vl_tot_nghiep', 'visibility_levels', 'Chuyên gia phụ trách', 'assigned_expert', 40, 1),
('vl_vinh_danh', 'visibility_levels', 'Quản lý/Admin', 'management_admin', 50, 1),
('vl_chuyen_gia', 'visibility_levels', 'Chuyên gia toàn hệ thống', 'expert_network', 60, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `score`, `sort_order`, `is_active`) VALUES
('sc_named_owner', 'signing_criteria', 'Ký với người đứng tên trên sổ', 'named_owner', 1, 10, 1),
('sc_not_named_owner', 'signing_criteria', 'Ký với người không đứng tên trên sổ', 'not_named_owner', -1, 20, 1),
('sc_low_commission', 'signing_criteria', 'Hoa hồng nhỏ hơn 3% giá chào', 'low_commission', -1, 30, 1),
('sc_e_contract', 'signing_criteria', 'Hợp đồng điện tử', 'e_contract', -3, 40, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `score` = VALUES(`score`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `metadata_json`, `sort_order`, `is_active`) VALUES
('price_segments_under_3b', 'price_segments', 'Nhỏ 3', 'under_3b', '{"min":0,"max":3000000000}', 10, 1),
('price_segments_3_6b', 'price_segments', '3 đến 6', '3_6b', '{"min":3000000000,"max":6000000000}', 20, 1),
('price_segments_6_10b', 'price_segments', '6 đến 10', '6_10b', '{"min":6000000000,"max":10000000000}', 30, 1),
('price_segments_10_20b', 'price_segments', '10 đến 20', '10_20b', '{"min":10000000000,"max":20000000000}', 40, 1),
('price_segments_trieu_do', 'price_segments', 'Triệu đô', '20_50b', '{"min":20000000000,"max":50000000000}', 50, 1),
('price_segments_ty_phu', 'price_segments', 'Tỷ phú', '50_100b', '{"min":50000000000,"max":100000000000}', 60, 1),
('price_segments_dai_ty_phu', 'price_segments', 'Đại tỷ phú', 'over_100b', '{"min":100000000000,"max":null}', 70, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `metadata_json` = VALUES(`metadata_json`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('cs_new', 'customer_statuses', 'Mới', 'new', 10, 1),
('cs_contacted', 'customer_statuses', 'Đã liên hệ', 'contacted', 20, 1),
('cs_viewing', 'customer_statuses', 'Đang dẫn xem', 'viewing', 30, 1),
('cs_deposit', 'customer_statuses', 'Đã cọc', 'deposit', 40, 1),
('cs_done', 'customer_statuses', 'Hoàn thành', 'done', 50, 1),
('cs_lost', 'customer_statuses', 'Không phù hợp', 'lost', 60, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);
