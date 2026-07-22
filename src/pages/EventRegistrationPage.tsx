import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, Gift, Loader2, LockKeyhole, LogIn, Mail, Phone, UserRound } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LegalModal from '../components/LegalModal';
import PublicPageHeader from '../components/PublicPageHeader';
import { useAuth } from '../contexts/AuthContext';
import { PUBLIC_REGISTRATION_ROLES } from '../data/roles';
import { eventApi, type EventSource } from '../services/eventApi';
import { svpApi } from '../services/svpApi';
import type { SvpEvent } from '../types/events';

type RoleOption = { slug: string; label: string; description: string };

export default function EventRegistrationPage() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<SvpEvent | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>(PUBLIC_REGISTRATION_ROLES.map((role) => ({ slug: role.slug, label: role.label, description: role.description })));
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', referralCode: '', roleSlugs: [] as string[] });
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const source = useMemo<EventSource>(() => ({
    utmSource: search.get('utm_source') || '',
    utmMedium: search.get('utm_medium') || '',
    utmCampaign: search.get('utm_campaign') || '',
    utmContent: search.get('utm_content') || '',
    utmTerm: search.get('utm_term') || '',
    referrerUrl: document.referrer,
    registrationUrl: window.location.href,
  }), [search]);

  useEffect(() => {
    Promise.all([
      eventApi.getPublic(slug).then(setEvent),
      svpApi.getConfig().then((groups) => {
        const options = groups.find((group) => group.id === 'account_role_approval')?.options || [];
        const mapped = options.filter((item) => item.isActive && !['admin', 'admin_tong'].includes(item.value)).map((item) => ({
          slug: item.value,
          label: item.label,
          description: String(item.metadata?.description || ''),
        }));
        if (mapped.length) setRoles(mapped);
      }),
    ]).catch((error) => setMessage(error.message || 'Không tải được thông tin sự kiện.')).finally(() => setPageLoading(false));
  }, [slug]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const toggleRole = (roleSlug: string) => setForm((current) => ({
    ...current,
    roleSlugs: current.roleSlugs.includes(roleSlug) ? current.roleSlugs.filter((item) => item !== roleSlug) : [...current.roleSlugs, roleSlug],
  }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMessage('');
    if (loading) return;
    if (!isAuthenticated) {
      if (!form.fullName.trim() || !form.phone.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.password.length < 6) return setMessage('Vui lòng điền đúng họ tên, điện thoại, email và mật khẩu tối thiểu 6 ký tự.');
      if (!form.roleSlugs.length) return setMessage('Vui lòng chọn ít nhất một nhu cầu hoặc vai trò.');
      if (!accepted) return setMessage('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
    }
    setLoading(true);
    try {
      if (isAuthenticated) await eventApi.registerExisting(slug, source);
      else await eventApi.registerNew(slug, { ...form, role_slugs: form.roleSlugs, acceptedTerms: true, ...source });
      setSuccess(true);
      setMessage('Đăng ký thành công. Ban Tổ chức sẽ gửi lịch và đường dẫn Zoom trong nhóm Zalo.');
    } catch (error: any) {
      setMessage(error.message || 'Chưa đăng ký được sự kiện.');
    } finally { setLoading(false); }
  };

  if (pageLoading) return <div className="grid min-h-screen place-items-center bg-[#fff8f2]"><Loader2 className="h-9 w-9 animate-spin text-[#c40012]" /></div>;

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#251f25]">
      <PublicPageHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          {event?.bannerUrl ? <img src={event.bannerUrl} alt="" className="aspect-[16/9] w-full rounded-lg object-cover shadow-lg" /> : null}
          <p className="mt-6 text-xs font-black uppercase text-[#c40012]">{event?.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{event?.title || 'Đăng ký sự kiện'}</h1>
          <p className="mt-4 text-base font-medium leading-7 text-[#665f68]">{event?.summary}</p>
          <div className="mt-6 border-y border-red-100 py-4 text-sm font-bold leading-6"><div>{event?.formatLabel}</div><div className="mt-1 text-[#c40012]">{event?.scheduleLabel}</div></div>
        </section>

        <section className="rounded-lg border border-red-100 bg-white p-5 shadow-[0_18px_50px_rgba(89,30,22,0.10)] sm:p-8">
          <h2 className="text-2xl font-black">{event?.ctaLabel || 'Đăng ký tham dự miễn phí'}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#6d6670]">Thông tin được dùng để xác nhận tham dự, gửi tài liệu và hỗ trợ bạn trong chương trình.</p>
          {message ? <div data-testid="event-registration-message" className={`mt-5 rounded-lg border px-4 py-3 text-sm font-bold leading-6 ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{message}</div> : null}

          {success ? (
            <div className="mt-7 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-7 w-7" /></span><p className="mt-4 font-black">Đăng ký đã được ghi nhận</p>{!isAuthenticated ? <Link to="/" className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#c40012] px-5 text-sm font-black text-white"><LogIn className="h-4 w-4" />Đăng nhập tài khoản</Link> : null}</div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {isAuthenticated ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">Đăng ký với tài khoản <strong>{user?.fullName}</strong> ({user?.email}). Hệ thống không tạo tài khoản trùng.</div> : (
                <>
                  <Field icon={UserRound} value={form.fullName} onChange={(value) => update('fullName', value)} placeholder="Họ và tên" autoComplete="name" />
                  <Field icon={Phone} value={form.phone} onChange={(value) => update('phone', value)} placeholder="Số điện thoại" autoComplete="tel" />
                  <Field icon={Mail} value={form.email} onChange={(value) => update('email', value)} placeholder="Email" autoComplete="email" type="email" />
                  <div className="relative"><Field icon={LockKeyhole} value={form.password} onChange={(value) => update('password', value)} placeholder="Mật khẩu (tối thiểu 6 ký tự)" autoComplete="new-password" type={showPassword ? 'text' : 'password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-3.5 text-[#77717a]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
                  <Field icon={Gift} value={form.referralCode} onChange={(value) => update('referralCode', value)} placeholder="Mã người giới thiệu (nếu có)" autoComplete="off" />
                  <div><div className="mb-2 text-sm font-black">Nhu cầu / vai trò của bạn</div><div className="grid gap-2 sm:grid-cols-2">{roles.map((role) => { const selected = form.roleSlugs.includes(role.slug); return <button key={role.slug} type="button" onClick={() => toggleRole(role.slug)} aria-pressed={selected} className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2 text-left ${selected ? 'border-[#c40012] bg-red-50' : 'border-gray-200 bg-white'}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? 'border-[#c40012] bg-[#c40012] text-white' : 'border-gray-300'}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</span><span className="min-w-0"><span className="block text-sm font-black">{role.label}</span><span className="block truncate text-xs font-medium text-[#77717a]">{role.description}</span></span></button>; })}</div></div>
                  <label className="flex items-start gap-2 text-sm font-semibold leading-6"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1.5 h-4 w-4 accent-[#c40012]" /><span>Tôi đồng ý với <button type="button" onClick={() => setLegal('terms')} className="font-black text-[#c40012]">Điều khoản sử dụng</button> và <button type="button" onClick={() => setLegal('privacy')} className="font-black text-[#c40012]">Chính sách bảo mật</button>.</span></label>
                </>
              )}
              <button type="submit" disabled={loading || event?.registrationStatus === 'closed'} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}{event?.registrationStatus === 'closed' ? 'Đăng ký đã đóng' : event?.ctaLabel}</button>
              {!isAuthenticated ? <p className="text-center text-sm font-semibold text-[#6d6670]">Đã có tài khoản? <Link to={`/?next=${encodeURIComponent(`/dang-ky-su-kien/${slug}`)}`} className="font-black text-[#c40012]">Đăng nhập tại đây</Link></p> : null}
            </form>
          )}
        </section>
      </div>
      <LegalModal type={legal} onClose={() => setLegal(null)} />
    </main>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type = 'text', autoComplete }: { icon: typeof UserRound; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <label className="relative block"><Icon className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-[#c40012]" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} className="min-h-12 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-11 text-sm font-semibold outline-none focus:border-[#c40012]" /></label>;
}
