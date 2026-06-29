import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const BASE_URL = (process.env.SVP_LIVE_BASE_URL || 'https://sodovanphuc.vn').replace(/\/+$/, '');
const ADMIN_USERNAME = process.env.SVP_LIVE_ADMIN_USERNAME || 'codex-admin@sodovanphuc.vn';
const ADMIN_PASSWORD = process.env.SVP_LIVE_ADMIN_PASSWORD || '';
const RUN_ID = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '');
const RUN_TAG = `v1-${RUN_ID.toLowerCase()}`;
const REPORT_DIR = join(process.cwd(), 'qa', 'live-v1-role-flow', RUN_ID);
const PASSWORD_SEED = Math.random().toString(36).slice(2, 8);

const steps = [];
const accounts = [];
const dataIds = {
  properties: [],
  media: [],
  customers: [],
  needs: [],
  schedules: [],
  referrals: [],
  favorites: [],
  approvedApplications: [],
};

function nowIso() {
  return new Date().toISOString();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function record(name, detail = {}) {
  steps.push({ status: 'PASS', name, detail, at: nowIso() });
  console.log(`[PASS] ${name}`);
}

function fail(name, error) {
  const message = error instanceof Error ? error.message : String(error);
  steps.push({ status: 'FAIL', name, detail: { message }, at: nowIso() });
  console.error(`[FAIL] ${name}: ${message}`);
}

function publicAccount(label, roleSlugs) {
  const primaryRole = roleSlugs[0];
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tail = `${RUN_ID.slice(-8)}${String(accounts.length + 1).padStart(2, '0')}`;
  return {
    label,
    roleSlugs,
    email: `${safeLabel}.${RUN_TAG}@sodovanphuc.vn`,
    phone: `09${tail}`.slice(0, 10),
    password: `Svp@${RUN_ID.slice(-6)}${PASSWORD_SEED}!`,
    fullName: `${label} Vạn Phúc`,
    primaryRole,
  };
}

async function api(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    formData,
    expected = [200],
  } = options;

  const headers = {};
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    payload = JSON.stringify(body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
  });
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${method} ${path} returned non-JSON HTTP ${response.status}: ${text.slice(0, 180)}`);
  }

  if (!expected.includes(response.status)) {
    const message = json.error || json.data?.error || json.data?.message || text.slice(0, 220);
    throw new Error(`${method} ${path} returned HTTP ${response.status}: ${message}`);
  }
  if (json.ok === false) {
    throw new Error(`${method} ${path} returned ok=false: ${json.error || 'unknown error'}`);
  }
  return json.data ?? json;
}

async function login(email, password, expected = [200]) {
  const payload = await api('/api/svp/auth/login', {
    method: 'POST',
    body: { identifier: email, email, password },
    expected,
  });
  return payload;
}

async function register(account) {
  const payload = await api('/api/svp/auth/register', {
    method: 'POST',
    expected: [201],
    body: {
      fullName: account.fullName,
      full_name: account.fullName,
      email: account.email,
      phone: account.phone,
      password: account.password,
      role_slugs: account.roleSlugs,
    },
  });
  const user = payload.user || {};
  account.userId = user.id;
  account.svpId = user.svpId;
  account.referralCode = user.referralCode;
  account.registered = true;
  account.accountStatus = payload.accountStatus || '';
  accounts.push(account);
  return payload;
}

async function changePassword(account) {
  const nextPassword = `${account.password}2`;
  await api('/api/svp/auth/change-password', {
    method: 'POST',
    token: account.token,
    body: { current_password: account.password, new_password: nextPassword },
  });
  account.password = nextPassword;
  const relogin = await login(account.email, account.password);
  account.token = relogin.token;
}

async function uploadAvatar(account) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.append('avatar', new Blob([png], { type: 'image/png' }), 'avatar.png');
  const payload = await api('/api/svp/auth/avatar', {
    method: 'POST',
    token: account.token,
    formData: form,
  });
  assert(payload.avatar, 'Avatar upload did not return avatar URL');
  account.avatar = payload.avatar;
}

async function ensureApprovalRule(adminToken, slug, shouldRequireApproval) {
  const settings = await api('/api/svp/admin/role-approval-settings', { token: adminToken });
  const item = (settings.items || []).find((candidate) => candidate.slug === slug);
  assert(item, `Missing role approval setting for ${slug}`);
  if (Boolean(item.requiresApproval) !== shouldRequireApproval) {
    await api(`/api/svp/admin/role-approval-settings/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      token: adminToken,
      body: { requiresApproval: shouldRequireApproval },
    });
  }
}

