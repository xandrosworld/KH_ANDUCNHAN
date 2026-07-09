import { expect, test, type Page, type Route, type TestInfo } from '@playwright/test';

const ROLE_SLUGS = [
  'admin',
  'giam_doc',
  'truong_phong',
  'chuyen_gia',
  'chuyen_vien',
  'hoc_vien',
  'ctv_khach',
  'ctv_nguon',
  'chu_nha',
  'khach_mua',
  'nguoi_gioi_thieu',
  'doi_tac',
];

const ADMIN_IMPERSONATION_ROLE_SLUGS = [
  'chuyen_vien',
  'chuyen_gia',
  'hoc_vien',
  'giam_doc_dieu_hanh',
  'pho_giam_doc_dieu_hanh',
  'giam_doc',
  'pho_giam_doc_khu_vuc',
  'giam_doc_khoi',
  'pho_giam_doc_khoi',
  'truong_phong',
  'pho_phong',
  'tro_ly',
  'thu_ky',
  'admin',
  'ctv_nguon',
  'ctv_khach',
  'nguoi_gioi_thieu',
  'doi_tac',
  'khach_mua',
  'chu_nha',
];

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  admin: '/quan-tri',
  giam_doc: '/quan-tri',
  truong_phong: '/quan-tri',
  pho_phong: '/quan-tri',
  giam_doc_khoi: '/quan-tri',
  pho_giam_doc_khoi: '/quan-tri',
  pho_giam_doc_khu_vuc: '/quan-tri',
  giam_doc_dieu_hanh: '/quan-tri',
  pho_giam_doc_dieu_hanh: '/quan-tri',
  tro_ly: '/quan-tri',
  thu_ky: '/quan-tri',
  chuyen_gia: '/chuyen-gia',
  chuyen_vien: '/chuyen-vien',
  hoc_vien: '/hoc-vien',
  ctv_khach: '/ctv',
  ctv_nguon: '/ctv',
  chu_nha: '/chu-nha',
  khach_mua: '/khach-mua',
  nguoi_gioi_thieu: '/nguoi-gioi-thieu',
  doi_tac: '/nguoi-gioi-thieu',
};

const ROLE_NAMES: Record<string, string> = {
  admin: 'Quan tri vien',
  giam_doc: 'Giam doc khu vuc',
  truong_phong: 'Truong phong',
  chuyen_gia: 'Chuyen gia',
  chuyen_vien: 'Cong tac vien',
  hoc_vien: 'Hoc vien',
  ctv_khach: 'CTV gioi thieu khach',
  ctv_nguon: 'CTV tim nguon',
  chu_nha: 'Chu nha',
  khach_mua: 'Khach mua',
  nguoi_gioi_thieu: 'CTV gioi thieu nhan su',
  doi_tac: 'Doi tac',
};

const properties = [
  {
    id: 'prop_1',
    code: 'SVP000001',
    title: 'Nha pho Van Phuc 72m2',
    description: 'Nha co cau truc du lieu ro rang, phu hop de test AI va tim kiem.',
    ownerName: 'Nguyen Van A',
    ownerPhone: '0909000001',
    bookSerial: 'SO-001',
    price: 6800000000,
    areaM2: 72,
    province: 'Ha Noi',
    district: 'Ha Dong',
    ward: 'Van Phuc',
    address: 'Van Phuc, Ha Dong, Ha Noi',
    statusId: 'st_active',
    createdAt: '2026-06-29 08:00:00',
    createdBy: 'user_chuyen_gia',
    expertId: 'user_chuyen_gia',
    extra: {
      province: 'Ha Noi',
      propertyType: 'Nha pho',
      bedrooms: '4',
      bathrooms: '3',
      floors: '3',
      direction: 'Dong Nam',
      legalStatus: 'So hong rieng',
      commission: '2',
      internalNote: 'Du lieu noi bo chi hien cho nhan su phu trach.',
    },
  },
  {
    id: 'prop_2',
    code: 'SVP000002',
    title: 'Can ho trung tam',
    description: 'Can ho phu hop khach tre.',
    ownerName: 'Tran Thi B',
    ownerPhone: '0909000002',
    price: 4200000000,
    areaM2: 58,
    province: 'Ha Noi',
    district: 'Thanh Xuan',
    ward: 'Khuong Trung',
    address: 'Thanh Xuan, Ha Noi',
    statusId: 'st_new',
    createdAt: '2026-06-28 09:00:00',
    createdBy: 'user_chu_nha',
    extra: { province: 'Ha Noi', propertyType: 'Can ho', bedrooms: '2', bathrooms: '2' },
  },
];

const customers = [
  {
    id: 'cus_1',
    fullName: 'Khach mua Van Phuc',
    phone: '0911000001',
    email: 'khach@sodovanphuc.vn',
    source: 'Zalo',
    statusId: 'cs_new',
    assignedUserId: 'user_chuyen_vien',
    note: 'Can nha duoi 7 ty, oto vao nha.',
    createdAt: '2026-06-29 08:30:00',
  },
  {
    id: 'cus_2',
    fullName: 'Khach da hen xem',
    phone: '0911000002',
    statusId: 'cs_viewing',
    assignedUserId: 'user_chuyen_vien',
    note: 'Da co lich xem.',
    createdAt: '2026-06-29 09:00:00',
  },
];

const schedules = [
  {
    id: 'sch_1',
    customerId: 'cus_1',
    customerName: 'Khach mua Van Phuc',
    propertyId: 'prop_1',
    propertyTitle: 'Nha pho Van Phuc 72m2',
    scheduledAt: '2026-07-01 09:30:00',
    statusId: 'scheduled',
    note: 'Hen tai van phong truoc khi di xem nha.',
  },
];

const referrals = [
  {
    id: 'ref_1',
    referralCode: 'SVP-2026-0001',
    referredName: 'Nguoi duoc gioi thieu',
    status: 'active',
    createdAt: '2026-06-29 10:00:00',
  },
];

