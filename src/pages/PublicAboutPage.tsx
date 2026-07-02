import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function PublicAboutPage() {
  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-5 text-[#25202a]">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#c40012] shadow-sm ring-1 ring-red-100">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-red-100 sm:p-7">
          <img src="/logo11.png" alt="Sổ Đỏ Vạn Phúc" className="h-20 w-20 rounded-full object-contain" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Giới thiệu</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Sổ Đỏ Vạn Phúc</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#656b76]">
            Hệ thống hỗ trợ quản lý nguồn nhà, khách hàng, lịch xem, giới thiệu và dữ liệu vận hành cho đội ngũ bất động sản thổ cư.
            Mục tiêu của bản V1 là giúp người dùng nhập liệu nhanh, theo dõi việc cần làm rõ ràng và giảm thao tác thừa trong công việc hằng ngày.
          </p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Building2, title: 'Quản lý nguồn nhà', text: 'Đăng nguồn, lưu thông tin chủ nhà, trạng thái và phân quyền xem.' },
            { icon: CheckCircle2, title: 'Vận hành gọn', text: 'Ưu tiên màn hình nhỏ, thao tác ít, nhìn nhanh được việc cần làm.' },
            { icon: ShieldCheck, title: 'Dữ liệu rõ ràng', text: 'Lưu lịch sử, người giới thiệu, phân vai trò và cấu trúc để mở rộng sau.' },
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
