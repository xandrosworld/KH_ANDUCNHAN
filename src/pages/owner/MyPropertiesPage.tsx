import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Home } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { isPropertyActive, isPropertySold, propertyStatusLabel } from '../../utils/svpFormat';

const TABS = ['Tất cả', 'Đang xử lý', 'Đã duyệt', 'Đã bán'];
const STATUS_MAP: Record<string, string[]> = { 'Đang xử lý': ['st_new', 'new', 'draft', 'pending'], 'Đã duyệt': ['st_active', 'active'], 'Đã bán': ['st_sold', 'sold'] };

export default function OwnerMyPropertiesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/properties', { params: { createdBy: user?.id } }).then(r => setItems(r.data?.items || [])).catch(() => {}); }, [user?.id]);
  const filtered = tab === 'Tất cả' ? items : items.filter(p => STATUS_MAP[tab]?.includes(p.statusId));
  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Nhà của tôi</h1>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">{TABS.map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t ? 'bg-[#D32F2F] text-white' : 'bg-white text-[#757575] border'}`}>{t}</button>))}</div>
      {filtered.length === 0 ? <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Home className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-[#757575]">Chưa có nhà nào</p></div>
      : filtered.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <h3 className="font-medium">{p.title || 'Nhà chưa đặt tên'}</h3>
          <p className="text-sm text-[#757575]">{p.district || '—'}</p>
          <div className="flex justify-between mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPropertyActive(p.statusId) ? 'bg-green-100 text-green-700' : isPropertySold(p.statusId) ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{propertyStatusLabel(p.statusId)}</span>
            <span className="text-xs text-[#757575]">{p.createdAt?.slice(0, 10)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
