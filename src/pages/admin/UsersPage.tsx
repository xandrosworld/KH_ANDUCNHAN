import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

const ROLE_NAMES: Record<string, string> = {
  admin: 'Quản trị viên', giam_doc: 'Giám đốc', truong_phong: 'Trưởng phòng', chuyen_gia: 'Chuyên gia', chuyen_vien: 'Chuyên viên',
  ctv_khach: 'CTV khách', ctv_nguon: 'CTV nguồn', chu_nha: 'Chủ nhà', khach_mua: 'Khách mua',
  nguoi_gioi_thieu: 'Người giới thiệu', doi_tac: 'Đối tác',
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const filtered = items.filter(u => !q || (u.fullName || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').includes(q));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Quản lý người dùng</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Không có người dùng</p>
        </div>
      ) : filtered.map((u: any) => (
        <div key={u.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFCDD2] flex items-center justify-center text-[#D32F2F] font-bold">
              {(u.fullName || '?')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{u.fullName}</p>
              <p className="text-xs text-[#757575]">{u.email} · {u.svpId || ''}</p>
            </div>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {(u.roles || []).map((r: any) => (
              <span key={r.slug} className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {ROLE_NAMES[r.slug] || r.slug}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
