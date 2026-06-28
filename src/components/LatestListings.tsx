import { useEffect, useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { listingService } from '../services/listingService';
import type { Property } from '../data/properties';

const MAX_DISPLAY = 100;

const LatestListings = () => {
  const { t, lang } = useLanguage();
  const [listings, setListings] = useState<Property[]>([]);

  useEffect(() => {
    let cancelled = false;
    listingService.getAll()
      .then((all) => {
        if (cancelled) return;
        setListings(all);
      })
      .catch(() => { /* use empty */ });
    return () => { cancelled = true; };
  }, []);

  if (listings.length === 0) return null;

  const visible = listings.slice(0, MAX_DISPLAY);

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return lang === 'vi' ? 'Vừa đăng' : 'Just listed';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return lang === 'vi' ? `${mins} phút trước` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === 'vi' ? `${hours} giờ trước` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return lang === 'vi' ? `${days} ngày trước` : `${days}d ago`;
  };

  return (
    <section
      className="py-8 relative"
      style={{ background: 'linear-gradient(180deg, #060611 0%, #0B0B17 40%, #060611 100%)' }}
    >
      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-[20px] font-bold text-[#F6D37A] leading-tight">
            {lang === 'vi' ? 'Tin đăng mới nhất' : 'Latest Listings'}
          </h2>
          <p className="text-[13px] text-[#A7ABB6] mt-0.5">
            {lang === 'vi'
              ? 'Bất động sản vừa được đăng trên So Do Van Phuc'
              : 'Properties recently posted on So Do Van Phuc'}
          </p>
        </div>

        {/* Scrollable list */}
        <div
          className="bg-[#15151D]/60 rounded-2xl border border-white/[0.06] overflow-y-auto"
          style={{
            maxHeight: '180px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#B88717 #15151D',
          }}
        >
          {visible.map((listing, i) => (
            <Link
              key={listing.id ?? i}
              to={`/property/${listing.id}`}
              className={`flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] transition-colors group ${
                i < visible.length - 1 ? 'border-b border-white/[0.05]' : ''
              }`}
            >
              {/* Thumbnail */}
              <div className="w-[52px] h-[40px] rounded-md overflow-hidden flex-shrink-0 bg-[#0c0c12]">
                {listing.image ? (
                  <img
                    src={listing.image}
                    alt={listing.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#7D8291]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Title + time on same row */}
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] text-[#D7DAE3] truncate group-hover:text-[#F6D37A] transition-colors leading-tight flex-1">
                    {listing.address}
                  </p>
                  <span className="text-[9px] text-[#7D8291]/60 flex-shrink-0">
                    {timeAgo(listing.createdAt)}
                  </span>
                </div>

                {/* Price + specs */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] font-bold text-[#F6D37A]">{listing.price}</span>
                  <span className="text-[10px] text-[#7D8291]">·</span>
                  <span className="text-[10px] text-[#A7ABB6]">
                    {listing.sqft} {t('prop.sqft')}
                  </span>
                  {listing.bds !== undefined && (
                    <>
                      <span className="text-[10px] text-[#7D8291]">·</span>
                      <span className="text-[10px] text-[#A7ABB6]">
                        {listing.bds} {t('prop.bds')} · {listing.ba} {t('prop.ba')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-3.5 h-3.5 text-[#7D8291] group-hover:text-[#F6D37A] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestListings;
