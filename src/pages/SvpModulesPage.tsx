import { BarChart3, Bell, BookOpen, Brain, CheckCircle2, CircleDashed, GitBranch, GraduationCap, Handshake, Map, Network, QrCode, ShieldCheck, UsersRound } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';

type ModuleState = 'ready' | 'foundation' | 'next';

interface ModuleItem {
  title: string;
  state: ModuleState;
  icon: typeof Brain;
  rows: string[];
}

const modules: ModuleItem[] = [
  {
    title: 'Core + API mo',
    state: 'ready',
    icon: Network,
    rows: ['Bang MySQL moi', '/api/svp/*', 'Fallback localStorage'],
  },
  {
    title: 'AI ready data',
    state: 'foundation',
    icon: Brain,
    rows: ['Tag cau truc', 'Truong gia/dien tich/khu vuc', 'Extra JSON'],
  },
  {
    title: 'Timeline / Version',
    state: 'ready',
    icon: GitBranch,
    rows: ['Event theo nha', 'Snapshot version', 'Khong ghi de'],
  },
  {
    title: 'Referral / SVP ID / QR',
    state: 'ready',
    icon: QrCode,
    rows: ['Bang referrals', 'Ma gioi thieu', 'QR that'],
  },
  {
    title: 'Ban do / Heatmap',
    state: 'next',
    icon: Map,
    rows: ['Toa do nha', 'Mat do nguon', 'Mat do giao dich'],
  },
  {
    title: 'Mang xa hoi noi bo',
    state: 'next',
    icon: UsersRound,
    rows: ['Ho so ca nhan', 'Bai viet/video', 'Theo doi/uy tin'],
  },
  {
    title: 'KPI',
    state: 'ready',
    icon: BarChart3,
    rows: ['Dashboard KPI', 'Trạng thái/tag', 'Lịch xem sắp tới'],
  },
  {
    title: 'Thong bao realtime',
    state: 'next',
    icon: Bell,
    rows: ['Bang notifications', 'Realtime channel', 'Mau tin theo su kien'],
  },
  {
    title: 'Tuyen dung',
    state: 'foundation',
    icon: UsersRound,
    rows: ['Bang ung vien', 'Nguồn tuyen dung', 'Landing/QR sau'],
  },
  {
    title: 'Dao tao',
    state: 'foundation',
    icon: GraduationCap,
    rows: ['Bang noi dung hoc', 'Video/quiz', 'Điểm/chung nhan sau'],
  },
  {
    title: 'Doi tac',
    state: 'next',
    icon: Handshake,
    rows: ['Ngan hang', 'Cong chung', 'Tham dinh/noi that'],
  },
  {
    title: 'Kho tri thuc',
    state: 'next',
    icon: BookOpen,
    rows: ['Bieu mau', 'Phap ly', 'AI hoi dap'],
  },
  {
    title: 'Điểm uy tin',
    state: 'foundation',
    icon: ShieldCheck,
    rows: ['Bang reputation', 'Tieu chi cham diem', 'Phan quyen sau'],
  },
];

const stateCopy: Record<ModuleState, { label: string; className: string }> = {
  ready: { label: 'Co UI', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' },
  foundation: { label: 'Co nen', className: 'border-[#F6D37A]/30 bg-[#F6D37A]/10 text-[#F6D37A]' },
  next: { label: 'Sau MVP', className: 'border-white/10 bg-white/[0.06] text-[#A7ABB6]' },
};

const SvpModulesPage = () => {
  usePageTitle('Module nội bộ');

  return (
    <PageShell maxWidth="max-w-[1320px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
            <CircleDashed className="h-4 w-4" />
            Roadmap module
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Khung module Sổ Đỏ Vạn Phúc</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
            Trang nay giu dung pham vi da chot trong master plan: phan MVP co UI truoc, phan lon hon co database/skeleton de mo rong.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon;
            const state = stateCopy[item.state];
            return (
              <article key={item.title} className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#F6D37A]/10 text-[#F6D37A]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-[16px] font-black text-[#F5F0E6]">{item.title}</h2>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${state.className}`}>
                    {state.label}
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  {item.rows.map((row) => (
                    <div key={row} className="flex items-center gap-2 text-[13px] text-[#D7DAE3]">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#F6D37A]" />
                      <span>{row}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </PageShell>
  );
};

export default SvpModulesPage;
