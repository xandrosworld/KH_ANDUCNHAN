import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, Loader2, MonitorPlay } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicPageHeader from '../components/PublicPageHeader';
import { eventApi } from '../services/eventApi';
import type { SvpEvent } from '../types/events';

export default function PublicEventsPage() {
  const [items, setItems] = useState<SvpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { eventApi.listPublic().then((data) => setItems(data.items)).finally(() => setLoading(false)); }, []);

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#251f25]">
      <PublicPageHeader />
      <section className="border-b border-red-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="inline-flex items-center gap-2 text-sm font-black uppercase text-[#c40012]"><CalendarDays className="h-5 w-5" /> Sự kiện Sổ Đỏ Vạn Phúc</div>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Kiến thức thực tế cho người làm nghề bất động sản</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#66606a]">Các chương trình chia sẻ trực tuyến giúp người tham dự nâng cao năng lực, làm nghề minh bạch và phát triển bền vững.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#c40012]" /></div> : null}
        {!loading && items.length === 0 ? <div className="border-y border-red-100 py-12 text-center font-semibold text-[#6e6870]">Lịch sự kiện mới sẽ được cập nhật tại đây.</div> : null}
        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-[0_14px_38px_rgba(89,30,22,0.08)]">
              <Link to={`/su-kien/${event.slug}`} className="block aspect-[16/9] overflow-hidden bg-gray-100"><img src={event.bannerUrl} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" /></Link>
              <div className="p-5 sm:p-6">
                <div className="text-xs font-black uppercase text-[#c40012]">{event.eyebrow}</div>
                <h2 className="mt-2 text-2xl font-black leading-tight">{event.title}</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-[#6d6670]">{event.summary}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-[#49434b]"><span className="inline-flex items-center gap-1.5"><MonitorPlay className="h-4 w-4 text-[#c40012]" />{event.formatLabel}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#c40012]" />{event.scheduleLabel}</span></div>
                <Link to={`/su-kien/${event.slug}`} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#c40012] px-5 text-sm font-black text-white hover:bg-[#a90010]">Xem chi tiết <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
