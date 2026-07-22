import { ArrowLeft, Clock, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName } from '../data/roles';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBranding } from '../contexts/BrandingContext';

export default function PendingApprovalPage() {
  const { logoUrl, siteName } = useBranding();
  usePageTitle('Chờ phê duyệt | Sổ Đỏ Vạn Phúc');
  const { logout, pendingRoles, approvedRoles } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col items-center justify-center text-center">
        <img src={logoUrl} alt={siteName} className="mb-7 h-20 w-20 rounded-full object-contain drop-shadow-lg" />
        <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-amber-600">
          <Clock className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-black text-[#25202a]">Tài khoản đang chờ phê duyệt</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#667085]">
          Các vai trò nội bộ cần được quản trị viên phê duyệt trước khi mở đầy đủ tính năng.
        </p>

        {pendingRoles.length > 0 && (
          <div className="mt-5 w-full rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-sm">
            <p className="mb-3 text-sm font-bold text-[#25202a]">Vai trò đang chờ duyệt</p>
            <div className="space-y-2">
              {pendingRoles.map((role) => (
                <div key={role.slug} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                  <span className="text-sm font-semibold text-[#5d4a19]">{getRoleDisplayName(role.slug)}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Chờ duyệt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {approvedRoles.length > 0 && (
          <button
            onClick={() => navigate('/select-role')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c40012] px-6 py-3 text-sm font-bold text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            Vào vai trò đã được kích hoạt
          </button>
        )}

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#eadfd7] bg-white px-6 py-3 text-sm font-bold text-[#c40012]"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>

        <button onClick={() => navigate('/')} className="mt-4 flex items-center gap-2 text-sm font-bold text-[#c40012]">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </button>
      </div>
    </main>
  );
}
