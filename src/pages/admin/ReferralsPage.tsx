import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, Search, Share2, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';
import { downloadAdminExport } from '../../utils/adminExport';

const STATUS_LABELS: Record<string, string> = { new: 'Mới', activated: 'Đã kích hoạt', rejected: 'Từ chối' };
const TYPE_LABELS: Record<string, string> = { staff: 'Nhân sự', owner: 'Chủ nhà', buyer: 'Khách mua', partner: 'Đối tác', other: 'Khác' };

export default function AdminReferralsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/referrals')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setMessage('Chưa tải được danh sách giới thiệu.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [item.referralCode, item.referrerName, item.referrerPhone, item.referrerEmail, item.referrerSvpId, item.referredName, item.referredPhone, item.referredEmail, item.referredSvpId];
      return (status === 'all' || item.status === status) && (type === 'all' || item.referralType === type) && (!keyword || searchable.some((value) => String(value || '').toLowerCase().includes(keyword)));
    });
  }, [items, query, status, type]);

  const exportItems = async () => {
    setExporting(true);
    setMessage('');
    try {
      await downloadAdminExport('referrals');
    } catch {
      setMessage('Chưa xuất được danh sách giới thiệu.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p><h1 className="mt-1 text-2xl font-black text-[#25202a]">Danh sách giới thiệu</h1><p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Đối soát từng lượt giới thiệu và hai tài khoản liên quan.</p></div><button type="button" onClick={exportItems} disabled={exporting} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm disabled:opacity-60"><Download className="h-4 w-4" />{exporting ? 'Đang xuất...' : 'Xuất Excel'}</button></div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_180px_180px]">
          <label className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, tên, SVP ID, SĐT, email..." className="min-h-12 w-full rounded-2xl border border-gray-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-12 rounded-2xl border border-gray-200 px-3 text-sm font-bold outline-none focus:border-[#c40012]"><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-12 rounded-2xl border border-gray-200 px-3 text-sm font-bold outline-none focus:border-[#c40012]"><option value="all">Tất cả loại</option>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
      </section>

      {message ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[#c40012]">{message}</p> : null}
      {loading ? <div className="grid gap-3 lg:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />)}</div> : filtered.length ? (
        <div className="grid gap-3 lg:grid-cols-2">{filtered.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="min-w-0 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#c40012]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black uppercase text-[#c40012]">{item.referralCode || 'Không có mã'}</p><p className="mt-1 font-black text-[#25202a]">{TYPE_LABELS[item.referralType] || item.referralType}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${item.status === 'activated' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>{STATUS_LABELS[item.status] || item.status}</span></div><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><PersonSummary label="Người giới thiệu" name={item.referrerName} meta={item.referrerSvpId || item.referrerPhone} /><ArrowRight className="h-5 w-5 text-[#c40012]" /><PersonSummary label="Người được giới thiệu" name={item.referredName} meta={item.referredSvpId || item.referredPhone} /></div><p className="mt-3 text-xs font-semibold text-[#747b88]">Ghi nhận: {formatDate(item.createdAt)}</p></button>)}</div>
      ) : <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100"><Share2 className="mx-auto h-12 w-12 text-red-200" /><p className="mt-3 font-black text-[#25202a]">Không có lượt giới thiệu phù hợp</p><p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa hoặc bộ lọc.</p></div>}

      {selected ? <ReferralDetail item={selected} onClose={() => setSelected(null)} onOpenUser={(userId) => navigate(`/quan-tri/nguoi-dung?user=${encodeURIComponent(userId)}`)} /> : null}
    </div>
  );
}

function PersonSummary({ label, name, meta }: { label: string; name?: string; meta?: string }) {
  return <div className="min-w-0"><p className="text-[11px] font-bold text-[#9aa1ad]">{label}</p><p className="mt-1 truncate text-sm font-black text-[#25202a]">{name || 'Chưa xác định'}</p><p className="mt-1 truncate text-xs font-semibold text-[#747b88]">{meta || '-'}</p></div>;
}

function ReferralDetail({ item, onClose, onOpenUser }: { item: any; onClose: () => void; onOpenUser: (id: string) => void }) {
  return <div className="fixed inset-0 z-[90] bg-black/35" role="dialog" aria-modal="true" aria-label="Chi tiết giới thiệu"><aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-gray-100 p-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chi tiết giới thiệu</p><h2 className="mt-1 break-all text-xl font-black text-[#25202a]">{item.referralCode || 'Không có mã'}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-50" aria-label="Đóng"><X className="h-5 w-5" /></button></header><div className="flex-1 space-y-4 overflow-y-auto p-4"><div className="grid grid-cols-2 gap-3"><Badge label="Loại" value={TYPE_LABELS[item.referralType] || item.referralType} /><Badge label="Trạng thái" value={STATUS_LABELS[item.status] || item.status} /></div><PersonDetail title="Người giới thiệu" prefix="referrer" item={item} onOpenUser={onOpenUser} /><PersonDetail title="Người được giới thiệu" prefix="referred" item={item} onOpenUser={onOpenUser} /><Badge label="Ngày ghi nhận" value={formatDate(item.createdAt)} /></div></aside></div>;
}

function PersonDetail({ title, prefix, item, onOpenUser }: { title: string; prefix: 'referrer' | 'referred'; item: any; onOpenUser: (id: string) => void }) {
  const id = item[`${prefix}UserId`];
  return <section className="rounded-2xl bg-[#fff8f2] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black uppercase text-[#c40012]">{title}</p><p className="mt-2 break-words font-black text-[#25202a]">{item[`${prefix}Name`] || 'Chưa xác định'}</p></div>{id ? <button type="button" onClick={() => onOpenUser(id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#c40012] ring-1 ring-red-100" title="Mở hồ sơ người dùng" aria-label={`Mở hồ sơ ${title.toLowerCase()}`}><UserRound className="h-4 w-4" /></button> : null}</div><p className="mt-3 break-all text-sm font-semibold leading-6 text-[#606875]">{[item[`${prefix}SvpId`], item[`${prefix}Phone`], item[`${prefix}Email`]].filter(Boolean).join(' · ') || '-'}</p></section>;
}

function Badge({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-2xl bg-[#fff8f2] p-3"><p className="text-xs font-bold text-[#8a909c]">{label}</p><p className="mt-1 break-words text-sm font-black text-[#25202a]">{value || '-'}</p></div>;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
