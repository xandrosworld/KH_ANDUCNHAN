import { ArrowRight, BookOpen, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts, localizeBlogPost } from '../data/blogPosts';

const MarketGuides = () => {
  const { lang } = useLanguage();
  const posts = blogPosts.slice(0, 3).map((post) => localizeBlogPost(post, lang));
  const copy = lang === 'vi'
    ? {
        title: 'Cẩm nang thị trường & người mua',
        subtitle: 'Đọc các bài hướng dẫn, góc nhìn thị trường và kiến thức tài chính đã có sẵn trên So Do Van Phuc.',
        kicker: 'So Do Van Phuc Journal',
        viewAll: 'Xem tất cả bài viết',
        readMore: 'Đọc thêm',
      }
    : {
        title: 'Market Guides & Buyer Resources',
        subtitle: 'Explore buying guides, market insights, and financing basics already published on So Do Van Phuc.',
        kicker: 'So Do Van Phuc Journal',
        viewAll: 'View all articles',
        readMore: 'Read more',
      };

  return (
    <div className="w-full">
      <div className="max-w-[1240px] mx-auto pt-8 pb-10 px-4 md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#B88717]/30 bg-[#B88717]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F6D37A]">
              <BookOpen className="h-3.5 w-3.5" />
              {copy.kicker}
            </div>
            <h2 className="text-[21px] font-bold text-[#F6D37A] mb-1">
              {copy.title}
            </h2>
            <p className="max-w-[680px] text-[13px] text-[#A7ABB6]">
              {copy.subtitle}
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#F6D37A] hover:text-[#FFE8A3] transition-colors"
          >
            {copy.viewAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.085] bg-[#15151D] shadow-[0_22px_52px_rgba(0,0,0,0.38)] transition-colors hover:border-[#B88717]/45"
            >
              <div className="relative" style={{ paddingBottom: '58%' }}>
                <img
                  src={post.image}
                  alt={post.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded bg-[#111111]/90 px-2 py-[3px] text-[11px] font-semibold text-[#F6D37A]">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#8F94A3]">
                  <CalendarDays className="h-3.5 w-3.5 text-[#B88717]" />
                  {post.date}
                </div>
                <h3 className="mb-2 line-clamp-2 text-[16px] font-bold leading-snug text-[#F6D37A]">
                  {post.title}
                </h3>
                <p className="line-clamp-3 text-[13px] leading-relaxed text-[#A7ABB6]">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-[#F6D37A]">
                  {copy.readMore}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketGuides;
