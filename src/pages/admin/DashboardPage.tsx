import { useState, useEffect } from 'react';
import { Users, Clock, Home, UserCheck, Calendar, Share2 } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data || {})).catch(() => {});
  }, []);

  const cards = [
    { label: 'Tổng người dùng', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Chờ duyệt', value: stats.pendingApplications || 0, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Tổng nhà', value: stats.totalProperties || 0, icon: Home, color: 'bg-green-100 text-green-600' },
    { label: 'Khách hàng', value: stats.totalCustomers || 0, icon: UserCheck, color: 'bg-purple-100 text-purple-600' },
    { label: 'Lịch xem', value: stats.totalSchedules || 0, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
    { label: 'Giới thiệu', value: stats.totalReferrals || 0, icon: Share2, color: 'bg-cyan-100 text-cyan-600' },
  ];

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-6">Bảng điều khiển</h1>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-[#757575]">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
