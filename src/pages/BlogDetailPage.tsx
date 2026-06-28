import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, User } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts, localizeBlogPost } from '../data/blogPosts';

const BlogDetailPage = () => {
  const { t, lang } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const foundPost = blogPosts.find((p) => p.slug === slug);
  const post = foundPost ? localizeBlogPost(foundPost, lang) : undefined;
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 2)
    .map((related) => localizeBlogPost(related, lang));

  return (
    <PageShell maxWidth="max-w-[900px]">
      {!post ? (
        /* Not Found State */
        <div className="pt-8 pb-28 lg:pb-16 min-w-0 text-center">
          <h1 className="text-[#F6D37A] font-bold text-[28px] mb-4 break-words">{t('blog.notFound')}</h1>
          <p className="text-[#7D8291] text-[15px] mb-8 break-words">
            {t('blog.notFoundDesc')}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('blog.backToBlog')}
          </Link>
        </div>
      ) : (
        <>
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#A7ABB6] hover:text-[#F6D37A] text-[14px] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            {t('blog.backToBlog')}
          </Link>

          {/* Hero Image */}
          <div className="w-full aspect-[16/8] rounded-xl overflow-hidden mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover max-w-full"
            />
          </div>

          {/* Meta + Title */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="px-3 py-1 rounded-full bg-[#B88717]/15 text-[#F6D37A] text-[12px] font-semibold border border-[#B88717]/20">
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#A7ABB6]">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#A7ABB6]">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              {post.author}
            </span>
          </div>
          <h1
            className="text-[#F6D37A] font-bold leading-tight mb-8 break-words"
            style={{ fontSize: 'clamp(24px, 5vw, 38px)' }}
          >
            {post.title}
          </h1>

          {/* Content */}
          <div className="space-y-6 mb-16">
            {post.content.split('\n\n').map((paragraph, idx) => (
              <p
                key={idx}
                className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed break-words"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Related Posts */}
          <div className="border-t border-white/[0.085] pt-10">
            <h2 className="text-[#F6D37A] font-bold text-[20px] sm:text-[24px] mb-6 break-words">
              {t('blog.relatedPosts')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="group bg-[#15151D] rounded-xl border border-white/[0.085] overflow-hidden hover:border-[#B88717]/30 transition-colors flex flex-col min-w-0"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover max-w-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#B88717]/90 text-[#030405] text-[11px] font-semibold">
                      {related.category}
                    </span>
                  </div>
                  <div className="p-5 min-w-0">
                    <h3 className="text-[#F6D37A] font-semibold text-[15px] leading-snug mb-2 break-words group-hover:text-[#FFE8A3] transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-[#7D8291] text-[13px] leading-relaxed break-words line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
};

export default BlogDetailPage;
