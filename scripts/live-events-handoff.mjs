import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE_URL = 'https://sodovanphuc.vn';
const EVENT_SLUG = 'lam-nghe-moi-gioi-dung-luat';
const EVENT_TITLE = 'Làm Nghề Môi Giới Đúng Luật - Thu Nhập Cao - Phát Triển Bền Vững';
const runtimePath = path.join(ROOT, '.runtime', 'live-qa-accounts.local');
const mailboxPath = path.join(ROOT, '.runtime', 'mailboxes.local');

function parseKeyValueFile(filePath) {
  return Object.fromEntries(fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => {
    const index = line.indexOf('=');
    return index > 0 ? [line.slice(0, index).trim(), line.slice(index + 1).trim()] : null;
  }).filter(Boolean));
}

function parseOwnerFile() {
  const lines = fs.readFileSync(path.join(ROOT, '.runtime', 'customer-admin.local'), 'utf8').split(/\r?\n/);
  const value = (label) => (lines.find((line) => line.startsWith(label)) || '').slice(label.length).trim();
  return { email: value('Tai khoan:'), password: value('Mat khau tam:') };
}

function randomPassword() {
  return `Qa!${crypto.randomBytes(12).toString('base64url')}`;
}

const mailbox = parseKeyValueFile(mailboxPath);
const owner = parseOwnerFile();
const existingSecrets = fs.existsSync(runtimePath) ? JSON.parse(fs.readFileSync(runtimePath, 'utf8')) : null;
const runId = existingSecrets?.runId || new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const runTag = runId.slice(-10);
const phoneBase = Number(runId.slice(-7));
const phone = (offset) => `09${String((phoneBase + offset) % 100000000).padStart(8, '0')}`;
const qaEmail = (name) => `qa.${runTag}.${name}@sodovanphuc.vn`;

const accounts = existingSecrets?.accounts || {
  specialist: { key: 'specialist', fullName: `QA-${runTag} Chuyên viên`, email: mailbox.HOTRO_EMAIL, phone: phone(1), password: randomPassword(), roles: ['chuyen_vien'], source: 'home' },
  attendee: { key: 'attendee', fullName: `QA-${runTag} Học viên sự kiện`, email: qaEmail('event'), phone: phone(2), password: randomPassword(), roles: ['hoc_vien'], source: 'event' },
  expert: { key: 'expert', fullName: `QA-${runTag} Chuyên gia`, email: qaEmail('expert'), phone: phone(3), password: randomPassword(), roles: ['chuyen_gia'], source: 'register' },
  leader: { key: 'leader', fullName: `QA-${runTag} Trưởng phòng`, email: qaEmail('leader'), phone: phone(4), password: randomPassword(), roles: ['truong_phong'], source: 'register' },
  director: { key: 'director', fullName: `QA-${runTag} Giám đốc khối`, email: qaEmail('director'), phone: phone(5), password: randomPassword(), roles: ['giam_doc_khoi'], source: 'register' },
  multi: { key: 'multi', fullName: `QA-${runTag} Đa vai trò`, email: qaEmail('multi'), phone: phone(6), password: randomPassword(), roles: ['chuyen_vien', 'chuyen_gia', 'hoc_vien', 'truong_phong', 'giam_doc_khoi'], source: 'register' },
  regularAdmin: { key: 'regularAdmin', fullName: `QA-${runTag} Admin thường`, email: qaEmail('admin'), phone: phone(7), password: randomPassword(), roles: ['admin'], source: 'admin-ui' },
};
accounts.existingRegistrant ||= { key: 'existingRegistrant', fullName: `QA-${runTag} Người dùng hiện hữu`, email: qaEmail('existing'), phone: phone(8), password: randomPassword(), roles: ['hoc_vien'], source: 'register' };
const staleEmails = existingSecrets?.staleEmails || [];
const persistedRuntime = { infoResetPassword: existingSecrets?.infoResetPassword || '' };

fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
function saveRuntime(extra = {}) {
  Object.assign(persistedRuntime, extra);
  fs.writeFileSync(runtimePath, `${JSON.stringify({ runId, accounts, staleEmails, ...persistedRuntime }, null, 2)}\n`, { mode: 0o600 });
}
saveRuntime();

const evidenceDir = path.join(ROOT, 'qa', 'live-handoff', runId);
fs.mkdirSync(evidenceDir, { recursive: true });
const results = [];
const createdUserIds = new Set();
const createdRegistrationIds = new Set();
let qaEventId = '';
let ownerToken = '';
let browser;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(name, callback) {
  process.stdout.write(`[LIVE QA] ${name} ... `);
  const startedAt = Date.now();
  try {
    const detail = await callback();
    results.push({ name, status: 'PASS', durationMs: Date.now() - startedAt, detail: detail || '' });
    console.log('PASS');
    return detail;
  } catch (error) {
    results.push({ name, status: 'FAIL', durationMs: Date.now() - startedAt, detail: error.message });
    console.log(`FAIL: ${error.message}`);
    throw error;
  }
}

