import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Calendar, Bell, Plus, Search, Clock } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function SpecialistDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0, newNeeds: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    api.get('/customers', { params: { assignedTo: user?.id } }).then(r => {
      const items = r.data?.items || [];
      setCustomers(items.slice(0, 5));
      setStats({ total: items.length, active: items.filter((c: any) => ['cs_contacted', 'contacted', 'cs_viewing', 'viewing'].includes(c.statusId || c.status)).length, today: 0, newNeeds: items.filter((c: any) => ['cs_new', 'new'].includes(c.statusId || c.status)).length });
    }).catch(() => {});
  }, [user?.id]);

  const cards = [
    { label: 'Tổng khách', value: stats.total, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Đang chăm sóc', value: stats.active, icon: UserCheck, color: 'bg-green-100 text-green-600' },
    { label: 'Lịch xem hôm nay', value: stats.today, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
    { label: 'Nhu cầu mới', value: stats.newNeeds, icon: Bell, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-1">Xin chào, {user?.fullName}!</h1>
      <p className="text-sm text-[#757575] mb-6">Chuyên viên / Đầu khách</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map(c => (<div key={c.label} className="bg-white rounded-xl shadow-sm p-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}><c.icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-[#757575]">{c.label}</p></div></div></div>))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => navigate('/chuyen-vien/them-khach')} className="bg-[#D32F2F] text-white rounded-xl p-3 flex flex-col items-center gap-2"><Plus className="w-6 h-6" /><span className="text-xs">Thêm khách</span></button>
        <button onClick={() => navigate('/chuyen-vien/tim-nha')} className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 border"><Search className="w-6 h-6 text-[#757575]" /><span className="text-xs text-[#757575]">Tìm nhà</span></button>
        <button onClick={() => navigate('/chuyen-vien/lich-xem')} className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 border"><Clock className="w-6 h-6 text-[#757575]" /><span className="text-xs text-[#757575]">Đặt lịch</span></button>
      </div>
      <h2 className="text-lg font-semibold mb-3">Khách hàng gần đây</h2>
      {customers.map((c: any) => (<div key={c.id} className="bg-white rounded-xl shadow-sm p-4 mb-3"><h3 className="font-medium">{c.fullName || c.name}</h3><p className="text-sm text-[#757575]">{c.phone} · {c.source || '—'}</p></div>))}
    </div>
  );
}
