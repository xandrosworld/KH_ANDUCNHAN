import { useState, type FormEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { login } from '../services/authService';
import { isApiConfigured, getApiBase } from '../services/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { migrateUserStorage } from '../utils/userStorage';

export default function SignInPage() {
  const { t } = useLanguage();
  usePageTitle(t('auth.signIn'));
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = t('auth.emailUsernameRequired');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMin');
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
            JSON.stringify({ id: 'admin', email: value, name: 'Admin', loggedIn: true, role: 'admin' })
          );
          migrateUserStorage();
          navigate('/admin');
          return;
        }
        // If admin login failed, show error
        setErrors({ general: result.error || t('auth.invalidCredentials') });
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
          setErrors({ general: json.error || t('auth.invalidEmailPassword') });
          setLoading(false);
          return;
        } catch {
          // API unreachable
          setErrors({ general: t('auth.connectFailed') });
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

      setErrors({ general: t('auth.invalidEmailPassword') });
    } catch {
      setErrors({ general: t('auth.connectionFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030405] flex items-center justify-center px-4 py-10 sm:py-14 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-10">
          <img
            src={logoImg}
            alt="So Do Van Phuc"
            className="h-32 w-auto object-contain drop-shadow-[0_0_28px_rgba(212,160,32,0.28)] sm:h-40 md:h-44"
          />
        </Link>

        {/* Form Card */}
        <div className="bg-[#15151D] rounded-2xl border border-white/[0.085] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#B88717]/10 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-[#B88717]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F6D37A]">{t('auth.signIn')}</h1>
              <p className="text-sm text-[#7D8291]">{t('auth.signInDesc')}</p>
            </div>
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
                {t('auth.email')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setErrors((prev) => ({ ...prev, identifier: undefined, general: undefined })); }}
                  placeholder={t('auth.emailUsernamePlaceholder')}
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.identifier && <p className="mt-1.5 text-xs text-red-400">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined, general: undefined })); }}
                  placeholder="••••••••"
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
                {t('auth.forgotPassword')}
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
                  {t('auth.signingIn')}
                </>
              ) : (
                  t('auth.signIn')
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-[#7D8291]">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