const configGroups = [
  {
    id: 'company_units',
    group: 'company_units',
    name: 'Cong ty thanh vien',
    options: [
      { id: 'vp_hn', key: 'vp_hn', label: 'Van Phuc Ha Noi', value: 'vp_hn', isActive: true },
      { id: 'vp_hcm', key: 'vp_hcm', label: 'Van Phuc TP.HCM', value: 'vp_hcm', isActive: true },
    ],
  },
  {
    id: 'visibility_levels',
    group: 'visibility_levels',
    name: 'Quyen xem',
    options: [
      { id: 'vl_quan_ly', key: 'vl_quan_ly', label: 'Quan ly/Admin', value: 'management_admin', isActive: true },
      { id: 'vl_cong_khai', key: 'vl_cong_khai', label: 'Cong khai cho khach mua', value: 'public_buyer', isActive: true },
    ],
  },
  {
    id: 'property_tags',
    group: 'property_tags',
    name: 'Tag nha',
    options: [
      { id: 'tag_oto', key: 'tag_oto', label: 'O to', value: 'oto', isActive: true },
      { id: 'tag_dau_tu', key: 'tag_dau_tu', label: 'Dau tu', value: 'dau_tu', isActive: true },
    ],
  },
  {
    id: 'signing_criteria',
    group: 'signing_criteria',
    name: 'Diem ky nha',
    options: [
      { id: 'sign_owner', key: 'sign_owner', label: 'Ky voi nguoi dung ten tren so', value: 'owner_on_book', score: 1, isActive: true },
      { id: 'sign_non_owner', key: 'sign_non_owner', label: 'Ky voi nguoi khong dung ten tren so', value: 'non_owner', score: -1, isActive: true },
      { id: 'sign_low_commission', key: 'sign_low_commission', label: 'Hoa hong nho hon 3%', value: 'low_commission', score: -1, isActive: true },
      { id: 'sign_e_contract', key: 'sign_e_contract', label: 'Hop dong dien tu', value: 'e_contract', score: -3, isActive: true },
    ],
  },
  {
    id: 'company_unit',
    group: 'company_unit',
    name: 'Cong ty thanh vien',
    options: [
      { id: 'vp_hn', key: 'vp_hn', label: 'Van Phuc Ha Noi', value: 'vp_hn', isActive: true },
      { id: 'vp_hcm', key: 'vp_hcm', label: 'Van Phuc TP.HCM', value: 'vp_hcm', isActive: true },
    ],
  },
  {
    id: 'property_type',
    group: 'property_type',
    name: 'Loai bat dong san',
    options: [
      { id: 'nha_pho', key: 'nha_pho', label: 'Nha pho', value: 'nha_pho', isActive: true },
      { id: 'can_ho', key: 'can_ho', label: 'Can ho', value: 'can_ho', isActive: true },
    ],
  },
  {
    id: 'property_field_labels',
    group: 'property_field_labels',
    name: 'Ten truong nhap lieu nha',
    description: 'Admin doi ten cac truong quan trong trong form dang nha',
    options: [
      { id: 'field_label_ownerName', key: 'ownerName', label: 'Ten chu nha', value: 'ownerName', isActive: true },
      { id: 'field_label_ownerPhone', key: 'ownerPhone', label: 'SDT chu nha', value: 'ownerPhone', isActive: true },
    ],
  },
];

const roleApprovalSettings = [
  { id: 'role_approval_khach_mua', slug: 'khach_mua', label: 'Khach mua', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 10 },
  { id: 'role_approval_chu_nha', slug: 'chu_nha', label: 'Chu nha', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 20 },
  { id: 'role_approval_nguoi_gioi_thieu', slug: 'nguoi_gioi_thieu', label: 'CTV gioi thieu nhan su', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 30 },
  { id: 'role_approval_ctv_khach', slug: 'ctv_khach', label: 'CTV gioi thieu khach', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 40 },
  { id: 'role_approval_ctv_nguon', slug: 'ctv_nguon', label: 'CTV gioi thieu nguon', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 50 },
  { id: 'role_approval_chuyen_vien', slug: 'chuyen_vien', label: 'Cong tac vien', roleGroup: 'Nhan su', requiresApproval: true, sortOrder: 110 },
  { id: 'role_approval_chuyen_gia', slug: 'chuyen_gia', label: 'Chuyen gia', roleGroup: 'Nhan su', requiresApproval: true, sortOrder: 120 },
  { id: 'role_approval_hoc_vien', slug: 'hoc_vien', label: 'Hoc vien', roleGroup: 'Nhan su', requiresApproval: true, sortOrder: 125 },
  { id: 'role_approval_truong_phong', slug: 'truong_phong', label: 'Truong phong', roleGroup: 'Quan ly', requiresApproval: true, sortOrder: 210 },
  { id: 'role_approval_giam_doc', slug: 'giam_doc', label: 'Giam doc khu vuc', roleGroup: 'Quan ly', requiresApproval: true, sortOrder: 250 },
];

const publicRoutes = [
  '/',
  '/register',
  '/gioi-thieu',
  '/gioi-thieu-cong-ty',
  '/tin-tuc',
  '/forgot-password',
  '/reset-password?token=qa-token&email=qa@sodovanphuc.vn',
  '/pending-approval',
];

