import { apiFetch, apiGet, apiPatch, apiPost, apiPut, getApiBase } from './apiClient';
import type { EventRegistration, SvpEvent } from '../types/events';

export type EventSource = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrerUrl?: string;
  registrationUrl?: string;
};

function requireData<T>(result: { ok: boolean; data?: T; error?: string }): T {
  if (!result.ok || !result.data) throw new Error(result.error || 'Yêu cầu chưa được xử lý.');
  return result.data;
}

export const eventApi = {
  async listPublic() {
    return requireData(await apiGet<{ items: SvpEvent[]; total: number }>('/api/svp/events'));
  },
  async getPublic(slug: string) {
    return requireData(await apiGet<{ item: SvpEvent }>(`/api/svp/events/${encodeURIComponent(slug)}`)).item;
  },
  async registerExisting(slug: string, source: EventSource) {
    return requireData(await apiPost<{ message: string }>(`/api/svp/events/${encodeURIComponent(slug)}/register`, source));
  },
  async registerNew(slug: string, input: Record<string, unknown>) {
    return requireData(await apiPost<{ message: string }>(`/api/svp/events/${encodeURIComponent(slug)}/register-new`, input));
  },
  async listAdmin() {
    return requireData(await apiGet<{ items: SvpEvent[]; total: number }>('/api/svp/admin/events'));
  },
  async getAdmin(id: string) {
    return requireData(await apiGet<{ item: SvpEvent }>(`/api/svp/admin/events/${encodeURIComponent(id)}`)).item;
  },
  async create(input: Partial<SvpEvent>) {
    return requireData(await apiPost<{ item: SvpEvent }>('/api/svp/admin/events', input)).item;
  },
  async update(id: string, input: Partial<SvpEvent>) {
    return requireData(await apiPut<{ item: SvpEvent }>(`/api/svp/admin/events/${encodeURIComponent(id)}`, input)).item;
  },
  async listRegistrations(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return requireData(await apiGet<{ items: EventRegistration[]; total: number }>(`/api/svp/admin/event-registrations${query.size ? `?${query}` : ''}`));
  },
  async updateRegistration(id: string, careStatus: EventRegistration['careStatus'], note = '') {
    return requireData(await apiPatch<{ item: Pick<EventRegistration, 'id' | 'careStatus'> }>(`/api/svp/admin/event-registrations/${encodeURIComponent(id)}`, { careStatus, note }));
  },
  async exportRegistrations(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const token = window.localStorage.getItem('svp_token');
    const response = await fetch(`${getApiBase()}/api/svp/admin/event-registrations/export${query.size ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Chưa xuất được danh sách đăng ký.');
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `svp-event-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },
  async uploadBranding(kind: 'logo' | 'banner', file: File) {
    const body = new FormData();
    body.append('kind', kind);
    body.append('image', file);
    return requireData(await apiFetch<{ kind: string; url: string }>('/api/svp/admin/branding/upload', { method: 'POST', body }));
  },
  async resetBranding(kind: 'logo' | 'banner') {
    return requireData(await apiPost<{ kind: string; url: string }>('/api/svp/admin/branding/reset', { kind }));
  },
};
