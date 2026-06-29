import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { getRoleDisplayName } from '../../data/roles';

const ROLE_STATUS: Record<string, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
  disabled: 'Tạm khóa',
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((user) => [user.fullName, user.email, user.phone, user.svpId].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [items, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Người dùng</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi tài khoản, SVP ID và vai trò đang được cấp.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo tên, email, số điện thoại, SVP ID..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <UserSkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Users className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Không có người dùng phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((user) => <UserCard key={user.id} user={user} />)}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: any }) {
  const initials = String(user.fullName || user.email || '?').trim().slice(0, 1).toUpperCase();
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-lg font-black text-[#c40012]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-black text-[#25202a]">{user.fullName || 'Người dùng'}</p>
              <p className="mt-1 text-sm font-semibold text-[#747b88]">{user.phone || user.email || 'Chưa có liên hệ'}</p>
            </div>
            {user.svpId && <span className="shrink-0 rounded-full bg-[#faf7f5] px-2.5 py-1 text-xs font-black text-[#747b88]">{user.svpId}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.roles || []).length === 0 ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-500">Chưa có vai trò</span>
            ) : (
              (user.roles || []).map((role: any) => (
                <span key={`${user.id}-${role.slug}`} className={`rounded-full px-2.5 py-1 text-xs font-black ${role.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {getRoleDisplayName(role.slug)} · {ROLE_STATUS[role.status] || role.status}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
