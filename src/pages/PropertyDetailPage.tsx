import { useState, useRef, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost, isApiConfigured } from '../services/apiClient';
import {
  Phone, Mail, ArrowLeft, Bed, Bath, Ruler, Home, MapPin,
  Share2, CheckCircle, Heart, ChevronDown, ChevronUp,
  X, ChevronLeft, ChevronRight, Camera,
  DollarSign, Footprints, Bike, Bus, Eye, Bookmark,
  Clock, Building2, Hammer, Zap, TreePine,
  Navigation, Calendar, Shield, Droplets, Flame, Thermometer, Wind,
  GraduationCap, Star, TrendingUp, Lock, ExternalLink, MoreHorizontal,
  Car, Train, MapPinned,
  Flag, GitCompare, MessageCircle, CalendarClock,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { properties, type Property } from '../data/properties';
import PropertyCard from '../components/PropertyCard';
import SocialSharePanel from '../components/SocialSharePanel';
import { extractYouTubeId } from '../utils/youtubeUtils';
import { reportService } from '../services/reportService';
import { scheduleService } from '../services/scheduleService';
import { listingService } from '../services/listingService';
import PaymentGateway from '../components/PaymentGateway';
import PhoneInput from '../components/PhoneInput';
import { getProperty as apiGetProperty } from '../services/propertyApi';
import { mapApiProperty } from '../services/apiMappers';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserItem, setUserItem } from '../utils/userStorage';
import { emitStatsChanged, getFingerprint } from '../utils/statsEvents';

import { inquiryService } from '../services/inquiryService';
import { useCompare } from '../contexts/CompareContext';
import type { ReportReason } from '../types/types';

interface ListingExternalLink {
  label: string;
  url: string;
}

const EXTERNAL_LINKS_MARKER = 'External links:';
const formatTemplate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );

const parseListingDescriptionLinks = (description: string): {
  description: string;
  links: ListingExternalLink[];
} => {
  const markerIndex = description.indexOf(EXTERNAL_LINKS_MARKER);
  if (markerIndex === -1) {
    return { description, links: [] };
  }

  const cleanDescription = description.slice(0, markerIndex).trim();
  const linkBlock = description.slice(markerIndex + EXTERNAL_LINKS_MARKER.length);
  const links = linkBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^([^:]+):\s*(https?:\/\/.+)$/i))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ label: match[1].trim(), url: match[2].trim() }));

  return { description: cleanDescription || description, links };
};

const normalizePhoneDigits = (value: string) =>
  value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').replace(/^\+/, '');

const appendWhatsappMessage = (rawUrl: string, message: string) => {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('text')) {
      url.searchParams.set('text', message);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
};

/* ═══════════════════════════════════════════════════════
 *  GALLERY MODAL
 * ═══════════════════════════════════════════════════════ */
