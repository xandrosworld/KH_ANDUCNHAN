import { BarChart3, Home as HomeIcon, HousePlus, QrCode, UsersRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard', label: 'KPI', icon: BarChart3 },
    { path: '/nha', label: 'Bí Kíp', icon: HomeIcon },
    { path: '/post-property', label: 'Đăng', icon: HousePlus },
    { path: '/khach-hang', label: 'Khách', icon: UsersRound },
    { path: '/referral', label: 'SVP', icon: QrCode },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#d9e4e0] bg-white/95 shadow-[0_-14px_38px_rgba(34,83,68,0.14)] backdrop-blur-xl">
      <div className="grid h-[64px] grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-md transition-colors ${
                isActive
                  ? 'text-[#2f9a4b]'
                  : 'text-[#5f706d] hover:bg-[#e8f6ec] hover:text-[#16423c]'
              }`}
            >
              {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#2f9a4b]" />}
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 1.9} />
              <span className="max-w-full truncate text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
