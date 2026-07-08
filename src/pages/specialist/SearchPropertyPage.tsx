import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Search } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function SearchPropertyPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties', { params: { statusId: 'st_active' } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => [item.title, item.district, item.ward, item.street, item.code].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [items, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Cộng tác viên</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Tìm nhà cho khách</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Tra nhanh nguồn nhà đang mở để tư vấn khách mua.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo khu vực, mã nhà, tiêu đề..."
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
          <Search className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có nguồn phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Thử tìm theo khu vực khác hoặc kiểm tra lại bộ lọc nguồn nhà.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => <PropertyCard key={item.id} item={item} onClick={() => navigate(`/nha/${item.id}`)} />)}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <button onClick={onClick} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-[#c40012] sm:h-28 sm:w-28">
        <Home className="h-7 w-7 opacity-45" />
      </button>
      <button onClick={onClick} className="min-w-0 flex-1 py-1 text-left">
        <p className="text-sm font-black text-[#c40012]">{formatVndShort(item.price)}</p>
        <p className="mt-1 line-clamp-2 font-black leading-5 text-[#25202a]">{item.title || 'Nguồn nhà'}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)} · {item.extra?.bedrooms || '-'} PN</p>
      </button>
      <button onClick={onClick} className="self-center rounded-2xl bg-[#c40012] px-3 py-2 text-xs font-black text-white">
        Xem
      </button>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
