import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarClock, Home, Loader2, RefreshCcw, Target, TrendingUp, UsersRound } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpCustomer, SvpCustomerNeed, SvpProperty, SvpViewingSchedule } from '../types/svp';
import { formatDateTime, formatVnd, optionLabel } from '../utils/svpDisplay';

const SvpDashboardPage = () => {
  usePageTitle('Tổng quan');
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [properties, setProperties] = useState<SvpProperty[]>([]);
  const [customers, setCustomers] = useState<SvpCustomer[]>([]);
  const [needs, setNeeds] = useState<SvpCustomerNeed[]>([]);
  const [viewings, setViewings] = useState<SvpViewingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGroups, propertyResult, customerResult, needResult, viewingResult] = await Promise.all([
        svpApi.getConfig(),
        svpApi.listProperties(),
        svpApi.listCustomers(),
        svpApi.listCustomerNeeds(),
        svpApi.listViewingSchedules(),
      ]);
      setGroups(nextGroups);
      setProperties(propertyResult.items);
      setCustomers(customerResult.items);
      setNeeds(needResult.items);
      setViewings(viewingResult.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const totalInventoryValue = useMemo(
    () => properties.reduce((total, property) => total + Number(property.price || 0), 0),
    [properties],
  );
  const activeProperties = properties.filter((property) => {
    const status = optionLabel(groups, 'property_statuses', property.statusId).toLowerCase();
    return status.includes('dang') || status.includes('moi') || status.includes('active') || status.includes('new');
  });
  const depositProperties = properties.filter((property) => optionLabel(groups, 'property_statuses', property.statusId).toLowerCase().includes('coc'));
  const todayViewings = viewings.filter((viewing) => (viewing.scheduledAt || '').slice(0, 10) === todayKey);
  const upcomingViewings = viewings
    .filter((viewing) => viewing.scheduledAt && new Date(viewing.scheduledAt) >= new Date())
    .slice(0, 6);

  const statusRows = useMemo(() => {
    const rows = new Map<string, number>();
    properties.forEach((property) => {
      const label = optionLabel(groups, 'property_statuses', property.statusId);
      rows.set(label, (rows.get(label) || 0) + 1);
    });
    return [...rows.entries()].sort((a, b) => b[1] - a[1]);
  }, [groups, properties]);

  const tagRows = useMemo(() => {
    const rows = new Map<string, number>();
    properties.forEach((property) => {
      property.tagIds.forEach((tagId) => {
        const label = optionLabel(groups, 'property_tags', tagId);
        rows.set(label, (rows.get(label) || 0) + 1);
      });
    });
    return [...rows.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [groups, properties]);

  return (
    <PageShell maxWidth="max-w-[1400px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <BarChart3 className="h-4 w-4" />
              KPI nội bộ
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Tổng quan điều hành</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Theo dõi nguồn nhà, khách, nhu cầu, lịch xem và trạng thái để giảm phụ thuộc Excel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-[14px] font-bold text-[#D7DAE3] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
        </section>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-white/10 bg-[#08090C] text-[#A7ABB6]">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
            Đang tải KPI...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Home} label="Nguồn nhà" value={properties.length} hint={`${activeProperties.length} đang xử lý`} />
              <MetricCard icon={UsersRound} label="Khách hàng" value={customers.length} hint={`${needs.length} nhu cầu mua`} />
              <MetricCard icon={CalendarClock} label="Lịch xem hôm nay" value={todayViewings.length} hint={`${viewings.length} tổng lịch`} />
              <MetricCard icon={TrendingUp} label="Tổng giá trị nguồn" value={formatVnd(totalInventoryValue)} hint={`${depositProperties.length} nhà đã cọc`} />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
                  <BarChart3 className="h-5 w-5 text-[#F6D37A]" />
                  Trạng thái nguồn nhà
                </h2>
                <div className="space-y-3">
                  {statusRows.length === 0 ? (
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] text-[#A7ABB6]">Chưa có nhà để thống kê.</div>
                  ) : statusRows.map(([label, count]) => (
                    <ProgressRow key={label} label={label} count={count} max={properties.length || 1} />
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
                  <Target className="h-5 w-5 text-[#F6D37A]" />
                  Tag nổi bật
                </h2>
                <div className="space-y-3">
                  {tagRows.length === 0 ? (
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] text-[#A7ABB6]">Chưa có tag nào được gắn.</div>
                  ) : tagRows.map(([label, count]) => (
                    <ProgressRow key={label} label={label} count={count} max={properties.length || 1} />
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
                <CalendarClock className="h-5 w-5 text-[#F6D37A]" />
                Lịch xem sắp tới
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {upcomingViewings.length === 0 ? (
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-[14px] text-[#A7ABB6]">Chưa có lịch xem sắp tới.</div>
                ) : upcomingViewings.map((viewing) => (
                  <article key={viewing.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                    <div className="font-bold text-[#F5F0E6]">{formatDateTime(viewing.scheduledAt)}</div>
                    <div className="mt-2 text-[13px] text-[#A7ABB6]">Khách: {customers.find((customer) => customer.id === viewing.customerId)?.fullName || '-'}</div>
                    <div className="mt-1 text-[13px] text-[#A7ABB6]">Nhà: {viewing.propertyId || '-'}</div>
                    {viewing.note ? <div className="mt-3 text-[13px] leading-6 text-[#D7DAE3]">{viewing.note}</div> : null}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
};

interface MetricCardProps {
  icon: typeof Home;
  label: string;
  value: string | number;
  hint: string;
}

const MetricCard = ({ icon: Icon, label, value, hint }: MetricCardProps) => (
  <article className="rounded-lg border border-white/10 bg-[#08090C] p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[13px] font-bold text-[#A7ABB6]">{label}</div>
        <div className="mt-3 text-3xl font-black text-[#F5F0E6]">{value}</div>
        <div className="mt-2 text-[13px] text-[#8A8F98]">{hint}</div>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#F6D37A]/10 text-[#F6D37A]">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </article>
);

interface ProgressRowProps {
  label: string;
  count: number;
  max: number;
}

const ProgressRow = ({ label, count, max }: ProgressRowProps) => {
  const width = Math.max(4, Math.min(100, (count / max) * 100));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
        <span className="font-semibold text-[#D7DAE3]">{label}</span>
        <span className="text-[#A7ABB6]">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-[#F6D37A]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

export default SvpDashboardPage;
