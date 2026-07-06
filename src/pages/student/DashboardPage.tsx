import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bot, CheckCircle2, ClipboardList, Copy, ExternalLink, GraduationCap, Share2, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';

const starterTasks = [
  'Hoàn thiện hồ sơ cá nhân và thông tin ngân hàng',
  'Nộp hoặc cập nhật chứng chỉ hành nghề nếu có',
  'Xem tài liệu nhập môn về quy trình nguồn nhà',
  'Lấy mã giới thiệu để bắt đầu xây dựng hệ thống',
];

const starterLessons = [
  { title: 'Quy trình nhập nguồn nhà', type: 'Bài học nền tảng' },
  { title: 'Cách chăm sóc khách mua mới', type: 'Đào tạo nội bộ' },
  { title: 'Quy tắc dùng mã/link giới thiệu', type: 'Hướng dẫn nhanh' },
];

export default function StudentDashboardPage() {
  usePageTitle('Học viên | Sổ Đỏ Vạn Phúc');
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeDays, setActiveDays] = useState<number | null>(null);

  const referralLink = useMemo(() => {
    const code = user?.referralCode || '';
    return `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  }, [user?.referralCode]);

  useEffect(() => {
    const raw = user?.createdAt || user?.created_at || '';
    const createdAt = raw ? new Date(String(raw).replace(' ', 'T')) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      setActiveDays(null);
      return;
    }
    const diff = Date.now() - createdAt.getTime();
    setActiveDays(Math.max(1, Math.floor(diff / 86_400_000) + 1));
  }, [user?.createdAt, user?.created_at]);

  const copyReferral = async () => {
    await navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Học viên</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Lộ trình nhập môn</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
              {user?.fullName || 'Học viên'} đang ở giai đoạn hoàn thiện hồ sơ, học quy trình và nhận việc cần làm.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<Timer className="h-5 w-5" />} label="Số ngày hoạt động" value={activeDays ? `${activeDays}` : '1+'} />
        <SummaryCard icon={<ClipboardList className="h-5 w-5" />} label="Việc cần làm" value={`${starterTasks.length}`} />
        <SummaryCard icon={<GraduationCap className="h-5 w-5" />} label="Bài đào tạo" value={`${starterLessons.length}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#c40012]" />
            <h2 className="font-black text-[#25202a]">Danh sách việc cần làm</h2>
          </div>
          <div className="space-y-2">
            {starterTasks.map((task, index) => (
              <article key={task} className="flex items-start gap-3 rounded-2xl bg-[#fff8f2] px-3 py-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-[#c40012] ring-1 ring-red-100">
                  {index + 1}
                </div>
                <p className="text-sm font-bold leading-6 text-[#25202a]">{task}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#c40012]" />
            <h2 className="font-black text-[#25202a]">Mã và link giới thiệu</h2>
          </div>
          <div className="rounded-2xl bg-[#fff8f2] p-4">
            <p className="break-all text-2xl font-black text-[#c40012]">{user?.referralCode || '-'}</p>
            <p className="mt-2 break-all text-xs font-semibold leading-5 text-[#667085]">{referralLink}</p>
          </div>
          <button
            type="button"
            onClick={copyReferral}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white"
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Đã sao chép' : 'Sao chép link'}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#c40012]" />
            <h2 className="font-black text-[#25202a]">Khóa đào tạo nội bộ</h2>
          </div>
          <div className="space-y-2">
            {starterLessons.map((lesson) => (
              <article key={lesson.title} className="rounded-2xl border border-gray-100 bg-white px-3 py-3">
                <p className="text-sm font-black text-[#25202a]">{lesson.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#667085]">{lesson.type}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#c40012]" />
            <h2 className="font-black text-[#25202a]">Trợ lý AI</h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-[#667085]">
            Học viên có thể hỏi nhanh về quy trình, cách ghi chú nhu cầu, mô tả nguồn nhà và cách dùng hệ thống.
          </p>
          <Link
            to="/ai"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25202a] px-4 text-sm font-black text-white"
          >
            Mở Trợ lý AI
            <ExternalLink className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-[#c40012]">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a6b6b]">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#c40012]">{value}</p>
    </div>
  );
}
