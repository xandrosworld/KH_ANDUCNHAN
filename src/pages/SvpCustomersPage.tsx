import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, Mail, Phone, Plus, RefreshCcw, Target, UserPlus } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpConfigGroup, SvpCustomer, SvpCustomerNeed, SvpViewingSchedule } from '../types/svp';
import { activeOptions, formatDateTime, formatVnd, optionLabel } from '../utils/svpDisplay';

interface CustomerDraft {
  fullName: string;
  phone: string;
  email: string;
  source: string;
  statusId: string;
  note: string;
}

const emptyCustomer: CustomerDraft = {
  fullName: '',
  phone: '',
  email: '',
  source: '',
  statusId: '',
  note: '',
};

interface NeedDraft {
  customerId: string;
  districts: string;
  budgetMin: string;
  budgetMax: string;
  areaMin: string;
  areaMax: string;
  description: string;
}

const emptyNeed: NeedDraft = {
  customerId: '',
  districts: '',
  budgetMin: '',
  budgetMax: '',
  areaMin: '',
  areaMax: '',
  description: '',
};

interface ViewingDraft {
  customerId: string;
  propertyId: string;
  scheduledAt: string;
  note: string;
}

const emptyViewing: ViewingDraft = {
  customerId: '',
  propertyId: '',
  scheduledAt: '',
  note: '',
};

