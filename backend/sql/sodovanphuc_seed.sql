-- Sổ Đỏ Vạn Phúc default config data
-- Run after sodovanphuc_schema.sql.

SET NAMES utf8mb4;

INSERT INTO `svp_config_groups` (`id`, `name`, `description`, `sort_order`, `is_system`) VALUES
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

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('cu_tuan123_binh_chanh', 'company_units', 'Tuấn 123 Bình Chánh', 'tuan123_binh_chanh', 10, 1),
('cu_tuan123_binh_duong', 'company_units', 'Tuấn 123 Bình Dương', 'tuan123_binh_duong', 20, 1),
('cu_tuan123_binh_thanh_phu_nhuan', 'company_units', 'Tuấn 123 Bình Thạnh Phú Nhuận', 'tuan123_binh_thanh_phu_nhuan', 30, 1),
('cu_tuan123_binh_tan', 'company_units', 'Tuấn 123 Bình Tân', 'tuan123_binh_tan', 40, 1),
('cu_tuan123_cho_lon', 'company_units', 'Tuấn 123 Chợ Lớn', 'tuan123_cho_lon', 50, 1),
('cu_tuan123_di_an', 'company_units', 'Tuấn 123 Dĩ An', 'tuan123_di_an', 60, 1),
('cu_tuan123_go_vap_quan_12', 'company_units', 'Tuấn 123 Gò Vấp Quận 12', 'tuan123_go_vap_quan_12', 70, 1),
('cu_tuan123_hoc_mon', 'company_units', 'Tuấn 123 Hóc Môn', 'tuan123_hoc_mon', 80, 1),
('cu_tuan123_mien_nam', 'company_units', 'Tuấn 123 Miền Nam', 'tuan123_mien_nam', 90, 1),
('cu_tuan123_mien_tay', 'company_units', 'Tuấn 123 Miền Tây', 'tuan123_mien_tay', 100, 1),
('cu_tuan123_mien_dong', 'company_units', 'Tuấn 123 Miền Đông', 'tuan123_mien_dong', 110, 1),
('cu_tuan123_phu_my_hung', 'company_units', 'Tuấn 123 Phú Mỹ Hưng', 'tuan123_phu_my_hung', 120, 1),
('cu_tuan123_thuan_an', 'company_units', 'Tuấn 123 Thuận An', 'tuan123_thuan_an', 130, 1)
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
('vl_dau_khach_duoi_lop4', 'visibility_levels', 'Đầu khách + Dưới Lớp 4', 'dau_khach_duoi_lop4', 10, 1),
('vl_lop4', 'visibility_levels', 'Lớp 4', 'lop4', 20, 1),
('vl_lop8', 'visibility_levels', 'Lớp 8', 'lop8', 30, 1),
('vl_tot_nghiep', 'visibility_levels', 'Tốt nghiệp', 'tot_nghiep', 40, 1),
('vl_vinh_danh', 'visibility_levels', 'VINH DANH', 'vinh_danh', 50, 1),
('vl_chuyen_gia', 'visibility_levels', 'Chuyên gia', 'chuyen_gia', 60, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `score`, `sort_order`, `is_active`) VALUES
('sc_named_owner', 'signing_criteria', 'Ký với người đứng tên trên sổ', 'named_owner', 1, 10, 1),
('sc_not_named_owner', 'signing_criteria', 'Ký với người không đứng tên trên sổ', 'not_named_owner', -1, 20, 1),
('sc_low_commission', 'signing_criteria', 'Hoa hồng nhỏ hơn 3% giá chào', 'low_commission', -1, 30, 1),
('sc_e_contract', 'signing_criteria', 'Hợp đồng điện tử', 'e_contract', -3, 40, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `score` = VALUES(`score`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `metadata_json`, `sort_order`, `is_active`) VALUES
('ps_under_3b', 'price_segments', 'Dưới 3 tỷ', 'under_3b', '{"min":0,"max":3000000000}', 10, 1),
('ps_3_5b', 'price_segments', '3 - 5 tỷ', '3_5b', '{"min":3000000000,"max":5000000000}', 20, 1),
('ps_5_8b', 'price_segments', '5 - 8 tỷ', '5_8b', '{"min":5000000000,"max":8000000000}', 30, 1),
('ps_8_12b', 'price_segments', '8 - 12 tỷ', '8_12b', '{"min":8000000000,"max":12000000000}', 40, 1),
('ps_over_12b', 'price_segments', 'Trên 12 tỷ', 'over_12b', '{"min":12000000000,"max":null}', 50, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `metadata_json` = VALUES(`metadata_json`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);

INSERT INTO `svp_config_options` (`id`, `group_id`, `label`, `value`, `sort_order`, `is_active`) VALUES
('cs_new', 'customer_statuses', 'Mới', 'new', 10, 1),
('cs_contacted', 'customer_statuses', 'Đã liên hệ', 'contacted', 20, 1),
('cs_viewing', 'customer_statuses', 'Đang dẫn xem', 'viewing', 30, 1),
('cs_deposit', 'customer_statuses', 'Đã cọc', 'deposit', 40, 1),
('cs_done', 'customer_statuses', 'Hoàn thành', 'done', 50, 1),
('cs_lost', 'customer_statuses', 'Không phù hợp', 'lost', 60, 1)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`);
