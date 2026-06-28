import { useEffect, useState, useRef } from 'react';
import {
  BarChart3, Home, Building2, Building, TrendingUp, Eye, Users, Heart,
  FileText, MessageSquare, UserPlus,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase, isApiConfigured } from '../services/apiClient';
import { listingService } from '../services/listingService';
import type { Property } from '../data/properties';
import { STATS_CHANGED_EVENT, readLocalUserName } from '../utils/statsEvents';

/* ── helpers ── */
const typeLabels: Record<string, Record<string, string>> = {
  'Single Family': { en: 'Single Family', vi: 'Nhà riêng' },
  'Condo':         { en: 'Condo', vi: 'Căn hộ chung cư' },
  'Townhouse':     { en: 'Townhouse', vi: 'Nhà phố liền kề' },
};

const typeColors: Record<string, string> = {
  'Single Family': '#F6D37A',
  'Condo':         '#B88717',
  'Townhouse':     '#7D8291',
};

const typeIcons: Record<string, React.ReactNode> = {
  'Single Family': <Home className="w-3.5 h-3.5" />,
  'Condo':         <Building2 className="w-3.5 h-3.5" />,
  'Townhouse':     <Building className="w-3.5 h-3.5" />,
};

/* ── Custom SVG Icons ── */
const AiBrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8L6 14l2 1 1.5-2h5L16 14l2-1-1.5-2.7c1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9.5" cy="7" r="1" fill="currentColor"/>
    <circle cx="14.5" cy="7" r="1" fill="currentColor"/>
    <path d="M10 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 15v4M9 17l3 5 3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AiWandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21L14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 10l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" fill="currentColor" opacity="0.9"/>
    <path d="M13 2l.5 1.5L15 4l-1.5.5L13 6l-.5-1.5L11 4l1.5-.5L13 2Z" fill="currentColor" opacity="0.5"/>
  </svg>
);

const AiChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12c0 4.418-4.03 8-9 8-1.4 0-2.73-.27-3.9-.75L3 21l1.5-4.25C3.55 15.35 3 13.73 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="8.5" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="15.5" cy="12" r="1" fill="currentColor"/>
  </svg>
);

/* ── AnimatedNumber ── */
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const dur = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
};

