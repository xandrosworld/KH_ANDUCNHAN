import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo-new.png';
import { getApiBase, isApiConfigured } from '../services/apiClient';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ForgotPasswordPage() {
  usePageTitle('Quên mật khẩu | Sổ Đỏ Vạn Phúc');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Email chưa đúng định dạng.');
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
    <main className="svp-auth-shell min-h-screen bg-[#030405] px-4 py-6 font-sans text-[#F5F0E6] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[900px] flex-col justify-center">
        <Link to="/" className="mb-5 flex justify-center">
          <img src={logoImg} alt="Sổ Đỏ Vạn Phúc" className="h-24 w-auto object-contain" />
        </Link>

        <div className="mx-auto w-full max-w-[440px] rounded-lg border border-white/10 bg-[#08090C] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F6D37A]">
              <ShieldCheck className="h-4 w-4" />
              Khôi phục truy cập
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#F5F0E6]">Quên mật khẩu</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#A7ABB6]">Nhập email tài khoản, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu nếu email hợp lệ.</p>
          </div>

          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-[#F6D37A] text-[15px] font-semibold mb-2">
                Đã ghi nhận yêu cầu
              </p>
              <p className="text-[#A7ABB6] text-sm leading-relaxed mb-2">
                Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi tới{' '}
                <span className="text-[#F6D37A] font-medium">{email}</span>
                .
              </p>
              <p className="text-[#7D8291] text-[13px] leading-relaxed mb-6">
                Vui lòng kiểm tra hộp thư đến hoặc thư rác trong vài phút tới.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Về đăng nhập
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
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8291] pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="email@congty.com"
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
                  {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
                </button>
              </form>

              {/* Back to Sign In */}
              <div className="mt-6 text-center">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm text-[#F6D37A] hover:text-[#FFE8A3] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
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
