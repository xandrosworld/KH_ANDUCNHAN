import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, Home, MapPin, Search, Sparkles, SlidersHorizontal } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

const SUGGESTIONS = ['Gần Metro', 'Ô tô ngủ trong nhà', 'Mở Spa', 'Dòng tiền', 'Mặt tiền', 'Chính chủ'];

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/properties', { params: { statusId: 'st_active', limit: 12 } })
      .then((response) => setProperties(response.data?.items || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = useMemo(() => properties.slice(0, 4), [properties]);

  const goSearch = (value = query) => {
    const suffix = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : '';
    navigate(`/khach-mua/tim-nha${suffix}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-gradient-to-br from-[#c40012] via-[#d91d2b] to-[#f26a4f] p-5 text-white shadow-lg shadow-red-100 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">Khách tìm mua nhà</p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Tìm đúng nhà, đúng nhu cầu</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
              Nhập khu vực, ngân sách hoặc đặc điểm mong muốn. Hệ thống sẽ ưu tiên các nguồn nhà được phép hiển thị cho khách mua.
            </p>
          </div>
          <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 sm:grid">
            <Home className="h-7 w-7" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Search className="ml-2 h-5 w-5 shrink-0 text-[#8a8f98]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && goSearch()}
              placeholder="VD: nhà dưới 6 tỷ, gần Metro, ô tô vào nhà..."
              className="min-h-11 flex-1 border-0 bg-transparent text-sm font-semibold text-[#25202a] outline-none placeholder:text-[#9aa1ad]"
            />
            <button
              type="button"
              onClick={() => goSearch()}
              className="min-h-11 rounded-xl bg-[#25202a] px-4 text-sm font-black text-white"
            >
              Tìm
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => goSearch(item)}
              className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white ring-1 ring-white/20"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <QuickCard icon={SlidersHorizontal} title="Bộ lọc nhu cầu" desc="Giá, khu vực, diện tích" onClick={() => navigate('/khach-mua/tim-nha')} />
        <QuickCard icon={Heart} title="Nhà đã lưu" desc="Xem lại nguồn quan tâm" onClick={() => navigate('/khach-mua/yeu-thich')} />
        <QuickCard icon={Sparkles} title="Gợi ý phù hợp" desc={`${properties.length} nguồn đang mở`} onClick={() => navigate('/khach-mua/tim-nha')} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#25202a]">Nguồn nhà mới</h2>
            <p className="text-sm font-medium text-[#7b8190]">Thông tin nhạy cảm được bảo mật theo phân quyền.</p>
          </div>
          <button onClick={() => navigate('/khach-mua/tim-nha')} className="text-sm font-black text-[#c40012]">
            Xem tất cả
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => <PropertyCard key={item.id} item={item} onClick={() => navigate(`/nha/${item.id}`)} />)}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-red-100 bg-[#fff8f6] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#c40012] shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-black text-[#25202a]">Muốn được chuyên viên hỗ trợ?</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
              Lưu các nhà quan tâm hoặc gửi nhu cầu cụ thể, chuyên viên sẽ có căn cứ tư vấn đúng hơn.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-black text-[#25202a]">{title}</p>
      <p className="mt-1 text-sm font-medium text-[#7b8190]">{desc}</p>
    </button>
  );
}

function PropertyCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-red-50 to-rose-100 text-[#c40012]">
        <Home className="h-9 w-9 opacity-45" />
      </div>
      <div className="p-3">
        <p className="text-base font-black text-[#c40012]">{formatVndShort(item.price)}</p>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-[#25202a]">{item.title || 'Nhà cần bán'}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)} · {item.extra?.bedrooms || '-'} phòng ngủ</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="aspect-[4/3] animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
      <Search className="mx-auto h-12 w-12 text-red-200" />
      <p className="mt-3 font-black text-[#25202a]">Chưa có nguồn nhà phù hợp để hiển thị</p>
      <p className="mt-1 text-sm font-medium text-[#7b8190]">Khi chuyên gia duyệt nguồn mới, danh sách sẽ tự cập nhật tại đây.</p>
    </div>
  );
}
