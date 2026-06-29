import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { authApi } from '../services/authApi';

const ROLE_OPTIONS = [
  { value: 'chu_nha', label: 'Chủ nhà' },
  { value: 'khach_mua', label: 'Khách mua' },
  { value: 'chuyen_gia', label: 'Chuyên gia / Đầu chủ' },
  { value: 'chuyen_vien', label: 'Chuyên viên / Đầu khách' },
  { value: 'ctv_khach', label: 'CTV tìm khách' },
  { value: 'ctv_nguon', label: 'CTV tìm nguồn' },
  { value: 'nguoi_gioi_thieu', label: 'Người giới thiệu' },
  { value: 'doi_tac', label: 'Đối tác' },
];

export default function RegisterPage() {
  usePageTitle('Tạo tài khoản | Sổ Đỏ Vạn Phúc');
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleSlug, setRoleSlug] = useState('chuyen_gia');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim()) return setError('Vui lòng nhập họ tên.');
    if (!phone.trim()) return setError('Vui lòng nhập số điện thoại.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Email chưa đúng định dạng.');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự.');
    if (password !== confirmPassword) return setError('Hai mật khẩu chưa khớp.');

    setLoading(true);
    setError('');
    try {
      await authApi.register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        password,
        roleSlug,
        referralCode: referralCode.trim() || undefined,
      });
      navigate('/pending-approval');
    } catch (err: any) {
      setError(err.message || 'Chưa tạo được tài khoản. Vui lòng thử lại.');
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
          <h1 className="text-2xl font-bold text-text-primary">Tạo tài khoản</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Chọn vai trò sử dụng hệ thống. Quản trị viên sẽ duyệt trước khi tài khoản hoạt động.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Họ tên">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ tên" className="svp-input" />
          </Field>

          <Field label="Số điện thoại">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" className="svp-input" inputMode="tel" />
          </Field>

          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@congty.com" className="svp-input" type="email" />
          </Field>

          <Field label="Vai trò đăng ký">
            <select value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)} className="svp-input">
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Mã giới thiệu (nếu có)">
            <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Nhập mã giới thiệu" className="svp-input" />
          </Field>

          <Field label="Mật khẩu">
            <PasswordInput value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} placeholder="Tối thiểu 6 ký tự" />
          </Field>

          <Field label="Nhập lại mật khẩu">
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} placeholder="Nhập lại mật khẩu" />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Đang gửi yêu cầu...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Đã có tài khoản?{' '}
          <Link to="/" className="font-semibold text-primary">Đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  setShow,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="svp-input pr-11"
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
  );
}
