import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, KeyRound, Lock, Search, Unlock, UserRoundCheck, Users, X } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [referrerLookup, setReferrerLookup] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    setSelectedUser((current) => {
      if (!current) return current;
      return items.find((item) => item.id === current.id) || current;
    });
  }, [items]);

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

  const updateReferrer = async () => {
    if (!selectedUser || !referrerLookup.trim()) {
      setMessage('Nhập mã giới thiệu, SVP ID, số điện thoại, email hoặc tên người giới thiệu.');
      return;
    }
    setBusyId(`${selectedUser.id}-referrer`);
    setMessage('');
    try {
      await api.patch(`/admin/users/${encodeURIComponent(selectedUser.id)}`, { referrerLookup: referrerLookup.trim() });
      setMessage(`Đã cập nhật người giới thiệu cho ${selectedUser.fullName || selectedUser.email}.`);
      setReferrerLookup('');
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa cập nhật được người giới thiệu.');
    } finally {
      setBusyId('');
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
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <UserSkeleton key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Users className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Không có người dùng phù hợp</p>
          <p className="mt-1 text-sm font-medium text-[#747b88]">Thử đổi từ khóa hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              busyId={busyId}
              onLock={() => updateAccountStatus(user, 'locked')}
              onUnlock={() => updateAccountStatus(user, 'active')}
              onReset={() => resetPassword(user)}
              onOpen={() => {
                setSelectedUser(user);
                setReferrerLookup('');
              }}
            />
          ))}
        </div>
      )}
      {selectedUser ? (
        <UserDetailPanel
          user={selectedUser}
          referrerLookup={referrerLookup}
          setReferrerLookup={setReferrerLookup}
          busy={busyId === `${selectedUser.id}-referrer`}
          onSaveReferrer={updateReferrer}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
    </div>
  );
}

function UserCard({ user, busyId, onLock, onUnlock, onReset, onOpen }: { user: any; busyId: string; onLock: () => void; onUnlock: () => void; onReset: () => void; onOpen: () => void }) {
  const initials = String(user.fullName || user.email || '?').trim().slice(0, 1).toUpperCase();
  const isLocked = user.accountStatus === 'locked';
  return (
    <div data-testid="admin-user-card" className="min-w-0 max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-lg font-black text-[#c40012]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button type="button" onClick={onOpen} className="max-w-full truncate text-left font-black text-[#25202a] underline-offset-4 hover:text-[#c40012] hover:underline">
                {user.fullName || 'Người dùng'}
              </button>
              <p className="mt-1 truncate text-sm font-semibold text-[#747b88]">{user.phone || user.email || 'Chưa có liên hệ'}</p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {user.svpId && <span className="max-w-full truncate rounded-full bg-[#faf7f5] px-2.5 py-1 text-xs font-black text-[#747b88]">{user.svpId}</span>}
              <span className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-black ${isLocked ? 'bg-rose-50 text-[#c40012]' : 'bg-emerald-50 text-emerald-700'}`}>
                {isLocked ? 'Tạm khóa' : 'Hoạt động'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            {(user.roles || []).length === 0 ? (
              <span className="max-w-full truncate rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-500">Chưa có vai trò</span>
            ) : (
              (user.roles || []).map((role: any) => (
                <span key={`${user.id}-${role.slug}`} className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-black ${role.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {getRoleDisplayName(role.slug)} · {ROLE_STATUS[role.status] || role.status}
                </span>
              ))
            )}
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
            {isLocked ? (
              <button data-testid="admin-user-unlock" disabled={busyId === `${user.id}-active`} onClick={onUnlock} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-60">
                <Unlock className="h-4 w-4" />
                <span className="truncate">Mở khóa</span>
              </button>
            ) : (
              <button data-testid="admin-user-lock" disabled={busyId === `${user.id}-locked`} onClick={onLock} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-60">
                <Lock className="h-4 w-4" />
                <span className="truncate">Tạm khóa</span>
              </button>
            )}
            <button data-testid="admin-user-reset-password" disabled={busyId === `${user.id}-reset`} onClick={onReset} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-[#25202a] disabled:opacity-60 sm:col-span-2">
              <KeyRound className="h-4 w-4" />
              <span className="truncate">Tạo mật khẩu tạm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  referrerLookup,
  setReferrerLookup,
  busy,
  onSaveReferrer,
  onClose,
}: {
  user: any;
  referrerLookup: string;
  setReferrerLookup: (value: string) => void;
  busy: boolean;
  onSaveReferrer: () => void;
  onClose: () => void;
}) {
  const profile = user.profile || {};
  const address = profile.address || {};
  const bank = profile.bankInfo || {};
  const referrer = user.referrer;
  const certificateUrl = profile.certificateUrl || '';

  return (
    <div className="fixed inset-0 z-[90] bg-black/35">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Chi tiết người dùng</p>
            <h2 className="mt-1 truncate text-xl font-black text-[#25202a]">{user.fullName || 'Người dùng'}</h2>
            <p className="mt-1 text-sm font-semibold text-[#7b8190]">{user.svpId || user.phone || user.email}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-50 text-[#667085]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <DetailSection title="Thông tin cơ bản">
            <DetailRow label="Họ tên" value={user.fullName} />
            <DetailRow label="Số điện thoại" value={user.phone} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="CCCD" value={profile.cccd || user.cccd} />
            <DetailRow label="Mã giới thiệu" value={user.referralCode} />
          </DetailSection>

          <DetailSection title="Hồ sơ">
            <DetailRow label="Chứng chỉ" value={profile.hasCertificate ? 'Có' : 'Chưa có'} />
            {certificateUrl ? (
              <a href={certificateUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold text-[#c40012]">
                Xem ảnh chứng chỉ
              </a>
            ) : null}
            <DetailRow label="Học vấn" value={profile.educationLevel} />
            <DetailRow label="Mô tả" value={profile.bio} />
            <DetailRow label="Địa chỉ" value={formatAddress(address)} />
          </DetailSection>

          <DetailSection title="Ngân hàng">
            <DetailRow label="Ngân hàng" value={bank.bankName} />
            <DetailRow label="Số tài khoản" value={bank.accountNumber} />
            <DetailRow label="Chủ tài khoản" value={bank.accountHolder} />
          </DetailSection>

          <DetailSection title="Người giới thiệu">
            {referrer ? (
              <div className="rounded-2xl bg-[#fff8f2] p-3">
                <p className="font-black text-[#25202a]">{referrer.fullName || 'Chưa có tên'}</p>
                <p className="mt-1 text-xs font-semibold text-[#7b8190]">{[referrer.svpId, referrer.phone, referrer.referralCode].filter(Boolean).join(' · ')}</p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#7b8190]">Chưa gán người giới thiệu.</p>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={referrerLookup}
                onChange={(event) => setReferrerLookup(event.target.value)}
                placeholder="Mã/SVP ID/SĐT/email/tên"
                className="min-h-11 flex-1 rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
              />
              <button
                onClick={onSaveReferrer}
                disabled={busy}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white disabled:opacity-60"
              >
                <UserRoundCheck className="h-4 w-4" />
                Lưu
              </button>
            </div>
          </DetailSection>
        </div>
      </aside>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-black text-[#25202a]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-3 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
      <span className="w-28 shrink-0 text-xs font-black text-[#7b8190]">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-[#25202a]">{value || '-'}</span>
    </div>
  );
}

function formatAddress(address: any) {
  return [address.houseNumber, address.street, address.ward, address.district, address.province].filter(Boolean).join(', ');
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
