import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, approvedRoles, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (approvedRoles.length === 0) {
      navigate('/pending-approval');
      return;
    }
    const activeRole = user?.activeRole || approvedRoles[0]?.slug;
    navigate(getRoleDashboardPath(activeRole));
  }, [approvedRoles, isAuthenticated, navigate, user?.activeRole]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const email = identifier.trim();
    if (!email) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success && result.user) {
      const approved = result.approvedRoles || [];

      if (approved.length === 0) {
        navigate('/pending-approval');
      } else if (approved.length === 1) {
        navigate(getRoleDashboardPath(approved[0].slug));
      } else {
        navigate('/select-role');
      }
    } else {
      if (result.error === 'pending') {
        navigate('/pending-approval');
      } else {
        setError(result.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <img
          src="/logo11.png"
          alt="Sổ Đỏ Vạn Phúc"
          className="svp-auth-logo h-24 w-24 object-contain mb-4"
        />

        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Sổ Đỏ Vạn Phúc
        </h1>
        <p className="text-sm text-text-secondary mb-8 text-center">
          Nền tảng bất động sản thông minh
        </p>

        {/* Login form */}
        <div className="w-full max-w-sm">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email/Phone */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-text-primary mb-1.5">
                Email / Số điện thoại
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                placeholder="Nhập email hoặc SĐT"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-text-primary placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Nhập mật khẩu"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-11 text-sm text-text-primary placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-text-secondary">hoặc</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register Button */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center border-2 border-primary text-primary font-semibold rounded-lg py-3 text-sm hover:bg-primary-50 transition-colors"
          >
            Đăng ký tài khoản
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
          Kết nối Người bán – Người mua – Môi giới – Đối tác trên một nền tảng thống nhất.
        </p>
      </footer>
    </main>
  );
}
