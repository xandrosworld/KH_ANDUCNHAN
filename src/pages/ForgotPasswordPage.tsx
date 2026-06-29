import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { authApi } from '../services/authApi';

export default function ForgotPasswordPage() {
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
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Đăng nhập
        </Link>

        <div className="mb-7 text-center">
          <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-text-primary">Quên mật khẩu</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <h2 className="font-semibold text-green-800">Đã ghi nhận yêu cầu</h2>
            <p className="mt-2 text-sm leading-6 text-green-700">
              Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text-primary">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="svp-input pl-10"
                  placeholder="email@congty.com"
                  type="email"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi hướng dẫn
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
