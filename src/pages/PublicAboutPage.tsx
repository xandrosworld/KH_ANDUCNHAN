import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  Handshake,
  Home,
  KeyRound,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { svpApi } from '../services/svpApi';
import { defaultPublicAbout, type PublicAboutContent } from '../data/publicPages';

const HERO_IMAGE = '/assets/svp-auth-hero.png';

const stats = [
  {
    value: '1 nơi',
    label: 'gom dữ liệu nguồn nhà, khách mua và người phụ trách',
  },
  {
    value: 'Rõ vai trò',
    label: 'mỗi tài khoản chỉ nhìn phần việc đúng quyền xử lý',
  },
  {
    value: 'Nhanh hơn',
    label: 'giảm nhập lại thông tin, giảm sót lịch và sót khách',
  },
];

const audienceCards = [
  {
    icon: Home,
    title: 'Chủ nhà',
    description: 'Gửi thông tin bán nhà, cập nhật tình trạng và nhận phản hồi từ đội ngũ phụ trách.',
    color: 'bg-[#0f9f6e]',
  },
  {
    icon: Search,
    title: 'Khách mua',
    description: 'Để lại nhu cầu theo khu vực, tài chính, thời gian xem nhà và tiêu chí bắt buộc.',
    color: 'bg-[#d60016]',
  },
  {
    icon: UsersRound,
    title: 'Đội ngũ môi giới',
    description: 'Tiếp nhận nguồn, chăm sóc khách, theo dõi tiến độ và phối hợp theo từng vai trò.',
    color: 'bg-[#244b7a]',
  },
];

const processSteps = [
  {
    icon: ClipboardCheck,
    title: 'Tiếp nhận thông tin',
    description: 'Nguồn nhà và nhu cầu mua được gửi vào hệ thống với đầy đủ thông tin liên hệ ban đầu.',
  },
  {
    icon: FileCheck2,
    title: 'Chuẩn hóa dữ liệu',
    description: 'Thông tin địa chỉ, giá, pháp lý, người giới thiệu và trạng thái được ghi nhận rõ ràng.',
  },
  {
    icon: KeyRound,
    title: 'Phân quyền xử lý',
    description: 'Quản trị duyệt tài khoản, phân vai trò và giữ dữ liệu đúng phạm vi người dùng.',
  },
  {
    icon: Handshake,
    title: 'Kết nối đúng người',
    description: 'Đội ngũ phụ trách có dữ liệu đủ để phản hồi nhanh, đúng khách và đúng nguồn nhà.',
  },
];

const trustItems = [
  'Hồ sơ nguồn nhà được lưu tập trung theo trạng thái xử lý.',
  'Nhu cầu khách mua có người phụ trách rõ ràng để tránh trùng việc.',
  'Lịch sử thao tác và thông tin giới thiệu giúp đối soát khi cần.',
];

export default function PublicAboutPage() {
  const [content, setContent] = useState<PublicAboutContent>(defaultPublicAbout);

  useEffect(() => {
    let cancelled = false;

    svpApi
      .getConfig()
      .then((groups) => {
        if (cancelled) return;

        const about = groups
          .find((group) => group.id === 'public_pages')
          ?.options.find((option) => option.value === 'about' && option.isActive !== false);
        const metadata = about?.metadata || {};

        setContent({
          title: String(metadata.title || about?.label || defaultPublicAbout.title),
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

  const displayTitle = useMemo(() => {
    const normalizedTitle = content.title.trim().toLocaleLowerCase('vi-VN');
    return normalizedTitle === 'giới thiệu' ? defaultPublicAbout.title : content.title;
  }, [content.title]);

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#25202a]">
      <section className="relative min-h-[74vh] overflow-hidden bg-[#201716] text-white">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,23,22,0.92)_0%,rgba(32,23,22,0.76)_42%,rgba(32,23,22,0.28)_100%)]" />
        <div className="relative mx-auto flex min-h-[74vh] max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-black text-[#c40012] shadow-sm ring-1 ring-white/70 transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>

          <div className="mt-auto max-w-3xl pb-10 pt-20 sm:pb-14">
            <img
              src={content.imageUrl}
              alt={displayTitle}
              className="h-20 w-20 rounded-full bg-white/95 object-contain p-1 shadow-lg ring-1 ring-white/80"
            />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#ffd7a3]">Giới thiệu</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{displayTitle}</h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-white/90 sm:text-lg">{content.subtitle}</p>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm font-semibold leading-7 text-white/78 sm:text-base">
              {content.body}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d60016] px-5 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:bg-[#b90013]"
              >
                Đăng ký tài khoản
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tin-tuc"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/95 px-5 text-sm font-black text-[#c40012] shadow-lg shadow-black/10 transition hover:bg-white"
              >
                Xem tin tức
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <article key={item.value} className="rounded-lg bg-white p-5 shadow-lg shadow-red-950/5 ring-1 ring-red-100">
              <p className="text-2xl font-black text-[#c40012]">{item.value}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#5f6673]">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Dành cho ai</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Một hệ thống chung cho nguồn nhà, khách mua và đội ngũ xử lý
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#656b76] sm:text-base">
              Sổ Đỏ Vạn Phúc được thiết kế để mọi thông tin quan trọng trong giao dịch thổ cư được ghi nhận gọn,
              dễ tìm và dễ bàn giao giữa các bộ phận.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audienceCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-red-100">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#656b76]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Cách vận hành</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Từ thông tin rời rạc thành luồng xử lý rõ ràng</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#656b76] sm:text-base">
              Hệ thống tập trung vào những thao tác thực tế: nhận thông tin, kiểm tra, duyệt vai trò, phân người
              phụ trách và theo dõi trạng thái. Mục tiêu là giảm nhầm lẫn trong lúc xử lý nhiều nguồn nhà cùng lúc.
            </p>
            <div className="mt-7 rounded-lg bg-[#fff8f2] p-5 ring-1 ring-red-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#c40012]" />
                <div>
                  <h3 className="font-black">Dữ liệu được bảo vệ theo phân quyền</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#656b76]">
                    Người dùng đăng nhập theo vai trò, quản trị có thể duyệt và điều phối quyền xem theo nhu cầu sử dụng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-lg border border-red-100 bg-[#fffdfb] p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#c40012] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9a6b6b]">
                        Bước {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-[#656b76]">{step.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg bg-[#251d1d] text-white shadow-xl shadow-red-950/10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="min-h-[320px] bg-[#201716]">
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover opacity-90" />
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[#ffd7a3]">
              <Database className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#ffd7a3]">Điểm mạnh</p>
            <h2 className="mt-3 text-3xl font-black leading-tight">Dữ liệu rõ, người xử lý rõ, trạng thái rõ</h2>
            <div className="mt-6 grid gap-4">
              {trustItems.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#53d692]" />
                  <p className="text-sm font-semibold leading-7 text-white/82">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-red-100 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#c40012]">
                <BadgeCheck className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-[0.16em]">Sổ Đỏ Vạn Phúc</span>
              </div>
              <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Bắt đầu sử dụng hệ thống ngay hôm nay</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#656b76]">
                Đăng ký tài khoản theo đúng vai trò để gửi nguồn nhà, để lại nhu cầu mua hoặc tham gia xử lý dữ liệu cùng đội ngũ.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#d60016] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#b90013]"
              >
                Đăng ký tài khoản
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-50 px-5 text-sm font-black text-[#c40012] ring-1 ring-red-100 transition hover:bg-red-100"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
