import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { svpApi } from '../services/svpApi';

interface NewsPost {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  linkUrl: string;
}

const fallbackPosts: NewsPost[] = [
  {
    id: 'fallback-v1',
    title: 'Bản V1 ưu tiên thao tác nhanh trên điện thoại',
    body: 'Các màn đăng nhập, đăng ký, đăng nhà và kho nhà được tinh gọn để người dùng xử lý việc chính với ít lần bấm hơn.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
  {
    id: 'fallback-expert',
    title: 'Chuyên gia có thể gửi nguồn nhà chờ duyệt',
    body: 'Nguồn mới sau khi gửi sẽ nằm trong kho nhà cá nhân, kèm trạng thái để admin xem chi tiết và phê duyệt.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
  {
    id: 'fallback-referral',
    title: 'Mã giới thiệu giúp ghi nhận nguồn người dùng',
    body: 'Mỗi tài khoản có mã/link giới thiệu riêng để theo dõi người giới thiệu khi đăng ký tài khoản mới.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
];

export default function PublicNewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>(fallbackPosts);

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
        setPosts(items.length ? items : fallbackPosts);
      })
      .catch(() => setPosts(fallbackPosts));

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
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Newspaper className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Tin tức</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Cập nhật vận hành</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#656b76]">
            Khu vực hiển thị nhanh các thông tin giới thiệu, cập nhật hệ thống và ghi chú vận hành cơ bản.
          </p>
        </section>

        <section className="mt-4 space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-red-100">
              {post.imageUrl ? <img src={post.imageUrl} alt={post.title} className="h-36 w-full object-cover" /> : null}
              <div className="p-4">
                <h2 className="font-black leading-6">{post.title}</h2>
                <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-[#68717e]">{post.body}</p>
                {post.videoUrl || post.linkUrl ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.videoUrl ? <a href={post.videoUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#c40012] px-4 py-2 text-xs font-black text-white">Xem video</a> : null}
                    {post.linkUrl ? <a href={post.linkUrl} target="_blank" rel="noreferrer" className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-[#c40012]">Xem thêm</a> : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
