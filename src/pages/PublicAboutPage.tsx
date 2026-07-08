import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { svpApi } from '../services/svpApi';
import { defaultPublicAbout, type PublicAboutContent } from '../data/publicPages';

export default function PublicAboutPage() {
  const [content, setContent] = useState<PublicAboutContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    svpApi.getConfig()
      .then((groups) => {
        if (cancelled) return;
        const about = groups
          .find((group) => group.id === 'public_pages')
          ?.options
          .find((option) => option.value === 'about' && option.isActive !== false);
        const metadata = about?.metadata || {};
        setContent({
          title: about?.label || defaultPublicAbout.title,
          subtitle: String(metadata.subtitle || defaultPublicAbout.subtitle),
          body: String(metadata.body || defaultPublicAbout.body),
          imageUrl: String(metadata.imageUrl || defaultPublicAbout.imageUrl),
          videoUrl: String(metadata.videoUrl || ''),
          linkUrl: String(metadata.linkUrl || ''),
        });
      })
      .catch(() => setContent(defaultPublicAbout));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-5 text-[#25202a]">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#c40012] shadow-sm ring-1 ring-red-100">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-red-100 sm:p-7">
          {content === null ? (
            <AboutSkeleton />
          ) : (
            <>
              <img src={content.imageUrl} alt={content.title} className="h-20 w-20 rounded-full object-contain" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Giới thiệu</p>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">{content.title}</h1>
              <p className="mt-2 text-sm font-black leading-6 text-[#343944]">{content.subtitle}</p>
              <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-[#656b76]">
                {content.body}
              </p>
              {content.videoUrl || content.linkUrl ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.videoUrl ? <a href={content.videoUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#c40012] px-4 py-2 text-xs font-black text-white">Xem video</a> : null}
                  {content.linkUrl ? <a href={content.linkUrl} target="_blank" rel="noreferrer" className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-[#c40012]">Xem thêm</a> : null}
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Building2, title: 'Quản lý nguồn nhà', text: 'Đăng nguồn, lưu thông tin chủ nhà, trạng thái và phân quyền xem.' },
            { icon: CheckCircle2, title: 'Vận hành gọn', text: 'Ưu tiên màn hình nhỏ, thao tác ít, nhìn nhanh được việc cần làm.' },
            { icon: ShieldCheck, title: 'Dữ liệu rõ ràng', text: 'Lưu lịch sử, người giới thiệu, phân vai trò và quyền xem theo từng nhu cầu sử dụng.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-100">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 font-black">{item.title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#68717e]">{item.text}</p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function AboutSkeleton() {
  return (
    <div>
      <div className="h-20 w-20 animate-pulse rounded-full bg-red-50" />
      <div className="mt-5 h-3 w-24 animate-pulse rounded bg-red-50" />
      <div className="mt-4 h-8 w-56 max-w-full animate-pulse rounded bg-[#f2ebe6]" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-[#f2ebe6]" />
      <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-[#f2ebe6]" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[#f2ebe6]" />
    </div>
  );
}
