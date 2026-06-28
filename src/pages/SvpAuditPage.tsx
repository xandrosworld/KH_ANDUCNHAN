import { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2, RefreshCcw, Search } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpAuditLog } from '../types/svp';
import { formatDateTime } from '../utils/svpDisplay';

const SvpAuditPage = () => {
  usePageTitle('Audit log');
  const [logs, setLogs] = useState<SvpAuditLog[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await svpApi.listAuditLogs();
      setLogs(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được audit log');
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

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return logs;
    return logs.filter((log) => [
      log.action,
      log.entityType,
      log.entityId,
      log.actorId,
      JSON.stringify(log.newValue || {}),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery));
  }, [logs, query]);

  return (
    <PageShell maxWidth="max-w-[1280px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <Activity className="h-4 w-4" />
              Event log
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Audit log hệ thống</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Ghi lại hành động tạo/sửa nhà, khách, nhu cầu, lịch xem, referral và media để AI/KPI truy vết về sau.
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

        <label className="relative block rounded-lg border border-white/10 bg-[#08090C] p-4">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F98]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo action, entity, id, nội dung..."
            className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
          />
        </label>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-white/10 bg-[#08090C]">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-[#A7ABB6]">
              <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
              Đăng tai audit log...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-5 py-16 text-center text-[#A7ABB6]">Chưa có log phù hợp.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredLogs.map((log) => (
                <article key={log.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F6D37A]/10 px-3 py-1 text-[12px] font-black text-[#F6D37A]">{log.action}</span>
                      <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-[#D7DAE3]">{log.entityType}</span>
                      <span className="text-[13px] text-[#8A8F98]">{log.entityId || '-'}</span>
                    </div>
                    <span className="text-[12px] text-[#8A8F98]">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <JsonBox title="Old" value={log.oldValue} />
                    <JsonBox title="New" value={log.newValue} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

interface JsonBoxProps {
  title: string;
  value?: Record<string, unknown> | null;
}

const JsonBox = ({ title, value }: JsonBoxProps) => (
  <div className="min-w-0 rounded-md border border-white/10 bg-black/25 p-3">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">{title}</div>
    <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words text-[12px] leading-5 text-[#D7DAE3]">
      {value ? JSON.stringify(value, null, 2) : '-'}
    </pre>
  </div>
);

export default SvpAuditPage;
