import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, Home, Key, Building2, Newspaper, MessageCircle } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

const QUICK_ACTIONS = [
  { icon: Map, label: 'Bản đồ', color: 'bg-blue-100 text-blue-600' },
  { icon: Home, label: 'Mua bán', color: 'bg-green-100 text-green-600' },
  { icon: Key, label: 'Cho thuê', color: 'bg-purple-100 text-purple-600' },
  { icon: Building2, label: 'Dự án', color: 'bg-orange-100 text-orange-600' },
  { icon: Newspaper, label: 'Tin tức', color: 'bg-cyan-100 text-cyan-600' },
  { icon: MessageCircle, label: 'Tư vấn', color: 'bg-pink-100 text-pink-600' },
];

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  useEffect(() => { api.get('/properties', { params: { statusId: 'st_active', limit: 10 } }).then(r => setProperties(r.data?.items || [])).catch(() => {}); }, []);

  return (
    <div className="p-4 pb-20">
      <button onClick={() => navigate('/khach-mua/tim-nha')} className="w-full bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 mb-6 border">
        <Search className="w-5 h-5 text-[#757575]" /><span className="text-[#757575]">Tìm nhà theo khu vực, giá...</span>
      </button>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => navigate('/khach-mua/tim-nha')} className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center`}><a.icon className="w-5 h-5" /></div>
            <span className="text-xs text-[#212121]">{a.label}</span>
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">Nhà mới đăng</h2>
      <div className="flex overflow-x-auto gap-3 mb-6 pb-2">
        {properties.slice(0, 6).map((p: any) => (
          <div key={p.id} onClick={() => navigate(`/nha/${p.id}`)} className="bg-white rounded-xl shadow-sm min-w-[220px] cursor-pointer overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center"><Home className="w-8 h-8 text-[#D32F2F]/30" /></div>
            <div className="p-3">
              <p className="text-[#D32F2F] font-bold">{formatVndShort(p.price)}</p>
              <p className="text-sm text-[#212121] font-medium truncate">{p.title || 'Nhà đẹp'}</p>
              <p className="text-xs text-[#757575]">{p.district || '—'} · {areaText(p)}</p>
            </div>
          </div>
        ))}
        {properties.length === 0 && <p className="text-[#757575] text-sm">Đang tải...</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Gợi ý cho bạn</h2>
      {properties.slice(0, 4).map((p: any) => (
        <div key={p.id} onClick={() => navigate(`/nha/${p.id}`)} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex gap-3 cursor-pointer">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center shrink-0"><Home className="w-6 h-6 text-[#D32F2F]/30" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D32F2F] font-bold text-sm">{formatVndShort(p.price)}</p>
            <p className="font-medium truncate">{p.title || 'Nhà đẹp'}</p>
            <p className="text-xs text-[#757575]">{p.district || '—'} · {areaText(p)} · {p.extra?.bedrooms || '—'} PN</p>
          </div>
        </div>
      ))}
    </div>
  );
}
