import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Heart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import PropertyCard from '../components/PropertyCard';
import { properties } from '../data/properties';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserItem } from '../utils/userStorage';
import { listingService } from '../services/listingService';

const FavoritesPage = () => {
  const { t } = useLanguage();
  usePageTitle(t('fav.title'));
  const [favoriteProperties, setFavoriteProperties] = useState<typeof properties>([]);

  const loadFavorites = (allProps: typeof properties = []) => {
    try {
      const favIds = JSON.parse(getUserItem('gf_favorites') || '[]');
      // Merge API + static, dedupe by id
      const ids = new Set(allProps.map(p => p.id));
      const merged = [...allProps, ...properties.filter(p => !ids.has(p.id))];
      setFavoriteProperties(merged.filter((p) => favIds.includes(p.id)));
    } catch {
      setFavoriteProperties([]);
    }
  };

  useEffect(() => {
    listingService.getAll()
      .then((api) => loadFavorites(api))
      .catch(() => loadFavorites([]));
  }, []);

  return (
    <PageShell raw>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
          }}
        />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto pt-12 sm:pt-16 pb-10 sm:pb-12 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-2 leading-tight break-words"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)' }}
          >
            {t('fav.title')}
          </h1>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
            {t('fav.emptyDesc')}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16 mt-8">
        {favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {favoriteProperties.map((prop) => (
              <div key={prop.id} className="min-w-0">
                <PropertyCard
                  id={prop.id}
                  image={prop.image}
                  tag={prop.tag}
                  tagColor={prop.tagColor}
                  price={prop.price}
                  bds={prop.bds}
                  ba={prop.ba}
                  sqft={prop.sqft}
                  status={prop.status}
                  address={prop.address}
                  mls={prop.mls}
                  onFavoriteToggle={() => {
                    listingService.getAll()
                      .then((api) => loadFavorites(api))
                      .catch(() => loadFavorites([]));
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#15151D] border border-white/[0.085] rounded-xl p-12 text-center max-w-[500px] mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#B88717]/10 flex items-center justify-center mx-auto mb-5">
              <Heart className="h-7 w-7 text-[#F6D37A]" />
            </div>
            <h2 className="text-[#F6D37A] text-[18px] font-bold mb-2">{t('fav.empty')}</h2>
            <p className="text-[#A7ABB6] text-sm mb-6 leading-relaxed">
              {t('fav.emptyDesc')}
            </p>
            <Link
              to="/buy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
            >
              <Search className="h-4 w-4" />
              <span>{t('post.browseListings')}</span>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default FavoritesPage;
