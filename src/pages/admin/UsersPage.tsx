import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, KeyRound, Lock, PlusCircle, Search, ShieldCheck, ShieldOff, Unlock, UserRoundCheck, Users, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { getRoleDisplayName } from '../../data/roles';
import { downloadAdminExport } from '../../utils/adminExport';
import { useAuth } from '../../contexts/AuthContext';

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

const SUPER_ADMIN_ROLE = 'admin_tong';
const ADMIN_ROLE = 'admin';
const ADMIN_CONTROLLED_ROLES = new Set([SUPER_ADMIN_ROLE, ADMIN_ROLE]);

function isAdminControlledRole(roleSlug: string) {
  return ADMIN_CONTROLLED_ROLES.has(roleSlug);
}

function hasApprovedRoleInList(roles: any[] | undefined, roleSlug: string) {
  return (roles || []).some((role) => role.slug === roleSlug && role.status === 'approved');
}

function userHasAdminControlledRole(user: any) {
  return (user.roles || []).some((role: any) => isAdminControlledRole(role.slug) && role.status === 'approved');
}

interface ReferrerCandidate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  svpId: string;
  referralCode: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [referrerLookup, setReferrerLookup] = useState('');
  const [referrerCandidates, setReferrerCandidates] = useState<ReferrerCandidate[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerCandidate | null>(null);
  const [selectedRoleSlug, setSelectedRoleSlug] = useState('');
  const [roleSettings, setRoleSettings] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleSlug: 'khach_mua',
  });
  const currentIsOwnerAdmin = hasApprovedRoleInList(currentUser?.roles, SUPER_ADMIN_ROLE);
  const currentUserId = currentUser?.id || '';

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/role-approval-settings'),
    ])
      .then(([usersResponse, rolesResponse]) => {
        setItems(usersResponse.data?.items || []);
        setRoleSettings(rolesResponse.data?.items || []);
      })
      .catch(() => {
        setItems([]);
        setRoleSettings([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    setSelectedUser((current) => {
      if (!current) return current;
      return items.find((item) => item.id === current.id) || current;
    });
  }, [items]);

  useEffect(() => {
    const lookup = referrerLookup.trim();
    if (!selectedUser || lookup.length < 2 || selectedReferrer) {
      setReferrerCandidates([]);
      return;
    }
    const timer = window.setTimeout(() => {
      api.get('/admin/referrer-candidates', { params: { q: lookup, excludeId: selectedUser.id } })
        .then((response) => setReferrerCandidates(response.data?.items || []))
        .catch(() => setReferrerCandidates([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [referrerLookup, selectedReferrer, selectedUser]);

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
    if (userHasAdminControlledRole(user) && !currentIsOwnerAdmin) {
      setMessage('Chỉ Admin tổng mới có quyền khóa hoặc mở khóa tài khoản quản trị.');
      return;
    }
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
    if (userHasAdminControlledRole(user) && !currentIsOwnerAdmin) {
      setMessage('Chỉ Admin tổng mới có quyền tạo mật khẩu tạm cho tài khoản quản trị.');
      return;
    }
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
    if (!selectedUser || !selectedReferrer) {
      setMessage('Vui lòng tìm kiếm và chọn đúng một tài khoản người giới thiệu trước khi lưu.');
      return;
    }
    setBusyId(`${selectedUser.id}-referrer`);
    setMessage('');
    try {
      await api.patch(`/admin/users/${encodeURIComponent(selectedUser.id)}`, { referrerUserId: selectedReferrer.id });
      setMessage(`Đã cập nhật người giới thiệu cho ${selectedUser.fullName || selectedUser.email}.`);
      setReferrerLookup('');
      setSelectedReferrer(null);
      setReferrerCandidates([]);
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa cập nhật được người giới thiệu.');
    } finally {
      setBusyId('');
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRoleSlug) {
      setMessage('Chọn vai trò cần cấp thêm cho tài khoản.');
      return;
    }
    if (isAdminControlledRole(selectedRoleSlug) && !currentIsOwnerAdmin) {
      setMessage('Chỉ Admin tổng mới có quyền cấp vai trò quản trị.');
      return;
    }
    setBusyId(`${selectedUser.id}-role`);
    setMessage('');
    try {
      await api.patch(`/admin/users/${encodeURIComponent(selectedUser.id)}`, { addRole: selectedRoleSlug });
      const roleName = roleSettings.find((role) => role.slug === selectedRoleSlug)?.label || getRoleDisplayName(selectedRoleSlug);
      setMessage(`Đã cấp vai trò ${roleName} cho ${selectedUser.fullName || selectedUser.email}.`);
      setSelectedRoleSlug('');
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa cấp được vai trò cho tài khoản.');
    } finally {
      setBusyId('');
    }
  };

  const createUser = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.roleSlug) {
      setMessage('Nhập đủ họ tên, email, số điện thoại và vai trò cần tạo.');
      return;
    }
    if (isAdminControlledRole(createForm.roleSlug) && !currentIsOwnerAdmin) {
      setMessage('Chỉ Admin tổng mới có quyền tạo tài khoản quản trị.');
      return;
    }

    setBusyId('create-user');
    setMessage('');
    try {
      const response = await api.post('/admin/users', {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password.trim() || undefined,
        roleSlugs: [createForm.roleSlug],
      });
      const tempPassword = response.data?.tempPassword ? ` Mật khẩu tạm: ${response.data.tempPassword}` : '';
      setMessage(`Đã tạo tài khoản ${createForm.email.trim()}.${tempPassword}`);
      setCreateOpen(false);
      setCreateForm({ fullName: '', email: '', phone: '', password: '', roleSlug: 'khach_mua' });
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa tạo được tài khoản.');
    } finally {
      setBusyId('');
    }
  };

  const removeRole = async (roleSlug: string) => {
    if (!selectedUser || !roleSlug) return;
    if (isAdminControlledRole(roleSlug) && !currentIsOwnerAdmin) {
      setMessage('Chỉ Admin tổng mới có quyền gỡ vai trò quản trị.');
      return;
    }

    const roleName = roleSettings.find((role) => role.slug === roleSlug)?.label || getRoleDisplayName(roleSlug);
    const confirmed = window.confirm(`Gỡ vai trò ${roleName} khỏi ${selectedUser.fullName || selectedUser.email || 'tài khoản này'}?`);
    if (!confirmed) return;

    setBusyId(`${selectedUser.id}-remove-${roleSlug}`);
    setMessage('');
    try {
      await api.patch(`/admin/users/${encodeURIComponent(selectedUser.id)}`, { removeRole: roleSlug });
      setMessage(`Đã gỡ vai trò ${roleName} khỏi ${selectedUser.fullName || selectedUser.email}.`);
      setSelectedRoleSlug('');
      load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Chưa gỡ được vai trò khỏi tài khoản.');
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
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button onClick={() => setCreateOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25202a] px-4 text-sm font-black text-white shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Tạo tài khoản
            </button>
            <button onClick={exportUsers} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white shadow-sm">
              <Download className="h-4 w-4" />
              Xuất Excel
            </button>
          </div>
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
        {!currentIsOwnerAdmin ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">Chỉ Admin tổng mới có quyền tạo, cấp, gỡ vai trò Admin hoặc chỉnh tài khoản quản trị khác.</div> : null}
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
              canManageSensitiveTarget={!userHasAdminControlledRole(user) || currentIsOwnerAdmin}
              onLock={() => updateAccountStatus(user, 'locked')}
              onUnlock={() => updateAccountStatus(user, 'active')}
              onReset={() => resetPassword(user)}
              onOpen={() => {
                setSelectedUser(user);
                setReferrerLookup('');
                setSelectedReferrer(null);
                setReferrerCandidates([]);
                setSelectedRoleSlug('');
              }}
            />
          ))}
        </div>
      )}
      {selectedUser ? (
        <UserDetailPanel
          user={selectedUser}
          referrerLookup={referrerLookup}
          setReferrerLookup={(value) => { setReferrerLookup(value); setSelectedReferrer(null); }}
          referrerCandidates={referrerCandidates}
          selectedReferrer={selectedReferrer}
          onSelectReferrer={(candidate) => { setSelectedReferrer(candidate); setReferrerLookup(candidate.fullName); setReferrerCandidates([]); }}
          selectedRoleSlug={selectedRoleSlug}
          setSelectedRoleSlug={setSelectedRoleSlug}
          roleSettings={roleSettings}
          busy={busyId === `${selectedUser.id}-referrer`}
          roleBusy={busyId === `${selectedUser.id}-role` || busyId.startsWith(`${selectedUser.id}-remove-`)}
          currentUserId={currentUserId}
          canManageAdminRoles={currentIsOwnerAdmin}
          onSaveReferrer={updateReferrer}
          onAssignRole={assignRole}
          onRemoveRole={removeRole}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
      {createOpen ? (
        <CreateUserPanel
          form={createForm}
          setForm={setCreateForm}
          roleSettings={roleSettings}
          canManageAdminRoles={currentIsOwnerAdmin}
          busy={busyId === 'create-user'}
          onCreate={createUser}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  );
}

function UserCard({
  user,
  busyId,
  canManageSensitiveTarget,
  onLock,
  onUnlock,
  onReset,
  onOpen,
}: {
  user: any;
  busyId: string;
  canManageSensitiveTarget: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onReset: () => void;
  onOpen: () => void;
}) {
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
              <button data-testid="admin-user-unlock" disabled={busyId === `${user.id}-active` || !canManageSensitiveTarget} onClick={onUnlock} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-60">
                <Unlock className="h-4 w-4" />
                <span className="truncate">Mở khóa</span>
              </button>
            ) : (
              <button data-testid="admin-user-lock" disabled={busyId === `${user.id}-locked` || !canManageSensitiveTarget} onClick={onLock} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-[#c40012] disabled:opacity-60">
                <Lock className="h-4 w-4" />
                <span className="truncate">Tạm khóa</span>
              </button>
            )}
            <button data-testid="admin-user-reset-password" disabled={busyId === `${user.id}-reset` || !canManageSensitiveTarget} onClick={onReset} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-[#25202a] disabled:opacity-60 sm:col-span-2">
              <KeyRound className="h-4 w-4" />
              <span className="truncate">Tạo mật khẩu tạm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateUserPanel({
  form,
  setForm,
  roleSettings,
  canManageAdminRoles,
  busy,
  onCreate,
  onClose,
}: {
  form: { fullName: string; email: string; phone: string; password: string; roleSlug: string };
  setForm: (value: { fullName: string; email: string; phone: string; password: string; roleSlug: string }) => void;
  roleSettings: any[];
  canManageAdminRoles: boolean;
  busy: boolean;
  onCreate: () => void;
  onClose: () => void;
}) {
  const roleOptions = roleSettings.filter((role) =>
    role.slug &&
    role.slug !== SUPER_ADMIN_ROLE &&
    (!isAdminControlledRole(role.slug) || canManageAdminRoles),
  );
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-[95] bg-black/35 px-4 py-6">
      <section className="mx-auto flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Tạo tài khoản</p>
            <h2 className="mt-1 text-xl font-black text-[#25202a]">Thêm người dùng mới</h2>
            <p className="mt-1 text-sm font-semibold text-[#7b8190]">Vai trò được cấp ở trạng thái đã duyệt.</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-50 text-[#667085]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-xs font-black text-[#667085]">Họ tên</span>
            <input
              value={form.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
              placeholder="Nhập họ tên"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#667085]">Email</span>
            <input
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
              placeholder="email@sodovanphuc.vn"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#667085]">Số điện thoại</span>
            <input
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
              placeholder="09..."
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#667085]">Vai trò</span>
            <select
              value={form.roleSlug}
              onChange={(event) => update('roleSlug', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
            >
              {roleOptions.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.label || getRoleDisplayName(role.slug)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black text-[#667085]">Mật khẩu tạm</span>
            <input
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              className="mt-1 min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
              placeholder="Để trống để hệ thống tự sinh"
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-gray-200 px-4 text-sm font-black text-[#25202a]">
            Hủy
          </button>
          <button
            data-testid="admin-create-user-submit"
            onClick={onCreate}
            disabled={busy || !form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.roleSlug}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            {busy ? <ShieldCheck className="h-4 w-4 animate-pulse" /> : <PlusCircle className="h-4 w-4" />}
            Tạo tài khoản
          </button>
        </div>
      </section>
    </div>
  );
}

function UserDetailPanel({
  user,
  referrerLookup,
  setReferrerLookup,
  referrerCandidates,
  selectedReferrer,
  onSelectReferrer,
  selectedRoleSlug,
  setSelectedRoleSlug,
  roleSettings,
  busy,
  roleBusy,
  currentUserId,
  canManageAdminRoles,
  onSaveReferrer,
  onAssignRole,
  onRemoveRole,
  onClose,
}: {
  user: any;
  referrerLookup: string;
  setReferrerLookup: (value: string) => void;
  referrerCandidates: ReferrerCandidate[];
  selectedReferrer: ReferrerCandidate | null;
  onSelectReferrer: (candidate: ReferrerCandidate) => void;
  selectedRoleSlug: string;
  setSelectedRoleSlug: (value: string) => void;
  roleSettings: any[];
  busy: boolean;
  roleBusy: boolean;
  currentUserId: string;
  canManageAdminRoles: boolean;
  onSaveReferrer: () => void;
  onAssignRole: () => void;
  onRemoveRole: (roleSlug: string) => void;
  onClose: () => void;
}) {
  const profile = user.profile || {};
  const address = profile.address || {};
  const bank = profile.bankInfo || {};
  const referrer = user.referrer;
  const certificateUrl = profile.certificateUrl || '';
  const directReferrals = Array.isArray(user.directReferrals) ? user.directReferrals : [];
  const existingRoles = new Set((user.roles || []).map((role: any) => role.slug));
  const canRemoveRole = (roleSlug: string) =>
    (!isAdminControlledRole(roleSlug) || canManageAdminRoles) && !(roleSlug === SUPER_ADMIN_ROLE && user.id === currentUserId);
  const assignableRoles = roleSettings.filter((role) =>
    role.slug &&
    role.slug !== SUPER_ADMIN_ROLE &&
    !existingRoles.has(role.slug) &&
    (!isAdminControlledRole(role.slug) || canManageAdminRoles),
  );

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
              <div className="relative min-w-0 flex-1">
                <input
                  value={referrerLookup}
                  onChange={(event) => setReferrerLookup(event.target.value)}
                  placeholder="Tìm theo tên, SVP ID, SĐT hoặc email"
                  className="min-h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
                />
                {referrerCandidates.length ? <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">{referrerCandidates.map((candidate) => <button key={candidate.id} type="button" onClick={() => onSelectReferrer(candidate)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-red-50"><span className="block text-sm font-black text-[#25202a]">{candidate.fullName}</span><span className="block truncate text-xs font-semibold text-[#7b8190]">{[candidate.svpId, candidate.phone, candidate.email].filter(Boolean).join(' · ')}</span></button>)}</div> : null}
              </div>
              <button
                onClick={onSaveReferrer}
                disabled={busy || !selectedReferrer}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white disabled:opacity-60"
              >
                <UserRoundCheck className="h-4 w-4" />
                Lưu
              </button>
            </div>
            {selectedReferrer ? <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><UserRoundCheck className="h-4 w-4 shrink-0" />Đã chọn: {selectedReferrer.fullName} · {selectedReferrer.svpId || selectedReferrer.phone}</div> : <p className="mt-2 text-xs font-semibold text-[#7b8190]">Kết quả chỉ được lưu sau khi bạn chọn đúng một tài khoản trong danh sách.</p>}
          </DetailSection>

          <DetailSection title="Tuyến F1 đã giới thiệu">
            <div className="rounded-2xl bg-[#fff8f2] p-3">
              <p className="text-sm font-black text-[#25202a]">{user.directReferralCount || directReferrals.length || 0} tài khoản trực tiếp</p>
              <p className="mt-1 text-xs font-semibold text-[#7b8190]">Danh sách người đăng ký trực tiếp qua mã/link của tài khoản này.</p>
            </div>
            {directReferrals.length ? (
              <div className="space-y-2">
                {directReferrals.map((item: any) => (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                    <p className="truncate text-sm font-black text-[#25202a]">{item.fullName || 'Chưa có tên'}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#7b8190]">
                      {[item.svpId, item.phone, item.email, item.referralCode].filter(Boolean).join(' · ') || '-'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#7b8190]">Chưa ghi nhận F1 trực tiếp.</p>
            )}
          </DetailSection>

          <DetailSection title="Cấp thêm vai trò">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(user.roles || []).length ? (user.roles || []).map((role: any) => {
                  const removable = canRemoveRole(role.slug);
                  return (
                    <span key={role.slug} className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                      <span className="truncate">{getRoleDisplayName(role.slug)} · {ROLE_STATUS[role.status] || role.status}</span>
                      {removable ? (
                        <button
                          type="button"
                          onClick={() => onRemoveRole(role.slug)}
                          disabled={roleBusy}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/80 text-[#c40012] ring-1 ring-emerald-100 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Gỡ vai trò ${getRoleDisplayName(role.slug)}`}
                          title="Gỡ vai trò"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </span>
                  );
                }) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-500">Chưa có vai trò</span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={selectedRoleSlug}
                  onChange={(event) => setSelectedRoleSlug(event.target.value)}
                  className="min-h-11 rounded-2xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
                >
                  <option value="">Chọn vai trò cần cấp</option>
                  {assignableRoles.map((role) => (
                    <option key={role.slug} value={role.slug}>
                      {role.label || getRoleDisplayName(role.slug)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onAssignRole}
                  disabled={roleBusy || !selectedRoleSlug}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25202a] px-4 text-sm font-black text-white disabled:opacity-60"
                >
                  {roleBusy ? <ShieldCheck className="h-4 w-4 animate-pulse" /> : <PlusCircle className="h-4 w-4" />}
                  Cấp vai trò
                </button>
              </div>
              <p className="text-xs font-semibold leading-5 text-[#7b8190]">Vai trò được Admin cấp sẽ ở trạng thái đã duyệt để tài khoản dùng ngay.</p>
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
