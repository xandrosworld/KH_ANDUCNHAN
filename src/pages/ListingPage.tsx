import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';
import PageShell from '../components/PageShell';
import PropertyCard from '../components/PropertyCard';
import { properties as staticProperties } from '../data/properties';
import { useCompare } from '../contexts/CompareContext';
import { isApiConfigured } from '../services/apiClient';
import { listProperties } from '../services/propertyApi';
import type { Property } from '../data/properties';
import { useLanguage } from '../contexts/LanguageContext';

interface ListingPageProps {
  mode?: 'buy' | 'rent';
}

const PRICE_RANGES_SALE = [
  { labelKey: 'filter.anyPriceSale', min: 0, max: Infinity },
  { labelKey: 'filter.under500k', min: 0, max: 500000 },
  { labelKey: 'filter.500k1m', min: 500000, max: 1000000 },
  { labelKey: 'filter.1m2m', min: 1000000, max: 2000000 },
  { labelKey: 'filter.2mPlus', min: 2000000, max: Infinity },
];

const PRICE_RANGES_RENT = [
  { labelKey: 'filter.anyPriceSale', min: 0, max: Infinity },
  { labelKey: 'filter.under2500', min: 0, max: 2500 },
  { labelKey: 'filter.25004000', min: 2500, max: 4000 },
  { labelKey: 'filter.40006000', min: 4000, max: 6000 },
  { labelKey: 'filter.6000Plus', min: 6000, max: Infinity },
];

const HOME_TYPES = [
  { value: 'Any Type', labelKey: 'filter.anyType' },
  { value: 'Single Family', labelKey: 'type.singleFamily' },
  { value: 'Condo', labelKey: 'type.condo' },
  { value: 'Townhouse', labelKey: 'type.townhouse' },
];

