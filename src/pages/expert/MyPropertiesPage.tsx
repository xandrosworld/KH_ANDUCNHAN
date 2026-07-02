import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, isPropertySold, propertyStatusLabel } from '../../utils/svpFormat';

const TABS = ['Tất cả', 'Mới đăng', 'Đang bán', 'Đã cọc', 'Đã bán', 'Tạm dừng', 'Ẩn'];
const STATUS_MAP: Record<string, string[]> = {
  'Mới đăng': ['st_new', 'new', 'draft', 'pending'],
  'Đang bán': ['st_active', 'active'],
  'Đã cọc': ['st_deposit', 'deposit'],
  'Đã bán': ['st_sold', 'sold'],
  'Tạm dừng': ['st_paused', 'paused'],
  'Ẩn': ['st_hidden', 'hidden'],
};

export default function ExpertMyPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const createdState = location.state as { createdPropertyId?: string; createdPropertyCode?: string; createdPropertyTitle?: string } | null;
  const [tab, setTab] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties', { params: { createdBy: user?.id } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => {
    const tabbed = tab === 'Tất cả' ? items : items.filter((item) => STATUS_MAP[tab]?.includes(item.statusId || item.status));
    const keyword = query.trim().toLowerCase();
    if (!keyword) return tabbed;
    return tabbed.filter((item) => [item.title, item.code, item.ownerName, item.ownerPhone, item.extra?.province, item.district, item.ward, item.price].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [items, query, tab]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chuyên gia</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Kho nhà</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Quản lý các nguồn nhà đã nhập hoặc đang phụ trách.</p>
          </div>
          <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="hidden min-h-11 items-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white sm:inline-flex">
            <Plus className="h-4 w-4" />
            Đăng nhà
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo mã nguồn, chủ nhà, khu vực..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      {createdState?.createdPropertyId ? (
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
          Đã gửi duyệt nguồn {createdState.createdPropertyCode || createdState.createdPropertyTitle || 'vừa đăng'}. Nguồn đã nằm trong kho nhà cá nhân để tiếp tục theo dõi.
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-black ${tab === item ? 'bg-[#c40012] text-white' : 'bg-white text-[#747b88] ring-1 ring-gray-100'}`}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <PropertySkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Home className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có nguồn nhà phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa hoặc đăng nguồn mới.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => <ExpertPropertyCard key={item.id} item={item} highlight={item.id === createdState?.createdPropertyId} onClick={() => navigate(`/chuyen-gia/nha/${item.id}`)} />)}
        </div>
      )}

      <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="fixed bottom-20 right-4 grid h-14 w-14 place-items-center rounded-full bg-[#c40012] text-white shadow-lg sm:hidden">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

function ExpertPropertyCard({ item, onClick, highlight = false }: { item: any; onClick: () => void; highlight?: boolean }) {
  const status = item.statusId || item.status;
  return (
    <button onClick={onClick} className={`rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${highlight ? 'ring-2 ring-emerald-400' : 'ring-1 ring-gray-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#9aa1ad]">{item.code || shortId(item.id)}</p>
          <p className="mt-1 line-clamp-2 font-black leading-5 text-[#25202a]">{item.title || 'Nguồn nhà'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isPropertyActive(status) ? 'bg-emerald-50 text-emerald-700' : isPropertySold(status) ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
          {propertyStatusLabel(status)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#747b88]">
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{formatVndShort(item.price)}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{[item.extra?.province, item.district || item.ward].filter(Boolean).join(' - ') || 'Chưa rõ khu vực'}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{areaText(item)}</span>
      </div>
    </button>
  );
}

function PropertySkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-3 w-32 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function shortId(id?: string) {
  return id ? id.slice(0, 8).toUpperCase() : 'SVP';
}
