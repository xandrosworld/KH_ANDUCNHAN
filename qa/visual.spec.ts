import { expect, test, type Page, type Route, type TestInfo } from '@playwright/test';

const ROLE_SLUGS = [
  'admin',
  'giam_doc',
  'truong_phong',
  'chuyen_gia',
  'chuyen_vien',
  'ctv_khach',
  'ctv_nguon',
  'chu_nha',
  'khach_mua',
  'nguoi_gioi_thieu',
  'doi_tac',
];

const ROLE_NAMES: Record<string, string> = {
  admin: 'Quan tri vien',
  giam_doc: 'Giam doc khu vuc',
  truong_phong: 'Truong phong',
  chuyen_gia: 'Chuyen gia',
  chuyen_vien: 'Chuyen vien',
  ctv_khach: 'CTV tim khach',
  ctv_nguon: 'CTV tim nguon',
  chu_nha: 'Chu nha',
  khach_mua: 'Khach mua',
  nguoi_gioi_thieu: 'Nguoi gioi thieu',
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
    district: 'Ha Dong',
    ward: 'Van Phuc',
    address: 'Van Phuc, Ha Dong, Ha Noi',
    statusId: 'st_active',
    createdAt: '2026-06-29 08:00:00',
    createdBy: 'user_chuyen_gia',
    expertId: 'user_chuyen_gia',
    extra: {
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
    district: 'Thanh Xuan',
    ward: 'Khuong Trung',
    address: 'Thanh Xuan, Ha Noi',
    statusId: 'st_new',
    createdAt: '2026-06-28 09:00:00',
    createdBy: 'user_chu_nha',
    extra: { propertyType: 'Can ho', bedrooms: '2', bathrooms: '2' },
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
  { id: 'role_approval_nguoi_gioi_thieu', slug: 'nguoi_gioi_thieu', label: 'Nguoi gioi thieu', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 30 },
  { id: 'role_approval_ctv_khach', slug: 'ctv_khach', label: 'CTV gioi thieu khach', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 40 },
  { id: 'role_approval_ctv_nguon', slug: 'ctv_nguon', label: 'CTV gioi thieu nguon', roleGroup: 'Co ban', requiresApproval: false, sortOrder: 50 },
  { id: 'role_approval_chuyen_vien', slug: 'chuyen_vien', label: 'Chuyen vien', roleGroup: 'Nhan su', requiresApproval: true, sortOrder: 110 },
  { id: 'role_approval_chuyen_gia', slug: 'chuyen_gia', label: 'Chuyen gia', roleGroup: 'Nhan su', requiresApproval: true, sortOrder: 120 },
  { id: 'role_approval_truong_phong', slug: 'truong_phong', label: 'Truong phong', roleGroup: 'Quan ly', requiresApproval: true, sortOrder: 210 },
  { id: 'role_approval_giam_doc', slug: 'giam_doc', label: 'Giam doc khu vuc', roleGroup: 'Quan ly', requiresApproval: true, sortOrder: 250 },
];

const publicRoutes = [
  '/',
  '/register',
  '/forgot-password',
  '/reset-password?token=qa-token&email=qa@sodovanphuc.vn',
  '/pending-approval',
];

const roleRoutes = [
  { role: 'admin', paths: ['/quan-tri', '/quan-tri/nguoi-dung', '/quan-tri/duyet-vai-tro', '/quan-tri/nha', '/quan-tri/khach-hang', '/quan-tri/cau-hinh', '/quan-tri/nhat-ky', '/profile', '/notifications'] },
  { role: 'chu_nha', paths: ['/chu-nha', '/chu-nha/gui-ban', '/chu-nha/nha-cua-toi', '/profile', '/notifications'] },
  { role: 'khach_mua', paths: ['/khach-mua', '/khach-mua/tim-nha', '/khach-mua/yeu-thich', '/nha/prop_1', '/profile', '/notifications'] },
  { role: 'chuyen_gia', paths: ['/chuyen-gia', '/chuyen-gia/dang-nha', '/chuyen-gia/kho-nha', '/chuyen-gia/nha/prop_1', '/profile', '/notifications'] },
  { role: 'chuyen_vien', paths: ['/chuyen-vien', '/chuyen-vien/khach-hang', '/chuyen-vien/them-khach', '/chuyen-vien/tim-nha', '/chuyen-vien/lich-xem', '/profile'] },
  { role: 'ctv_khach', paths: ['/ctv', '/ctv/cong-viec', '/profile', '/notifications'] },
  { role: 'nguoi_gioi_thieu', paths: ['/gioi-thieu', '/gioi-thieu/ma-gioi-thieu', '/profile', '/notifications'] },
];

function userFor(role: string) {
  return {
    id: `user_${role}`,
    svpId: 'SVP000999',
    email: `${role}@sodovanphuc.vn`,
    phone: '0909000999',
    fullName: 'Tai khoan kiem thu',
    avatar: '/logo11.png',
    referralCode: 'SVP-2026-0001',
    activeRole: role,
    roles: ROLE_SLUGS.map((slug) => ({ slug, name: ROLE_NAMES[slug], status: 'approved' })),
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

async function installMocks(page: Page, role = 'admin', authenticated = true) {
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

    if (path === '/auth/me') return ok(route, { user: userFor(role) });
    if (path === '/auth/login' && method === 'POST') return ok(route, { token: 'qa-token', user: userFor(role) });
    if (path === '/auth/register' && method === 'POST') return ok(route, { message: 'Da gui yeu cau dang ky' });
    if (path === '/auth/forgot-password' && method === 'POST') return ok(route, { message: 'Da gui email dat lai mat khau' });
    if (path === '/auth/reset-password' && method === 'POST') return ok(route, { message: 'Da dat lai mat khau' });
    if ((path === '/auth/avatar' || path === '/auth/upload-avatar') && method === 'POST') return ok(route, { avatar: '/logo11.png' });
    if (path === '/auth/change-password' && method === 'POST') return ok(route, { message: 'Da doi mat khau' });
    if (path === '/auth/register-role' && method === 'POST') return ok(route, { message: 'Da gui yeu cau vai tro' });

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
    if (path === '/admin/users') return ok(route, { items: [userFor('admin'), userFor('chuyen_gia'), userFor('chuyen_vien')] });
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

    if (path === '/properties/check-duplicate' && method === 'POST') return ok(route, { matches: [properties[0]] });
    if (path === '/properties' && method === 'GET') return ok(route, { items: filterByQuery(url, properties), total: properties.length });
    if (path === '/properties' && method === 'POST') return ok(route, { item: { ...properties[0], id: 'prop_new', code: 'SVP000003' } });
    if (/^\/properties\/[^/]+\/media-upload$/.test(path) && method === 'POST') return ok(route, { item: { id: 'media_1', url: '/logo11.png' } });
    if (/^\/properties\/[^/]+$/.test(path) && method === 'GET') {
      const id = path.split('/').pop();
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
    if (path === '/audit-logs') {
      return ok(route, {
        items: [
          { id: 'log_1', action: 'create', entityType: 'property', entityId: 'SVP000001', actorId: 'Admin', createdAt: '2026-06-29 10:00:00' },
          { id: 'log_2', action: 'approve', entityType: 'user_role', entityId: 'chuyen_gia', actorId: 'Admin', createdAt: '2026-06-29 10:05:00' },
        ],
      });
    }

    return ok(route, { items: [], item: null });
  });
}

async function expectUsablePage(page: Page, testInfo: TestInfo, routeLabel: string) {
  await expect(page.locator('#root')).not.toBeEmpty();
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > width + 2;
    return {
      textLength: text.trim().length,
      badEncoding: /(\u00c3.|\u00c4.|\u00c2[\u00a0\u00b7]|\u00e2[\u20ac\u201c\u201d\u2013\u2014]|\u00e1\u00ba|\u00e1\u00bb)/.exec(text)?.[0] || '',
      hasForbidden: /(GlobalForum|Global Forum|Roadmap|Audit log|Create Account|Sign In|AUTO-SMOKE|localStorage|database\/skeleton|KHU VUC NOI BO|st_[a-z_]+)/.exec(text)?.[0] || '',
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
    const brandLinesFitViewport = await page.evaluate(() => {
      return ['auth-brand-title', 'auth-brand-slogan-line-1', 'auth-brand-slogan-line-2'].every((testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth;
      });
    });
    expect(brandLinesFitViewport).toBe(true);

    await expect(page.getByTestId('social-login-google')).toHaveAttribute('href', 'https://accounts.google.com/');
    await expect(page.getByTestId('social-login-facebook')).toHaveAttribute('href', 'https://www.facebook.com/login/');
    await expect(page.getByTestId('social-login-apple')).toHaveAttribute('href', 'https://appleid.apple.com/');
    await expect(page.getByTestId('social-login-zalo')).toHaveAttribute('href', 'https://id.zalo.me/account');
    await expect(page.getByTestId('social-login-zalo')).toHaveAttribute('target', '_blank');

    await page.getByTestId('auth-support-toggle').click();
    const supportMenu = page.getByTestId('auth-support-menu');
    await expect(supportMenu).toBeVisible();
    await expect(supportMenu.getByRole('link', { name: /Goi hotline|Gọi hotline/i })).toHaveAttribute('href', 'tel:0912886794');
    await expect(supportMenu.getByRole('link', { name: /Nhan Zalo|Nhắn Zalo/i })).toHaveAttribute('href', 'https://zalo.me/0912886794');
    await expect(supportMenu.getByRole('link', { name: /Gui email|Gửi email/i })).toHaveAttribute('href', /mailto:contact@sodovanphuc\.vn/);

    await expectUsablePage(page, testInfo, 'workflow-auth-support-social');
  });

  test('public property detail contact CTAs are actionable', async ({ page }, testInfo) => {
    await installMocks(page, 'khach_mua', false);
    await page.goto('/nha/prop_1', { waitUntil: 'networkidle' });

    await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute('href', 'tel:0909000001');
    await expect(page.locator('a[href^="https://zalo.me/"]').first()).toHaveAttribute('href', /https:\/\/zalo\.me\/0909000001\?text=/);

    await expectUsablePage(page, testInfo, 'workflow-property-contact-cta');
  });

  test('login routes to the active role dashboard', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_gia', false);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#identifier').fill('chuyen_gia@sodovanphuc.vn');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForURL(/\/chuyen-gia$/);
    await expectUsablePage(page, testInfo, 'workflow-login');
  });

  test('expert can use AI description and submit a property', async ({ page }, testInfo) => {
    await installMocks(page, 'chuyen_gia');
    await page.goto('/chuyen-gia/dang-nha', { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/Ten chu nha|T.n ch./i).fill('Chu nha QA');
    await page.getByPlaceholder(/SDT chu nha|S.T ch./i).fill('0909000000');
    await page.getByRole('button', { name: /Tiep theo|Ti.p theo/i }).click();

    await page.getByPlaceholder(/Tieu de|Ti.u/i).fill('Nha QA dang bang Playwright');
    await page.getByPlaceholder(/So nha|S. nh./i).fill('12 Van Phuc');
    await page.getByPlaceholder(/Quan|Qu.n/i).fill('Ha Dong');
    await page.getByPlaceholder(/Dien tich|Di.n t.ch/i).fill('72');
    await page.getByRole('button', { name: /Tiep theo|Ti.p theo/i }).click();

    await page.getByPlaceholder(/So to|S. t./i).fill('SO-QA-001');
    await page.getByPlaceholder(/Gia|Gi./i).fill('6800000000');
    await page.locator('textarea').nth(1).fill('Đã rà trùng, nguồn QA có ghi chú xử lý rõ ràng.');
    await page.getByRole('button', { name: /Tiep theo|Ti.p theo/i }).click();
    await page.getByRole('button', { name: /Tiep theo|Ti.p theo/i }).click();

    await page.getByRole('button', { name: /Kiem tra trung|Ki.m tra tr.ng|Kiểm tra trùng/i }).click();
    const checkboxes = page.getByRole('checkbox');
    for (let i = 0; i < await checkboxes.count(); i += 1) {
      await checkboxes.nth(i).check();
    }
    await page.getByRole('button', { name: /AI/i }).click();
    await expect(page.locator('textarea').last()).toHaveValue(/Mo ta AI/);
    await page.getByRole('button', { name: /Gui duyet|G.i duy.t/i }).click();
    await page.waitForURL(/\/chuyen-gia\/kho-nha$/);
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
      .getByText('Chuyen vien', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
    await specialistCard.getByRole('button', { name: /Dung ngay|D.ng ngay/i }).click();
    await expect(specialistCard).toContainText(/Dang cho dung ngay|.ang cho d.ng ngay/i);

    await page.getByRole('button', { name: /Ten truong nhap lieu nha|T.n tr..ng nh.p li.u nh./i }).click();
    const ownerNameRow = page
      .getByText('Ten chu nha', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"border-b")][1]');
    await ownerNameRow.getByRole('button', { name: /Sua|S.a/i }).click();
    await page.getByRole('textbox').fill('Nguoi ban/chu nha');
    await page.getByRole('button', { name: /^Luu|^L.u/i }).click();
    await expect(page.locator('body')).toContainText(/Nguoi ban\/chu nha/i);

    await expectUsablePage(page, testInfo, 'workflow-admin-config');
  });
});