const ListingPage = ({ mode = 'buy' }: ListingPageProps) => {
  const isBuy = mode === 'buy';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Filter state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [priceIdx, setPriceIdx] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [homeType, setHomeType] = useState('Any Type');
  const [minSqft, setMinSqft] = useState(0);
  const [maxSqft, setMaxSqft] = useState(0);

  const { t } = useLanguage();
  const { compareIds } = useCompare();

  const heading = isBuy ? t('page.homesSale') : t('page.homesRent');
  usePageTitle(heading);
  const subtitle = isBuy
    ? t('page.homesSale')
    : t('page.homesRent');
  const priceRanges = isBuy ? PRICE_RANGES_SALE : PRICE_RANGES_RENT;
  const listingType = isBuy ? 'sale' : 'rent';
  const selectedTypeLabel = HOME_TYPES.find((type) => type.value === homeType)?.labelKey;
  const formatMessage = (key: string, values: Record<string, string | number>) => (
    Object.entries(values).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, String(value)),
      t(key),
    )
  );

  const togglePanel = useCallback((panel: string) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  // ── Fetch API properties if configured ──
  const [apiProperties, setApiProperties] = useState<Property[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setApiLoading(true);
      listProperties({ listingType })
        .then((result) => {
          const data = result.data as unknown;
          const rows = Array.isArray(data)
            ? data
            : (data && typeof data === 'object' && Array.isArray((data as { properties?: unknown }).properties)
                ? (data as { properties: unknown[] }).properties
                : []);

          if (!cancelled && result.ok) {
            // Map API snake_case fields to frontend camelCase Property shape
            const mapped = (rows as Record<string, unknown>[]).map((p) => ({
              id: String(p.id ?? ''),
              image: String(p.main_image ?? p.image ?? ''),
              tag: String(p.tag ?? 'New Listing'),
              tagColor: String(p.tagColor ?? p.tag_color ?? 'bg-emerald-600'),
              price: typeof p.price === 'number'
                ? (listingType === 'rent' ? `$${Number(p.price).toLocaleString()}/mo` : `$${Number(p.price).toLocaleString()}`)
                : String(p.price ?? '$0'),
              numericPrice: Number(p.price ?? p.numericPrice ?? 0),
              bds: Number(p.bedrooms ?? p.bds ?? 0),
              ba: Number(p.bathrooms ?? p.ba ?? 0),
              sqft: p.sqft ? String(p.sqft) : '0',
              status: String(p.status ?? (listingType === 'rent' ? 'For Rent' : 'For Sale')),
              listingType: String(p.listing_type ?? p.listingType ?? listingType) as 'sale' | 'rent',
              address: String(p.address ?? ''),
              city: String(p.city ?? ''),
              state: String(p.state ?? ''),
              propertyType: String(p.property_type ?? p.propertyType ?? 'Single Family'),
              mls: String(p.mls ?? ''),
              description: String(p.description ?? ''),
              isVip: Boolean(p.is_vip ?? p.isVip),
              expiresAt: p.expires_at ? String(p.expires_at) : (p.expiresAt ? String(p.expiresAt) : undefined),
              images: Array.isArray(p.images) ? p.images as string[] : undefined,
              videoUrl: p.video_url ? String(p.video_url) : (p.videoUrl ? String(p.videoUrl) : undefined),
            } as Property));
            setApiProperties(mapped);
          }
        })
        .catch((err) => {
          console.warn('[ListingPage] API fetch failed, using static/localStorage data', err);
        })
        .finally(() => {
          if (!cancelled) setApiLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, [listingType]);

  const filtered = useMemo(() => {
    const selectedPrice = priceRanges[priceIdx];

    // Merge: API properties + static + localStorage mock listings
    // Use a Set to deduplicate by id
    const seen = new Set<string>();
    const allProperties: Property[] = [];

    // API properties first (freshest)
    for (const p of apiProperties) {
      if (!seen.has(p.id)) { seen.add(p.id); allProperties.push(p); }
    }

    // Only include static/localStorage listings if API is NOT configured
    if (!isApiConfigured()) {
      // Static properties
      for (const p of staticProperties) {
        if (!seen.has(p.id)) { seen.add(p.id); allProperties.push(p); }
      }

      // localStorage mock listings
      try {
        const mockRaw = localStorage.getItem('gf_mock_listings');
        if (mockRaw) {
          const mockListings = JSON.parse(mockRaw) as Property[];
          for (const p of mockListings) {
            if (!seen.has(p.id)) { seen.add(p.id); allProperties.push(p); }
          }
        }
      } catch { /* ignore */ }
    }

    return allProperties.filter((p) => {
      // Listing type
      if (p.listingType !== listingType) return false;

      // Text search
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchesSearch =
          p.city.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.propertyType.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Price
      if (selectedPrice && (p.numericPrice < selectedPrice.min || p.numericPrice > selectedPrice.max)) {
        return false;
      }

      // Beds
      if (minBeds > 0 && p.bds < minBeds) return false;

      // Baths
      if (minBaths > 0 && p.ba < minBaths) return false;

      // Home type
      if (homeType !== 'Any Type' && p.propertyType !== homeType) return false;

      // Area
      const sqftNum = typeof p.sqft === 'string' ? Number(p.sqft.replace(/,/g, '')) : (p.numericSqft || 0);
      if (minSqft > 0 && sqftNum < minSqft) return false;
      if (maxSqft > 0 && sqftNum > maxSqft) return false;

      return true;
    });
  }, [query, priceIdx, minBeds, minBaths, homeType, minSqft, maxSqft, listingType, priceRanges, apiProperties]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = query.replace(/[^a-zA-Z0-9\s,.-]/g, '').trim();
    if (sanitized) {
      setSearchParams({ q: sanitized });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  const resetFilters = () => {
    setPriceIdx(0);
    setMinBeds(0);
    setMinBaths(0);
    setHomeType('Any Type');
    setMinSqft(0);
    setMaxSqft(0);
    setQuery('');
    setSearchParams({});
    setActivePanel(null);
  };

  const hasActiveFilters = priceIdx > 0 || minBeds > 0 || minBaths > 0 || homeType !== 'Any Type' || minSqft > 0 || maxSqft > 0;

  // Chip definitions
  const chips = [
    { key: 'listing', label: isBuy ? t('filter.forSale') : t('filter.forRent'), active: true, panel: null },
    { key: 'price', label: priceIdx > 0 ? t(priceRanges[priceIdx].labelKey) : t('filter.price'), active: priceIdx > 0, panel: 'price' },
    { key: 'beds', label: minBeds > 0 || minBaths > 0 ? `${minBeds}+ ${t('prop.bedShort')} / ${minBaths}+ ${t('prop.ba')}` : t('filter.beds'), active: minBeds > 0 || minBaths > 0, panel: 'beds' },
    { key: 'type', label: homeType !== 'Any Type' && selectedTypeLabel ? t(selectedTypeLabel) : t('filter.type'), active: homeType !== 'Any Type', panel: 'type' },
    { key: 'area', label: (minSqft > 0 || maxSqft > 0) ? `${minSqft > 0 ? minSqft.toLocaleString() : '0'}-${maxSqft > 0 ? maxSqft.toLocaleString() : '∞'} ${t('prop.sqft')}` : t('filter.area'), active: minSqft > 0 || maxSqft > 0, panel: 'area' },
  ];

  return (
    <PageShell raw>
      {/* Page Header */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 min-w-0">
        <h1
          className="hero-gold-text font-extrabold mb-2 break-words"
          style={{ fontSize: 'clamp(26px, 5vw, 38px)' }}
        >
          {heading}
        </h1>
        <p className="text-[#A7ABB6] text-[14px] sm:text-[15px] mb-5 max-w-[600px] break-words">
          {subtitle}
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative flex h-12 w-full max-w-[640px] items-center rounded-xl bg-[#15151D] border border-white/[0.085] shadow-lg overflow-hidden focus-within:border-[#B88717]/50 transition-colors mb-4 min-w-0"
        >
          <Search className="ml-4 mr-2 h-[18px] w-[18px] text-[#7D8291] flex-shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className="flex-1 h-full bg-transparent text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:outline-none pr-2 min-w-0 w-full"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="mr-2 p-1.5 rounded-full text-[#7D8291] hover:text-[#F5F0E6] hover:bg-white/[0.06] transition-colors flex-shrink-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="h-full px-3 sm:px-4 bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.search')}</span>
          </button>
        </form>

        {/* Filter Chips */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-2 mb-2 pb-1.5 min-w-0 w-full scrollbar-hide">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => chip.panel && togglePanel(chip.panel)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium border transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                  chip.active
                    ? 'bg-[#B88717]/15 border-[#B88717]/40 text-[#F6D37A]'
                    : 'bg-white/[0.035] border-white/[0.085] text-[#D7DAE3] hover:border-[#B88717]/30 hover:text-[#F6D37A]'
                }`}
              >
                {chip.label}
                {chip.panel && <ChevronDown className={`h-3 w-3 transition-transform ${activePanel === chip.panel ? 'rotate-180' : ''}`} />}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {t('filter.clearAll')}
              </button>
            )}
          </div>

          {/* Filter Panels */}
          {activePanel === 'price' && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl p-3 min-w-[200px] max-w-[calc(100vw-32px)]">
              {priceRanges.map((range, idx) => (
                <button
                  key={range.labelKey}
                  type="button"
                  onClick={() => { setPriceIdx(idx); setActivePanel(null); }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    priceIdx === idx
                      ? 'bg-[#B88717]/15 text-[#F6D37A]'
                      : 'text-[#D7DAE3] hover:bg-white/[0.06]'
                  }`}
                >
                  {t(range.labelKey)}
                </button>
              ))}
            </div>
          )}

          {activePanel === 'beds' && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl p-4 min-w-[240px] max-w-[calc(100vw-32px)]">
              <div className="mb-3">
                <div className="text-[12px] text-[#7D8291] uppercase tracking-wide mb-2">{t('filter.bedrooms')}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={`bed-${n}`}
                      type="button"
                      onClick={() => setMinBeds(n)}
                      className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors min-w-[40px] ${
                        minBeds === n
                          ? 'bg-[#B88717] text-[#030405]'
                          : 'bg-white/[0.04] text-[#D7DAE3] hover:bg-white/[0.08]'
                      }`}
                    >
                      {n === 0 ? t('filter.any') : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-[#7D8291] uppercase tracking-wide mb-2">{t('filter.bathrooms')}</div>
                <div className="flex gap-1.5 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={`bath-${n}`}
                      type="button"
                      onClick={() => setMinBaths(n)}
                      className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors min-w-[40px] ${
                        minBaths === n
                          ? 'bg-[#B88717] text-[#030405]'
                          : 'bg-white/[0.04] text-[#D7DAE3] hover:bg-white/[0.08]'
                      }`}
                    >
                      {n === 0 ? t('filter.any') : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="mt-3 w-full py-2 rounded-lg bg-[#B88717] hover:bg-[#D4A020] text-[#030405] text-[13px] font-semibold transition-colors"
              >
                {t('filter.apply')}
              </button>
            </div>
          )}

          {activePanel === 'type' && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl p-3 min-w-[180px] max-w-[calc(100vw-32px)]">
              {HOME_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => { setHomeType(type.value); setActivePanel(null); }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    homeType === type.value
                      ? 'bg-[#B88717]/15 text-[#F6D37A]'
                      : 'text-[#D7DAE3] hover:bg-white/[0.06]'
                  }`}
                >
                  {t(type.labelKey)}
                </button>
              ))}
            </div>
          )}

          {activePanel === 'area' && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-[#15151D] border border-white/[0.12] rounded-xl shadow-2xl p-4 min-w-[260px] max-w-[calc(100vw-32px)]">
              <div className="text-[12px] text-[#7D8291] uppercase tracking-wide mb-3">{t('filter.areaSqft')}</div>
              <div className="flex gap-3 mb-3">
                <input type="number" placeholder={t('filter.min')} value={minSqft || ''} onChange={(e) => setMinSqft(Number(e.target.value) || 0)} className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-lg text-[#F5F0E6] placeholder-[#7D8291] px-3 py-2 text-[13px] focus:border-[#B88717]/50 focus:outline-none" />
                <input type="number" placeholder={t('filter.max')} value={maxSqft || ''} onChange={(e) => setMaxSqft(Number(e.target.value) || 0)} className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-lg text-[#F5F0E6] placeholder-[#7D8291] px-3 py-2 text-[13px] focus:border-[#B88717]/50 focus:outline-none" />
              </div>
              <button type="button" onClick={() => setActivePanel(null)} className="w-full py-2 rounded-lg bg-[#B88717] hover:bg-[#D4A020] text-[#030405] text-[13px] font-semibold transition-colors">{t('filter.apply')}</button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="text-[13px] text-[#7D8291] py-2 break-words">
          {apiLoading && <span className="inline-flex items-center gap-1 mr-2 text-[#B88717]"><Loader2 className="w-3 h-3 animate-spin" />{t('common.loadingInline')}</span>}
          {filtered.length} {filtered.length === 1 ? t('filter.result') : t('filter.results')}
          {query.trim() && (
            <span>
              {' '}{t('common.for')} "<span className="text-[#D7DAE3]">{query.trim()}</span>"
            </span>
          )}
        </div>
      </div>

      {/* Property Grid */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12 min-w-0">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((prop) => (
              <div key={prop.id} className="min-w-0">
                <PropertyCard
                  id={prop.id}
                  image={prop.image}
                  tag={prop.tag}
                  tagColor={prop.tagColor}
                  price={prop.price}
                  numericPrice={prop.numericPrice}
                  listingType={prop.listingType}
                  bds={prop.bds}
                  ba={prop.ba}
                  sqft={prop.sqft}
                  status={prop.status}
                  address={prop.address}
                  mls={prop.mls}
                  isVip={prop.isVip}
                  expiresAt={prop.expiresAt}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#15151D] border border-white/[0.085] flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-[#7D8291]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#F6D37A] mb-2">{t('common.noHomes')}</h2>
            <p className="text-[14px] text-[#7D8291] max-w-[400px] mb-5 break-words">
              {t('listing.noMatches')}
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)]"
            >
              {t('btn.clearFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Compare Floating Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#15151D] border border-[#B88717]/30 rounded-full px-5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center gap-3">
          <span className="text-[#F6D37A] text-[13px] font-medium">{formatMessage('listing.compareSelected', { count: compareIds.length })}</span>
          <Link to="/compare" className="px-4 py-1.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] text-[12px] font-semibold transition-colors">{t('btn.compare')}</Link>
        </div>
      )}
    </PageShell>
  );
};

export default ListingPage;
