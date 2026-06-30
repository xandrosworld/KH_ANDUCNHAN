import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getRoleDashboardPath, PUBLIC_REGISTRATION_ROLES } from '../data/roles';
import { useAuth } from '../contexts/AuthContext';
import {
  SvpAppleIcon,
  SvpBoltIcon,
  SvpBriefcaseIcon,
  SvpCrownIcon,
  SvpExpertIcon,
  SvpEyeIcon,
  SvpEyeOffIcon,
  SvpFacebookIcon,
  SvpGiftIcon,
  SvpGoogleIcon,
  SvpHandshakeIcon,
  SvpHouseIcon,
  SvpLockIcon,
  SvpLoginIcon,
  SvpMailIcon,
  SvpMapPinIcon,
  SvpPeopleIcon,
  SvpPhoneIcon,
  SvpSearchHomeIcon,
  SvpShieldIcon,
  SvpTargetIcon,
  SvpUserIcon,
  SvpZaloIcon,
} from './SvpIcons';

type AuthPanel = 'login' | 'register';

interface AuthLandingProps {
  initialPanel?: AuthPanel;
}

const roleIconMap: Record<string, typeof SvpHouseIcon> = {
  khach_mua: SvpSearchHomeIcon,
  chu_nha: SvpHouseIcon,
  chuyen_vien: SvpPeopleIcon,
  chuyen_gia: SvpExpertIcon,
  nguoi_gioi_thieu: SvpPeopleIcon,
  ctv_khach: SvpHandshakeIcon,
  ctv_nguon: SvpHouseIcon,
  tro_ly: SvpHandshakeIcon,
  thu_ky: SvpShieldIcon,
  truong_phong: SvpBriefcaseIcon,
  pho_phong: SvpBriefcaseIcon,
  giam_doc_khoi: SvpCrownIcon,
  pho_giam_doc_khoi: SvpCrownIcon,
  giam_doc: SvpCrownIcon,
  pho_giam_doc_khu_vuc: SvpCrownIcon,
  giam_doc_dieu_hanh: SvpCrownIcon,
  pho_giam_doc_dieu_hanh: SvpCrownIcon,
  doi_tac: SvpHandshakeIcon,
};

const roleColorMap: Record<string, string> = {
  khach_mua: 'from-emerald-500 to-emerald-600',
  chu_nha: 'from-orange-500 to-red-500',
  chuyen_vien: 'from-sky-500 to-blue-600',
  chuyen_gia: 'from-violet-500 to-purple-600',
  nguoi_gioi_thieu: 'from-pink-500 to-rose-500',
  ctv_khach: 'from-lime-500 to-green-600',
  ctv_nguon: 'from-emerald-500 to-teal-600',
  tro_ly: 'from-teal-500 to-cyan-600',
  thu_ky: 'from-indigo-500 to-blue-600',
  truong_phong: 'from-amber-500 to-orange-500',
  pho_phong: 'from-amber-400 to-yellow-600',
  giam_doc_khoi: 'from-red-600 to-rose-700',
  pho_giam_doc_khoi: 'from-red-500 to-pink-600',
  giam_doc: 'from-[#c40012] to-red-800',
  pho_giam_doc_khu_vuc: 'from-[#d13b2f] to-red-700',
  giam_doc_dieu_hanh: 'from-slate-800 to-[#c40012]',
  pho_giam_doc_dieu_hanh: 'from-slate-700 to-red-700',
  doi_tac: 'from-cyan-500 to-blue-600',
};

const stats = [
  { value: '25.000+', label: 'Thành viên', sub: 'đang hoạt động', icon: SvpPeopleIcon, color: 'text-red-600 bg-red-50' },
  { value: '10.000+', label: 'Nguồn nhà', sub: 'đã đăng tải', icon: SvpHouseIcon, color: 'text-amber-600 bg-amber-50' },
  { value: '2.000+', label: 'Giao dịch', sub: 'thành công', icon: SvpHandshakeIcon, color: 'text-emerald-600 bg-emerald-50' },
  { value: '63', label: 'Tỉnh thành', sub: 'trên toàn quốc', icon: SvpMapPinIcon, color: 'text-blue-600 bg-blue-50' },
];

