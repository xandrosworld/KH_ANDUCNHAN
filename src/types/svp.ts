export type SvpConfigGroupId =
  | 'company_units'
  | 'account_role_approval'
  | 'property_field_labels'
  | 'property_tags'
  | 'property_statuses'
  | 'visibility_levels'
  | 'signing_criteria'
  | 'price_segments'
  | 'customer_statuses';

export interface SvpConfigGroup {
  id: SvpConfigGroupId | string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isSystem: boolean;
  options: SvpConfigOption[];
}

export interface SvpConfigOption {
  id: string;
  groupId: SvpConfigGroupId | string;
  label: string;
  value: string;
  score?: number | null;
  metadata?: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SvpProperty {
  id: string;
  code: string;
  title: string;
  description?: string;
  ownerName?: string;
  ownerPhone?: string;
  bookSerial?: string;
  price: number;
  priceUnit: string;
  areaM2?: number | null;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  hiddenAddress?: string;
  companyUnitId?: string;
  statusId?: string;
  expertId?: string;
  assignedUserId?: string;
  signingScore: number;
  visibilityIds: string[];
  tagIds: string[];
  extra?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SvpPropertyTimelineEvent {
  id: number;
  propertyId: string;
  eventType: string;
  title: string;
  description?: string | null;
  actorId?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SvpPropertyVersion {
  id: number;
  propertyId: string;
  versionNo: number;
  snapshot: Record<string, unknown>;
  changedBy?: string | null;
  changeNote?: string | null;
  createdAt: string;
}

export interface SvpPropertyMedia {
  id: string;
  propertyId: string;
  mediaType: 'image' | 'video' | 'document' | 'other';
  url: string;
  caption?: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface SvpAuditLog {
  id: number;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SvpCustomer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  source?: string;
  statusId?: string;
  assignedUserId?: string;
  note?: string;
  createdAt?: string;
}

export interface SvpCustomerNeed {
  id: string;
  customerId: string;
  districtIds: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  tagIds: string[];
  description?: string;
  statusId?: string;
  createdAt?: string;
}

export interface SvpViewingSchedule {
  id: string;
  customerId?: string | null;
  propertyId?: string | null;
  scheduledAt?: string | null;
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  note?: string;
  createdAt?: string;
}

export interface SvpReferral {
  id: string;
  referrerUserId?: string | null;
  referredUserId?: string | null;
  referralCode: string;
  referralType: 'staff' | 'owner' | 'buyer' | 'partner' | 'other';
  status: 'new' | 'activated' | 'rejected';
  createdAt?: string;
}

export interface SvpCrudResult<T> {
  item: T;
}

export interface SvpListResult<T> {
  items: T[];
  total: number;
}
