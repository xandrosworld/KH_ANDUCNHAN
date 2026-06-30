import { useEffect, useMemo, useState } from 'react';
import { Download, KeyRound, Lock, Search, Unlock, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { getRoleDisplayName } from '../../data/roles';
import { downloadAdminExport } from '../../utils/adminExport';

const ROLE_STATUS: Record<string, string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
  disabled: 'Tạm khóa',
};

const FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Tạm khóa', value: 'locked' },
  { label: 'Chờ duyệt', value: 'pending' },
];

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((user) => {
      const matchesKeyword = !keyword || [user.fullName, user.email, user.phone, user.svpId]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
      const isLocked = user.accountStatus === 'locked';
      const hasPendingRole = (user.roles || []).some((role: any) => role.status === 'pending');
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && !isLocked) ||
        (filter === 'locked' && isLocked) ||
        (filter === 'pending' && hasPendingRole);
      return matchesKeyword && matchesFilter;
    });
  }, [items, query, filter]);

  const updateAccountStatus = async (user: any, accountStatus: 'active' | 'locked') => {
    setBusyId(`${user.id}-${accountStatus}`);
    setMessage('');
    try {
      await api.post(`/admin/users/${encodeURIComponent(user.id)}/account-status`, { accountStatus });
      setItems((current) => current.map((item) => item.id === user.id ? { ...item, accountStatus } : item));
      setMessage(accountStatus === 'locked' ? `Đã tạm khóa tài khoản ${user.fullName || user.email}.` : `Đã mở khóa tài khoản ${user.fullName || user.email}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa cập nhật được trạng thái tài khoản.');
    } finally {
      setBusyId('');
    }
  };

  const resetPassword = async (user: any) => {
    const confirmed = window.confirm(`Tạo mật khẩu tạm cho ${user.fullName || user.email || 'tài khoản này'}?`);
    if (!confirmed) return;
    setBusyId(`${user.id}-reset`);
    setMessage('');
    try {
      const response = await api.post(`/admin/users/${encodeURIComponent(user.id)}/reset-password`);
      setMessage(`Mật khẩu tạm của ${user.fullName || user.email}: ${response.data?.tempPassword || ''}`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa tạo được mật khẩu tạm.');
    } finally {
      setBusyId('');
    }
  };

  const exportUsers = async () => {
    setMessage('');
    try {
      await downloadAdminExport('users');
    } catch {
      setMessage('Chưa xuất được danh sách người dùng.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Quản trị</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Người dùng</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Theo dõi tài khoản, SVP ID, vai trò và trạng thái sử dụng.</p>
          </div>
          <button onClick={exportUsers} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm">
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
          <input
            className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
            placeholder="Tìm theo tên, email, số điện thoại, SVP ID..."
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
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-[#c40012]">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <UserSkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Users className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Không có người dùng phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              busyId={busyId}
              onLock={() => updateAccountStatus(user, 'locked')}
              onUnlock={() => updateAccountStatus(user, 'active')}
              onReset={() => resetPassword(user)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, busyId, onLock, onUnlock, onReset }: { user: any; busyId: string; onLock: () => void; onUnlock: () => void; onReset: () => void }) {
  const initials = String(user.fullName || user.email || '?').trim().slice(0, 1).toUpperCase();
  const isLocked = user.accountStatus === 'locked';
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
            <div className="flex shrink-0 flex-wrap gap-2">
              {user.svpId && <span className="rounded-full bg-[#faf7f5] px-2.5 py-1 text-xs font-black text-[#747b88]">{user.svpId}</span>}
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isLocked ? 'bg-rose-50 text-[#c40012]' : 'bg-emerald-50 text-emerald-700'}`}>
                {isLocked ? 'Tạm khóa' : 'Hoạt động'}
              </span>
            </div>
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
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {isLocked ? (
              <button data-testid="admin-user-unlock" disabled={busyId === `${user.id}-active`} onClick={onUnlock} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-60">
                <Unlock className="h-4 w-4" />
                Mở khóa
              </button>
            ) : (
              <button data-testid="admin-user-lock" disabled={busyId === `${user.id}-locked`} onClick={onLock} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-60">
                <Lock className="h-4 w-4" />
                Tạm khóa
              </button>
            )}
            <button data-testid="admin-user-reset-password" disabled={busyId === `${user.id}-reset`} onClick={onReset} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-[#25202a] disabled:opacity-60 sm:col-span-2">
              <KeyRound className="h-4 w-4" />
              Tạo mật khẩu tạm
            </button>
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
