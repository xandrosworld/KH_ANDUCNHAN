import { apiDelete, apiFetch, apiGet, apiPost, apiPut, isApiConfigured } from './apiClient';
import { svpDefaultConfigGroups } from '../data/svpDefaults';
import type {
  SvpConfigGroup,
  SvpConfigOption,
  SvpCrudResult,
  SvpAuditLog,
  SvpCustomer,
  SvpCustomerNeed,
  SvpListResult,
  SvpProperty,
  SvpPropertyMedia,
  SvpPropertyTimelineEvent,
  SvpPropertyVersion,
  SvpReferral,
  SvpViewingSchedule,
} from '../types/svp';

const STORAGE_KEYS = {
  config: 'svp_config_groups',
  properties: 'svp_properties',
  customers: 'svp_customers',
  propertyTimeline: 'svp_property_timeline',
  propertyVersions: 'svp_property_versions',
  propertyMedia: 'svp_property_media',
  customerNeeds: 'svp_customer_needs',
  viewingSchedules: 'svp_viewing_schedules',
  referrals: 'svp_referrals',
  auditLogs: 'svp_audit_logs',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function appendLocalTimeline(event: Omit<SvpPropertyTimelineEvent, 'id' | 'createdAt'>) {
  const items = readJson<SvpPropertyTimelineEvent[]>(STORAGE_KEYS.propertyTimeline, []);
  const next: SvpPropertyTimelineEvent = {
    ...event,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.propertyTimeline, [next, ...items]);
}

function appendLocalVersion(property: SvpProperty, changeNote: string) {
  const items = readJson<SvpPropertyVersion[]>(STORAGE_KEYS.propertyVersions, []);
  const versionNo = items.filter((item) => item.propertyId === property.id).length + 1;
  const next: SvpPropertyVersion = {
    id: Date.now(),
    propertyId: property.id,
    versionNo,
    snapshot: { ...property },
    changeNote,
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.propertyVersions, [next, ...items]);
}

function appendLocalAudit(input: Omit<SvpAuditLog, 'id' | 'createdAt'>) {
  const items = readJson<SvpAuditLog[]>(STORAGE_KEYS.auditLogs, []);
  const next: SvpAuditLog = {
    ...input,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.auditLogs, [next, ...items]);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const svpApi = {
  async getConfig(): Promise<SvpConfigGroup[]> {
    if (isApiConfigured()) {
      const result = await apiGet<{ groups: SvpConfigGroup[] }>('/api/svp/config', false);
      if (result.ok && result.data?.groups) return result.data.groups;
    }

    return readJson(STORAGE_KEYS.config, svpDefaultConfigGroups);
  },

  async createConfigOption(input: Omit<SvpConfigOption, 'id'>): Promise<SvpConfigOption> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpConfigOption>>('/api/svp/config/options', input, true);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create config option');
    }

    const groups = readJson(STORAGE_KEYS.config, svpDefaultConfigGroups);
    const next: SvpConfigOption = { ...input, id: uid('opt') };
    const updated = groups.map((group) =>
      group.id === input.groupId ? { ...group, options: [...group.options, next] } : group
    );
    writeJson(STORAGE_KEYS.config, updated);
    return next;
  },

  async updateConfigOption(id: string, updates: Partial<SvpConfigOption>): Promise<SvpConfigOption> {
    if (isApiConfigured()) {
      const result = await apiPut<SvpCrudResult<SvpConfigOption>>(`/api/svp/config/options/${encodeURIComponent(id)}`, updates, true);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to update config option');
    }

    let updatedItem: SvpConfigOption | null = null;
    const groups = readJson(STORAGE_KEYS.config, svpDefaultConfigGroups).map((group) => ({
      ...group,
      options: group.options.map((option) => {
        if (option.id !== id) return option;
        updatedItem = { ...option, ...updates };
        return updatedItem;
      }),
    }));
    writeJson(STORAGE_KEYS.config, groups);
    if (!updatedItem) throw new Error('Config option not found');
    return updatedItem;
  },

  async deleteConfigOption(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiDelete(`/api/svp/config/options/${encodeURIComponent(id)}`, true);
      if (!result.ok) throw new Error(result.error || 'Failed to delete config option');
      return;
    }

    const groups = readJson(STORAGE_KEYS.config, svpDefaultConfigGroups).map((group) => ({
      ...group,
      options: group.options.filter((option) => option.id !== id),
    }));
    writeJson(STORAGE_KEYS.config, groups);
  },

  async reorderConfigOptions(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiPost('/api/svp/config/options/reorder', { items }, true);
      if (!result.ok) throw new Error(result.error || 'Failed to reorder config options');
      return;
    }

    const orderMap = new Map(items.map((item) => [item.id, item.sortOrder]));
    const groups = readJson(STORAGE_KEYS.config, svpDefaultConfigGroups).map((group) => ({
      ...group,
      options: group.options
        .map((option) => orderMap.has(option.id) ? { ...option, sortOrder: orderMap.get(option.id) || option.sortOrder } : option)
        .sort((first, second) => first.sortOrder - second.sortOrder),
    }));
    writeJson(STORAGE_KEYS.config, groups);
  },

  async lookupReferrer(lookup: string): Promise<{ id: string; fullName: string; svpId: string; phone: string; referralCode: string } | null> {
    const normalized = lookup.trim();
    if (!normalized || normalized.length < 3) return null;
    if (isApiConfigured()) {
      const result = await apiGet<{ item: { id: string; fullName: string; svpId: string; phone: string; referralCode: string } }>(
        `/api/svp/auth/referrer-lookup?lookup=${encodeURIComponent(normalized)}`,
        false,
      );
      if (result.ok && result.data?.item) return result.data.item;
      return null;
    }

    return null;
  },

  async getMySystem(): Promise<{
    user: { id: string; fullName: string; phone: string; email: string; svpId: string; referralCode: string; referralLink: string };
    directReferrals: Array<{ id: string; fullName: string; phone: string; email: string; svpId: string; referralCode: string; accountStatus: string; createdAt: string }>;
    directReferralCount: number;
    indirectReferralCount: number;
  }> {
    if (isApiConfigured()) {
      const result = await apiGet<any>('/api/svp/my-system', false);
      if (result.ok && result.data) return result.data;
    }

    return {
      user: { id: '', fullName: '', phone: '', email: '', svpId: '', referralCode: '', referralLink: '' },
      directReferrals: [],
      directReferralCount: 0,
      indirectReferralCount: 0,
    };
  },

  async listProperties(filters?: Record<string, string | number | boolean | undefined>): Promise<SvpListResult<SvpProperty>> {
    if (isApiConfigured()) {
      const params = new URLSearchParams();
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value));
      });
      const result = await apiGet<SvpListResult<SvpProperty>>(`/api/svp/properties${params.toString() ? `?${params}` : ''}`, false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpProperty[]>(STORAGE_KEYS.properties, []);
    return { items, total: items.length };
  },

  async getProperty(id: string): Promise<SvpProperty | null> {
    if (isApiConfigured()) {
      const result = await apiGet<SvpCrudResult<SvpProperty>>(`/api/svp/properties/${encodeURIComponent(id)}`, false);
      if (result.ok && result.data?.item) return result.data.item;
    }

    const items = readJson<SvpProperty[]>(STORAGE_KEYS.properties, []);
    return items.find((item) => item.id === id || item.code === id) || null;
  },

  async createProperty(input: Omit<SvpProperty, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<SvpProperty> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpProperty>>('/api/svp/properties', input, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create property');
    }

    const items = readJson<SvpProperty[]>(STORAGE_KEYS.properties, []);
    const item: SvpProperty = {
      ...input,
      id: uid('prop'),
      code: `SVP${String(items.length + 1).padStart(6, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeJson(STORAGE_KEYS.properties, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'property', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    appendLocalVersion(item, 'Tạo mới nhà');
    appendLocalTimeline({
      propertyId: item.id,
      eventType: 'created',
      title: 'Tạo mới nhà',
      description: 'Tin nhà được tạo từ form Sổ Đỏ Vạn Phúc',
      payload: { code: item.code },
    });
    return item;
  },

  async updateProperty(id: string, updates: Partial<SvpProperty>): Promise<SvpProperty> {
    if (isApiConfigured()) {
      const result = await apiPut<SvpCrudResult<SvpProperty>>(`/api/svp/properties/${encodeURIComponent(id)}`, updates, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to update property');
    }

    const items = readJson<SvpProperty[]>(STORAGE_KEYS.properties, []);
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) throw new Error('Property not found');
    const nextItem: SvpProperty = { ...currentItem, ...updates, updatedAt: new Date().toISOString() };
    const nextItems = items.map((item) => (item.id === id ? nextItem : item));
    writeJson(STORAGE_KEYS.properties, nextItems);
    appendLocalAudit({
      action: 'update',
      entityType: 'property',
      entityId: nextItem.id,
      oldValue: currentItem as unknown as Record<string, unknown>,
      newValue: nextItem as unknown as Record<string, unknown>,
    });
    appendLocalVersion(nextItem, 'Cập nhật thông tin nhà');
    appendLocalTimeline({
      propertyId: nextItem.id,
      eventType: 'updated',
      title: 'Cập nhật thông tin nhà',
      description: updates.statusId ? 'Có thay đổi trạng thái nhà' : 'Có thay đổi thông tin chi tiết',
      payload: updates as Record<string, unknown>,
    });
    return nextItem;
  },

  async getPropertyTimeline(id: string): Promise<SvpPropertyTimelineEvent[]> {
    if (!isApiConfigured()) {
      return readJson<SvpPropertyTimelineEvent[]>(STORAGE_KEYS.propertyTimeline, [])
        .filter((item) => item.propertyId === id);
    }
    const result = await apiGet<{ items: SvpPropertyTimelineEvent[] }>(`/api/svp/properties/${encodeURIComponent(id)}/timeline`, false);
    return result.ok && result.data?.items ? result.data.items : [];
  },

  async getPropertyVersions(id: string): Promise<SvpPropertyVersion[]> {
    if (!isApiConfigured()) {
      return readJson<SvpPropertyVersion[]>(STORAGE_KEYS.propertyVersions, [])
        .filter((item) => item.propertyId === id);
    }
    const result = await apiGet<{ items: SvpPropertyVersion[] }>(`/api/svp/properties/${encodeURIComponent(id)}/versions`, false);
    return result.ok && result.data?.items ? result.data.items : [];
  },

  async listPropertyMedia(id: string): Promise<SvpPropertyMedia[]> {
    if (isApiConfigured()) {
      const result = await apiGet<{ items: SvpPropertyMedia[] }>(`/api/svp/properties/${encodeURIComponent(id)}/media`, false);
      if (result.ok && result.data?.items) return result.data.items;
    }

    return readJson<SvpPropertyMedia[]>(STORAGE_KEYS.propertyMedia, [])
      .filter((item) => item.propertyId === id)
      .sort((first, second) => (first.sortOrder || 0) - (second.sortOrder || 0));
  },

  async createPropertyMedia(input: Omit<SvpPropertyMedia, 'id' | 'createdAt'>): Promise<SvpPropertyMedia> {
    if (isApiConfigured() && !input.url.startsWith('data:')) {
      const result = await apiPost<SvpCrudResult<SvpPropertyMedia>>(
        `/api/svp/properties/${encodeURIComponent(input.propertyId)}/media`,
        input,
        false,
      );
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create property media');
    }

    const items = readJson<SvpPropertyMedia[]>(STORAGE_KEYS.propertyMedia, []);
    const item: SvpPropertyMedia = { ...input, id: uid('media'), createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.propertyMedia, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'property_media', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    return item;
  },

  async uploadPropertyMediaImages(propertyId: string, files: File[], caption: string, category = 'property_image'): Promise<SvpPropertyMedia[]> {
    if (files.length === 0) return [];

    if (isApiConfigured()) {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('category', category);
      files.forEach((file) => formData.append('images[]', file));
      const result = await apiFetch<{ items: SvpPropertyMedia[] }>(
        `/api/svp/properties/${encodeURIComponent(propertyId)}/media-upload`,
        { method: 'POST', body: formData },
        false,
      );
      if (result.ok && result.data?.items) return result.data.items;
      throw new Error(result.error || 'Failed to upload property images');
    }

    const items = await Promise.all(files.map(async (file, index) => {
      const dataUrl = await readFileAsDataUrl(file);
      return this.createPropertyMedia({
        propertyId,
        mediaType: 'image',
        url: dataUrl,
        caption: files.length > 1 ? `${caption} #${index + 1}` : caption,
        sortOrder: index + 1,
      });
    }));
    appendLocalTimeline({
      propertyId,
      eventType: 'media_uploaded',
      title: 'Upload anh / tai lieu',
      description: caption,
      payload: { category, count: items.length },
    });
    return items;
  },

  async listCustomers(): Promise<SvpListResult<SvpCustomer>> {
    if (isApiConfigured()) {
      const result = await apiGet<SvpListResult<SvpCustomer>>('/api/svp/customers', false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpCustomer[]>(STORAGE_KEYS.customers, []);
    return { items, total: items.length };
  },

  async createCustomer(input: Omit<SvpCustomer, 'id' | 'createdAt'>): Promise<SvpCustomer> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpCustomer>>('/api/svp/customers', input, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create customer');
    }

    const items = readJson<SvpCustomer[]>(STORAGE_KEYS.customers, []);
    const item: SvpCustomer = { ...input, id: uid('cus'), createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.customers, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'customer', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    return item;
  },

  async listCustomerNeeds(customerId?: string): Promise<SvpListResult<SvpCustomerNeed>> {
    if (isApiConfigured()) {
      const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
      const result = await apiGet<SvpListResult<SvpCustomerNeed>>(`/api/svp/customer-needs${query}`, false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpCustomerNeed[]>(STORAGE_KEYS.customerNeeds, [])
      .filter((item) => !customerId || item.customerId === customerId);
    return { items, total: items.length };
  },

  async createCustomerNeed(input: Omit<SvpCustomerNeed, 'id' | 'createdAt'>): Promise<SvpCustomerNeed> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpCustomerNeed>>('/api/svp/customer-needs', input, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create customer need');
    }

    const items = readJson<SvpCustomerNeed[]>(STORAGE_KEYS.customerNeeds, []);
    const item: SvpCustomerNeed = { ...input, id: uid('need'), createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.customerNeeds, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'customer_need', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    return item;
  },

  async listViewingSchedules(): Promise<SvpListResult<SvpViewingSchedule>> {
    if (isApiConfigured()) {
      const result = await apiGet<SvpListResult<SvpViewingSchedule>>('/api/svp/viewing-schedules', false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpViewingSchedule[]>(STORAGE_KEYS.viewingSchedules, []);
    return { items, total: items.length };
  },

  async createViewingSchedule(input: Omit<SvpViewingSchedule, 'id' | 'createdAt'>): Promise<SvpViewingSchedule> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpViewingSchedule>>('/api/svp/viewing-schedules', input, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create viewing schedule');
    }

    const items = readJson<SvpViewingSchedule[]>(STORAGE_KEYS.viewingSchedules, []);
    const item: SvpViewingSchedule = { ...input, id: uid('view'), createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.viewingSchedules, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'viewing_schedule', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    return item;
  },

  async listReferrals(): Promise<SvpListResult<SvpReferral>> {
    if (isApiConfigured()) {
      const result = await apiGet<SvpListResult<SvpReferral>>('/api/svp/referrals', false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpReferral[]>(STORAGE_KEYS.referrals, []);
    return { items, total: items.length };
  },

  async createReferral(input: Omit<SvpReferral, 'id' | 'createdAt'>): Promise<SvpReferral> {
    if (isApiConfigured()) {
      const result = await apiPost<SvpCrudResult<SvpReferral>>('/api/svp/referrals', input, false);
      if (result.ok && result.data?.item) return result.data.item;
      throw new Error(result.error || 'Failed to create referral');
    }

    const items = readJson<SvpReferral[]>(STORAGE_KEYS.referrals, []);
    const item: SvpReferral = { ...input, id: uid('ref'), createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.referrals, [item, ...items]);
    appendLocalAudit({ action: 'create', entityType: 'referral', entityId: item.id, newValue: item as unknown as Record<string, unknown> });
    return item;
  },

  async listAuditLogs(): Promise<SvpListResult<SvpAuditLog>> {
    if (isApiConfigured()) {
      const result = await apiGet<SvpListResult<SvpAuditLog>>('/api/svp/audit-logs', false);
      if (result.ok && result.data) return result.data;
    }

    const items = readJson<SvpAuditLog[]>(STORAGE_KEYS.auditLogs, []);
    return { items, total: items.length };
  },

  async deleteLocalProperty(id: string): Promise<void> {
    if (isApiConfigured()) {
      await apiDelete(`/api/svp/properties/${encodeURIComponent(id)}`, false);
      return;
    }
    writeJson(STORAGE_KEYS.properties, readJson<SvpProperty[]>(STORAGE_KEYS.properties, []).filter((item) => item.id !== id));
  },

  async hideConfigOption(id: string): Promise<void> {
    await this.updateConfigOption(id, { isActive: false });
  },
};
