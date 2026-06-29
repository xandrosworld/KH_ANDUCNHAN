export const PROPERTY_STATUS_LABEL: Record<string, string> = {
  st_new: 'Mới đăng',
  new: 'Mới đăng',
  draft: 'Mới đăng',
  pending: 'Đang xử lý',
  st_active: 'Đang bán',
  active: 'Đang bán',
  st_deposit: 'Đã cọc',
  deposit: 'Đã cọc',
  st_sold: 'Đã bán',
  sold: 'Đã bán',
  st_paused: 'Tạm dừng',
  paused: 'Tạm dừng',
  st_hidden: 'Ẩn',
  hidden: 'Ẩn',
};

export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  cs_new: 'Mới',
  new: 'Mới',
  cs_contacted: 'Đã liên hệ',
  contacted: 'Đã liên hệ',
  cs_viewing: 'Đang dẫn xem',
  viewing: 'Đang dẫn xem',
  cs_deposit: 'Đã cọc',
  deposit: 'Đã cọc',
  cs_done: 'Hoàn thành',
  done: 'Hoàn thành',
  cs_lost: 'Không phù hợp',
  lost: 'Không phù hợp',
};

export function propertyStatusLabel(status?: string) {
  return PROPERTY_STATUS_LABEL[status || ''] || status || 'Mới đăng';
}

export function customerStatusLabel(status?: string) {
  return CUSTOMER_STATUS_LABEL[status || ''] || status || 'Mới';
}

export function isPropertyActive(status?: string) {
  return status === 'st_active' || status === 'active';
}

export function isPropertySold(status?: string) {
  return status === 'st_sold' || status === 'sold';
}

export function isPropertyPending(status?: string) {
  return !status || ['st_new', 'new', 'draft', 'pending'].includes(status);
}

export function formatVndShort(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Thỏa thuận';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return `${amount.toLocaleString('vi-VN')} VNĐ`;
}

export function areaText(item: any) {
  const area = item?.areaM2 ?? item?.area ?? item?.extra?.area;
  return area ? `${area}m²` : 'Chưa rõ DT';
}
