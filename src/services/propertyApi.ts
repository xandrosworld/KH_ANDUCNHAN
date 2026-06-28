/**
 * Property & resource-specific API calls for So Do Van Phuc backend.
 *
 * Key design decisions:
 * - Public endpoints (list, detail) use admin=false → no auth token sent
 * - Admin endpoints (create, update, delete) use admin=true → JWT Bearer token
 * - List responses unwrap the nested { properties/inquiries/..., pagination } shape
 * - Mappers are applied in the service layer, not here
 */

import { apiFetch, apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiClient';
import type { Property } from '../data/properties';

// Re-export auth service for convenience
export { login, logout, isAuthenticated, getToken } from './authService';

function getStoredUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('gf_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: unknown };
    return typeof parsed.token === 'string' && parsed.token ? parsed.token : null;
  } catch {
    return null;
  }
}

function userAuthHeaders(): Record<string, string> {
  const token = getStoredUserToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Property API
// ---------------------------------------------------------------------------

export interface PropertyFilters {
  listingType?: string;
  status?: string;
  type?: string;
  isVip?: boolean;
  search?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  propertyType?: string;
  minSqft?: number;
  maxSqft?: number;
  page?: number;
  limit?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- Public property endpoints (no auth token) ---

export async function listPropertiesPublic(filters?: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
  }
  const query = params.toString();
  const path = `/api/properties${query ? `?${query}` : ''}`;
  const result = await apiGet<{ properties: Record<string, unknown>[]; pagination: PaginationInfo }>(path, false);
  // Unwrap nested response shape
  const rows = result.data?.properties ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as (Property & Record<string, unknown>)[] };
}

export function getPropertyPublic(id: string) {
  return apiGet<Property & Record<string, unknown>>(`/api/properties/${encodeURIComponent(id)}`, false);
}

// --- Admin property endpoints (with auth token) ---

export async function listPropertiesAdmin(filters?: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
  }
  const query = params.toString();
  const path = `/api/properties${query ? `?${query}` : ''}`;
  const result = await apiGet<{ properties: Record<string, unknown>[]; pagination: PaginationInfo }>(path, true);
  const rows = result.data?.properties ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as (Property & Record<string, unknown>)[] };
}

export async function listOwnProperties() {
  const result = await apiFetch<{ properties: Record<string, unknown>[]; pagination: PaginationInfo }>(
    '/api/user/properties',
    {
      method: 'GET',
      headers: userAuthHeaders(),
    },
    false,
  );
  const rows = result.data?.properties ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as (Property & Record<string, unknown>)[] };
}

/** @deprecated Use listPropertiesPublic or listPropertiesAdmin */
export const listProperties = listPropertiesPublic;

/** @deprecated Use getPropertyPublic */
export const getProperty = getPropertyPublic;

export function createProperty(data: Record<string, unknown>) {
  return apiPost<Property & Record<string, unknown>>('/api/properties', data, true);
}

export function updateProperty(id: string, data: Partial<Property & Record<string, unknown>>) {
  return apiPut<Property & Record<string, unknown>>(`/api/properties/${encodeURIComponent(id)}`, data, true);
}

