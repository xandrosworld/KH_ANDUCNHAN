import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { customerStatusLabel } from '../../utils/svpFormat';

export default function AdminCustomersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/customers').then(r => setItems(r.data?.items || [])).catch(() => {});
  }, []);

  const filtered = items.filter(c => !q || (c.fullName || c.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Quản lý khách hàng</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#757575]">Chưa có khách hàng</p>
        </div>
      ) : filtered.map((c: any) => (
        <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <p className="font-medium">{c.fullName || c.name}</p>
          <p className="text-sm text-[#757575]">{c.phone} · {customerStatusLabel(c.statusId || c.status)}</p>
        </div>
      ))}
    </div>
  );
}
