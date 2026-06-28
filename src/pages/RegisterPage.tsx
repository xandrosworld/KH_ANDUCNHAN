import { useState, type FormEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { isApiConfigured, getApiBase } from '../services/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { migrateUserStorage } from '../utils/userStorage';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const { t } = useLanguage();
  usePageTitle(t('auth.register'));
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
      newErrors.name = t('auth.fullNameRequired');
    }

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!emailRegex.test(email)) {
      newErrors.email = t('err.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMin');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNoMatch');
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
        setErrors({ general: json.error || t('auth.registrationFailed') });
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
      setErrors({ general: t('auth.connectFailed') });
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
              <UserPlus className="w-5 h-5 text-[#B88717]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F6D37A]">{t('auth.register')}</h1>
              <p className="text-sm text-[#7D8291]">{t('auth.registerDesc')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError('name'); }}
                  placeholder="John Doe"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="you@example.com"
                  className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
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
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                  placeholder="••••••••"
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
              {loading ? t('auth.creatingAccount') : t('auth.register')}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-[#7D8291]">
            {t('auth.hasAccount')}{' '}
            <Link to="/sign-in" className="text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
