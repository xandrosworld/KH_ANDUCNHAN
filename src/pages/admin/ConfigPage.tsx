import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function AdminConfigPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    api.get('/config').then(r => setGroups(r.data?.groups || r.data?.items || [])).catch(() => {});
  }, []);

  const toggle = (g: string) => setExpanded(e => e.includes(g) ? e.filter(x => x !== g) : [...e, g]);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Cấu hình hệ thống</h1>
      {groups.length === 0 ? (
        <p className="text-[#757575]">Chưa có cấu hình</p>
      ) : groups.map((g: any) => (
        <div key={g.group || g.id} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
          <button onClick={() => toggle(g.group || g.id)} className="w-full flex justify-between items-center p-4">
            <span className="font-semibold">{g.name || g.group || g.label || 'Nhóm cấu hình'}</span>
            {expanded.includes(g.group || g.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expanded.includes(g.group || g.id) && (
            <div className="border-t px-4 pb-4">
              {(g.options || g.items || []).map((o: any) => (
                <div key={o.key || o.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{o.label || o.key}</p>
                    <p className="text-xs text-[#757575]">{o.value || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {o.isActive === false ? 'Tạm ẩn' : 'Đang dùng'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
