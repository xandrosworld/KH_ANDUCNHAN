import { useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpRight, Home, Loader2, MapPin, Phone, Plus, RefreshCcw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpProperty } from '../types/svp';
import { formatDateTime, formatVnd, optionLabel, optionLabels } from '../utils/svpDisplay';

const SvpPropertiesPage = () => {
  usePageTitle('BÍ KÍP TỔNG');
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [properties, setProperties] = useState<SvpProperty[]>([]);
  const [query, setQuery] = useState('');
  const [statusId, setStatusId] = useState('');
  const [tagId, setTagId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGroups, result] = await Promise.all([
        svpApi.getConfig(),
        svpApi.listProperties(),
      ]);
      setGroups(nextGroups);
      setProperties(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách nhà');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const statusOptions = useMemo(
    () => groups.find((group) => group.id === 'property_statuses')?.options.filter((option) => option.isActive) || [],
    [groups],
  );
  const tagOptions = useMemo(
    () => groups.find((group) => group.id === 'property_tags')?.options.filter((option) => option.isActive) || [],
    [groups],
  );

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return properties.filter((property) => {
      const text = [
        property.code,
        property.title,
        property.ownerName,
        property.ownerPhone,
        property.district,
        property.ward,
        property.address,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesStatus = !statusId || property.statusId === statusId;
      const matchesTag = !tagId || property.tagIds.includes(tagId);
      return matchesQuery && matchesStatus && matchesTag;
    });
  }, [properties, query, statusId, tagId]);

  const columns = useMemo<ColumnDef<SvpProperty>[]>(() => [
    {
      header: 'Mã nhà',
      accessorKey: 'code',
      cell: ({ row }) => (
        <Link to={`/nha/${row.original.id}`} className="font-black text-[#F6D37A] hover:text-[#FFE8A3]">
          {row.original.code}
        </Link>
      ),
    },
    {
      header: 'Thông tin nhà',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="min-w-[260px]">
          <Link to={`/nha/${row.original.id}`} className="font-semibold text-[#F5F0E6] hover:text-[#F6D37A]">
            {row.original.title || 'Chưa có tiêu đề'}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8A8F98]">
            <span>{formatVnd(row.original.price)}</span>
            {row.original.areaM2 ? <span>{row.original.areaM2} m2</span> : null}
            <span>{optionLabel(groups, 'company_units', row.original.companyUnitId)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Khu vực',
      id: 'location',
      cell: ({ row }) => (
        <div className="min-w-[180px] text-[#D7DAE3]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#F6D37A]" />
            {row.original.district || '-'}
          </div>
          <div className="mt-1 text-[12px] text-[#8A8F98]">{row.original.ward || row.original.address || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'statusId',
      cell: ({ row }) => (
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-semibold text-[#D7DAE3]">
          {optionLabel(groups, 'property_statuses', row.original.statusId)}
        </span>
      ),
    },
    {
      header: 'Tag',
      accessorKey: 'tagIds',
      cell: ({ row }) => {
        const labels = optionLabels(groups, 'property_tags', row.original.tagIds).slice(0, 3);
        return (
          <div className="flex min-w-[190px] flex-wrap gap-1.5">
            {labels.length > 0 ? labels.map((label) => (
              <span key={label} className="rounded-full bg-[#F6D37A]/10 px-2 py-1 text-[11px] font-semibold text-[#F6D37A]">
                {label}
              </span>
            )) : <span className="text-[#8A8F98]">-</span>}
          </div>
        );
      },
    },
    {
      header: 'Cập nhật',
      accessorKey: 'updatedAt',
      cell: ({ row }) => <span className="text-[12px] text-[#8A8F98]">{formatDateTime(row.original.updatedAt || row.original.createdAt)}</span>,
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <Link
          to={`/nha/${row.original.id}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-[#F5F0E6] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
        >
          Xem
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      ),
    },
  ], [groups]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredProperties,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageShell maxWidth="max-w-[1400px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <Home className="h-4 w-4" />
              NHÀ CHÍNH CHỦ
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">BÍ KÍP TỔNG</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Quản lý nguồn nhà, trạng thái, tag, timeline và dữ liệu cấu trúc để sau này dùng chung cho web, app, dashboard và AI.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-[14px] font-bold text-[#D7DAE3] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
            <Link
              to="/post-property"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3]"
            >
              <Plus className="h-4 w-4" />
              Đăng nhà
            </Link>
          </div>
        </section>

        <section className="grid gap-3 rounded-lg border border-white/10 bg-[#08090C] p-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F98]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã nhà, tên chủ, SĐT, khu vực..."
              className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
            />
          </label>
          <select
            value={statusId}
            onChange={(event) => setStatusId(event.target.value)}
            className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <select
            value={tagId}
            onChange={(event) => setTagId(event.target.value)}
            className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
          >
            <option value="">Tất cả đặc điểm</option>
            {tagOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <div className="flex min-h-11 items-center rounded-md bg-white/[0.04] px-3 text-[13px] font-semibold text-[#D7DAE3]">
            {filteredProperties.length}/{properties.length} nhà
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        <section className="space-y-3 lg:hidden">
          {loading ? (
            <div className="rounded-lg border border-white/10 bg-[#08090C] px-4 py-12 text-center text-[#A7ABB6]">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
              Đang tải danh sách nhà...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-[#08090C] px-4 py-10 text-center">
              <div className="text-lg font-bold text-[#F5F0E6]">Chưa có nhà phù hợp</div>
              <p className="mt-2 text-[14px] leading-6 text-[#A7ABB6]">Tạo nhà đầu tiên hoặc đổi bộ lọc để xem dữ liệu khác.</p>
              <Link to="/post-property" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114]">
                <Plus className="h-4 w-4" />
                Đăng nhà đầu tiên
              </Link>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const tags = optionLabels(groups, 'property_tags', property.tagIds).slice(0, 4);
              return (
                <article key={property.id} className="rounded-lg border border-white/10 bg-[#08090C] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/nha/${property.id}`} className="text-[15px] font-bold leading-6 text-[#F5F0E6] hover:text-[#F6D37A]">
                        {property.title || 'Chưa có tiêu đề'}
                      </Link>
                      <div className="mt-1 text-[12px] font-black text-[#F6D37A]">{property.code}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#D7DAE3]">
                      {optionLabel(groups, 'property_statuses', property.statusId)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-white/[0.035] p-3 text-[13px]">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#8A8F98]">Giá</div>
                      <div className="mt-1 font-black text-[#F5F0E6]">{formatVnd(property.price)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[#8A8F98]">Diện tích</div>
                      <div className="mt-1 font-black text-[#F5F0E6]">{property.areaM2 ? `${property.areaM2} m2` : '-'}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-[13px] text-[#D7DAE3]">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F6D37A]" />
                      <span>{[property.address, property.ward, property.district].filter(Boolean).join(', ') || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-[#F6D37A]" />
                      <span>{property.ownerName || 'Chủ nhà'} - {property.ownerPhone || 'Chưa có SĐT'}</span>
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tags.map((label) => (
                        <span key={label} className="rounded-full bg-[#F6D37A]/10 px-2 py-1 text-[11px] font-semibold text-[#F6D37A]">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    to={`/nha/${property.id}`}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 text-[13px] font-bold text-[#F5F0E6] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
                  >
                    Xem chi tiết
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })
          )}
        </section>

        <section className="hidden overflow-hidden rounded-lg border border-white/10 bg-[#08090C] lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse">
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
                    <td colSpan={columns.length} className="px-5 py-16 text-center text-[#A7ABB6]">
                      <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
                      Đang tải danh sách nhà...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-16 text-center">
                      <div className="text-lg font-bold text-[#F5F0E6]">Chưa có nhà phù hợp</div>
                      <p className="mt-2 text-[14px] text-[#A7ABB6]">Tạo nhà đầu tiên hoặc đổi bộ lọc để xem dữ liệu khác.</p>
                      <Link to="/post-property" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114]">
                        <Plus className="h-4 w-4" />
                        Đăng nhà đầu tiên
                      </Link>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]">
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
    </PageShell>
  );
};

export default SvpPropertiesPage;
