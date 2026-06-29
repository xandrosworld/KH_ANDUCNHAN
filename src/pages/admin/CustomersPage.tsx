import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { customerStatusLabel } from '../../utils/svpFormat';

export default function AdminCustomersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customers')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((customer) => [customer.fullName, customer.name, customer.phone, customer.email, customer.source, customer.note].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [items, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Khách hàng</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi toàn bộ khách mua và trạng thái chăm sóc.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo tên, số điện thoại, email, nguồn khách..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

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
