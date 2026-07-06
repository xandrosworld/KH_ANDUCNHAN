import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  GraduationCap,
  Heart,
  Home,
  LogOut,
  Network,
  PlusCircle,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  User,
  Users,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../contexts/AuthContext';

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const MANAGEMENT_ROLES = new Set([
  'admin',
  'giam_doc',
  'truong_phong',
  'pho_phong',
  'giam_doc_khoi',
  'pho_giam_doc_khoi',
  'pho_giam_doc_khu_vuc',
  'giam_doc_dieu_hanh',
  'pho_giam_doc_dieu_hanh',
  'tro_ly',
  'thu_ky',
]);

function getMenuForRole(role: string): MenuItem[] {
  if (MANAGEMENT_ROLES.has(role)) {
    return [
      { path: '/quan-tri', label: 'Trang chủ', icon: Home },
      { path: '/quan-tri/nguoi-dung', label: 'Người dùng', icon: Shield },
      { path: '/quan-tri/duyet-vai-tro', label: 'Duyệt vai trò', icon: CheckSquare },
      { path: '/quan-tri/nha', label: 'Quản lý nhà', icon: Building2 },
      { path: '/quan-tri/khach-hang', label: 'Khách hàng', icon: Users },
      { path: '/quan-tri/cau-hinh', label: 'Cấu hình', icon: Settings },
    ];
  }

  switch (role) {
    case 'chu_nha':
      return [
        { path: '/chu-nha', label: 'Trang chủ', icon: Home },
        { path: '/chu-nha/nha-cua-toi', label: 'Nhà của tôi', icon: Building2 },
        { path: '/chu-nha/gui-ban', label: 'Gửi bán', icon: Send },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'khach_mua':
      return [
        { path: '/khach-mua', label: 'Trang chủ', icon: Home },
        { path: '/khach-mua/tim-nha', label: 'Tìm nhà', icon: Search },
        { path: '/khach-mua/yeu-thich', label: 'Yêu thích', icon: Heart },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'chuyen_gia':
      return [
        { path: '/chuyen-gia', label: 'Trang chủ', icon: Home },
        { path: '/chuyen-gia/kho-nha', label: 'Kho nhà', icon: Warehouse },
        { path: '/chuyen-gia/dang-nha', label: 'Đăng nhà', icon: PlusCircle },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'chuyen_vien':
      return [
        { path: '/chuyen-vien', label: 'Trang chủ', icon: Home },
        { path: '/chuyen-vien/khach-hang', label: 'Khách hàng', icon: Users },
        { path: '/chuyen-vien/tim-nha', label: 'Tìm nhà', icon: Search },
        { path: '/chuyen-vien/lich-xem', label: 'Lịch xem', icon: Calendar },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'hoc_vien':
      return [
        { path: '/hoc-vien', label: 'Trang chủ', icon: Home },
        { path: '/hoc-vien/viec-can-lam', label: 'Việc cần làm', icon: CheckSquare },
        { path: '/hoc-vien/dao-tao', label: 'Đào tạo', icon: GraduationCap },
        { path: '/ai', label: 'Trợ lý AI', icon: Bot },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'ctv_khach':
    case 'ctv_nguon':
      return [
        { path: '/ctv', label: 'Trang chủ', icon: Home },
        { path: '/ctv/cong-viec', label: 'Công việc', icon: Briefcase },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'nguoi_gioi_thieu':
    case 'doi_tac':
      return [
        { path: '/nguoi-gioi-thieu', label: 'Trang chủ', icon: Home },
        { path: '/nguoi-gioi-thieu/ma-gioi-thieu', label: 'Mã giới thiệu', icon: Share2 },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    default:
      return [{ path: '/profile', label: 'Tài khoản', icon: User }];
  }
}

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const activeRole = user?.activeRole || '';
  const menuItems = getMenuForRole(activeRole);
  const systemItem: MenuItem = { path: '/xay-dung-he-thong', label: 'Xây dựng hệ thống', icon: Network };
  const aiItem: MenuItem = { path: '/ai', label: 'Trợ lý AI', icon: Bot };
  const hasAiItem = menuItems.some((item) => item.path === aiItem.path);
  const activeRoleName = ROLE_NAMES[activeRole] || activeRole;

  const initials = user?.fullName
    ? user.fullName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  return (
    <aside className="fixed bottom-0 left-0 top-14 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="border-b border-gray-100 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="h-10 w-10 rounded-full object-contain" />
          <div>
            <div className="text-sm font-black text-[#25202a]">Sổ Đỏ Vạn Phúc</div>
            <div className="text-[11px] font-medium text-[#667085]">Nền tảng BĐS thông minh</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                isActive ? 'bg-red-50 text-[#c40012]' : 'text-[#667085] hover:bg-gray-50 hover:text-[#25202a]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
              {item.label}
            </Link>
          );
        })}

        <Link
          to={systemItem.path}
          className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
            location.pathname === systemItem.path || location.pathname.startsWith(systemItem.path + '/')
              ? 'bg-red-50 text-[#c40012]'
              : 'text-[#667085] hover:bg-gray-50 hover:text-[#25202a]'
          }`}
        >
          <Network className="h-5 w-5 shrink-0" />
          {systemItem.label}
        </Link>

        {!hasAiItem ? (
          <Link
            to={aiItem.path}
            className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              location.pathname === aiItem.path || location.pathname.startsWith(aiItem.path + '/')
                ? 'bg-red-50 text-[#c40012]'
                : 'text-[#667085] hover:bg-gray-50 hover:text-[#25202a]'
            }`}
          >
            <Bot className="h-5 w-5 shrink-0" />
            {aiItem.label}
          </Link>
        ) : null}

        <Link
          to="/profile"
          className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
            location.pathname === '/profile' ? 'bg-red-50 text-[#c40012]' : 'text-[#667085] hover:bg-gray-50 hover:text-[#25202a]'
          }`}
        >
          <User className="h-5 w-5 shrink-0" />
          Tài khoản
        </Link>
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-red-50">
              <span className="text-sm font-black text-[#c40012]">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#25202a]">{user?.fullName}</p>
            <p className="truncate text-xs font-medium text-[#667085]">{activeRoleName}</p>
          </div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#c40012] transition-colors hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
