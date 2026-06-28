/**
 * AdminLoginPanel — Inline login form for the admin page.
 * When API mode is configured and user is not authenticated,
 * this panel is shown instead of admin content.
 */

import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { login } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminLoginPanelProps {
  onLoginSuccess: () => void;
}

const AdminLoginPanel = ({ onLoginSuccess }: AdminLoginPanelProps) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(t('admin.login.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(username.trim(), password);
      if (result.ok) {
        onLoginSuccess();
      } else {
        setError(result.error || t('auth.invalidCredentials'));
      }
    } catch {
      setError(t('auth.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#15151D] rounded-2xl border border-white/[0.085] p-8 sm:p-10 shadow-2xl">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-[#B88717]/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-7 w-7 text-[#B88717]" />
          </div>

          <h2 className="text-[#F6D37A] font-bold text-[22px] text-center mb-2">
            {t('admin.login.title')}
          </h2>
          <p className="text-[#7D8291] text-[13px] text-center mb-6">
            {t('admin.login.subtitle')}
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-[13px]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <label className="block mb-4">
              <span className="text-[#F6D37A] text-[13px] font-medium mb-1.5 block">
                {t('admin.login.username')}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0c0c14] border border-white/[0.1] rounded-lg px-4 py-2.5 text-[#F5F0E6] text-[14px] placeholder-[#4A4D58] focus:outline-none focus:border-[#B88717]/50 focus:ring-1 focus:ring-[#B88717]/30 transition-colors"
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </label>

            {/* Password */}
            <label className="block mb-6">
              <span className="text-[#F6D37A] text-[13px] font-medium mb-1.5 block">
                {t('auth.password')}
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0c0c14] border border-white/[0.1] rounded-lg px-4 py-2.5 pr-10 text-[#F5F0E6] text-[14px] placeholder-[#4A4D58] focus:outline-none focus:border-[#B88717]/50 focus:ring-1 focus:ring-[#B88717]/30 transition-colors"
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8291] hover:text-[#A7ABB6] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] disabled:opacity-50 disabled:cursor-not-allowed text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
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
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPanel;
