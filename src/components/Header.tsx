import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const activeRoleName = user?.activeRole
    ? ROLE_NAMES[user.activeRole] || user.activeRole
    : '';

  return (
    <header className="sticky top-0 z-50 h-14 bg-primary flex items-center px-4 lg:px-6 shadow-md">
      {/* Left: Logo + Name */}
      <Link to="/" className="flex items-center gap-2.5 min-w-0">
        <img
          src="/logo11.png"
          alt="Sổ Đỏ Vạn Phúc"
          className="h-8 w-8 rounded-full object-contain flex-shrink-0 bg-white/10"
        />
        <span className="text-white font-bold text-[15px] whitespace-nowrap hidden sm:block">
          Sổ Đỏ Vạn Phúc
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Bell + Avatar */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <Link
          to="/notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5 text-white" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-yellow-400 rounded-full" />
        </Link>

        {/* Avatar + Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {/* Avatar */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            )}

            {/* Role badge - desktop only */}
            <span className="hidden lg:block text-white/80 text-xs font-medium max-w-[120px] truncate">
              {activeRoleName}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform hidden lg:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {user?.email}
                </p>
                {activeRoleName && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary-50 text-primary text-[11px] font-medium rounded-full">
                    {activeRoleName}
                  </span>
                )}
              </div>

              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-text-secondary" />
                Tài khoản
              </Link>

              <Link
                to="/select-role"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-text-secondary" />
                Chuyển vai trò
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
