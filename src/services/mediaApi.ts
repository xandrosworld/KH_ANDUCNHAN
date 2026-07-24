import { apiDelete, apiFetch, apiGet, apiPatch } from './apiClient';
import type { MediaItem, MediaListResponse } from '../types/media';

function requireData<T>(result: { ok: boolean; data?: T; error?: string }): T {
  if (!result.ok || !result.data) throw new Error(result.error || 'Yêu cầu chưa được xử lý.');
  return result.data;
}

export const mediaApi = {
  async list(filters: { q?: string; source?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (filters.q) query.set('q', filters.q);
    if (filters.source) query.set('source', filters.source);
    if (filters.page) query.set('page', String(filters.page));
    if (filters.limit) query.set('limit', String(filters.limit));
    return requireData(await apiGet<MediaListResponse>(`/api/svp/admin/media${query.size ? `?${query}` : ''}`));
  },

  async upload(files: File[], sourceContext = 'media_library') {
    const body = new FormData();
    files.forEach((file) => body.append('images[]', file));
    body.append('sourceContext', sourceContext);
    return requireData(await apiFetch<{ items: MediaItem[]; total: number }>('/api/svp/admin/media', {
      method: 'POST',
      body,
    }));
  },

  async update(id: string, input: Pick<MediaItem, 'title' | 'altText'>) {
    return requireData(await apiPatch<{ item: MediaItem }>(`/api/svp/admin/media/${encodeURIComponent(id)}`, input)).item;
  },

  async remove(id: string) {
    return requireData(await apiDelete<{ deleted: boolean; id: string }>(`/api/svp/admin/media/${encodeURIComponent(id)}`));
  },
};