const roleRoutes = [
  { role: 'admin', paths: ['/quan-tri', '/quan-tri/nguoi-dung', '/quan-tri/duyet-vai-tro', '/quan-tri/nha', '/quan-tri/khach-hang', '/quan-tri/cau-hinh', '/quan-tri/nhat-ky', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'chu_nha', paths: ['/chu-nha', '/chu-nha/gui-ban', '/chu-nha/nha-cua-toi', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'khach_mua', paths: ['/khach-mua', '/khach-mua/tim-nha', '/khach-mua/yeu-thich', '/nha/prop_1', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'chuyen_gia', paths: ['/chuyen-gia', '/chuyen-gia/dang-nha', '/chuyen-gia/kho-nha-tong', '/chuyen-gia/kho-nha-rieng', '/chuyen-gia/nha/prop_1', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'chuyen_vien', paths: ['/chuyen-vien', '/chuyen-vien/khach-hang', '/chuyen-vien/them-khach', '/chuyen-vien/tim-nha', '/chuyen-vien/lich-xem', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'hoc_vien', paths: ['/hoc-vien', '/hoc-vien/viec-can-lam', '/hoc-vien/dao-tao', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'ctv_khach', paths: ['/ctv', '/ctv/cong-viec', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
  { role: 'nguoi_gioi_thieu', paths: ['/nguoi-gioi-thieu', '/nguoi-gioi-thieu/ma-gioi-thieu', '/xay-dung-he-thong', '/ai', '/profile', '/notifications'] },
];

function userFor(role: string, roleSlugs = ROLE_SLUGS) {
  return {
    id: `user_${role}`,
    svpId: 'SVP000999',
    email: `${role}@sodovanphuc.vn`,
    phone: '0909000999',
    fullName: 'Tai khoan kiem thu',
    avatar: '/logo11.png',
    referralCode: 'SVP-2026-0001',
    accountStatus: 'active',
    activeRole: role,
    roles: roleSlugs.map((slug) => ({ slug, name: ROLE_NAMES[slug], status: 'approved' })),
  };
}

function ok(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: status >= 200 && status < 300, data }),
  });
}

function filterByQuery(url: URL, items: any[]) {
  let result = [...items];
  const statusId = url.searchParams.get('statusId');
  const createdBy = url.searchParams.get('createdBy');
  const assignedTo = url.searchParams.get('assignedTo') || url.searchParams.get('assignedUserId');
  if (statusId) result = result.filter((item) => item.statusId === statusId);
  if (createdBy) result = result.filter((item) => item.createdBy === createdBy || item.expertId === createdBy);
  if (assignedTo) result = result.filter((item) => item.assignedUserId === assignedTo);
  return result;
}

async function installMocks(page: Page, role = 'admin', authenticated = true, roleSlugs = ROLE_SLUGS) {
  if (authenticated) {
    await page.addInitScript((activeRole) => {
      localStorage.setItem('svp_token', 'qa-token');
      localStorage.setItem('svp_active_role', activeRole as string);
    }, role);
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('svp_token');
      localStorage.removeItem('svp_active_role');
    });
  }

  await page.route('**/api/ai/description', (route) => ok(route, {
    description: 'Mo ta AI: nha sang, du lieu ro rang, phu hop nhu cau mua de o va dau tu.',
  }));

  await page.route('**/api/svp/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/svp/, '') || '/';
    const method = request.method();

    if (path === '/auth/me') return ok(route, { user: userFor(role, roleSlugs) });
    if (path === '/auth/login' && method === 'POST') return ok(route, { token: 'qa-token', user: userFor(role, roleSlugs) });
    if (path === '/auth/register' && method === 'POST') return ok(route, { message: 'Da gui yeu cau dang ky' });
    if (path === '/auth/forgot-password' && method === 'POST') return ok(route, { message: 'Da gui email dat lai mat khau' });
    if (path === '/auth/reset-password' && method === 'POST') return ok(route, { message: 'Da dat lai mat khau' });
    if ((path === '/auth/avatar' || path === '/auth/upload-avatar') && method === 'POST') return ok(route, { avatar: '/logo11.png' });
    if (path === '/auth/change-password' && method === 'POST') return ok(route, { message: 'Da doi mat khau' });
    if (path === '/auth/register-role' && method === 'POST') return ok(route, { message: 'Da gui yeu cau vai tro' });
    if (path === '/auth/referrer-lookup' && method === 'GET') return ok(route, { item: { id: 'user_admin', fullName: 'Nguoi gioi thieu QA', svpId: 'SVP000001', phone: '0909***999', referralCode: 'SVP-2026-0001' } });
    if (path === '/auth/oauth/providers' && method === 'GET') {
      return ok(route, {
        items: [
          { provider: 'google', label: 'Google', configured: false },
          { provider: 'facebook', label: 'Facebook', configured: false },
          { provider: 'apple', label: 'Apple', configured: false },
          { provider: 'zalo', label: 'Zalo', configured: false },
        ],
      });
    }
    if (path === '/my-system') return ok(route, {
      user: {
        id: `user_${role}`,
        fullName: 'Tai khoan kiem thu',
        phone: '0909000999',
        email: `${role}@sodovanphuc.vn`,
        svpId: 'SVP000999',
        referralCode: 'SVP-2026-0001',
        referralLink: 'https://sodovanphuc.vn/register?ref=SVP-2026-0001',
      },
      directReferrals: [
        { id: 'f1_1', fullName: 'F1 kiem thu', phone: '0909000111', email: 'f1@sodovanphuc.vn', svpId: 'SVP000111', referralCode: 'SVP-2026-F101', accountStatus: 'active', createdAt: '2026-07-05 09:00:00', level: 1, children: [] },
      ],
      indirectReferrals: [
        { id: 'f2_1', fullName: 'F2 kiem thu', phone: '0909000222', email: 'f2@sodovanphuc.vn', svpId: 'SVP000222', referralCode: 'SVP-2026-F201', accountStatus: 'active', createdAt: '2026-07-05 09:10:00', level: 2, children: [] },
      ],
      referralTree: [
        { id: 'f1_1', fullName: 'F1 kiem thu', phone: '0909000111', email: 'f1@sodovanphuc.vn', svpId: 'SVP000111', referralCode: 'SVP-2026-F101', accountStatus: 'active', createdAt: '2026-07-05 09:00:00', level: 1, children: [
          { id: 'f2_1', fullName: 'F2 kiem thu', phone: '0909000222', email: 'f2@sodovanphuc.vn', svpId: 'SVP000222', referralCode: 'SVP-2026-F201', accountStatus: 'active', createdAt: '2026-07-05 09:10:00', level: 2, children: [] },
        ] },
      ],
      directReferralCount: 1,
      indirectReferralCount: 1,
    });

    if (path === '/admin/dashboard') {
      return ok(route, {
        totalUsers: 12,
        pendingApplications: 2,
        totalProperties: properties.length,
        totalCustomers: customers.length,
        totalSchedules: schedules.length,
        totalReferrals: referrals.length,
      });
    }
    if (path === '/admin/users') return ok(route, {
      items: [
        userFor('admin'),
        {
          ...userFor('chuyen_gia'),
          id: 'user_long_live_like',
          fullName: 'Khách mua kiêm chuyên gia demo Vạn Phúc khu vực Thành phố Hồ Chí Minh',
          email: 'khachmua.kiem.chuyen.gia.demo.vanphuc@sodovanphuc.vn',
          phone: '0917544808',
          svpId: 'SVP000019',
          roles: [
            { slug: 'chuyen_gia', name: 'Chuyên gia', status: 'approved' },
            { slug: 'khach_mua', name: 'Khách mua', status: 'approved' },
            { slug: 'nguoi_gioi_thieu', name: 'CTV giới thiệu nhân sự', status: 'approved' },
          ],
        },
        { ...userFor('chuyen_vien'), accountStatus: 'locked' },
      ],
    });
    if (/^\/admin\/users\/[^/]+\/account-status$/.test(path) && method === 'POST') {
      const id = decodeURIComponent(path.split('/')[3] || '');
      const body = request.postDataJSON?.() as { accountStatus?: string } | undefined;
      return ok(route, { item: { id, account_status: body?.accountStatus || 'active' } });
    }
    if (/^\/admin\/users\/[^/]+\/reset-password$/.test(path) && method === 'POST') {
      const id = decodeURIComponent(path.split('/')[3] || '');
      return ok(route, { tempPassword: 'SVP@TEMP123', user: { id, fullName: 'Tai khoan kiem thu' } });
    }
    if (/^\/admin\/users\/[^/]+$/.test(path) && method === 'PATCH') {
      return ok(route, { message: 'Da cap nhat tai khoan' });
    }
    if (path === '/admin/export' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv; charset=UTF-8',
        body: 'Ho ten,Email\nTai khoan kiem thu,admin@sodovanphuc.vn\n',
      });
    }
    if (path === '/admin/notifications' && method === 'GET') {
      return ok(route, {
        items: [{ id: 'notice_1', title: 'Thong bao noi bo', body: 'Noi dung kiem thu thong bao.', createdAt: '2026-06-30 09:00:00' }],
      });
    }
    if (path === '/admin/notifications' && method === 'POST') {
      const body = request.postDataJSON?.() as { title?: string; body?: string } | undefined;
      return ok(route, { item: { id: 'notice_new', title: body?.title || 'Thong bao moi', body: body?.body || '', createdAt: '2026-06-30 09:30:00' } });
    }
    if (/^\/admin\/notifications\/[^/]+$/.test(path) && method === 'DELETE') return ok(route, { deleted: true });
    if (path === '/admin/role-applications') {
      return ok(route, { items: [{ id: 'app_1', userName: 'Nhan su moi', userEmail: 'new@sodovanphuc.vn', roleSlug: 'chuyen_gia', reason: 'Dang ky dau chu' }] });
    }
    if (path.startsWith('/admin/role-applications/') && method === 'PATCH') return ok(route, { item: { id: path.split('/').pop(), status: 'approved' } });
    if (path === '/admin/role-approval-settings') return ok(route, { items: roleApprovalSettings, total: roleApprovalSettings.length });
    if (path.startsWith('/admin/role-approval-settings/') && method === 'PATCH') {
      const slug = decodeURIComponent(path.split('/').pop() || '');
      const body = request.postDataJSON?.() as { requiresApproval?: boolean } | undefined;
      const current = roleApprovalSettings.find((item) => item.slug === slug) || roleApprovalSettings[0];
      return ok(route, { item: { ...current, requiresApproval: !!body?.requiresApproval } });
    }

    if (path === '/properties/check-duplicate' && method === 'POST') {
      return ok(route, {
        matches: [],
        total: 0,
        rule: {
          hasDuplicates: false,
          canSubmit: true,
          currentExpertCount: 0,
          maxExpertsAllowed: 3,
          highestSigningScore: null,
          submittedSigningScore: 0,
          message: 'Chua thay nguon trung theo du lieu da nhap.',
        },
      });
    }
    if (path === '/properties' && method === 'GET') return ok(route, { items: filterByQuery(url, properties), total: properties.length });
    if (path === '/properties' && method === 'POST') return ok(route, { item: { ...properties[0], id: 'prop_new', code: 'SVP000003' } });
    if (/^\/properties\/[^/]+\/status$/.test(path) && method === 'PATCH') return ok(route, { message: 'Da cap nhat trang thai' });
    if (/^\/properties\/[^/]+\/media-upload$/.test(path) && method === 'POST') return ok(route, { item: { id: 'media_1', url: '/logo11.png' } });
    if (/^\/properties\/[^/]+\/comments$/.test(path) && method === 'GET') {
      return ok(route, { items: [{ id: 'comment_1', propertyId: 'prop_1', userId: `user_${role}`, authorName: 'Tai khoan kiem thu', body: 'Binh luan kiem thu can nha.', createdAt: '2026-07-02 09:00:00' }] });
    }
    if (/^\/properties\/[^/]+\/comments$/.test(path) && method === 'POST') {
      const body = request.postDataJSON?.() as { body?: string } | undefined;
      return ok(route, { item: { id: 'comment_new', propertyId: path.split('/')[2], userId: `user_${role}`, authorName: 'Tai khoan kiem thu', body: body?.body || 'Binh luan moi', createdAt: '2026-07-02 09:05:00' } });
    }
    if (/^\/properties\/[^/]+\/comments\/[^/]+$/.test(path) && method === 'DELETE') return ok(route, { deleted: true });
    if (/^\/properties\/[^/]+$/.test(path) && method === 'GET') {
      const id = path.split('/').pop();
      if (id === 'prop_missing') return ok(route, { item: null });
      return ok(route, { item: properties.find((item) => item.id === id) || properties[0] });
    }

    if (path === '/customers' && method === 'GET') return ok(route, { items: filterByQuery(url, customers), total: customers.length });
    if (path === '/customers' && method === 'POST') return ok(route, { item: { ...customers[0], id: 'cus_new' } });
    if (path === '/customer-needs' && method === 'POST') return ok(route, { item: { id: 'need_new' } });
    if (path === '/viewing-schedules') return ok(route, { items: schedules, total: schedules.length });
    if (path === '/favorites') return ok(route, { items: [properties[0]], total: 1 });
    if (/^\/favorites\/[^/]+$/.test(path) && method === 'DELETE') return ok(route, { deleted: true });
    if (path === '/referrals') return ok(route, { items: referrals, total: referrals.length });
    if (path === '/config') return ok(route, { groups: configGroups, items: configGroups });
    if (/^\/config\/options\/[^/]+$/.test(path) && method === 'PUT') {
      const id = decodeURIComponent(path.split('/').pop() || '');
      const body = request.postDataJSON?.() as { label?: string; value?: string; metadata?: unknown; isActive?: boolean } | undefined;
      return ok(route, {
        item: {
          id,
          key: body?.value || id,
          label: body?.label || 'Da cap nhat',
          value: body?.value || id,
          metadata: body?.metadata || null,
          isActive: body?.isActive !== false,
        },
      });
    }
    if (path === '/config/options/reorder' && method === 'POST') return ok(route, { items: [], total: 0 });
    if (/^\/config\/options\/[^/]+$/.test(path) && method === 'DELETE') return ok(route, { deleted: true });
    if (path === '/audit-logs') {
      return ok(route, {
        items: [
          { id: 'log_1', action: 'create', entityType: 'property', entityId: 'SVP000001', actorId: 'Admin', createdAt: '2026-06-29 10:00:00' },
          { id: 'log_2', action: 'approve', entityType: 'user_role', entityId: 'chuyen_gia', actorId: 'Admin', createdAt: '2026-06-29 10:05:00' },
        ],
      });
    }
    if (path === '/notifications') {
      return ok(route, {
        items: [{ id: 'notice_1', title: 'Thong bao noi bo', body: 'Noi dung kiem thu thong bao.', createdAt: '2026-06-30 09:00:00' }],
      });
    }

    return ok(route, { items: [], item: null });
  });
}