const benefits = [
  { title: 'Minh bạch', desc: 'Thông tin rõ ràng, xác thực, dễ kiểm chứng', icon: SvpShieldIcon, color: 'text-red-600 bg-red-50' },
  { title: 'An toàn', desc: 'Bảo mật dữ liệu và phân quyền chặt chẽ', icon: SvpLockIcon, color: 'text-blue-600 bg-blue-50' },
  { title: 'Nhanh chóng', desc: 'Quy trình tối ưu, tiết kiệm thời gian', icon: SvpBoltIcon, color: 'text-emerald-600 bg-emerald-50' },
  { title: 'Hiệu quả', desc: 'Kết nối đúng người, chốt giao dịch tốt hơn', icon: SvpTargetIcon, color: 'text-orange-600 bg-orange-50' },
];

const SOCIAL_LOGIN_LINKS = {
  google: 'https://accounts.google.com/',
  facebook: 'https://www.facebook.com/login/',
  apple: 'https://appleid.apple.com/',
  zalo: 'https://id.zalo.me/account',
};

const SUPPORT_PHONE = '0912886794';
const SUPPORT_PHONE_LABEL = '0912 886 794';
const SUPPORT_EMAIL = 'contact@sodovanphuc.vn';
const SUPPORT_ZALO_URL = `https://zalo.me/${SUPPORT_PHONE}`;

