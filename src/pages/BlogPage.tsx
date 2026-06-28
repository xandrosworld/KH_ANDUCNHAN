import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { CalendarDays, User } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts, localizeBlogPost } from '../data/blogPosts';

const BlogPage = () => {
  const { t, lang } = useLanguage();
  const localizedPosts = blogPosts.map((post) => localizeBlogPost(post, lang));
  usePageTitle(t('blog.title'));
  return (
    <PageShell raw>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
          }}
        />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto pt-16 sm:pt-20 pb-12 sm:pb-16 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-4 leading-tight break-words"
            style={{ fontSize: 'clamp(30px, 6vw, 46px)' }}
          >
            {t('blog.title')}
          </h1>
          <p className="text-[#A7ABB6] text-[15px] sm:text-[17px] leading-relaxed max-w-full sm:max-w-[640px] break-words">
            {t('blog.subtitleFull')}
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {localizedPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-[#15151D] rounded-xl border border-white/[0.085] overflow-hidden hover:border-[#B88717]/30 transition-colors flex flex-col min-w-0"
            >
              {/* Image */}
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover max-w-full group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#B88717]/90 text-[#030405] text-[11px] font-semibold">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow min-w-0">
                <h2 className="text-[#F6D37A] font-semibold text-[16px] sm:text-[17px] leading-snug mb-2 break-words group-hover:text-[#FFE8A3] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[#7D8291] text-[13px] leading-relaxed mb-4 break-words flex-grow">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-[12px] text-[#A7ABB6]">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{post.author}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default BlogPage;
