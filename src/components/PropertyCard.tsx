import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Heart, GitCompareArrows } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../contexts/CompareContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiPost, isApiConfigured } from '../services/apiClient';
import { isExpired } from '../utils/expiryUtils';
import { getUserItem, setUserItem } from '../utils/userStorage';
import { emitStatsChanged, getFingerprint } from '../utils/statsEvents';

export interface PropertyCardProps {
  id?: string;
  image: string;
  tag: string;
  tagColor: string;
  price: string;
  bds: number;
  ba: number;
  sqft: string;
  status: string;
  address: string;
  mls: string;
  isVip?: boolean;
  expiresAt?: string;
  numericPrice?: number;
  listingType?: string;
  onFavoriteToggle?: () => void;
}

const PropertyCard = ({
  id,
  image,
  tag,
  tagColor,
  price,
  bds,
  ba,
  sqft,
  status,
  address,
  mls,
  isVip,
  expiresAt,
  numericPrice,
  listingType,
  onFavoriteToggle,
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const { formatPrice } = useCurrency();
  const { t, lang } = useLanguage();
  const compared = id ? isInCompare(id) : false;
  const expired = isExpired(expiresAt);
  const canOpenDetail = Boolean(id);

  // Format price with currency context
  const displayPrice = numericPrice != null
    ? `${formatPrice(numericPrice)}${listingType === 'rent' ? t('prop.perMonth') : ''}`
    : price;
  const normalizedStatus = status.trim().toLowerCase();
  const displayStatus = normalizedStatus === 'for sale'
    ? t('prop.forSale')
    : normalizedStatus === 'for rent'
      ? t('prop.forRent')
      : normalizedStatus === 'active'
        ? t('status.active')
        : normalizedStatus === 'expired'
          ? t('status.expired')
          : normalizedStatus === 'pending'
            ? t('status.pending')
            : normalizedStatus === 'hidden'
              ? t('status.hidden')
              : status;
  const displayTag = (() => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag === 'new listing') return t('prop.newListing');
    if (normalizedTag === 'showcase') return t('prop.showcase');
    if (normalizedTag === 'warm cozy fireplace') return t('prop.warmFireplace');
    const dayMatch = normalizedTag.match(/^(\d+)\s+days?\s+on\s+market$/);
    if (lang === 'vi' && dayMatch) return t('prop.daysOnMarketShort').replace('{count}', dayMatch[1]);
    if (lang === 'vi' && normalizedTag.startsWith('open:')) {
      return tag.replace(/^open:/i, t('prop.openPrefix'));
    }
    return tag;
  })();

  const handleCompareClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (compared) {
      removeFromCompare(id);
    } else {
      addToCompare(id);
    }
  };

  const [isFavorite, setIsFavorite] = useState(() => {
    if (!id) return false;
    try {
      const favorites = JSON.parse(getUserItem('gf_favorites') || '[]');
      return favorites.includes(id);
    } catch {
      return false;
    }
  });

  const handleFavoriteClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!id) return;

    try {
      const favorites = JSON.parse(getUserItem('gf_favorites') || '[]');
      const shouldFavorite = !favorites.includes(id);
      let updated: string[];
      if (!shouldFavorite) {
        updated = favorites.filter((favId: string) => favId !== id);
      } else {
        updated = [...favorites, id];
      }
      setUserItem('gf_favorites', JSON.stringify(updated));
      setIsFavorite(updated.includes(id));
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }

      if (isApiConfigured()) {
        const res = await apiPost<{ action: string; likes_count: number; has_liked: boolean }>(
          `/api/likes/${id}`,
          { fingerprint: getFingerprint(), liked: shouldFavorite },
        );
        if (res.ok && res.data) {
          const likesDelta = res.data.action === 'liked' ? 1 : res.data.action === 'unliked' ? -1 : 0;
          if (likesDelta !== 0) emitStatsChanged({ likesDelta });
        }
      }
    } catch (err) {
      console.error('Error modifying favorites:', err);
    }
  };

  const handleCardClick = () => {
    if (!id) return;
    navigate(`/property/${id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-[#15151D] rounded-xl overflow-hidden border border-white/[0.085] shadow-[0_22px_52px_rgba(0,0,0,0.42)] transition-colors duration-200 flex flex-col h-full ${
        canOpenDetail ? 'hover:border-[#B88717]/45 cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Image section */}
      <div className="relative w-full" style={{ paddingBottom: '66.67%' /* 3:2 ratio */ }}>
        <img
          src={image}
          alt={address}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Watermark overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            style={{ transform: 'rotate(-22deg)', opacity: 0.18, fontSize: '22px', fontWeight: 800, letterSpacing: '0.12em', color: 'white', whiteSpace: 'nowrap' }}
          >So Do Van Phuc</span>
        </div>
        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[5]">
            <span className="text-red-400 text-[14px] font-bold uppercase tracking-wider border border-red-400/40 px-3 py-1 rounded-lg bg-black/50">{t('status.expired')}</span>
          </div>
        )}
        {/* Badge */}
        <span
          className={`absolute top-2 left-2 ${tagColor} text-white text-[11px] font-semibold px-2 py-[3px] rounded`}
        >
          {displayTag}
        </span>
        {/* VIP Badge */}
        {isVip && (
          <span className="absolute top-2 left-[calc(0.5rem+4px)] ml-[calc(100%-5rem)] bg-gradient-to-r from-[#B88717] to-[#F6D37A] text-[#030405] text-[10px] font-bold px-2 py-[2px] rounded shadow-md" style={{ left: 'auto', right: '40px', marginLeft: 0 }}>
            ⭐ VIP
          </span>
        )}
        {/* Favorite */}
        {id && (
          <button
            onClick={handleFavoriteClick}
            aria-label="Save to favorites"
            className="absolute top-2 right-2 text-white hover:text-red-400 transition-colors drop-shadow-sm z-10 p-1"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
              strokeWidth={2}
            />
          </button>
        )}
        {/* Compare button */}
        {id && (
          <button
            onClick={handleCompareClick}
            aria-label={compared ? 'Remove from compare' : 'Add to compare'}
            className={`absolute bottom-2 right-2 z-10 p-1.5 rounded-full transition-all drop-shadow-sm ${
              compared
                ? 'bg-[#B88717] text-[#030405]'
                : 'bg-black/50 text-white hover:bg-[#B88717]/80 hover:text-[#030405]'
            } ${!compared && isFull ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={!compared && isFull}
          >
            <GitCompareArrows className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[19px] font-bold text-[#F6D37A] leading-tight">
          {displayPrice}
        </div>
        <div className="text-[13px] text-[#D7DAE3] flex items-center gap-1.5 flex-wrap">
          <span><strong>{bds}</strong> {t('prop.bds')}</span>
          <span className="text-white/20">|</span>
          <span><strong>{ba}</strong> {t('prop.ba')}</span>
          <span className="text-white/20">|</span>
          <span><strong>{sqft}</strong> {t('prop.sqft')}</span>
          <span className="text-white/20">|</span>
          <span className="text-[#D7DAE3]">{displayStatus}</span>
        </div>
        <div className="text-[13px] text-[#D7DAE3] leading-snug line-clamp-2">
          {address}
        </div>
        <div className="text-[10px] text-[#7D8291] mt-auto pt-2 leading-tight line-clamp-2 uppercase tracking-wide">
          {mls}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
