import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

const DISTRICTS = ['', 'Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Gò Vấp', 'Thủ Đức', 'Tân Bình', 'Phú Nhuận'];
const PROPERTY_TYPES = ['', 'Nhà phố', 'Căn hộ', 'Đất', 'Biệt thự', 'Nhà cho thuê'];

export default function BuyerSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ district: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '', propertyType: '' });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const filterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    const params: Record<string, string | number> = { statusId: 'st_active' };
    if (query.trim()) params.q = query.trim();
    if (filters.district) params.district = filters.district;
    if (filters.priceMin) params.priceMin = Number(filters.priceMin) * 1_000_000;
    if (filters.priceMax) params.priceMax = Number(filters.priceMax) * 1_000_000;
    if (filters.areaMin) params.areaMin = filters.areaMin;
    if (filters.areaMax) params.areaMax = filters.areaMax;
    if (filters.propertyType) params.propertyType = filters.propertyType;

    try {
      const response = await api.get('/properties', { params });
      setResults(response.data?.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setFilters({ district: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '', propertyType: '' });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Kho nhà</p>
          <h1 className="mt-1 text-2xl font-black text-[#25202a]">Tìm nhà phù hợp</h1>
          <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
            Danh sách chỉ hiển thị các thông tin được phép công khai cho khách mua.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9aa1ad]" />
            <input
              className="min-h-12 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold text-[#25202a] outline-none focus:border-[#c40012]"
              placeholder="Khu vực, đường, nhu cầu..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && doSearch()}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`relative grid min-h-12 w-12 place-items-center rounded-2xl border font-black ${
              showFilters ? 'border-[#c40012] bg-[#c40012] text-white' : 'border-gray-200 bg-white text-[#25202a]'
            }`}
            aria-label="Mở bộ lọc"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {filterCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#25202a] text-[11px] text-white">{filterCount}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-[#fff8f6] p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Khu vực" value={filters.district} onChange={(value) => setFilters((f) => ({ ...f, district: value }))} options={DISTRICTS} emptyLabel="Tất cả khu vực" />
              <Select label="Loại nhà" value={filters.propertyType} onChange={(value) => setFilters((f) => ({ ...f, propertyType: value }))} options={PROPERTY_TYPES} emptyLabel="Tất cả loại nhà" />
              <Field label="Diện tích từ" value={filters.areaMin} onChange={(value) => setFilters((f) => ({ ...f, areaMin: value }))} placeholder="VD: 50" />
              <Field label="Diện tích đến" value={filters.areaMax} onChange={(value) => setFilters((f) => ({ ...f, areaMax: value }))} placeholder="VD: 120" />
              <Field label="Giá từ (triệu)" value={filters.priceMin} onChange={(value) => setFilters((f) => ({ ...f, priceMin: value }))} placeholder="VD: 3000" />
              <Field label="Giá đến (triệu)" value={filters.priceMax} onChange={(value) => setFilters((f) => ({ ...f, priceMax: value }))} placeholder="VD: 8000" />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={doSearch} className="min-h-11 flex-1 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white">
                Áp dụng
              </button>
              <button type="button" onClick={resetFilters} className="grid min-h-11 w-12 place-items-center rounded-2xl border border-gray-200 bg-white text-[#747b88]" aria-label="Xóa bộ lọc">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-[#25202a]">
            {loading ? 'Đang tải nguồn nhà...' : `${results.length} nguồn nhà phù hợp`}
          </p>
          {searched && !loading && <button onClick={doSearch} className="text-sm font-black text-[#c40012]">Làm mới</button>}
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <ResultSkeleton key={index} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <Search className="mx-auto h-12 w-12 text-red-200" />
            <p className="mt-3 font-black text-[#25202a]">Chưa tìm thấy nguồn phù hợp</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Thử nới ngân sách, khu vực hoặc lưu nhu cầu để chuyên viên hỗ trợ.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => <ResultCard key={item.id} item={item} onClick={() => navigate(`/nha/${item.id}`)} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#6f5a5a]">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, emptyLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; emptyLabel: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-[#6f5a5a]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#c40012]">
        {options.map((option, index) => <option key={`${label}-${option || 'all'}`} value={option}>{index === 0 ? emptyLabel : option}</option>)}
      </select>
    </label>
  );
}

function ResultCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-[#c40012] sm:h-28 sm:w-28">
        <Home className="h-7 w-7 opacity-45" />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="font-black text-[#c40012]">{formatVndShort(item.price)}</p>
        <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-[#25202a]">{item.title || 'Nhà cần bán'}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)} · {item.extra?.bedrooms || '-'} PN · {item.extra?.floors || '-'} tầng</p>
      </div>
    </button>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:h-28 sm:w-28" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