const SvpCustomersPage = () => {
  usePageTitle('Khách hàng');
  const [groups, setGroups] = useState<SvpConfigGroup[]>([]);
  const [customers, setCustomers] = useState<SvpCustomer[]>([]);
  const [needs, setNeeds] = useState<SvpCustomerNeed[]>([]);
  const [viewings, setViewings] = useState<SvpViewingSchedule[]>([]);
  const [draft, setDraft] = useState<CustomerDraft>(emptyCustomer);
  const [needDraft, setNeedDraft] = useState<NeedDraft>(emptyNeed);
  const [viewingDraft, setViewingDraft] = useState<ViewingDraft>(emptyViewing);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNeed, setSavingNeed] = useState(false);
  const [savingViewing, setSavingViewing] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGroups, result] = await Promise.all([
        svpApi.getConfig(),
        svpApi.listCustomers(),
      ]);
      const [needResult, viewingResult] = await Promise.all([
        svpApi.listCustomerNeeds(),
        svpApi.listViewingSchedules(),
      ]);
      const defaultStatus = activeOptions(nextGroups, 'customer_statuses')[0]?.id || '';
      setGroups(nextGroups);
      setCustomers(result.items);
      setNeeds(needResult.items);
      setViewings(viewingResult.items);
      setDraft((current) => ({ ...current, statusId: current.statusId || defaultStatus }));
      const firstCustomerId = result.items[0]?.id || '';
      setNeedDraft((current) => ({ ...current, customerId: current.customerId || firstCustomerId }));
      setViewingDraft((current) => ({ ...current, customerId: current.customerId || firstCustomerId }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được khách hàng');
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

  const statusOptions = useMemo(() => activeOptions(groups, 'customer_statuses'), [groups]);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) => [
      customer.fullName,
      customer.phone,
      customer.email,
      customer.source,
      customer.note,
    ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery));
  }, [customers, query]);

  const updateDraft = (field: keyof CustomerDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateNeedDraft = (field: keyof NeedDraft, value: string) => {
    setNeedDraft((current) => ({ ...current, [field]: value }));
  };

  const updateViewingDraft = (field: keyof ViewingDraft, value: string) => {
    setViewingDraft((current) => ({ ...current, [field]: value }));
  };

  const customerName = (id?: string | null) => customers.find((customer) => customer.id === id)?.fullName || '-';

  const handleCreate = async () => {
    if (!draft.fullName.trim() || !draft.phone.trim()) {
      setError('Nhàp ten va so dien thoai khach truoc khi luu');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await svpApi.createCustomer({
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        source: draft.source.trim(),
        statusId: draft.statusId,
        note: draft.note.trim(),
      });
      setCustomers((current) => [created, ...current]);
      setDraft((current) => ({ ...emptyCustomer, statusId: current.statusId }));
      setNeedDraft((current) => ({ ...current, customerId: current.customerId || created.id }));
      setViewingDraft((current) => ({ ...current, customerId: current.customerId || created.id }));
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không lưu được khách hàng');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNeed = async () => {
    if (!needDraft.customerId) {
      setError('Chọn khách trước khi lưu nhu cầu');
      return;
    }

    setSavingNeed(true);
    setError('');
    try {
      const created = await svpApi.createCustomerNeed({
        customerId: needDraft.customerId,
        districtIds: needDraft.districts.split(',').map((item) => item.trim()).filter(Boolean),
        budgetMin: needDraft.budgetMin ? Number(needDraft.budgetMin) : null,
        budgetMax: needDraft.budgetMax ? Number(needDraft.budgetMax) : null,
        areaMin: needDraft.areaMin ? Number(needDraft.areaMin) : null,
        areaMax: needDraft.areaMax ? Number(needDraft.areaMax) : null,
        tagIds: [],
        description: needDraft.description.trim(),
        statusId: 'new',
      });
      setNeeds((current) => [created, ...current]);
      setNeedDraft((current) => ({ ...emptyNeed, customerId: current.customerId }));
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không lưu được nhu cầu');
    } finally {
      setSavingNeed(false);
    }
  };

  const handleCreateViewing = async () => {
    if (!viewingDraft.customerId || !viewingDraft.scheduledAt) {
      setError('Chọn khách và thời gian xem nhà');
      return;
    }

    setSavingViewing(true);
    setError('');
    try {
      const created = await svpApi.createViewingSchedule({
        customerId: viewingDraft.customerId,
        propertyId: viewingDraft.propertyId.trim(),
        scheduledAt: viewingDraft.scheduledAt,
        status: 'pending',
        note: viewingDraft.note.trim(),
      });
      setViewings((current) => [created, ...current]);
      setViewingDraft((current) => ({ ...emptyViewing, customerId: current.customerId }));
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không lưu được lịch xem');
    } finally {
      setSavingViewing(false);
    }
  };

  return (
    <PageShell maxWidth="max-w-[1280px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <UserPlus className="h-4 w-4" />
              CRM nội bộ
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Khách hàng và nhu cầu mua</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Lưu khách mới, nguồn đến, trạng thái chăm sóc và ghi chú. Các bảng nhu cầu mua, lịch xem, giao dịch đã có trong schema để nối tiếp.
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

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
            <h2 className="mb-4 text-lg font-bold text-[#F5F0E6]">Thêm khách mới</h2>
            <div className="space-y-3">
              <Field label="Họ tên" value={draft.fullName} onChange={(value) => updateDraft('fullName', value)} placeholder="Tên khách hàng" />
              <Field label="Số điện thoại" value={draft.phone} onChange={(value) => updateDraft('phone', value)} placeholder="Số liên hệ chính" />
              <Field label="Email" value={draft.email} onChange={(value) => updateDraft('email', value)} placeholder="nếu có" />
              <Field label="Nguồn" value={draft.source} onChange={(value) => updateDraft('source', value)} placeholder="Zalo, Facebook, giới thiệu..." />
              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Trạng thái</span>
                <select
                  value={draft.statusId}
                  onChange={(event) => updateDraft('statusId', event.target.value)}
                  className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
                >
                  {statusOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Ghi chú</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => updateDraft('note', event.target.value)}
                  rows={4}
                  placeholder="Nhu cầu, ngân sách, khu vực, lịch hẹn..."
                  className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Lưu khách hàng
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#08090C]">
            <div className="border-b border-white/10 p-5">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, SĐT, email, nguồn, ghi chú..."
                className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
            </div>
            <div className="divide-y divide-white/[0.06]">
              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-[#A7ABB6]">
                  <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
                  Đăng tai khach hang...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="text-lg font-bold text-[#F5F0E6]">Chưa có khách phù hợp</div>
                  <p className="mt-2 text-[14px] text-[#A7ABB6]">Thêm khách mới hoặc đổi từ khóa tìm kiếm.</p>
                </div>
              ) : filteredCustomers.map((customer) => (
                <article key={customer.id} className="p-5 transition-colors hover:bg-white/[0.025]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-lg font-bold text-[#F5F0E6]">{customer.fullName}</div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#A7ABB6]">
                        <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#F6D37A]" />{customer.phone}</span>
                        {customer.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#F6D37A]" />{customer.email}</span> : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-[#D7DAE3]">
                      {optionLabel(groups, 'customer_statuses', customer.statusId)}
                    </span>
                  </div>
                  <div className="mt-3 text-[13px] text-[#8A8F98]">
                    Nguồn: {customer.source || '-'} · Tạo: {formatDateTime(customer.createdAt)}
                  </div>
                  {customer.note ? <div className="mt-3 rounded-md bg-white/[0.035] px-3 py-2 text-[13px] leading-6 text-[#D7DAE3]">{customer.note}</div> : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
              <Target className="h-5 w-5 text-[#F6D37A]" />
              Nhu cầu mua
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectCustomer customers={customers} value={needDraft.customerId} onChange={(value) => updateNeedDraft('customerId', value)} />
              <Field label="Khu vực" value={needDraft.districts} onChange={(value) => updateNeedDraft('districts', value)} placeholder="Bình Thạnh, Gò Vấp..." />
              <Field label="Ngân sách từ" value={needDraft.budgetMin} onChange={(value) => updateNeedDraft('budgetMin', value)} placeholder="5000000000" />
              <Field label="Den" value={needDraft.budgetMax} onChange={(value) => updateNeedDraft('budgetMax', value)} placeholder="7000000000" />
              <Field label="Diện tích từ" value={needDraft.areaMin} onChange={(value) => updateNeedDraft('areaMin', value)} placeholder="50" />
              <Field label="Den" value={needDraft.areaMax} onChange={(value) => updateNeedDraft('areaMax', value)} placeholder="90" />
            </div>
            <label className="mt-3 block">
              <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Mô tả nhu cầu</span>
              <textarea
                value={needDraft.description}
                onChange={(event) => updateNeedDraft('description', event.target.value)}
                rows={3}
                placeholder="VD: Cần nhà ô tô ngủ, gần metro, mở spa được..."
                className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreateNeed()}
              disabled={savingNeed || customers.length === 0}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
            >
              {savingNeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Lưu nhu cầu
            </button>
            <div className="mt-5 space-y-3">
              {needs.slice(0, 6).map((need) => (
                <article key={need.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-bold text-[#F5F0E6]">{customerName(need.customerId)}</div>
                    <div className="text-[12px] text-[#8A8F98]">{formatDateTime(need.createdAt)}</div>
                  </div>
                  <div className="mt-2 text-[13px] text-[#D7DAE3]">
                    {formatVnd(need.budgetMin)} - {formatVnd(need.budgetMax)} · {need.areaMin || '-'}-{need.areaMax || '-'} m2
                  </div>
                  <div className="mt-2 text-[13px] text-[#A7ABB6]">{need.districtIds.join(', ') || '-'}</div>
                  {need.description ? <div className="mt-2 text-[13px] leading-6 text-[#D7DAE3]">{need.description}</div> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#08090C] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#F5F0E6]">
              <CalendarClock className="h-5 w-5 text-[#F6D37A]" />
              Lịch xem nhà
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectCustomer customers={customers} value={viewingDraft.customerId} onChange={(value) => updateViewingDraft('customerId', value)} />
              <Field label="Mã nhà" value={viewingDraft.propertyId} onChange={(value) => updateViewingDraft('propertyId', value)} placeholder="SVP000001 hoặc ID nhà" />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Thoi gian xem</span>
                <input
                  type="datetime-local"
                  value={viewingDraft.scheduledAt}
                  onChange={(event) => updateViewingDraft('scheduledAt', event.target.value)}
                  className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Ghi chú lịch hẹn</span>
              <textarea
                value={viewingDraft.note}
                onChange={(event) => updateViewingDraft('note', event.target.value)}
                rows={3}
                placeholder="Người dẫn xem, địa điểm hẹn, yêu cầu riêng..."
                className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleCreateViewing()}
              disabled={savingViewing || customers.length === 0}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
            >
              {savingViewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Lưu lịch xem
            </button>
            <div className="mt-5 space-y-3">
              {viewings.slice(0, 6).map((viewing) => (
                <article key={viewing.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-bold text-[#F5F0E6]">{customerName(viewing.customerId)}</div>
                    <span className="rounded-full bg-[#F6D37A]/10 px-2 py-1 text-[11px] font-bold text-[#F6D37A]">{viewing.status}</span>
                  </div>
                  <div className="mt-2 text-[13px] text-[#D7DAE3]">{formatDateTime(viewing.scheduledAt)}</div>
                  <div className="mt-2 text-[13px] text-[#A7ABB6]">Nhà: {viewing.propertyId || '-'}</div>
                  {viewing.note ? <div className="mt-2 text-[13px] leading-6 text-[#D7DAE3]">{viewing.note}</div> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const Field = ({ label, value, onChange, placeholder }: FieldProps) => (
  <label className="block">
    <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
    />
  </label>
);

interface SelectCustomerProps {
  customers: SvpCustomer[];
  value: string;
  onChange: (value: string) => void;
}

const SelectCustomer = ({ customers, value, onChange }: SelectCustomerProps) => (
  <label className="block">
    <span className="mb-2 block text-[13px] font-bold text-[#D7DAE3]">Khách hàng</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
    >
      <option value="">Chọn khách</option>
      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} - {customer.phone}</option>)}
    </select>
  </label>
);

export default SvpCustomersPage;
