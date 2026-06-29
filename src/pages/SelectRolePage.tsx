import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Home, Search, Settings, Share2, Shield, Star, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDashboardPath, getRoleDisplayName, ROLE_MAP } from '../data/roles';
import { usePageTitle } from '../hooks/usePageTitle';

const ROLE_ICONS: Record<string, any> = {
  admin: Settings,
  giam_doc: Building2,
  giam_doc_khoi: Building2,
  truong_phong: Users,
  pho_phong: Users,
  chuyen_gia: Star,
  chuyen_vien: UserPlus,
  ctv_khach: Search,
  ctv_nguon: Search,
  chu_nha: Home,
  khach_mua: Home,
  nguoi_gioi_thieu: Share2,
  doi_tac: Briefcase,
};

export default function SelectRolePage() {
  usePageTitle('Chọn vai trò | Sổ Đỏ Vạn Phúc');
  const { approvedRoles, pendingRoles, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (slug: string) => {
    setActiveRole(slug);
    navigate(getRoleDashboardPath(slug));
  };

  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-7 text-center">
          <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto mb-4 h-16 w-16 rounded-full object-contain" />
          <h1 className="text-2xl font-black text-[#25202a]">Chọn vai trò sử dụng</h1>
          <p className="mt-2 text-sm font-medium text-[#667085]">
            Tài khoản của bạn có nhiều vai trò. Hãy chọn vai trò muốn dùng trong phiên làm việc này.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {approvedRoles.map((role) => {
            const Icon = ROLE_ICONS[role.slug] || Shield;
            const meta = ROLE_MAP[role.slug];
            return (
              <button
                key={role.slug}
                onClick={() => handleSelect(role.slug)}
                className="flex items-start gap-4 rounded-2xl border border-red-100 bg-white p-5 text-left shadow-sm transition hover:border-[#c40012] hover:shadow-md"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-[#25202a]">{getRoleDisplayName(role.slug)}</p>
                  <p className="mt-1 text-sm font-medium leading-5 text-[#667085]">
                    {meta?.description || 'Vai trò đã được kích hoạt'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {pendingRoles.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="font-black text-[#25202a]">Vai trò đang chờ phê duyệt</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingRoles.map((role) => (
                <span key={role.slug} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {getRoleDisplayName(role.slug)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
