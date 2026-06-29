import { useState, useEffect } from 'react';
import { Heart, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';

export default function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/favorites').then(r => setItems(r.data?.items || [])).catch(() => {}); }, []);
  const removeFav = async (id: string) => { await api.delete(`/favorites/${id}`).catch(() => {}); setItems(items.filter(i => i.id !== id)); };
  const formatPrice = (p: number) => p >= 1e9 ? `${(p / 1e9).toFixed(1)} tỷ` : `${(p / 1e6).toFixed(0)} triệu`;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Nhà yêu thích</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-[#757575]">Bạn chưa lưu nhà nào</p></div>
      ) : items.map((p: any) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex gap-3">
          <div onClick={() => navigate(`/nha/${p.propertyId || p.id}`)} className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center shrink-0 cursor-pointer"><Home className="w-6 h-6 text-[#D32F2F]/30" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D32F2F] font-bold">{formatPrice(p.price || 0)}</p>
            <p className="font-medium truncate">{p.title || 'Nhà'}</p>
            <p className="text-xs text-[#757575]">{p.district || '—'}</p>
          </div>
          <button onClick={() => removeFav(p.id)} className="text-[#D32F2F] self-start"><Heart className="w-5 h-5 fill-[#D32F2F]" /></button>
        </div>
      ))}
    </div>
  );
}
