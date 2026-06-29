import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, Lock, UserPlus, Copy, LogOut, ChevronRight, Check } from 'lucide-react';
import { svpAxios as api } from '../services/svpAxios';

const ROLE_NAMES: Record<string, string> = {
  admin: 'Quản trị viên', giam_doc: 'Giám đốc khu vực', truong_phong: 'Trưởng phòng',
  chuyen_gia: 'Chuyên gia', chuyen_vien: 'Chuyên viên', ctv_khach: 'CTV tìm khách',
  ctv_nguon: 'CTV tìm nguồn', chu_nha: 'Chủ nhà', khach_mua: 'Khách mua',
  nguoi_gioi_thieu: 'Người giới thiệu', doi_tac: 'Đối tác',
};

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [roleSlug, setRoleSlug] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [msg, setMsg] = useState('');

  const copyCode = () => { navigator.clipboard.writeText(user?.referralCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { await api.post('/auth/avatar', fd); await refreshUser(); } catch { setMsg('Lỗi tải ảnh'); }
  };

  const handleChangePw = async () => {
    if (pwForm.newPw !== pwForm.confirm) { setMsg('Mật khẩu mới không khớp'); return; }
    try { await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw }); setMsg('Đổi mật khẩu thành công'); setShowPwDialog(false); } catch { setMsg('Sai mật khẩu hiện tại'); }
  };

  const handleRequestRole = async () => {
    if (!roleSlug) return;
    try { await api.post('/auth/register-role', { roleSlug, reason: roleReason }); setMsg('Đã gửi yêu cầu'); setShowRoleDialog(false); await refreshUser(); } catch { setMsg('Lỗi gửi yêu cầu'); }
  };

  if (!user) return null;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      <h1 className="text-xl font-bold text-[#212121] mb-6">Tài khoản</h1>
      {msg && <div className="bg-[#FFEBEE] text-[#D32F2F] px-4 py-2 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#FFCDD2] flex items-center justify-center text-3xl font-bold text-[#D32F2F] overflow-hidden">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.fullName?.charAt(0)}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#D32F2F] rounded-full flex items-center justify-center cursor-pointer">
            <Camera className="w-4 h-4 text-white" />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
        </div>
        <h2 className="text-lg font-semibold mt-3">{user.fullName}</h2>
        <p className="text-sm text-[#757575]">{user.email}</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
        <div className="flex justify-between"><span className="text-[#757575] text-sm">Mã SVP</span><span className="font-medium">{user.svpId}</span></div>
        <div className="flex justify-between"><span className="text-[#757575] text-sm">Điện thoại</span><span>{user.phone || '—'}</span></div>
        <div className="flex justify-between"><span className="text-[#757575] text-sm">Email</span><span>{user.email}</span></div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Vai trò</h3>
        {user.roles?.map(r => (
          <div key={r.slug} className="flex items-center justify-between py-2 border-b last:border-0">
            <span>{ROLE_NAMES[r.slug] || r.slug}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {r.status === 'approved' ? 'Đã duyệt' : r.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
            </span>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-2">Mã giới thiệu</h3>
        <div className="flex items-center gap-2">
          <code className="bg-surface px-3 py-2 rounded-lg flex-1 font-mono text-sm">{user.referralCode || '—'}</code>
          <button onClick={copyCode} className="p-2 text-[#D32F2F]">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        <button onClick={() => setShowPwDialog(true)} className="w-full flex items-center justify-between p-4"><span className="flex items-center gap-3"><Lock className="w-5 h-5 text-[#757575]" />Đổi mật khẩu</span><ChevronRight className="w-5 h-5 text-gray-400" /></button>
        <button onClick={() => setShowRoleDialog(true)} className="w-full flex items-center justify-between p-4"><span className="flex items-center gap-3"><UserPlus className="w-5 h-5 text-[#757575]" />Xin thêm vai trò</span><ChevronRight className="w-5 h-5 text-gray-400" /></button>
        <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center justify-between p-4 text-[#D32F2F]"><span className="flex items-center gap-3"><LogOut className="w-5 h-5" />Đăng xuất</span></button>
      </div>

      {/* Change Password Dialog */}
      {showPwDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
            <input type="password" placeholder="Mật khẩu hiện tại" className="w-full border rounded-lg px-3 py-2 mb-3" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
            <input type="password" placeholder="Mật khẩu mới" className="w-full border rounded-lg px-3 py-2 mb-3" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} />
            <input type="password" placeholder="Xác nhận mật khẩu mới" className="w-full border rounded-lg px-3 py-2 mb-4" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
            <div className="flex gap-3">
              <button onClick={() => setShowPwDialog(false)} className="flex-1 border border-gray-300 rounded-lg py-2">Hủy</button>
              <button onClick={handleChangePw} className="flex-1 bg-[#D32F2F] text-white rounded-lg py-2">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Role Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Xin thêm vai trò</h3>
            <select className="w-full border rounded-lg px-3 py-2 mb-3" value={roleSlug} onChange={e => setRoleSlug(e.target.value)}>
              <option value="">Chọn vai trò</option>
              {Object.entries(ROLE_NAMES).filter(([slug]) => !user.roles?.find(r => r.slug === slug)).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
            <textarea placeholder="Lý do xin vai trò" className="w-full border rounded-lg px-3 py-2 mb-4 h-20" value={roleReason} onChange={e => setRoleReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowRoleDialog(false)} className="flex-1 border border-gray-300 rounded-lg py-2">Hủy</button>
              <button onClick={handleRequestRole} className="flex-1 bg-[#D32F2F] text-white rounded-lg py-2">Gửi yêu cầu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
