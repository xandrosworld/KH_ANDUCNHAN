import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ROUTES = [
  { path: '/', heading: /Sổ Đỏ Vạn Phúc|Đăng nhập/i },
  { path: '/sign-in', heading: /Đăng nhập/i },
  { path: '/register', heading: /Đăng ký tài khoản/i },
  { path: '/forgot-password', heading: /Quên mật khẩu/i },
  { path: '/reset-password?token=qa-token&email=qa@sodovanphuc.vn', heading: /Đặt lại mật khẩu/i },
  { path: '/pending-approval', heading: /Chờ phê duyệt|Tài khoản đang chờ phê duyệt/i },
];

const PROTECTED_REDIRECT_ROUTES = [
  '/chu-nha',
  '/khach-mua',
  '/chuyen-gia',
  '/chuyen-vien',
  '/ctv',
  '/gioi-thieu',
  '/quan-tri',
  '/profile',
  '/notifications',
];

const FORBIDDEN_TEXT = [
  ['Global', 'Forumz'].join(''),
  ['global', 'forumz'].join(''),
  ['vanphuc', '.edu', '.vn'].join(''),
  ['api.', 'vanphuc', '.edu', '.vn'].join(''),
  ['tenmien', 'cuakhach'].join(''),
  ['api.', 'tenmien', 'cuakhach'].join(''),
  'Audit log',
  'Roadmap',
  'AUTO-SMOKE',
  'database/skeleton',
  'Create Account',
  'Sign In',
];

function watchRuntimeFailures(page: Page) {
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !/^Failed to load resource: net::ERR_(CONNECTION_RESET|ABORTED)$/.test(text)) {
      if (/^Failed to load resource: the server responded with a status of (403|404) \((Forbidden|Not Found)\)$/i.test(text)) {
        return;
      }
      failures.push(`console: ${text}`);
    }
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || 'request failed';
    if (failure === 'net::ERR_ABORTED' || failure === 'net::ERR_CONNECTION_RESET') return;
    failures.push(`${failure}: ${request.method()} ${request.url()}`);
  });
  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) return;

    const request = response.request();
    const type = request.resourceType();
    const url = response.url();
    if (!['document', 'script', 'stylesheet', 'fetch', 'xhr'].includes(type)) return;
    if (/favicon\.(ico|png|svg)$/i.test(url)) return;
    if (/\/api\/svp\/auth\/me$/i.test(url) && status === 401) return;

    failures.push(`HTTP ${status}: ${type} ${url}`);
  });

  return failures;
}

async function waitForLiveApp(page: Page) {
  await expect(page.locator('body > #root')).not.toBeEmpty({ timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText('Page Not Found');
  await expect(page.locator('body')).not.toContainText('Application error');
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(300);
}

async function assertNoBlankPage(page: Page, route: string) {
  const rootText = (await page.locator('body > #root').innerText()).trim();
  expect(rootText.length, `${route} should not render a blank app shell`).toBeGreaterThan(40);
}

async function assertNoForbiddenText(page: Page, route: string) {
  const body = await page.locator('body').innerText();
  for (const text of FORBIDDEN_TEXT) {
    expect(body, `${route} must not expose legacy text: ${text}`).not.toContain(text);
  }
}

async function assertNoMojibake(page: Page, route: string) {
  const body = await page.locator('body').innerText();
  expect(body, `${route} must not expose broken Vietnamese encoding`).not.toMatch(/(\u00c3.|\u00c4.|\u00c2[\u00a0\u00b7]|\u00e2[\u20ac\u201c\u201d\u2013\u2014]|\u00e1\u00ba|\u00e1\u00bb)/);
}

async function assertNoOverflow(page: Page, route: string) {
  const overflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const rootOverflow = document.documentElement.scrollWidth > viewportWidth + 1;
    const offenders: string[] = [];

    document.querySelectorAll('body *').forEach((element) => {
      if (offenders.length >= 8) return;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.right <= viewportWidth + 1 && rect.left >= -1) return;

      let parent = element.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (['hidden', 'auto', 'scroll'].includes(style.overflowX) || ['hidden', 'auto', 'scroll'].includes(style.overflow)) {
          return;
        }
        parent = parent.parentElement;
      }

      const name = element.tagName.toLowerCase();
      const className = typeof element.className === 'string' ? element.className.slice(0, 80) : '';
      offenders.push(`${name}.${className}`);
    });

    return { rootOverflow, offenders };
  });

  expect(overflow.rootOverflow, `${route} has document horizontal overflow`).toBe(false);
  expect(overflow.offenders, `${route} has overflowing elements`).toEqual([]);
}

