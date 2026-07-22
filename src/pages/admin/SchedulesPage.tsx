import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Download, Home, Search, UserRound, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { downloadAdminExport } from '../../utils/adminExport';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  done: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function AdminSchedulesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/viewing-schedules')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setMessage('Chưa tải được danh sách lịch xem.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [item.customerName, item.customerPhone, item.customerEmail, item.propertyCode, item.propertyTitle, item.creatorName, item.note];
      return (status === 'all' || item.status === status) && (!keyword || searchable.some((value) => String(value || '').toLowerCase().includes(keyword)));
    });
  }, [items, query, status]);

  const exportItems = async () => {
    setExporting(true);
    setMessage('');
    try {
      await downloadAdminExport('viewing_schedules');
    } catch {
      setMessage('Chưa xuất được danh sách lịch xem.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Lịch xem nhà</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi lịch hẹn, khách mua, nguồn nhà và người phụ trách.</p>
          </div>
          <button type="button" onClick={exportItems} disabled={exporting} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm disabled:opacity-60">
            <Download className="h-4 w-4" />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_190px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khách, SĐT, mã nguồn, địa chỉ..." className="min-h-12 w-full rounded-2xl border border-gray-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#c40012]" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-12 rounded-2xl border border-gray-200 px-3 text-sm font-bold outline-none focus:border-[#c40012]">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </section>

      {message ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[#c40012]">{message}</p> : null}
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />)}</div>
      ) : filtered.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item)} className="min-w-0 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#c40012]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><CalendarDays className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#25202a]">{item.customerName || 'Khách chưa cập nhật tên'}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#747b88]">{item.customerPhone || item.customerEmail || 'Chưa có liên hệ'}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>{STATUS_LABELS[item.status] || item.status}</span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-black text-[#25202a]"><Clock3 className="h-4 w-4 text-[#c40012]" />{formatDateTime(item.scheduledAt)}</p>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-[#747b88]"><Home className="h-4 w-4 shrink-0" /><span className="truncate">{[item.propertyCode, item.propertyTitle].filter(Boolean).join(' · ') || 'Chưa gắn nguồn nhà'}</span></p>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-xs font-semibold text-[#747b88]"><UserRound className="h-4 w-4 shrink-0" /><span className="truncate">Phụ trách: {item.creatorName || item.creatorSvpId || 'Chưa cập nhật'}</span></p>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100"><CalendarDays className="mx-auto h-12 w-12 text-red-200" /><p className="mt-3 font-black text-[#25202a]">Không có lịch xem phù hợp</p><p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa hoặc trạng thái lọc.</p></div>
      )}

      {selected ? <ScheduleDetail item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function ScheduleDetail({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/35" role="dialog" aria-modal="true" aria-label="Chi tiết lịch xem">
      <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-100 p-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chi tiết lịch xem</p><h2 className="mt-1 text-xl font-black text-[#25202a]">{formatDateTime(item.scheduledAt)}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-gray-50" aria-label="Đóng"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Detail title="Trạng thái" value={STATUS_LABELS[item.status] || item.status} />
          <section><h3 className="mb-2 text-sm font-black text-[#25202a]">Khách hàng</h3><div className="rounded-2xl bg-[#fff8f2] p-3"><Detail title="Họ tên" value={item.customerName} /><Detail title="Số điện thoại" value={item.customerPhone} /><Detail title="Email" value={item.customerEmail} /></div></section>
          <section><h3 className="mb-2 text-sm font-black text-[#25202a]">Nguồn nhà</h3><div className="rounded-2xl bg-[#fff8f2] p-3"><Detail title="Mã nguồn" value={item.propertyCode} /><Detail title="Tiêu đề" value={item.propertyTitle} /><Detail title="Chủ nhà" value={item.propertyOwnerName} /><Detail title="SĐT chủ nhà" value={item.propertyOwnerPhone} /></div></section>
          <section><h3 className="mb-2 text-sm font-black text-[#25202a]">Phụ trách</h3><div className="rounded-2xl bg-[#fff8f2] p-3"><Detail title="Người tạo" value={item.creatorName} /><Detail title="SVP ID" value={item.creatorSvpId} /><Detail title="Ngày tạo" value={formatDateTime(item.createdAt)} /></div></section>
          <section><h3 className="mb-2 text-sm font-black text-[#25202a]">Ghi chú</h3><p className="whitespace-pre-wrap rounded-2xl bg-[#fff8f2] p-3 text-sm font-semibold leading-6 text-[#606875]">{item.note || 'Chưa có ghi chú.'}</p></section>
        </div>
      </aside>
    </div>
  );
}

function Detail({ title, value }: { title: string; value?: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-black/5 py-2 last:border-0"><span className="text-xs font-bold text-[#8a909c]">{title}</span><span className="min-w-0 break-words text-sm font-bold text-[#25202a]">{value || '-'}</span></div>;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa xếp lịch';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
