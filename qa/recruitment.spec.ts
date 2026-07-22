import { expect, test } from '@playwright/test';

const post = {
  id: 'recruitment_van_phuc_01',
  slug: 'tuyen-dung-moi-gioi-van-phuc',
  title: 'Tuyển Dụng Chuyên Viên, Cộng Tác Viên, Chuyên Gia Và Trưởng Phòng',
  eyebrow: 'Cơ hội nghề nghiệp tại Sổ Đỏ Vạn Phúc',
  summary: 'Ứng tuyển để được đội ngũ nhân sự liên hệ trực tiếp, xác nhận thông tin và hỗ trợ lựa chọn lộ trình phù hợp.',
  recruiterName: 'Mr Ân Đức Nhân',
  recruiterTitle: 'Giám đốc Vạn Phúc\nGiám đốc Phát triển Nhân lực - Sổ Đỏ Miền Nam',
  ctaLabel: 'Ứng tuyển ngay',
  bannerUrl: '/assets/recruitment/tuyen-dung-moi-gioi-van-phuc.jpg',
  sections: [
    { key: 'positions', title: 'Các vị trí đang tuyển', items: ['Chuyên viên / Cộng tác viên / Đầu khách', 'Chuyên gia / Đầu chủ', 'Trưởng phòng / Leader'] },
    { key: 'about', title: 'Môi trường làm nghề chuyên nghiệp', body: 'Sổ Đỏ hướng tới mô hình môi giới bất động sản chuyên nghiệp, minh bạch.' },
    { key: 'recruiter', title: 'Làm việc và phát triển cùng Mr Ân Đức Nhân', body: 'Gần 10 năm lãnh đạo, đào tạo và đồng hành.' },
    { key: 'development', title: 'Cơ hội dành cho người nghiêm túc', body: 'Khi được định hướng đúng, kết quả hoàn toàn có thể thay đổi.' },
    { key: 'process', title: 'Quy trình ứng tuyển', items: ['Gửi thông tin', 'Nhân sự liên hệ', 'Trao đổi định hướng'] },
  ],
  disclaimer: 'Thông tin tuyển dụng nhằm mục đích giới thiệu cơ hội nghề nghiệp.',
  status: 'published',
  applicationStatus: 'open',
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/svp/recruitment', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { items: [post], total: 1 } }) }));
  await page.route(`**/api/svp/recruitment/${post.slug}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { item: post } }) }));
});

test('recruitment list presents the real campaign and generated banner', async ({ page }) => {
  await page.goto('/tuyen-dung');
  await expect(page.getByRole('heading', { name: 'Tuyển dụng Sổ Đỏ Vạn Phúc' })).toBeVisible();
  await expect(page.getByRole('heading', { name: post.title })).toBeVisible();
  await expect(page.locator(`img[src="${post.bannerUrl}"]`)).toBeVisible();
  await page.getByRole('link', { name: /Xem vị trí/ }).click();
  await expect(page).toHaveURL(`/tuyen-dung/${post.slug}`);
});

test('recruitment detail displays complete forms at top middle and end', async ({ page }) => {
  await page.goto(`/tuyen-dung/${post.slug}`);
  await expect(page.getByRole('heading', { name: post.title })).toBeVisible();
  const forms = page.getByTestId('recruitment-application-form');
  await expect(forms).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expect(forms.nth(index).getByPlaceholder('Họ và tên')).toBeVisible();
    await expect(forms.nth(index).getByRole('button', { name: /Chuyên viên \/ Cộng tác viên \/ Đầu khách/ })).toBeVisible();
  }
});

test('new applicant submission preserves campaign source and chosen position', async ({ page }) => {
  let payload: Record<string, unknown> = {};
  await page.route(`**/api/svp/recruitment/${post.slug}/apply-new`, async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { message: 'Thành công', token: 'qa-token', candidate: { id: 'candidate-1', pipelineStatus: 'registered' } } }) });
  });
  await page.goto(`/tuyen-dung/${post.slug}?utm_source=facebook&utm_campaign=recruitment_launch`);
  const form = page.getByTestId('recruitment-application-form').first();
  await form.getByPlaceholder('Họ và tên').fill('QA Ứng Viên');
  await form.getByPlaceholder('Số điện thoại').fill('0900000099');
  await form.getByPlaceholder('Email').fill('qa-recruitment@sodovanphuc.vn');
  await form.getByPlaceholder('Mật khẩu (tối thiểu 6 ký tự)').fill('QaPass123!');
  await form.getByRole('button', { name: /Chuyên gia \/ Đầu chủ/ }).click();
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Ứng tuyển ngay', exact: true }).click();
  await expect(page.getByText('Ứng tuyển đã được ghi nhận').first()).toBeVisible();
  expect(payload.positionSlug).toBe('chuyen_gia');
  expect(payload.utmSource).toBe('facebook');
  expect(payload.utmCampaign).toBe('recruitment_launch');
  expect(String(payload.registrationUrl)).toContain(`/tuyen-dung/${post.slug}`);
});

test('mobile recruitment page has sticky action and no horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto(`/tuyen-dung/${post.slug}`);
  await expect(page.getByRole('button', { name: 'Ứng tuyển ngay', exact: true }).last()).toBeVisible();
  const sizes = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
});
