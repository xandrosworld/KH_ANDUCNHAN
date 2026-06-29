import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { formatVndShort, isPropertyActive, propertyStatusLabel } from '../../utils/svpFormat';

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/properties').then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const filtered = items.filter(p => !q || (p.title || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Quản lý nhà</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {filtered.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-[#757575]">{p.code || p.id?.slice(0, 8)}</p>
              <p className="font-medium">{p.title || 'Nhà'}</p>
              <p className="text-sm text-[#D32F2F] font-bold">{formatVndShort(p.price)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full h-fit ${isPropertyActive(p.statusId) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {propertyStatusLabel(p.statusId)}
            </span>
          </div>
          <p className="text-xs text-[#757575] mt-1">{p.district || '—'} · {p.createdAt?.slice(0, 10)}</p>
        </div>
      ))}
    </div>
  );
}
