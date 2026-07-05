export const VIETNAM_PROVINCES = [
  'TP.HCM',
  'Hà Nội',
  'Đà Nẵng',
  'Bình Dương',
  'Đồng Nai',
  'Long An',
  'Bà Rịa - Vũng Tàu',
  'Cần Thơ',
  'Hải Phòng',
  'Khánh Hòa',
  'Thanh Hóa',
];

const GENERIC_DISTRICTS = [
  'Hóc Môn',
  'Bình Chánh',
  'Gò Vấp',
  'Quận 12',
  'Bình Tân',
  'Tân Phú',
  'Tân Bình',
  'Bình Thạnh',
  'Phú Nhuận',
  'Thủ Đức',
  'Nhà Bè',
  'Củ Chi',
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Dĩ An',
  'Thuận An',
  'Biên Hòa',
  'Long Thanh',
  'Nhơn Trạch',
];

const HCM_DISTRICTS = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Bình Tân',
  'Bình Thạnh',
  'Bình Chánh',
  'Củ Chi',
  'Gò Vấp',
  'Hóc Môn',
  'Nhà Bè',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Thủ Đức',
];

const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  'tp hcm': HCM_DISTRICTS,
  'tphcm': HCM_DISTRICTS,
  'hcm': HCM_DISTRICTS,
  'ho chi minh': HCM_DISTRICTS,
  'thanh pho ho chi minh': HCM_DISTRICTS,
  'ha noi': ['Ba Đình', 'Bắc Từ Liêm', 'Cầu Giấy', 'Đống Đa', 'Hà Đông', 'Hai Bà Trưng', 'Hoàn Kiếm', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Tây Hồ', 'Thanh Xuân'],
  'da nang': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'],
  'binh duong': ['Dĩ An', 'Thuận An', 'Thủ Dầu Một', 'Bến Cát', 'Tân Uyên', 'Bắc Tân Uyên', 'Bàu Bàng', 'Dầu Tiếng', 'Phú Giáo'],
  'dong nai': ['Biên Hòa', 'Long Khánh', 'Long Thành', 'Nhơn Trạch', 'Trảng Bom', 'Vĩnh Cửu', 'Thống Nhất', 'Định Quán', 'Tân Phú', 'Cẩm Mỹ', 'Xuân Lộc'],
};

const WARDS_BY_DISTRICT: Record<string, string[]> = {
  'binh tan': [
    'An Lạc',
    'An Lạc A',
    'Bình Hưng Hòa',
    'Bình Hưng Hòa A',
    'Bình Hưng Hòa B',
    'Bình Trị Đông',
    'Bình Trị Đông A',
    'Bình Trị Đông B',
    'Tân Tạo',
    'Tân Tạo A',
  ],
  'hoc mon': [
    'Hóc Môn',
    'Thị trấn Hóc Môn',
    'Bà Điểm',
    'Đông Thạnh',
    'Nhị Bình',
    'Tân Hiệp',
    'Tân Thới Nhì',
    'Tân Xuân',
    'Thới Tam Thôn',
    'Trung Chánh',
    'Xuân Thới Đông',
    'Xuân Thới Sơn',
    'Xuân Thới Thượng',
  ],
  'binh chanh': [
    'Bình Chánh',
    'An Phú Tây',
    'Bình Hưng',
    'Bình Lợi',
    'Đa Phước',
    'Hưng Long',
    'Lê Minh Xuân',
    'Phạm Văn Hai',
    'Phong Phú',
    'Quy Đức',
    'Tân Kiên',
    'Tân Nhựt',
    'Tân Quý Tây',
    'Vĩnh Lộc A',
    'Vĩnh Lộc B',
  ],
  'quan 12': ['An Phú Đông', 'Đông Hưng Thuận', 'Hiệp Thành', 'Tân Chánh Hiệp', 'Tân Hưng Thuận', 'Tân Thới Hiệp', 'Tân Thới Nhất', 'Thạnh Lộc', 'Thạnh Xuân', 'Thới An', 'Trung Mỹ Tây'],
  'go vap': ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'],
  'tan phu': ['Tân Sơn Nhì', 'Tây Thạnh', 'Sơn Kỳ', 'Tân Quý', 'Tân Thành', 'Phú Thọ Hòa', 'Phú Thạnh', 'Phú Trung', 'Hòa Thạnh', 'Hiệp Tân', 'Tân Thới Hòa'],
  'tan binh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
  'binh thanh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'],
  'phu nhuan': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'],
  'thu duc': ['An Khánh', 'An Lợi Đông', 'An Phú', 'Bình An', 'Bình Chiểu', 'Bình Thọ', 'Bình Trưng Đông', 'Bình Trưng Tây', 'Cát Lái', 'Hiệp Bình Chánh', 'Hiệp Bình Phước', 'Hiệp Phú', 'Linh Chiểu', 'Linh Đông', 'Linh Tây', 'Linh Trung', 'Linh Xuân', 'Long Bình', 'Long Phước', 'Long Thạnh Mỹ', 'Long Trường', 'Phú Hữu', 'Phước Bình', 'Phước Long A', 'Phước Long B', 'Tam Bình', 'Tam Phú', 'Tăng Nhơn Phú A', 'Tăng Nhơn Phú B', 'Thạnh Mỹ Lợi', 'Thảo Điền', 'Trường Thạnh', 'Trường Thọ'],
  'nha be': ['Thị trấn Nhà Bè', 'Hiệp Phước', 'Long Thới', 'Nhơn Đức', 'Phú Xuân', 'Phước Kiển', 'Phước Lộc'],
  'cu chi': ['Thị trấn Củ Chi', 'An Nhơn Tây', 'An Phú', 'Bình Mỹ', 'Hòa Phú', 'Nhuận Đức', 'Phạm Văn Cội', 'Phú Hòa Đông', 'Phú Mỹ Hưng', 'Phước Hiệp', 'Phước Thạnh', 'Phước Vĩnh An', 'Tân An Hội', 'Tân Phú Trung', 'Tân Thạnh Đông', 'Tân Thạnh Tây', 'Tân Thông Hội', 'Thái Mỹ', 'Trung An', 'Trung Lập Hạ', 'Trung Lập Thượng'],
  'quan 1': ['Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Cô Giang', 'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Tân Định'],
  'quan 3': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Võ Thị Sáu'],
  'quan 4': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18'],
  'quan 5': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
  'quan 6': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
  'quan 7': ['Tân Phong', 'Tân Phú', 'Tân Quy', 'Tân Thuận Đông', 'Tân Thuận Tây', 'Bình Thuận', 'Phú Mỹ', 'Phú Thuận'],
  'quan 8': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
  'quan 10': ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
  'quan 11': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
};

