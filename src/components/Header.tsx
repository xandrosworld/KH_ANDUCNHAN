import { useEffect, useState, useCallback } from 'react';
import type { CSSProperties, MouseEvent, FormEvent } from 'react';
import { Bot, ChevronDown, Menu, X, LogOut, LayoutDashboard, User, Globe, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo-new.png';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserItem } from '../utils/userStorage';
import { isApiConfigured, getApiBase, toProxyUrl } from '../services/apiClient';

export const HEADER_HEIGHT = 68;
const MOBILE_HEADER_HEIGHT = 104;

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [showCpCurrent, setShowCpCurrent] = useState(false);
  const [showCpNew, setShowCpNew] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Auth state - read on mount and on route change via key
  const readUser = useCallback((): { name: string; email: string; role?: string } | null => {
    try {
      const raw = localStorage.getItem('gf_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.loggedIn) return { name: parsed.name, email: parsed.email, role: parsed.role };
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(readUser);
  const dashboardPath = '/dashboard';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try { return getUserItem('gf_avatar') || null; } catch { return null; }
  });

  // Listen for avatar changes (from DashboardPage)
  useEffect(() => {
    const checkAvatar = () => {
      try { setAvatarUrl(getUserItem('gf_avatar') || null); } catch { /* ignore */ }
    };
    window.addEventListener('storage', checkAvatar);
    window.addEventListener('avatar-changed', checkAvatar);
    checkAvatar();
    return () => {
      window.removeEventListener('storage', checkAvatar);
      window.removeEventListener('avatar-changed', checkAvatar);
    };
  }, [location.pathname]);
  const { lang, setLang, t } = useLanguage();

  // Re-read on route change
  const currentUser = readUser();
  if ((currentUser?.email ?? null) !== (user?.email ?? null)) {
    setUser(currentUser);
  }

  useEffect(() => {
    const onStorage = () => setUser(readUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [readUser]);

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[aria-label="Open user menu"]') && !target.closest('.absolute.right-0.top-full')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [userMenuOpen]);

  // Close user menu on route change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserMenuOpen(false);
      setIsMobileMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('gf_user');
    setUser(null);
    setUserMenuOpen(false);
    navigate('/');
  };

  const openChangePass = () => {
    setUserMenuOpen(false);
    setCpCurrent(''); setCpNew(''); setCpConfirm('');
    setCpError(''); setCpSuccess(false); setCpLoading(false);
    setShowCpCurrent(false); setShowCpNew(false);
    setChangePassOpen(true);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setCpError('');
    if (!cpCurrent) { setCpError(t('auth.currentPasswordRequired')); return; }
    if (cpNew.length < 6) { setCpError(t('auth.passwordMin')); return; }
    if (cpNew !== cpConfirm) { setCpError(t('auth.passwordsNoMatch')); return; }
    if (!isApiConfigured()) { setCpSuccess(true); return; }
    setCpLoading(true);
    try {
      const raw = localStorage.getItem('gf_user');
      const token = raw ? JSON.parse(raw).token : '';
      const res = await fetch(`${getApiBase()}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_password: cpCurrent, new_password: cpNew }),
      });
      const json = await res.json();
      if (!res.ok) { setCpError(json.error || t('auth.changePasswordFailed')); setCpLoading(false); return; }
      setCpSuccess(true);
    } catch { setCpError(t('auth.networkTryAgain')); }
    setCpLoading(false);
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    setUserMenuOpen(false);

    if (window.location.pathname === '/dashboard' && !window.location.search && !window.location.hash) {
      window.location.reload();
      return;
    }

    window.location.assign('/dashboard');
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const leftNav = [
    { label: 'Tổng quan', path: '/dashboard' },
    { label: 'Bí Kíp', path: '/nha' },
    { label: 'Đăng Bí Kíp', path: '/post-property' },
    { label: 'Khách hàng', path: '/khach-hang' },
    { label: 'Giới thiệu', path: '/referral' },
    { label: 'Trợ lý AI', path: '/ai' },
    { label: 'Cấu hình', path: '/admin/config' },
  ];

  const mobileMenuItems = [
    ...leftNav.map((item) => ({ ...item, expandable: true })),
  ];

  const mobileToggles = (
    <div className="flex items-center gap-3 px-7 py-4 border-b border-white/10">
      <button
        onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] text-[14px] font-medium text-[#A7ABB6] hover:text-[#F6D37A] transition-colors"
      >
        <Globe className="h-4 w-4" />
        {lang === 'en' ? 'Tiếng Việt' : 'English'}
      </button>
    </div>
  );

  const mobileHeaderProgress = isMobileMenuOpen ? 1 : 0;
  const currentMobileHeaderHeight = MOBILE_HEADER_HEIGHT;
  const mobileLogoHeight = 128;
  const mobileLogoWidth = 116;
  const mobileHeaderStyle = {
    '--mobile-header-bg': (mobileHeaderProgress * 0.95).toFixed(2),
    '--mobile-header-border': (mobileHeaderProgress * 0.1).toFixed(2),
    '--mobile-header-shadow': (mobileHeaderProgress * 0.35).toFixed(2),
  } as CSSProperties;
  const mobilePositionClass = 'sticky';
  const mobileHeaderClass = `gf-mobile-header ${mobilePositionClass} top-0 ${isMobileMenuOpen ? 'z-[80] backdrop-blur-xl' : 'z-[70] backdrop-blur-0'} w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-150 lg:sticky lg:top-0 lg:z-50 lg:w-full lg:backdrop-blur-xl`;
  const mobileIconClass = 'text-[#16423c] hover:text-[#2f9a4b]';
  const mobileActionClass = 'rounded-full bg-[#2f9a4b] text-white shadow-md hover:bg-[#268642]';

  return (
    <>
    <header
      className={mobileHeaderClass}
      style={mobileHeaderStyle}
    >
      {/* Outer wrapper: full width */}
      <div
        className="gf-header-inner relative flex items-center px-4"
        style={{ '--mobile-header-height': `${currentMobileHeaderHeight}px` } as CSSProperties}
      >

        {/* Mobile hamburger */}
        <button
          className={`absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center lg:hidden transition-colors ${mobileIconClass}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop: constrained center container — max-width kéo 2 cụm vào gần logo */}
        <div className="hidden lg:grid flex-1 grid-cols-[1fr_auto_1fr] items-center max-w-[1280px] mx-auto">

          {/* Left nav */}
          <nav className="flex items-center justify-self-start" style={{ gap: '2px', fontSize: '13.5px', fontWeight: 600, color: '#16423c' }}>
            {leftNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-[#F6D37A]/10 text-[#F6D37A]'
                    : 'hover:text-[#F6D37A] hover:bg-white/[0.055]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logo — center */}
          <Link
            to="/dashboard"
            onClick={handleLogoClick}
            className="flex items-center justify-center select-none justify-self-center"
            aria-label="Sổ Đỏ Vạn Phúc"
          >
            <img
              src={logoImg}
              alt="Sổ Đỏ Vạn Phúc"
              className="object-contain flex-shrink-0 drop-shadow-[0_8px_16px_rgba(246,211,122,0.14)]"
              style={{ height: '98px', width: '88px' }}
            />
          </Link>

          {/* Right actions */}
          <nav className="flex items-center justify-self-end" style={{ gap: '2px', fontSize: '13.5px', fontWeight: 600, color: '#16423c' }}>
            {/* Language Toggle */}
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-[#A7ABB6] hover:text-[#F6D37A] transition-colors"
                title={t('header.switchLanguage')}
              >
                <Globe className="h-3 w-3" />
                {lang === 'en' ? 'VN' : 'EN'}
              </button>
            </div>
            {user ? (
              <div className="relative ml-1.5">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#B88717]/20 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={toProxyUrl(avatarUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#F6D37A] text-[11px] font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-[13px] text-[#F5F0E6] font-medium max-w-[100px] truncate hidden xl:inline">{user.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[#7D8291] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[200px] bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.085]">
                      <div className="text-[13px] font-semibold text-[#F5F0E6] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#7D8291] truncate">{user.email}</div>
                    </div>
                    <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                      <LayoutDashboard className="h-4 w-4" /> Tổng quan
                    </Link>
                    <Link to="/khach-hang" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                      <User className="h-4 w-4" /> Khách hàng
                    </Link>
                    <Link to="/post-property" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                      <User className="h-4 w-4" /> Đăng nhà
                    </Link>
                    <Link to="/ai" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                      <Bot className="h-4 w-4" /> Trợ lý AI
                    </Link>
                    <button onClick={openChangePass} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                      <KeyRound className="h-4 w-4" /> {t('auth.changePassword')}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-400 hover:bg-white/[0.06] transition-colors border-t border-white/[0.085]">
                      <LogOut className="h-4 w-4" /> {t('nav.signout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="ml-1.5 px-3.5 py-1.5 rounded-full bg-[#F6D37A] text-[#08090B] font-semibold shadow-[0_10px_24px_rgba(246,211,122,0.18)] hover:bg-[#FFE8A3] transition-colors whitespace-nowrap"
                style={{ fontSize: '13.5px' }}
              >
                {t('nav.signin')}
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile: QR below hamburger */}
        <img
          src="/assets/extended-qr.svg"
          alt="QR Code"
          className="absolute left-9 top-[calc(50%+18px)] h-8 w-8 -translate-x-1/2 rounded-md border border-[#F6D37A]/25 bg-white p-0.5 shadow-sm object-contain lg:hidden"
        />
        {/* Mobile: keep each action on an independent anchor so auth width cannot shift the music toggle. */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
          {/* Logo */}
          <Link to="/dashboard" onClick={handleLogoClick} className="flex items-center justify-center select-none" aria-label="Sổ Đỏ Vạn Phúc">
            <img
              src={logoImg}
              alt="Sổ Đỏ Vạn Phúc"
              className="object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
              style={{
                height: `${mobileLogoHeight}px`,
                width: `${mobileLogoWidth}px`,
              }}
            />
          </Link>
        </div>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 lg:hidden items-center justify-end">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Open user menu"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F6D37A]/55 bg-[#1A1308]/90 shadow-[0_0_0_2px_rgba(246,211,122,0.14),0_12px_28px_rgba(246,211,122,0.18)] transition-all hover:border-[#FFE8A3] hover:bg-[#251A0A]"
              >
                {avatarUrl ? (
                  <img src={toProxyUrl(avatarUrl)} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6D37A] text-[18px] font-extrabold text-[#08090B] shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-white/[0.085]">
                    <div className="text-[13px] font-semibold text-[#F5F0E6] truncate">{user.name}</div>
                    <div className="text-[11px] text-[#7D8291] truncate">{user.email}</div>
                  </div>
                  <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                    <LayoutDashboard className="h-4 w-4" /> Tổng quan
                  </Link>
                  <Link to="/khach-hang" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                    <User className="h-4 w-4" /> Khách hàng
                  </Link>
                  <Link to="/post-property" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                    <User className="h-4 w-4" /> Đăng nhà
                  </Link>
                  <Link to="/ai" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                    <Bot className="h-4 w-4" /> Trợ lý AI
                  </Link>
                  <button onClick={openChangePass} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#D7DAE3] hover:bg-white/[0.06] transition-colors">
                    <KeyRound className="h-4 w-4" /> {t('auth.changePassword')}
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-400 hover:bg-white/[0.06] transition-colors border-t border-white/[0.085]">
                    <LogOut className="h-4 w-4" /> {t('nav.signout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/sign-in" className={`px-3.5 py-1.5 text-[14px] font-bold transition-colors ${mobileActionClass}`}>
              {t('nav.signin')}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div
          className="absolute inset-x-0 z-[90] min-h-[calc(100vh-104px)] lg:hidden overflow-y-auto border-t border-[#d9e4e0] bg-white shadow-[0_24px_70px_rgba(34,83,68,0.18)]"
          style={{
            top: `${currentMobileHeaderHeight}px`,
            maxHeight: `calc(100vh - ${currentMobileHeaderHeight}px)`,
          }}
          aria-label="Mobile navigation"
        >
          {mobileToggles}
          <nav className="border-t border-[#d9e4e0]">
            {mobileMenuItems.map((item) => (
              <Link
                key={`${item.label}-${item.path}`}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-[66px] items-center border-b border-[#d9e4e0] text-[#16423c] transition-colors hover:bg-[#e8f6ec] hover:text-[#2f9a4b]"
              >
                <span className="flex-1 px-7 text-[24px] font-medium leading-none">
                  {item.label}
                </span>
                {item.expandable && (
                  <span className="flex h-full w-[72px] items-center justify-center border-l border-[#d9e4e0] bg-[#f4faf7] text-[#2f9a4b]">
                    <ChevronDown className="h-7 w-7" strokeWidth={2.6} />
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}

    </header>

      {/* Change Password Modal */}
      {changePassOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setChangePassOpen(false)}
          onTouchEnd={(e) => { if (e.target === e.currentTarget) setChangePassOpen(false); }}
        >
          <div className="relative w-full max-w-[400px] bg-[#15151D] rounded-2xl border border-white/[0.085] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Close X button — always visible */}
            <button
              onClick={() => setChangePassOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#7D8291] hover:text-[#F5F0E6] transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#B88717]/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#B88717]" />
              </div>
              <h2 className="text-lg font-bold text-[#F6D37A]">{t('auth.changePassword')}</h2>
            </div>

            {cpSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-[#F6D37A] font-semibold mb-1">{t('auth.passwordChanged')}</p>
                <p className="text-[#7D8291] text-sm mb-4">{t('auth.passwordChangedDesc')}</p>
                <button
                  onClick={() => { setChangePassOpen(false); navigate('/'); }}
                  className="px-5 py-2.5 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-sm transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                {cpError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                    <p className="text-[13px] text-red-400">{cpError}</p>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-[#F6D37A] mb-1.5">{t('auth.currentPassword')}</label>
                  <div className="relative">
                    <input
                      type={showCpCurrent ? 'text' : 'password'}
                      value={cpCurrent}
                      onChange={e => setCpCurrent(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-4 pr-10 py-2.5 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                    />
                    <button type="button" onClick={() => setShowCpCurrent(!showCpCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8291] hover:text-[#A7ABB6]">
                      {showCpCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[#F6D37A] mb-1.5">{t('auth.newPassword')}</label>
                  <div className="relative">
                    <input
                      type={showCpNew ? 'text' : 'password'}
                      value={cpNew}
                      onChange={e => setCpNew(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-4 pr-10 py-2.5 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                    />
                    <button type="button" onClick={() => setShowCpNew(!showCpNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8291] hover:text-[#A7ABB6]">
                      {showCpNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-[#F6D37A] mb-1.5">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    value={cpConfirm}
                    onChange={e => setCpConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-4 pr-4 py-2.5 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setChangePassOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.085] text-[#A7ABB6] hover:bg-white/[0.04] text-sm font-medium transition-colors">
                    {t('btn.cancel')}
                  </button>
                  <button type="submit" disabled={cpLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-sm transition-colors disabled:opacity-60">
                    {cpLoading ? t('auth.changingPassword') : t('auth.changePassword')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
