import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  Send,
  Bell,
  User,
  Search,
  Heart,
  Warehouse,
  PlusCircle,
  Users,
  Briefcase,
  Calendar,
  Share2,
  Shield,
  CheckSquare,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../contexts/AuthContext';

// ─── Menu items per role ─────────────────────────────────────────────

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

function getMenuForRole(role: string): MenuItem[] {
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
      ];
    case 'ctv_khach':
    case 'ctv_nguon':
      return [
        { path: '/ctv', label: 'Trang chủ', icon: Home },
        { path: '/ctv/cong-viec', label: 'Công việc', icon: Briefcase },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'nguoi_gioi_thieu':
      return [
        { path: '/gioi-thieu', label: 'Trang chủ', icon: Home },
        { path: '/gioi-thieu/ma-gioi-thieu', label: 'Giới thiệu', icon: Share2 },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
      ];
    case 'admin':
    case 'giam_doc':
    case 'truong_phong':
      return [
        { path: '/quan-tri', label: 'Trang chủ', icon: Home },
        { path: '/quan-tri/nguoi-dung', label: 'Quản lý người dùng', icon: Shield },
        { path: '/quan-tri/duyet-vai-tro', label: 'Duyệt vai trò', icon: CheckSquare },
        { path: '/quan-tri/nha', label: 'Quản lý nhà', icon: Building2 },
        { path: '/quan-tri/khach-hang', label: 'Quản lý khách', icon: Users },
        { path: '/quan-tri/cau-hinh', label: 'Cấu hình', icon: Settings },
      ];
    default:
      return [
        { path: '/', label: 'Trang chủ', icon: Home },
      ];
  }
}

// ─── Component ──────────────────────────────────────────────────────

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const activeRole = user?.activeRole || '';
  const menuItems = getMenuForRole(activeRole);
  const activeRoleName = ROLE_NAMES[activeRole] || activeRole;

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-14 bottom-0 z-40 w-64 bg-white border-r border-gray-200">
      {/* Logo section */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo11.png"
            alt="Sổ Đỏ Vạn Phúc"
            className="h-10 w-10 rounded-full object-contain"
          />
          <div>
            <div className="text-sm font-bold text-text-primary">Sổ Đỏ Vạn Phúc</div>
            <div className="text-[11px] text-text-secondary">Nền tảng BĐS thông minh</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}

        {/* Profile link */}
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
            location.pathname === '/profile'
              ? 'bg-primary/10 text-primary'
              : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
          }`}
        >
          <User className="h-5 w-5 flex-shrink-0" strokeWidth={location.pathname === '/profile' ? 2.2 : 1.8} />
          Tài khoản
        </Link>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{user?.fullName}</p>
            <p className="text-xs text-text-secondary truncate">{activeRoleName}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
