import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/svp-logo.png';
import { getApiBase, isApiConfigured } from '../services/apiClient';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ResetPasswordPage() {
  usePageTitle('Đặt lại mật khẩu | Sổ Đỏ Vạn Phúc');
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
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu mới.';
    } else if (password.length < 6) {
      nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Hai mật khẩu chưa khớp.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    if (isApiConfigured()) {
      setLoading(true);
      setErrors({});
      try {
        const response = await fetch(`${getApiBase()}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email, password }),
        });
        const json = await response.json();
        if (!response.ok || json.ok === false) {
          setErrors({ api: json.error || 'Chưa đặt lại được mật khẩu.' });
          setLoading(false);
          return;
        }
      } catch {
        setErrors({ api: 'Kết nối gián đoạn. Vui lòng thử lại.' });
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setSubmitted(true);
  };

  return (
    <main className="svp-auth-shell min-h-screen bg-[#030405] px-4 py-6 font-sans text-[#F5F0E6] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[900px] flex-col justify-center">
        <Link to="/" className="mb-5 flex justify-center">
          <img src={logoImg} alt="Sổ Đỏ Vạn Phúc" className="svp-auth-logo h-24 w-24 object-contain" />
        </Link>

        <div className="mx-auto w-full max-w-[440px] rounded-lg border border-white/10 bg-[#08090C] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F6D37A]">
              <ShieldCheck className="h-4 w-4" />
              Bảo mật tài khoản
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#F5F0E6]">Đặt lại mật khẩu</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#A7ABB6]">
              Tạo mật khẩu mới để tiếp tục sử dụng hệ thống Sổ Đỏ Vạn Phúc.
            </p>
          </div>

          {submitted ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="mb-2 text-[15px] font-semibold text-[#F6D37A]">Mật khẩu đã được cập nhật</p>
              <p className="mb-6 text-sm leading-relaxed text-[#A7ABB6]">
                Anh/chị có thể đăng nhập lại bằng mật khẩu mới.
              </p>
              <Link
                to="/sign-in"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#F6D37A] px-5 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3]"
              >
                <ShieldCheck className="h-4 w-4" />
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {errors.api && (
                <div className="mb-5 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-red-100">{errors.api}</p>
                </div>
              )}

              {isApiConfigured() && (!token || !email) && (
                <div className="mb-5 rounded-md border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-amber-100">
                    Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#F6D37A]">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D8291]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((current) => ({ ...current, password: undefined, api: undefined }));
                      }}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] py-3 pl-10 pr-11 text-sm text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D8291] transition-colors hover:text-[#A7ABB6]"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[#F6D37A]">
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D8291]" />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setErrors((current) => ({ ...current, confirmPassword: undefined, api: undefined }));
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] py-3 pl-10 pr-11 text-sm text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D8291] transition-colors hover:text-[#A7ABB6]"
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-[#B88717] py-3 text-sm font-semibold text-[#030405] transition-colors hover:bg-[#D4A020] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#F6D37A] transition-colors hover:text-[#FFE8A3]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Về đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
