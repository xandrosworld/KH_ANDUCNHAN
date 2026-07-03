import type { SvpConfigGroup } from '../types/svp';

const lockedPropertyFields = new Set(['ownerName', 'ownerPhone', 'title', 'province', 'district', 'ward', 'price', 'description', 'houseImages']);

function propertyFieldOption(groups: SvpConfigGroup[], key: string) {
  return groups
    .find((group) => group.id === 'property_field_labels')
    ?.options
    .find((item) => item.value === key);
}

export function propertyFieldLabel(groups: SvpConfigGroup[], key: string, fallback: string) {
  const option = propertyFieldOption(groups, key);

  return option?.label?.trim() || fallback;
}

export function propertyFieldVisible(groups: SvpConfigGroup[], key: string) {
  if (lockedPropertyFields.has(key)) return true;
  const option = propertyFieldOption(groups, key);
  return option ? option.isActive !== false : true;
}
