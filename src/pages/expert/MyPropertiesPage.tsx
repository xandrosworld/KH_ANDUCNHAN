import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort, isPropertyActive, isPropertySold, propertyStatusLabel } from '../../utils/svpFormat';

const TABS = ['Tất cả', 'Mới đăng', 'Đang bán', 'Đã cọc', 'Đã bán', 'Tạm dừng', 'Ẩn'];
const STATUS_MAP: Record<string, string[]> = {
  'Mới đăng': ['st_new', 'new', 'draft', 'pending'],
  'Đang bán': ['st_active', 'active'],
  'Đã cọc': ['st_deposit', 'deposit'],
  'Đã bán': ['st_sold', 'sold'],
  'Tạm dừng': ['st_paused', 'paused'],
  'Ẩn': ['st_hidden', 'hidden'],
};

export default function ExpertMyPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/properties', { params: { createdBy: user?.id } }).then(r => setItems(r.data?.items || [])).catch(() => {}); }, [user?.id]);
  const filtered = tab === 'Tất cả' ? items : items.filter(p => STATUS_MAP[tab]?.includes(p.statusId));

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4"><h1 className="text-xl font-bold">Kho nhà</h1></div>
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">{TABS.map(t => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${tab === t ? 'bg-[#D32F2F] text-white' : 'bg-white text-[#757575] border'}`}>{t}</button>))}</div>
      {filtered.length === 0 ? <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Home className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-[#757575]">Chưa có nhà nào</p></div>
      : filtered.map((p: any) => (
        <div key={p.id} onClick={() => navigate(`/chuyen-gia/nha/${p.id}`)} className="bg-white rounded-xl shadow-sm p-4 mb-3 cursor-pointer">
          <div className="flex justify-between items-start">
            <div><p className="text-xs text-[#757575]">{p.code || p.id?.slice(0,8)}</p><h3 className="font-medium">{p.title || 'Nhà'}</h3><p className="text-[#D32F2F] font-bold text-sm">{formatVndShort(p.price)}</p></div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPropertyActive(p.statusId) ? 'bg-green-100 text-green-700' : isPropertySold(p.statusId) ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{propertyStatusLabel(p.statusId)}</span>
          </div>
          <p className="text-xs text-[#757575] mt-1">{p.district || '—'} · {areaText(p)} · {p.createdAt?.slice(0, 10)}</p>
        </div>
      ))}
      <button onClick={() => navigate('/chuyen-gia/dang-nha')} className="fixed bottom-20 right-4 w-14 h-14 bg-[#D32F2F] text-white rounded-full shadow-lg flex items-center justify-center lg:bottom-6"><Plus className="w-6 h-6" /></button>
    </div>
  );
}
