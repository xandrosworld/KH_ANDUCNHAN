import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Clock, Newspaper, ShieldCheck } from 'lucide-react';
import { svpApi } from '../services/svpApi';
import { defaultPublicNewsPosts, getDefaultPublicNewsImage, type PublicNewsPost } from '../data/publicPages';

type NewsViewPost = PublicNewsPost & {
  category: string;
  readTime: string;
};

const categoryByPostId: Record<string, string> = {
  public_news_v1: 'Kết nối nhu cầu',
  public_news_expert: 'Kho nguồn nhà',
  public_news_referral: 'Chăm sóc khách',
  public_news_phap_ly_so_do: 'Pháp lý',
  public_news_kiem_tra_quy_hoach: 'Quy hoạch',
  public_news_dinh_gia_tho_cu: 'Định giá',
  public_news_xem_nha_lan_dau: 'Kinh nghiệm xem nhà',
  public_news_chu_nha_chuan_bi_ban: 'Dành cho chủ nhà',
  public_news_khach_mua_lap_nhu_cau: 'Dành cho khách mua',
  public_news_thuong_luong_gia: 'Thương lượng',
  public_news_dat_coc_an_toan: 'Đặt cọc',
  public_news_hem_ngo_mat_tien: 'Vị trí nhà',
  public_news_nha_co_dong_tien: 'Đầu tư',
  public_news_mua_o_va_dau_tu: 'Chiến lược mua',
  public_news_anh_video_nha: 'Hình ảnh nguồn nhà',
  public_news_tranh_trung_nguon: 'Cộng tác viên',
  public_news_cham_soc_khach_mua: 'Chăm sóc khách',
  public_news_hop_dong_trich_thuong: 'Thỏa thuận',
  public_news_vai_tro_cong_tac_vien: 'Cộng tác viên',
  public_news_du_lieu_minh_bach: 'Dữ liệu minh bạch',
};

function getCategory(postId: string) {
  return categoryByPostId[postId] || 'Tin thổ cư';
}

