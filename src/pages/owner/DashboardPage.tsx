import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Home, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, isPropertyPending, propertyStatusLabel } from '../../utils/svpFormat';

export default function OwnerDashboardPage() {
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
    pending: properties.filter((item) => isPropertyPending(item.statusId || item.status)).length,
    approved: properties.filter((item) => isPropertyActive(item.statusId || item.status)).length,
  }), [properties]);

  const statCards = [
    { label: 'Đã gửi', value: stats.total, icon: Home, color: 'bg-blue-50 text-blue-600' },
    { label: 'Đang xử lý', value: stats.pending, icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { label: 'Đã duyệt', value: stats.approved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-gradient-to-br from-[#c40012] via-[#d91d2b] to-[#f26a4f] p-5 text-white shadow-lg shadow-red-100 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">Chủ nhà</p>
        <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Xin chào, {user?.fullName || 'anh/chị'}!</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/85">
          Gửi thông tin nhà cần bán, theo dõi trạng thái xử lý và nhận hỗ trợ từ đội ngũ Sổ Đỏ Vạn Phúc.
        </p>
        <button onClick={() => navigate('/chu-nha/gui-ban')} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#c40012]">
          <Plus className="h-4 w-4" />
          Gửi nhà cần bán
        </button>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100 sm:p-4">
            <div className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-black text-[#25202a]">{loading ? '-' : card.value}</p>
            <p className="text-xs font-bold text-[#747b88]">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#25202a]">Nhà của tôi</h2>
            <p className="text-sm font-medium text-[#747b88]">Các hồ sơ nhà bạn đã gửi lên hệ thống.</p>
          </div>
          <button onClick={() => navigate('/chu-nha/nha-cua-toi')} className="text-sm font-black text-[#c40012]">Xem tất cả</button>
        </div>

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <PropertySkeleton key={index} />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <ShieldCheck className="mx-auto h-12 w-12 text-red-200" />
            <p className="mt-3 font-black text-[#25202a]">Bạn chưa gửi nhà nào</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Hãy gửi thông tin cơ bản, chuyên gia sẽ kiểm tra và liên hệ hỗ trợ.</p>
            <button onClick={() => navigate('/chu-nha/gui-ban')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Gửi nhà đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {properties.slice(0, 6).map((item) => <OwnerPropertyCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
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
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isPropertyActive(status) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {propertyStatusLabel(status)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#747b88]">
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{formatVndShort(item.price)}</span>
        <span className="rounded-full bg-[#faf7f5] px-2.5 py-1">{areaText(item)}</span>
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
