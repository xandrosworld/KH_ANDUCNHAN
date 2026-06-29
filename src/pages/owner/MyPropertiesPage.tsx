import { useEffect, useMemo, useState } from 'react';
import { Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, isPropertySold, propertyStatusLabel } from '../../utils/svpFormat';

const TABS = ['Tất cả', 'Đang xử lý', 'Đã duyệt', 'Đã bán'];
const STATUS_MAP: Record<string, string[]> = {
  'Đang xử lý': ['st_new', 'new', 'draft', 'pending'],
  'Đã duyệt': ['st_active', 'active'],
  'Đã bán': ['st_sold', 'sold'],
};

export default function OwnerMyPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties', { params: { createdBy: user?.id } })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => tab === 'Tất cả' ? items : items.filter((item) => STATUS_MAP[tab]?.includes(item.statusId || item.status)), [items, tab]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chủ nhà</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Nhà của tôi</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi các hồ sơ nhà đã gửi lên hệ thống.</p>
      </section>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${tab === item ? 'bg-[#c40012] text-white' : 'bg-white text-[#747b88] ring-1 ring-gray-100'}`}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <PropertySkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Home className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có nhà trong nhóm này</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Bạn có thể gửi thêm hồ sơ nhà mới bất cứ lúc nào.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => <OwnerPropertyCard key={item.id} item={item} />)}
        </div>
      )}

      <button onClick={() => navigate('/chu-nha/gui-ban')} className="fixed bottom-20 right-4 grid h-14 w-14 place-items-center rounded-full bg-[#c40012] text-white shadow-lg sm:hidden">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

function OwnerPropertyCard({ item }: { item: any }) {
  const status = item.statusId || item.status;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-black leading-5 text-[#25202a]">{item.title || 'Nhà chờ bổ sung thông tin'}</p>
          <p className="mt-2 text-sm font-semibold text-[#747b88]">{item.district || item.ward || 'Khu vực đang cập nhật'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isPropertyActive(status) ? 'bg-emerald-50 text-emerald-700' : isPropertySold(status) ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
          {propertyStatusLabel(status)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#747b88]">
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{formatVndShort(item.price)}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{areaText(item)}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{formatDate(item.createdAt || item.created_at)}</span>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Chưa rõ ngày';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('vi-VN');
}
