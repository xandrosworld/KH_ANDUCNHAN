import { useEffect, useMemo, useState } from 'react';
import { Home, MapPin, Search } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, propertyStatusLabel } from '../../utils/svpFormat';

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => [item.title, item.code, item.ownerName, item.ownerPhone, item.district, item.ward].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [items, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Nguồn nhà</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi nguồn nhà chủ nhà/chuyên gia đã gửi lên hệ thống.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo mã nguồn, tiêu đề, chủ nhà, khu vực..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

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
          {filtered.map((item) => <PropertyCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ item }: { item: any }) {
  const status = item.statusId || item.status;
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
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isPropertyActive(status) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {propertyStatusLabel(status)}
            </span>
          </div>
          <p className="mt-2 font-black text-[#c40012]">{formatVndShort(item.price)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)} · {formatDate(item.createdAt || item.created_at)}</p>
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
