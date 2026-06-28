import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyCard from './PropertyCard';
import type { PropertyCardProps } from './PropertyCard';
import { useLanguage } from '../contexts/LanguageContext';
import { isApiConfigured } from '../services/apiClient';
import { listingService } from '../services/listingService';
import { properties, type Property } from '../data/properties';

const DEFAULT_IMAGE = properties[0]?.image ?? '';

const toCardProps = (property: Property): PropertyCardProps => ({
  id: property.id,
  image: property.image || DEFAULT_IMAGE,
  tag: property.tag,
  tagColor: property.tagColor,
  price: property.price,
  numericPrice: property.numericPrice,
  listingType: property.listingType,
  bds: property.bds,
  ba: property.ba,
  sqft: property.sqft,
  status: property.status,
  address: property.address,
  mls: property.mls,
  isVip: property.isVip,
  expiresAt: property.expiresAt,
});

const HomesForYou = () => {
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [apiHomes, setApiHomes] = useState<PropertyCardProps[]>([]);
  const apiConfigured = isApiConfigured();
  const demoHomes = apiConfigured ? [] : properties.slice(0, 8).map(toCardProps);

  const scroll = (dir: 'left' | 'right') => {
    if (!mobileScrollRef.current) return;
    const amount = 300;
    mobileScrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const { t } = useLanguage();
  const displayHomes = apiHomes.length > 0 ? apiHomes : demoHomes;

  useEffect(() => {
    let cancelled = false;

    listingService.getAll()
      .then((listings) => {
        if (cancelled || listings.length === 0) return;
        setApiHomes(listings.slice(0, 8).map(toCardProps));
      })
      .catch((err) => {
        console.warn('[HomesForYou] Listing fetch failed', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (displayHomes.length === 0) return null;

  return (
    <section
      className="py-8 relative"
      style={{ background: 'linear-gradient(180deg, #060611 0%, #0B0B17 40%, #060611 100%)' }}
    >
      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="text-[20px] font-bold text-[#F6D37A] leading-tight">{t('common.homesForYou')}</h2>
            <p className="text-[13px] text-[#A7ABB6] mt-0.5">{t('common.homesForYouSub')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous"
              className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center text-[#A7ABB6] hover:border-[#B88717] hover:text-[#F6D37A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next"
              className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center text-[#D2D5DF] hover:border-[#B88717] hover:text-[#F6D37A] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {displayHomes.map((home, i) => (
            <div
              key={home.id ?? i}
              className="flex-shrink-0 snap-start"
              style={{ width: 'clamp(260px, 80vw, 290px)' }}
            >
              <PropertyCard {...home} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomesForYou;
