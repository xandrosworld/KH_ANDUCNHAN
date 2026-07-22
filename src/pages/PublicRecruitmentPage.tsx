import { ArrowRight, BriefcaseBusiness, Loader2, PhoneCall, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicPageHeader from '../components/PublicPageHeader';
import { recruitmentApi } from '../services/recruitmentApi';
import type { RecruitmentPost } from '../types/recruitment';

export default function PublicRecruitmentPage() {
  const [search] = useSearchParams();
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    recruitmentApi.listPublic().then((data) => setPosts(data.items)).catch((err) => setError(err.message || 'Chưa tải được thông tin tuyển dụng.')).finally(() => setLoading(false));
  }, []);

  const query = search.toString();

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#251f25]">
      <PublicPageHeader />
      <section className="border-b border-red-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex max-w-3xl items-center gap-3 text-xs font-black uppercase text-[#c40012]"><BriefcaseBusiness className="h-5 w-5" />Cơ hội nghề nghiệp</div>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Tuyển dụng Sổ Đỏ Vạn Phúc</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#665f68] sm:text-lg">Lựa chọn vị trí phù hợp, gửi thông tin trực tiếp và nhận hỗ trợ định hướng từ đội ngũ phát triển nhân lực.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#5a535c]"><span className="inline-flex items-center gap-2"><UsersRound className="h-5 w-5 text-[#c40012]" />Nhiều lộ trình phát triển</span><span className="inline-flex items-center gap-2"><PhoneCall className="h-5 w-5 text-[#c40012]" />Nhân sự liên hệ trực tiếp</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#c40012]" /></div> : null}
        {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-900">{error}</div> : null}
        {!loading && !error && posts.length === 0 ? <div className="border-y border-red-100 py-14 text-center text-sm font-semibold text-[#6d6670]">Chưa có đợt tuyển dụng đang mở.</div> : null}
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => {
            const href = `/tuyen-dung/${post.slug}${query ? `?${query}` : ''}`;
            return (
              <article key={post.id} className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-[0_14px_38px_rgba(84,29,25,0.08)]">
                <Link to={href} className="block overflow-hidden"><img src={post.bannerUrl} alt={`Tuyển dụng ${post.title}`} className="aspect-[16/9] w-full object-cover transition duration-500 hover:scale-[1.025]" /></Link>
                <div className="p-5 sm:p-6">
                  <div className="text-xs font-black uppercase text-[#c40012]">{post.eyebrow}</div>
                  <h2 className="mt-2 text-2xl font-black leading-tight"><Link to={href}>{post.title}</Link></h2>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#69626b]">{post.summary}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-red-100 pt-4"><div className="text-sm font-bold"><div>{post.recruiterName}</div><div className="text-xs font-semibold text-[#77717a]">Đội ngũ phát triển nhân lực</div></div><Link to={href} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c40012] px-4 text-sm font-black text-white">Xem vị trí<ArrowRight className="h-4 w-4" /></Link></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
