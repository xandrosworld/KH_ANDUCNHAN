import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Home, Users, Search, UserPlus, Briefcase, Share2, Building2, Star, Settings } from 'lucide-react';

const ROLE_META: Record<string, { label: string; desc: string; icon: any; path: string }> = {
  admin: { label: 'Quản trị viên', desc: 'Quản lý toàn bộ hệ thống', icon: Settings, path: '/quan-tri' },
  giam_doc: { label: 'Giám đốc khu vực', desc: 'Giám sát hoạt động khu vực', icon: Building2, path: '/quan-tri' },
  truong_phong: { label: 'Trưởng phòng', desc: 'Quản lý đội nhóm', icon: Users, path: '/quan-tri' },
  chuyen_gia: { label: 'Chuyên gia / Đầu chủ', desc: 'Quản lý nguồn nhà', icon: Star, path: '/chuyen-gia' },
  chuyen_vien: { label: 'Chuyên viên / Đầu khách', desc: 'Quản lý khách hàng', icon: UserPlus, path: '/chuyen-vien' },
  ctv_khach: { label: 'CTV tìm khách', desc: 'Tìm kiếm khách mua', icon: Search, path: '/ctv' },
  ctv_nguon: { label: 'CTV tìm nguồn', desc: 'Tìm kiếm nguồn nhà', icon: Search, path: '/ctv' },
  chu_nha: { label: 'Chủ nhà', desc: 'Quản lý nhà của bạn', icon: Home, path: '/chu-nha' },
  khach_mua: { label: 'Khách mua', desc: 'Tìm nhà phù hợp', icon: Home, path: '/khach-mua' },
  nguoi_gioi_thieu: { label: 'Người giới thiệu', desc: 'Giới thiệu người mới', icon: Share2, path: '/gioi-thieu' },
  doi_tac: { label: 'Đối tác', desc: 'Hợp tác kinh doanh', icon: Briefcase, path: '/gioi-thieu' },
};

export default function SelectRolePage() {
  const { approvedRoles, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (slug: string) => {
    setActiveRole(slug);
    const meta = ROLE_META[slug];
    navigate(meta?.path || '/profile');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center p-6">
      <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="h-12 mb-6" />
      <h1 className="text-2xl font-bold text-[#212121] mb-2">Chọn vai trò</h1>
      <p className="text-[#757575] mb-8">Bạn có nhiều vai trò. Chọn vai trò muốn sử dụng:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {approvedRoles.map((role) => {
          const meta = ROLE_META[role.slug] || { label: role.slug, desc: '', icon: Shield, path: '/profile' };
          const Icon = meta.icon;
          return (
            <button key={role.slug} onClick={() => handleSelect(role.slug)}
              className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-[#D32F2F] border-2 border-transparent transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#FFEBEE] flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-[#D32F2F]" />
              </div>
              <div>
                <p className="font-semibold text-[#212121]">{meta.label}</p>
                <p className="text-sm text-[#757575]">{meta.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
