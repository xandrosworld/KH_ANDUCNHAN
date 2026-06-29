import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Home } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function BuyerSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ district: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '', propertyType: '' });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = () => {
    setLoading(true);
    const params: any = { statusId: 'st_active', q: query };
    if (filters.district) params.district = filters.district;
    if (filters.priceMin) params.priceMin = Number(filters.priceMin) * 1_000_000;
    if (filters.priceMax) params.priceMax = Number(filters.priceMax) * 1_000_000;
    if (filters.areaMin) params.areaMin = filters.areaMin;
    if (filters.areaMax) params.areaMax = filters.areaMax;
    api.get('/properties', { params }).then(r => setResults(r.data?.items || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    api.get('/properties', { params: { statusId: 'st_active' } })
      .then(r => setResults(r.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 pb-20">
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative"><Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" /><input className="w-full pl-10 pr-3 py-2.5 border rounded-xl" placeholder="Tìm theo khu vực, đường..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} /></div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border ${showFilters ? 'bg-[#D32F2F] text-white border-[#D32F2F]' : ''}`}><SlidersHorizontal className="w-5 h-5" /></button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          <select className="w-full border rounded-lg px-3 py-2" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}>
            <option value="">Tất cả khu vực</option><option value="Quận 1">Quận 1</option><option value="Quận 2">Quận 2</option><option value="Quận 7">Quận 7</option><option value="Thủ Đức">Thủ Đức</option><option value="Bình Thạnh">Bình Thạnh</option><option value="Gò Vấp">Gò Vấp</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Giá từ (triệu)" type="number" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Giá đến (triệu)" type="number" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))} />
          </div>
          <button onClick={doSearch} className="w-full bg-[#D32F2F] text-white rounded-lg py-2.5 font-medium">Tìm kiếm</button>
        </div>
      )}

      {loading ? <p className="text-center text-[#757575]">Đang tải...</p> : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Search className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-[#757575]">Không tìm thấy kết quả phù hợp</p></div>
      ) : results.map((p: any) => (
        <div key={p.id} onClick={() => navigate(`/nha/${p.id}`)} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex gap-3 cursor-pointer">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center shrink-0"><Home className="w-6 h-6 text-[#D32F2F]/30" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D32F2F] font-bold">{formatVndShort(p.price)}</p>
            <p className="font-medium truncate">{p.title || 'Nhà'}</p>
            <p className="text-xs text-[#757575]">{p.district || '—'} · {areaText(p)} · {p.extra?.bedrooms || '—'} PN</p>
          </div>
        </div>
      ))}
    </div>
  );
}
