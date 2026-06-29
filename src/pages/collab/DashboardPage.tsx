import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, TrendingUp } from 'lucide-react';

export default function CollabDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isKhach = user?.activeRole === 'ctv_khach';
  const roleName = isKhach ? 'CTV tìm khách' : 'CTV tìm nguồn';

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-1">Xin chào, {user?.fullName}!</h1>
      <p className="text-sm text-[#757575] mb-6">{roleName}</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-[#757575]">{isKhach ? 'Khách đã nhập' : 'Nguồn đã gửi'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-[#757575]">Thành công</p>
        </div>
      </div>

      <button onClick={() => navigate('/ctv/cong-viec')} className="w-full bg-[#D32F2F] text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> {isKhach ? 'Nhập khách mới' : 'Gửi nguồn mới'}
      </button>
    </div>
  );
}