/* ── Mini stat card ── */
const MiniStat = ({
  icon, label, value, color, animated, delay = 0,
}: {
  icon: React.ReactNode; label: string; value: number; color: string; animated: boolean; delay?: number;
}) => (
  <div
    className="flex items-center gap-3 bg-white/[0.02] rounded-xl border border-white/[0.06] px-3.5 py-3"
    style={{
      opacity: animated ? 1 : 0,
      transform: animated ? 'translateY(0)' : 'translateY(8px)',
      transition: `all 0.5s ease ${delay}s`,
    }}
  >
    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[18px] font-bold text-[#F6D37A] leading-none">
        {animated ? <AnimatedNumber value={value} /> : 0}
      </div>
      <div className="text-[10px] text-[#F6D37A] mt-0.5 truncate">{label}</div>
    </div>
  </div>
);

/* ── Stats shape from API ── */
interface StatsData {
  listings: { total: number; active: number; sale: number; rent: number; vip: number };
  users: { total: number; active?: number; latestName?: string | null };
  likes: { total: number };
  inquiries?: { total: number; new?: number };
  schedules?: { total: number; pending?: number };
  messages?: { total: number };
  blogPosts?: number;
  propertyTypes: { property_type: string; count: number }[];
}

/* ── main component ── */
const PlatformStats = () => {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [animated, setAnimated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localLikesDelta, setLocalLikesDelta] = useState(0);
  const [localUserName, setLocalUserName] = useState<string | null>(() => readLocalUserName());
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fetch from /api/stats, fallback to listing service
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      // Try API stats endpoint first
      if (isApiConfigured()) {
        try {
          const res = await fetch(`${getApiBase()}/api/stats?_=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            // API returns { ok: true, data: { listings, users, ... } }
            const payload = json?.data || json;
            if (!cancelled && payload?.listings) {
              setStats(payload);
              setLocalLikesDelta(0);
              return;
            }
          }
        } catch { /* fallback below */ }
      }

      // Fallback: compute from listings
      try {
        const listings: Property[] = await listingService.getAll();
        if (cancelled) return;
        const typeCounts: Record<string, number> = {};
        listings.forEach(p => {
          const t = p.propertyType || 'Other';
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        setStats({
          listings: {
            total: listings.length,
            active: listings.length,
            sale: listings.filter(p => p.listingType === 'sale').length,
            rent: listings.filter(p => p.listingType === 'rent').length,
            vip: listings.filter(p => p.isVip).length,
          },
          users: { total: 0 },
          likes: { total: 0 },
          inquiries: { total: 0 },
          schedules: { total: 0 },
          messages: { total: 0 },
          blogPosts: 0,
          propertyTypes: Object.entries(typeCounts).map(([t, c]) => ({ property_type: t, count: c })),
        });
      } catch {
        setStats(null);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    const refreshStats = () => {
      setLocalUserName(readLocalUserName());
      setRefreshKey(key => key + 1);
    };

    const handleStatsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ likesDelta?: number }>).detail;
      const likesDelta = Number(detail?.likesDelta ?? 0);
      if (Number.isFinite(likesDelta) && likesDelta !== 0) {
        setLocalLikesDelta(delta => delta + likesDelta);
      }
      refreshStats();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshStats();
    };

    window.addEventListener(STATS_CHANGED_EVENT, handleStatsChanged);
    window.addEventListener('focus', refreshStats);
    window.addEventListener('pageshow', refreshStats);
    window.addEventListener('storage', refreshStats);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(STATS_CHANGED_EVENT, handleStatsChanged);
      window.removeEventListener('focus', refreshStats);
      window.removeEventListener('pageshow', refreshStats);
      window.removeEventListener('storage', refreshStats);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Intersection observer
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const s = stats;
  const today = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Property types use real data only.
  const realTypes = new Map((s?.propertyTypes || []).map(t => [t.property_type, Number(t.count)]));
  const typeEntries: [string, number][] = Array.from(realTypes.entries())
    .filter(([type, count]) => Boolean(type) && count > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxTypeCount = Math.max(...typeEntries.map(e => e[1]), 1);

  // AI features in the system
  const aiFeatures = [
    { key: 'ai_desc', icon: 'wand', en: 'AI Description Generator', vi: 'AI viết mô tả BĐS' },
    { key: 'ai_chat', icon: 'chat', en: 'AI Chat Assistant', vi: 'Trợ lý AI Chat' },
    { key: 'ai_inquiry', icon: 'chat', en: 'AI Inquiry Suggest', vi: 'AI gợi ý liên hệ BĐS' },
    { key: 'ai_contact', icon: 'wand', en: 'AI Contact Suggest', vi: 'AI gợi ý tin nhắn' },
    { key: 'ai_schedule', icon: 'wand', en: 'AI Schedule Suggest', vi: 'AI gợi ý lịch xem nhà' },
  ];

  const totalListings = s?.listings?.total ?? 0;
  const activeListings = s?.listings?.active ?? totalListings;
  const saleListings = s?.listings?.sale ?? 0;
  const rentListings = s?.listings?.rent ?? 0;
  const totalUsers = s?.users?.total ?? 0;
  const totalLikes = Math.max(0, (s?.likes?.total ?? 0) + localLikesDelta);
  const totalBlogPosts = s?.blogPosts ?? 0;
  const totalInquiries = s?.inquiries?.total ?? 0;
  const totalSchedules = s?.schedules?.total ?? 0;
  const totalMessages = s?.messages?.total ?? 0;
  const latestMemberName = s?.users?.latestName || localUserName
    || (totalUsers > 0 ? `${lang === 'vi' ? 'Thành viên' : 'Member'} #${totalUsers}` : (lang === 'vi' ? 'Chưa có thành viên' : 'No members yet'));

  const FORUM_STATS = {
    topics: totalListings + totalBlogPosts,
    posts: totalBlogPosts + totalInquiries + totalSchedules + totalMessages,
    members: totalUsers,
    latestMember: latestMemberName,
  };

  // Top-row stats — always show all
  const topStats: { icon: React.ReactNode; label: string; value: number; color: string }[] = [
    { icon: <Home className="w-4 h-4" />, label: lang === 'vi' ? 'Tổng BĐS' : 'Total Properties', value: activeListings, color: '#F6D37A' },
    { icon: <TrendingUp className="w-4 h-4" />, label: lang === 'vi' ? 'Đang bán' : 'For Sale', value: saleListings, color: '#34D399' },
    { icon: <Eye className="w-4 h-4" />, label: lang === 'vi' ? 'Cho thuê' : 'For Rent', value: rentListings, color: '#38BDF8' },
    { icon: <Users className="w-4 h-4" />, label: lang === 'vi' ? 'Thành viên' : 'Members', value: totalUsers, color: '#A78BFA' },
    { icon: <Heart className="w-4 h-4" />, label: lang === 'vi' ? 'Lượt thích' : 'Total Likes', value: totalLikes, color: '#F472B6' },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-10 relative"
      style={{ background: 'linear-gradient(180deg, #060611 0%, #0B0B17 40%, #060611 100%)' }}
    >
      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B88717]/20 to-[#F6D37A]/10 border border-[#B88717]/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#F6D37A]" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#F6D37A] leading-tight">
                {lang === 'vi' ? 'Thống kê nền tảng' : 'Platform Statistics'}
              </h2>
              <p className="text-[12px] text-[#7D8291]">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#F6D37A]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {lang === 'vi' ? 'Cập nhật tự động' : 'Auto-updated'}
          </div>
        </div>

        {/* ═══ Row 1: Public overview stats ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {topStats.map((item, i) => (
            <MiniStat key={i} icon={item.icon} label={item.label} value={item.value} color={item.color} animated={animated} delay={i * 0.05} />
          ))}
        </div>

        {/* ═══ Row 2: Detail cards ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Card 0: Forum Statistics ── */}
          <div className="bg-[#15151D]/80 rounded-2xl border border-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#F6D37A]" />
              <h3 className="text-[13px] font-semibold text-[#F6D37A] uppercase tracking-wider">
                {lang === 'vi' ? 'Thống kê diễn đàn' : 'Forum Statistics'}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3.5 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#F6D37A]">
                  <BarChart3 className="w-4 h-4 text-[#F6D37A]" />
                  {lang === 'vi' ? 'Chủ đề' : 'Topics'}
                </span>
                <span className="text-[24px] font-bold leading-none text-[#F6D37A]">
                  {animated ? <AnimatedNumber value={FORUM_STATS.topics} /> : 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3.5 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#F6D37A]">
                  <FileText className="w-4 h-4 text-[#F6D37A]" />
                  {lang === 'vi' ? 'Bài viết' : 'Posts'}
                </span>
                <span className="text-[24px] font-bold leading-none text-[#F6D37A]">
                  {animated ? <AnimatedNumber value={FORUM_STATS.posts} /> : 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3.5 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#F6D37A]">
                  <Users className="w-4 h-4 text-[#F6D37A]" />
                  {lang === 'vi' ? 'Thành viên' : 'Members'}
                </span>
                <span className="text-[24px] font-bold leading-none text-[#F6D37A]">
                  {animated ? <AnimatedNumber value={FORUM_STATS.members} /> : 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/[0.055] px-3.5 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#F6D37A]">
                  <UserPlus className="w-4 h-4 text-[#F6D37A]" />
                  {lang === 'vi' ? 'Thành viên mới nhất' : 'Latest member'}
                </span>
                <span className="max-w-[150px] truncate text-right text-[21px] font-bold leading-none text-[#F6D37A]">
                  {FORUM_STATS.latestMember}
                </span>
              </div>
            </div>
          </div>

          {/* ── Card 1: Property Types Chart ── */}
          <div className="bg-[#15151D]/80 rounded-2xl border border-white/[0.06] p-5 backdrop-blur-sm">
            <h3 className="text-[13px] font-semibold text-[#F6D37A] uppercase tracking-wider mb-4">
              {lang === 'vi' ? 'Loại bất động sản' : 'Property Types'}
            </h3>
            {typeEntries.length > 0 ? (
              <>
                <div className="space-y-3">
                  {typeEntries.map(([type, count]) => {
                    const pct = (count / maxTypeCount) * 100;
                    const color = typeColors[type] || '#A7ABB6';
                    const label = typeLabels[type]?.[lang] || type;
                    const icon = typeIcons[type] || <Home className="w-3.5 h-3.5" />;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 text-[12px] text-[#F6D37A]">
                            <span style={{ color }}>{icon}</span>
                            {label}
                          </span>
                          <span className="text-[14px] font-bold text-[#F6D37A]">
                            {animated ? <AnimatedNumber value={count} /> : 0}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: animated ? `${pct}%` : '0%',
                              background: `linear-gradient(90deg, ${color}88, ${color})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.06]">
                  {typeEntries.map(([type]) => {
                    const color = typeColors[type] || '#A7ABB6';
                    const label = typeLabels[type]?.[lang] || type;
                    return (
                      <span key={type} className="flex items-center gap-1.5 text-[11px] text-[#F6D37A]">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-[13px] text-[#7D8291] py-6 text-center">
                {lang === 'vi' ? 'Chưa có dữ liệu' : 'No data available'}
              </div>
            )}
          </div>

          {/* ── Card 2: AI Features ── */}
          <div className="bg-[#15151D]/80 rounded-2xl border border-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <AiBrainIcon className="w-5 h-5 text-violet-400" />
              <h3 className="text-[13px] font-semibold text-[#F6D37A] uppercase tracking-wider">
                {lang === 'vi' ? 'Tính năng AI' : 'AI Features'}
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-md bg-violet-500/15 text-[13px] font-bold text-violet-400">
                {aiFeatures.length}
              </span>
            </div>
            <div className="space-y-2">
              {aiFeatures.map((f, i) => (
                <div
                  key={f.key}
                  className="flex items-center gap-2.5 bg-white/[0.02] rounded-lg border border-white/[0.06] px-3 py-2.5"
                  style={{
                    opacity: animated ? 1 : 0,
                    transform: animated ? 'translateX(0)' : 'translateX(-8px)',
                    transition: `all 0.5s ease ${0.3 + i * 0.1}s`,
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    {f.icon === 'wand' ? <AiWandIcon className="w-4 h-4 text-violet-400" /> : <AiChatIcon className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[#F6D37A] truncate">{lang === 'vi' ? f.vi : f.en}</div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