async function approvePendingRoles(adminToken, targets) {
  const pending = await api('/api/svp/admin/role-applications?status=pending', { token: adminToken });
  const apps = pending.items || [];
  for (const target of targets) {
    for (const roleSlug of target.roleSlugs.filter((slug) => ['chuyen_vien', 'chuyen_gia'].includes(slug))) {
      const app = apps.find((item) => item.userEmail === target.email && item.roleSlug === roleSlug);
      assert(app, `Missing pending application for ${target.email} / ${roleSlug}`);
      await api(`/api/svp/admin/role-applications/${encodeURIComponent(String(app.id))}`, {
        method: 'PATCH',
        token: adminToken,
        body: { status: 'approved', adminNotes: `Đã duyệt trong kiểm thử V1 ${RUN_ID}` },
      });
      dataIds.approvedApplications.push(String(app.id));
    }
  }
}

async function createProperty(token, ownerAccount, expertAccount, suffix) {
  const payload = await api('/api/svp/properties', {
    method: 'POST',
    token,
    expected: [201],
    body: {
      title: `Nhà phố Vạn Phúc ${suffix} - pháp lý rõ`,
      description: 'Nguồn nhà mẫu đã kiểm tra quy trình V1: có pháp lý, vị trí, giá, tag, timeline và dữ liệu AI-ready.',
      ownerName: ownerAccount.fullName,
      ownerPhone: ownerAccount.phone,
      bookSerial: `SO-${RUN_ID.slice(-6)}-${suffix}`,
      price: suffix === 'A' ? 6850000000 : 9250000000,
      priceUnit: 'VND',
      areaM2: suffix === 'A' ? 72 : 96,
      district: suffix === 'A' ? 'Hà Đông' : 'Bình Thạnh',
      ward: suffix === 'A' ? 'Vạn Phúc' : 'Phường 25',
      address: suffix === 'A' ? 'Khu lụa Vạn Phúc, Hà Đông' : 'Đường D5, Bình Thạnh',
      hiddenAddress: suffix === 'A' ? 'Số nhà chỉ mở cho nhân sự được phân quyền' : 'Địa chỉ chi tiết chỉ mở khi đủ quyền',
      statusId: 'st_active',
      expertId: expertAccount.userId || '',
      assignedUserId: '',
      signingScore: suffix === 'A' ? 86 : 78,
      visibilityIds: ['manager', 'expert', 'specialist'],
      tagIds: suffix === 'A' ? ['oto', 'mat_tien', 'chinh_chu'] : ['dong_tien', 'gan_trung_tam'],
      extra: {
        propertyType: suffix === 'A' ? 'Nhà phố' : 'Nhà dòng tiền',
        bedrooms: suffix === 'A' ? '4' : '6',
        bathrooms: suffix === 'A' ? '3' : '5',
        floors: suffix === 'A' ? '4' : '5',
        direction: suffix === 'A' ? 'Đông Nam' : 'Tây Nam',
        gpsCoordinates: suffix === 'A' ? '20.9804,105.7811' : '10.8050,106.7141',
        bookSheet: `T-${RUN_ID.slice(-4)}${suffix}`,
        bookParcel: `TH-${RUN_ID.slice(-4)}${suffix}`,
        planningStatus: 'Đã hỏi quy hoạch, chưa ghi nhận vướng mắc',
        commission: suffix === 'A' ? '2%' : '1.8%',
        commissionNote: 'Hoa hồng ghi nhận theo thỏa thuận nội bộ',
        ownerEmail: ownerAccount.email,
        contractStatus: 'Đã ký phiếu thông tin',
        duplicateCheckNote: 'Không phát hiện nguồn trùng trong kiểm thử V1',
        internalNote: `Dữ liệu mẫu đẹp cho bàn giao V1 ${RUN_ID}`,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        verificationChecklist: {
          ownerConfirmed: true,
          duplicateChecked: true,
          legalChecked: true,
          planningChecked: true,
          commissionConfirmed: true,
          readyToDistribute: true,
        },
      },
    },
  });
  const property = payload.item;
  assert(property?.id, 'Property create did not return item id');
  dataIds.properties.push(property.id);
  return property;
}

