import { ArrowRight, BriefcaseBusiness, Check, CheckCircle2, Eye, EyeOff, Gift, Loader2, LockKeyhole, Mail, Phone, PhoneCall, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LegalModal from '../components/LegalModal';
import PublicPageHeader from '../components/PublicPageHeader';
import { useAuth } from '../contexts/AuthContext';
import { recruitmentApi, type RecruitmentSource } from '../services/recruitmentApi';
import { RECRUITMENT_POSITIONS, type RecruitmentPositionSlug, type RecruitmentPost } from '../types/recruitment';

export default function PublicRecruitmentDetailPage() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const [post, setPost] = useState<RecruitmentPost | null>(null);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const request = search.get('preview') === '1' ? recruitmentApi.getAdmin(slug) : recruitmentApi.getPublic(slug);
    request.then(setPost).catch((err) => setError(err.message || 'Không tìm thấy bài tuyển dụng.'));
  }, [search, slug]);

  const source = useMemo<RecruitmentSource>(() => ({
    utmSource: search.get('utm_source') || '',
    utmMedium: search.get('utm_medium') || '',
    utmCampaign: search.get('utm_campaign') || '',
    utmContent: search.get('utm_content') || '',
    utmTerm: search.get('utm_term') || '',
    referrerUrl: document.referrer,
    registrationUrl: window.location.href,
  }), [search]);

  if (!post && !error) return <div className="grid min-h-screen place-items-center bg-[#fff8f2]"><Loader2 className="h-9 w-9 animate-spin text-[#c40012]" /></div>;
  if (!post) return <main className="min-h-screen bg-[#fff8f2]"><PublicPageHeader /><div className="mx-auto max-w-3xl px-4 py-20 text-center text-lg font-bold">{error}</div></main>;

  const open = post.applicationStatus === 'open';
  const middleIndex = Math.max(1, Math.floor(post.sections.length / 2) - 1);
  const scrollToForm = () => document.getElementById('recruitment-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main className="min-h-screen bg-[#fff8f2] pb-20 text-[#251f25] lg:pb-0">
      <PublicPageHeader />
      {post.status !== 'published' ? <div className="bg-amber-100 px-4 py-2 text-center text-sm font-black text-amber-900">Bản xem trước dành cho quản trị viên - bài tuyển dụng chưa công khai</div> : null}
      <section className="relative overflow-hidden bg-[#211d20] text-white">
        <img src={post.bannerUrl} alt="Đội ngũ môi giới bất động sản Sổ Đỏ Vạn Phúc" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-end px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[630px]">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c40012] px-4 py-2 text-xs font-black uppercase"><BriefcaseBusiness className="h-4 w-4" />{post.eyebrow}</div>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] sm:text-6xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-white/90 sm:text-lg">{post.summary}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold"><span className="inline-flex items-center gap-2"><UsersRound className="h-5 w-5 text-[#ffcf70]" />Ba lộ trình ứng tuyển</span><span className="inline-flex items-center gap-2"><PhoneCall className="h-5 w-5 text-[#ffcf70]" />Nhân sự liên hệ trực tiếp</span></div>
            <button type="button" onClick={scrollToForm} disabled={!open} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d00016] px-6 text-base font-black text-white shadow-xl disabled:bg-gray-400">{open ? post.ctaLabel : 'Đã đóng nhận hồ sơ'}<ArrowRight className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <ApplicationForm id="recruitment-form-top" placement="Đăng ký nhanh" post={post} source={source} applied={applied} onApplied={() => setApplied(true)} />

        <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-9">
            {post.sections.map((section, index) => (
              <div key={section.key || index} className="space-y-9">
                <article className={index === 0 ? '' : 'border-t border-red-100 pt-8'}>
                  <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c40012] text-sm font-black text-white">{String(index + 1).padStart(2, '0')}</span><h2 className="text-2xl font-black leading-tight sm:text-3xl">{section.title}</h2></div>
                  {section.imageUrl ? <img src={section.imageUrl} alt={section.title} className="mb-5 aspect-[16/9] w-full rounded-lg border border-red-100 object-cover" /> : null}
                  {section.body ? <p className="whitespace-pre-line text-base font-medium leading-8 text-[#5f5962]">{section.body}</p> : null}
                  {section.items?.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{section.items.map((item) => <li key={item} className="flex items-start gap-3 border-l-2 border-[#c40012] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#514b54]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul> : null}
                </article>
                {index === middleIndex ? <ApplicationForm id="recruitment-form-middle" placement="Ứng tuyển ngay" post={post} source={source} applied={applied} onApplied={() => setApplied(true)} /> : null}
              </div>
            ))}
            <div className="flex items-start gap-3 border-y border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium leading-6 text-amber-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />{post.disclaimer}</div>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-red-100 bg-white p-5 shadow-[0_16px_42px_rgba(89,30,22,0.10)]">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-[#c40012]"><UserRound className="h-5 w-5" /></span><div><div className="text-xs font-black uppercase text-[#c40012]">Người đồng hành</div><div className="font-black">{post.recruiterName}</div></div></div>
              <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-6 text-[#655e67]">{post.recruiterTitle}</p>
              <button type="button" onClick={scrollToForm} disabled={!open} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white disabled:bg-gray-400">{open ? post.ctaLabel : 'Đã đóng nhận hồ sơ'}<ArrowRight className="h-4 w-4" /></button>
            </div>
          </aside>
        </section>

        <div className="mt-12"><ApplicationForm id="recruitment-form-end" placement="Bắt đầu hành trình nghề nghiệp" post={post} source={source} applied={applied} onApplied={() => setApplied(true)} emphasis /></div>
      </div>

      {open && !applied ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 p-3 shadow-[0_-10px_35px_rgba(61,25,30,0.14)] backdrop-blur lg:hidden"><button type="button" onClick={scrollToForm} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white">{post.ctaLabel}<ArrowRight className="h-4 w-4" /></button></div> : null}
    </main>
  );
}

function ApplicationForm({ id, placement, post, source, applied, onApplied, emphasis = false }: { id: string; placement: string; post: RecruitmentPost; source: RecruitmentSource; applied: boolean; onApplied: () => void; emphasis?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', referralCode: '', positionSlug: '' as RecruitmentPositionSlug | '' });
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const open = post.applicationStatus === 'open';

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    if (loading || !open) return;
    if (!form.positionSlug) return setMessage('Vui lòng chọn vị trí muốn ứng tuyển.');
    if (!isAuthenticated) {
      if (!form.fullName.trim() || !form.phone.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.password.length < 6) return setMessage('Vui lòng điền đúng họ tên, điện thoại, email và mật khẩu tối thiểu 6 ký tự.');
      if (!accepted) return setMessage('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
    }
    setLoading(true);
    try {
      if (isAuthenticated) await recruitmentApi.applyExisting(post.slug, form.positionSlug, source);
      else {
        const result = await recruitmentApi.applyNew(post.slug, { ...form, acceptedTerms: true, ...source });
        if (result.token) window.localStorage.setItem('svp_token', result.token);
      }
      onApplied();
    } catch (err: any) { setMessage(err.message || 'Chưa gửi được thông tin ứng tuyển.'); }
    finally { setLoading(false); }
  };

  return (
    <section id={id} data-testid="recruitment-application-form" className={`scroll-mt-24 rounded-lg border bg-white p-5 shadow-[0_16px_42px_rgba(89,30,22,0.10)] sm:p-7 ${emphasis ? 'border-[#c40012] border-t-4' : 'border-red-100'}`}>
      {applied ? <div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span><div><h3 className="text-xl font-black">Ứng tuyển đã được ghi nhận</h3><p className="mt-1 text-sm font-semibold leading-6 text-[#69626b]">Đội ngũ nhân sự sẽ liên hệ trực tiếp qua điện thoại để xác nhận và hỗ trợ bạn.</p></div></div> : (
        <form onSubmit={submit} noValidate>
          <div className="text-xs font-black uppercase tracking-normal text-[#c40012]">{placement}</div>
          <h3 className="mt-1 text-2xl font-black">{post.ctaLabel}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6d6670]">Chọn vị trí phù hợp và để lại thông tin. Nhân sự sẽ gọi điện xác nhận, không tạo hồ sơ trùng nếu bạn đã đăng nhập.</p>
          {message ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{message}</div> : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              {isAuthenticated ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">Ứng tuyển với tài khoản <strong>{user?.fullName}</strong> ({user?.email}).</div> : <>
                <FormField icon={UserRound} value={form.fullName} onChange={(value) => update('fullName', value)} placeholder="Họ và tên" autoComplete="name" />
                <FormField icon={Phone} value={form.phone} onChange={(value) => update('phone', value)} placeholder="Số điện thoại" autoComplete="tel" />
                <FormField icon={Mail} value={form.email} onChange={(value) => update('email', value)} placeholder="Email" type="email" autoComplete="email" />
                <div className="relative"><FormField icon={LockKeyhole} value={form.password} onChange={(value) => update('password', value)} placeholder="Mật khẩu (tối thiểu 6 ký tự)" type={showPassword ? 'text' : 'password'} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-3.5 text-[#77717a]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
                <FormField icon={Gift} value={form.referralCode} onChange={(value) => update('referralCode', value)} placeholder="Mã người giới thiệu (nếu có)" autoComplete="off" />
              </>}
            </div>
            <div>
              <div className="mb-2 text-sm font-black">Vị trí muốn ứng tuyển</div>
              <div className="space-y-2">{RECRUITMENT_POSITIONS.map((position) => { const selected = form.positionSlug === position.slug; return <button key={position.slug} type="button" onClick={() => update('positionSlug', position.slug)} aria-pressed={selected} className={`flex min-h-16 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${selected ? 'border-[#c40012] bg-red-50' : 'border-gray-200 bg-white'}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-[#c40012] bg-[#c40012] text-white' : 'border-gray-300'}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</span><span><span className="block text-sm font-black text-[#251f25]">{position.label}</span><span className="block text-xs font-medium leading-5 text-[#77717a]">{position.description}</span></span></button>; })}</div>
              {!isAuthenticated ? <label className="mt-3 flex items-start gap-2 text-sm font-semibold leading-6 text-[#514b54]"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1.5 h-4 w-4 accent-[#c40012]" /><span>Tôi đồng ý với <button type="button" onClick={() => setLegal('terms')} className="font-black text-[#c40012]">Điều khoản sử dụng</button> và <button type="button" onClick={() => setLegal('privacy')} className="font-black text-[#c40012]">Chính sách bảo mật</button>.</span></label> : null}
              <button type="submit" disabled={loading || !open} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}{open ? post.ctaLabel : 'Đã đóng nhận hồ sơ'}</button>
              {!isAuthenticated ? <p className="mt-3 text-center text-sm font-semibold text-[#6d6670]">Đã có tài khoản? <Link to={`/?next=${encodeURIComponent(`/tuyen-dung/${post.slug}`)}`} className="font-black text-[#c40012]">Đăng nhập tại đây</Link></p> : null}
            </div>
          </div>
          <LegalModal type={legal} onClose={() => setLegal(null)} />
        </form>
      )}
    </section>
  );
}

function FormField({ icon: Icon, value, onChange, placeholder, type = 'text', autoComplete }: { icon: typeof UserRound; value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string }) {
  return <label className="relative block"><Icon className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-[#c40012]" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} className="min-h-12 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-11 text-sm font-semibold text-[#251f25] outline-none focus:border-[#c40012]" /></label>;
}
