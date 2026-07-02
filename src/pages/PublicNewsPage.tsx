import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper } from 'lucide-react';

const posts = [
  {
    title: 'Bản V1 ưu tiên thao tác nhanh trên điện thoại',
    body: 'Các màn đăng nhập, đăng ký, đăng nhà và kho nhà được tinh gọn để người dùng xử lý việc chính với ít lần bấm hơn.',
  },
  {
    title: 'Chuyên gia có thể gửi nguồn nhà chờ duyệt',
    body: 'Nguồn mới sau khi gửi sẽ nằm trong kho nhà cá nhân, kèm trạng thái để admin xem chi tiết và phê duyệt.',
  },
  {
    title: 'Mã giới thiệu giúp ghi nhận nguồn người dùng',
    body: 'Mỗi tài khoản có mã/link giới thiệu riêng để theo dõi người giới thiệu khi đăng ký tài khoản mới.',
  },
];

export default function PublicNewsPage() {
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
            Khu vực này dùng để hiển thị nhanh các thông tin giới thiệu, cập nhật hệ thống và ghi chú vận hành cơ bản trong bản V1.
          </p>
        </section>

        <section className="mt-4 space-y-3">
          {posts.map((post) => (
            <article key={post.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-100">
              <h2 className="font-black leading-6">{post.title}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#68717e]">{post.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
