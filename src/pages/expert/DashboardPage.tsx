import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, FolderOpen, Home, Plus, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, isPropertyPending, isPropertySold, propertyStatusLabel } from '../../utils/svpFormat';

export default function ExpertDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties', { params: { createdBy: user?.id } })
      .then((response) => setProperties(response.data?.items || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter((item) => isPropertyActive(item.statusId || item.status)).length,
    sold: properties.filter((item) => isPropertySold(item.statusId || item.status)).length,
    pending: properties.filter((item) => isPropertyPending(item.statusId || item.status)).length,
  }), [properties]);

  const cards = [
    { label: 'Tổng nguồn', value: stats.total, icon: Home, color: 'bg-blue-50 text-blue-600' },
    { label: 'Đang bán', value: stats.active, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Đã bán', value: stats.sold, icon: CheckCircle, color: 'bg-orange-50 text-orange-600' },
    { label: 'Chờ duyệt', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-gradient-to-br from-[#25202a] to-[#3a2d31] p-5 text-white shadow-lg sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Chuyên gia / Đầu chủ</p>
        <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Xin chào, {user?.fullName || 'Chuyên gia'}!</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/75">
          Đăng nguồn nhà, kiểm tra trùng và theo dõi trạng thái nguồn do bạn phụ trách.
        </p>
        <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white">
          <Plus className="h-4 w-4" />
          Đăng nhà mới
        </button>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-black text-[#25202a]">{loading ? '-' : card.value}</p>
            <p className="mt-1 text-xs font-bold text-[#747b88]">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <ActionCard icon={Plus} title="Đăng nhà mới" desc="Nhập nguồn nhà theo quy trình" onClick={() => navigate('/chuyen-gia/dang-nha')} primary />
        <ActionCard icon={Search} title="Kiểm tra trùng" desc="Tự cảnh báo theo SĐT, địa chỉ, sổ" onClick={() => navigate('/chuyen-gia/dang-nha')} />
        <ActionCard icon={FolderOpen} title="Kho nhà" desc="Xem các nguồn đang phụ trách" onClick={() => navigate('/chuyen-gia/kho-nha')} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#25202a]">Nguồn gần đây</h2>
            <p className="text-sm font-medium text-[#747b88]">Các nhà bạn đã nhập hoặc đang phụ trách.</p>
          </div>
          <button onClick={() => navigate('/chuyen-gia/kho-nha')} className="text-sm font-black text-[#c40012]">Xem kho</button>
        </div>

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <PropertySkeleton key={index} />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <Home className="mx-auto h-12 w-12 text-red-200" />
            <p className="mt-3 font-black text-[#25202a]">Chưa có nguồn nhà</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Bắt đầu bằng cách nhập nguồn nhà đầu tiên theo checklist ký nhà.</p>
            <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Đăng nguồn đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {properties.slice(0, 6).map((item) => <ExpertPropertyCard key={item.id} item={item} onClick={() => navigate(`/chuyen-gia/nha/${item.id}`)} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, onClick, primary = false }: { icon: any; title: string; desc: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        primary ? 'bg-[#c40012] text-white' : 'bg-white text-[#25202a] ring-1 ring-gray-100'
      }`}
    >
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${primary ? 'bg-white/15 text-white' : 'bg-red-50 text-[#c40012]'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-black">{title}</p>
      <p className={`mt-1 text-sm font-medium leading-5 ${primary ? 'text-white/75' : 'text-[#747b88]'}`}>{desc}</p>
    </button>
  );
}

function ExpertPropertyCard({ item, onClick }: { item: any; onClick: () => void }) {
  const status = item.statusId || item.status;
  return (
    <button onClick={onClick} className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-black leading-5 text-[#25202a]">{item.title || 'Nguồn nhà'}</p>
          <p className="mt-2 text-sm font-semibold text-[#747b88]">{item.district || item.ward || 'Khu vực đang cập nhật'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isPropertyActive(status) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {propertyStatusLabel(status)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#747b88]">
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{formatVndShort(item.price)}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{areaText(item)}</span>
      </div>
    </button>
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