export default function AuthLanding({ initialPanel = 'login' }: AuthLandingProps) {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, approvedRoles, user } = useAuth();
  const registerRef = useRef<HTMLDivElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (approvedRoles.length === 0) {
      navigate('/pending-approval');
      return;
    }
    const activeRole = user?.activeRole || approvedRoles[0]?.slug;
    navigate(getRoleDashboardPath(activeRole));
  }, [approvedRoles, isAuthenticated, navigate, user?.activeRole]);

  useEffect(() => {
    if (initialPanel === 'register') {
      window.setTimeout(() => registerRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
    }
  }, [initialPanel]);

  const routeAfterAuth = (roles: { slug: string; status: string }[]) => {
    const approved = roles.filter((role) => role.status === 'approved');
    if (approved.length === 0) {
      navigate('/pending-approval');
      return;
    }
    if (approved.length === 1) {
      navigate(getRoleDashboardPath(approved[0].slug));
      return;
    }
    navigate('/select-role');
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (loginLoading) return;

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) return setLoginError('Vui lòng nhập số điện thoại hoặc email.');
    if (!loginPassword) return setLoginError('Vui lòng nhập mật khẩu.');

    setLoginLoading(true);
    setLoginError('');
    const result = await login(normalizedIdentifier, loginPassword);
    setLoginLoading(false);

    if (result.success && result.user) {
      routeAfterAuth(result.user.roles);
      return;
    }
    if (result.error === 'pending') {
      navigate('/pending-approval');
      return;
    }
    setLoginError(result.error || 'Thông tin đăng nhập chưa đúng. Vui lòng thử lại.');
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (registerLoading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim()) return setRegisterError('Vui lòng nhập họ và tên theo CCCD.');
    if (!phone.trim()) return setRegisterError('Vui lòng nhập số điện thoại.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setRegisterError('Email chưa đúng định dạng.');
    if (registerPassword.length < 6) return setRegisterError('Mật khẩu cần tối thiểu 6 ký tự.');
    if (selectedRoles.length === 0) return setRegisterError('Vui lòng chọn ít nhất một nhu cầu hoặc vai trò.');
    if (!acceptedTerms) return setRegisterError('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');

    setRegisterLoading(true);
    setRegisterError('');
    try {
      const response = await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        password: registerPassword,
        roleSlugs: selectedRoles,
        referralCode: referralCode.trim() || undefined,
      });

      if (response.user?.roles?.length) {
        routeAfterAuth(response.user.roles);
        return;
      }

      navigate('/pending-approval');
    } catch (error: any) {
      setRegisterError(error.message || 'Chưa tạo được tài khoản. Vui lòng thử lại.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const toggleRole = (slug: string) => {
    setRegisterError('');
    setSelectedRoles((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  return (
    <main className="svp-auth-page min-h-screen bg-[#fff8f2] text-[#25202a]">
      <div className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[460px] bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/svp-auth-hero.png')" }}
        />
        <div className="absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-white/20 via-white/60 to-[#fff8f2]" />
        <div className="absolute inset-x-0 top-[330px] h-48 bg-gradient-to-b from-transparent to-[#fff8f2]" />

        <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-7 pt-4 sm:px-6 lg:px-8">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-10 w-10" />
            <div className="relative">
              <button
                type="button"
                data-testid="auth-support-toggle"
                aria-expanded={supportOpen}
                aria-controls="auth-support-menu"
                onClick={() => setSupportOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-semibold text-[#4f4a55] shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:text-[#c40012] hover:ring-[#c40012]/25"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-[#d7d0c8] text-xs">?</span>
                Hỗ trợ
              </button>
              {supportOpen ? (
                <div
                  id="auth-support-menu"
                  data-testid="auth-support-menu"
                  className="absolute right-0 z-30 mt-3 w-[min(330px,calc(100vw-2rem))] rounded-2xl border border-[#eadfd7] bg-white p-4 text-left shadow-[0_18px_55px_rgba(45,24,18,0.16)]"
                >
                  <div className="mb-3">
                    <p className="text-sm font-black uppercase tracking-[0.08em] text-[#c40012]">Hỗ trợ nhanh</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-[#626976]">
                      Liên hệ đội Sổ Đỏ Vạn Phúc khi cần hỗ trợ đăng nhập, đăng ký hoặc phê duyệt tài khoản.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <SupportLink href={`tel:${SUPPORT_PHONE}`} icon={<SvpPhoneIcon className="h-5 w-5" />} title="Gọi hotline" desc={SUPPORT_PHONE_LABEL} />
                    <SupportLink href={SUPPORT_ZALO_URL} icon={<SvpZaloIcon className="h-5 w-5" />} title="Nhắn Zalo" desc={SUPPORT_PHONE_LABEL} external />
                    <SupportLink href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Cần hỗ trợ tài khoản Sổ Đỏ Vạn Phúc')}`} icon={<SvpMailIcon className="h-5 w-5" />} title="Gửi email" desc={SUPPORT_EMAIL} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <section className="mx-auto max-w-3xl text-center">
            <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto h-[88px] w-[88px] rounded-full object-contain drop-shadow-[0_10px_28px_rgba(178,0,18,0.25)] sm:h-[112px] sm:w-[112px]" />
            <h1 className="mt-3 text-[30px] font-black uppercase leading-tight tracking-[0.01em] text-[#b90416] sm:text-[48px]">
              Sổ Đỏ Vạn Phúc
            </h1>
            <p className="mt-1 text-[15px] font-extrabold uppercase tracking-[0.02em] text-[#1f2633] sm:text-xl">
              Hệ điều hành nghề Môi giới Thổ cư Việt Nam
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-[#555b66] sm:text-base">
              Kết nối Chủ nhà • Người mua • Môi giới • AI trên một nền tảng duy nhất
            </p>
          </section>

          <section className="mt-8 grid items-start gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
            <AuthCard>
              <div className="mb-5 text-center">
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#c40012] lg:hidden">
                  <SvpLoginIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black uppercase text-[#c40012]">Đăng nhập</h2>
                <div className="mx-auto mt-2 h-1 w-14 rounded-full bg-[#c40012]" />
                <p className="mt-3 text-sm font-semibold text-[#5c6470]">Chào mừng bạn trở lại!</p>
              </div>

              {loginError && <AlertMessage>{loginError}</AlertMessage>}

              <form onSubmit={handleLogin} className="space-y-3" noValidate>
                <InputWithIcon
                  id="identifier"
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder="Số điện thoại hoặc Email"
                  autoComplete="username"
                  icon={SvpUserIcon}
                />
                <PasswordField
                  id="password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Mật khẩu"
                  show={showLoginPassword}
                  setShow={setShowLoginPassword}
                  autoComplete="current-password"
                />

                <div className="flex items-center justify-between pt-1 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-[#3d424c]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 accent-[#c40012]"
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="font-bold text-[#c40012]">
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d10016] to-[#b50013] text-sm font-black text-white shadow-[0_10px_24px_rgba(190,0,16,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#ece5df]" />
                <span className="text-sm font-medium text-[#7d8390]">Hoặc đăng nhập với</span>
                <div className="h-px flex-1 bg-[#ece5df]" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <SocialButton label="Google" href={SOCIAL_LOGIN_LINKS.google} icon={<SvpGoogleIcon className="h-7 w-7" />} />
                <SocialButton label="Facebook" href={SOCIAL_LOGIN_LINKS.facebook} icon={<SvpFacebookIcon className="h-7 w-7" />} />
                <SocialButton label="Apple" href={SOCIAL_LOGIN_LINKS.apple} icon={<SvpAppleIcon className="h-7 w-7 text-black" />} />
                <SocialButton label="Zalo" href={SOCIAL_LOGIN_LINKS.zalo} icon={<SvpZaloIcon className="h-7 w-7" />} />
              </div>

              <div className="mt-6 hidden rounded-xl border border-[#eadfd7] bg-[#fffaf7] p-4 sm:flex sm:items-start sm:gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-[#c40012]">
                  <SvpShieldIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#343944]">Thông tin của bạn được bảo mật tuyệt đối</div>
                  <p className="mt-1 text-sm text-[#67707d]">Chúng tôi cam kết không chia sẻ thông tin cho bên thứ ba.</p>
                </div>
              </div>
            </AuthCard>

            <AuthCard innerRef={registerRef}>
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-black uppercase text-[#c40012]">Đăng ký tài khoản</h2>
                <div className="mx-auto mt-2 h-1 w-14 rounded-full bg-[#c40012]" />
                <p className="mt-3 text-sm font-semibold text-[#5c6470]">Tạo tài khoản để kết nối và phát triển cùng Sổ Đỏ Vạn Phúc</p>
              </div>

              {registerError && <AlertMessage>{registerError}</AlertMessage>}

              <form onSubmit={handleRegister} className="space-y-3" noValidate>
                <InputWithIcon value={fullName} onChange={setFullName} placeholder="Họ và tên (theo CCCD)" autoComplete="name" icon={SvpUserIcon} />
                <InputWithIcon value={phone} onChange={setPhone} placeholder="Số điện thoại" autoComplete="tel" inputMode="tel" icon={SvpPhoneIcon} />
                <InputWithIcon value={email} onChange={setEmail} placeholder="Email" autoComplete="email" type="email" icon={SvpMailIcon} />
                <PasswordField
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  placeholder="Mật khẩu"
                  show={showRegisterPassword}
                  setShow={setShowRegisterPassword}
                  autoComplete="new-password"
                />
                <InputWithIcon value={referralCode} onChange={setReferralCode} placeholder="Mã người giới thiệu (nếu có)" icon={SvpGiftIcon} />

                <div className="pt-1">
                  <p className="mb-2 text-sm font-bold text-[#3d424c]">
                    Chọn một hoặc nhiều nhu cầu / vai trò
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PUBLIC_REGISTRATION_ROLES.map((role) => {
                      const Icon = roleIconMap[role.slug] || SvpUserIcon;
                      const selected = selectedRoles.includes(role.slug);
                      return (
                        <button
                          type="button"
                          key={role.slug}
                          onClick={() => toggleRole(role.slug)}
                          className={`flex min-h-[58px] items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left transition ${
                            selected ? 'border-[#c40012] shadow-[0_0_0_3px_rgba(196,0,18,0.08)]' : 'border-[#e9e1dc] hover:border-[#d7cbc3]'
                          }`}
                        >
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${roleColorMap[role.slug] || 'from-red-500 to-red-600'} text-white shadow-sm`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-extrabold leading-5 text-[#2c313a]">{role.label}</span>
                            <span className="block truncate text-[12px] font-medium text-[#717986]">{role.description}</span>
                          </span>
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? 'border-[#c40012] bg-[#c40012]' : 'border-[#d6d6d6] bg-white'}`}>
                            {selected ? <span className="h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-white" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2 pt-1 text-sm font-semibold leading-5 text-[#3d424c]">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#c40012]"
                  />
                  <span>
                    Tôi đã đọc và đồng ý với <span className="text-[#c40012]">Điều khoản sử dụng</span> và{' '}
                    <span className="text-[#c40012]">Chính sách bảo mật</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d10016] to-[#b50013] text-sm font-black text-white shadow-[0_10px_24px_rgba(190,0,16,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {registerLoading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
                </button>
              </form>

              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="flex gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                    <SvpCrownIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#5d4a19]">Lưu ý về phê duyệt tài khoản</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#725f26]">
                      Từ cấp Chuyên viên trở lên cần có người phê duyệt để mở đầy đủ tính năng. Các tài khoản còn lại được sử dụng ngay sau khi đăng ký.
                    </p>
                  </div>
                </div>
              </div>
            </AuthCard>
          </section>

          <section className="mt-5 grid gap-3 rounded-2xl bg-white/[0.92] p-3 shadow-[0_12px_40px_rgba(80,40,20,0.08)] ring-1 ring-black/5 backdrop-blur sm:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 px-2 py-2">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xl font-black leading-none text-[#c40012]">{item.value}</div>
                    <div className="mt-1 text-sm font-extrabold text-[#2d3340]">{item.label}</div>
                    <div className="text-xs font-medium text-[#747b87]">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl bg-white/[0.88] p-3 shadow-[0_12px_40px_rgba(80,40,20,0.06)] ring-1 ring-black/5 backdrop-blur sm:grid-cols-4">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 px-2 py-2">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase text-[#293241]">{item.title}</div>
                    <p className="mt-1 text-xs font-medium leading-5 text-[#747b87]">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <footer className="mt-5 border-t border-red-100/70 pt-4 text-center text-xs font-medium text-[#7d8390]">
            © 2026 Sổ Đỏ Vạn Phúc. Điều khoản sử dụng • Chính sách bảo mật • Liên hệ
          </footer>
        </div>
      </div>
    </main>
  );
}

const AuthCard = ({ children, innerRef }: { children: ReactNode; innerRef?: Ref<HTMLDivElement> }) => (
  <div ref={innerRef} className="rounded-[22px] bg-white/[0.96] p-5 shadow-[0_18px_60px_rgba(88,40,20,0.14)] ring-1 ring-black/5 backdrop-blur sm:p-7">
    {children}
  </div>
);

function AlertMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#b90416]">
      {children}
    </div>
  );
}

function InputWithIcon({
  id,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: typeof SvpUserIcon;
  type?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa0a8]" />
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="h-12 w-full rounded-xl border border-[#e0ddd9] bg-white pl-12 pr-4 text-sm font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] focus:border-[#c40012] focus:outline-none focus:ring-4 focus:ring-red-100"
      />
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  show,
  setShow,
  autoComplete,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  setShow: (value: boolean) => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <SvpLockIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa0a8]" />
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-[#e0ddd9] bg-white pl-12 pr-12 text-sm font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] focus:border-[#c40012] focus:outline-none focus:ring-4 focus:ring-red-100"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa0a8]"
      >
        {show ? <SvpEyeOffIcon className="h-5 w-5" /> : <SvpEyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

function SupportLink({
  href,
  icon,
  title,
  desc,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 rounded-xl border border-[#f0e7df] bg-[#fffaf7] p-3 transition hover:border-[#c40012]/35 hover:bg-white"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-[#c40012]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-[#25202a]">{title}</span>
        <span className="block truncate text-xs font-semibold text-[#747b88]">{desc}</span>
      </span>
    </a>
  );
}

function SocialButton({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Đăng nhập với ${label}`}
      data-testid={`social-login-${label.toLowerCase()}`}
      className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-[#ebe3dd] bg-white text-xs font-bold text-[#4d5562] transition hover:border-[#c40012] hover:text-[#c40012] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-red-100"
    >
      {icon}
      {label}
    </a>
  );
}
