import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Heart,
  Home,
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
import { useAuth } from '../contexts/AuthContext';

interface NavTab {
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

function getTabsForRole(role: string): NavTab[] {
  if (MANAGEMENT_ROLES.has(role)) {
    return [
      { path: '/quan-tri', label: 'Trang chủ', icon: Home },
      { path: '/quan-tri/nguoi-dung', label: 'Quản lý', icon: Shield },
      { path: '/quan-tri/duyet-vai-tro', label: 'Duyệt', icon: CheckSquare },
      { path: '/quan-tri/cau-hinh', label: 'Cấu hình', icon: Settings },
      { path: '/profile', label: 'Tài khoản', icon: User },
    ];
  }

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
        { path: '/notifications', label: 'Thông báo', icon: Bell },
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
    case 'doi_tac':
      return [
        { path: '/nguoi-gioi-thieu', label: 'Trang chủ', icon: Home },
        { path: '/nguoi-gioi-thieu/ma-gioi-thieu', label: 'Mã giới thiệu', icon: Share2 },
        { path: '/notifications', label: 'Thông báo', icon: Bell },
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];
    default:
      return [
        { path: '/profile', label: 'Tài khoản', icon: User },
      ];
  }
}

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const activeRole = user?.activeRole || '';
  const baseTabs = getTabsForRole(activeRole);
  const systemTab: NavTab = { path: '/xay-dung-he-thong', label: 'Hệ thống', icon: Network };
  const hasSystem = baseTabs.some((tab) => tab.path === systemTab.path);
  const withSystem = hasSystem ? baseTabs : [
    ...baseTabs.filter((tab) => tab.path !== '/profile'),
    systemTab,
    ...baseTabs.filter((tab) => tab.path === '/profile'),
  ];
  const profileTab = withSystem.find((tab) => tab.path === '/profile');
  const compactTabs = withSystem.length > 6
    ? [
        ...withSystem.filter((tab) => tab.path !== '/profile' && tab.path !== systemTab.path && tab.path !== '/notifications').slice(0, 4),
        systemTab,
        ...(profileTab ? [profileTab] : []),
      ]
    : withSystem;
  const tabs = compactTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="grid h-16 items-center px-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path + '/'));
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#c40012]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#c40012]" />}
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="max-w-full truncate px-0.5 text-[10px] font-bold leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="pb-safe-bottom" />
    </nav>
  );
};

export default BottomNav;
