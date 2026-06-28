import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { ArrowLeft, X, ExternalLink } from 'lucide-react';
import PageShell from '../components/PageShell';
import { useCompare } from '../contexts/CompareContext';
import { properties, type Property } from '../data/properties';
import { isApiConfigured } from '../services/apiClient';
import { useLanguage } from '../contexts/LanguageContext';

const ComparePage = () => {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();
  usePageTitle(t('compare.title'));

  const formatMessage = (key: string, values: Record<string, string | number>) => (
    Object.entries(values).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, String(value)),
      t(key),
    )
  );
  const renderStatus = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'for sale') return t('prop.forSale');
    if (normalized === 'for rent') return t('prop.forRent');
    if (normalized === 'active') return t('status.active');
    if (normalized === 'pending') return t('status.pending');
    if (normalized === 'hidden') return t('status.hidden');
    if (normalized === 'expired') return t('status.expired');
    return status;
  };
  const renderType = (type: string) => {
    if (type === 'Single Family') return t('type.singleFamily');
    if (type === 'Condo') return t('type.condo');
    if (type === 'Townhouse') return t('type.townhouse');
    return type;
  };

  // Merge static + localStorage listings (demo mode only)
  const allProperties = (() => {
    if (isApiConfigured()) return [] as Property[];
    let all = [...properties];
    try {
      const mockRaw = localStorage.getItem('gf_mock_listings');
      if (mockRaw) all = [...all, ...JSON.parse(mockRaw)];
    } catch { /* ignore */ }
    return all;
  })();

  const compareProps: Property[] = compareIds
    .map((id) => allProperties.find((p) => p.id === id))
    .filter((p): p is Property => Boolean(p));

  const fields: { label: string; isPrice?: boolean; render: (p: (typeof properties)[0]) => string }[] = [
    { label: t('filter.price'), isPrice: true, render: (p) => p.price },
    { label: t('compare.field.status'), render: (p) => renderStatus(p.status) },
    { label: t('compare.field.type'), render: (p) => renderType(p.propertyType) },
    { label: t('filter.bedrooms'), render: (p) => String(p.bds) },
    { label: t('filter.bathrooms'), render: (p) => String(p.ba) },
    { label: t('filter.area'), render: (p) => `${p.sqft} ${t('prop.sqft')}` },
    { label: t('compare.field.city'), render: (p) => p.city },
    { label: t('compare.field.state'), render: (p) => p.state },
    { label: t('compare.field.address'), render: (p) => p.address },
    { label: t('compare.field.yearBuilt'), render: (p) => p.yearBuilt ? String(p.yearBuilt) : '—' },
    { label: t('compare.field.lotSize'), render: (p) => p.lotSize || '—' },
    { label: t('compare.field.priceSqft'), render: (p) => p.pricePerSqft ? `$${p.pricePerSqft}/${t('prop.sqft')}` : '—' },
    { label: t('compare.field.hoaFee'), render: (p) => p.hoaFee ? `$${p.hoaFee}${t('prop.perMonth')}` : t('compare.none') },
    { label: t('prop.vip'), render: (p) => p.isVip ? `⭐ ${t('prop.vip')}` : t('prop.standard') },
    { label: 'MLS', render: (p) => p.mls },
  ];

  return (
    <PageShell raw>
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-16 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <Link
              to="/buy"
              className="inline-flex items-center gap-1.5 text-[#7D8291] text-[13px] hover:text-[#F6D37A] transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('compare.backToListings')}
            </Link>
            <h1
              className="hero-gold-text font-extrabold break-words"
              style={{ fontSize: 'clamp(24px, 5vw, 36px)' }}
            >
              {t('compare.title')}
            </h1>
            <p className="text-[#A7ABB6] text-[14px] mt-1">
              {formatMessage('compare.selectedCount', { count: compareProps.length })}
            </p>
          </div>
          {compareProps.length > 0 && (
            <button
              onClick={clearCompare}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-[13px] font-medium hover:bg-red-500/20 transition-colors border border-red-500/20 flex-shrink-0"
            >
              {t('compare.clearAll')}
            </button>
          )}
        </div>

        {compareProps.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4 pb-4">
            <table className="w-full min-w-[600px]">
              {/* Property Images Row */}
              <thead>
                <tr className="border-b border-white/[0.085]">
                  <th className="w-[140px] sm:w-[160px] p-3 text-left text-[#7D8291] text-[12px] font-medium uppercase tracking-wide sticky left-0 bg-[#030405] z-10">
                    {t('compare.property')}
                  </th>
                  {compareProps.map((prop) =>
                    prop ? (
                      <th key={prop.id} className="p-3 min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(prop.id)}
                            className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-[#15151D] border border-white/[0.12] flex items-center justify-center text-[#7D8291] hover:text-red-400 hover:border-red-400/30 transition-colors"
                            aria-label="Remove from compare"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <div className="rounded-xl overflow-hidden border border-white/[0.085] mb-3" style={{ paddingBottom: '60%', position: 'relative' }}>
                            <img
                              src={prop.image}
                              alt={prop.address}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                            {prop.isVip && (
                              <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#B88717]/90 text-white text-[10px] font-bold">
                                ⭐ VIP
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/property/${prop.id}`}
                            className="inline-flex items-center gap-1 text-[#F6D37A] text-[12px] font-medium hover:text-[#FFE8A3] transition-colors"
                          >
                            {t('compare.viewDetails')} <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </th>
                    ) : null,
                  )}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody>
                {fields.map((field, idx) => (
                  <tr
                    key={field.label}
                    className={`border-b border-white/[0.06] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
                  >
                    <td className="p-3 text-[#7D8291] text-[12px] sm:text-[13px] font-medium sticky left-0 bg-[#030405] z-10 break-words">
                      {field.label}
                    </td>
                    {compareProps.map((prop) =>
                      prop ? (
                        <td
                          key={prop.id}
                          className="p-3 text-[#D7DAE3] text-[13px] sm:text-[14px] break-words min-w-0"
                        >
                          {field.isPrice ? (
                            <span className="text-[#F5F0E6] font-bold">{field.render(prop)}</span>
                          ) : (
                            field.render(prop)
                          )}
                        </td>
                      ) : null,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#15151D] border border-white/[0.085] flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-[#7D8291]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M3.75 12a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0z" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-[#F6D37A] mb-2">
              {t('compare.empty')}
            </h2>
            <p className="text-[14px] text-[#7D8291] max-w-[400px] mb-5 break-words">
              {t('compare.emptySub')}
            </p>
            <Link
              to="/buy"
              className="px-5 py-2.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)]"
            >
              {t('post.browseListings')}
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ComparePage;
