import { useState, type FormEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { isApiConfigured, getApiBase } from '../services/apiClient';
import { migrateUserStorage } from '../utils/userStorage';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  usePageTitle('Tạo tài khoản | Sổ Đỏ Vạn Phúc');
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên.';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email chưa đúng định dạng.';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Hai mật khẩu chưa khớp.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (isApiConfigured()) {
        // Register via API
        const url = `${getApiBase()}/api/auth/register`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: '',
          }),
        });
        const json = await response.json();

        if (json.ok && json.data) {
          // Auto-login after registration
          const loginUrl = `${getApiBase()}/api/auth/user-login`;
          const loginResp = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          const loginJson = await loginResp.json();

          if (loginJson.ok && loginJson.data) {
            localStorage.setItem(
              'gf_user',
              JSON.stringify({
                id: loginJson.data.id,
                email: loginJson.data.email,
                name: loginJson.data.name,
                loggedIn: true,
                role: loginJson.data.role || 'user',
                token: loginJson.data.token,
              })
            );
            migrateUserStorage();
          } else {
            // Registration succeeded but auto-login failed — just store basic info
            localStorage.setItem(
              'gf_user',
              JSON.stringify({ id: json.data?.id || `user_${Date.now()}`, email: email.trim(), name: name.trim(), loggedIn: true })
            );
            migrateUserStorage();
          }
          navigate('/dashboard');
          return;
        }

        // API error
        setErrors({ general: json.error || 'Chưa tạo được tài khoản. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }

      // Demo mode: localStorage only
      localStorage.setItem(
        'gf_user',
        JSON.stringify({ id: `demo_${Date.now()}`, email, name: name.trim(), loggedIn: true })
      );
      migrateUserStorage();
      navigate('/dashboard');
    } catch {
      setErrors({ general: 'Chưa kết nối được hệ thống. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="svp-auth-shell min-h-screen bg-[#030405] px-4 py-6 font-sans text-[#F5F0E6] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[960px] flex-col justify-center">
        <Link to="/" className="mb-5 flex justify-center">
          <img src={logoImg} alt="Sổ Đỏ Vạn Phúc" className="h-24 w-auto object-contain" />
        </Link>

        <div className="mx-auto w-full max-w-[460px] rounded-lg border border-white/10 bg-[#08090C] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <Link to="/sign-in" className="mb-5 inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]">
            <ArrowLeft className="h-4 w-4" />
            Đăng nhập
          </Link>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F6D37A]">
              <ShieldCheck className="h-4 w-4" />
              Sổ Đỏ Vạn Phúc
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#F5F0E6]">Tạo tài khoản</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#A7ABB6]">Dành cho nhân sự/đối tác được phân quyền sử dụng hệ thống.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                Họ tên
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError('name'); }}
                  placeholder="Nhập họ tên"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="email@congty.com"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
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
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  placeholder="Tối thiểu 6 ký tự"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-11 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D8291] hover:text-[#A7ABB6] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
                {errors.general}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo tài khoản...' : (
                <span className="inline-flex items-center gap-2">
                  Tạo tài khoản
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-[#7D8291]">
            Đã có tài khoản?{' '}
            <Link to="/sign-in" className="text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
