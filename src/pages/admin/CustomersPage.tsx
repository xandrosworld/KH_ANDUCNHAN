import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { customerStatusLabel } from '../../utils/svpFormat';
import { downloadAdminExport } from '../../utils/adminExport';

const FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới', value: 'cs_new' },
  { label: 'Đã liên hệ', value: 'cs_contacted' },
  { label: 'Đang dẫn xem', value: 'cs_viewing' },
  { label: 'Đặt cọc', value: 'cs_deposit' },
];

export default function AdminCustomersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/customers')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((customer) => {
      const status = customer.statusId || customer.status || '';
      const matchesKeyword = !keyword || [customer.fullName, customer.name, customer.phone, customer.email, customer.source, customer.note]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const matchesFilter = filter === 'all' || status === filter;
      return matchesKeyword && matchesFilter;
    });
  }, [items, query, filter]);

  const exportCustomers = async () => {
    setMessage('');
    try {
      await downloadAdminExport('customers');
    } catch {
      setMessage('Chưa xuất được danh sách khách hàng.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Khách hàng</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi toàn bộ khách mua và trạng thái chăm sóc.</p>
          </div>
          <button onClick={exportCustomers} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm">
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo tên, số điện thoại, email, nguồn khách..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${filter === item.value ? 'bg-[#c40012] text-white' : 'bg-[#fff8f2] text-[#7a353b] ring-1 ring-red-100'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {message && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[#c40012]">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <CustomerSkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Users className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Chưa có khách hàng phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Dữ liệu khách sẽ xuất hiện khi chuyên viên nhập hoặc được phân công.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((customer) => <CustomerCard key={customer.id} customer={customer} />)}
        </div>
      )}
    </div>
  );
}

function CustomerCard({ customer }: { customer: any }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-[#25202a]">{customer.fullName || customer.name || 'Khách mua'}</p>
          <p className="mt-1 text-sm font-semibold text-[#747b88]">{customer.phone || customer.email || 'Chưa có liên hệ'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-[#c40012]">
          {customerStatusLabel(customer.statusId || customer.status)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#747b88]">{customer.note || `Nguồn khách: ${sourceLabel(customer.source)}`}</p>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function sourceLabel(source?: string) {
  const labels: Record<string, string> = { online: 'Online', referral: 'Giới thiệu', direct: 'Trực tiếp', zalo: 'Zalo/Facebook', other: 'Khác' };
  return labels[source || ''] || source || 'Chưa rõ';
}
