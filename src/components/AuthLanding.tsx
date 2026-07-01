import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getRoleDashboardPath, PUBLIC_REGISTRATION_ROLES } from '../data/roles';
import type { LegalDocumentType } from '../data/legalDocuments';
import { useAuth } from '../contexts/AuthContext';
import { svpApi } from '../services/svpApi';
import LegalModal from './LegalModal';
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
const BRAND_TITLE_FONT = '"UTM Avo", "SVN-Avo", "Avo", "Montserrat", "Inter", "Arial", sans-serif';

export default function AuthLanding({ initialPanel = 'login' }: AuthLandingProps) {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, approvedRoles, user } = useAuth();
  const registerRef = useRef<HTMLDivElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

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
  const [buyerNeed, setBuyerNeed] = useState({
    city: '',
    district: '',
    ward: '',
    street: '',
    budgetMin: '',
    budgetMax: '',
    purpose: '',
    note: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (initialPanel !== 'register') return;
    window.setTimeout(() => {
      registerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [initialPanel]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (approvedRoles.length === 0) {
      navigate('/pending-approval');
      return;
    }
    if (approvedRoles.length > 1) {
      navigate('/select-role');
      return;
    }
    const activeRole = user?.activeRole || approvedRoles[0]?.slug;
    navigate(getRoleDashboardPath(activeRole));
  }, [approvedRoles, isAuthenticated, navigate, user?.activeRole]);

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
    if (selectedRoles.includes('khach_mua')) {
      if (!buyerNeed.city.trim() || !buyerNeed.district.trim() || !buyerNeed.budgetMax.trim() || !buyerNeed.purpose) {
        return setRegisterError('Vui lòng nhập khu vực, tầm tiền và mục đích mua để môi giới hỗ trợ nhanh hơn.');
      }
    }
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
        if (selectedRoles.includes('khach_mua')) {
          await saveBuyerNeedAfterRegister(response.user.id);
        }
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

  const updateBuyerNeed = (key: keyof typeof buyerNeed, value: string) => {
    setRegisterError('');
    setBuyerNeed((current) => ({ ...current, [key]: value }));
  };

  const saveBuyerNeedAfterRegister = async (userId: string) => {
    const areaParts = [buyerNeed.city, buyerNeed.district, buyerNeed.ward, buyerNeed.street]
      .map((item) => item.trim())
      .filter(Boolean);
    const areaText = areaParts.join(', ');
    const customer = await svpApi.createCustomer({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      source: 'khach_mua_tu_dang_ky',
      statusId: 'new',
      assignedUserId: '',
      note: [
        `User ID: ${userId}`,
        referralCode.trim() ? `Mã giới thiệu: ${referralCode.trim()}` : '',
        `Khu vực ưu tiên: ${areaText}`,
        `Mục đích mua: ${buyerNeed.purpose}`,
        buyerNeed.note.trim(),
      ].filter(Boolean).join('. '),
    });

    await svpApi.createCustomerNeed({
      customerId: customer.id,
      districtIds: areaParts.length ? areaParts : [areaText || 'Chưa xác định'],
      budgetMin: buyerNeed.budgetMin ? Number(buyerNeed.budgetMin) : null,
      budgetMax: buyerNeed.budgetMax ? Number(buyerNeed.budgetMax) : null,
      areaMin: null,
      areaMax: null,
      tagIds: buyerNeed.purpose ? [buyerNeed.purpose] : [],
      description: [
        `Khu vực ưu tiên: ${areaText}`,
        `Tầm tiền: ${buyerNeed.budgetMin || '0'} - ${buyerNeed.budgetMax}`,
        `Mục đích: ${buyerNeed.purpose}`,
        buyerNeed.note.trim(),
      ].filter(Boolean).join('\n'),
      statusId: 'new',
    });
  };

  const loginColumnClass = 'order-1';
  const registerColumnClass = 'order-2 lg:order-2';

  return (
    <main className="svp-auth-page min-h-screen overflow-x-hidden bg-[#fff8f2] text-[#25202a]">
      <div className="relative min-h-screen overflow-x-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[330px] bg-cover bg-center sm:h-[460px]"
          style={{ backgroundImage: "url('/assets/svp-auth-hero.png')" }}
        />
        <div className="absolute inset-x-0 top-0 h-[330px] bg-gradient-to-b from-white/20 via-white/65 to-[#fff8f2] sm:h-[460px]" />
        <div className="absolute inset-x-0 top-[250px] h-36 bg-gradient-to-b from-transparent to-[#fff8f2] sm:top-[330px] sm:h-48" />

        <div className="relative mx-auto w-full max-w-[1180px] px-3 pb-5 pt-3 sm:px-6 sm:pb-7 sm:pt-4 lg:px-8">
          <div className="mb-1 flex items-center justify-between sm:mb-2">
            <div className="h-10 w-10" />
            <div className="relative">
              <button
                type="button"
                data-testid="auth-support-toggle"
                aria-expanded={supportOpen}
                aria-controls="auth-support-menu"
                onClick={() => setSupportOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/95 px-3 text-sm font-semibold text-[#4f4a55] shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:text-[#c40012] hover:ring-[#c40012]/25 sm:h-10 sm:gap-2 sm:px-4"
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
            <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="mx-auto h-[74px] w-[74px] rounded-full object-contain drop-shadow-[0_10px_28px_rgba(178,0,18,0.25)] sm:h-[112px] sm:w-[112px]" />
            <h1
              data-testid="auth-brand-title"
              style={{ color: '#8f0010', fontFamily: BRAND_TITLE_FONT }}
              className="mt-2 whitespace-nowrap text-[25px] font-black uppercase leading-tight tracking-[0.02em] min-[375px]:text-[27px] min-[410px]:text-[30px] sm:mt-3 sm:text-[48px]"
            >
              Sổ Đỏ Vạn Phúc
            </h1>
            <p
              data-testid="auth-brand-slogan"
              style={{ fontFamily: BRAND_TITLE_FONT }}
              className="mt-1 text-[11px] font-extrabold uppercase leading-[1.32] tracking-[0.012em] text-[#1f2633] min-[360px]:text-[12px] min-[390px]:text-[13px] sm:text-xl"
            >
              <span data-testid="auth-brand-slogan-line-1" className="block whitespace-nowrap">
                Hệ điều hành nghề Môi giới
              </span>
              <span data-testid="auth-brand-slogan-line-2" className="block whitespace-nowrap">
                Thổ cư Việt Nam
              </span>
            </p>
            <p className="mx-auto mt-2 max-w-xl text-[13px] font-medium leading-5 text-[#555b66] sm:text-base sm:leading-6">
              <span className="block sm:inline">Kết nối Chủ nhà • Người mua • Môi giới</span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">AI trên một nền tảng duy nhất</span>
            </p>
          </section>

          <section className="mt-5 grid min-w-0 items-start gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
            <div className={loginColumnClass}>
            <AuthCard testId="auth-login-card">
              <div className="mb-4 text-center sm:mb-5">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#c40012] lg:hidden">
                  <SvpLoginIcon className="h-5 w-5" />
                </div>
                <h2 className="text-[22px] font-black uppercase leading-tight text-[#c40012] sm:text-2xl">Đăng nhập</h2>
                <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-[#c40012] sm:mt-2 sm:w-14" />
                <p className="mt-2 text-[13px] font-semibold text-[#5c6470] sm:mt-3 sm:text-sm">Chào mừng bạn trở lại!</p>
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

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1 text-[13px] sm:text-sm">
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 font-semibold text-[#3d424c]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 accent-[#c40012]"
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="ml-auto shrink-0 font-bold text-[#c40012]">
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

              <div className="my-4 flex items-center gap-2 sm:my-6 sm:gap-3">
                <div className="h-px flex-1 bg-[#ece5df]" />
                <span className="text-xs font-medium text-[#7d8390] sm:text-sm">Hoặc đăng nhập với</span>
                <div className="h-px flex-1 bg-[#ece5df]" />
              </div>

              <div className="grid grid-cols-4 gap-2 max-[360px]:gap-1">
                <SocialButton label="Google" href={SOCIAL_LOGIN_LINKS.google} icon={<SvpGoogleIcon className="h-6 w-6" />} />
                <SocialButton label="Facebook" href={SOCIAL_LOGIN_LINKS.facebook} icon={<SvpFacebookIcon className="h-6 w-6" />} />
                <SocialButton label="Apple" href={SOCIAL_LOGIN_LINKS.apple} icon={<SvpAppleIcon className="h-6 w-6 text-black" />} />
                <SocialButton label="Zalo" href={SOCIAL_LOGIN_LINKS.zalo} icon={<SvpZaloIcon className="h-6 w-6" />} />
              </div>

              <div className="mt-6 hidden rounded-xl border border-[#eadfd7] bg-[#fffaf7] p-4 sm:flex sm:items-start sm:gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-[#c40012]">
                  <SvpShieldIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#343944]">Thông tin của bạn được bảo vệ theo phân quyền</div>
                  <p className="mt-1 text-sm text-[#67707d]">Dữ liệu chỉ được sử dụng cho vận hành hệ thống và các mục đích đã công bố.</p>
                </div>
              </div>
            </AuthCard>
            </div>

            <div className={registerColumnClass}>
            <AuthCard innerRef={registerRef} testId="auth-register-card">
              <div className="mb-4 text-center sm:mb-5">
                <h2 className="text-[22px] font-black uppercase leading-tight text-[#c40012] sm:text-2xl">Đăng ký tài khoản</h2>
                <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-[#c40012] sm:mt-2 sm:w-14" />
                <p className="mt-2 text-[13px] font-semibold leading-5 text-[#5c6470] sm:mt-3 sm:text-sm">Tạo tài khoản để kết nối cùng Sổ Đỏ Vạn Phúc</p>
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
                  <div data-testid="auth-role-list" className="grid min-w-0 max-w-full gap-1.5 sm:grid-cols-2 sm:gap-2">
                    {PUBLIC_REGISTRATION_ROLES.map((role) => {
                      const Icon = roleIconMap[role.slug] || SvpUserIcon;
                      const selected = selectedRoles.includes(role.slug);
                      return (
                        <button
                          type="button"
                          key={role.slug}
                          data-testid={`auth-role-option-${role.slug}`}
                          aria-pressed={selected}
                          onClick={() => toggleRole(role.slug)}
                          className={`flex min-h-[50px] w-full max-w-full min-w-0 items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left transition sm:min-h-[58px] sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2 ${
                            selected ? 'border-[#c40012] shadow-[0_0_0_3px_rgba(196,0,18,0.08)]' : 'border-[#e9e1dc] hover:border-[#d7cbc3]'
                          }`}
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${roleColorMap[role.slug] || 'from-red-500 to-red-600'} text-white shadow-sm sm:h-10 sm:w-10 sm:rounded-xl`}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block max-w-full break-words text-[13px] font-extrabold leading-[1.18] text-[#2c313a] sm:text-sm sm:leading-5">{role.label}</span>
                            <span className="block max-w-full truncate text-[11px] font-medium leading-4 text-[#717986] sm:text-[12px]">{role.description}</span>
                          </span>
                          <span data-testid={`auth-role-check-${role.slug}`} className={`grid h-4 w-4 shrink-0 place-items-center rounded border sm:h-5 sm:w-5 ${selected ? 'border-[#c40012] bg-[#c40012]' : 'border-[#d6d6d6] bg-white'}`}>
                            {selected ? <span className="h-2 w-1.5 rotate-45 border-b-2 border-r-2 border-white sm:h-2.5" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedRoles.includes('khach_mua') ? (
                  <BuyerNeedInlineForm value={buyerNeed} onChange={updateBuyerNeed} />
                ) : null}

                <div className="flex min-w-0 items-start gap-2 pt-1 text-[13px] font-semibold leading-[1.35] text-[#3d424c] sm:text-sm sm:leading-5">
                  <input
                    id="accepted-legal"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#c40012]"
                  />
                  <label htmlFor="accepted-legal" className="min-w-0 cursor-pointer">
                    Tôi đã đọc và đồng ý với{' '}
                    <button
                      type="button"
                      data-testid="legal-open-terms"
                      onClick={(event) => {
                        event.preventDefault();
                        setLegalModal('terms');
                      }}
                      className="font-black text-[#c40012] underline-offset-2 hover:underline"
                    >
                      Điều khoản sử dụng
                    </button>{' '}
                    và{' '}
                    <button
                      type="button"
                      data-testid="legal-open-privacy"
                      onClick={(event) => {
                        event.preventDefault();
                        setLegalModal('privacy');
                      }}
                      className="font-black text-[#c40012] underline-offset-2 hover:underline"
                    >
                      Chính sách bảo mật
                    </button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d10016] to-[#b50013] text-sm font-black text-white shadow-[0_10px_24px_rgba(190,0,16,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {registerLoading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
                </button>
              </form>

              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 sm:mt-4 sm:px-4 sm:py-3">
                <div className="flex gap-2.5 sm:gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600 sm:h-9 sm:w-9">
                    <SvpCrownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-[#5d4a19] sm:text-sm">Lưu ý về phê duyệt tài khoản</p>
                    <p className="mt-1 text-[12px] leading-[1.45] text-[#725f26] sm:text-[13px] sm:leading-5">
                      Từ cấp Chuyên viên trở lên cần có người phê duyệt để mở đầy đủ tính năng. Các tài khoản còn lại được sử dụng ngay sau khi đăng ký.
                    </p>
                  </div>
                </div>
              </div>
            </AuthCard>
            </div>
          </section>

          <section className="mt-5 hidden gap-3 rounded-2xl bg-white/[0.92] p-3 shadow-[0_12px_40px_rgba(80,40,20,0.08)] ring-1 ring-black/5 backdrop-blur sm:grid sm:grid-cols-4">
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

          <section className="mt-4 hidden gap-3 rounded-2xl bg-white/[0.88] p-3 shadow-[0_12px_40px_rgba(80,40,20,0.06)] ring-1 ring-black/5 backdrop-blur sm:grid sm:grid-cols-4">
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

          <footer className="mt-4 border-t border-red-100/70 pt-3 text-center text-[11px] font-medium text-[#7d8390] sm:mt-5 sm:pt-4 sm:text-xs">
            © 2026 Sổ Đỏ Vạn Phúc.{' '}
            <button type="button" onClick={() => setLegalModal('terms')} className="font-bold text-[#c40012] hover:underline">
              Điều khoản sử dụng
            </button>{' '}
            •{' '}
            <button type="button" onClick={() => setLegalModal('privacy')} className="font-bold text-[#c40012] hover:underline">
              Chính sách bảo mật
            </button>{' '}
            • Liên hệ
          </footer>
        </div>
      </div>
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </main>
  );
}

const AuthCard = ({ children, innerRef, testId }: { children: ReactNode; innerRef?: Ref<HTMLDivElement>; testId?: string }) => (
  <div ref={innerRef} data-testid={testId} className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] bg-white/[0.96] p-3.5 shadow-[0_18px_60px_rgba(88,40,20,0.14)] ring-1 ring-black/5 backdrop-blur sm:rounded-[22px] sm:p-7">
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

function BuyerNeedInlineForm({
  value,
  onChange,
}: {
  value: {
    city: string;
    district: string;
    ward: string;
    street: string;
    budgetMin: string;
    budgetMax: string;
    purpose: string;
    note: string;
  };
  onChange: (key: keyof typeof value, nextValue: string) => void;
}) {
  return (
    <section
      data-testid="auth-buyer-need-inline"
      className="rounded-xl border border-red-100 bg-[#fff7f4] p-3"
    >
      <div className="mb-2 flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <SvpSearchHomeIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black leading-5 text-[#25202a]">Nhu cầu tìm mua nhà</h3>
          <p className="text-[12px] font-semibold leading-4 text-[#747b88]">
            Điền nhanh để Chuyên viên hỗ trợ đúng nhu cầu ngay sau khi đăng ký.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <CompactField value={value.city} onChange={(next) => onChange('city', next)} placeholder="Thành phố / Tỉnh" />
        <CompactField value={value.district} onChange={(next) => onChange('district', next)} placeholder="Quận / Huyện" />
        <CompactField value={value.ward} onChange={(next) => onChange('ward', next)} placeholder="Phường / Xã" />
        <CompactField value={value.street} onChange={(next) => onChange('street', next)} placeholder="Đường / khu vực" />
        <CompactField value={value.budgetMin} onChange={(next) => onChange('budgetMin', next)} placeholder="Tầm tiền từ" inputMode="numeric" />
        <CompactField value={value.budgetMax} onChange={(next) => onChange('budgetMax', next)} placeholder="Tầm tiền đến" inputMode="numeric" />
        <select
          value={value.purpose}
          onChange={(event) => onChange('purpose', event.target.value)}
          className="h-10 rounded-lg border border-[#e0ddd9] bg-white px-3 text-[13px] font-semibold text-[#2b313d] outline-none focus:border-[#c40012] focus:ring-3 focus:ring-red-100 sm:col-span-2"
        >
          <option value="">Mục đích mua</option>
          <option value="de_o">Để ở</option>
          <option value="dau_tu">Đầu tư</option>
          <option value="cho_thue">Cho thuê</option>
          <option value="ket_hop">Kết hợp</option>
          <option value="khac">Khác</option>
        </select>
        <textarea
          value={value.note}
          onChange={(event) => onChange('note', event.target.value)}
          rows={3}
          placeholder="Ghi chú thêm: hẻm, ô tô, trường học, dòng tiền..."
          className="w-full rounded-lg border border-[#e0ddd9] bg-white px-3 py-2 text-[13px] font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] outline-none focus:border-[#c40012] focus:ring-3 focus:ring-red-100 sm:col-span-2"
        />
      </div>
    </section>
  );
}

function CompactField({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-10 rounded-lg border border-[#e0ddd9] bg-white px-3 text-[13px] font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] outline-none focus:border-[#c40012] focus:ring-3 focus:ring-red-100"
    />
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
        className="h-11 w-full rounded-xl border border-[#e0ddd9] bg-white pl-11 pr-3 text-[13px] font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] focus:border-[#c40012] focus:outline-none focus:ring-4 focus:ring-red-100 sm:h-12 sm:pl-12 sm:pr-4 sm:text-sm"
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
        className="h-11 w-full rounded-xl border border-[#e0ddd9] bg-white pl-11 pr-11 text-[13px] font-semibold text-[#2b313d] placeholder:text-[#9ba1aa] focus:border-[#c40012] focus:outline-none focus:ring-4 focus:ring-red-100 sm:h-12 sm:pl-12 sm:pr-12 sm:text-sm"
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
      className="flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#ebe3dd] bg-white px-1 text-[11px] font-bold text-[#4d5562] transition hover:border-[#c40012] hover:text-[#c40012] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-red-100 sm:min-h-[72px] sm:text-xs"
    >
      {icon}
      {label}
    </a>
  );
}
