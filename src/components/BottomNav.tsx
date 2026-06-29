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
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Tab definitions per role ────────────────────────────────────────

interface NavTab {
  path: string;
  label: string;
  icon: LucideIcon;
}

function getTabsForRole(role: string): NavTab[] {
  switch (role) {
    case 'chu_nha':
      return [
        { path: '/chu-nha', label: 'Trang chủ', icon: Home },
        { path: '/chu-nha/nha-cua-toi', label: 'Nhà của tôi', icon: Building2 },
        { path: '/chu-nha/gui-ban', label: 'Gửi bán', icon: Send },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'khach_mua':
      return [
        { path: '/khach-mua', label: 'Trang chủ', icon: Home },
        { path: '/khach-mua/tim-nha', label: 'Tìm nhà', icon: Search },
        { path: '/khach-mua/yeu-thich', label: 'Yêu thích', icon: Heart },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'chuyen_gia':
      return [
        { path: '/chuyen-gia', label: 'Trang chủ', icon: Home },
        { path: '/chuyen-gia/kho-nha', label: 'Kho nhà', icon: Warehouse },
        { path: '/chuyen-gia/dang-nha', label: 'Đăng nhà', icon: PlusCircle },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'chuyen_vien':
      return [
        { path: '/chuyen-vien', label: 'Trang chủ', icon: Home },
        { path: '/chuyen-vien/khach-hang', label: 'Khách hàng', icon: Users },
        { path: '/chuyen-vien/tim-nha', label: 'Tìm nhà', icon: Search },
        { path: '/chuyen-vien/lich-xem', label: 'Lịch xem', icon: Calendar },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'ctv_khach':
    case 'ctv_nguon':
      return [
        { path: '/ctv', label: 'Trang chủ', icon: Home },
        { path: '/ctv/cong-viec', label: 'Công việc', icon: Briefcase },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'nguoi_gioi_thieu':
      return [
        { path: '/gioi-thieu', label: 'Trang chủ', icon: Home },
        { path: '/gioi-thieu/ma-gioi-thieu', label: 'Giới thiệu', icon: Share2 },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    case 'admin':
    case 'giam_doc':
    case 'truong_phong':
      return [
        { path: '/quan-tri', label: 'Trang chủ', icon: Home },
        { path: '/quan-tri/nguoi-dung', label: 'Quản lý', icon: Shield },
        { path: '/quan-tri/duyet-vai-tro', label: 'Duyệt', icon: CheckSquare },
        { path: '/quan-tri/cau-hinh', label: 'Cấu hình', icon: Settings },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];

    default:
      return [
        { path: '/', label: 'Trang chủ', icon: Home },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];
  }
}

// ─── Component ──────────────────────────────────────────────────────

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const activeRole = user?.activeRole || '';
  const tabs = getTabsForRole(activeRole);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div
        className="grid h-16 items-center px-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            (tab.path !== '/' && location.pathname.startsWith(tab.path + '/'));

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-primary" />
              )}
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none max-w-full truncate px-0.5">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="pb-safe-bottom" />
    </nav>
  );
};

export default BottomNav;