const STREETS_BY_DISTRICT: Record<string, string[]> = {
  'binh tan': ['Gò Xoài', 'Mã Lò', 'Tỉnh Lộ 10', 'Lê Văn Quới', 'Hương Lộ 2', 'Tân Kỳ Tân Quý', 'Tên Lửa', 'Kinh Dương Vương', 'Đường Số 7', 'Đường Số 1', 'Liên Khu 4-5', 'Bình Long'],
  'hoc mon': ['Huỳnh Thị Mài', 'Tô Ký', 'Song Hành', 'Nguyễn Ảnh Thủ', 'Lê Thị Hà', 'Đặng Thúc Vịnh', 'Phan Văn Hớn', 'Trần Văn Mười', 'Quang Trung'],
  'go vap': ['Quang Trung', 'Nguyễn Oanh', 'Phan Huy Ích', 'Lê Đức Thọ', 'Lê Văn Thọ', 'Thống Nhất', 'Phạm Văn Chiêu', 'Nguyễn Văn Khối'],
  'quan 12': ['Tô Ký', 'Nguyễn Ảnh Thủ', 'Lê Văn Khương', 'Hà Huy Giáp', 'Trường Chinh', 'Phan Văn Hớn', 'Tân Thới Hiệp'],
  'tan phu': ['Tân Kỳ Tân Quý', 'Lê Trọng Tấn', 'Độc Lập', 'Tây Thạnh', 'Thoại Ngọc Hầu', 'Âu Cơ', 'Lũy Bán Bích'],
  'binh chanh': ['Quách Điêu', 'Vĩnh Lộc', 'Trần Đại Nghĩa', 'Quốc Lộ 50', 'Đoàn Nguyễn Tuấn', 'Nguyễn Văn Linh'],
  'thu duc': ['Phạm Văn Đồng', 'Kha Vạn Cân', 'Võ Văn Ngân', 'Tô Ngọc Vân', 'Linh Đông', 'Đặng Văn Bi', 'Đỗ Xuân Hợp'],
};

export function normalizeLocationText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function findByNormalized<T>(map: Record<string, T>, value: string) {
  const normalized = normalizeLocationText(value);
  return map[normalized] || map[normalized.replace(/^tp\s+/, '')] || map[normalized.replace(/^quan\s+/, 'quan ')];
}

export function getProvinceSuggestions() {
  return VIETNAM_PROVINCES;
}

export function getDistrictSuggestions(province: string) {
  const matched = findByNormalized(DISTRICTS_BY_PROVINCE, province);
  return unique([...(matched || []), ...GENERIC_DISTRICTS]);
}

export function getWardSuggestions(_province: string, district: string) {
  const matched = findByNormalized(WARDS_BY_DISTRICT, district);
  return unique(matched || []);
}

export function getStreetSuggestions(_province: string, district: string) {
  const matched = findByNormalized(STREETS_BY_DISTRICT, district);
  return unique(matched || []);
}
