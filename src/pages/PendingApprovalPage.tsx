import { Clock, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PendingApprovalPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="h-16 mb-8" />
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-[#212121] mb-3">Tài khoản đang chờ duyệt</h1>
      <p className="text-[#757575] mb-8 max-w-sm">
        Yêu cầu của bạn đã được gửi. Quản trị viên sẽ xem xét và phê duyệt trong thời gian sớm nhất.
      </p>
      <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 bg-[#D32F2F] text-white px-6 py-2.5 rounded-lg font-medium mb-4">
        <LogOut className="w-4 h-4" /> Đăng xuất
      </button>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#D32F2F] font-medium">
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </button>
    </div>
  );
}