async function rawApi(apiPath, { token = '', method = 'GET', body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${BASE_URL}${apiPath}`, {
    method,
    headers,
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

async function api(apiPath, options = {}) {
  const response = await rawApi(apiPath, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.error || payload.message || `HTTP ${response.status}: ${apiPath}`);
  return payload.data ?? payload;
}

async function loginApi(email, password) {
  return api('/api/svp/auth/login', { method: 'POST', body: { identifier: email, email, password } });
}

async function listUsers() {
  return (await api('/api/svp/admin/users', { token: ownerToken })).items || [];
}

async function findUser(email) {
  return (await listUsers()).find((item) => item.email.toLowerCase() === email.toLowerCase());
}

async function prepareResumeState() {
  let users = await listUsers();
  const registrations = (await api('/api/svp/admin/event-registrations', { token: ownerToken })).items || [];
  const oldAttendee = users.find((item) => item.email === accounts.attendee.email);
  const attendeeRegistration = registrations.find((item) => item.email === accounts.attendee.email && item.eventSlug === EVENT_SLUG);
  if (oldAttendee && !attendeeRegistration) {
    staleEmails.push(accounts.attendee.email);
    const retryTag = Date.now().toString().slice(-5);
    accounts.attendee = {
      ...accounts.attendee,
      fullName: `QA-${runTag}-${retryTag} Học viên sự kiện`,
      email: `qa.${runTag}.event.${retryTag}@sodovanphuc.vn`,
      phone: phone(Number(retryTag.slice(-2)) + 30),
      password: randomPassword(),
    };
    saveRuntime();
  }

  const oldExistingRegistrant = users.find((item) => item.email === accounts.existingRegistrant.email);
  const existingRegistration = registrations.find((item) => item.email === accounts.existingRegistrant.email && item.eventSlug === EVENT_SLUG);
  if (oldExistingRegistrant && !existingRegistration) {
    staleEmails.push(accounts.existingRegistrant.email);
    const retryTag = Date.now().toString().slice(-5);
    accounts.existingRegistrant = {
      ...accounts.existingRegistrant,
      fullName: `QA-${runTag}-${retryTag} Người dùng hiện hữu`,
      email: `qa.${runTag}.existing.${retryTag}@sodovanphuc.vn`,
      phone: phone(Number(retryTag.slice(-2)) + 60),
      password: randomPassword(),
    };
    saveRuntime();
  }

  users = await listUsers();
  for (const account of Object.values(accounts)) {
    const user = users.find((item) => item.email === account.email);
    if (!user) continue;
    if (user.accountStatus === 'locked') {
      await api(`/api/svp/admin/users/${user.id}/account-status`, { token: ownerToken, method: 'POST', body: { accountStatus: 'active' } });
    }
    const approved = new Set((user.roles || []).filter((role) => role.status === 'approved').map((role) => role.slug));
    for (const role of account.roles) {
      if (!approved.has(role)) await api(`/api/svp/admin/users/${user.id}`, { token: ownerToken, method: 'PATCH', body: { addRole: role } });
    }
  }
}

function watchPage(page) {
  const failures = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    const message = request.failure()?.errorText || 'request failed';
    if (!/ERR_(ABORTED|CONNECTION_RESET)/.test(message)) failures.push(`${message}: ${request.url()}`);
  });
  return failures;
}

async function screenshot(page, name, fullPage = true) {
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage });
}

async function newPage(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  return { context, page, failures: watchPage(page) };
}

async function loginPage(page, email, password, expectedPath) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#identifier').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
  await page.waitForURL((url) => url.pathname !== '/', { timeout: 25_000 });
  if (new URL(page.url()).pathname === '/select-role' && expectedPath) {
    const role = Object.values(accounts).find((item) => item.email === email)?.roles?.[0] || 'admin_tong';
    await page.getByTestId(`select-role-card-${role}`).click();
  }
  if (expectedPath) await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 25_000 });
}

async function registerViaUi(account, referralCode = '') {
  const { context, page, failures } = await newPage({ width: 390, height: 844 });
  try {
    await page.goto(`${BASE_URL}${account.source === 'home' ? '/' : '/register'}`, { waitUntil: 'domcontentloaded' });
    const card = page.getByTestId('auth-register-card');
    await card.scrollIntoViewIfNeeded();
    await card.getByPlaceholder('Họ và tên (theo CCCD)').fill(account.fullName);
    await card.getByPlaceholder('Số điện thoại').fill(account.phone);
    await card.getByPlaceholder('Email', { exact: true }).fill(account.email);
    await card.getByPlaceholder('Mật khẩu', { exact: true }).fill(account.password);
    if (referralCode) await card.getByPlaceholder(/Mã \/ SĐT \/ Email người giới thiệu/).fill(referralCode);
    for (const role of account.roles) await card.getByTestId(`auth-role-option-${role}`).click();
    await card.locator('#accepted-legal').check();
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/svp/auth/register') && response.request().method() === 'POST');
    await card.getByRole('button', { name: 'Đăng ký tài khoản' }).click();
    const response = await responsePromise;
    assert(response.status() === 201, `Đăng ký ${account.email} trả HTTP ${response.status()}`);
    await page.waitForURL(/\/(pending-approval|select-role|chuyen-|hoc-vien|quan-tri)/, { timeout: 25_000 });
    assert(failures.length === 0, failures.join('; '));
    if (account.key === 'specialist') await screenshot(page, '05-dang-ky-trang-chu-mobile');
  } finally {
    await context.close();
  }
}

async function registerEventViaUi(account, referralCode) {
  const { context, page, failures } = await newPage({ width: 390, height: 844 });
  try {
    const url = `${BASE_URL}/dang-ky-su-kien/${EVENT_SLUG}?utm_source=qa-live&utm_medium=playwright&utm_campaign=${runTag}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Họ và tên').fill(account.fullName);
    await page.getByPlaceholder('Số điện thoại').fill(account.phone);
    await page.getByPlaceholder('Email').fill(account.email);
    await page.getByPlaceholder(/Mật khẩu/).fill(account.password);
    await page.getByPlaceholder(/Mã người giới thiệu/).fill(referralCode);
    await page.getByRole('button', { name: /Tham dự SỰ KIỆN miễn phí/i }).click();
    await page.locator('input[type="checkbox"]').check();
    const responsePromise = page.waitForResponse((response) => response.url().includes(`/api/svp/events/${EVENT_SLUG}/register-new`));
    await page.getByRole('button', { name: /Đăng ký tham dự miễn phí/ }).click();
    const response = await responsePromise;
    assert(response.status() === 201, `Đăng ký sự kiện trả HTTP ${response.status()}`);
    await page.getByTestId('event-registration-message').waitFor();
    await screenshot(page, '06-dang-ky-su-kien-nguoi-moi-mobile');
    assert(failures.length === 0, failures.join('; '));
  } finally {
    await context.close();
  }
}

