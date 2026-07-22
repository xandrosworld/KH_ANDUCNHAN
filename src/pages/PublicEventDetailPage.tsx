import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, Check, Clock3, Loader2, MonitorPlay, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PublicPageHeader from '../components/PublicPageHeader';
import { eventApi } from '../services/eventApi';
import type { SvpEvent } from '../types/events';

export default function PublicEventDetailPage() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const [event, setEvent] = useState<SvpEvent | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const request = search.get('preview') === '1' ? eventApi.getAdmin(slug) : eventApi.getPublic(slug);
    request.then(setEvent).catch((err) => setError(err.message || 'Không tìm thấy sự kiện.'));
  }, [search, slug]);

  if (!event && !error) return <div className="grid min-h-screen place-items-center bg-[#fff8f2]"><Loader2 className="h-9 w-9 animate-spin text-[#c40012]" /></div>;
  if (!event) return <main className="min-h-screen bg-[#fff8f2]"><PublicPageHeader /><div className="mx-auto max-w-3xl px-4 py-20 text-center text-lg font-bold">{error}</div></main>;

  const registrationQuery = new URLSearchParams(search);
  registrationQuery.delete('preview');
  const registrationHref = `/dang-ky-su-kien/${event.slug}${registrationQuery.size ? `?${registrationQuery.toString()}` : ''}`;
  const registrationOpen = event.registrationStatus === 'open';

  return (
    <main className="min-h-screen bg-[#fff8f2] pb-20 text-[#251f25] lg:pb-0">
      <PublicPageHeader />
      {event.status !== 'published' ? <div className="bg-amber-100 px-4 py-2 text-center text-sm font-black text-amber-900">Bản xem trước dành cho quản trị viên - sự kiện chưa công khai</div> : null}
      <section className="relative overflow-hidden bg-[#201b20] text-white">
        <img src={event.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/25" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-end px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[620px]">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-[#c40012] px-4 py-2 text-xs font-black uppercase">{event.eyebrow}</div>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] sm:text-6xl">{event.title}</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/85 sm:text-lg">{event.summary}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold"><span className="inline-flex items-center gap-2"><MonitorPlay className="h-5 w-5 text-[#ffcf70]" />{event.formatLabel}</span><span className="inline-flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#ffcf70]" />{event.scheduleLabel}</span></div>
            <RegistrationAction event={event} href={registrationHref} open={registrationOpen} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#d00016] px-6 text-base font-black text-white shadow-xl transition hover:bg-[#eb0019]" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {event.sections.map((section, index) => {
            const showRegistrationPrompt = index % 2 === 1 || index === event.sections.length - 1;
            return (
              <div key={section.key || index} className="space-y-7">
                <section className={index === 0 ? '' : 'border-t border-red-100 pt-7'}>
                  <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-sm font-black text-[#c40012]">{String(index + 1).padStart(2, '0')}</span><h2 className="text-2xl font-black sm:text-3xl">{section.title}</h2></div>
                  {section.body ? <p className="whitespace-pre-line text-base font-medium leading-8 text-[#5f5962]">{section.body}</p> : null}
                  {section.items?.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{section.items.map((item) => <li key={item} className="flex items-start gap-3 border-l-2 border-[#c40012] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#514b54]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul> : null}
                </section>
                {showRegistrationPrompt ? <EventRegistrationPrompt event={event} href={registrationHref} open={registrationOpen} final={index === event.sections.length - 1} /> : null}
              </div>
            );
          })}
          <div className="flex items-start gap-3 border-y border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium leading-6 text-amber-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />{event.disclaimer}</div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-red-100 bg-white p-5 shadow-[0_16px_42px_rgba(89,30,22,0.10)]">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-[#c40012]"><UserRound className="h-5 w-5" /></span><div><div className="text-xs font-black uppercase text-[#c40012]">Thành viên chia sẻ</div><div className="font-black">{event.speakerName}</div></div></div>
            <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-6 text-[#655e67]">{event.speakerTitle}</p>
            <div className="mt-5 flex items-start gap-2 border-t border-red-100 pt-4 text-sm font-bold leading-6"><CalendarCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c40012]" />{event.scheduleLabel}</div>
            <RegistrationAction event={event} href={registrationHref} open={registrationOpen} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-center text-sm font-black text-white transition hover:bg-[#a90010]" />
          </div>
        </aside>
      </section>
      {registrationOpen ? (
        <div data-testid="event-mobile-sticky-cta" className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 p-3 shadow-[0_-10px_35px_rgba(61,25,30,0.14)] backdrop-blur lg:hidden">
          <Link to={registrationHref} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white">
            {event.ctaLabel}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </main>
  );
}

function RegistrationAction({ event, href, open, className }: { event: SvpEvent; href: string; open: boolean; className: string }) {
  if (!open) return <div className={`${className} cursor-not-allowed bg-gray-300 text-gray-700 shadow-none hover:bg-gray-300`}>Đăng ký đã đóng</div>;
  return <Link to={href} className={className}>{event.ctaLabel}<ArrowRight className="h-5 w-5" /></Link>;
}

function EventRegistrationPrompt({ event, href, open, final }: { event: SvpEvent; href: string; open: boolean; final: boolean }) {
  return (
    <section data-testid="event-inline-cta" className={final ? 'rounded-lg bg-[#c40012] px-5 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7' : 'rounded-lg border border-red-100 bg-white px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6'}>
      <div>
        <div className={`text-xs font-black uppercase ${final ? 'text-white/70' : 'text-[#c40012]'}`}>Đăng ký tham dự</div>
        <h3 className="mt-1 text-xl font-black">{final ? 'Sẵn sàng đồng hành cùng chương trình?' : 'Quan tâm tới nội dung đang chia sẻ?'}</h3>
        <p className={`mt-1 text-sm font-semibold leading-6 ${final ? 'text-white/80' : 'text-[#6d6670]'}`}>Để lại thông tin để nhận lịch chính thức, tài liệu chương trình và đường dẫn phòng Zoom.</p>
      </div>
      <RegistrationAction event={event} href={href} open={open} className={`mt-4 flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-center text-sm font-black transition sm:mt-0 ${final ? 'bg-white text-[#c40012] hover:bg-red-50' : 'bg-[#c40012] text-white hover:bg-[#a90010]'}`} />
    </section>
  );
}
