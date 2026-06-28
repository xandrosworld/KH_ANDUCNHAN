import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase, isApiConfigured } from '../services/apiClient';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return false;
    }
    if (!emailRegex.test(email)) {
      setError(t('err.invalidEmail'));
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isApiConfigured()) {
      setLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const json = await res.json();
        if (!res.ok && json.error) {
          setError(json.error);
          setLoading(false);
          return;
        }
      } catch {
        // Still show success to prevent email enumeration
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
              <h1 className="text-xl font-bold text-[#F6D37A]">{t('auth.forgotTitle')}</h1>
              <p className="text-sm text-[#7D8291]">{t('auth.forgotDesc')}</p>
            </div>
          </div>

          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-[#F6D37A] text-[15px] font-semibold mb-2">
                {t('auth.resetInstructionsSent')}
              </p>
              <p className="text-[#A7ABB6] text-sm leading-relaxed mb-2">
                {t('auth.resetInstructionsDesc').split('{email}')[0]}
                <span className="text-[#F6D37A] font-medium">{email}</span>
                {t('auth.resetInstructionsDesc').split('{email}')[1]}
              </p>
              {isApiConfigured() ? (
                <p className="text-[#7D8291] text-[13px] leading-relaxed mb-6">
                  {t('auth.resetCheckInbox')}
                </p>
              ) : (
                <p className="text-[#7D8291] text-[13px] leading-relaxed mb-6">
                  <span className="text-[#F6D37A] font-medium">{t('common.demoMode')}</span> {t('auth.resetDemo')}
                </p>
              )}
              <div className="flex flex-col items-center gap-3">
                {!isApiConfigured() && (
                  <Link
                    to="/reset-password"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
                  >
                    {t('auth.resetNow')}
                  </Link>
                )}
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] pl-10 pr-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                    />
                  </div>
                  {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
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