async function expectUsablePage(page: Page, testInfo: TestInfo, routeLabel: string) {
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByTestId('route-transition-overlay')).toHaveCSS('opacity', '0', { timeout: 5_000 });
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > width + 2;
    return {
      textLength: text.trim().length,
      badEncoding: /(\u00c3[\u00a0-\u00bf]|\u00c4[\u0080-\u00bf]|\u00c2[\u00a0\u00b7]|\u00e2[\u20ac\u201c\u201d\u2013\u2014]|\u00e1\u00ba|\u00e1\u00bb)/.exec(text)?.[0] || '',
      hasForbidden: /(GlobalForum|Global Forum|Roadmap|Audit log|Create Account|Sign In|AUTO-SMOKE|localStorage|database\/skeleton|KHU VUC NOI BO|st_[a-z_]+|Bản V1|Cập nhật vận hành|Thao tác nhanh trên điện thoại|Chuyên gia gửi nguồn nhà chờ duyệt|Các màn đăng nhập|Nguồn mới sau khi gửi|Mỗi tài khoản có mã)/.exec(text)?.[0] || '',
      overflow,
      title: document.title,
    };
  });

  expect(result.textLength, `${routeLabel} should have visible content`).toBeGreaterThan(30);
  expect(result.badEncoding, `${routeLabel} should not show mojibake`).toBe('');
  expect(result.hasForbidden, `${routeLabel} should not expose demo/dev text`).toBe('');
  expect(result.overflow, `${routeLabel} should not have horizontal overflow`).toBe(false);

  if (process.env.SVP_SAVE_SMOKE_SCREENSHOTS === '1') {
    await page.screenshot({
      path: testInfo.outputPath(`${routeLabel.replace(/[^a-z0-9_-]+/gi, '_')}.png`),
      fullPage: true,
    });
  }
}

