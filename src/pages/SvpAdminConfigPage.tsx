import { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, EyeOff, Loader2, Plus, RefreshCcw, Save, Settings2 } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpConfigOption } from '../types/svp';
import { toSlugValue } from '../utils/svpDisplay';

interface DraftOption {
  label: string;
  value: string;
  score: string;
  sortOrder: string;
}

const initialDraft: DraftOption = {
  label: '',
  value: '',
  score: '',
  sortOrder: '',
};

const groupHints: Record<string, string> = {
  company_units: 'Các công ty/đội nhóm thành viên. Dùng cho bộ lọc và phân quyền nội bộ.',
  property_tags: 'Đặc điểm nhà có cấu trúc để sau này search AI và lọc nhanh.',
  property_statuses: 'Trạng thái hồ sơ nhà, timeline và báo cáo KPI.',
  visibility_levels: 'Nhóm được phép xem thông tin nhà hoặc số điện thoại chủ nhà.',
  signing_criteria: 'Tiêu chí tính điểm ký nhà và cảnh báo rủi ro hợp đồng.',
  price_segments: 'Phân khúc giá để lọc nhanh, thống kê và gợi ý khách.',
  customer_statuses: 'Trạng thái chăm sóc khách và nhu cầu mua.',
};

const SvpAdminConfigPage = () => {
  usePageTitle('Cấu hình nội bộ');
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState('company_units');
  const [draft, setDraft] = useState<DraftOption>(initialDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextGroups = await svpApi.getConfig();
      setGroups(nextGroups);
      setActiveGroupId((currentGroupId) => (
        nextGroups.length > 0 && !nextGroups.some((group) => group.id === currentGroupId)
          ? nextGroups[0].id
          : currentGroupId
      ));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được cấu hình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || groups[0],
    [activeGroupId, groups],
  );

  const rows = useMemo(
    () => [...(activeGroup?.options || [])].sort((first, second) => first.sortOrder - second.sortOrder),
    [activeGroup],
  );

  const refreshGroup = useCallback((item: SvpConfigOption) => {
    setGroups((current) => current.map((group) => (
      group.id === item.groupId
        ? {
            ...group,
            options: group.options.some((option) => option.id === item.id)
              ? group.options.map((option) => (option.id === item.id ? item : option))
              : [...group.options, item],
          }
        : group
    )));
  }, []);

  const handleDraftLabel = (label: string) => {
    setDraft((current) => ({
      ...current,
      label,
      value: current.value || toSlugValue(label),
    }));
  };

  const handleCreate = async () => {
    if (!activeGroup || !draft.label.trim()) {
      setError('Nhập tên lựa chọn trước khi lưu');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const next = await svpApi.createConfigOption({
        groupId: activeGroup.id,
        label: draft.label.trim(),
        value: draft.value.trim() || toSlugValue(draft.label),
        score: draft.score.trim() ? Number(draft.score) : null,
        metadata: null,
        sortOrder: draft.sortOrder.trim() ? Number(draft.sortOrder) : (rows.length + 1) * 10,
        isActive: true,
      });
      refreshGroup(next);
      setDraft(initialDraft);
      setMessage('Đã thêm lựa chọn mới');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không thêm được lựa chọn');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = useCallback(async (option: SvpConfigOption) => {
    setSavingId(option.id);
    setError('');
    setMessage('');
    try {
      const next = await svpApi.updateConfigOption(option.id, { isActive: !option.isActive });
      refreshGroup(next);
      setMessage(next.isActive ? 'Đã bật lại lựa chọn' : 'Đã tạm ẩn lựa chọn');
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Không cập nhật được lựa chọn');
    } finally {
      setSavingId(null);
    }
  }, [refreshGroup]);

  const columns = useMemo<ColumnDef<SvpConfigOption>[]>(() => [
    {
      header: 'Thứ tự',
      accessorKey: 'sortOrder',
      cell: ({ row }) => <span className="text-[#C7CBD6]">{row.original.sortOrder}</span>,
    },
    {
      header: 'Tên hiển thị',
      accessorKey: 'label',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-[#F5F0E6]">{row.original.label}</div>
          <div className="mt-1 text-[12px] text-[#8A8F98]">{row.original.value}</div>
        </div>
      ),
    },
    {
      header: 'Điểm',
      accessorKey: 'score',
      cell: ({ row }) => <span className="text-[#C7CBD6]">{row.original.score ?? '-'}</span>,
    },
    {
      header: 'Trạng thái',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
          row.original.isActive
            ? 'bg-emerald-400/10 text-emerald-200'
            : 'bg-white/[0.06] text-[#8A8F98]'
        }`}>
          {row.original.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {row.original.isActive ? 'Đang dùng' : 'Đã ẩn'}
        </span>
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => void handleToggle(row.original)}
          disabled={savingId === row.original.id}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#F5F0E6] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A] disabled:cursor-wait disabled:opacity-60"
        >
          {savingId === row.original.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
          {row.original.isActive ? 'Ẩn' : 'Bật'}
        </button>
      ),
    },
  ], [handleToggle, savingId]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell maxWidth="max-w-[1320px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <Settings2 className="h-4 w-4" />
              Thiết lập dữ liệu
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Cấu hình dữ liệu Sổ Đỏ Vạn Phúc</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Quản trị các lựa chọn dùng lại trong form đăng nhà, bộ lọc, điểm ký nhà, KPI và search AI.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadConfig()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-bold text-[#101114] transition-colors hover:bg-[#FFE8A3]"
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
        </section>

        {(message || error) && (
          <div className={`rounded-md border px-4 py-3 text-[14px] ${
            error
              ? 'border-red-400/30 bg-red-500/10 text-red-100'
              : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
          }`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-white/10 bg-[#08090C] p-3">
            <div className="px-2 pb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8A8F98]">Nhóm cấu hình</div>
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
                    activeGroup?.id === group.id
                      ? 'bg-[#F6D37A] text-[#101114]'
                      : 'bg-white/[0.035] text-[#D7DAE3] hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="text-[14px] font-bold">{group.name}</div>
                  <div className={`mt-1 text-[12px] ${activeGroup?.id === group.id ? 'text-[#37342B]' : 'text-[#8A8F98]'}`}>
                    {group.options.length} lựa chọn
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-white/10 bg-[#08090C]">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#F5F0E6]">{activeGroup?.name || 'Đang tải...'}</h2>
                  <p className="mt-1 text-[13px] leading-6 text-[#A7ABB6]">
                    {activeGroup ? groupHints[activeGroup.id] || activeGroup.description || 'Cấu hình dùng chung cho hệ thống.' : 'Đang tải dữ liệu.'}
                  </p>
                </div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-[#A7ABB6]">
                  {rows.filter((item) => item.isActive).length}/{rows.length} đang dùng
                </span>
              </div>
            </div>

            <div className="grid gap-4 border-b border-white/10 p-5 md:grid-cols-[1fr_180px_120px_120px_auto]">
              <input
                value={draft.label}
                onChange={(event) => handleDraftLabel(event.target.value)}
                placeholder="Tên lựa chọn mới"
                className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
              <input
                value={draft.value}
                onChange={(event) => setDraft((current) => ({ ...current, value: toSlugValue(event.target.value) }))}
                placeholder="ma_lua_chon"
                className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
              <input
                value={draft.score}
                onChange={(event) => setDraft((current) => ({ ...current, score: event.target.value }))}
                inputMode="numeric"
                placeholder="Điểm"
                className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
              <input
                value={draft.sortOrder}
                onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                inputMode="numeric"
                placeholder="Thứ tự"
                className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-bold text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Thêm
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-white/10">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-5 py-3 text-left text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A8F98]">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} className="px-5 py-12 text-center text-[#A7ABB6]">
                        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#F6D37A]" />
                        Đang tải cấu hình...
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-5 py-12 text-center text-[#A7ABB6]">
                        Chưa có lựa chọn nào trong nhóm này.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-white/[0.06] last:border-0">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-4 align-middle text-[14px]">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-[#F6D37A]/20 bg-[#F6D37A]/8 p-5">
          <div className="flex items-start gap-3">
            <Save className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F6D37A]" />
            <p className="text-[13px] leading-6 text-[#D7DAE3]">
              Mỗi lựa chọn mới sẽ được dùng ngay trong form đăng nhà và bộ lọc. Thay đổi được lưu lại để đội vận hành dùng thống nhất trên toàn hệ thống.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default SvpAdminConfigPage;
