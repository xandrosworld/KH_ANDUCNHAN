import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Download, Eye, Loader2, Plus, Save, Search, Trash2, UsersRound } from 'lucide-react';
import { eventApi } from '../../services/eventApi';
import type { EventRegistration, SvpEvent } from '../../types/events';

const careLabels: Record<EventRegistration['careStatus'], string> = {
  new: 'Mới', contacted: 'Đã liên hệ', confirmed: 'Xác nhận tham dự', joined_group: 'Đã vào nhóm', converted: 'Đã chuyển đổi', declined: 'Không tham dự',
};
const eventStatuses: Record<SvpEvent['status'], string> = { draft: 'Bản nháp', published: 'Công khai', hidden: 'Đang ẩn', archived: 'Lưu trữ' };

export default function AdminEventsPage() {
  const [tab, setTab] = useState<'events' | 'registrations'>('events');
  const [events, setEvents] = useState<SvpEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [editing, setEditing] = useState<SvpEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ q: '', eventId: '', status: '', utmSource: '' });

  const loadEvents = async () => { setLoading(true); try { const data = await eventApi.listAdmin(); setEvents(data.items); } catch (e: any) { setMessage(e.message); } finally { setLoading(false); } };
  const loadRegistrations = useCallback(async () => { setLoading(true); try { const data = await eventApi.listRegistrations(filters); setRegistrations(data.items); } catch (e: any) { setRegistrations([]); setMessage(e.message); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { void loadEvents(); }, []);
  useEffect(() => {
    if (tab !== 'registrations') return;
    setLoading(true);
    void loadRegistrations();
  }, [loadRegistrations, tab]);

  const draft = useMemo(() => editing || ({
    id: '', slug: '', title: '', eyebrow: 'Sự kiện chia sẻ online', summary: '', speakerName: '', speakerTitle: '', formatLabel: 'Online qua Zoom - Miễn phí', scheduleLabel: '', ctaLabel: 'Đăng ký tham dự miễn phí', bannerUrl: '', sections: [], disclaimer: '', status: 'draft', registrationStatus: 'open',
  } as SvpEvent), [editing]);
  const patchDraft = (updates: Partial<SvpEvent>) => setEditing({ ...draft, ...updates });

  const save = async () => {
    if (!editing?.title.trim() || !editing.slug.trim()) return setMessage('Vui lòng nhập tiêu đề và slug sự kiện.');
    setSaving(true); setMessage('');
    try {
      const item = editing.id ? await eventApi.update(editing.id, editing) : await eventApi.create(editing);
      setEditing(item); setMessage('Đã lưu sự kiện.'); await loadEvents();
    } catch (e: any) { setMessage(e.message || 'Chưa lưu được sự kiện.'); } finally { setSaving(false); }
  };

  const updateCare = async (item: EventRegistration, careStatus: EventRegistration['careStatus']) => {
    try { await eventApi.updateRegistration(item.id, careStatus, item.note || ''); setRegistrations((list) => list.map((row) => row.id === item.id ? { ...row, careStatus } : row)); } catch (e: any) { setMessage(e.message); }
  };
  const exportRegistrations = async () => {
    if (exporting) return;
    setExporting(true); setMessage('');
    try { await eventApi.exportRegistrations(filters); }
    catch (e: any) { setMessage(e.message || 'Chưa xuất được danh sách đăng ký.'); }
    finally { setExporting(false); }
  };

  return (
    <div className="min-w-0 pb-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase text-[#c40012]">Quản trị nội dung</div><h1 className="mt-1 text-2xl font-black text-[#25202a]">Sự kiện và người đăng ký</h1></div><div className="inline-flex rounded-lg border border-gray-200 bg-white p-1"><Tab active={tab === 'events'} onClick={() => setTab('events')} icon={CalendarDays} label="Sự kiện" /><Tab active={tab === 'registrations'} onClick={() => setTab('registrations')} icon={UsersRound} label="Người đăng ký" /></div></div>
      {message ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{message}</div> : null}

      {tab === 'events' ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <button type="button" onClick={() => setEditing({ ...draft, id: '', slug: '', title: '' })} className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white"><Plus className="h-4 w-4" />Tạo sự kiện</button>
            {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#c40012]" /> : <div className="space-y-2">{events.map((event) => <button key={event.id} type="button" onClick={() => setEditing(event)} className={`w-full rounded-lg border px-3 py-3 text-left ${editing?.id === event.id ? 'border-[#c40012] bg-red-50' : 'border-gray-200'}`}><div className="text-sm font-black leading-5">{event.title}</div><div className="mt-2 flex items-center justify-between text-xs font-bold text-[#6d6670]"><span>{eventStatuses[event.status]}</span><span>{event.registrationCount || 0} đăng ký</span></div></button>)}</div>}
          </section>
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            {!editing ? <div className="grid min-h-64 place-items-center text-center text-sm font-semibold text-[#77717a]">Chọn một sự kiện để chỉnh sửa hoặc tạo sự kiện mới.</div> : <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">{editing.id ? 'Chỉnh sửa sự kiện' : 'Sự kiện mới'}</h2><div className="flex gap-2">{editing.id ? <a href={`/su-kien/${editing.id}?preview=1`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-black"><Eye className="h-4 w-4" />Xem trước</a> : null}<button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#c40012] px-4 text-xs font-black text-white">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Lưu</button></div></div>
              <div className="grid gap-3 md:grid-cols-2"><AdminField label="Tiêu đề" value={editing.title} onChange={(value) => patchDraft({ title: value })} wide /><AdminField label="Slug URL" value={editing.slug} onChange={(value) => patchDraft({ slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /><AdminField label="Nhãn sự kiện" value={editing.eyebrow} onChange={(value) => patchDraft({ eyebrow: value })} /><AdminField label="Diễn giả" value={editing.speakerName} onChange={(value) => patchDraft({ speakerName: value })} /><AdminField label="Chức danh" value={editing.speakerTitle} onChange={(value) => patchDraft({ speakerTitle: value })} /><AdminField label="Hình thức" value={editing.formatLabel} onChange={(value) => patchDraft({ formatLabel: value })} /><AdminField label="Lịch" value={editing.scheduleLabel} onChange={(value) => patchDraft({ scheduleLabel: value })} /><AdminField label="CTA" value={editing.ctaLabel} onChange={(value) => patchDraft({ ctaLabel: value })} /><AdminField label="URL banner" value={editing.bannerUrl} onChange={(value) => patchDraft({ bannerUrl: value })} /><label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Mô tả ngắn</span><textarea value={editing.summary} onChange={(e) => patchDraft({ summary: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c40012]" /></label></div>
              <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Hiển thị</span><select value={editing.status} onChange={(e) => patchDraft({ status: e.target.value as SvpEvent['status'] })} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="draft">Bản nháp</option><option value="published">Công khai</option><option value="hidden">Ẩn</option><option value="archived">Lưu trữ</option></select></label><label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Đăng ký</span><select value={editing.registrationStatus} onChange={(e) => patchDraft({ registrationStatus: e.target.value as SvpEvent['registrationStatus'] })} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="open">Đang mở</option><option value="closed">Đã đóng</option></select></label></div>
              <div><div className="mb-2 flex items-center justify-between gap-3"><div className="text-sm font-black">Nội dung chương trình</div><button type="button" onClick={() => patchDraft({ sections: [...editing.sections, { key: `section-${Date.now()}`, title: 'Phần nội dung mới', body: '' }] })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-black text-[#c40012]"><Plus className="h-3.5 w-3.5" />Thêm phần</button></div><div className="space-y-3">{editing.sections.map((section, index) => <div key={section.key || index} className="rounded-lg border border-gray-200 p-3"><div className="flex gap-2"><input value={section.title} onChange={(e) => patchDraft({ sections: editing.sections.map((item, i) => i === index ? { ...item, title: e.target.value } : item) })} className="h-10 min-w-0 flex-1 border-b border-gray-200 text-sm font-black outline-none" /><button type="button" onClick={() => patchDraft({ sections: editing.sections.filter((_, i) => i !== index) })} title="Xóa phần" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div><textarea value={section.body || (section.items || []).join('\n')} onChange={(e) => patchDraft({ sections: editing.sections.map((item, i) => i === index ? (item.items ? { ...item, items: e.target.value.split('\n').filter(Boolean) } : { ...item, body: e.target.value }) : item) })} rows={4} className="mt-2 w-full text-sm font-medium leading-6 outline-none" /></div>)}</div></div>
              <label><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">Ghi chú pháp lý</span><textarea value={editing.disclaimer} onChange={(e) => patchDraft({ disclaimer: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>
            </div>}
          </section>
        </div>
      ) : (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 grid gap-2 md:grid-cols-[1fr_220px_180px_180px_auto]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Tên, email, điện thoại" className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm font-semibold" /></label><select value={filters.eventId} onChange={(e) => setFilters({ ...filters, eventId: e.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="">Tất cả sự kiện</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-bold"><option value="">Tất cả trạng thái</option>{Object.entries(careLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input value={filters.utmSource} onChange={(e) => setFilters({ ...filters, utmSource: e.target.value })} placeholder="UTM source" className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold" /><div className="flex gap-2"><button type="button" onClick={loadRegistrations} className="grid h-10 w-10 place-items-center rounded-lg bg-[#c40012] text-white" title="Lọc"><Check className="h-4 w-4" /></button><button type="button" onClick={() => void exportRegistrations()} disabled={exporting} className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 disabled:opacity-60" title="Xuất CSV">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-y border-gray-200 text-xs font-black uppercase text-[#716a73]"><th className="px-3 py-3">Người đăng ký</th><th className="px-3 py-3">Sự kiện</th><th className="px-3 py-3">Nguồn</th><th className="px-3 py-3">Ngày</th><th className="px-3 py-3">Chăm sóc</th></tr></thead><tbody>{registrations.map((item) => <tr key={item.id} className="border-b border-gray-100"><td className="px-3 py-3"><div className="font-black">{item.fullName}</div><div className="mt-1 text-xs font-medium text-[#77717a]">{item.phone} · {item.email} · {item.svpId}</div></td><td className="px-3 py-3 font-semibold">{item.eventTitle}</td><td className="px-3 py-3"><div className="font-bold">{item.utmSource || 'Trực tiếp'}</div><div className="text-xs text-[#77717a]">{item.utmCampaign || ''}</div></td><td className="px-3 py-3 font-semibold">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="px-3 py-3"><select value={item.careStatus} onChange={(e) => updateCare(item, e.target.value as EventRegistration['careStatus'])} className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-black">{Object.entries(careLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table>{!loading && registrations.length === 0 ? <div className="py-12 text-center text-sm font-semibold text-[#77717a]">Chưa có đăng ký phù hợp bộ lọc.</div> : null}</div>
        </section>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof CalendarDays; label: string }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-black ${active ? 'bg-[#c40012] text-white' : 'text-[#716a73]'}`}><Icon className="h-4 w-4" />{label}</button>; }
function AdminField({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) { return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1 block text-xs font-black uppercase text-[#716a73]">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>; }