async function approveApplications(ownerPage) {
  await ownerPage.goto(`${BASE_URL}/quan-tri/duyet-vai-tro`, { waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('heading', { name: 'Duyệt thành viên/vai trò' }).waitFor();
  await screenshot(ownerPage, '07-admin-duyet-vai-tro');

  const specialistEmail = ownerPage.getByText(accounts.specialist.email, { exact: true }).first();
  if (await specialistEmail.count()) {
    const card = specialistEmail.locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Duyệt")]][1]');
    await card.getByRole('button', { name: /^Duyệt$/ }).click();
    await ownerPage.getByText('Đã duyệt vai trò.').waitFor();
  }

  const pending = (await api('/api/svp/admin/role-applications?status=pending', { token: ownerToken })).items || [];
  const qaEmails = new Set(Object.values(accounts).filter((item) => item.source !== 'admin-ui').map((item) => item.email));
  for (const application of pending.filter((item) => qaEmails.has(item.userEmail))) {
    await api(`/api/svp/admin/role-applications/${application.id}`, { token: ownerToken, method: 'PATCH', body: { status: 'approved', adminNotes: `QA live ${runId}` } });
  }
}

async function previewPublishAndBrand(ownerPage) {
  await ownerPage.goto(`${BASE_URL}/quan-tri/su-kien`, { waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('heading', { name: 'Sự kiện và người đăng ký' }).waitFor();
  await ownerPage.getByRole('button', { name: new RegExp(EVENT_TITLE.slice(0, 25)) }).click();
  const popupPromise = ownerPage.waitForEvent('popup');
  await ownerPage.getByRole('link', { name: 'Xem trước' }).click();
  const preview = await popupPromise;
  await preview.waitForLoadState('domcontentloaded');
  await preview.getByRole('heading', { name: EVENT_TITLE }).waitFor();
  await screenshot(preview, '01-xem-truoc-su-kien-nhap');
  await preview.close();

  await ownerPage.locator('label').filter({ hasText: 'Hiển thị' }).locator('select').selectOption('published');
  const [response] = await Promise.all([
    ownerPage.waitForResponse((item) => item.url().includes('/api/svp/admin/events/') && item.request().method() === 'PUT'),
    ownerPage.getByRole('button', { name: 'Lưu', exact: true }).click(),
  ]);
  assert(response.status() === 200, 'Không công khai được sự kiện');
  await ownerPage.getByText('Đã lưu sự kiện.').waitFor();

  const { context, page } = await newPage();
  try {
    await page.goto(`${BASE_URL}/su-kien/${EVENT_SLUG}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: EVENT_TITLE }).waitFor();
    await screenshot(page, '02-su-kien-cong-khai-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await screenshot(page, '03-su-kien-cong-khai-mobile');
  } finally { await context.close(); }

  await ownerPage.goto(`${BASE_URL}/quan-tri/cau-hinh`, { waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('heading', { name: /Cấu hình vận hành/ }).waitFor();
  const logoInput = ownerPage.locator('input[type="file"]').first();
  await logoInput.setInputFiles(path.join(ROOT, 'public', 'logo11.png'));
  await ownerPage.getByText('Đã áp dụng ảnh thương hiệu trên toàn website.').waitFor();
  const bannerInputs = ownerPage.locator('input[type="file"]');
  assert(await bannerInputs.count() >= 2, 'Admin tổng không thấy đủ bộ tải logo/banner');
  await bannerInputs.nth(1).setInputFiles(path.join(ROOT, 'public', 'assets', 'svp-auth-hero.png'));
  await ownerPage.getByText('Đã áp dụng ảnh thương hiệu trên toàn website.').waitFor();
  await screenshot(ownerPage, '04-admin-tong-cau-hinh-thuong-hieu');
}

async function createRegularAdmin(ownerPage) {
  await ownerPage.goto(`${BASE_URL}/quan-tri/nguoi-dung`, { waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await ownerPage.getByPlaceholder('Nhập họ tên').fill(accounts.regularAdmin.fullName);
  await ownerPage.getByPlaceholder('email@sodovanphuc.vn').fill(accounts.regularAdmin.email);
  await ownerPage.getByPlaceholder('09...').fill(accounts.regularAdmin.phone);
  await ownerPage.locator('section').filter({ hasText: 'Thêm người dùng mới' }).locator('select').selectOption('admin');
  await ownerPage.getByPlaceholder(/Để trống để hệ thống tự sinh/).fill(accounts.regularAdmin.password);
  const responsePromise = ownerPage.waitForResponse((response) => response.url().endsWith('/api/svp/admin/users') && response.request().method() === 'POST');
  await ownerPage.getByTestId('admin-create-user-submit').click();
  const response = await responsePromise;
  assert(response.status() === 201, `Tạo Admin thường trả HTTP ${response.status()}`);
  await ownerPage.getByText('Đã tạo tài khoản').waitFor();
  await screenshot(ownerPage, '08-admin-tong-tao-admin-thuong');
}

async function testRoleLogin(account, expectedPath, screenshotName) {
  const { context, page, failures } = await newPage({ width: 390, height: 844 });
  try {
    await loginPage(page, account.email, account.password, expectedPath);
    const text = (await page.locator('#root').innerText()).trim();
    assert(text.length > 80, `${account.key} hiển thị trang trống`);
    assert(!/Application error|Page Not Found/i.test(text), `${account.key} gặp lỗi giao diện`);
    await screenshot(page, screenshotName);
    assert(failures.length === 0, failures.join('; '));
  } finally { await context.close(); }
}

async function testMultiRole() {
  const { context, page } = await newPage();
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#identifier').fill(accounts.multi.email);
    await page.locator('#password').fill(accounts.multi.password);
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForURL(/\/select-role$/);
    await screenshot(page, '14-chon-nhieu-vai-tro');
    const expected = { chuyen_vien: '/chuyen-vien', chuyen_gia: '/chuyen-gia', hoc_vien: '/hoc-vien', truong_phong: '/quan-tri', giam_doc_khoi: '/quan-tri' };
    for (const [role, route] of Object.entries(expected)) {
      await page.getByTestId(`select-role-card-${role}`).click();
      await page.waitForURL((url) => url.pathname === route);
      await page.goto(`${BASE_URL}/select-role`, { waitUntil: 'domcontentloaded' });
    }
  } finally { await context.close(); }
}

async function registerExistingAndCheckDuplicate(account, expectedPath) {
  const { context, page } = await newPage({ width: 390, height: 844 });
  try {
    await loginPage(page, account.email, account.password, expectedPath);
    await page.goto(`${BASE_URL}/dang-ky-su-kien/${EVENT_SLUG}?utm_source=qa-existing`, { waitUntil: 'domcontentloaded' });
    const submit = page.getByRole('button', { name: /Đăng ký tham dự miễn phí/ });
    await submit.click();
    await page.getByTestId('event-registration-message').filter({ hasText: 'Đăng ký thành công' }).waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Đăng ký tham dự miễn phí/ }).click();
    await page.getByTestId('event-registration-message').filter({ hasText: 'đã đăng ký sự kiện này' }).waitFor();
  } finally { await context.close(); }
}

async function reassignReferrerViaUi(ownerPage) {
  await ownerPage.goto(`${BASE_URL}/quan-tri/nguoi-dung`, { waitUntil: 'domcontentloaded' });
  const search = ownerPage.getByPlaceholder(/Tìm theo tên, email/);
  await search.fill(accounts.attendee.fullName);
  const card = ownerPage.getByTestId('admin-user-card').filter({ hasText: accounts.attendee.fullName });
  await card.getByRole('button', { name: accounts.attendee.fullName }).click();
  const lookup = ownerPage.getByPlaceholder(/Tìm theo tên, SVP ID/);
  await lookup.fill(accounts.expert.email);
  const candidate = ownerPage.getByRole('button').filter({ hasText: accounts.expert.fullName }).first();
  await candidate.waitFor();
  await candidate.click();
  await ownerPage.getByRole('button', { name: /^Lưu$/ }).click();
  await ownerPage.getByText(/Đã cập nhật người giới thiệu cho/).waitFor();
  await screenshot(ownerPage, '15-gan-lai-nguoi-gioi-thieu');
}

async function testEventAdmin(ownerPage) {
  await ownerPage.goto(`${BASE_URL}/quan-tri/su-kien`, { waitUntil: 'domcontentloaded' });
  await ownerPage.getByRole('button', { name: 'Người đăng ký' }).click();
  await ownerPage.getByPlaceholder('Tên, email, điện thoại').fill(accounts.attendee.email);
  await ownerPage.getByTitle('Lọc').click();
  const row = ownerPage.locator('tr').filter({ hasText: accounts.attendee.email });
  await row.locator('select').selectOption('confirmed');
  await screenshot(ownerPage, '16-quan-ly-nguoi-dang-ky-su-kien');
  const downloadPromise = ownerPage.waitForEvent('download');
  await ownerPage.getByTitle('Xuất CSV').click();
  const download = await downloadPromise;
  const csvPath = path.join(evidenceDir, 'event-registrations.csv');
  await download.saveAs(csvPath);
  assert(fs.readFileSync(csvPath, 'utf8').includes(accounts.attendee.email), 'CSV không chứa đăng ký đã lọc');

  const event = (await api('/api/svp/admin/events', { token: ownerToken })).items.find((item) => item.slug === EVENT_SLUG);
  await api(`/api/svp/admin/events/${event.id}`, { token: ownerToken, method: 'PUT', body: { ...event, registrationStatus: 'closed' } });
  const expertLogin = await loginApi(accounts.expert.email, accounts.expert.password);
  const closedResponse = await rawApi(`/api/svp/events/${EVENT_SLUG}/register`, { token: expertLogin.token, method: 'POST', body: { utmSource: 'qa-closed' } });
  assert(closedResponse.status === 409, `Sự kiện đóng vẫn nhận đăng ký: HTTP ${closedResponse.status}`);
  await api(`/api/svp/admin/events/${event.id}`, { token: ownerToken, method: 'PUT', body: { ...event, registrationStatus: 'open' } });

  const qaEvent = await api('/api/svp/admin/events', { token: ownerToken, method: 'POST', body: {
    slug: `qa-${runTag}-${Date.now()}`, title: `QA-${runTag} Sự kiện kiểm thử`, eyebrow: 'QA', summary: 'Dữ liệu kiểm thử sẽ được lưu trữ.', sections: [], disclaimer: 'QA', bannerUrl: '/assets/events/lam-nghe-moi-gioi-dung-luat.png',
  } });
  qaEventId = qaEvent.item.id;
  await api(`/api/svp/admin/events/${qaEventId}`, { token: ownerToken, method: 'PUT', body: { ...qaEvent.item, status: 'archived', registrationStatus: 'closed' } });
}

async function testRegularAdminRestrictions() {
  const regular = await loginApi(accounts.regularAdmin.email, accounts.regularAdmin.password);
  const createResponse = await rawApi('/api/svp/admin/users', { token: regular.token, method: 'POST', body: {
    fullName: `QA-${runTag} Không được tạo Admin`, email: qaEmail('forbidden-admin'), phone: phone(20), password: randomPassword(), roleSlugs: ['admin'],
  } });
  assert(createResponse.status === 403, `Admin thường tạo Admin khác trả HTTP ${createResponse.status}`);
  const form = new FormData();
  form.append('kind', 'logo');
  form.append('image', new Blob([fs.readFileSync(path.join(ROOT, 'public', 'logo11.png'))], { type: 'image/png' }), 'logo.png');
  const brandingResponse = await rawApi('/api/svp/admin/branding/upload', { token: regular.token, method: 'POST', formData: form });
  assert(brandingResponse.status === 403, `Admin thường tải logo trả HTTP ${brandingResponse.status}`);

  const { context, page } = await newPage();
  try {
    await loginPage(page, accounts.regularAdmin.email, accounts.regularAdmin.password, '/quan-tri');
    await page.goto(`${BASE_URL}/quan-tri/cau-hinh`, { waitUntil: 'domcontentloaded' });
    await page.getByText(/Chỉ Admin tổng mới có quyền tải/).waitFor();
    assert(await page.locator('input[type="file"]').count() === 0, 'Admin thường vẫn thấy nút tải thương hiệu');
    await screenshot(page, '17-admin-thuong-bi-gioi-han');
  } finally { await context.close(); }
}

function imapCommand(socket, tag, command, state, timeoutMs = 25_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`IMAP timeout: ${command.split(' ')[0]}`)), timeoutMs);
    state.pending = { tag, command: command.split(' ')[0], chunks: [], resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } };
    socket.write(`${tag} ${command}\r\n`);
  });
}

function passwordForMailbox(email) {
  if (email === mailbox.INFO_EMAIL) return mailbox.INFO_PASSWORD || mailbox.MAILBOX_PASSWORD;
  if (email === mailbox.HOTRO_EMAIL) return mailbox.HOTRO_PASSWORD || mailbox.MAILBOX_PASSWORD;
  return mailbox.MAILBOX_PASSWORD;
}

async function readMailbox(email, password) {
  const state = { buffer: '', pending: null, greeting: null };
  const socket = tls.connect({ host: 'mail.hocvienvanphuc.edu.vn', port: 993, rejectUnauthorized: false });
  socket.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    if (!state.pending) { state.buffer += text; return; }
    state.pending.chunks.push(text);
    const combined = state.pending.chunks.join('');
    const tagged = combined.match(new RegExp(`(?:^|\\r?\\n)${state.pending.tag} (OK|NO|BAD)`, 'm'));
    if (tagged) {
      const pending = state.pending; state.pending = null;
      if (tagged[1] === 'OK') pending.resolve(combined);
      else pending.reject(new Error(`IMAP ${pending.command} bị máy chủ từ chối (${tagged[1]}).`));
    }
  });
  socket.on('error', (error) => {
    if (!state.pending) return;
    const pending = state.pending; state.pending = null; pending.reject(error);
  });
  let body = '';
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('IMAP connect timeout')), 20_000);
      socket.once('secureConnect', () => { clearTimeout(timer); resolve(); });
      socket.once('error', reject);
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const quote = (value) => `"${String(value).replace(/([\\"])/g, '\\$1')}"`;
    await imapCommand(socket, 'a1', `LOGIN ${quote(email)} ${quote(password)}`, state);
    await imapCommand(socket, 'a2', 'SELECT INBOX', state);
    const search = await imapCommand(socket, 'a3', 'SEARCH ALL', state);
    const ids = (search.match(/\* SEARCH ([\d ]+)/)?.[1] || '').trim().split(/\s+/).filter(Boolean).slice(-5);
    body = ids.length ? await imapCommand(socket, 'a4', `FETCH ${ids.join(',')} BODY.PEEK[]`, state, 60_000) : '';
    await imapCommand(socket, 'a5', 'LOGOUT', state).catch(() => undefined);
  } finally {
    socket.destroy();
  }
  const decoded = body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  const base64Parts = [...body.matchAll(/Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/gi)].map((match) => {
    try { return Buffer.from(match[1].replace(/\s/g, ''), 'base64').toString('utf8'); } catch { return ''; }
  });
  return `${decoded}\n${base64Parts.join('\n')}`;
}

async function requestResetViaUi(email, screenshotName) {
  const { context, page } = await newPage({ width: 390, height: 844 });
  try {
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('email@sodovanphuc.vn').fill(email);
    await page.getByRole('button', { name: 'Gửi hướng dẫn' }).click();
    await page.getByRole('heading', { name: 'Đã ghi nhận yêu cầu' }).waitFor();
    await screenshot(page, screenshotName);
  } finally { await context.close(); }
}

async function waitForResetLink(email) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const inbox = await readMailbox(email, passwordForMailbox(email));
    const normalized = inbox.replace(/&amp;/g, '&');
    const links = normalized.match(/https:\/\/sodovanphuc\.vn\/(?:reset-password|dat-lai-mat-khau)\?[^"'<>\s]+/g) || [];
    if (links.length) return links.at(-1);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Không nhận được link đặt lại mật khẩu tại ${email}`);
}

async function resetViaUi(url, newPassword, screenshotName) {
  const { context, page } = await newPage({ width: 390, height: 844 });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const fields = page.getByPlaceholder('Tối thiểu 6 ký tự');
    await fields.nth(0).fill(newPassword);
    await fields.nth(1).fill(newPassword);
    await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
    await page.getByRole('heading', { name: 'Đã đổi mật khẩu' }).waitFor();
    await screenshot(page, screenshotName);
  } finally { await context.close(); }
}

async function screenshotMailbox() {
  const { context, page } = await newPage();
  try {
    await page.goto('https://webmail.hocvienvanphuc.edu.vn', { waitUntil: 'domcontentloaded' });
    await page.locator('#user').fill(mailbox.HOTRO_EMAIL);
    await page.locator('#pass').fill(passwordForMailbox(mailbox.HOTRO_EMAIL));
    await page.locator('#login_submit').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
    const roundcube = page.getByText(/Open.*Roundcube|Roundcube/i).first();
    if (await roundcube.count()) { await roundcube.click(); await page.waitForLoadState('domcontentloaded'); }
    await screenshot(page, '20-hop-thu-that-hotro');
  } finally { await context.close(); }
}

async function cleanup() {
  if (!ownerToken) return;
  try {
    const registrations = (await api('/api/svp/admin/event-registrations', { token: ownerToken })).items || [];
    for (const registration of registrations.filter((item) => Object.values(accounts).some((account) => account.email === item.email))) {
      await api(`/api/svp/admin/event-registrations/${registration.id}`, { token: ownerToken, method: 'DELETE' }).catch(() => undefined);
    }
    const users = await listUsers();
    const regularAdmin = users.find((item) => item.email === accounts.regularAdmin.email);
    if (regularAdmin) await api(`/api/svp/admin/users/${regularAdmin.id}`, { token: ownerToken, method: 'PATCH', body: { removeRole: 'admin' } }).catch(() => undefined);
    for (const user of users.filter((item) => Object.values(accounts).some((account) => account.email === item.email) || staleEmails.includes(item.email))) {
      await api(`/api/svp/admin/users/${user.id}/account-status`, { token: ownerToken, method: 'POST', body: { accountStatus: 'locked' } }).catch(() => undefined);
    }
    const infoUser = users.find((item) => item.email === mailbox.INFO_EMAIL);
    if (infoUser) await api(`/api/svp/admin/users/${infoUser.id}/account-status`, { token: ownerToken, method: 'POST', body: { accountStatus: 'locked' } }).catch(() => undefined);
    if (qaEventId) {
      const qaEvent = await api(`/api/svp/admin/events/${qaEventId}`, { token: ownerToken });
      await api(`/api/svp/admin/events/${qaEventId}`, { token: ownerToken, method: 'PUT', body: { ...qaEvent.item, status: 'archived', registrationStatus: 'closed' } }).catch(() => undefined);
    }
    await api('/api/svp/admin/branding/reset', { token: ownerToken, method: 'POST', body: { kind: 'logo' } }).catch(() => undefined);
    await api('/api/svp/admin/branding/reset', { token: ownerToken, method: 'POST', body: { kind: 'banner' } }).catch(() => undefined);
  } catch (error) {
    results.push({ name: 'Dọn dữ liệu QA', status: 'FAIL', detail: error.message });
  }
}

function writeReport() {
  const lines = [
    `# Báo cáo kiểm thử live ${runId}`,
    '',
    `- Website: ${BASE_URL}`,
    `- Sự kiện: ${EVENT_TITLE}`,
    `- Tài khoản QA: ${Object.keys(accounts).length} (mật khẩu chỉ lưu trong .runtime/live-qa-accounts.local)`,
    '',
    '| Hạng mục | Kết quả | Chi tiết |',
    '|---|---|---|',
    ...results.map((item) => `| ${item.name.replace(/\|/g, '/')} | ${item.status} | ${String(item.detail || '').replace(/\|/g, '/')} |`),
    '',
    '## Dọn dữ liệu',
    '',
    '- Tài khoản QA được tạm khóa; vai trò Admin của tài khoản thử được gỡ trước khi khóa.',
    '- Đăng ký sự kiện thử được xóa mềm; sự kiện QA được lưu trữ và đóng đăng ký.',
    '- Logo/banner thử được khôi phục về cấu hình mặc định.',
  ];
  fs.writeFileSync(path.join(evidenceDir, 'REPORT.md'), `${lines.join('\n')}\n`);
  fs.writeFileSync(path.join(evidenceDir, 'report.json'), `${JSON.stringify({ runId, results }, null, 2)}\n`);
}

let runError = null;
try {
  browser = await chromium.launch({ headless: true });
  await step('Đăng nhập Admin tổng qua API thật', async () => {
    const login = await loginApi(owner.email, owner.password);
    ownerToken = login.token;
    assert(login.user.roles.some((role) => role.slug === 'admin_tong' && role.status === 'approved'), 'Tài khoản không có Admin tổng');
  });
  await step('Chuẩn bị lại tài khoản QA sau lượt chạy gián đoạn', prepareResumeState);

  const ownerSession = await newPage();
  const ownerPage = ownerSession.page;
  await step('Đăng nhập Admin tổng qua giao diện thật', async () => loginPage(ownerPage, owner.email, owner.password, '/quan-tri'));
  await step('Xem trước bản nháp, công khai sự kiện và tải thương hiệu', async () => previewPublishAndBrand(ownerPage));

  const usersBefore = await listUsers();
  for (const account of Object.values(accounts).filter((item) => item.source !== 'admin-ui' && item.source !== 'event')) {
    await step(`Tạo tài khoản thật ${account.key} qua giao diện`, async () => {
      if (usersBefore.some((item) => item.email === account.email)) return 'Dùng lại đúng tài khoản đã tạo qua UI ở lượt QA trước.';
      await registerViaUi(account);
    });
  }
  const specialist = await findUser(accounts.specialist.email);
  assert(specialist?.referralCode, 'Không lấy được mã giới thiệu của tài khoản A');
  await step('Tạo tài khoản B và đăng ký sự kiện trong cùng luồng', async () => {
    if (await findUser(accounts.attendee.email)) return 'Dùng lại bản ghi đã tạo trong transaction sự kiện.';
    await registerEventViaUi(accounts.attendee, specialist.referralCode);
  });

  await step('Admin duyệt các vai trò thật', async () => approveApplications(ownerPage));
  await step('Admin tổng tạo Admin thường qua giao diện', async () => {
    if (await findUser(accounts.regularAdmin.email)) return 'Dùng lại Admin thường do Admin tổng đã tạo qua UI.';
    await createRegularAdmin(ownerPage);
  });

  await step('Đăng nhập và dùng dashboard Chuyên viên', async () => testRoleLogin(accounts.specialist, '/chuyen-vien', '09-dashboard-chuyen-vien'));
  await step('Đăng nhập và dùng dashboard Học viên', async () => testRoleLogin(accounts.attendee, '/hoc-vien', '10-dashboard-hoc-vien'));
  await step('Đăng nhập và dùng dashboard Chuyên gia', async () => testRoleLogin(accounts.expert, '/chuyen-gia', '11-dashboard-chuyen-gia'));
  await step('Đăng nhập và dùng dashboard Trưởng phòng', async () => testRoleLogin(accounts.leader, '/quan-tri', '12-dashboard-truong-phong'));
  await step('Đăng nhập và dùng dashboard Giám đốc khối', async () => testRoleLogin(accounts.director, '/quan-tri', '13-dashboard-giam-doc-khoi'));
  await step('Chọn và chuyển đổi tài khoản nhiều vai trò', testMultiRole);

  await step('Người đã có tài khoản đăng ký và chống đăng ký trùng', async () => registerExistingAndCheckDuplicate(accounts.existingRegistrant, '/hoc-vien'));
  await step('Gán lại người giới thiệu bằng tìm kiếm chính xác', async () => reassignReferrerViaUi(ownerPage));
  await step('Lọc, cập nhật, xuất CSV, đóng/mở và tạo sự kiện QA', async () => testEventAdmin(ownerPage));
  await step('Admin thường bị chặn quyền của Admin tổng', testRegularAdminRestrictions);

  await step('Kiểm tra nguồn sự kiện, UTM và quan hệ giới thiệu', async () => {
    const registrations = (await api('/api/svp/admin/event-registrations', { token: ownerToken })).items || [];
    for (const item of registrations.filter((entry) => [accounts.attendee.email, accounts.specialist.email].includes(entry.email))) createdRegistrationIds.add(item.id);
    const attendeeRegistration = registrations.find((item) => item.email === accounts.attendee.email);
    assert(attendeeRegistration?.eventSlug === EVENT_SLUG, 'Thiếu eventSlug của người đăng ký');
    assert(attendeeRegistration?.utmSource === 'qa-live', 'Thiếu UTM source của người đăng ký');
    const attendeeUser = await findUser(accounts.attendee.email);
    const expertUser = await findUser(accounts.expert.email);
    assert(attendeeUser?.referrer?.id === expertUser?.id, 'Gán lại người giới thiệu chưa được lưu');
  });

  const infoUser = await findUser(mailbox.INFO_EMAIL);
  assert(infoUser, 'Không tìm thấy tài khoản thật của hộp thư info');
  await api(`/api/svp/admin/users/${infoUser.id}/account-status`, { token: ownerToken, method: 'POST', body: { accountStatus: 'active' } });
  await step('Gửi quên mật khẩu tới hai hộp thư thật', async () => {
    await requestResetViaUi(mailbox.INFO_EMAIL, '18-quen-mat-khau-info');
    await requestResetViaUi(mailbox.HOTRO_EMAIL, '19-quen-mat-khau-hotro');
  });
  await step('Mở email thật và đặt lại mật khẩu tài khoản info', async () => {
    const infoLink = await waitForResetLink(mailbox.INFO_EMAIL);
    const infoNewPassword = randomPassword();
    await resetViaUi(infoLink, infoNewPassword, '21-dat-lai-mat-khau-info');
    await loginApi(mailbox.INFO_EMAIL, infoNewPassword);
    saveRuntime({ infoResetPassword: infoNewPassword });
  });
  await step('Mở email thật và đặt lại mật khẩu tài khoản hotro', async () => {
    const hotroLink = await waitForResetLink(mailbox.HOTRO_EMAIL);
    const hotroNewPassword = randomPassword();
    await resetViaUi(hotroLink, hotroNewPassword, '22-dat-lai-mat-khau-hotro');
    await loginApi(mailbox.HOTRO_EMAIL, hotroNewPassword);
    accounts.specialist.password = hotroNewPassword;
    saveRuntime();
    await screenshotMailbox();
  });

  await ownerSession.context.close();
} catch (error) {
  runError = error;
} finally {
  await cleanup();
  if (browser) await browser.close();
  writeReport();
}

if (runError) {
  console.error(`[LIVE QA] Dừng do lỗi: ${runError.message}`);
  process.exitCode = 1;
} else {
  console.log(`[LIVE QA] Hoàn tất. Bằng chứng: ${evidenceDir}`);
}
