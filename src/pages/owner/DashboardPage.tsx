import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, FileText, CheckCircle, Plus } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { isPropertyActive, isPropertyPending, propertyStatusLabel } from '../../utils/svpFormat';

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    api.get('/properties', { params: { createdBy: user?.id } }).then(r => {
      const items = r.data?.items || [];
      setProperties(items.slice(0, 5));
      setStats({ total: items.length, pending: items.filter((p: any) => isPropertyPending(p.statusId)).length, approved: items.filter((p: any) => isPropertyActive(p.statusId)).length });
    }).catch(() => {});
  }, [user?.id]);

  const statCards = [
    { label: 'Số nhà đã gửi', value: stats.total, icon: Home, color: 'bg-blue-100 text-blue-600' },
    { label: 'Đang xử lý', value: stats.pending, icon: FileText, color: 'bg-amber-100 text-amber-600' },
    { label: 'Đã duyệt', value: stats.approved, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold text-[#212121] mb-1">Xin chào, {user?.fullName}!</h1>
      <p className="text-sm text-[#757575] mb-6">Chào mừng bạn đến với Sổ Đỏ Vạn Phúc</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-[#757575]">{s.label}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/chu-nha/gui-ban')} className="w-full bg-[#D32F2F] text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 mb-6 shadow-md">
        <Plus className="w-5 h-5" /> Gửi nhu cầu bán nhà
      </button>

      <h2 className="text-lg font-semibold mb-3">Nhà của tôi</h2>
      {properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Bạn chưa có nhà nào. Hãy gửi nhu cầu bán nhà đầu tiên!</p>
        </div>
      ) : properties.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <h3 className="font-medium">{p.title || 'Nhà chưa đặt tên'}</h3>
          <p className="text-sm text-[#757575]">{p.district || p.address || '—'}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPropertyActive(p.statusId) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {propertyStatusLabel(p.statusId)}
            </span>
            <span className="text-xs text-[#757575]">{p.createdAt?.slice(0, 10)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