function GalleryModal({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  return (
    <div data-testid="gallery-modal" className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white text-[14px] font-medium">
          <span>{idx + 1}</span> <span className="text-white/50">{t('post.of')}</span> <span>{images.length}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4 relative min-h-0">
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={images[idx]}
            alt={formatTemplate(t('detail.photoAlt'), { count: idx + 1 })}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          {/* Watermark overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-lg">
            <span style={{ transform: 'rotate(-22deg)', opacity: 0.18, fontSize: 'clamp(20px, 4vw, 42px)', fontWeight: 800, letterSpacing: '0.12em', color: 'white', whiteSpace: 'nowrap' }}>So Do Van Phuc</span>
          </div>
        </div>
        {idx > 0 && (
          <button
            type="button"
            onClick={() => setIdx((i) => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {idx < images.length - 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 px-4 pb-4 overflow-x-auto scrollbar-hide justify-center">
        {images.slice(0, 12).map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`flex-shrink-0 w-12 h-9 rounded overflow-hidden border-2 transition-all cursor-pointer ${i === idx ? 'border-[#F6D37A] opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  ACCORDION SECTION
 * ═══════════════════════════════════════════════════════ */
function AccordionSection({
  icon,
  title,
  groups,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  groups?: { label: string; items: string[] }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!groups || groups.length === 0) return null;

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-[15px] font-semibold text-[#F5F0E6] group-hover:text-[#F6D37A] transition-colors">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#7D8291]" /> : <ChevronDown className="w-4 h-4 text-[#7D8291]" />}
      </button>
      {open && (
        <div className="pb-4 pl-1 space-y-4">
          {groups.map((g, i) => (
            <div key={i}>
              <h4 className="text-[13px] font-semibold text-[#F6D37A] mb-2">{g.label}</h4>
              <ul className="space-y-1.5">
                {g.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] text-[#D7DAE3]">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[#B88717] flex-shrink-0" />
                    <span className="break-words min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  SCORE BADGE
 * ═══════════════════════════════════════════════════════ */
function ScoreBadge({ icon, label, score, desc }: { icon: React.ReactNode; label: string; score?: number; desc: string }) {
  if (score === undefined) return null;
  const color = score >= 70 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10';
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <div className="text-[13px] text-[#A7ABB6]">{label}</div>
        <div className="text-[15px] font-bold text-[#F5F0E6]"><span>{score}</span> <span className="text-[#7D8291] font-normal">/ 100</span></div>
        <div className="text-[12px] text-[#7D8291]">{desc}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  SCHOOL SCORE CIRCLE
 * ═══════════════════════════════════════════════════════ */
function SchoolScore({ rating }: { rating: number; type: string }) {
  const color = rating >= 8 ? 'text-emerald-400 border-emerald-500/40' : rating >= 5 ? 'text-amber-400 border-amber-500/40' : 'text-red-400 border-red-500/40';
  return (
    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${color}`}>
      <span className="text-[14px] font-bold">{rating}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  CLIMATE RISK CARD
 * ═══════════════════════════════════════════════════════ */
function ClimateRiskCard({ icon, title, level, description }: { icon: React.ReactNode; title: string; level: string; description: string }) {
  const { t } = useLanguage();
  const levelColor: Record<string, string> = {
    Minimal: 'bg-emerald-500/15 text-emerald-400',
    Minor: 'bg-blue-500/15 text-blue-400',
    Moderate: 'bg-amber-500/15 text-amber-400',
    Major: 'bg-orange-500/15 text-orange-400',
    Severe: 'bg-red-500/15 text-red-400',
  };
  const levelLabel: Record<string, string> = {
    Minimal: t('detail.riskMinimal'),
    Minor: t('detail.riskMinor'),
    Moderate: t('detail.riskModerate'),
    Major: t('detail.riskMajor'),
    Severe: t('detail.riskSevere'),
  };
  return (
    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[14px] font-semibold text-[#F5F0E6]">{title}</span>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${levelColor[level] ?? 'bg-white/10 text-[#A7ABB6]'}`}>{levelLabel[level] ?? level}</span>
      </div>
      <p className="text-[12px] text-[#7D8291] leading-relaxed">{description}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  MONTHLY PAYMENT ROW (expandable)
 * ═══════════════════════════════════════════════════════ */
function PaymentRow({ color, label, amount, detail }: { color: string; label: string; amount: number; detail?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04] last:border-b-0">
      <button
        type="button"
        onClick={() => detail && setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${detail ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
          <span className="text-[13px] text-[#A7ABB6]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#F5F0E6]">${amount.toLocaleString()}</span>
          {detail && (open ? <ChevronUp className="w-3.5 h-3.5 text-[#7D8291]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#7D8291]" />)}
        </div>
      </button>
      {open && detail && (
        <div className="px-4 pb-3 pl-10 text-[12px] text-[#7D8291] leading-relaxed">{detail}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 *  SECTION HEADING (consistent Zillow-style)
 * ═══════════════════════════════════════════════════════ */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] font-bold text-[#F6D37A] mb-4">{children}</h2>;
}

/* ═══════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════ */
const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { formatPrice } = useCurrency();
  const { t, lang } = useLanguage();
  usePageTitle(t('detail.propertyDetails'));
  const apiConfigured = isApiConfigured();

  // Search static properties first (only in demo mode), then API
  const staticMatch = !apiConfigured ? properties.find((p) => p.id === id) : null;
  const [dynamicProperty, setDynamicProperty] = useState<Property | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setDynamicProperty(null);
      setDetailLoading(false);
      if (staticMatch || !id) return; // already found in static data (demo mode)

      // Try API if configured
      if (apiConfigured) {
        setDetailLoading(true);
        apiGetProperty(id).then((result) => {
          if (cancelled || !result.ok || !result.data) return;
          const p = result.data as Record<string, unknown>;
          setDynamicProperty(mapApiProperty(p) as Property);
        }).catch(() => { /* ignore */ })
          .finally(() => {
            if (!cancelled) setDetailLoading(false);
          });
        return;
      }

      // Demo mode: Try localStorage mock listings
      try {
        const mockRaw = localStorage.getItem('gf_mock_listings');
        if (mockRaw) {
          const mockListings = JSON.parse(mockRaw) as Property[];
          const found = mockListings.find((p) => p.id === id);
          if (found) { setDynamicProperty(found); return; }
        }
      } catch { /* ignore */ }
      setDetailLoading(false);
    });

    return () => { cancelled = true; };
  }, [id, staticMatch, apiConfigured]);

  const property = staticMatch || (dynamicProperty?.id === id ? dynamicProperty : null);
  const propAny = property as unknown as Record<string, unknown> | undefined;
  const agentPhone = (property?.contactPhone || propAny?.contact_phone || property?.listedBy?.phone || '') as string;
  const agentEmail = (propAny?.contactEmail || propAny?.contact_email || '') as string;
  const agentName = (propAny?.contactName || propAny?.contact_name || property?.listedBy?.name || '') as string;
  const directWhatsappUrl = (property?.whatsappUrl || propAny?.whatsapp_url || '') as string;
  const parsedDescription = parseListingDescriptionLinks(property?.description ?? '');
  const displayDescription = parsedDescription.description || property?.description || '';
  const dedicatedListingLinks = property
    ? [
        { label: 'YouTube', url: property.youtubeUrl },
        { label: 'Facebook', url: property.facebookUrl },
        { label: 'Instagram', url: property.instagramUrl },
        { label: 'TikTok', url: property.tiktokUrl },
        { label: 'X', url: property.xUrl },
        { label: 'WhatsApp', url: directWhatsappUrl },
      ].filter((link): link is ListingExternalLink => Boolean(link.url))
    : [];
  const seenListingLinks = new Set<string>();
  const externalListingLinks = [...dedicatedListingLinks, ...parsedDescription.links].filter((link) => {
    const key = `${link.label.toLowerCase()}|${link.url}`;
    if (seenListingLinks.has(key)) return false;
    seenListingLinks.add(key);
    return true;
  });
  const youtubeVideoId = property?.youtubeUrl ? extractYouTubeId(property.youtubeUrl) : null;
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const inCompare = id ? isInCompare(id) : false;
  const contactRef = useRef<HTMLDivElement>(null);

  /* ── Gallery state ── */
  const galleryImages = property?.images?.length ? property.images : (property ? [property.image] : []);
  const displayPhotoCount = property?.photoCount ?? galleryImages.length;
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleGalleryScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setGalleryIdx(idx);
  }, []);

  /* ── Share button state ── */
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = property ? `${property.price} · ${property.address}` : 'So Do Van Phuc property';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try { await navigator.share({ title: shareTitle, text: t('detail.shareText'), url: shareUrl }); setShareStatus('shared'); setTimeout(() => setShareStatus('idle'), 2000); return; } catch { /* cancelled */ }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try { await navigator.clipboard.writeText(shareUrl); setShareStatus('copied'); setTimeout(() => setShareStatus('idle'), 2000); return; } catch { /* blocked */ }
    }
    try { window.prompt(t('detail.sharePrompt'), shareUrl); setShareStatus('copied'); setTimeout(() => setShareStatus('idle'), 2000); } catch { /* nothing */ }
  };

  /* ── Favorite state ── */
  const [isFavorite, setIsFavorite] = useState(() => {
    if (!id) return false;
    try { return JSON.parse(getUserItem('gf_favorites') || '[]').includes(id); } catch { return false; }
  });
  const handleSaveFavorite = () => {
    if (!id) return;
    try {
      const favorites = JSON.parse(getUserItem('gf_favorites') || '[]');
      const updated = favorites.includes(id) ? favorites.filter((f: string) => f !== id) : [...favorites, id];
      setUserItem('gf_favorites', JSON.stringify(updated));
      setIsFavorite(updated.includes(id));
    } catch { /* ignore */ }
  };

  /* ── Like count state ── */
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const fingerprint = useRef('');

  useEffect(() => {
    fingerprint.current = getFingerprint();
  }, []);

  useEffect(() => {
    if (!id || !isApiConfigured()) return;
    apiGet<{ likes_count: number; has_liked: boolean }>(`/api/likes/${id}?fp=${fingerprint.current}`)
      .then((res) => {
        if (res.ok && res.data) {
          setLikeCount(res.data.likes_count);
          setHasLiked(res.data.has_liked);
        }
      })
      .catch(() => {});
  }, [id]);

  const handleToggleLike = async () => {
    if (!id || !isApiConfigured()) {
      // Fallback: just toggle local favorite
      handleSaveFavorite();
      return;
    }
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 600);
    try {
      const nextLiked = !hasLiked;
      const res = await apiPost<{ action: string; likes_count: number; has_liked: boolean }>(
        `/api/likes/${id}`,
        { fingerprint: fingerprint.current, liked: nextLiked },
      );
      if (res.ok && res.data) {
        setLikeCount(res.data.likes_count);
        setHasLiked(res.data.has_liked);
        const likesDelta = res.data.action === 'liked' ? 1 : res.data.action === 'unliked' ? -1 : 0;
        if (likesDelta !== 0) emitStatsChanged({ likesDelta });
      }
    } catch { /* ignore */ }
    // Also toggle local favorite
    handleSaveFavorite();
  };
  /* ── Contact form ── */
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const [formError, setFormError] = useState('');
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await inquiryService.create({
        ...formData,
        property: property?.address || t('detail.unknown'),
        propertyId: property?.id || '',
      });
      setFormSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('detail.inquiryFailed');
      setFormError(msg);
    }
  };

  /* ── UI toggles ── */
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showAllFacts, setShowAllFacts] = useState(false);
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [showTaxHistory, setShowTaxHistory] = useState(false);

  /* ── Report modal state ── */
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDesc, setReportDesc] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportService.create({
        propertyId: property?.id ?? '',
        propertyAddress: property?.address ?? '',
        reason: reportReason,
        description: reportDesc,
        contactEmail: reportEmail || undefined,
      });
      setReportStatus('success');
      setTimeout(() => { setShowReportModal(false); setReportStatus('idle'); setReportDesc(''); setReportEmail(''); setReportReason('spam'); }, 2000);
    } catch {
      setReportStatus('error');
    }
  };

  /* ── Schedule viewing state ── */
  const [scheduleData, setScheduleData] = useState({ name: '', phone: '', email: '', date: '', time: '', message: '' });
  const [scheduleSubmitted, setScheduleSubmitted] = useState(false);
  const [showSchedulePaypal, setShowSchedulePaypal] = useState(false);
  const [scheduleFormValid, setScheduleFormValid] = useState(false);

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setScheduleData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setShowSchedulePaypal(false);
  };

  const [scheduleError, setScheduleError] = useState('');

  // Step 1: Validate form → show PayPal
  const handleScheduleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    if (!scheduleData.name || !scheduleData.phone || !scheduleData.email || !scheduleData.date || !scheduleData.time) {
      setScheduleError(t('schedule.requiredFields'));
      return;
    }
    setScheduleFormValid(true);
    setShowSchedulePaypal(true);
  };

  // Step 2: After PayPal success → submit schedule
  const handleSchedulePaypalSuccess = async (orderId: string) => {
    setScheduleError('');
    try {
      await scheduleService.create({
        propertyId: property?.id ?? '',
        propertyAddress: property?.address ?? '',
        ...scheduleData,
        paypalOrderId: orderId,
      } as Parameters<typeof scheduleService.create>[0] & { paypalOrderId: string });
      setScheduleSubmitted(true);
      setShowSchedulePaypal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('detail.scheduleFailed');
      setScheduleError(msg);
    }
  };

  /* ── WhatsApp URL ── */
  const whatsappUrl = (() => {
    const listingUrl = window.location.href;
    const message = `Hi, I'm interested in this property: ${listingUrl}`;
    if (directWhatsappUrl) {
      return appendWhatsappMessage(directWhatsappUrl, message);
    }
    const ownerPhone = normalizePhoneDigits(agentPhone);
    if (!ownerPhone) return '';
    const text = encodeURIComponent(message);
    return `https://wa.me/${ownerPhone}?text=${text}`;
  })();

  /* ── Compare handler ── */
  const handleCompareToggle = () => {
    if (!id) return;
    if (inCompare) { removeFromCompare(id); }
    else { addToCompare(id); }
  };

  /* ── Compact mobile header scroll ── */
  const [headerVisible, setHeaderVisible] = useState(false);
  useEffect(() => {
    const handler = () => setHeaderVisible(window.scrollY > 280);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ── Nearby homes ── */
  const staticNearby = !apiConfigured && property
    ? properties.filter((p) => p.id !== property.id && p.listingType === property.listingType)
    : [];
  const [apiNearby, setApiNearby] = useState<typeof properties>([]);
  const recommendationPropertyId = property?.id;
  const recommendationListingType = property?.listingType;
  const recommendationCity = property?.city;
  const recommendationState = property?.state;
  const recommendationPropertyType = property?.propertyType;
  const recommendationNumericPrice = property?.numericPrice;

  useEffect(() => {
    if (!recommendationPropertyId || !recommendationListingType || !apiConfigured) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setApiNearby([]);
      });
      return () => { cancelled = true; };
    }

    let cancelled = false;
    const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();
    const currentId = String(recommendationPropertyId);
    const currentCity = normalize(recommendationCity);
    const currentState = normalize(recommendationState);
    const currentType = normalize(recommendationPropertyType);
    const currentPrice = recommendationNumericPrice || 0;

    const recommendationScore = (candidate: Property) => {
      let score = 0;
      if (normalize(candidate.city) && normalize(candidate.city) === currentCity) score += 8;
      if (normalize(candidate.state) && normalize(candidate.state) === currentState) score += 4;
      if (normalize(candidate.propertyType) && normalize(candidate.propertyType) === currentType) score += 2;
      if (candidate.isVip) score += 1;
      if (currentPrice > 0 && candidate.numericPrice > 0) {
        score -= Math.abs(candidate.numericPrice - currentPrice) / currentPrice;
      }
      return score;
    };

    listingService.getAll()
      .then((listings) => {
        if (cancelled) return;
        const mapped = listings
          .filter((candidate) => candidate.id && String(candidate.id) !== currentId)
          .filter((candidate) => candidate.listingType === recommendationListingType)
          .map((candidate) => candidate as Property)
          .sort((a, b) => recommendationScore(b) - recommendationScore(a))
          .slice(0, 8);
        setApiNearby(mapped as typeof properties);
      })
      .catch(() => {
        if (!cancelled) setApiNearby([]);
      });

    return () => { cancelled = true; };
  }, [
    apiConfigured,
    recommendationPropertyId,
    recommendationListingType,
    recommendationCity,
    recommendationState,
    recommendationPropertyType,
    recommendationNumericPrice,
  ]);

  // Merge static + API, dedupe by id
  const mergedNearby = (() => {
    const seen = new Set<string>();
    const result: typeof properties = [];
    for (const p of [...apiNearby, ...staticNearby]) {
      if (!seen.has(p.id)) { seen.add(p.id); result.push(p); }
    }
    return result;
  })();
  const nearbyHomes = mergedNearby.slice(0, 4);
  const homesForYou = mergedNearby.slice(4, 8);

  /* ── Monthly payment calc ── */
  const monthlyPayment = property && property.listingType === 'sale'
    ? (() => {
        const price = property.numericPrice;
        const downPct = 0.2; const rate = 0.0685 / 12; const months = 360;
        const loanAmt = price * (1 - downPct);
        const pi = loanAmt * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        const tax = (property.annualTax ?? price * 0.012) / 12;
        const insurance = (price * 0.004) / 12;
        const hoa = property.hoaFee ?? 0;
        return { total: Math.round(pi + tax + insurance + hoa), principal: Math.round(pi), tax: Math.round(tax), insurance: Math.round(insurance), hoa: Math.round(hoa) };
      })()
    : null;

  const handleNearbyFavoriteToggle = useCallback(() => {}, []);
  const scrollToContact = () => { contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const [, setFavTick] = useState(0);
  useEffect(() => { const handler = () => setFavTick((t) => t + 1); window.addEventListener('storage', handler); return () => window.removeEventListener('storage', handler); }, []);

  const getScoreLabel = (score: number) => score >= 90 ? t('detail.walkParadise') : score >= 70 ? t('detail.veryWalkable') : score >= 50 ? t('detail.somewhatWalkable') : score >= 25 ? t('detail.carDependent') : t('detail.carRequired');
  const getBikeLabel = (score: number) => score >= 90 ? t('detail.bikeParadise') : score >= 70 ? t('detail.veryBikeable') : score >= 50 ? t('detail.bikeable') : t('detail.somewhatBikeable');
  const statusLabel = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'for rent') return t('prop.forRent');
    if (normalized === 'for sale') return t('prop.forSale');
    if (normalized === 'active') return t('status.active');
    if (normalized === 'pending') return t('status.pending');
    if (normalized === 'hidden') return t('status.hidden');
    if (normalized === 'expired') return t('status.expired');
    return status;
  };
  const tagLabel = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized === 'new listing') return t('prop.newListing');
    if (normalized === 'showcase') return t('prop.showcase');
    if (normalized === 'warm cozy fireplace') return t('prop.warmFireplace');
    const dayMatch = normalized.match(/^(\d+)\s+days?\s+on\s+market$/);
    if (lang === 'vi' && dayMatch) return t('prop.daysOnMarketShort').replace('{count}', dayMatch[1]);
    if (lang === 'vi' && normalized.startsWith('open:')) return tag.replace(/^open:/i, t('prop.openPrefix'));
    return tag;
  };
  const propertyTypeLabel = (type: string) => {
    const keyByType: Record<string, string> = {
      'Single Family': 'post.singleFamily',
      Condo: 'post.condo',
      Townhouse: 'post.townhouse',
      Villa: 'post.villa',
      Land: 'post.land',
      Commercial: 'post.commercial',
    };
    return keyByType[type] ? t(keyByType[type]) : type;
  };
  const offerStrengthLabel = (strength: string) => {
    const keyByStrength: Record<string, string> = {
      Strong: 'detail.offerStrong',
      Competitive: 'detail.offerCompetitive',
      Moderate: 'detail.offerModerate',
      Weak: 'detail.offerWeak',
    };
    return keyByStrength[strength] ? t(keyByStrength[strength]) : strength;
  };

  const renderPropertyCard = (p: Property) => (
    <PropertyCard key={p.id} id={p.id} image={p.image} tag={p.tag} tagColor={p.tagColor} price={p.price} numericPrice={p.numericPrice} listingType={p.listingType} bds={p.bds} ba={p.ba} sqft={p.sqft} status={p.status} address={p.address} mls={p.mls} isVip={p.isVip} expiresAt={p.expiresAt} onFavoriteToggle={handleNearbyFavoriteToggle} />
  );

  return (
    <PageShell raw hideMobileNav hideMobileHeader>
      {property ? (
        <>
          {/* ═══ COMPACT MOBILE HEADER (sticky on scroll) ═══ */}
          <div className={`lg:hidden fixed top-0 left-0 right-0 z-[55] transition-all duration-200 ${headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="bg-[#0c0c12]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3">
              <Link to={property.listingType === 'rent' ? '/rent' : '/buy'} className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <ArrowLeft className="w-4 h-4 text-[#F5F0E6]" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-[#F5F0E6] truncate">{property.numericPrice ? formatPrice(property.numericPrice) : property.price}</div>
                <div className="text-[11px] text-[#7D8291] truncate">{property.address}</div>
              </div>
              <button type="button" onClick={handleToggleLike} className={`flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/[0.06] flex-shrink-0 cursor-pointer transition-transform ${likeAnimating ? 'scale-125' : ''}`}>
                <Heart className={`w-4 h-4 transition-colors ${hasLiked || isFavorite ? 'fill-red-500 text-red-400' : 'text-[#A7ABB6]'}`} />
                {likeCount > 0 && <span className="text-[12px] text-[#A7ABB6] font-medium">{likeCount}</span>}
              </button>
              <button type="button" onClick={handleShare} className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 cursor-pointer">
                {shareStatus !== 'idle' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[#A7ABB6]" />}
              </button>
            </div>
          </div>

          {/* ═══ PHOTO GALLERY ═══ */}
          <div className="w-full max-w-[1200px] mx-auto lg:px-8">

            {/* ── Desktop Zillow-style grid (hidden on mobile) ── */}
            <div className="hidden lg:block relative">
              <div className="grid grid-cols-[1fr_1fr] gap-1.5 rounded-2xl overflow-hidden" style={{ maxHeight: '480px' }}>
                {/* Large hero image */}
                <div className="relative cursor-pointer group" onClick={() => { setGalleryIdx(0); setShowGallery(true); }}>
                  <img
                    src={galleryImages[0]}
                    alt={`${property.address} - Main`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{ minHeight: '480px', maxHeight: '480px' }}
                  />
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <span style={{ transform: 'rotate(-22deg)', opacity: 0.18, fontSize: '32px', fontWeight: 800, letterSpacing: '0.12em', color: 'white', whiteSpace: 'nowrap' }}>So Do Van Phuc</span>
                  </div>
                  {/* Tag */}
                  <span className={`absolute bottom-4 left-4 ${property.tagColor} text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg z-10`}>{tagLabel(property.tag)}</span>
                </div>

                {/* 4 thumbnail grid */}
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5">
                  {[1, 2, 3, 4].map((idx) => {
                    const img = galleryImages[idx] || galleryImages[0];
                    return (
                      <div
                        key={idx}
                        className="relative cursor-pointer group overflow-hidden"
                        onClick={() => { setGalleryIdx(idx < galleryImages.length ? idx : 0); setShowGallery(true); }}
                      >
                        <img
                          src={img}
                          alt={`${property.address} - Photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          style={{ minHeight: '100%' }}
                          loading="lazy"
                        />
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                          <span style={{ transform: 'rotate(-22deg)', opacity: 0.16, fontSize: '16px', fontWeight: 800, letterSpacing: '0.1em', color: 'white', whiteSpace: 'nowrap' }}>So Do Van Phuc</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {galleryImages.length > 5 && (
                <button
                  type="button"
                  onClick={() => { setGalleryIdx(0); setShowGallery(true); }}
                  className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/95 text-[#030405] text-[13px] font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {formatTemplate(t('detail.seeAllPhotos'), { count: displayPhotoCount })}
                </button>
              )}

              {/* Overlay nav buttons (back, save, share) */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                <Link to={property.listingType === 'rent' ? '/rent' : '/buy'} className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  <ArrowLeft className="w-4.5 h-4.5 text-white" />
                </Link>
                <div className="pointer-events-auto flex items-center gap-2">
                  <button type="button" onClick={handleSaveFavorite} data-testid="gallery-save-btn" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-red-500 text-red-400' : 'text-white'}`} />
                  </button>
                  <button type="button" onClick={handleShare} data-testid="gallery-share-btn" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    {shareStatus !== 'idle' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> : <Share2 className="w-4.5 h-4.5 text-white" />}
                  </button>
                  <button type="button" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4.5 h-4.5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Mobile swipe gallery (hidden on desktop) ── */}
            <div className="lg:hidden relative">
              <div ref={scrollRef} onScroll={handleGalleryScroll} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {galleryImages.map((img, i) => (
                  <div key={i} className="snap-center flex-shrink-0 w-full cursor-pointer" onClick={() => setShowGallery(true)}>
                    <div className="relative w-full overflow-hidden" style={{ paddingBottom: '65%' }}>
                      <img src={img} alt={`${property.address} - Photo ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                      {/* Watermark overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                        <span style={{ transform: 'rotate(-22deg)', opacity: 0.18, fontSize: '24px', fontWeight: 800, letterSpacing: '0.12em', color: 'white', whiteSpace: 'nowrap' }}>So Do Van Phuc</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile overlay buttons */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                <Link to={property.listingType === 'rent' ? '/rent' : '/buy'} className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  <ArrowLeft className="w-4.5 h-4.5 text-white" />
                </Link>
                <div className="pointer-events-auto flex items-center gap-2">
                  <button type="button" onClick={handleSaveFavorite} data-testid="mobile-gallery-save-btn" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-red-500 text-red-400' : 'text-white'}`} />
                  </button>
                  <button type="button" onClick={handleShare} data-testid="mobile-gallery-share-btn" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    {shareStatus !== 'idle' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> : <Share2 className="w-4.5 h-4.5 text-white" />}
                  </button>
                  <button type="button" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4.5 h-4.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Tag + counter */}
              <span className={`absolute bottom-4 left-4 ${property.tagColor} text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg z-10`}>{tagLabel(property.tag)}</span>
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[12px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{galleryIdx + 1}</span> <span className="text-white/60">{t('post.of')}</span> <span>{displayPhotoCount}</span>
                </div>
              )}
            </div>

            {/* Gallery chips under image */}
            <div className="flex gap-2 px-4 lg:px-0 mt-2 overflow-x-auto scrollbar-hide">
              {property.floorPlanAvailable && (
                <span className="flex-shrink-0 text-[12px] font-medium text-[#A7ABB6] bg-[#15151D] border border-white/[0.08] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#F6D37A]" /> <span>{t('detail.floorPlan')}</span>
                </span>
              )}
              {property.threeDHomeAvailable && (
                <span className="flex-shrink-0 text-[12px] font-medium text-[#A7ABB6] bg-[#15151D] border border-white/[0.08] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-[#F6D37A]" /> <span>{t('detail.threeDHome')}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setGalleryIdx(0); setShowGallery(true); }}
                className="flex-shrink-0 text-[12px] font-medium text-[#A7ABB6] bg-[#15151D] border border-white/[0.08] px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:border-[#B88717]/30 hover:text-[#F6D37A] transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#F6D37A]" /> <span>{formatTemplate(t('detail.photosCount'), { count: displayPhotoCount })}</span>
              </button>
            </div>

            {/* ═══ YOUTUBE VIDEO TOUR ═══ */}
            {(property.videoUrl || youtubeVideoId) && (
              <section className="mt-6 px-4 lg:px-0">
                <h2 className="text-[#F6D37A] font-bold text-[18px] mb-3">{t('detail.videoTour')}</h2>
                {property.videoUrl ? (
                  <video
                    src={property.videoUrl}
                    controls
                    className="w-full aspect-video rounded-xl border border-white/[0.085] bg-black"
                    preload="metadata"
                  />
                ) : (
                  <div className="relative w-full rounded-xl overflow-hidden border border-white/[0.085]" style={{ paddingBottom: '56.25%' }}>
                    <iframe src={`https://www.youtube.com/embed/${youtubeVideoId}`} className="absolute inset-0 w-full h-full" allowFullScreen title="Property video tour" loading="lazy" />
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ═══ MAIN CONTENT ═══ */}
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-16 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-5">
              {/* ─── LEFT COLUMN ─── */}
              <div className="space-y-0 min-w-0">

                {/* ── S1: Status + Price + Specs ── */}
                <div className="pb-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[13px] font-semibold text-emerald-400">{statusLabel(property.status)}</span>
                    {/* VIP Badge */}
                    {property.isVip && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#B88717]/20 border border-[#B88717]/40 text-[#F6D37A] text-[11px] font-bold">
                        ⭐ VIP
                      </span>
                    )}
                  </div>
                  <h1 className="hero-gold-text font-extrabold mb-2 break-words" style={{ fontSize: 'clamp(28px, 6vw, 42px)' }}>{property.numericPrice ? formatPrice(property.numericPrice) : property.price}</h1>
                  <div className="flex items-center gap-1 text-[15px] text-[#D7DAE3] flex-wrap mb-2">
                    <Bed className="w-4 h-4 text-[#7D8291] flex-shrink-0" /><span className="font-bold">{property.bds}</span><span className="text-[#7D8291]">{t('prop.bedsLower')}</span>
                    <span className="text-[#7D8291] mx-1">|</span>
                    <Bath className="w-4 h-4 text-[#7D8291] flex-shrink-0" /><span className="font-bold">{property.ba}</span><span className="text-[#7D8291]">{t('prop.bathsLower')}</span>
                    <span className="text-[#7D8291] mx-1">|</span>
                    <Ruler className="w-4 h-4 text-[#7D8291] flex-shrink-0" /><span className="font-bold">{property.sqft}</span><span className="text-[#7D8291]">{t('prop.sqft')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[14px] text-[#A7ABB6]">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#B88717] flex-shrink-0" />
                    <span className="break-words min-w-0">{property.address}</span>
                  </div>

                  {/* ── Action Buttons Row: Compare + Report ── */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {/* Compare Button */}
                    <button
                      type="button"
                      onClick={handleCompareToggle}
                      disabled={!inCompare && isFull}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer border ${
                        inCompare
                          ? 'bg-[#B88717]/20 border-[#B88717]/40 text-[#F6D37A]'
                          : !inCompare && isFull
                            ? 'bg-white/[0.03] border-white/[0.06] text-[#7D8291] cursor-not-allowed'
                            : 'bg-white/[0.04] border-white/[0.08] text-[#A7ABB6] hover:border-[#B88717]/30 hover:text-[#F6D37A]'
                      }`}
                      title={!inCompare && isFull ? t('detail.compareFull') : inCompare ? t('detail.removeCompare') : t('detail.addCompare')}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{inCompare ? t('detail.inCompare') : t('btn.compare')}</span>
                    </button>

                    {/* Report Button */}
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white/[0.04] border border-white/[0.08] text-[#A7ABB6] hover:border-red-500/30 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{t('btn.report')}</span>
                    </button>
                  </div>

                  {/* ── Social Share Panel ── */}
                  <SocialSharePanel
                    url={window.location.href}
                    title={`${property.price} · ${property.address}`}
                    description={displayDescription}
                    youtubeUrl={property.youtubeUrl}
                  />
                  {externalListingLinks.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2 text-[#F6D37A] text-[13px] font-semibold">
                        <ExternalLink className="w-4 h-4" />
                        <span>{t('detail.listingLinks')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {externalListingLinks.map((link) => (
                          <a
                            key={`${link.label}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.045] px-3 py-2 text-[12px] font-semibold text-[#F5F0E6] hover:border-[#B88717]/40 hover:text-[#F6D37A] transition-colors"
                          >
                            <span>{link.label}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── S2: Quick Facts Grid ── */}
                <div className="py-5 border-b border-white/[0.06]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: <Home className="w-5 h-5 text-[#F6D37A]" />, label: t('detail.type'), value: propertyTypeLabel(property.propertyType) },
                      { icon: <Hammer className="w-5 h-5 text-[#F6D37A]" />, label: t('detail.built'), value: property.yearBuilt?.toString() ?? '—' },
                      { icon: <TreePine className="w-5 h-5 text-[#F6D37A]" />, label: t('detail.lot'), value: property.lotSize ?? '—' },
                      { icon: <DollarSign className="w-5 h-5 text-[#F6D37A]" />, label: t('detail.pricePerSqft'), value: property.pricePerSqft ? `$${property.pricePerSqft}` : '—' },
                      ...(property.hoaFee !== undefined ? [{ icon: <Building2 className="w-5 h-5 text-[#F6D37A]" />, label: 'HOA', value: property.hoaFee ? `$${property.hoaFee}${t('prop.perMonth')}` : t('detail.none') }] : []),
                      ...(property.annualTax !== undefined ? [{ icon: <DollarSign className="w-5 h-5 text-[#F6D37A]" />, label: t('detail.taxPerYear'), value: `$${property.annualTax.toLocaleString()}` }] : []),
                    ].map((f, i) => (
                      <div key={i} className="bg-[#15151D] rounded-xl border border-white/[0.06] p-3 flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0">{f.icon}</div>
                        <div className="min-w-0"><div className="text-[12px] text-[#7D8291]">{f.label}</div><div className="text-[13px] font-semibold text-[#F5F0E6] truncate">{f.value}</div></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── S3: What's Special ── */}
                <div className="py-5 border-b border-white/[0.06]">
                  <SectionHeading>{t('detail.features')}</SectionHeading>
                  {(property.highlights ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(property.highlights ?? []).map((h, i) => (
                        <span key={i} className="text-[11px] font-bold tracking-wider text-[#F6D37A] bg-[#B88717]/10 border border-[#B88717]/20 px-3 py-1.5 rounded-lg uppercase">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <p className={`text-[14px] text-[#A7ABB6] leading-relaxed break-words ${!showFullDesc ? 'line-clamp-4' : ''}`}>{displayDescription}</p>
                    {displayDescription.length > 200 && (
                      <button type="button" onClick={() => setShowFullDesc(!showFullDesc)} className="mt-2 text-[13px] font-semibold text-[#B88717] hover:text-[#F6D37A] transition-colors flex items-center gap-1 cursor-pointer">
                        {showFullDesc ? <><ChevronUp className="w-4 h-4" /> <span>{t('detail.hide')}</span></> : <><ChevronDown className="w-4 h-4" /> <span>{t('detail.showMore')}</span></>}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── S4: Listing Stats ── */}
                <div className="py-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4 text-[13px] text-[#A7ABB6] flex-wrap mb-3">
                    {property.daysOnMarket !== undefined && (<span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#B88717]" /><span className="font-bold text-[#F5F0E6]">{property.daysOnMarket}</span> {t('detail.daysOnSo Do Van Phuc')}</span>)}
                    {property.listingViews !== undefined && (<span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[#7D8291]" /><span className="font-bold text-[#F5F0E6]">{property.listingViews}</span> {t('detail.views')}</span>)}
                    {property.listingSaves !== undefined && (<span className="flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5 text-[#7D8291]" /><span className="font-bold text-[#F5F0E6]">{property.listingSaves}</span> {t('detail.saves')}</span>)}
                  </div>
                  {property.listedBy && (
                    <div className="text-[12px] text-[#7D8291] space-y-0.5">
                      <div>{t('detail.listedBy')} <span className="text-[#A7ABB6]">{property.listedBy.name}</span> · {property.listedBy.phone}</div>
                      <div>{property.listedBy.brokerage}</div>
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-[#7D8291] uppercase tracking-wide break-words">{property.mls}</div>
                </div>

                {/* ── S5: Stay connected — Map + Travel Times ── */}
                <div className="py-5 border-b border-white/[0.06]">
                  <SectionHeading>{t('detail.stayConnected')}</SectionHeading>
                  {/* Google Maps embed — uses stored coords if available, otherwise geocodes address */}
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.06] mb-4" style={{ minHeight: '300px' }}>
                    <iframe
                      title={`Map of ${property.address}, ${property.city}, ${property.state}`}
                      src={
                        property.latitude && property.longitude
                          ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}, ${property.state}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                      }
                      width="100%"
                      height="300"
                      style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  {/* Travel times */}
                  {property.travelTimes && property.travelTimes.length > 0 && (
                    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Navigation className="w-4 h-4 text-[#F6D37A]" />
                        <span className="text-[14px] font-semibold text-[#F5F0E6]">{t('detail.travelTimes')}</span>
                      </div>
                      <div className="space-y-3">
                        {property.travelTimes.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPinned className="w-3.5 h-3.5 text-[#7D8291] flex-shrink-0" />
                              <span className="text-[#A7ABB6] truncate">{t.destination}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 text-[#D7DAE3]">
                              <span className="flex items-center gap-1"><Car className="w-3 h-3 text-[#7D8291]" /> {t.drive}</span>
                              <span className="flex items-center gap-1"><Train className="w-3 h-3 text-[#7D8291]" /> {t.transit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── S6: Open House ── */}
                {property.openHouse && property.openHouse.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.openHouse')}</SectionHeading>
                    <div className="space-y-3">
                      {property.openHouse.map((oh, i) => (
                        <div key={i} className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#B88717]/10 border border-[#B88717]/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-[#F6D37A]" />
                            </div>
                            <div>
                              <div className="text-[14px] font-semibold text-[#F5F0E6]">{oh.date}</div>
                              <div className="text-[12px] text-[#7D8291]">{oh.time}</div>
                            </div>
                          </div>
                          <button type="button" className="text-[12px] font-semibold text-[#B88717] hover:text-[#F6D37A] transition-colors cursor-pointer flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> <span>{t('detail.addToCalendar')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── S7: Facts & Features ── */}
                {property.facts && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.facts')}</SectionHeading>
                    <AccordionSection icon={<Bed className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.interior')} groups={property.facts.interior} defaultOpen />
                    {showAllFacts && (
                      <>
                        <AccordionSection icon={<Home className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.propertyDetails')} groups={property.facts.property} />
                        <AccordionSection icon={<Hammer className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.construction')} groups={property.facts.construction} />
                        <AccordionSection icon={<Zap className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.utilities')} groups={property.facts.utilities} />
                        <AccordionSection icon={<Building2 className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.communityHoa')} groups={property.facts.community} />
                        <AccordionSection icon={<DollarSign className="w-4 h-4 text-[#F6D37A]" />} title={t('detail.financialDetails')} groups={property.facts.financial} />
                      </>
                    )}
                    <button type="button" onClick={() => setShowAllFacts(!showAllFacts)} className="mt-2 text-[13px] font-semibold text-[#B88717] hover:text-[#F6D37A] transition-colors flex items-center gap-1 cursor-pointer">
                      {showAllFacts ? <><ChevronUp className="w-4 h-4" /> <span>{t('detail.showLess')}</span></> : <><ChevronDown className="w-4 h-4" /> <span>{t('detail.showMore')}</span></>}
                    </button>
                  </div>
                )}

                {/* ── S8: Contact a buyer's agent (mobile) ── */}
                <div ref={contactRef} className="py-5 border-b border-white/[0.06] lg:hidden" data-testid="contact-section">
                  <SectionHeading>{t('detail.contactAgent')}</SectionHeading>
                  <p className="text-[13px] text-[#7D8291] mb-5">{t('detail.contactQuestion')}</p>
                  <ContactForm property={property} formData={formData} formSubmitted={formSubmitted} onFormChange={handleFormChange} onPhoneChange={(val) => setFormData(prev => ({ ...prev, phone: val }))} onFormSubmit={handleFormSubmit} onReset={() => { setFormSubmitted(false); setFormData({ name: '', email: '', phone: '', message: '' }); }} />

                  {/* WhatsApp CTA (mobile) */}
                  <div className="mt-4">
                    {whatsappUrl ? (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold text-[14px] transition-colors">
                        <MessageCircle className="w-4 h-4" /><span>{t('detail.chatWhatsapp')}</span>
                      </a>
                    ) : (
                      <button type="button" disabled className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#7D8291] font-semibold text-[14px] cursor-not-allowed" title={t('detail.whatsappUnavailable')}>
                        <MessageCircle className="w-4 h-4" /><span>{t('detail.chatWhatsapp')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Schedule Viewing (mobile) ── */}
                <div className="py-5 border-b border-white/[0.06] lg:hidden" data-testid="schedule-viewing-mobile">
                  <SectionHeading>{t('detail.scheduleViewing')}</SectionHeading>
                  {scheduleSubmitted ? (
                    <div className="flex flex-col items-center text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3"><CheckCircle className="h-6 w-6 text-emerald-400" /></div>
                      <p className="text-[15px] font-semibold text-[#F5F0E6] mb-1">{t('schedule.viewingRequested')}</p>
                      <p className="text-[13px] text-[#A7ABB6] max-w-[360px] break-words">{t('schedule.paymentReceived')}</p>
                      <button type="button" onClick={() => { setScheduleSubmitted(false); setScheduleData({ name: '', phone: '', email: '', date: '', time: '', message: '' }); setShowSchedulePaypal(false); setScheduleFormValid(false); }} className="mt-3 text-[13px] text-[#B88717] hover:text-[#F6D37A] transition-colors cursor-pointer">{t('schedule.another')}</button>
                    </div>
                  ) : (
                    <form onSubmit={handleScheduleValidate} className="space-y-3">
                      <input name="name" type="text" required value={scheduleData.name} onChange={handleScheduleChange} placeholder={t('schedule.fullNamePlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
                      <PhoneInput value={scheduleData.phone} onChange={(val) => { setScheduleData(prev => ({ ...prev, phone: val })); setShowSchedulePaypal(false); }} placeholder={t('schedule.phonePlaceholder')} />
                      <input name="email" type="email" required value={scheduleData.email} onChange={handleScheduleChange} placeholder={t('schedule.emailPlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
                      <div className="grid grid-cols-2 gap-3">
                        <select name="date" required value={scheduleData.date} onChange={handleScheduleChange} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237D8291' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                          <option value="" disabled className="bg-[#15151D] text-[#7D8291]">📅 {t('schedule.selectDate')}</option>
                          {Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); const val = d.toISOString().split('T')[0]; const label = d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }); return <option key={val} value={val} className="bg-[#15151D] text-[#F5F0E6]">{label}</option>; })}
                        </select>
                        <select name="time" required value={scheduleData.time} onChange={handleScheduleChange} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237D8291' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                          <option value="" disabled className="bg-[#15151D] text-[#7D8291]">🕐 {t('schedule.selectTime')}</option>
                          {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => { const [h] = t.split(':').map(Number); const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM`; return <option key={t} value={t} className="bg-[#15151D] text-[#F5F0E6]">{label}</option>; })}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#7D8291] text-[12px]">{t('schedule.specialRequests')}</span>
                          <button type="button" onClick={() => { const n = scheduleData.name.trim() || (lang === 'vi' ? 'tôi' : 'me'); const addr = property?.address || ''; const msg = lang === 'vi' ? `Xin chào,\n\nTôi là ${n}. Tôi muốn đặt lịch xem bất động sản tại ${addr}. Vui lòng xác nhận lịch hẹn.\n\nCảm ơn.` : `Hello,\n\nMy name is ${n}. I'd like to schedule a viewing for the property at ${addr}. Please confirm the appointment.\n\nThank you.`; setScheduleData(prev => ({ ...prev, message: msg })); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#B88717]/20 to-purple-500/15 border border-[#B88717]/30 text-[10px] font-semibold text-[#F6D37A] hover:from-[#B88717]/30 hover:to-purple-500/25 hover:border-[#F6D37A]/50 transition-all cursor-pointer">{t('contact.aiSuggest')}</button>
                        </div>
                        <textarea name="message" rows={2} value={scheduleData.message} onChange={handleScheduleChange} placeholder={t('schedule.specialRequests')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors resize-none" />
                      </div>
                      {scheduleError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5"><p className="text-red-400 text-[12px]">{scheduleError}</p></div>}
                      {showSchedulePaypal && scheduleFormValid ? (
                        <div className="space-y-3">
                          <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4">
                            <p className="text-[#F5F0E6] text-[14px] font-semibold mb-1">💳 {t('schedule.depositTitle')}</p>
                            <p className="text-[#7D8291] text-[12px]">{t('schedule.depositDesc')}</p>
                          </div>
                          <PaymentGateway
                            amount={9}
                            description="Viewing deposit - So Do Van Phuc"
                            onSuccess={handleSchedulePaypalSuccess}
                            onError={(err) => { console.error('Payment error:', err); }}
                            mode="payment"
                            purpose="deposit"
                          />
                        </div>
                      ) : (
                        <button type="submit" className="w-full py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)] cursor-pointer flex items-center justify-center gap-2">
                          <CalendarClock className="w-4 h-4" /><span>{t('schedule.requestWithDeposit')}</span>
                        </button>
                      )}
                    </form>
                  )}
                </div>

                {/* ── S9: Offer Insights ── */}
                {property.offerInsights && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="offer-insights">
                    <SectionHeading>{t('detail.offerInsights')}</SectionHeading>
                    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 space-y-4">
                      {/* Strength chips */}
                      <div className="flex flex-wrap gap-2">
                        {(['Strong', 'Competitive', 'Moderate', 'Weak'] as const).map((s) => (
                          <span key={s} className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${s === property.offerInsights!.strength ? 'bg-[#B88717]/20 text-[#F6D37A] border border-[#B88717]/30' : 'bg-white/[0.04] text-[#7D8291] border border-white/[0.06]'}`}>{offerStrengthLabel(s)}</span>
                        ))}
                      </div>
                      <div className="text-[13px] text-[#A7ABB6]">{t('detail.offerRange')} <span className="text-[#F5F0E6] font-semibold">{property.offerInsights.estimatedRange}</span></div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-[12px] text-emerald-400 font-medium">{formatTemplate(t('detail.winChance'), { chance: property.offerInsights.winChance })}</span>
                      </div>
                      {/* Buyer profile prompt */}
                      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <Lock className="w-5 h-5 text-[#7D8291] flex-shrink-0" />
                        <div>
                          <div className="text-[13px] font-semibold text-[#F5F0E6]">{t('detail.buyerProfile')}</div>
                          <div className="text-[11px] text-[#7D8291]">{t('detail.buyerProfileHint')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── S10: Market Value ── */}
                {property.marketValue !== undefined && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.marketValue')}</SectionHeading>
                    {property.marketValue ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {property.marketValue.estimatedRange && (
                          <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4">
                            <div className="text-[12px] text-[#7D8291] mb-1">{t('detail.estimatedSalesRange')}</div>
                            <div className="text-[15px] font-bold text-[#F5F0E6]">{property.marketValue.estimatedRange}</div>
                          </div>
                        )}
                        {property.marketValue.zestimate && (
                          <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4">
                            <div className="text-[12px] text-[#7D8291] mb-1">{t('detail.estimatedMarketValue')}</div>
                            <div className="text-[15px] font-bold text-[#F6D37A]">{property.marketValue.zestimate}</div>
                          </div>
                        )}
                        {property.marketValue.rentZestimate && (
                          <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4">
                            <div className="text-[12px] text-[#7D8291] mb-1">{t('detail.estimatedMonthlyRent')}</div>
                            <div className="text-[15px] font-bold text-[#F5F0E6]">{property.marketValue.rentZestimate}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 text-center text-[13px] text-[#7D8291]">{t('detail.marketUnavailable')}</div>
                    )}
                  </div>
                )}

                {/* ── S11: Public Tax History ── */}
                <div className="py-5 border-b border-white/[0.06]" data-testid="public-tax-history">
                  <SectionHeading>{t('detail.taxHistory')}</SectionHeading>
                  {property.publicTaxHistory && property.publicTaxHistory.length > 0 ? (
                    <>
                      <button type="button" onClick={() => setShowTaxHistory(!showTaxHistory)} className="w-full bg-[#15151D] rounded-xl border border-white/[0.06] p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors">
                        <span className="text-[14px] font-semibold text-[#F5F0E6]">{formatTemplate(t('detail.viewTaxRecords'), { count: property.publicTaxHistory.length })}</span>
                        {showTaxHistory ? <ChevronUp className="w-4 h-4 text-[#7D8291]" /> : <ChevronDown className="w-4 h-4 text-[#7D8291]" />}
                      </button>
                      {showTaxHistory && (
                        <div className="mt-3 overflow-x-auto scrollbar-hide">
                          <table className="w-full text-[13px] min-w-[300px]">
                            <thead><tr className="text-[#7D8291] text-left border-b border-white/[0.06]"><th className="pb-2 pr-4 font-medium">{t('detail.year')}</th><th className="pb-2 pr-4 font-medium text-right">{t('detail.tax')}</th><th className="pb-2 font-medium text-right">{t('detail.assessment')}</th></tr></thead>
                            <tbody>
                              {property.publicTaxHistory.map((row, i) => (
                                <tr key={i} className="border-b border-white/[0.04]"><td className="py-3 pr-4 text-[#F5F0E6] font-medium">{row.year}</td><td className="py-3 pr-4 text-[#F5F0E6] text-right">{row.tax}</td><td className="py-3 text-[#A7ABB6] text-right">{row.assessment}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 text-center text-[13px] text-[#7D8291]">{t('detail.taxUnavailable')}</div>
                  )}
                </div>

                {/* ── S12: Price History ── */}
                {property.priceHistory && property.priceHistory.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.priceHistory')}</SectionHeading>
                    <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full text-[13px] min-w-[360px]">
                        <thead><tr className="text-[#7D8291] text-left border-b border-white/[0.06]"><th className="pb-2 pr-4 font-medium">{t('detail.date')}</th><th className="pb-2 pr-4 font-medium">{t('detail.event')}</th><th className="pb-2 pr-4 font-medium text-right">{t('detail.price')}</th><th className="pb-2 font-medium text-right">{t('detail.pricePerSqft')}</th></tr></thead>
                        <tbody>
                          {property.priceHistory.map((row, i) => (
                            <tr key={i} className="border-b border-white/[0.04]"><td className="py-3 pr-4 text-[#A7ABB6]">{row.date}</td><td className="py-3 pr-4 text-[#F5F0E6] font-medium">{row.event}</td><td className="py-3 pr-4 text-[#F5F0E6] font-semibold text-right">{row.price}</td><td className="py-3 text-[#A7ABB6] text-right">{row.pricePerSqft}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── S13: Monthly Payment (enhanced) ── */}
                {monthlyPayment && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="monthly-payment">
                    <SectionHeading>{t('detail.monthlyPayment')}</SectionHeading>
                    <p className="text-[12px] text-[#7D8291] mb-4 -mt-2">{t('detail.paymentEstimate')}</p>
                    <div className="text-center mb-5">
                      <span className="text-[32px] font-bold text-[#F6D37A]">${monthlyPayment.total.toLocaleString()}</span>
                      <span className="text-[14px] text-[#7D8291]">{t('prop.perMonth')}</span>
                    </div>
                    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] overflow-hidden">
                      <PaymentRow color="bg-blue-500" label={t('detail.principalInterest')} amount={monthlyPayment.principal} detail={formatTemplate(t('detail.loanDetail'), { amount: (property.numericPrice * 0.8).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) })} />
                      <PaymentRow color="bg-emerald-500" label={t('detail.propertyTax')} amount={monthlyPayment.tax} detail={formatTemplate(t('detail.taxDetail'), { amount: (monthlyPayment.tax * 12).toLocaleString(), rate: ((property.annualTax ?? property.numericPrice * 0.012) / property.numericPrice * 100).toFixed(2) })} />
                      <PaymentRow color="bg-amber-500" label={t('detail.homeInsurance')} amount={monthlyPayment.insurance} detail={t('detail.insuranceDetail')} />
                      {monthlyPayment.hoa > 0 && <PaymentRow color="bg-purple-500" label="HOA" amount={monthlyPayment.hoa} detail={t('detail.hoaDetail')} />}
                    </div>
                  </div>
                )}

                {/* ── S14: Down Payment Assistance ── */}
                {property.listingType === 'sale' && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.downPayment')}</SectionHeading>
                    <div className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#F5F0E6] mb-0.5">{t('detail.programsAvailable')}</div>
                        <div className="text-[12px] text-[#7D8291]">{t('detail.downPaymentQualify')}</div>
                      </div>
                      <button type="button" className="text-[12px] font-semibold text-[#B88717] hover:text-[#F6D37A] transition-colors cursor-pointer whitespace-nowrap">{t('detail.checkEligibility')}</button>
                    </div>
                  </div>
                )}

                {/* ── S15: Climate Risks ── */}
                {property.climateRisks && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.climateRisks')}</SectionHeading>
                    <p className="text-[12px] text-[#7D8291] mb-4 -mt-2">{t('detail.environmentalRiskDesc')}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ClimateRiskCard icon={<Droplets className="w-4 h-4 text-blue-400" />} title={t('detail.flood')} level={property.climateRisks.flood.level} description={property.climateRisks.flood.description} />
                      <ClimateRiskCard icon={<Flame className="w-4 h-4 text-orange-400" />} title={t('detail.fire')} level={property.climateRisks.fire.level} description={property.climateRisks.fire.description} />
                      <ClimateRiskCard icon={<Thermometer className="w-4 h-4 text-red-400" />} title={t('detail.heat')} level={property.climateRisks.heat.level} description={property.climateRisks.heat.description} />
                      <ClimateRiskCard icon={<Wind className="w-4 h-4 text-cyan-400" />} title={t('detail.wind')} level={property.climateRisks.wind.level} description={property.climateRisks.wind.description} />
                    </div>
                  </div>
                )}

                {/* ── S16: Getting Around ── */}
                {(property.walkScore || property.bikeScore || property.transitScore) && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <SectionHeading>{t('detail.gettingAround')}</SectionHeading>
                    <div className="space-y-4">
                      <ScoreBadge icon={<Footprints className="w-5 h-5" />} label={t('detail.walkScore')} score={property.walkScore} desc={getScoreLabel(property.walkScore ?? 0)} />
                      <ScoreBadge icon={<Bike className="w-5 h-5" />} label={t('detail.bikeScore')} score={property.bikeScore} desc={getBikeLabel(property.bikeScore ?? 0)} />
                      <ScoreBadge icon={<Bus className="w-5 h-5" />} label={t('detail.transitScore')} score={property.transitScore} desc={property.transitScore && property.transitScore >= 50 ? t('detail.goodTransit') : t('detail.someTransit')} />
                    </div>
                  </div>
                )}

                {/* ── S17: Nearby Schools ── */}
                {property.nearbySchools && property.nearbySchools.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="nearby-schools">
                    <SectionHeading>{t('detail.nearbySchools')}</SectionHeading>
                    <div className="space-y-3">
                      {(showAllSchools ? property.nearbySchools : property.nearbySchools.slice(0, 2)).map((s, i) => (
                        <div key={i} className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 flex items-center gap-3">
                          <SchoolScore rating={s.rating} type={s.type} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[#F5F0E6] truncate">{s.name}</div>
                            <div className="text-[12px] text-[#7D8291]">{s.type} · {t('detail.grades')} {s.grades} · {s.distance}</div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#7D8291] flex-shrink-0">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>{s.rating}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {property.nearbySchools.length > 2 && (
                      <button type="button" onClick={() => setShowAllSchools(!showAllSchools)} className="mt-3 text-[13px] font-semibold text-[#B88717] hover:text-[#F6D37A] transition-colors flex items-center gap-1 cursor-pointer">
                        {showAllSchools ? <><ChevronUp className="w-4 h-4" /> <span>{t('detail.showLess')}</span></> : <><ChevronDown className="w-4 h-4" /> <span>{formatTemplate(t('detail.showAllSchools'), { count: property.nearbySchools.length })}</span></>}
                      </button>
                    )}
                  </div>
                )}

                {/* ── S18: Nearby Homes ── */}
                {nearbyHomes.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="similar-homes">
                    <SectionHeading>{t('detail.similarHomes')}</SectionHeading>
                    <div className="grid grid-cols-2 gap-3">{nearbyHomes.map(renderPropertyCard)}</div>
                  </div>
                )}

                {/* ── S19: Local Experts ── */}
                {property.localExperts && property.localExperts.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="local-experts">
                    <SectionHeading>{t('detail.localExperts')}</SectionHeading>
                    <div className="space-y-3">
                      {property.localExperts.map((expert, i) => (
                        <div key={i} className="bg-[#15151D] rounded-xl border border-white/[0.06] p-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#B88717]/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#F6D37A] font-bold text-[15px]">{expert.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[#F5F0E6]">{expert.name}</div>
                            <div className="text-[12px] text-[#7D8291]">{expert.title}</div>
                            <div className="text-[11px] text-[#A7ABB6]"><Star className="w-3 h-3 text-[#F6D37A] inline mr-1" />{formatTemplate(t('detail.recentSales'), { count: expert.sales })}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="mt-3 w-full py-3 rounded-xl border border-[#B88717]/30 text-[#F6D37A] font-semibold text-[13px] hover:bg-[#B88717]/10 transition-colors cursor-pointer">
                      {t('detail.browseLocalExperts')}
                    </button>
                  </div>
                )}

                {/* ── S20: Homes for you ── */}
                {homesForYou.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]" data-testid="detail-homes-for-you">
                    <SectionHeading>{t('common.homesForYou')}</SectionHeading>
                    <div className="grid grid-cols-2 gap-3">{homesForYou.map(renderPropertyCard)}</div>
                  </div>
                )}

                {/* ── S21: Local legal protections ── */}
                {property.legalProtections && property.legalProtections.length > 0 && (
                  <div className="py-5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-[#7D8291]" />
                       <span className="text-[14px] font-semibold text-[#F5F0E6]">{t('detail.localLegalProtections')}</span>
                    </div>
                    <ul className="space-y-2">
                      {property.legalProtections.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#7D8291]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── S22: Resource Links / Footer ── */}
                {property.resourceLinks && property.resourceLinks.length > 0 && (
                  <div className="py-5">
                    <div className="text-[14px] font-semibold text-[#F5F0E6] mb-3">{t('detail.exploreNearby')}</div>
                    <div className="flex flex-wrap gap-2">
                      {property.resourceLinks.map((r, i) => (
                        <span key={i} className="text-[12px] text-[#A7ABB6] bg-[#15151D] border border-white/[0.06] px-3 py-1.5 rounded-full hover:text-[#F6D37A] hover:border-[#B88717]/30 transition-colors cursor-pointer">
                          {r.label}{r.count !== undefined && <span className="text-[#7D8291] ml-1">({r.count})</span>}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-[#7D8291] leading-relaxed space-y-2">
                      <p>{t('detail.listingLegalUse')}</p>
                      <p>{t('detail.brokerageDisclosure')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── RIGHT SIDEBAR (desktop only) ─── */}
              <div className="hidden lg:block min-w-0">
                <div className="sticky top-[84px] space-y-5">
                  <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 space-y-4 min-w-0">
                    <h2 className="text-[17px] font-bold text-[#F6D37A]">{t('detail.interested')}</h2>
                    <p className="text-[13px] text-[#A7ABB6] leading-relaxed">{t('detail.sidebarContactDesc')}</p>
                    {agentPhone && (
                      <a href={`tel:${agentPhone}`} className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)]">
                        <Phone className="h-4 w-4 flex-shrink-0" /><span>{t('detail.callNow')}</span>
                      </a>
                    )}
                    {agentEmail && (
                      <a href={`mailto:${agentEmail}`} className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-[#F5F0E6] font-semibold text-[14px] transition-colors">
                        <Mail className="h-4 w-4 flex-shrink-0" /><span>{t('detail.emailAgent')}</span>
                      </a>
                    )}
                    <div className="pt-3 border-t border-white/[0.085]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#B88717]/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#F6D37A] font-bold text-[14px]">{(agentName || 'GF').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#F5F0E6] break-words">{agentName || t('detail.agentFallback')}</div>
                          <div className="text-[11px] text-[#7D8291] break-words">{property.listedBy?.brokerage ?? t('detail.licensedProfessional')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 min-w-0">
                    <h3 className="text-[15px] font-bold text-[#F6D37A] mb-4">{t('detail.sendInquiry')}</h3>
                    <ContactForm property={property} formData={formData} formSubmitted={formSubmitted} formError={formError} onFormChange={handleFormChange} onPhoneChange={(val) => setFormData(prev => ({ ...prev, phone: val }))} onFormSubmit={handleFormSubmit} onReset={() => { setFormSubmitted(false); setFormError(''); setFormData({ name: '', email: '', phone: '', message: '' }); }} />
                  </div>

                  {/* WhatsApp CTA (desktop sidebar) */}
                  <div className="mt-4">
                    {whatsappUrl ? (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold text-[14px] transition-colors">
                        <MessageCircle className="w-4 h-4" /><span>{t('detail.chatWhatsapp')}</span>
                      </a>
                    ) : (
                      <button type="button" disabled className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#7D8291] font-semibold text-[14px] cursor-not-allowed" title={t('detail.whatsappUnavailable')}>
                        <MessageCircle className="w-4 h-4" /><span>{t('detail.chatWhatsapp')}</span>
                      </button>
                    )}
                  </div>

                  {/* Schedule Viewing (desktop sidebar) */}
                  <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 min-w-0 mt-5">
                    <h3 className="text-[15px] font-bold text-[#F6D37A] mb-4 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#F6D37A]" /> {t('detail.scheduleViewing')}</h3>
                    {scheduleSubmitted ? (
                      <div className="flex flex-col items-center text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3"><CheckCircle className="h-6 w-6 text-emerald-400" /></div>
                        <p className="text-[15px] font-semibold text-[#F5F0E6] mb-1">{t('schedule.viewingRequested')}</p>
                        <p className="text-[13px] text-[#A7ABB6]">{t('schedule.paymentReceived')}</p>
                        <button type="button" onClick={() => { setScheduleSubmitted(false); setScheduleData({ name: '', phone: '', email: '', date: '', time: '', message: '' }); setShowSchedulePaypal(false); setScheduleFormValid(false); }} className="mt-3 text-[13px] text-[#B88717] hover:text-[#F6D37A] transition-colors cursor-pointer">{t('schedule.another')}</button>
                      </div>
                    ) : (
                      <form onSubmit={handleScheduleValidate} className="space-y-3">
                      <input name="name" type="text" required value={scheduleData.name} onChange={handleScheduleChange} placeholder={t('schedule.fullNamePlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
                      <PhoneInput value={scheduleData.phone} onChange={(val) => { setScheduleData(prev => ({ ...prev, phone: val })); setShowSchedulePaypal(false); }} placeholder={t('schedule.phonePlaceholder')} />
                      <input name="email" type="email" required value={scheduleData.email} onChange={handleScheduleChange} placeholder={t('schedule.emailPlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
                        <div className="grid grid-cols-2 gap-3">
                          <select name="date" required value={scheduleData.date} onChange={handleScheduleChange} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237D8291' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                            <option value="" disabled className="bg-[#15151D] text-[#7D8291]">📅 {t('schedule.selectDate')}</option>
                            {Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); const val = d.toISOString().split('T')[0]; const label = d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }); return <option key={val} value={val} className="bg-[#15151D] text-[#F5F0E6]">{label}</option>; })}
                          </select>
                          <select name="time" required value={scheduleData.time} onChange={handleScheduleChange} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237D8291' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                            <option value="" disabled className="bg-[#15151D] text-[#7D8291]">🕐 {t('schedule.selectTime')}</option>
                            {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => { const [h] = t.split(':').map(Number); const label = h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM`; return <option key={t} value={t} className="bg-[#15151D] text-[#F5F0E6]">{label}</option>; })}
                          </select>
                        </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#7D8291] text-[12px]">{t('schedule.specialRequests')}</span>
                          <button type="button" onClick={() => { const n = scheduleData.name.trim() || (lang === 'vi' ? 'tôi' : 'me'); const addr = property?.address || ''; const msg = lang === 'vi' ? `Xin chào,\n\nTôi là ${n}. Tôi muốn đặt lịch xem bất động sản tại ${addr}. Vui lòng xác nhận lịch hẹn.\n\nCảm ơn.` : `Hello,\n\nMy name is ${n}. I'd like to schedule a viewing for the property at ${addr}. Please confirm the appointment.\n\nThank you.`; setScheduleData(prev => ({ ...prev, message: msg })); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#B88717]/20 to-purple-500/15 border border-[#B88717]/30 text-[10px] font-semibold text-[#F6D37A] hover:from-[#B88717]/30 hover:to-purple-500/25 hover:border-[#F6D37A]/50 transition-all cursor-pointer">{t('contact.aiSuggest')}</button>
                        </div>
                        <textarea name="message" rows={2} value={scheduleData.message} onChange={handleScheduleChange} placeholder={t('schedule.specialRequests')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors resize-none" />
                      </div>
                        {scheduleError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5"><p className="text-red-400 text-[12px]">{scheduleError}</p></div>}
                        {showSchedulePaypal && scheduleFormValid ? (
                          <div className="space-y-3">
                            <div className="bg-[#0c0c12] rounded-xl border border-white/[0.085] p-4">
                              <p className="text-[#F5F0E6] text-[14px] font-semibold mb-1">💳 {t('schedule.depositTitle')}</p>
                              <p className="text-[#7D8291] text-[12px]">{t('schedule.depositDesc')}</p>
                            </div>
                            <PaymentGateway
                              amount={9}
                              description="Viewing deposit - So Do Van Phuc"
                              onSuccess={handleSchedulePaypalSuccess}
                              onError={(err) => { console.error('Payment error:', err); }}
                              mode="payment"
                              purpose="deposit"
                            />
                          </div>
                        ) : (
                          <button type="submit" className="w-full py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)] cursor-pointer flex items-center justify-center gap-2">
                            <CalendarClock className="w-4 h-4" /><span>{t('schedule.requestWithDeposit')}</span>
                          </button>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ STICKY BOTTOM CTA (mobile only) ═══ */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c12]/95 backdrop-blur-md border-t border-white/[0.08] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-3 z-[60] lg:hidden shadow-[0_-18px_44px_rgba(0,0,0,0.38)]">
            {agentPhone ? (
              <a href={`tel:${agentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#B88717]/40 text-[#F6D37A] font-semibold text-[14px] hover:bg-[#B88717]/10 transition-colors">
                <Phone className="w-4 h-4" /><span>{t('detail.callAgent')}</span>
              </a>
            ) : (
              <button type="button" onClick={scrollToContact} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#B88717]/40 text-[#F6D37A] font-semibold text-[14px] hover:bg-[#B88717]/10 transition-colors cursor-pointer">
                <Phone className="w-4 h-4" /><span>{t('info.contact')}</span>
              </button>
            )}
            <button type="button" onClick={scrollToContact} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_4px_16px_rgba(184,135,23,0.3)] cursor-pointer">
              <Mail className="w-4 h-4" /><span>{t('detail.messageAgent')}</span>
            </button>
          </div>

          {/* ═══ GALLERY MODAL ═══ */}
          {showGallery && <GalleryModal images={galleryImages} startIndex={galleryIdx} onClose={() => setShowGallery(false)} />}

          {/* ═══ REPORT MODAL ═══ */}
          {showReportModal && (
            <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
              <div className="bg-[#15151D] rounded-2xl border border-white/[0.085] shadow-[0_22px_52px_rgba(0,0,0,0.42)] w-full max-w-[440px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                  <h2 className="text-[17px] font-bold text-[#F6D37A] flex items-center gap-2"><Flag className="w-4 h-4 text-red-400" /> {t('report.title')}</h2>
                  <button type="button" onClick={() => setShowReportModal(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer transition-colors">
                    <X className="w-4 h-4 text-[#A7ABB6]" />
                  </button>
                </div>
                {reportStatus === 'success' ? (
                  <div className="flex flex-col items-center text-center py-8 px-5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3"><CheckCircle className="h-6 w-6 text-emerald-400" /></div>
                    <p className="text-[15px] font-semibold text-[#F5F0E6] mb-1">{t('report.submitted')}</p>
                    <p className="text-[13px] text-[#A7ABB6]">{t('report.thanks')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="p-5 space-y-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#A7ABB6] mb-1.5">{t('report.reason')} *</label>
                      <select value={reportReason} onChange={(e) => setReportReason(e.target.value as ReportReason)} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none cursor-pointer">
                        <option value="spam">{t('report.spam')}</option>
                        <option value="incorrect">{t('report.incorrect')}</option>
                        <option value="scam">{t('report.scam')}</option>
                        <option value="duplicate">{t('report.duplicate')}</option>
                        <option value="other">{t('report.other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#A7ABB6] mb-1.5">{t('report.description')} *</label>
                      <textarea required rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder={t('report.describeIssue')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors resize-none" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#A7ABB6] mb-1.5">{t('report.emailOptional')}</label>
                      <input type="email" value={reportEmail} onChange={(e) => setReportEmail(e.target.value)} placeholder="email@example.com" className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
                    </div>
                    {reportStatus === 'error' && (
                      <p className="text-[12px] text-red-400">{t('report.genericError')}</p>
                    )}
                    <button type="submit" className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-[14px] transition-colors cursor-pointer">
                      {t('report.submit')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      ) : detailLoading ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center pb-28 lg:pb-16">
          <div className="w-20 h-20 rounded-2xl bg-[#15151D] border border-white/[0.085] flex items-center justify-center mb-5">
            <Home className="h-9 w-9 text-[#7D8291]" />
          </div>
          <h1 className="text-[24px] font-bold text-[#F6D37A] mb-3">{t('common.loading')}</h1>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center pb-28 lg:pb-16">
          <div className="w-20 h-20 rounded-2xl bg-[#15151D] border border-white/[0.085] flex items-center justify-center mb-5"><Home className="h-9 w-9 text-[#7D8291]" /></div>
          <h1 className="text-[24px] font-bold text-[#F6D37A] mb-3">{t('detail.propertyNotFound')}</h1>
          <p className="text-[14px] text-[#7D8291] max-w-[400px] mx-auto mb-6 px-2 break-words">{t('detail.propertyNotFoundDesc')}</p>
          <Link to="/buy" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]">
            <ArrowLeft className="h-4 w-4" /><span>{t('detail.browseListings')}</span>
          </Link>
        </div>
      )}
    </PageShell>
  );
};

/* ═══════════════════════════════════════════════════════
 *  CONTACT FORM (reusable)
 * ═══════════════════════════════════════════════════════ */
function ContactForm({ property, formData, formSubmitted, formError, onFormChange, onPhoneChange, onFormSubmit, onReset }: {
  property: Property;
  formData: { name: string; email: string; phone: string; message: string };
  formSubmitted: boolean;
  formError?: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhoneChange: (val: string) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  const { t, lang } = useLanguage();

  const handleAiSuggest = () => {
    const name = formData.name.trim() || (lang === 'vi' ? 'tôi' : 'me');
    const addr = property.address || '';
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const emailPart = email ? (lang === 'vi' ? ` Email: ${email}.` : ` Email: ${email}.`) : '';
    const phonePart = phone ? (lang === 'vi' ? ` SĐT: ${phone}.` : ` Phone: ${phone}.`) : '';

    const suggestions = lang === 'vi' ? [
      `Xin chào,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi quan tâm đến bất động sản tại ${addr} và muốn biết thêm chi tiết. Vui lòng liên hệ lại với tôi sớm nhất.\n\nCảm ơn.`,
      `Chào bạn,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi muốn tìm hiểu thêm về bất động sản tại ${addr}, bao gồm giá cả, tình trạng và thủ tục mua/thuê. Mong nhận được phản hồi sớm.\n\nTrân trọng.`,
      `Xin chào,\n\nTôi là ${name}.${emailPart}${phonePart}\n\nTôi đang xem xét bất động sản tại ${addr}. Vui lòng cho tôi biết thêm thông tin chi tiết và các bước tiếp theo.\n\nXin cảm ơn.`,
    ] : [
      `Hello,\n\nMy name is ${name}.${emailPart}${phonePart}\n\nI'm interested in the property at ${addr} and would like to learn more about it. Please get back to me at your earliest convenience.\n\nThank you.`,
      `Hi,\n\nThis is ${name}.${emailPart}${phonePart}\n\nI'd like more details about the listing at ${addr}, including pricing, availability, and the buying/renting process. Looking forward to hearing from you.\n\nBest regards.`,
      `Hello,\n\nI'm ${name}.${emailPart}${phonePart}\n\nI'm considering the property at ${addr}. Could you please provide additional details and next steps?\n\nThank you.`,
    ];
    const synth = { target: { name: 'message', value: suggestions[Math.floor(Math.random() * suggestions.length)] } } as React.ChangeEvent<HTMLTextAreaElement>;
    onFormChange(synth);
  };

  if (formSubmitted) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3"><CheckCircle className="h-6 w-6 text-emerald-400" /></div>
        <p className="text-[15px] font-semibold text-[#F5F0E6] mb-1">{t('contact.inquirySent')}</p>
        <p className="text-[13px] text-[#A7ABB6] max-w-[360px] break-words">{t('contact.inquirySentDesc')}</p>
        <button type="button" onClick={onReset} className="mt-3 text-[13px] text-[#B88717] hover:text-[#F6D37A] transition-colors cursor-pointer">{t('contact.sendAnotherInquiry')}</button>
      </div>
    );
  }
  return (
    <form onSubmit={onFormSubmit} className="space-y-3">
      <input name="name" type="text" required value={formData.name} onChange={onFormChange} placeholder={t('schedule.fullNamePlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
      <input name="email" type="email" required value={formData.email} onChange={onFormChange} placeholder={t('schedule.emailPlaceholder')} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors" />
      <PhoneInput value={formData.phone} onChange={onPhoneChange} placeholder={t('contact.phoneOptional')} />
      <div>
        <div className="flex items-center justify-end mb-1">
          <button type="button" onClick={handleAiSuggest} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#B88717]/20 to-purple-500/15 border border-[#B88717]/30 text-[10px] font-semibold text-[#F6D37A] hover:from-[#B88717]/30 hover:to-purple-500/25 hover:border-[#F6D37A]/50 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(246,211,122,0.15)]">{t('contact.aiSuggest')}</button>
        </div>
        <textarea name="message" required rows={3} value={formData.message} onChange={onFormChange} placeholder={t('detail.inquiryPlaceholder').replace('{address}', property.address)} className="w-full px-4 py-2.5 bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[14px] text-[#F5F0E6] placeholder-[#7D8291] focus:border-[#B88717]/50 focus:outline-none transition-colors resize-none" />
      </div>
      {formError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
          <p className="text-red-400 text-[12px]">{formError}</p>
        </div>
      )}
      <button type="submit" className="w-full py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_8px_20px_rgba(184,135,23,0.25)] cursor-pointer">{t('contact.submitInquiry')}</button>
    </form>
  );
}

export default PropertyDetailPage;
