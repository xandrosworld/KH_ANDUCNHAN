import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, EyeOff, Home, MapPin, Search } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, propertyStatusLabel } from '../../utils/svpFormat';
import { downloadAdminExport } from '../../utils/adminExport';

const FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang hiển thị', value: 'active' },
  { label: 'Đang ẩn', value: 'hidden' },
  { label: 'Chờ xử lý', value: 'pending' },
];

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/properties')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = item.statusId || item.status || '';
      const matchesKeyword = !keyword || [item.title, item.code, item.ownerName, item.ownerPhone, item.district, item.ward]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && isPropertyActive(status)) ||
        (filter === 'hidden' && status === 'st_hidden') ||
        (filter === 'pending' && !isPropertyActive(status) && status !== 'st_hidden');
      return matchesKeyword && matchesFilter;
    });
  }, [items, query, filter]);

  const updateStatus = async (item: any, statusId: 'st_active' | 'st_hidden') => {
    setBusyId(`${item.id}-${statusId}`);
    setMessage('');
    try {
      await api.patch(`/properties/${encodeURIComponent(item.id)}/status`, { statusId });
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, statusId, status: statusId } : row));
      setMessage(statusId === 'st_active' ? `Đã duyệt/hiển thị nguồn ${item.code || item.title}.` : `Đã ẩn nguồn ${item.code || item.title}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa cập nhật được trạng thái nguồn nhà.');
    } finally {
      setBusyId('');
    }
  };

  const exportProperties = async () => {
    setMessage('');
    try {
      await downloadAdminExport('properties');
    } catch {
      setMessage('Chưa xuất được danh sách nguồn nhà.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Nguồn nhà</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi, duyệt hiển thị hoặc ẩn nguồn nhà khi cần rà soát.</p>
          </div>
          <button onClick={exportProperties} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm">
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo mã nguồn, tiêu đề, chủ nhà, khu vực..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${filter === item.value ? 'bg-[#c40012] text-white' : 'bg-[#fff8f2] text-[#7a353b] ring-1 ring-red-100'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {message && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-[#c40012]">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <PropertySkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Home className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có nguồn nhà phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Nguồn nhà mới sẽ xuất hiện sau khi người dùng gửi thông tin.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <PropertyCard
              key={item.id}
              item={item}
              busyId={busyId}
              onShow={() => updateStatus(item, 'st_active')}
              onHide={() => updateStatus(item, 'st_hidden')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ item, busyId, onShow, onHide }: { item: any; busyId: string; onShow: () => void; onHide: () => void }) {
  const status = item.statusId || item.status;
  const active = isPropertyActive(status);
  const hidden = status === 'st_hidden';
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-[#c40012]">
          <Home className="h-7 w-7 opacity-45" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black text-[#9aa1ad]">{item.code || shortId(item.id)}</p>
              <p className="mt-1 line-clamp-2 font-black leading-5 text-[#25202a]">{item.title || 'Nguồn nhà'}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : hidden ? 'bg-rose-50 text-[#c40012]' : 'bg-amber-50 text-amber-700'}`}>
              {hidden ? 'Đang ẩn' : propertyStatusLabel(status)}
            </span>
          </div>
          <p className="mt-2 font-black text-[#c40012]">{formatVndShort(item.price)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)} · {formatDate(item.createdAt || item.created_at)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {!active && (
              <button data-testid="admin-property-show" disabled={busyId === `${item.id}-st_active`} onClick={onShow} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-60">
                <Eye className="h-4 w-4" />
                Hiển thị
              </button>
            )}
            {!hidden && (
              <button data-testid="admin-property-hide" disabled={busyId === `${item.id}-st_hidden`} onClick={onHide} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-60 ${active ? 'col-span-2' : ''}`}>
                <EyeOff className="h-4 w-4" />
                Ẩn tin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function shortId(id?: string) {
  return id ? id.slice(0, 8).toUpperCase() : 'SVP';
}

function formatDate(value?: string) {
  if (!value) return 'Chưa rõ ngày';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('vi-VN');
}
