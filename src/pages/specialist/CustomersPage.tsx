import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Plus } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { customerStatusLabel } from '../../utils/svpFormat';

const TABS = ['Tất cả', 'Mới', 'Đang liên hệ', 'Đang dẫn xem', 'Đã cọc', 'Hoàn thành'];
const STATUS_MAP: Record<string, string[]> = {
  'Mới': ['cs_new', 'new'],
  'Đang liên hệ': ['cs_contacted', 'contacted'],
  'Đang dẫn xem': ['cs_viewing', 'viewing'],
  'Đã cọc': ['cs_deposit', 'deposit'],
  'Hoàn thành': ['cs_done', 'done'],
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/customers').then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const filtered = (tab === 'Tất cả' ? items : items.filter(c => STATUS_MAP[tab]?.includes(c.statusId || c.status)))
    .filter(c => !q || (c.fullName || c.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Khách hàng</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm khách..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t ? 'bg-[#D32F2F] text-white' : 'bg-white text-[#757575] border'}`}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Chưa có khách hàng</p>
        </div>
      ) : filtered.map((c: any) => (
        <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <h3 className="font-medium">{c.fullName || c.name}</h3>
          <p className="text-sm text-[#757575]">{c.phone} · {c.source || '—'}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-1 inline-block">{customerStatusLabel(c.statusId || c.status)}</span>
        </div>
      ))}
      <button onClick={() => navigate('/chuyen-vien/them-khach')} className="fixed bottom-20 right-4 w-14 h-14 bg-[#D32F2F] text-white rounded-full shadow-lg flex items-center justify-center lg:bottom-6">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
