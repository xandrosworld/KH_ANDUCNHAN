import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { authApi } from '../services/authApi';
import { useBranding } from '../contexts/BrandingContext';

export default function ForgotPasswordPage() {
  const { logoUrl, siteName } = useBranding();
  usePageTitle('Quên mật khẩu | Sổ Đỏ Vạn Phúc');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(normalizedEmail);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F2EA] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#B71C1C]">
          <ArrowLeft className="h-4 w-4" />
          Về đăng nhập
        </Link>

        <section className="rounded-[28px] border border-[#E8DCC8] bg-white p-6 shadow-[0_18px_60px_rgba(66,33,11,0.12)] sm:p-8">
          <div className="mb-7 text-center">
            <img src={logoUrl} alt={siteName} className="mx-auto mb-4 h-20 w-20 rounded-full object-contain" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B71C1C]">Sổ Đỏ Vạn Phúc</p>
            <h1 className="mt-2 text-2xl font-bold text-[#2A1A14]">Quên mật khẩu</h1>
            <p className="mt-2 text-sm leading-6 text-[#75655C]">
              Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-[#B7E1C1] bg-[#F0FFF4] p-5 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#16803A]" />
              <h2 className="font-semibold text-[#166534]">Đã ghi nhận yêu cầu</h2>
              <p className="mt-2 text-sm leading-6 text-[#2F6B42]">
                Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của anh/chị.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && <div className="rounded-2xl border border-[#FFD6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B71C1C]">{error}</div>}

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#3B2B24]">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08B7F]" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[#E4D7C8] bg-[#FFFDF9] pl-10 pr-4 text-sm text-[#2A1A14] outline-none transition focus:border-[#B71C1C] focus:ring-4 focus:ring-[#B71C1C]/10"
                    placeholder="email@sodovanphuc.vn"
                    type="email"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#B71C1C] text-sm font-bold text-white shadow-[0_12px_30px_rgba(183,28,28,0.25)] transition hover:bg-[#931515] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Gửi hướng dẫn
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
