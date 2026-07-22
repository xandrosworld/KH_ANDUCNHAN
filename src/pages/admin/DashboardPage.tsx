import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Home, Settings2, Share2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((response) => setStats(response.data || {}))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Người dùng', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600', path: '/quan-tri/nguoi-dung' },
    { label: 'Chờ duyệt', value: stats.pendingApplications || 0, icon: Clock, color: 'bg-amber-50 text-amber-700', path: '/quan-tri/duyet-vai-tro' },
    { label: 'Nguồn nhà', value: stats.totalProperties || 0, icon: Home, color: 'bg-emerald-50 text-emerald-600', path: '/quan-tri/nha' },
    { label: 'Khách hàng', value: stats.totalCustomers || 0, icon: UserCheck, color: 'bg-purple-50 text-purple-600', path: '/quan-tri/khach-hang' },
    { label: 'Lịch xem', value: stats.totalSchedules || 0, icon: Calendar, color: 'bg-orange-50 text-orange-600', path: '/quan-tri/lich-xem' },
    { label: 'Giới thiệu', value: stats.totalReferrals || 0, icon: Share2, color: 'bg-cyan-50 text-cyan-600', path: '/quan-tri/gioi-thieu' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-[28px] bg-gradient-to-br from-[#25202a] to-[#3a2d31] p-5 text-white shadow-lg sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Quản trị hệ thống</p>
        <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Bảng điều khiển</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/75">
          Theo dõi người dùng, nguồn nhà, khách hàng và các yêu cầu cần duyệt trong hệ thống.
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <button key={card.label} type="button" onClick={() => navigate(card.path)} className="group min-h-36 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#c40012]" aria-label={`Mở danh sách ${card.label.toLowerCase()}`}>
            <div className="flex items-start justify-between gap-2"><div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${card.color}`}><card.icon className="h-5 w-5" /></div><ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#c40012]" /></div>
            <p className="text-2xl font-black text-[#25202a]">{loading ? '-' : card.value}</p>
            <p className="mt-1 text-xs font-bold text-[#747b88]">{card.label}</p>
          </button>
        ))}
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <AdminShortcut icon={ShieldCheck} title="Duyệt thành viên/vai trò" desc="Mở quyền cho tài khoản cần phê duyệt" onClick={() => navigate('/quan-tri/duyet-vai-tro')} primary />
        <AdminShortcut icon={Settings2} title="Cấu hình vận hành" desc="Tài khoản cần duyệt, tên trường, danh mục" onClick={() => navigate('/quan-tri/cau-hinh')} />
        <AdminShortcut icon={Clock} title="Nhật ký hệ thống" desc="Theo dõi thay đổi quan trọng" onClick={() => navigate('/quan-tri/nhat-ky')} />
      </section>
    </div>
  );
}

function AdminShortcut({ icon: Icon, title, desc, onClick, primary = false }: { icon: any; title: string; desc: string; onClick: () => void; primary?: boolean }) {
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
