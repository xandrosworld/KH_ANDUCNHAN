export type RoleStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export type RoleGroup = 'public' | 'staff' | 'management' | 'partner';

export interface RoleDefinition {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  group: RoleGroup;
  requiresApproval: boolean;
  dashboardPath: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    slug: 'khach_mua',
    label: 'Tôi cần mua nhà',
    shortLabel: 'Khách mua',
    description: 'Tìm nguồn nhà phù hợp nhu cầu',
    group: 'public',
    requiresApproval: false,
    dashboardPath: '/khach-mua',
  },
  {
    slug: 'chu_nha',
    label: 'Tôi cần bán nhà',
    shortLabel: 'Chủ nhà',
    description: 'Gửi thông tin nhà cần bán',
    group: 'public',
    requiresApproval: false,
    dashboardPath: '/chu-nha',
  },
  {
    slug: 'nguoi_gioi_thieu',
    label: 'Giới thiệu nhân sự',
    shortLabel: 'Người giới thiệu',
    description: 'Giới thiệu nhân sự, chủ nhà hoặc khách mua',
    group: 'public',
    requiresApproval: false,
    dashboardPath: '/gioi-thieu',
  },
  {
    slug: 'ctv_khach',
    label: 'CTV giới thiệu',
    shortLabel: 'CTV giới thiệu',
    description: 'Cộng tác viên giới thiệu đơn giản',
    group: 'public',
    requiresApproval: false,
    dashboardPath: '/ctv',
  },
  {
    slug: 'ctv_nguon',
    label: 'CTV giới thiệu nguồn',
    shortLabel: 'CTV nguồn',
    description: 'Giới thiệu chủ nhà hoặc nguồn nhà phù hợp',
    group: 'public',
    requiresApproval: false,
    dashboardPath: '/ctv',
  },
  {
    slug: 'chuyen_vien',
    label: 'Chuyên viên',
    shortLabel: 'Chuyên viên',
    description: 'Tìm khách mua nhà',
    group: 'staff',
    requiresApproval: true,
    dashboardPath: '/chuyen-vien',
  },
  {
    slug: 'chuyen_gia',
    label: 'Chuyên gia',
    shortLabel: 'Chuyên gia',
    description: 'Tìm chủ bán nhà',
    group: 'staff',
    requiresApproval: true,
    dashboardPath: '/chuyen-gia',
  },
  {
    slug: 'tro_ly',
    label: 'Trợ lý',
    shortLabel: 'Trợ lý',
    description: 'Hỗ trợ vận hành và quản lý hồ sơ',
    group: 'staff',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'thu_ky',
    label: 'Thư ký',
    shortLabel: 'Thư ký',
    description: 'Theo dõi hồ sơ và lịch làm việc',
    group: 'staff',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'truong_phong',
    label: 'Trưởng phòng',
    shortLabel: 'Trưởng phòng',
    description: 'Quản lý đội nhóm',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'pho_phong',
    label: 'Phó phòng',
    shortLabel: 'Phó phòng',
    description: 'Hỗ trợ quản lý phòng',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'giam_doc_khoi',
    label: 'Giám đốc Khối',
    shortLabel: 'Giám đốc Khối',
    description: 'Quản lý cấp Khối',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'pho_giam_doc_khoi',
    label: 'Phó Giám đốc Khối',
    shortLabel: 'Phó GĐ Khối',
    description: 'Hỗ trợ quản lý cấp Khối',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'giam_doc',
    label: 'Giám đốc Khu vực',
    shortLabel: 'Giám đốc Khu vực',
    description: 'Quản lý cấp Khu vực',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'pho_giam_doc_khu_vuc',
    label: 'Phó Giám đốc Khu vực',
    shortLabel: 'Phó GĐ Khu vực',
    description: 'Hỗ trợ quản lý cấp Khu vực',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'giam_doc_dieu_hanh',
    label: 'Giám đốc Điều hành',
    shortLabel: 'Giám đốc Điều hành',
    description: 'Điều hành hệ thống',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'pho_giam_doc_dieu_hanh',
    label: 'Phó Giám đốc Điều hành',
    shortLabel: 'Phó GĐ Điều hành',
    description: 'Hỗ trợ điều hành hệ thống',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'admin',
    label: 'Quản trị hệ thống',
    shortLabel: 'Quản trị',
    description: 'Quản trị toàn bộ hệ thống',
    group: 'management',
    requiresApproval: true,
    dashboardPath: '/quan-tri',
  },
  {
    slug: 'doi_tac',
    label: 'Đối tác',
    shortLabel: 'Đối tác',
    description: 'Kết nối dịch vụ hỗ trợ giao dịch',
    group: 'partner',
    requiresApproval: false,
    dashboardPath: '/gioi-thieu',
  },
];

export const ROLE_MAP = ROLE_DEFINITIONS.reduce<Record<string, RoleDefinition>>((acc, role) => {
  acc[role.slug] = role;
  return acc;
}, {});

export const ROLE_NAMES = ROLE_DEFINITIONS.reduce<Record<string, string>>((acc, role) => {
  acc[role.slug] = role.shortLabel;
  return acc;
}, {});

export const PUBLIC_REGISTRATION_ROLES = ROLE_DEFINITIONS.filter((role) => role.slug !== 'admin');

export function getRoleDashboardPath(roleSlug: string): string {
  return ROLE_MAP[roleSlug]?.dashboardPath || '/profile';
}

export function roleNeedsApproval(roleSlug: string): boolean {
  return ROLE_MAP[roleSlug]?.requiresApproval ?? true;
}

export function getRoleDisplayName(roleSlug: string): string {
  return ROLE_NAMES[roleSlug] || roleSlug;
}
