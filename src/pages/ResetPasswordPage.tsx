import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { authApi } from '../services/authApi';

export default function ResetPasswordPage() {
  usePageTitle('Đặt lại mật khẩu | Sổ Đỏ Vạn Phúc');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return setError('Liên kết đặt lại mật khẩu không hợp lệ.');
    if (password.length < 6) return setError('Mật khẩu mới tối thiểu 6 ký tự.');
    if (password !== confirmPassword) return setError('Hai mật khẩu chưa khớp.');

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, email, password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Chưa đặt lại được mật khẩu. Vui lòng thử lại.');
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
            <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto mb-4 h-20 w-20 rounded-full object-contain" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B71C1C]">Bảo mật tài khoản</p>
            <h1 className="mt-2 text-2xl font-bold text-[#2A1A14]">Đặt lại mật khẩu</h1>
            <p className="mt-2 text-sm leading-6 text-[#75655C]">
              Tạo mật khẩu mới để tiếp tục sử dụng hệ thống Sổ Đỏ Vạn Phúc.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-[#B7E1C1] bg-[#F0FFF4] p-5 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#16803A]" />
              <h2 className="font-semibold text-[#166534]">Đã đổi mật khẩu</h2>
              <Link to="/" className="mt-4 inline-flex rounded-2xl bg-[#B71C1C] px-5 py-2.5 text-sm font-bold text-white">
                Đăng nhập lại
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && <div className="rounded-2xl border border-[#FFD6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B71C1C]">{error}</div>}

              <PasswordField label="Mật khẩu mới" value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} />
              <PasswordField label="Nhập lại mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} />

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#B71C1C] text-sm font-bold text-white shadow-[0_12px_30px_rgba(183,28,28,0.25)] transition hover:bg-[#931515] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Cập nhật mật khẩu
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#3B2B24]">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          className="h-12 w-full rounded-2xl border border-[#E4D7C8] bg-[#FFFDF9] px-4 pr-11 text-sm text-[#2A1A14] outline-none transition focus:border-[#B71C1C] focus:ring-4 focus:ring-[#B71C1C]/10"
          placeholder="Tối thiểu 6 ký tự"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A08B7F]"
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
