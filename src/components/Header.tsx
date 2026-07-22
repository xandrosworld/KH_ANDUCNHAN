import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth, ROLE_NAMES } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { logoUrl, siteName } = useBranding();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  const activeRoleName = user?.activeRole ? ROLE_NAMES[user.activeRole] || user.activeRole : '';

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center bg-[#c40012] px-4 shadow-md lg:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <img src={logoUrl} alt={siteName} className="h-8 w-8 shrink-0 rounded-full object-contain bg-white/10" />
        <span className="hidden whitespace-nowrap text-[15px] font-black text-white sm:block">{siteName}</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/10"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5 text-white" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-yellow-300" />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full border-2 border-white/30 object-cover" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/30 bg-white/20">
                <span className="text-xs font-black text-white">{initials}</span>
              </div>
            )}
            <span className="hidden max-w-[130px] truncate text-xs font-bold text-white/85 lg:block">{activeRoleName}</span>
            <ChevronDown className={`hidden h-3.5 w-3.5 text-white/65 transition-transform lg:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-black text-[#25202a]">{user?.fullName}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-[#667085]">{user?.email}</p>
                {activeRoleName && (
                  <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-[#c40012]">
                    {activeRoleName}
                  </span>
                )}
              </div>

              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-[#25202a] hover:bg-gray-50">
                <UserIcon className="h-4 w-4 text-[#667085]" />
                Tài khoản
              </Link>

              <Link to="/select-role" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-[#25202a] hover:bg-gray-50">
                <Settings className="h-4 w-4 text-[#667085]" />
                Chuyển vai trò
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-[#c40012] hover:bg-red-50"
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
