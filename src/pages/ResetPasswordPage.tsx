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
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-center">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Đăng nhập
        </Link>

        <div className="mb-7 text-center">
          <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-bold text-text-primary">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Tạo mật khẩu mới để tiếp tục sử dụng hệ thống.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <h2 className="font-semibold text-green-800">Đã đổi mật khẩu</h2>
            <Link to="/" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <PasswordField label="Mật khẩu mới" value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} />
            <PasswordField label="Nhập lại mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} />

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cập nhật mật khẩu
            </button>
          </form>
        )}
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
      <span className="mb-1.5 block text-sm font-medium text-text-primary">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          className="svp-input pr-11"
          placeholder="Tối thiểu 6 ký tự"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
