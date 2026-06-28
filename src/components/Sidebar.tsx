import { useEffect, useState } from 'react';
import { BarChart3, Home as HomeIcon, HousePlus, QrCode, UsersRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { HEADER_HEIGHT } from './Header';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'KPI', icon: BarChart3 },
    { path: '/nha', label: 'Bí Kíp', icon: HomeIcon },
    { path: '/post-property', label: 'Đăng', icon: HousePlus },
    { path: '/khach-hang', label: 'Khách', icon: UsersRound },
    { path: '/referral', label: 'SVP', icon: QrCode },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setCollapsed(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Width: expanded = 72px, collapsed = 52px (icon only)
  const sidebarWidth = collapsed ? 52 : 72;

  return (
    <aside
      className="hidden lg:block fixed left-0 bottom-0 z-40 border-r border-white/10 bg-[#060708]/95 shadow-[12px_0_36px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200"
      style={{ width: `${sidebarWidth}px`, top: `${HEADER_HEIGHT}px` }}
    >
      <nav className="flex flex-col items-center pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}  /* tooltip khi collapsed */
              className={`group relative mx-1 flex flex-col items-center justify-center overflow-hidden rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-[#F6D37A]/10 text-[#F6D37A]'
                  : 'text-[#B8BBC4] hover:bg-white/[0.055] hover:text-[#F5F0E6]'
              }`}
              style={{
                width: `calc(100% - ${collapsed ? 8 : 10}px)`,
                height: collapsed ? '52px' : '64px',
                gap: collapsed ? '0px' : '4px',
              }}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#F6D37A]" />
              )}
              <Icon
                className="flex-shrink-0 transition-all duration-200"
                style={{
                  width: collapsed ? '20px' : '22px',
                  height: collapsed ? '20px' : '22px',
                }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {/* Text label — ẩn khi collapsed */}
              {!collapsed && (
                <span
                  className={`text-center leading-tight font-medium transition-opacity duration-200 ${
                    isActive ? 'text-[#F6D37A]' : 'text-[#A7ABB6] group-hover:text-[#F5F0E6]'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const SCROLL_THRESHOLD = 40;

export default Sidebar;
