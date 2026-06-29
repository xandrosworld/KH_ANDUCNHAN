import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function SearchPropertyPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/properties', { params: { statusId: 'st_active' } }).then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const filtered = items.filter(p => !q || (p.title || '').toLowerCase().includes(q.toLowerCase()) || (p.district || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Tìm nhà cho khách</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm theo khu vực..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {filtered.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-[#D32F2F]/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D32F2F] font-bold text-sm">{formatVndShort(p.price)}</p>
            <p className="font-medium truncate">{p.title || 'Nhà'}</p>
            <p className="text-xs text-[#757575]">{p.district || '—'} · {areaText(p)}</p>
          </div>
          <button onClick={() => navigate(`/nha/${p.id}`)} className="text-xs bg-[#D32F2F] text-white px-3 py-1 rounded-lg self-center whitespace-nowrap">Chọn</button>
        </div>
      ))}
    </div>
  );
}
