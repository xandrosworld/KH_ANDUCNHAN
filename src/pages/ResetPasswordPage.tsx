import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { useLanguage } from '../contexts/LanguageContext';
import { isApiConfigured, getApiBase } from '../services/apiClient';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; api?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t('auth.newPasswordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMin');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmNewPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNoMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isApiConfigured()) {
      setLoading(true);
      setErrors({});
      try {
        const res = await fetch(`${getApiBase()}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email, password }),
        });
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          setErrors({ api: json.error || t('auth.resetFailed') });
          setLoading(false);
          return;
        }
      } catch {
        setErrors({ api: t('auth.networkTryAgain') });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setSubmitted(true);
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
              <KeyRound className="w-5 h-5 text-[#B88717]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F6D37A]">{t('auth.resetTitle')}</h1>
              <p className="text-sm text-[#7D8291]">{t('auth.resetDesc')}</p>
            </div>
          </div>

          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-[#F6D37A] text-[15px] font-semibold mb-2">
                {t('auth.passwordUpdated')}
              </p>
              <p className="text-[#A7ABB6] text-sm leading-relaxed mb-6">
                {t('auth.passwordUpdatedDesc')}
              </p>
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('auth.signInNewPassword')}
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Demo notice — only show when API is NOT configured */}
              {!isApiConfigured() && (
              <div className="bg-[#B88717]/[0.06] border border-[#B88717]/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-[13px] text-[#D4A020] leading-relaxed">
                  <span className="font-semibold">{t('common.demoMode')}</span> {t('auth.resetDemoPassword')}
                </p>
              </div>
              )}

              {/* API error message */}
              {errors.api && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                  <p className="text-[13px] text-red-400 leading-relaxed">{errors.api}</p>
                </div>
              )}

              {/* Missing token/email warning */}
              {isApiConfigured() && (!token || !email) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5">
                  <p className="text-[13px] text-amber-400 leading-relaxed">
                    {t('auth.invalidResetLink')}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#F6D37A] mb-1.5">
                    {t('auth.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
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
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.resetting') : t('auth.resetPassword')}
                </button>
              </form>

              {/* Back to Sign In */}
              <div className="mt-6 text-center">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