async function uploadPropertyMedia(token, propertyId) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9Qz0AEYBxVSFIAADv0BwrH2l3vAAAAAElFTkSuQmCC',
    'base64',
  );
  const form = new FormData();
  form.append('caption', 'Ảnh mặt tiền mẫu');
  form.append('category', 'property_image');
  form.append('images[]', new Blob([png], { type: 'image/png' }), 'mat-tien-mau.png');
  const payload = await api(`/api/svp/properties/${encodeURIComponent(propertyId)}/media-upload`, {
    method: 'POST',
    token,
    formData: form,
    expected: [201],
  });
  const items = payload.items || [];
  assert(items.length > 0, 'Property media upload returned no items');
  dataIds.media.push(...items.map((item) => item.id));
  return items;
}

async function createCustomerFlow(token, specialistAccount, property) {
  const customerPayload = await api('/api/svp/customers', {
    method: 'POST',
    token,
    expected: [201],
    body: {
      fullName: `Khách mua thật V1 ${RUN_ID.slice(-4)}`,
      phone: `091${RUN_ID.slice(-7)}`.slice(0, 10),
      email: `khachmua.${RUN_TAG}@sodovanphuc.vn`,
      source: 'Zalo',
      statusId: 'cs_new',
      assignedUserId: specialistAccount.userId || '',
      note: 'Cần nhà dưới 7 tỷ, ô tô vào, ưu tiên khu vực Vạn Phúc.',
    },
  });
  const customer = customerPayload.item;
  dataIds.customers.push(customer.id);

  const needPayload = await api('/api/svp/customer-needs', {
    method: 'POST',
    token,
    expected: [201],
    body: {
      customerId: customer.id,
      districtIds: ['ha_dong', 'thanh_xuan'],
      budgetMin: 5000000000,
      budgetMax: 7000000000,
      areaMin: 55,
      areaMax: 90,
      tagIds: ['oto', 'gan_metro', 'co_the_mo_spa'],
      description: 'Tìm nhà dưới 7 tỷ, gần metro, ô tô ngủ trong nhà, có thể mở spa.',
      statusId: 'new',
    },
  });
  dataIds.needs.push(needPayload.item.id);

  const schedulePayload = await api('/api/svp/viewing-schedules', {
    method: 'POST',
    token,
    expected: [201],
    body: {
      customerId: customer.id,
      propertyId: property.id,
      scheduledAt: '2026-07-01 09:30:00',
      status: 'confirmed',
      note: 'Hẹn khách tại văn phòng trước khi đi xem nhà.',
    },
  });
  dataIds.schedules.push(schedulePayload.item.id);
  return { customer, need: needPayload.item, schedule: schedulePayload.item };
}

async function createReferral(token, referrerAccount, referredAccount) {
  const payload = await api('/api/svp/referrals', {
    method: 'POST',
    token,
    expected: [201],
    body: {
      referrerUserId: referrerAccount.userId || '',
      referredUserId: referredAccount.userId || '',
      referralCode: referrerAccount.referralCode || `REF-${RUN_ID}`,
      referralType: 'buyer',
      status: 'activated',
    },
  });
  dataIds.referrals.push(payload.item.id);
  return payload.item;
}

async function addFavorite(token, propertyId) {
  const payload = await api('/api/svp/favorites', {
    method: 'POST',
    token,
    body: { propertyId },
  });
  dataIds.favorites.push(propertyId);
  return payload;
}

async function runAiChecks() {
  const desc = await api('/api/ai/description', {
    method: 'POST',
    body: {
      propertyType: 'nhà phố',
      listingType: 'sale',
      title: 'Nhà phố Vạn Phúc pháp lý rõ',
      price: '6850000000',
      bedrooms: '4',
      bathrooms: '3',
      sqft: '72',
      address: 'Vạn Phúc',
      city: 'Hà Nội',
      state: 'VN',
      amenities: 'ô tô, mặt tiền, gần metro',
      notes: 'Viết ngắn gọn, chuyên nghiệp, không phóng đại.',
    },
  });
  assert(typeof desc.description === 'string' && desc.description.length > 40, 'AI description is too short');

  await new Promise((resolve) => setTimeout(resolve, 3500));
  const chat = await api('/api/ai/chat', {
    method: 'POST',
    body: {
      lang: 'vi',
      messages: [{ sender: 'me', text: 'Gợi ý cách lọc khách mua nhà dưới 7 tỷ gần metro.' }],
    },
  });
  assert(typeof chat.reply === 'string' && chat.reply.length > 20, 'AI chat reply is too short');
  return { descriptionLength: desc.description.length, replyLength: chat.reply.length };
}

