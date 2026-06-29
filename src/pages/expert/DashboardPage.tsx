import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, TrendingUp, CheckCircle, Clock, Plus, Search, FolderOpen } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { isPropertyActive, isPropertyPending, isPropertySold } from '../../utils/svpFormat';

export default function ExpertDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, pending: 0 });
  useEffect(() => {
    api.get('/properties', { params: { createdBy: user?.id } }).then(r => {
      const items = r.data?.items || [];
      setStats({ total: items.length, active: items.filter((p: any) => isPropertyActive(p.statusId)).length, sold: items.filter((p: any) => isPropertySold(p.statusId)).length, pending: items.filter((p: any) => isPropertyPending(p.statusId)).length });
    }).catch(() => {});
  }, [user?.id]);

  const cards = [
    { label: 'Tổng nhà', value: stats.total, icon: Home, color: 'bg-blue-100 text-blue-600' },
    { label: 'Đang bán', value: stats.active, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Đã bán', value: stats.sold, icon: CheckCircle, color: 'bg-orange-100 text-orange-600' },
    { label: 'Chờ duyệt', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-1">Xin chào, {user?.fullName}!</h1>
      <p className="text-sm text-[#757575] mb-6">Chuyên gia / Đầu chủ</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map(c => (<div key={c.label} className="bg-white rounded-xl shadow-sm p-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}><c.icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-[#757575]">{c.label}</p></div></div></div>))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="bg-[#D32F2F] text-white rounded-xl p-3 flex flex-col items-center gap-2"><Plus className="w-6 h-6" /><span className="text-xs">Đăng nhà mới</span></button>
        <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 border"><Search className="w-6 h-6 text-[#757575]" /><span className="text-xs text-[#757575]">Kiểm tra trùng</span></button>
        <button onClick={() => navigate('/chuyen-gia/kho-nha')} className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 border"><FolderOpen className="w-6 h-6 text-[#757575]" /><span className="text-xs text-[#757575]">Kho nhà</span></button>
      </div>
    </div>
  );
}
