import { useEffect, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, ChevronRight, Copy, Lock, LogOut, Save, UploadCloud, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, type UserProfile } from '../services/authApi';
import { getRoleDisplayName, ROLE_DEFINITIONS } from '../data/roles';
import { usePageTitle } from '../hooks/usePageTitle';

const emptyProfile: UserProfile = {
  cccd: '',
  hasCertificate: false,
  certificateUrl: '',
  address: {
    province: '',
    district: '',
    ward: '',
    street: '',
    houseNumber: '',
  },
  educationLevel: '',
  bio: '',
  bankInfo: {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  },
};

const EDUCATION_LEVELS = ['THPT', 'Trung cấp', 'Cao đẳng', 'Đại học', 'Sau đại học', 'Chứng chỉ nghề BĐS', 'Khác'];

function normalizeProfile(profile?: Partial<UserProfile>, cccd = ''): UserProfile {
  return {
    ...emptyProfile,
    ...profile,
    cccd: profile?.cccd || cccd || '',
    address: { ...emptyProfile.address, ...(profile?.address || {}) },
    bankInfo: { ...emptyProfile.bankInfo, ...(profile?.bankInfo || {}) },
  };
}

export default function ProfilePage() {
  usePageTitle('Tài khoản | Sổ Đỏ Vạn Phúc');
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [roleSlug, setRoleSlug] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile>(emptyProfile);

  useEffect(() => {
    if (user) {
      setProfileForm(normalizeProfile(user.profile, user.cccd));
    }
  }, [user]);

  if (!user) return null;

  const initials = user.fullName
    ? user.fullName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  const copyCode = async () => {
    if (!user.referralCode) return;
    await navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch {
      setMessage('Chưa tải được ảnh. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const updateProfileField = (key: keyof UserProfile, value: any) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
  };

  const updateAddressField = (key: keyof UserProfile['address'], value: string) => {
    setProfileForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  };

  const updateBankField = (key: keyof UserProfile['bankInfo'], value: string) => {
    setProfileForm((current) => ({ ...current, bankInfo: { ...current.bankInfo, [key]: value } }));
  };

  const handleSaveProfile = async () => {
    setBusy(true);
    setMessage('');
    try {
      await authApi.updateProfile(profileForm);
      await refreshUser();
      setMessage('Đã lưu thông tin chi tiết tài khoản.');
    } catch (error: any) {
      setMessage(error.message || 'Chưa lưu được hồ sơ. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleCertificate = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await authApi.uploadCertificate(file);
      setProfileForm(normalizeProfile(result.profile, result.profile.cccd));
      await refreshUser();
      setMessage('Đã tải ảnh chứng chỉ hành nghề.');
    } catch (error: any) {
      setMessage(error.message || 'Chưa tải được ảnh chứng chỉ.');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.next.length < 6) {
      setMessage('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await authApi.changePassword(passwordForm.current, passwordForm.next);
      setShowPasswordDialog(false);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setMessage('Đổi mật khẩu thành công.');
    } catch (error: any) {
      setMessage(error.message || 'Chưa đổi được mật khẩu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestRole = async () => {
    if (!roleSlug) {
      setMessage('Vui lòng chọn vai trò muốn đăng ký thêm.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await authApi.registerRole({ roleSlug, reason: roleReason });
      setShowRoleDialog(false);
      setRoleSlug('');
      setRoleReason('');
      await refreshUser();
      setMessage(result.message || 'Đã gửi yêu cầu vai trò.');
    } catch (error: any) {
      setMessage(error.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const availableRoles = ROLE_DEFINITIONS.filter((role) =>
    role.slug !== 'admin' && !user.roles?.some((item) => item.slug === role.slug),
  );

  return (
    <div className="mx-auto max-w-lg pb-20">
      <h1 className="mb-6 text-xl font-black text-[#25202a]">Tài khoản</h1>
      {message && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#c40012]">{message}</div>}

      <section className="mb-4 rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="relative mx-auto h-24 w-24">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-red-50 text-3xl font-black text-[#c40012]">
            {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[#c40012] text-white shadow-md">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" disabled={busy} />
          </label>
        </div>
        <h2 className="mt-3 text-lg font-black text-[#25202a]">{user.fullName}</h2>
        <p className="text-sm font-medium text-[#667085]">{user.email}</p>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <InfoRow label="Mã SVP" value={user.svpId || 'Chưa có'} />
        <InfoRow label="Điện thoại" value={user.phone || 'Chưa cập nhật'} />
        <InfoRow label="Email" value={user.email} />
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-black text-[#25202a]">Vai trò</h3>
        <div className="space-y-2">
          {user.roles?.map((role) => (
            <div key={role.slug} className="flex items-center justify-between rounded-xl bg-[#fff8f2] px-3 py-2">
              <span className="text-sm font-bold text-[#25202a]">{getRoleDisplayName(role.slug)}</span>
              <StatusBadge status={role.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-black text-[#25202a]">Mã giới thiệu</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xl bg-[#fff8f2] px-3 py-2 text-sm font-bold text-[#25202a]">{user.referralCode || 'Chưa có'}</code>
          <button onClick={copyCode} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-[#c40012]" aria-label="Sao chép mã giới thiệu">
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-[#25202a]">Thông tin chi tiết tài khoản</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#7b8190]">Chỉ bạn và quản trị viên được xem các thông tin nhạy cảm.</p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={busy}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c40012] px-3 text-xs font-black text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Lưu
          </button>
        </div>

        <div className="grid gap-3">
          <ProfileInput label="CCCD" value={profileForm.cccd} onChange={(value) => updateProfileField('cccd', value)} inputMode="numeric" />
          <div className="rounded-2xl border border-gray-100 bg-[#fffaf7] p-3">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-black text-[#25202a]">
                <input
                  type="checkbox"
                  checked={profileForm.hasCertificate}
                  onChange={(event) => updateProfileField('hasCertificate', event.target.checked)}
                  className="h-4 w-4 accent-[#c40012]"
                />
                Có chứng chỉ hành nghề
              </label>
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-white px-3 text-xs font-black text-[#c40012]">
                <UploadCloud className="h-4 w-4" />
                Tải ảnh
                <input type="file" accept="image/*" onChange={handleCertificate} className="hidden" disabled={busy} />
              </label>
            </div>
            {profileForm.certificateUrl ? (
              <a href={profileForm.certificateUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs font-bold text-[#c40012]">
                {profileForm.certificateUrl}
              </a>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#7b8190]">Chưa có ảnh chứng chỉ.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-black text-[#25202a]">Địa chỉ hiện tại</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileInput label="Tỉnh/Thành" value={profileForm.address.province} onChange={(value) => updateAddressField('province', value)} />
          <ProfileInput label="Quận/Huyện" value={profileForm.address.district} onChange={(value) => updateAddressField('district', value)} />
          <ProfileInput label="Phường/Xã" value={profileForm.address.ward} onChange={(value) => updateAddressField('ward', value)} />
          <ProfileInput label="Đường" value={profileForm.address.street} onChange={(value) => updateAddressField('street', value)} />
          <ProfileInput label="Số nhà" value={profileForm.address.houseNumber} onChange={(value) => updateAddressField('houseNumber', value)} />
        </div>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-black text-[#25202a]">Học vấn và giới thiệu</h3>
        <select
          className="svp-input mb-3"
          value={profileForm.educationLevel}
          onChange={(event) => updateProfileField('educationLevel', event.target.value)}
        >
          <option value="">Chọn bằng cấp / trình độ</option>
          {EDUCATION_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
        </select>
        <textarea
          className="svp-input h-24 py-3"
          value={profileForm.bio}
          onChange={(event) => updateProfileField('bio', event.target.value)}
          placeholder="Mô tả ngắn về kinh nghiệm, khu vực phụ trách, thế mạnh..."
        />
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-black text-[#25202a]">Tài khoản ngân hàng</h3>
        <div className="grid gap-3">
          <ProfileInput label="Ngân hàng" value={profileForm.bankInfo.bankName} onChange={(value) => updateBankField('bankName', value)} />
          <ProfileInput label="Số tài khoản" value={profileForm.bankInfo.accountNumber} onChange={(value) => updateBankField('accountNumber', value)} inputMode="numeric" />
          <ProfileInput label="Chủ tài khoản" value={profileForm.bankInfo.accountHolder} onChange={(value) => updateBankField('accountHolder', value)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ActionRow icon={<Lock className="h-5 w-5" />} label="Đổi mật khẩu" onClick={() => setShowPasswordDialog(true)} />
        <ActionRow icon={<UserPlus className="h-5 w-5" />} label="Xin thêm vai trò" onClick={() => setShowRoleDialog(true)} />
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-bold text-[#c40012]"
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </section>

      {showPasswordDialog && (
        <Dialog title="Đổi mật khẩu" onClose={() => setShowPasswordDialog(false)}>
          <input type="password" placeholder="Mật khẩu hiện tại" className="svp-input mb-3" value={passwordForm.current} onChange={(event) => setPasswordForm((form) => ({ ...form, current: event.target.value }))} />
          <input type="password" placeholder="Mật khẩu mới" className="svp-input mb-3" value={passwordForm.next} onChange={(event) => setPasswordForm((form) => ({ ...form, next: event.target.value }))} />
          <input type="password" placeholder="Xác nhận mật khẩu mới" className="svp-input mb-4" value={passwordForm.confirm} onChange={(event) => setPasswordForm((form) => ({ ...form, confirm: event.target.value }))} />
          <DialogActions onCancel={() => setShowPasswordDialog(false)} onConfirm={handleChangePassword} confirmLabel="Xác nhận" disabled={busy} />
        </Dialog>
      )}

      {showRoleDialog && (
        <Dialog title="Xin thêm vai trò" onClose={() => setShowRoleDialog(false)}>
          <select className="svp-input mb-3" value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)}>
            <option value="">Chọn vai trò</option>
            {availableRoles.map((role) => (
              <option key={role.slug} value={role.slug}>{role.shortLabel}</option>
            ))}
          </select>
          <textarea placeholder="Lý do đăng ký vai trò" className="svp-input mb-4 h-24 py-3" value={roleReason} onChange={(event) => setRoleReason(event.target.value)} />
          <DialogActions onCancel={() => setShowRoleDialog(false)} onConfirm={handleRequestRole} confirmLabel="Gửi yêu cầu" disabled={busy} />
        </Dialog>
      )}
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#5f6672]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="svp-input"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm font-medium text-[#667085]">{label}</span>
      <span className="text-right text-sm font-bold text-[#25202a]">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-red-50 text-red-700',
    disabled: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    approved: 'Đã kích hoạt',
    pending: 'Chờ duyệt',
    rejected: 'Từ chối',
    disabled: 'Tạm khóa',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
}

function ActionRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left text-sm font-bold text-[#25202a]">
      <span className="flex items-center gap-3 text-[#667085]">
        {icon}
        <span className="text-[#25202a]">{label}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#25202a]">{title}</h3>
          <button onClick={onClose} className="text-sm font-bold text-[#667085]">Đóng</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DialogActions({ onCancel, onConfirm, confirmLabel, disabled }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string; disabled?: boolean }) {
  return (
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-[#667085]">Hủy</button>
      <button onClick={onConfirm} disabled={disabled} className="flex-1 rounded-xl bg-[#c40012] py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {confirmLabel}
      </button>
    </div>
  );
}