async function writeReports(summary) {
  await mkdir(REPORT_DIR, { recursive: true });

  const redactedAccounts = accounts.map((account) => ({
    label: account.label,
    email: account.email,
    phone: account.phone,
    roleSlugs: account.roleSlugs,
    userId: account.userId,
    svpId: account.svpId,
    referralCode: account.referralCode,
    accountStatus: account.accountStatus,
  }));

  const credentials = accounts.map((account) => ({
    label: account.label,
    email: account.email,
    password: account.password,
    roleSlugs: account.roleSlugs,
  }));
  await writeFile(join(REPORT_DIR, 'credentials.local'), JSON.stringify(credentials, null, 2), 'utf8');

  const result = {
    runId: RUN_ID,
    baseUrl: BASE_URL,
    generatedAt: nowIso(),
    summary,
    accounts: redactedAccounts,
    dataIds,
    steps,
  };
  await writeFile(join(REPORT_DIR, 'result.json'), JSON.stringify(result, null, 2), 'utf8');

  const passCount = steps.filter((step) => step.status === 'PASS').length;
  const failCount = steps.filter((step) => step.status === 'FAIL').length;
  const lines = [
    '# Live V1 Role Flow Report',
    '',
    `- Domain: ${BASE_URL}`,
    `- Run ID: ${RUN_ID}`,
    `- Time: ${nowIso()}`,
    `- Result: ${failCount === 0 ? 'PASS' : 'FAIL'} (${passCount} pass, ${failCount} fail)`,
    '',
    '## Accounts Tested',
    '',
    ...redactedAccounts.map((account) => `- ${account.label}: ${account.email} | ${account.roleSlugs.join(', ')} | ${account.accountStatus || 'tested'}`),
    '',
    '## Live Data Created',
    '',
    `- Properties: ${dataIds.properties.join(', ') || '-'}`,
    `- Customers: ${dataIds.customers.join(', ') || '-'}`,
    `- Customer needs: ${dataIds.needs.join(', ') || '-'}`,
    `- Viewing schedules: ${dataIds.schedules.join(', ') || '-'}`,
    `- Referrals: ${dataIds.referrals.join(', ') || '-'}`,
    `- Role approvals: ${dataIds.approvedApplications.join(', ') || '-'}`,
    '',
    '## Step Evidence',
    '',
    ...steps.map((step) => `- ${step.status}: ${step.name}`),
    '',
    'Passwords are stored only in credentials.local inside this ignored QA folder.',
    '',
  ];
  await writeFile(join(REPORT_DIR, 'REPORT.md'), lines.join('\n'), 'utf8');
}

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error('SVP_LIVE_ADMIN_PASSWORD is required for live role approval flow.');
  }

  let summary = {};
  try {
    const adminLogin = await login(ADMIN_USERNAME, ADMIN_PASSWORD);
    assert(adminLogin.token, 'Admin login did not return token');
    const adminToken = adminLogin.token;
    record('Admin live login works');

    await ensureApprovalRule(adminToken, 'chuyen_vien', true);
    await ensureApprovalRule(adminToken, 'chuyen_gia', true);
    record('Admin approval settings require approval for Chuyên viên and Chuyên gia');

    const owner = publicAccount('Chủ nhà demo', ['chu_nha']);
    const buyer = publicAccount('Khách mua demo', ['khach_mua']);
    const referrer = publicAccount('Người giới thiệu demo', ['nguoi_gioi_thieu']);
    const ctvKhach = publicAccount('CTV khách demo', ['ctv_khach']);
    const ctvNguon = publicAccount('CTV nguồn demo', ['ctv_nguon']);
    const specialist = publicAccount('Chuyên viên demo', ['chuyen_vien']);
    const expert = publicAccount('Chuyên gia demo', ['chuyen_gia']);
    const mixed = publicAccount('Khách mua kiêm chuyên gia demo', ['khach_mua', 'chuyen_gia']);

    for (const account of [owner, buyer, referrer, ctvKhach, ctvNguon, specialist, expert, mixed]) {
      await register(account);
      record(`Registered ${account.label}`, { email: account.email, roleSlugs: account.roleSlugs });
    }

    for (const account of [owner, buyer, referrer, ctvKhach, ctvNguon, mixed]) {
      const loginPayload = await login(account.email, account.password);
      assert(loginPayload.token, `${account.label} login did not return token`);
      account.token = loginPayload.token;
      account.userId = loginPayload.user?.id || account.userId;
      account.svpId = loginPayload.user?.svpId || account.svpId;
      account.referralCode = loginPayload.user?.referralCode || account.referralCode;
      record(`${account.label} can log in immediately`);
    }

    for (const account of [specialist, expert]) {
      const pending = await login(account.email, account.password, [403]);
      assert(pending.requiresApproval || pending.accountStatus === 'cho_phe_duyet', `${account.label} should wait for approval`);
      record(`${account.label} is blocked until approval`);
    }

    await changePassword(owner);
    record('Owner can change password and log in again');

    await uploadAvatar(owner);
    record('Owner can upload avatar');

    await api('/api/svp/auth/register-role', {
      method: 'POST',
      token: buyer.token,
      body: { role_slug: 'chuyen_vien', reason: 'Muốn hỗ trợ chăm sóc khách mua' },
    });
    buyer.roleSlugs.push('chuyen_vien');
    record('Buyer can request an additional staff role');

    await approvePendingRoles(adminToken, [specialist, expert, mixed, buyer]);
    record('Admin approved pending staff/expert role applications');

    for (const account of [specialist, expert, mixed, buyer]) {
      const approved = await login(account.email, account.password);
      assert(approved.token, `${account.label} approved login did not return token`);
      account.token = approved.token;
      account.userId = approved.user?.id || account.userId;
      account.svpId = approved.user?.svpId || account.svpId;
      account.referralCode = approved.user?.referralCode || account.referralCode;
      const roles = approved.user?.roles || [];
      for (const roleSlug of account.roleSlugs) {
        const role = roles.find((candidate) => candidate.slug === roleSlug);
        assert(role?.status === 'approved', `${account.label} role ${roleSlug} is not approved`);
      }
      record(`${account.label} can log in after approval with approved roles`);
    }

    const propertyA = await createProperty(expert.token, owner, expert, 'A');
    const propertyB = await createProperty(owner.token, owner, expert, 'B');
    record('Expert and owner can create real properties');

    await uploadPropertyMedia(expert.token, propertyA.id);
    record('Expert can upload property media');

    const duplicate = await api('/api/svp/properties/check-duplicate', {
      method: 'POST',
      token: expert.token,
      body: {
        address: propertyA.address,
        bookSerial: propertyA.bookSerial,
        ownerPhone: owner.phone,
        gpsCoordinates: '20.9804,105.7811',
      },
    });
    assert(Array.isArray(duplicate.matches), 'Duplicate check did not return matches array');
    record('Expert duplicate check endpoint works');

    const publicView = await api(`/api/svp/properties/${encodeURIComponent(propertyA.id)}`, { token: buyer.token });
    assert(publicView.item?.id === propertyA.id, 'Buyer cannot open active property detail');
    assert(!publicView.item.ownerPhone, 'Buyer can see owner phone unexpectedly');
    assert(!publicView.item.address, 'Buyer can see exact address unexpectedly');
    record('Buyer property detail hides sensitive owner/location fields');

    const timeline = await api(`/api/svp/properties/${encodeURIComponent(propertyA.id)}/timeline`, { token: expert.token });
    const versions = await api(`/api/svp/properties/${encodeURIComponent(propertyA.id)}/versions`, { token: expert.token });
    assert((timeline.items || []).length > 0, 'Timeline is empty for created property');
    assert((versions.items || []).length > 0, 'Versions are empty for created property');
    record('Property timeline and versions are recorded');

    const customerFlow = await createCustomerFlow(specialist.token, specialist, propertyA);
    record('Specialist can create customer, need and viewing schedule');

    await addFavorite(buyer.token, propertyA.id);
    record('Buyer can save a favorite property');

    await createReferral(referrer.token, referrer, buyer);
    record('Referrer can create a referral record');

    const audit = await api(`/api/svp/audit-logs?entityId=${encodeURIComponent(propertyA.id)}`, { token: adminToken });
    assert((audit.items || []).length > 0, 'Audit log has no property entry');
    record('Admin can view friendly audit evidence for created property');

    const ai = await runAiChecks();
    record('AI description and chat endpoints respond in live flow', ai);

    summary = {
      admin: ADMIN_USERNAME,
      propertyCodes: [propertyA.code, propertyB.code],
      customerId: customerFlow.customer.id,
      ai,
    };
  } catch (error) {
    fail('Live V1 role flow', error);
    await writeReports({ ...summary, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }

  await writeReports(summary);
  console.log(`Report: ${join(REPORT_DIR, 'REPORT.md')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
