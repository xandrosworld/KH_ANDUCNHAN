import { BriefcaseBusiness, Check, Download, Eye, Info, Loader2, Plus, Save, Search, Trash2, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { RECRUITMENT_POSITIONS, type RecruitmentCandidate, type RecruitmentPost } from '../../types/recruitment';

const pipelineLabels: Record<RecruitmentCandidate['pipelineStatus'], string> = {
  registered: 'Mới đăng ký', contacted: 'Đã liên hệ', interview: 'Phỏng vấn', training: 'Đào tạo', activated: 'Đã kích hoạt', active: 'Đang hoạt động', rejected: 'Không phù hợp',
};
const postStatuses: Record<RecruitmentPost['status'], string> = { draft: 'Bản nháp', published: 'Công khai', hidden: 'Đang ẩn', archived: 'Lưu trữ' };

export default function AdminRecruitmentPage() {
  const [tab, setTab] = useState<'posts' | 'candidates'>('posts');
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [editing, setEditing] = useState<RecruitmentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ q: '', postId: '', status: '', position: '', utmSource: '' });

  const loadPosts = async () => { setLoading(true); try { const data = await recruitmentApi.listAdmin(); setPosts(data.items); } catch (error: any) { setMessage(error.message); } finally { setLoading(false); } };
  const loadCandidates = useCallback(async () => { setLoading(true); try { const data = await recruitmentApi.listCandidates(filters); setCandidates(data.items); } catch (error: any) { setCandidates([]); setMessage(error.message); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { void loadPosts(); }, []);
  useEffect(() => { if (tab === 'candidates') void loadCandidates(); }, [loadCandidates, tab]);

  const emptyPost = useMemo(() => ({
    id: '', slug: '', title: '', eyebrow: 'Cơ hội nghề nghiệp tại Sổ Đỏ Vạn Phúc', summary: '', recruiterName: 'Mr Ân Đức Nhân', recruiterTitle: 'Giám đốc Vạn Phúc\nGiám đốc Phát triển Nhân lực - Sổ Đỏ Miền Nam', ctaLabel: 'Ứng tuyển ngay', bannerUrl: '', sections: [], disclaimer: 'Thông tin tuyển dụng nhằm mục đích giới thiệu cơ hội nghề nghiệp. Vị trí, quyền lợi và lộ trình cụ thể sẽ được trao đổi trực tiếp trong quá trình xác nhận ứng tuyển.', status: 'draft', applicationStatus: 'open',
  } as RecruitmentPost), []);
  const patchPost = (updates: Partial<RecruitmentPost>) => setEditing((current) => ({ ...(current || emptyPost), ...updates }));

  const save = async () => {
    if (!editing?.title.trim() || !editing.slug.trim()) return setMessage('Vui lòng nhập tiêu đề và slug bài tuyển dụng.');
    setSaving(true); setMessage('');
    try {
      const item = editing.id ? await recruitmentApi.update(editing.id, editing) : await recruitmentApi.create(editing);
      setEditing(item); setMessage('Đã lưu bài tuyển dụng.'); await loadPosts();
    } catch (error: any) { setMessage(error.message || 'Chưa lưu được bài tuyển dụng.'); }
    finally { setSaving(false); }
  };

  const updateCandidate = async (candidate: RecruitmentCandidate, updates: Partial<Pick<RecruitmentCandidate, 'pipelineStatus' | 'note'>>) => {
    const next = { ...candidate, ...updates };
    setCandidates((items) => items.map((item) => item.id === candidate.id ? next : item));
    try { await recruitmentApi.updateCandidate(candidate.id, next.pipelineStatus, next.note || ''); }
    catch (error: any) { setMessage(error.message || 'Chưa cập nhật được ứng viên.'); await loadCandidates(); }
  };

  const exportCandidates = async () => {
    if (exporting) return;
    setExporting(true); setMessage('');
    try { await recruitmentApi.exportCandidates(filters); }
    catch (error: any) { setMessage(error.message || 'Chưa xuất được danh sách ứng viên.'); }
    finally { setExporting(false); }
  };

  return (
    <div className="min-w-0 pb-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase text-[#c40012]">Quản trị nội dung</div><h1 className="mt-1 text-2xl font-black text-[#25202a]">Tuyển dụng và ứng viên</h1></div><div className="inline-flex rounded-lg border border-gray-200 bg-white p-1"><Tab active={tab === 'posts'} onClick={() => setTab('posts')} icon={BriefcaseBusiness} label="Bài tuyển dụng" /><Tab active={tab === 'candidates'} onClick={() => setTab('candidates')} icon={UserRound} label="Ứng viên" /></div></div>
      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{message}</div> : null}
      {tab === 'posts' ? <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-950"><Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><span>Khách có thể sửa toàn bộ nội dung tại đây. Form ứng tuyển được hệ thống tự đặt ở <strong>đầu, giữa và cuối bài</strong>; CTA trên điện thoại luôn dẫn về form đầu tiên.</span></div> : null}

      {tab === 'posts' ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <button type="button" onClick={() => setEditing({ ...emptyPost })} className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white"><Plus className="h-4 w-4" />Tạo bài tuyển dụng</button>
            {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#c40012]" /> : <div className="space-y-2">{posts.map((post) => <button key={post.id} type="button" onClick={() => setEditing(post)} className={`w-full rounded-lg border px-3 py-3 text-left ${editing?.id === post.id ? 'border-[#c40012] bg-red-50' : 'border-gray-200'}`}><div className="text-sm font-black leading-5">{post.title}</div><div className="mt-2 flex items-center justify-between text-xs font-bold text-[#6d6670]"><span>{postStatuses[post.status]}</span><span>{post.candidateCount || 0} ứng viên</span></div></button>)}</div>}
          </section>
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {!editing ? <div className="grid min-h-64 place-items-center text-center text-sm font-semibold text-[#77717a]">Chọn một bài để chỉnh sửa hoặc tạo bài tuyển dụng mới.</div> : <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">{editing.id ? 'Chỉnh sửa bài tuyển dụng' : 'Bài tuyển dụng mới'}</h2><div className="flex gap-2">{editing.id ? <a href={`/tuyen-dung/${editing.id}?preview=1`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-black"><Eye className="h-4 w-4" />Xem trước</a> : null}<button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#c40012] px-4 text-xs font-black text-white">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Lưu</button></div></div>
              <div className="grid gap-3 md:grid-cols-2"><AdminField label="Tiêu đề" value={editing.title} onChange={(value) => patchPost({ title: value })} wide /><AdminField label="Slug URL" value={editing.slug} onChange={(value) => patchPost({ slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /><AdminField label="Nhãn" value={editing.eyebrow} onChange={(value) => patchPost({ eyebrow: value })} /><AdminField label="Người phụ trách" value={editing.recruiterName} onChange={(value) => patchPost({ recruiterName: value })} /><AdminField label="Chức danh" value={editing.recruiterTitle} onChange={(value) => patchPost({ recruiterTitle: value })} /><AdminField label="CTA" value={editing.ctaLabel} onChange={(value) => patchPost({ ctaLabel: value })} help="Áp dụng cho toàn bộ form và nút ứng tuyển." /><AdminField label="URL banner" value={editing.bannerUrl} onChange={(value) => patchPost({ bannerUrl: value })} wide /><label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Mô tả ngắn</span><textarea value={editing.summary} onChange={(event) => patchPost({ summary: event.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c40012]" /></label></div>
              <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Hiển thị</span><select value={editing.status} onChange={(event) => patchPost({ status: event.target.value as RecruitmentPost['status'] })} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="draft">Bản nháp</option><option value="published">Công khai</option><option value="hidden">Ẩn</option><option value="archived">Lưu trữ</option></select></label><label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Nhận hồ sơ</span><select value={editing.applicationStatus} onChange={(event) => patchPost({ applicationStatus: event.target.value as RecruitmentPost['applicationStatus'] })} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="open">Đang mở</option><option value="closed">Đã đóng</option></select></label></div>
              <div><div className="mb-2 flex items-center justify-between gap-3"><div className="text-sm font-black">Nội dung bài tuyển dụng</div><button type="button" onClick={() => patchPost({ sections: [...editing.sections, { key: `section-${Date.now()}`, title: 'Phần nội dung mới', body: '' }] })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-black text-[#c40012]"><Plus className="h-3.5 w-3.5" />Thêm phần</button></div><div className="space-y-3">{editing.sections.map((section, index) => <div key={section.key || index} className="rounded-lg border border-gray-200 p-3"><div className="flex gap-2"><input value={section.title} onChange={(event) => patchPost({ sections: editing.sections.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} className="h-10 min-w-0 flex-1 border-b border-gray-200 text-sm font-black outline-none" /><button type="button" onClick={() => patchPost({ sections: editing.sections.filter((_, itemIndex) => itemIndex !== index) })} title="Xóa phần" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div><textarea value={section.body || (section.items || []).join('\n')} onChange={(event) => patchPost({ sections: editing.sections.map((item, itemIndex) => itemIndex === index ? (item.items ? { ...item, items: event.target.value.split('\n').filter(Boolean) } : { ...item, body: event.target.value }) : item) })} rows={5} className="mt-2 w-full text-sm font-medium leading-6 outline-none" /></div>)}</div></div>
              <label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Ghi chú</span><textarea value={editing.disclaimer} onChange={(event) => patchPost({ disclaimer: event.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>
            </div>}
          </section>
        </div>
      ) : (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 grid gap-2 xl:grid-cols-[1fr_220px_170px_190px_150px_auto]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Tên, email, điện thoại" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm font-semibold" /></label><select value={filters.postId} onChange={(event) => setFilters({ ...filters, postId: event.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="">Tất cả bài</option>{posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}</select><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="">Tất cả trạng thái</option>{Object.entries(pipelineLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={filters.position} onChange={(event) => setFilters({ ...filters, position: event.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="">Tất cả vị trí</option>{RECRUITMENT_POSITIONS.map((position) => <option key={position.slug} value={position.slug}>{position.label}</option>)}</select><input value={filters.utmSource} onChange={(event) => setFilters({ ...filters, utmSource: event.target.value })} placeholder="UTM source" className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold" /><div className="flex gap-2"><button type="button" onClick={loadCandidates} className="grid h-10 w-10 place-items-center rounded-lg bg-[#c40012] text-white" title="Lọc"><Check className="h-4 w-4" /></button><button type="button" onClick={() => void exportCandidates()} disabled={exporting} className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 disabled:opacity-60" title="Xuất Excel" aria-label="Xuất Excel danh sách ứng viên">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead><tr className="border-y border-gray-200 text-xs font-black uppercase text-[#716a73]"><th className="px-3 py-3">Ứng viên</th><th className="px-3 py-3">Vị trí</th><th className="px-3 py-3">Nguồn</th><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ghi chú</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id} className="border-b border-gray-100 align-top"><td className="px-3 py-3"><div className="font-black">{candidate.fullName}</div><div className="mt-1 text-xs font-medium leading-5 text-[#77717a]">{candidate.phone}<br />{candidate.email}<br />{candidate.svpId}</div></td><td className="px-3 py-3"><div className="font-bold">{candidate.positionLabel}</div><div className="mt-1 text-xs font-medium text-[#77717a]">{candidate.postTitle}</div></td><td className="px-3 py-3"><div className="font-bold">{candidate.utmSource || 'Trực tiếp'}</div><div className="text-xs text-[#77717a]">{candidate.utmCampaign || ''}</div></td><td className="px-3 py-3 font-semibold">{new Date(candidate.createdAt).toLocaleString('vi-VN')}</td><td className="px-3 py-3"><select value={candidate.pipelineStatus} onChange={(event) => void updateCandidate(candidate, { pipelineStatus: event.target.value as RecruitmentCandidate['pipelineStatus'] })} className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-black">{Object.entries(pipelineLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-3 py-3"><textarea value={candidate.note || ''} onChange={(event) => setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, note: event.target.value } : item))} onBlur={() => void updateCandidate(candidate, { note: candidates.find((item) => item.id === candidate.id)?.note || '' })} rows={3} placeholder="Ghi chú chăm sóc" className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold leading-5" /></td></tr>)}</tbody></table>{!loading && candidates.length === 0 ? <div className="py-12 text-center text-sm font-semibold text-[#77717a]">Chưa có ứng viên phù hợp bộ lọc.</div> : null}</div>
        </section>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof BriefcaseBusiness; label: string }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-black ${active ? 'bg-[#c40012] text-white' : 'text-[#716a73]'}`}><Icon className="h-4 w-4" />{label}</button>; }
function AdminField({ label, value, onChange, wide = false, help }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean; help?: string }) { return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]" />{help ? <span className="mt-1 block text-xs font-semibold text-[#77717a]">{help}</span> : null}</label>; }
