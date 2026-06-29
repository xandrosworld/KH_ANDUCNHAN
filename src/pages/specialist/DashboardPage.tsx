import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Clock, Plus, Search, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { svpAxios as api } from '../../services/svpAxios';
import { customerStatusLabel } from '../../utils/svpFormat';

export default function SpecialistDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customers', { params: { assignedTo: user?.id } })
      .then((response) => setCustomers(response.data?.items || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const stats = useMemo(() => {
    const active = customers.filter((customer) => ['cs_contacted', 'contacted', 'cs_viewing', 'viewing'].includes(customer.statusId || customer.status)).length;
    const newNeeds = customers.filter((customer) => ['cs_new', 'new'].includes(customer.statusId || customer.status)).length;
    return { total: customers.length, active, today: 0, newNeeds };
  }, [customers]);

  const cards = [
    { label: 'Tổng khách', value: stats.total, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Đang chăm sóc', value: stats.active, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Lịch xem hôm nay', value: stats.today, icon: CalendarDays, color: 'bg-orange-50 text-orange-600' },
    { label: 'Nhu cầu mới', value: stats.newNeeds, icon: Bell, color: 'bg-red-50 text-[#c40012]' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-gradient-to-br from-[#25202a] to-[#3a2d31] p-5 text-white shadow-lg sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Chuyên viên / Đầu khách</p>
        <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Xin chào, {user?.fullName || 'Chuyên viên'}!</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/75">
          Quản lý khách mua, ghi nhận nhu cầu và tìm nguồn nhà phù hợp theo dữ liệu đã được phân quyền.
        </p>
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
        <ActionCard icon={Plus} title="Thêm khách" desc="Ghi nhận khách mua mới" onClick={() => navigate('/chuyen-vien/them-khach')} primary />
        <ActionCard icon={Search} title="Tìm nhà" desc="Lọc nguồn theo nhu cầu" onClick={() => navigate('/chuyen-vien/tim-nha')} />
        <ActionCard icon={Clock} title="Lịch xem" desc="Theo dõi lịch dẫn khách" onClick={() => navigate('/chuyen-vien/lich-xem')} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#25202a]">Khách hàng gần đây</h2>
            <p className="text-sm font-medium text-[#747b88]">Danh sách khách được phân công hoặc do bạn nhập.</p>
          </div>
          <button onClick={() => navigate('/chuyen-vien/khach-hang')} className="text-sm font-black text-[#c40012]">
            Xem tất cả
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => <CustomerSkeleton key={index} />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <Users className="mx-auto h-12 w-12 text-red-200" />
            <p className="mt-3 font-black text-[#25202a]">Chưa có khách hàng</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Bắt đầu bằng cách thêm khách mua đầu tiên hoặc nhận phân công từ quản trị.</p>
            <button onClick={() => navigate('/chuyen-vien/them-khach')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Thêm khách
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {customers.slice(0, 6).map((customer) => <CustomerCard key={customer.id} customer={customer} />)}
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
      <p className={`mt-1 text-sm font-medium ${primary ? 'text-white/75' : 'text-[#747b88]'}`}>{desc}</p>
    </button>
  );
}

function CustomerCard({ customer }: { customer: any }) {
  const status = customerStatusLabel(customer.statusId || customer.status);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-[#25202a]">{customer.fullName || customer.name || 'Khách mua'}</p>
          <p className="mt-1 text-sm font-semibold text-[#747b88]">{customer.phone || 'Chưa có số điện thoại'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-[#c40012]">{status}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#747b88]">{customer.note || customer.source || 'Chưa có ghi chú nhu cầu.'}</p>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}
