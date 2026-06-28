/**
 * API client for the So Do Van Phuc PHP backend.
 *
 * Deployment modes:
 * - Same domain: leave VITE_API_BASE_URL empty and calls go to relative /api/*.
 * - API subdomain: set VITE_API_BASE_URL=https://api.sodovanphuc.vn.
 *
 * Authentication:
 * - Admin requests use JWT Bearer token from authService (stored in sessionStorage)
 * - No secrets are bundled into the frontend JS.
 */

import { getToken } from './authService';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const isProduction = typeof window !== 'undefined' && !LOCAL_HOSTS.includes(window.location.hostname);
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function isApiConfigured(): boolean {
  // In production, an empty API base intentionally means same-domain /api/*.
  if (isProduction) return true;
  return Boolean(API_BASE.trim());
}

export function getApiBase(): string {
  return API_BASE;
}

/** Kept for older imports; So Do Van Phuc stores usable public URLs directly. */
export function toProxyUrl(url: string | undefined | null): string {
  return url || '';
}

/** Kept as a no-op so legacy services do not mutate uploaded media URLs. */
function deepProxyUrls<T>(obj: T): T {
  return obj;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  admin = false,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const url = `${getApiBase()}${path}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (admin) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers });

  let json: { ok?: boolean; data?: T; error?: string };
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: `HTTP ${response.status}: ${response.statusText || 'Invalid API response'}`,
    };
  }

  if (!response.ok && json.ok !== false) {
    return {
      ok: false,
      error: json.error || `HTTP ${response.status}: ${response.statusText || 'API request failed'}`,
    };
  }

  return deepProxyUrls(json) as { ok: boolean; data?: T; error?: string };
}

export const apiGet = <T>(path: string, admin = false) =>
  apiFetch<T>(path, { method: 'GET' }, admin);

export const apiPost = <T>(path: string, body: unknown, admin = false) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, admin);

export const apiPut = <T>(path: string, body: unknown, admin = false) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }, admin);

export const apiPatch = <T>(path: string, body: unknown, admin = false) =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, admin);

export const apiDelete = <T>(path: string, admin = false) =>
  apiFetch<T>(path, { method: 'DELETE' }, admin);
