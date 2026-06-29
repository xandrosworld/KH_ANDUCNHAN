import { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

const ROLE_NAMES: Record<string, string> = {
  admin: 'Quản trị viên', giam_doc: 'Giám đốc', truong_phong: 'Trưởng phòng',
  chuyen_gia: 'Chuyên gia', chuyen_vien: 'Chuyên viên', ctv_khach: 'CTV tìm khách',
  ctv_nguon: 'CTV tìm nguồn', chu_nha: 'Chủ nhà', khach_mua: 'Khách mua',
  nguoi_gioi_thieu: 'Người giới thiệu', doi_tac: 'Đối tác',
};

const TABS = ['Chờ duyệt', 'Đã duyệt', 'Từ chối'];
const TAB_STATUS: Record<string, string> = { 'Chờ duyệt': 'pending', 'Đã duyệt': 'approved', 'Từ chối': 'rejected' };

export default function RoleApprovalsPage() {
  const [tab, setTab] = useState('Chờ duyệt');
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    api.get('/admin/role-applications', { params: { status: TAB_STATUS[tab] } })
      .then(r => setItems(r.data?.items || []))
      .catch(() => {});
  };

  useEffect(load, [tab]);

  const act = async (id: string, status: string) => {
    await api.patch(`/admin/role-applications/${id}`, { status, adminNotes: notes[id] || '' });
    load();
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Duyệt vai trò</h1>
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm ${tab === t ? 'bg-[#D32F2F] text-white' : 'bg-white text-[#757575] border'}`}>{t}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Không có yêu cầu nào</p>
        </div>
      ) : items.map((a: any) => (
        <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex justify-between mb-2">
            <div>
              <p className="font-medium">{a.userName || a.userEmail || '—'}</p>
              <p className="text-sm text-[#757575]">{a.userEmail} · {a.userPhone || ''}</p>
            </div>
          </div>
          <p className="text-sm mb-1">
            <span className="text-[#757575]">Vai trò:</span> {ROLE_NAMES[a.roleSlug] || a.roleSlug}
          </p>
          {a.reason && <p className="text-sm text-[#757575] mb-2">Lý do: {a.reason}</p>}
          {tab === 'Chờ duyệt' && (
            <div>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="Ghi chú..." value={notes[a.id] || ''} onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={() => act(a.id, 'approved')} className="flex-1 bg-green-500 text-white rounded-lg py-2 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Duyệt
                </button>
                <button onClick={() => act(a.id, 'rejected')} className="flex-1 border border-red-500 text-red-500 rounded-lg py-2 flex items-center justify-center gap-1">
                  <X className="w-4 h-4" /> Từ chối
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