test.describe('V1 public pages', () => {
  for (const path of publicRoutes) {
    test(`${path} is polished`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await installMocks(page, 'admin', false);
      await page.goto(path, { waitUntil: 'networkidle' });
      await expectUsablePage(page, testInfo, `public-${path}`);
      expect(errors).toEqual([]);
    });
  }

  test('news page exposes the full thổ cư article set', async ({ page }) => {
    await installMocks(page, 'admin', false);
    await page.goto('/tin-tuc', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('public-news-article')).toHaveCount(20);
    await expect(page.locator('body')).toContainText('Kiểm tra sổ đỏ trước khi đi xem nhà');
    await expect(page.locator('body')).toContainText('Dữ liệu minh bạch giúp giao dịch bớt rủi ro');
  });
});

test.describe('V1 role pages', () => {
  for (const group of roleRoutes) {
    for (const path of group.paths) {
      test(`${group.role} ${path} is usable`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        await installMocks(page, group.role);
        await page.goto(path, { waitUntil: 'networkidle' });
        await expectUsablePage(page, testInfo, `${group.role}-${path}`);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('V1 core workflows', () => {
  test('auth support and social entry points are actionable', async ({ page }, testInfo) => {
    await installMocks(page, 'admin', false);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('auth-brand-title')).toHaveText('Sổ Đỏ Vạn Phúc');
    await expect(page.getByTestId('auth-brand-slogan-line-1')).toHaveText('Hệ điều hành nghề Môi giới');
    await expect(page.getByTestId('auth-brand-slogan-line-2')).toHaveText('Thổ cư Việt Nam');
    await expect(page.getByTestId('auth-brand-title')).toHaveCSS('color', 'rgb(143, 0, 16)');
    const brandLinesFitViewport = await page.evaluate(() => {
      return ['auth-brand-title', 'auth-brand-slogan-line-1', 'auth-brand-slogan-line-2'].every((testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth && element.scrollWidth <= element.clientWidth + 1;
      });
    });
    expect(brandLinesFitViewport).toBe(true);
    const loginCardFitsViewport = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="auth-login-card"]');
      if (!(card instanceof HTMLElement)) return false;
      const cardRect = card.getBoundingClientRect();
      const children = Array.from(card.querySelectorAll('input, button, a'));
      return (
        document.documentElement.scrollWidth <= window.innerWidth + 1 &&
        cardRect.left >= 0 &&
        cardRect.right <= window.innerWidth &&
        children.every((child) => {
          if (!(child instanceof HTMLElement)) return true;
          const rect = child.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= window.innerWidth && child.scrollWidth <= child.clientWidth + 1;
        })
      );
    });
    expect(loginCardFitsViewport).toBe(true);

    await expect(page.getByTestId('social-login-google')).toHaveAttribute('data-configured', 'false');
    await expect(page.getByTestId('social-login-facebook')).toHaveAttribute('data-configured', 'false');
    await expect(page.getByTestId('social-login-apple')).toHaveAttribute('data-configured', 'false');
    await expect(page.getByTestId('social-login-zalo')).toHaveAttribute('data-configured', 'false');
    await page.getByTestId('social-login-google').click();
    await expect(page.getByTestId('social-login-notice')).toContainText(/Google/);

    await page.getByTestId('auth-support-toggle').click();
    const supportMenu = page.getByTestId('auth-support-menu');
    await expect(supportMenu).toBeVisible();
    await expect(supportMenu.getByRole('link', { name: /Goi hotline|Gọi hotline/i })).toHaveAttribute('href', 'tel:0912886794');
    await expect(supportMenu.getByRole('link', { name: /Nhan Zalo|Nhắn Zalo/i })).toHaveAttribute('href', 'https://zalo.me/0912886794');
    await expect(supportMenu.getByRole('link', { name: /Gui email|Gửi email/i })).toHaveAttribute('href', /mailto:info@hocvienvanphuc\.edu\.vn/);

    await expectUsablePage(page, testInfo, 'workflow-auth-support-social');
  });

  test('register roles use final customer copy before config finishes loading', async ({ page }) => {
    await page.route('**/api/svp/config', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return ok(route, { groups: configGroups, items: configGroups });
    });
    await page.route('**/api/svp/auth/oauth/providers', (route) => ok(route, {
      items: [
        { provider: 'google', label: 'Google', configured: false },
        { provider: 'facebook', label: 'Facebook', configured: false },
        { provider: 'apple', label: 'Apple', configured: false },
        { provider: 'zalo', label: 'Zalo', configured: false },
      ],
    }));

    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    const roleList = page.getByTestId('auth-role-list');
    await expect(page.getByTestId('auth-role-option-khach_mua')).toBeVisible();
    await expect(roleList).toContainText('Khách mua');
    await expect(roleList).toContainText('Cộng tác viên');
    await expect(roleList).not.toContainText(/Tôi cần mua nhà|Tôi cần bán nhà|Chuyên viên/);
  });

  test('public pages migrate old cached intro and news copy', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('svp_token');
      localStorage.removeItem('svp_active_role');
      localStorage.setItem('svp_config_groups', JSON.stringify([
        {
          id: 'public_pages',
          name: 'Trang gioi thieu / tin tuc',
          sortOrder: 8,
          isSystem: true,
          options: [
            {
              id: 'public_page_about',
              groupId: 'public_pages',
              label: 'Giới thiệu',
              value: 'about',
              metadata: {
                type: 'about',
                subtitle: 'Hệ thống vận hành nguồn nhà và khách hàng cho đội ngũ Sổ Đỏ Vạn Phúc.',
                body: 'Sổ Đỏ Vạn Phúc tập trung vào thao tác nhanh trên điện thoại, dữ liệu rõ ràng và quy trình làm việc minh bạch cho chủ nhà, khách mua, cộng tác viên, chuyên viên và chuyên gia.',
                imageUrl: '/logo11.png',
              },
              sortOrder: 10,
              isActive: true,
            },
            {
              id: 'public_news_v1',
              groupId: 'public_pages',
              label: 'Thao tác nhanh trên điện thoại',
              value: 'news_v1',
              metadata: { type: 'news', body: 'Các màn đăng nhập, đăng ký, đăng nhà và kho nhà được tinh gọn để người dùng xử lý việc chính với ít lần bấm hơn.' },
              sortOrder: 110,
              isActive: true,
            },
            {
              id: 'public_news_expert',
              groupId: 'public_pages',
              label: 'Chuyên gia gửi nguồn nhà chờ duyệt',
              value: 'news_expert',
              metadata: { type: 'news', body: 'Nguồn mới sau khi gửi sẽ nằm trong kho nhà riêng, kèm trạng thái để đội ngũ quản lý xem chi tiết và phê duyệt.' },
              sortOrder: 120,
              isActive: true,
            },
          ],
        },
      ]));
    });

    await page.goto('/tin-tuc', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Kết nối nhu cầu mua bán nhà rõ ràng hơn');
    await expect(page.locator('body')).not.toContainText(/Thao tác nhanh trên điện thoại|Chuyên gia gửi nguồn nhà chờ duyệt|Các màn đăng nhập|Nguồn mới sau khi gửi/);

    await page.goto('/gioi-thieu', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Hệ thống kết nối nguồn nhà, khách mua');
    await expect(page.locator('body')).not.toContainText(/chuyên viên và chuyên gia|Hệ thống vận hành nguồn nhà/);
  });

  test('auth login layout fits common phone widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Phone viewport matrix only runs in mobile project');
    await installMocks(page, 'admin', false);

    for (const width of [320, 360, 375, 390, 412, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.getByTestId('auth-brand-title')).toHaveCSS('color', 'rgb(143, 0, 16)');
      await expect(page.getByTestId('auth-brand-slogan-line-1')).toHaveText('Hệ điều hành nghề Môi giới');
      await expect(page.getByTestId('auth-brand-slogan-line-2')).toHaveText('Thổ cư Việt Nam');

      const layoutIsSafe = await page.evaluate(() => {
        const selectors = [
          '[data-testid="auth-brand-title"]',
          '[data-testid="auth-brand-slogan-line-1"]',
          '[data-testid="auth-brand-slogan-line-2"]',
          '[data-testid="auth-login-card"]',
          '[data-testid="social-login-google"]',
          '[data-testid="social-login-facebook"]',
          '[data-testid="social-login-apple"]',
          '[data-testid="social-login-zalo"]',
        ];

        return (
          document.documentElement.scrollWidth <= window.innerWidth + 1 &&
          selectors.every((selector) => {
            const element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) return false;
            const rect = element.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= window.innerWidth && element.scrollWidth <= element.clientWidth + 1;
          })
        );
      });
      expect(layoutIsSafe, `auth layout should not overflow at ${width}px`).toBe(true);
    }
  });

  test('mobile home shows login then registration without overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Phone viewport matrix only runs in mobile project');
    await installMocks(page, 'admin', false);

    for (const width of [320, 360, 375, 390, 412, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.getByTestId('auth-login-card')).toBeVisible();
      await expect(page.getByTestId('auth-register-card')).toBeVisible();

      const layoutIsSafe = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const loginCard = document.querySelector('[data-testid="auth-login-card"]');
        const registerCard = document.querySelector('[data-testid="auth-register-card"]');
        const roleOptions = Array.from(document.querySelectorAll('[data-testid^="auth-role-option-"]'));
        const roleChecks = Array.from(document.querySelectorAll('[data-testid^="auth-role-check-"]'));

        if (!(loginCard instanceof HTMLElement) || !(registerCard instanceof HTMLElement)) return false;
        if (roleOptions.length < 8 || roleChecks.length < 8) return false;

        const fitsViewport = (element: Element) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= viewportWidth + 1 && element.scrollWidth <= element.clientWidth + 1;
        };

        const fitsParent = (child: Element, parent: Element) => {
          if (!(child instanceof HTMLElement) || !(parent instanceof HTMLElement)) return false;
          const childRect = child.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          return childRect.left >= parentRect.left - 1 && childRect.right <= parentRect.right + 1;
        };

        return (
          document.documentElement.scrollWidth <= viewportWidth + 1 &&
          fitsViewport(loginCard) &&
          fitsViewport(registerCard) &&
          roleOptions.every((option) => fitsViewport(option) && fitsParent(option, registerCard)) &&
          roleChecks.every((check) => fitsViewport(check) && fitsParent(check, registerCard))
        );
      });
      expect(layoutIsSafe, `mobile auth/register should not overflow at ${width}px`).toBe(true);
    }
  });

  test('auth register role selection stays inside the phone viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Phone viewport matrix only runs in mobile project');
    await installMocks(page, 'admin', false);

    for (const width of [320, 360, 375, 390, 412, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/register', { waitUntil: 'networkidle' });
      await page.getByTestId('auth-role-option-khach_mua').click();
      await expect(page.getByTestId('auth-buyer-need-inline')).toBeVisible();

      const layoutIsSafe = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const registerCard = document.querySelector('[data-testid="auth-register-card"]');
        const roleList = document.querySelector('[data-testid="auth-role-list"]');
        const buyerNeed = document.querySelector('[data-testid="auth-buyer-need-inline"]');
        const roleOptions = Array.from(document.querySelectorAll('[data-testid^="auth-role-option-"]'));
        const roleChecks = Array.from(document.querySelectorAll('[data-testid^="auth-role-check-"]'));

        if (!(registerCard instanceof HTMLElement) || !(roleList instanceof HTMLElement) || !(buyerNeed instanceof HTMLElement)) return false;
        if (roleOptions.length < 8 || roleChecks.length < 8) return false;

        const fitsViewport = (element: Element) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          return (
            rect.left >= -1 &&
            rect.right <= viewportWidth + 1 &&
            element.scrollWidth <= element.clientWidth + 1
          );
        };

        const fitsParent = (child: Element, parent: Element) => {
          if (!(child instanceof HTMLElement) || !(parent instanceof HTMLElement)) return false;
          const childRect = child.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          return childRect.left >= parentRect.left - 1 && childRect.right <= parentRect.right + 1;
        };

        return (
          document.documentElement.scrollWidth <= viewportWidth + 1 &&
          fitsViewport(registerCard) &&
          fitsViewport(roleList) &&
          fitsViewport(buyerNeed) &&
          roleOptions.every((option) => fitsViewport(option) && fitsParent(option, registerCard)) &&
          roleChecks.every((check) => fitsViewport(check) && fitsParent(check, registerCard))
        );
      });

      expect(layoutIsSafe, `register role cards and checkmarks should not overflow at ${width}px`).toBe(true);
    }
  });

  test('admin user cards handle long live data on phone widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Phone viewport matrix only runs in mobile project');
    await installMocks(page, 'admin');

    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/quan-tri/nguoi-dung', { waitUntil: 'networkidle' });

      const cardsFit = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const cards = Array.from(document.querySelectorAll('[data-testid="admin-user-card"]'));
        const actions = Array.from(document.querySelectorAll('[data-testid="admin-user-lock"], [data-testid="admin-user-unlock"], [data-testid="admin-user-reset-password"]'));
        if (cards.length < 3 || actions.length < 3) return false;

        const fitsViewport = (element: Element) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= viewportWidth + 1 && element.scrollWidth <= element.clientWidth + 1;
        };

        const fitsParent = (child: Element) => {
          if (!(child instanceof HTMLElement) || !(child.parentElement instanceof HTMLElement)) return false;
          const childRect = child.getBoundingClientRect();
          const parentRect = child.parentElement.getBoundingClientRect();
          return childRect.left >= parentRect.left - 1 && childRect.right <= parentRect.right + 1;
        };

        return (
          document.documentElement.scrollWidth <= viewportWidth + 1 &&
          cards.every(fitsViewport) &&
          actions.every((action) => fitsViewport(action) && fitsParent(action))
        );
      });

      expect(cardsFit, `admin user cards and actions should not overflow at ${width}px`).toBe(true);
    }
  });

  test('public property detail contact CTAs are actionable', async ({ page }, testInfo) => {
    await installMocks(page, 'khach_mua', false);
    await page.goto('/nha/prop_1', { waitUntil: 'networkidle' });

    await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute('href', 'tel:0909000001');
    await expect(page.locator('a[href^="https://zalo.me/"]').first()).toHaveAttribute('href', /https:\/\/zalo\.me\/0909000001\?text=/);

    await expectUsablePage(page, testInfo, 'workflow-property-contact-cta');
  });

  test('missing property detail renders a polished empty state', async ({ page }, testInfo) => {
    await installMocks(page, 'khach_mua', false);
    await page.goto('/nha/prop_missing', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Không tìm thấy nguồn nhà/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quay lại/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tìm nhà phù hợp/i })).toBeVisible();
    await expectUsablePage(page, testInfo, 'workflow-property-missing-public');

    await installMocks(page, 'chuyen_gia', true);
    await page.goto('/chuyen-gia/nha/prop_missing', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Không tìm thấy nguồn nhà/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Kho riêng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Đăng nhà/i })).toBeVisible();
    await expectUsablePage(page, testInfo, 'workflow-property-missing-expert');
  });

  test('public navigation masks the previous screen immediately', async ({ page }) => {
    await installMocks(page, 'admin', false);
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /^Tin tức$/i }).first().click({ noWaitAfter: true });
    await page.waitForTimeout(20);

    const overlayState = await page.getByTestId('route-transition-overlay').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return { opacity: Number(style.opacity), width: rect.width, height: rect.height };
    });
    expect(overlayState.opacity, 'route transition overlay should cover the old screen immediately').toBeGreaterThanOrEqual(0.99);
    expect(overlayState.width).toBeGreaterThanOrEqual(320);
    expect(overlayState.height).toBeGreaterThanOrEqual(600);

    await expect(page.getByRole('heading', { name: /Kiến thức bất động sản thổ cư|Tin tức Sổ Đỏ Vạn Phúc/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('route-transition-overlay')).toHaveCSS('opacity', '0', { timeout: 5_000 });
  });

  test('login routes to the active role dashboard', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_gia', false);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#identifier').fill('chuyen_gia@sodovanphuc.vn');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForURL(/\/select-role$/);
    await expect(page.getByRole('heading', { name: /Chọn vai trò sử dụng|Ch.n vai tr. s. d.ng/i })).toBeVisible();
    await page.getByRole('button', { name: /Chuyên gia|Chuy.n gia/i }).click();
    await page.waitForURL(/\/chuyen-gia$/);
    await expectUsablePage(page, testInfo, 'workflow-login');
  });

  test('admin-only account can select every role for QA', async ({ page }, testInfo) => {
    await installMocks(page, 'admin', true, ['admin']);
    await page.goto('/select-role', { waitUntil: 'networkidle' });

    for (const slug of ADMIN_IMPERSONATION_ROLE_SLUGS) {
      await expect(page.getByTestId(`select-role-card-${slug}`), `Missing admin QA role card: ${slug}`).toBeVisible();
    }

    for (const slug of ADMIN_IMPERSONATION_ROLE_SLUGS) {
      await page.getByTestId(`select-role-card-${slug}`).click();
      await page.waitForURL((url) => url.pathname === ROLE_DASHBOARD_PATHS[slug]);
      await expect.poll(() => page.evaluate(() => localStorage.getItem('svp_active_role'))).toBe(slug);
      await page.goto('/select-role', { waitUntil: 'networkidle' });
    }

    await expectUsablePage(page, testInfo, 'workflow-admin-role-impersonation');
  });

  test('expert can use AI description and submit a property', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_gia');
    await page.goto('/chuyen-gia/dang-nha', { waitUntil: 'networkidle' });
    await expect(page.locator('form, body')).toContainText(/Chuyên gia đăng nhà|Tạo nguồn nhà|Thông tin chủ/i);

    await page.getByLabel(/Tên chủ nhà/i).fill('Chu nha QA');
    await page.getByLabel(/SĐT chủ nhà/i).fill('0909000000');
    await page.getByLabel(/Tỉnh\/Thành phố/i).fill('TP.HCM');
    await page.getByLabel(/Quận\/Huyện/i).fill('Bình Tân');
    await page.getByLabel(/Phường\/Xã/i).click();
    await expect(page.getByRole('button', { name: 'Bình Hưng Hòa A' })).toBeVisible();
    await page.getByRole('button', { name: 'Bình Hưng Hòa A' }).click();
    await page.getByLabel(/^Số nhà$/i).fill('135.48.20');
    await page.getByLabel(/Tên đường/i).click();
    await expect(page.getByRole('button', { name: 'Gò Xoài' })).toBeVisible();
    await page.getByRole('button', { name: 'Gò Xoài' }).click();
    await page.getByLabel(/Seri|mã sổ/i).fill('SO-QA-001');
    await page.getByLabel(/Số tờ/i).fill('15');
    await page.getByLabel(/Thửa đất/i).fill('795');
    await page.getByRole('textbox', { name: /^Giá chào/i }).fill('6800000000');
    await page.getByLabel(/Diện tích/i).fill('72');
    await page.getByLabel(/Số tầng/i).fill('4');
    await page.getByLabel(/Chiều ngang/i).fill('4');
    await page.getByLabel(/Chiều dài/i).fill('18');
    await page.getByRole('textbox', { name: /^Hoa hồng/i }).fill('2%');
    await page.getByLabel(/^Nguồn$/i).fill('Chủ gửi');
    await page.getByLabel(/Công ty thành viên/i).selectOption({ index: 1 });
    await page.locator('textarea:visible').last().fill('Da ra trung, nguon QA co ghi chu xu ly ro rang.');

    await page.getByRole('button', { name: 'Quản lý/Admin' }).click();
    await page.getByRole('button', { name: 'Công khai cho khách mua' }).click();
    await page.getByRole('button', { name: 'Ô tô' }).click();
    await page.getByRole('button', { name: 'Đầu tư' }).click();

    const checkboxes = page.getByRole('checkbox');
    for (let i = 0; i < await checkboxes.count(); i += 1) {
      await checkboxes.nth(i).check();
    }
    await page.getByRole('button', { name: /Kiểm tra trùng/i }).click();
    await page.getByRole('button', { name: /^AI viết$/ }).click();
    await expect(page.locator('textarea:visible').first()).toHaveValue(/Mo ta AI/);
    await page.getByRole('button', { name: /Đăng nhà|lên bài|Gửi duyệt/i }).click();
    await page.waitForURL(/\/chuyen-gia\/kho-nha-rieng$/);
    await expectUsablePage(page, testInfo, 'workflow-expert-property');
  });

  test('specialist can create a buyer profile', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_vien');
    await page.goto('/chuyen-vien/them-khach', { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/Ho ten|H. t.n/i).fill('Khach QA moi');
    await page.getByPlaceholder(/So dien thoai|S. .i.n tho.i/i).fill('0911222333');
    await page.getByPlaceholder('Email').fill('khachqa@sodovanphuc.vn');
    await page.getByRole('button', { name: /^Luu|^L.u/i }).click();
    await page.waitForURL(/\/chuyen-vien\/khach-hang$/);
    await expectUsablePage(page, testInfo, 'workflow-specialist-customer');
  });

  test('profile supports password and role request flows', async ({ page }, testInfo) => {
    await installMocks(page, 'admin');
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Doi mat khau|.i m.t kh.u/i }).click();
    await page.locator('input[type="password"]').nth(0).fill('123456');
    await page.locator('input[type="password"]').nth(1).fill('654321');
    await page.locator('input[type="password"]').nth(2).fill('654321');
    await page.getByRole('button', { name: /Xac nhan|X.c nh.n/i }).click();
    await expect(page.locator('body')).toContainText(/thanh cong|th.nh c.ng/i);
    await expectUsablePage(page, testInfo, 'workflow-profile');
  });

  test('admin can configure account approval and property field labels', async ({ page }, testInfo) => {
    await installMocks(page, 'admin');
    await page.goto('/quan-tri/cau-hinh', { waitUntil: 'networkidle' });

    const specialistCard = page
      .getByText('Cong tac vien', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
    await specialistCard.getByRole('button', { name: /Dung ngay|D.ng ngay/i }).click();
    await expect(specialistCard).toContainText(/Dang cho dung ngay|.ang cho d.ng ngay/i);

    await page.getByRole('button', { name: /Ten truong nhap lieu nha|T.n tr..ng nh.p li.u nh./i }).click();
    const ownerNameRow = page
      .getByText('Ten chu nha', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
    await ownerNameRow.getByRole('button', { name: /Sua|S.a/i }).click();
    await page.locator('input[value="Ten chu nha"]').fill('Nguoi ban/chu nha');
    await page.getByRole('button', { name: /^Luu|^L.u/i }).click();
    await expect(page.locator('body')).toContainText(/Nguoi ban\/chu nha/i);

    await expectUsablePage(page, testInfo, 'workflow-admin-config');
  });

  test('admin utility actions are wired to real endpoints', async ({ page }, testInfo) => {
    page.on('dialog', (dialog) => dialog.accept());
    await installMocks(page, 'admin');

    await page.goto('/quan-tri/nguoi-dung', { waitUntil: 'networkidle' });
    await page.getByTestId('admin-user-reset-password').first().click();
    await expect(page.locator('body')).toContainText('SVP@TEMP123');
    await page.getByTestId('admin-user-lock').first().click();
    await expect(page.locator('body')).toContainText(/Da tam khoa|Đã tạm khóa/i);
    await page.getByTestId('admin-user-unlock').first().click();
    await expect(page.locator('body')).toContainText(/Da mo khoa|Đã mở khóa/i);
    await expectUsablePage(page, testInfo, 'workflow-admin-users-utilities');

    await page.goto('/quan-tri/nha', { waitUntil: 'networkidle' });
    await page.getByTestId('admin-property-status-st_hidden').first().click();
    await expect(page.locator('body')).toContainText(/Đã cập nhật trạng thái|Da cap nhat trang thai/i);
    await page.getByTestId('admin-property-status-st_active').first().click();
    await expect(page.locator('body')).toContainText(/Đã cập nhật trạng thái|Da cap nhat trang thai/i);
    await page.getByRole('link', { name: /^(Xem|Chi tiết)$/ }).first().click();
    await page.waitForURL(/\/(nha|chuyen-gia\/nha)\/prop_1$/);
    await expectUsablePage(page, testInfo, 'workflow-admin-property-detail');
    await page.goto('/quan-tri/nha', { waitUntil: 'networkidle' });
    await expectUsablePage(page, testInfo, 'workflow-admin-property-utilities');

    await page.goto('/quan-tri/cau-hinh', { waitUntil: 'networkidle' });
    await page.getByTestId('admin-notice-title').fill('Thong bao QA');
    await page.getByTestId('admin-notice-body').fill('Noi dung thong bao kiem thu.');
    await page.getByTestId('admin-notice-publish').click();
    await expect(page.locator('body')).toContainText(/Thong bao QA|Thông báo QA/i);
    await expectUsablePage(page, testInfo, 'workflow-admin-notice-publish');

    await page.goto('/notifications', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(/Thong bao noi bo|Thông báo nội bộ/i);
    await expectUsablePage(page, testInfo, 'workflow-notifications');
  });

  test('property comments can be added and removed by authenticated users', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_gia');
    await page.goto('/nha/prop_1', { waitUntil: 'networkidle' });
    await page.getByPlaceholder(/Nhập bình luận|Nhap binh luan/i).fill('Binh luan QA sau khi dang nhap.');
    await page.getByRole('button', { name: /Gửi bình luận|Gui binh luan/i }).click();
    await expect(page.locator('body')).toContainText(/Binh luan QA sau khi dang nhap/i);
    await page.getByRole('button', { name: /Xóa bình luận|Xoa binh luan/i }).first().click();
    await expectUsablePage(page, testInfo, 'workflow-property-comments');
  });
});