async function assertHealthyPage(page: Page, route: string) {
  await assertNoBlankPage(page, route);
  await assertNoOverflow(page, route);
  await assertNoForbiddenText(page, route);
  await assertNoMojibake(page, route);
}

test.describe('So Do Van Phuc live hosting smoke', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads in the browser without runtime failures`, async ({ page }) => {
      const failures = watchRuntimeFailures(page);
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      expect(response?.status(), `${route.path} should return HTTP 200`).toBe(200);
      await waitForLiveApp(page);
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 15_000 });
      await assertHealthyPage(page, route.path);
      expect(failures, `${route.path} should not throw runtime, asset, or HTTP failures`).toEqual([]);
    });
  }

  for (const path of PROTECTED_REDIRECT_ROUTES) {
    test(`${path} redirects anonymous visitors to the V1 sign-in screen`, async ({ page }) => {
      const failures = watchRuntimeFailures(page);
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

      expect(response?.status(), `${path} should return HTTP 200`).toBe(200);
      await waitForLiveApp(page);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { name: /Đăng nhập/i }).first()).toBeVisible({ timeout: 15_000 });
      await assertHealthyPage(page, path);
      expect(failures, `${path} anonymous redirect should not throw runtime, asset, or HTTP failures`).toEqual([]);
    });
  }

  test('unknown live routes use the SPA fallback to the V1 sign-in screen', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    const response = await page.goto(`/khong-ton-tai-live-${Date.now()}`, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await waitForLiveApp(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /Đăng nhập/i }).first()).toBeVisible({ timeout: 15_000 });
    await assertHealthyPage(page, 'unknown-route');
    expect(failures, 'SPA fallback should not throw runtime, asset, or HTTP failures').toEqual([]);
  });

  test('live admin login form accepts configured credentials', async ({ page }) => {
    const adminPassword = process.env.SVP_LIVE_ADMIN_PASSWORD;
    test.skip(!adminPassword, 'Enable with SVP_LIVE_ADMIN_PASSWORD after config.php is generated.');

    const adminUsername = process.env.SVP_LIVE_ADMIN_USERNAME || 'admin';
    const failures = watchRuntimeFailures(page);
    const response = await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

    expect(response?.status(), '/sign-in should return HTTP 200').toBe(200);
    await waitForLiveApp(page);
    await expect(page.getByRole('heading', { name: /Đăng nhập/i }).first()).toBeVisible({ timeout: 15_000 });

    await page.locator('#identifier').fill(adminUsername);
    await page.locator('#password').fill(adminPassword);
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);

    if (/\/select-role$/.test(page.url())) {
      const adminRole = page.getByRole('button', { name: /Quản trị|Admin/i }).first();
      if (await adminRole.count()) {
        await adminRole.click();
      }
    }

    try {
      await page.waitForURL(/\/quan-tri$/, { timeout: 20_000 });
    } catch (error) {
      await page.locator('#password').fill('').catch(() => undefined);
      throw error;
    }
    await waitForLiveApp(page);
    await expect(page.getByRole('heading', { name: /Tổng quan|Bảng điều khiển/i }).first()).toBeVisible({ timeout: 15_000 });

    const token = await page.evaluate(() => localStorage.getItem('svp_token'));
    expect(token, 'admin login should store a JWT in localStorage').toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    await assertHealthyPage(page, '/quan-tri');
    expect(failures, 'admin login form should not throw runtime, asset, or HTTP failures').toEqual([]);
  });

  test('live UI can create a property through the real expert form and clean it up', async ({ page }) => {
    test.skip(process.env.SVP_LIVE_WRITE_WORKFLOW !== '1', 'Enable with SVP_LIVE_WRITE_WORKFLOW=1 only after live account and DB cleanup policy are confirmed.');
    const password = process.env.SVP_LIVE_EXPERT_PASSWORD || process.env.SVP_LIVE_ADMIN_PASSWORD;
    test.skip(!password, 'Set SVP_LIVE_EXPERT_PASSWORD or SVP_LIVE_ADMIN_PASSWORD before running live write workflow.');
    test.setTimeout(90_000);

    const username = process.env.SVP_LIVE_EXPERT_USERNAME || process.env.SVP_LIVE_ADMIN_USERNAME || 'admin';
    const failures = watchRuntimeFailures(page);
    const response = await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

    expect(response?.status(), '/sign-in should return HTTP 200').toBe(200);
    await waitForLiveApp(page);
    await page.locator('#identifier').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);

    if (/\/select-role$/.test(page.url())) {
      const expertRole = page.getByRole('button', { name: /Chuyên gia/i }).first();
      if (await expertRole.count()) {
        await expertRole.click();
        await page.waitForLoadState('networkidle').catch(() => undefined);
      }
    }

    await expect
      .poll(
        async () => page.evaluate(() => localStorage.getItem('svp_token') || ''),
        { timeout: 20_000, message: 'live write workflow should store a SVP token before opening the expert form' },
      )
      .toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    await page.goto('/chuyen-gia/dang-nha', { waitUntil: 'domcontentloaded' });
    await waitForLiveApp(page);
    // V1 final form smoke markers: Anh va tai lieu, Anh duyet noi bo, Anh cong khai.
    await expect(page.locator('body')).toContainText(/Ảnh và tài liệu|Ảnh duyệt nội bộ|Ảnh công khai/i);

    const stamp = Date.now();
    const visibleInputs = page.locator('input:visible');
    await visibleInputs.nth(0).fill(`Chu nha live ${stamp}`);
    await visibleInputs.nth(1).fill('0909000000');
    await visibleInputs.nth(2).fill(`LIVE-QA-${stamp} nha tao tu smoke`);
    await visibleInputs.nth(3).fill('TP.HCM');
    await visibleInputs.nth(4).fill('Thu Duc');
    await visibleInputs.nth(5).fill('Linh Trung');
    await visibleInputs.nth(6).fill('12 Duong QA');
    await visibleInputs.nth(8).fill(`SO-LIVE-${stamp}`);
    await visibleInputs.nth(10).fill('6800000000');
    await visibleInputs.nth(11).fill('72');
    await page.locator('textarea:visible').first().fill('Nguon live smoke tao nhanh de kiem tra luong Chuyen gia dang nha, se duoc xoa ngay sau khi tao.');
    await page.locator('textarea:visible').last().fill('AUTO LIVE SMOKE - xoa sau khi test.');

    const checkboxes = page.getByRole('checkbox');
    for (let i = 0; i < await checkboxes.count(); i += 1) {
      await checkboxes.nth(i).check();
    }

    await page.getByRole('button', { name: /Kiểm tra trùng/i }).click();
    await expect(page.locator('body')).toContainText(/Chưa thấy nguồn trùng|nguồn nghi trùng|Nguồn có dấu hiệu trùng/i);

    const createResponsePromise = page.waitForResponse((res) =>
      /\/api\/svp\/properties$/.test(new URL(res.url()).pathname) && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Gửi duyệt/i }).click();
    const createResponse = await createResponsePromise;
    const createJson = await createResponse.json().catch(() => null);
    const createdId = createJson?.data?.item?.id || createJson?.item?.id;

    await page.waitForURL(/\/chuyen-gia\/kho-nha$/, { timeout: 20_000 });
    await expect(page.locator('body')).toContainText(`LIVE-QA-${stamp}`);

    if (createdId) {
      const token = await page.evaluate(() => localStorage.getItem('svp_token'));
      await page.request.delete(`/api/svp/properties/${encodeURIComponent(createdId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    }

    await assertHealthyPage(page, '/chuyen-gia/dang-nha-live-write');
    expect(failures, 'live UI write workflow should not throw runtime, asset, or HTTP failures').toEqual([]);
  });
});
