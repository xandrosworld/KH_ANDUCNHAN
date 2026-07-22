import { expect, test } from '@playwright/test';

const event = {
  id: 'event_lam_nghe_moi_gioi_dung_luat',
  slug: 'lam-nghe-moi-gioi-dung-luat',
  title: 'Làm Nghề Môi Giới Đúng Luật - Thu Nhập Cao - Phát Triển Bền Vững',
  eyebrow: 'Sự kiện chia sẻ online hoàn toàn miễn phí',
  summary: 'Bí quyết xây dựng sự nghiệp môi giới chuyên nghiệp, minh bạch và bền vững.',
  speakerName: 'Mr Ân Đức Nhân',
  speakerTitle: 'Giám đốc Vạn Phúc - Sổ Đỏ',
  formatLabel: 'Online qua Zoom - Miễn phí',
  scheduleLabel: 'Lịch chính thức sẽ được thông báo trong nhóm Zalo',
  ctaLabel: 'Đăng ký tham dự miễn phí',
  bannerUrl: '/assets/events/lam-nghe-moi-gioi-dung-luat.png',
  sections: [{ key: 'intro', title: 'Làm đúng để đi xa', body: 'Nội dung chia sẻ thực tế.' }],
  disclaimer: 'Nội dung mang tính chia sẻ, không thay thế tư vấn chuyên biệt.',
  status: 'published',
  registrationStatus: 'open',
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/svp/events', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { items: [event], total: 1 } }) }));
  await page.route('**/api/svp/events/lam-nghe-moi-gioi-dung-luat', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { item: event } }) }));
});

test('standalone register contains no login or social providers', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByTestId('auth-register-card')).toBeVisible();
  await expect(page.getByTestId('auth-login-card')).toHaveCount(0);
  await expect(page.locator('[data-testid^="social-login-"]')).toHaveCount(0);
  await expect(page.getByTestId('auth-public-nav').getByRole('button', { name: 'Sự kiện' })).toBeVisible();
});

test('public event list and detail use the generated banner', async ({ page }) => {
  await page.goto('/su-kien');
  await expect(page.getByRole('heading', { name: event.title })).toBeVisible();
  await expect(page.locator(`img[src="${event.bannerUrl}"]`)).toBeVisible();
  await page.getByRole('link', { name: /Xem chi tiết/ }).click();
  await expect(page).toHaveURL(`/su-kien/${event.slug}`);
  await expect(page.getByRole('link', { name: event.ctaLabel }).first()).toBeVisible();
});

test('event registration page is a dedicated end-user form', async ({ page }) => {
  await page.goto(`/dang-ky-su-kien/${event.slug}?utm_source=qa&utm_campaign=event`);
  await expect(page.getByRole('heading', { name: event.title })).toBeVisible();
  await expect(page.getByPlaceholder('Họ và tên')).toBeVisible();
  await expect(page.getByText('Nhu cầu / vai trò của bạn')).toBeVisible();
  await expect(page.locator('[data-testid^="social-login-"]')).toHaveCount(0);
});

test('three public navigation pills remain separate on narrow screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  const buttons = ['Giới thiệu', 'Tin tức', 'Sự kiện'];
  const nav = page.getByTestId('auth-public-nav');
  const boxes = await Promise.all(buttons.map(async (name) => nav.getByRole('button', { name }).boundingBox()));
  expect(boxes.every(Boolean)).toBeTruthy();
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.x).toBeGreaterThanOrEqual(boxes[index - 1]!.x + boxes[index - 1]!.width - 1);
  }
  const support = await page.getByTestId('auth-support-toggle').boundingBox();
  expect(support!.x).toBeGreaterThanOrEqual(boxes[2]!.x + boxes[2]!.width);
});
