import { apiDelete, apiFetch, apiGet, apiPatch, apiPost, apiPut } from './apiClient';

type QueryValue = string | number | boolean | null | undefined;

function withSvpPrefix(path: string): string {
  return path.startsWith('/api/svp') ? path : `/api/svp${path.startsWith('/') ? path : `/${path}`}`;
}

function withQuery(path: string, params?: Record<string, QueryValue>): string {
  if (!params) return path;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path;
}

function ensureData<T>(result: { ok: boolean; data?: T; error?: string }): T {
  if (!result.ok) throw new Error(result.error || 'Yêu cầu không thành công');
  return result.data as T;
}

export async function svpGet<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  return ensureData(await apiGet<T>(withSvpPrefix(withQuery(path, params))));
}

export async function svpPost<T>(path: string, body: unknown): Promise<T> {
  return ensureData(await apiPost<T>(withSvpPrefix(path), body));
}

export async function svpPut<T>(path: string, body: unknown): Promise<T> {
  return ensureData(await apiPut<T>(withSvpPrefix(path), body));
}

export async function svpPatch<T>(path: string, body: unknown): Promise<T> {
  return ensureData(await apiPatch<T>(withSvpPrefix(path), body));
}

export async function svpDelete<T>(path: string): Promise<T> {
  return ensureData(await apiDelete<T>(withSvpPrefix(path)));
}

export async function svpUpload<T>(path: string, formData: FormData): Promise<T> {
  return ensureData(await apiFetch<T>(withSvpPrefix(path), { method: 'POST', body: formData }));
}