function getReadTime(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 95))} phút đọc`;
}

function getExcerpt(body: string) {
  return body.split(/\n\s*\n/)[0]?.trim() || body.trim();
}

function toViewPost(post: PublicNewsPost): NewsViewPost {
  return {
    ...post,
    imageUrl: post.imageUrl || getDefaultPublicNewsImage(post.id),
    category: getCategory(post.id),
    readTime: getReadTime(post.body),
  };
}

export default function PublicNewsPage() {
  const [posts, setPosts] = useState<PublicNewsPost[] | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    svpApi.getConfig()
      .then((groups) => {
        if (cancelled) return;
        const items = (groups.find((group) => group.id === 'public_pages')?.options || [])
          .filter((option) => option.isActive !== false && (option.metadata?.type === 'news' || option.value.startsWith('news_')))
          .sort((first, second) => first.sortOrder - second.sortOrder)
          .map((option) => ({
            id: option.id,
            title: option.label,
            body: String(option.metadata?.body || ''),
            imageUrl: String(option.metadata?.imageUrl || ''),
            videoUrl: String(option.metadata?.videoUrl || ''),
            linkUrl: String(option.metadata?.linkUrl || ''),
          }))
          .filter((item) => item.title.trim() || item.body.trim());
        setPosts(items.length ? items : defaultPublicNewsPosts);
      })
      .catch(() => setPosts(defaultPublicNewsPosts));

    return () => {
      cancelled = true;
    };
  }, []);

  const viewPosts = useMemo(() => posts?.map(toViewPost) || null, [posts]);
  const featuredPost = viewPosts?.[0] || null;
  const sidePosts = viewPosts?.slice(1, 4) || [];
  const remainingPosts = viewPosts?.slice(4) || [];
  const postCount = viewPosts?.length || defaultPublicNewsPosts.length;

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#25202a]">
      <section className="relative overflow-hidden bg-[#261114] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/svp-auth-hero.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17090d]/95 via-[#451117]/78 to-[#261114]/50" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#c40012] shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>

          <div className="grid min-h-[380px] items-end pb-8 pt-16 sm:min-h-[430px]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-xs font-black uppercase text-white ring-1 ring-white/20">
                <Newspaper className="h-4 w-4" />
                Tin tức Sổ Đỏ Vạn Phúc
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
                Kiến thức bất động sản thổ cư cho người mua, chủ nhà và đội ngũ môi giới
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-white/86 sm:text-lg">
                Các bài viết thực tế về pháp lý, định giá, xem nhà, đặt cọc và cách quản lý nguồn nhà minh bạch trên hệ thống Sổ Đỏ Vạn Phúc.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#8f0010]">
                  <ShieldCheck className="h-4 w-4" />
                  {postCount} bài hướng dẫn
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f3bd43] px-4 py-2 text-sm font-black text-[#2f1c08]">
                  <Building2 className="h-4 w-4" />
                  Trọng tâm nhà thổ cư
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {viewPosts === null || featuredPost === null ? (
          <NewsLoadingGrid />
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <FeaturedArticle
                post={featuredPost}
                expanded={expandedPostId === featuredPost.id}
                onToggle={() => setExpandedPostId((current) => current === featuredPost.id ? null : featuredPost.id)}
              />

              <div className="grid gap-4">
                {sidePosts.map((post) => (
                  <CompactArticle
                    key={post.id}
                    post={post}
                    expanded={expandedPostId === post.id}
                    onToggle={() => setExpandedPostId((current) => current === post.id ? null : post.id)}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-[#c40012]">Cẩm nang thổ cư</p>
                  <h2 className="mt-1 text-2xl font-black sm:text-3xl">Bài viết mới nhất</h2>
                </div>
                <p className="max-w-xl text-sm font-semibold leading-6 text-[#68717e]">
                  Nội dung được viết theo hướng dễ hiểu, dùng được cho khách mua, chủ nhà, cộng tác viên và chuyên gia tư vấn.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {remainingPosts.map((post) => (
                  <NewsCard
                    key={post.id}
                    post={post}
                    expanded={expandedPostId === post.id}
                    onToggle={() => setExpandedPostId((current) => current === post.id ? null : post.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ArticleMeta({ post }: { post: NewsViewPost }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
      <span className="rounded-full bg-red-50 px-3 py-1 text-[#c40012]">{post.category}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f5f8] px-3 py-1 text-[#596476]">
        <Clock className="h-3.5 w-3.5" />
        {post.readTime}
      </span>
    </div>
  );
}

function ToggleButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#c40012] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#9f0010]"
    >
      {expanded ? 'Thu gọn' : 'Đọc toàn bộ'}
      <ArrowRight className={`h-4 w-4 transition ${expanded ? '-rotate-90' : ''}`} />
    </button>
  );
}

function FeaturedArticle({ post, expanded, onToggle }: { post: NewsViewPost; expanded: boolean; onToggle: () => void }) {
  return (
    <article data-testid="public-news-article" className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-100">
      <img src={post.imageUrl} alt={post.title} className="aspect-[16/9] w-full object-cover object-bottom" />
      <div className="p-5 sm:p-7">
        <ArticleMeta post={post} />
        <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{post.title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-[#68717e]">
          {expanded ? post.body : getExcerpt(post.body)}
        </p>
        <ToggleButton expanded={expanded} onToggle={onToggle} />
      </div>
    </article>
  );
}

function CompactArticle({ post, expanded, onToggle }: { post: NewsViewPost; expanded: boolean; onToggle: () => void }) {
  return (
    <article data-testid="public-news-article" className="grid overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-100 sm:grid-cols-[170px_1fr] lg:grid-cols-1 xl:grid-cols-[170px_1fr]">
      <img src={post.imageUrl} alt={post.title} className="h-40 w-full object-cover object-bottom sm:h-full lg:h-40 xl:h-full" />
      <div className="p-4">
        <ArticleMeta post={post} />
        <h2 className="mt-3 text-lg font-black leading-6">{post.title}</h2>
        <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#68717e]">
          {expanded ? post.body : getExcerpt(post.body)}
        </p>
        <ToggleButton expanded={expanded} onToggle={onToggle} />
      </div>
    </article>
  );
}

function NewsCard({ post, expanded, onToggle }: { post: NewsViewPost; expanded: boolean; onToggle: () => void }) {
  return (
    <article data-testid="public-news-article" className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-100">
      <img src={post.imageUrl} alt={post.title} className="aspect-[16/9] w-full object-cover object-bottom" />
      <div className="flex flex-1 flex-col p-4">
        <ArticleMeta post={post} />
        <h2 className="mt-3 text-lg font-black leading-6">{post.title}</h2>
        <p className="mt-2 flex-1 whitespace-pre-line text-sm font-semibold leading-6 text-[#68717e]">
          {expanded ? post.body : getExcerpt(post.body)}
        </p>
        <ToggleButton expanded={expanded} onToggle={onToggle} />
      </div>
    </article>
  );
}

function NewsLoadingGrid() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <NewsSkeleton large />
      <div className="grid gap-4">
        <NewsSkeleton />
        <NewsSkeleton />
        <NewsSkeleton />
      </div>
    </section>
  );
}

function NewsSkeleton({ large = false }: { large?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-red-100 ${large ? 'lg:grid lg:grid-cols-[1.1fr_0.9fr]' : ''}`}>
      <div className={`${large ? 'h-64 lg:h-full' : 'h-40'} animate-pulse bg-[#f0d9cf]`} />
      <div className="p-4">
        <div className="h-5 w-28 animate-pulse rounded bg-red-50" />
        <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-[#eceff4]" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-[#f2ebe6]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-[#f2ebe6]" />
        </div>
      </div>
    </article>
  );
}