export function updateOwnProperty(id: string, data: Record<string, unknown>) {
  return apiFetch<Property & Record<string, unknown>>(
    `/api/properties/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: userAuthHeaders(),
      body: JSON.stringify(data),
    },
    false,
  );
}

export function uploadOwnPropertyImages(id: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images[]', file));
  return apiFetch<Property & Record<string, unknown>>(
    `/api/user/properties/${encodeURIComponent(id)}/media`,
    { method: 'POST', headers: userAuthHeaders(), body: formData },
    false,
  );
}

export function deleteProperty(id: string) {
  return apiDelete(`/api/properties/${encodeURIComponent(id)}`, true);
}

export function togglePropertyVip(id: string) {
  return apiPatch(`/api/properties/${encodeURIComponent(id)}/vip`, {}, true);
}

export function updatePropertyStatus(id: string, status: string) {
  return apiPatch(`/api/properties/${encodeURIComponent(id)}/status`, { status }, true);
}

// ---------------------------------------------------------------------------
// Media upload (Admin only)
// ---------------------------------------------------------------------------

export interface UploadResponse {
  urls?: string[];
  video_url?: string | null;
  videoUrl?: string | null;
  count?: number;
}

export function uploadImages(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images[]', file));
  return apiFetch<UploadResponse | string[]>(
    '/api/uploads',
    { method: 'POST', body: formData },
    true,
  );
}

export function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('video', file);
  return apiFetch<UploadResponse>(
    '/api/uploads',
    { method: 'POST', body: formData },
    true,
  );
}

// ---------------------------------------------------------------------------
// Public Property Submit (no auth needed, status forced to pending)
// ---------------------------------------------------------------------------

export interface PublicSubmitData {
  title: string;
  listing_type: string;
  property_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  city: string;
  state: string;
  zip?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  youtube_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  x_url?: string;
  whatsapp_url?: string;
}

export interface PublicSubmitResult {
  id: string;
  status: string;
  mediaUploadToken?: string | null;
  message: string;
}

const PUBLIC_MEDIA_BATCH_SIZE = 10;

function uploadPublicPropertyMedia(
  propertyId: string,
  uploadToken: string,
  images: File[] = [],
  video?: File | null,
) {
  const formData = new FormData();
  formData.append('upload_token', uploadToken);
  images.forEach((file) => formData.append('images[]', file));
  if (video) {
    formData.append('video', video);
  }

  return apiFetch<UploadResponse>(
    `/api/public/properties/${encodeURIComponent(propertyId)}/media`,
    { method: 'POST', body: formData },
    false,
  );
}

/**
 * Submit a property listing as a public user.
 * Creates the listing first, then uploads media in small batches.
 * Backend forces status=pending and is_vip=0.
 */
export async function publicSubmitProperty(
  data: PublicSubmitData,
  images: File[],
  video?: File | null,
) {
  const formData = new FormData();

  // Append all text fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const createResult = await apiFetch<PublicSubmitResult>(
    '/api/public/submit',
    { method: 'POST', headers: userAuthHeaders(), body: formData },
    false, // no admin token
  );

  if (!createResult.ok || !createResult.data) {
    return createResult;
  }

  const hasMedia = images.length > 0 || Boolean(video);
  const uploadToken = createResult.data.mediaUploadToken;
  if (!hasMedia) {
    return createResult;
  }

  if (!uploadToken) {
    return {
      ok: false,
      error: 'Listing was created, but the server did not return a media upload token.',
    };
  }

  for (let i = 0; i < images.length; i += PUBLIC_MEDIA_BATCH_SIZE) {
    const batch = images.slice(i, i + PUBLIC_MEDIA_BATCH_SIZE);
    const mediaResult = await uploadPublicPropertyMedia(createResult.data.id, uploadToken, batch);
    if (!mediaResult.ok) {
      return {
        ok: false,
        error: `Listing was created, but image upload failed: ${mediaResult.error || 'Unknown upload error'}`,
      };
    }
  }

  if (video) {
    const videoResult = await uploadPublicPropertyMedia(createResult.data.id, uploadToken, [], video);
    if (!videoResult.ok) {
      return {
        ok: false,
        error: `Listing was created, but video upload failed: ${videoResult.error || 'Unknown upload error'}`,
      };
    }
  }

  return createResult;
}

// ---------------------------------------------------------------------------
// Inquiry API
// ---------------------------------------------------------------------------

export async function listInquiries() {
  const result = await apiGet<{ inquiries: Record<string, unknown>[]; pagination: PaginationInfo }>('/api/inquiries', true);
  const rows = result.data?.inquiries ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as Record<string, unknown>[] };
}

export function createInquiry(data: unknown) {
  return apiPost('/api/inquiries', data);
}

export function updateInquiryStatus(id: string, status: string) {
  return apiPatch(`/api/inquiries/${encodeURIComponent(id)}/status`, { status }, true);
}

export function deleteInquiry(id: string) {
  return apiDelete(`/api/inquiries/${encodeURIComponent(id)}`, true);
}

// ---------------------------------------------------------------------------
// Report API
// ---------------------------------------------------------------------------

export async function listReports() {
  const result = await apiGet<{ reports: Record<string, unknown>[]; pagination: PaginationInfo }>('/api/reports', true);
  const rows = result.data?.reports ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as Record<string, unknown>[] };
}

export function createReport(data: unknown) {
  return apiPost('/api/reports', data);
}

export function updateReportStatus(id: string, status: string) {
  return apiPatch(`/api/reports/${encodeURIComponent(id)}/status`, { status }, true);
}

export function deleteReport(id: string) {
  return apiDelete(`/api/reports/${encodeURIComponent(id)}`, true);
}

// ---------------------------------------------------------------------------
// Schedule API
// ---------------------------------------------------------------------------

export async function listSchedules() {
  const result = await apiGet<{ schedules: Record<string, unknown>[]; pagination: PaginationInfo }>('/api/schedules', true);
  const rows = result.data?.schedules ?? (Array.isArray(result.data) ? result.data : []);
  return { ...result, data: rows as Record<string, unknown>[] };
}

export function createSchedule(data: unknown) {
  return apiPost('/api/schedules', data);
}

export function updateScheduleStatus(id: string, status: string) {
  return apiPatch(`/api/schedules/${encodeURIComponent(id)}/status`, { status }, true);
}

export function deleteSchedule(id: string) {
  return apiDelete(`/api/schedules/${encodeURIComponent(id)}`, true);
}

// ---------------------------------------------------------------------------
// AI Description (proxy via backend)
// ---------------------------------------------------------------------------

export function generateAiDescription(data: Record<string, unknown>) {
  return apiPost<{ description: string }>('/api/ai/description', data, false);
}

export interface AiChatMessage {
  sender: string;
  text: string;
  timestamp?: string;
}

export function generateAiChatReply(data: { messages: AiChatMessage[]; lang?: string }) {
  return apiPost<{ reply: string }>('/api/ai/chat', data, false);
}
