import { useState, type FormEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { login } from '../services/authService';
import { isApiConfigured, getApiBase } from '../services/apiClient';
import { migrateUserStorage } from '../utils/userStorage';

export default function SignInPage() {
  usePageTitle('Đăng nhập | Sổ Đỏ Vạn Phúc');
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Vui lòng nhập email hoặc tài khoản.';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    setErrors({});

    const value = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    try {
      // Try admin login first (if it looks like a username, not email)
      if (!isEmail && isApiConfigured()) {
        const result = await login(value, password);
        if (result.ok) {
          // Store admin user info
          localStorage.setItem(
            'gf_user',
            JSON.stringify({ id: 'admin', email: value, name: 'Quản trị', loggedIn: true, role: 'admin' })
          );
          migrateUserStorage();
          navigate('/admin');
          return;
        }
        // If admin login failed, show error
        setErrors({ general: result.error || 'Thông tin đăng nhập chưa đúng.' });
        setLoading(false);
        return;
      }

      // Email-based: try user API login first, then fallback to localStorage
      if (isEmail && isApiConfigured()) {
        try {
          const url = `${getApiBase()}/api/auth/user-login`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: value, password }),
          });
          const json = await response.json();

          if (json.ok && json.data) {
            const userData = json.data;
            localStorage.setItem(
              'gf_user',
              JSON.stringify({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                loggedIn: true,
                role: userData.role || 'user',
                token: userData.token,
              })
            );
            migrateUserStorage();
            if (userData.role === 'admin') {
              // Also store admin token for admin panel
              sessionStorage.setItem('gf_admin_token', userData.token);
              sessionStorage.setItem('gf_admin_token_exp', String(Date.now() + 28800 * 1000));
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
            return;
          }

          // API returned error
          setErrors({ general: json.error || 'Email hoặc mật khẩu chưa đúng.' });
          setLoading(false);
          return;
        } catch {
          // API unreachable
          setErrors({ general: 'Chưa kết nối được hệ thống. Vui lòng thử lại.' });
          setLoading(false);
          return;
        }
      }

      // Fallback: demo mode (localStorage-only) — only when API is NOT configured
      if (!isApiConfigured()) {
        const displayName = value.includes('@')
          ? value.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : value;
        localStorage.setItem(
          'gf_user',
          JSON.stringify({ id: `demo_${Date.now()}`, email: value, name: displayName, loggedIn: true })
        );
        migrateUserStorage();
        navigate('/dashboard');
        return;
      }

      setErrors({ general: 'Email hoặc mật khẩu chưa đúng.' });
    } catch {
      setErrors({ general: 'Kết nối gián đoạn. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030405] px-4 py-6 font-sans text-[#F5F0E6] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1040px] flex-col justify-center gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <section className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-4">
            <img src={logoImg} alt="Sổ Đỏ Vạn Phúc" className="h-24 w-auto object-contain" />
            <div>
              <div className="text-3xl font-black text-[#F6D37A]">Sổ Đỏ Vạn Phúc</div>
              <div className="mt-2 text-[15px] leading-6 text-[#A7ABB6]">Hệ thống quản lý nguồn nhà, khách hàng và lịch xem nội bộ.</div>
            </div>
          </Link>
          <div className="mt-8 grid max-w-xl gap-3">
            {['Quản lý nguồn nhà và trạng thái xử lý', 'Theo dõi khách hàng, nhu cầu và lịch xem', 'AI hỗ trợ viết mô tả và chuẩn hóa nội dung'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-[14px] text-[#D7DAE3]">
                <ShieldCheck className="h-4 w-4 text-[#F6D37A]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="w-full">
          <Link to="/" className="mb-5 flex justify-center lg:hidden">
            <img src={logoImg} alt="Sổ Đỏ Vạn Phúc" className="h-24 w-auto object-contain" />
          </Link>

          <div className="rounded-lg border border-white/10 bg-[#08090C] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F6D37A]">
              <ShieldCheck className="h-4 w-4" />
              Khu vực nội bộ
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#F5F0E6]">Đăng nhập</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#A7ABB6]">Vào hệ thống Sổ Đỏ Vạn Phúc để quản lý nguồn nhà và khách hàng.</p>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-[13px]">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email / Username */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                Tài khoản
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setErrors((prev) => ({ ...prev, identifier: undefined, general: undefined })); }}
                  placeholder="Email hoặc tài khoản quản trị"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.identifier && <p className="mt-1.5 text-xs text-red-400">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, general: undefined })); }}
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-11 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D8291] hover:text-[#A7ABB6] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#F6D37A] hover:text-[#FFE8A3] transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#B88717] hover:bg-[#D4A020] disabled:opacity-50 disabled:cursor-not-allowed text-[#030405] font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-[#7D8291]">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors">
              Tạo tài khoản
            </Link>
          </p>
          </div>
        </section>
      </div>
    </main>
  );
}
