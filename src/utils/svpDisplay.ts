import type { SvpConfigGroup, SvpConfigOption } from '../types/svp';

export function activeOptions(groups: SvpConfigGroup[], groupId: string): SvpConfigOption[] {
  return (groups.find((group) => group.id === groupId)?.options || [])
    .filter((option) => option.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export function optionLabel(groups: SvpConfigGroup[], groupId: string, optionId?: string | null): string {
  if (!optionId) return '-';
  const option = groups
    .find((group) => group.id === groupId)
    ?.options.find((item) => item.id === optionId || item.value === optionId);
  return option?.label || optionId;
}

export function optionLabels(groups: SvpConfigGroup[], groupId: string, optionIds: string[]): string[] {
  return optionIds.map((id) => optionLabel(groups, groupId, id)).filter((label) => label !== '-');
}

export function formatVnd(value?: number | null): string {
  if (!value) return '0 VND';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  }
  return value.toLocaleString('vi-VN');
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function toSlugValue(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
