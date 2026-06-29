import type { SvpConfigGroup } from '../types/svp';

export function propertyFieldLabel(groups: SvpConfigGroup[], key: string, fallback: string) {
  const option = groups
    .find((group) => group.id === 'property_field_labels')
    ?.options
    .find((item) => item.value === key && item.isActive !== false);

  return option?.label?.trim() || fallback;
}
