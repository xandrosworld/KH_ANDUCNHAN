import { apiDelete, apiGet, apiPatch, apiPost, apiPut, getApiBase } from './apiClient';
import type { RecruitmentCandidate, RecruitmentPost, RecruitmentPositionSlug } from '../types/recruitment';

export type RecruitmentSource = {
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

export const recruitmentApi = {
  async listPublic() {
    return requireData(await apiGet<{ items: RecruitmentPost[]; total: number }>('/api/svp/recruitment'));
  },
  async getPublic(slug: string) {
    return requireData(await apiGet<{ item: RecruitmentPost }>(`/api/svp/recruitment/${encodeURIComponent(slug)}`)).item;
  },
  async applyExisting(slug: string, positionSlug: RecruitmentPositionSlug, source: RecruitmentSource) {
    return requireData(await apiPost<{ message: string; candidate: Pick<RecruitmentCandidate, 'id' | 'pipelineStatus'> }>(`/api/svp/recruitment/${encodeURIComponent(slug)}/apply`, { positionSlug, ...source }));
  },
  async applyNew(slug: string, input: Record<string, unknown>) {
    return requireData(await apiPost<{ message: string; token?: string; candidate: Pick<RecruitmentCandidate, 'id' | 'pipelineStatus'> }>(`/api/svp/recruitment/${encodeURIComponent(slug)}/apply-new`, input));
  },
  async listAdmin() {
    return requireData(await apiGet<{ items: RecruitmentPost[]; total: number }>('/api/svp/admin/recruitment-posts'));
  },
  async getAdmin(id: string) {
    return requireData(await apiGet<{ item: RecruitmentPost }>(`/api/svp/admin/recruitment-posts/${encodeURIComponent(id)}`)).item;
  },
  async create(input: Partial<RecruitmentPost>) {
    return requireData(await apiPost<{ item: RecruitmentPost }>('/api/svp/admin/recruitment-posts', input)).item;
  },
  async update(id: string, input: Partial<RecruitmentPost>) {
    return requireData(await apiPut<{ item: RecruitmentPost }>(`/api/svp/admin/recruitment-posts/${encodeURIComponent(id)}`, input)).item;
  },
  async listCandidates(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return requireData(await apiGet<{ items: RecruitmentCandidate[]; total: number }>(`/api/svp/admin/recruitment-candidates${query.size ? `?${query}` : ''}`));
  },
  async updateCandidate(id: string, pipelineStatus: RecruitmentCandidate['pipelineStatus'], note = '') {
    return requireData(await apiPatch<{ item: Pick<RecruitmentCandidate, 'id' | 'pipelineStatus' | 'note'> }>(`/api/svp/admin/recruitment-candidates/${encodeURIComponent(id)}`, { pipelineStatus, note }));
  },
  async deleteCandidate(id: string) {
    return requireData(await apiDelete<{ deleted: boolean; id: string }>(`/api/svp/admin/recruitment-candidates/${encodeURIComponent(id)}`));
  },
  async exportCandidates(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const token = window.localStorage.getItem('svp_token');
    const response = await fetch(`${getApiBase()}/api/svp/admin/recruitment-candidates/export${query.size ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || 'Chưa xuất được danh sách ứng viên.');
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `svp-recruitment-candidates-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  },
};
