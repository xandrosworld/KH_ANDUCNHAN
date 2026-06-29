import { useEffect, useState, useRef, useCallback, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  ImageIcon,
  FileText,
  MapPin,
  DollarSign,
  Info,
  Upload,
  X,
  Camera,
  Sparkles,
  Video,
  Loader2,
  AlertTriangle,
  CreditCard,
  User,
  ExternalLink,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import PaymentGateway from '../components/PaymentGateway';
import PhoneInput from '../components/PhoneInput';
import LocationMapPicker from '../components/LocationMapPicker';
import { generateDescription } from '../services/aiDescription';
import { createExpiryDate } from '../utils/expiryUtils';
import { listingService } from '../services/listingService';
import { resizeAndWatermark } from '../utils/watermark';
import { isApiConfigured, getApiBase } from '../services/apiClient';
import { publicSubmitProperty, type PublicSubmitData } from '../services/propertyApi';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserItem, setUserItem, removeUserItem } from '../utils/userStorage';
import type { Property } from '../data/properties';

interface FormData {
  title: string;
  propertyType: string;
  listingType: string;
  tier: 'free' | 'pro';
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  listingDays: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
  whatsappUrl: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialForm: FormData = {
  title: '',
  propertyType: 'Single Family',
  listingType: 'sale',
  tier: 'free',
  price: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  latitude: null,
  longitude: null,
  description: '',
  listingDays: 7,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  youtubeUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  xUrl: '',
  whatsappUrl: '',
};

const inputClass =
  'w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors';

const selectClass =
  'w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors appearance-none';

const labelClass = 'block text-[#A7ABB6] text-[13px] font-medium mb-1.5';

const errorClass = 'text-red-400 text-[12px] mt-1';

const sectionKeys = [
  { num: 1, key: 'post.basicInfo', icon: Info },
  { num: 2, key: 'post.priceSpecs', icon: DollarSign },
  { num: 3, key: 'post.location', icon: MapPin },
  { num: 4, key: 'post.photos', icon: Camera },
  { num: 5, key: 'post.descLabel', icon: FileText },
  { num: 6, key: 'post.video', icon: Video },
  { num: 7, key: 'post.contactInfo', icon: User },
];

const SectionHeader = ({ num, title, icon: Icon }: { num: number; title: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-lg bg-[#B88717]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-[#F6D37A] text-[18px] font-bold">{num}</span>
    </div>
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-4 w-4 text-[#7D8291] flex-shrink-0" />
      <h3 className="text-[#F6D37A] font-semibold text-[17px] break-words">{title}</h3>
    </div>
  </div>
);

const MAX_IMAGES = 41;
const MAX_IMAGE_SIZE_MB = 20;
const MAX_VIDEOS = 1;
const MAX_VIDEO_SIZE_MB = 120;
const FREE_POST_LIMIT = 10;
const PRO_PRICES: Record<number, number> = { 7: 9, 14: 17, 21: 24, 30: 30 };

type ExternalLinkFieldKey = 'youtubeUrl' | 'facebookUrl' | 'instagramUrl' | 'tiktokUrl' | 'xUrl';

const externalLinkFields: Array<{ key: ExternalLinkFieldKey; label: string; placeholder: string }> = [
  { key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://www.youtube.com/watch?v=...' },
  { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'tiktokUrl', label: 'TikTok', placeholder: 'https://www.tiktok.com/@...' },
  { key: 'xUrl', label: 'X', placeholder: 'https://x.com/...' },
];

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizePhoneDigits = (value: string) =>
  value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');

const hasEnoughPhoneDigits = (value: string) =>
  normalizePhoneDigits(value).replace(/\D/g, '').length >= 7;

const buildWhatsappUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (isValidHttpUrl(trimmed)) return trimmed;
  const digits = normalizePhoneDigits(trimmed).replace(/^\+/, '');
  return digits ? `https://wa.me/${digits}` : '';
};



const formatTemplate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );

const PostPropertyPage = () => {
  const { t } = useLanguage();
  usePageTitle(t('nav.post'));

  const sections = sectionKeys.map(s => ({ ...s, title: t(s.key) }));
  const DRAFT_KEY = 'gf_post_draft';

  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = getUserItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormData>;
        return { ...initialForm, ...parsed };
      }
    } catch { /* ignore */ }
    return initialForm;
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // raw File refs for API upload
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageSizeError, setImageSizeError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [paypalOrderId, setPaypalOrderId] = useState<string>('');
  // Card verification temporarily disabled (PayPal restricted)
  // const [cardVerified, setCardVerified] = useState(false);
  const [freePostsUsed, setFreePostsUsed] = useState(0);
  const [previewLightbox, setPreviewLightbox] = useState<number | null>(null); // index of image to show fullscreen

  const isPro = form.tier === 'pro';
  const selectedProPrice = PRO_PRICES[form.listingDays] || PRO_PRICES[7];
  const freePostsRemaining = Math.max(FREE_POST_LIMIT - freePostsUsed, 0);
  const freePostsProgress = (freePostsRemaining / FREE_POST_LIMIT) * 100;
  const paymentExplain = formatTemplate(t('post.paymentExplain'), {
    price: `$${selectedProPrice}`,
    days: form.listingDays,
  });
  const freePostsText = formatTemplate(t('post.freePostsRemaining'), {
    count: freePostsRemaining,
    limit: FREE_POST_LIMIT,
  });

  useEffect(() => () => {
    if (videoPreviewRef.current) {
      URL.revokeObjectURL(videoPreviewRef.current);
    }
  }, []);

  // Auto-save draft on form changes (debounced)
  useEffect(() => {
    if (submitted) return;
    const timer = setTimeout(() => {
      // Only save if user has typed something
      const hasContent = form.title || form.price || form.address || form.description || form.contactName;
      if (hasContent) {
        setUserItem(DRAFT_KEY, JSON.stringify(form));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form, submitted]);

  // Fetch free post status from API on mount
  useEffect(() => {
    if (!isApiConfigured()) return;
    const raw = localStorage.getItem('gf_user');
    if (!raw) return;
    const token = JSON.parse(raw).token;
    fetch(`${getApiBase()}/api/auth/free-post-status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        const d = json.data || json;
        // card_verified check disabled (PayPal restricted)
        if (d.free_posts_used !== undefined) setFreePostsUsed(d.free_posts_used);
      })
      .catch(() => { /* ignore */ });
  }, []);

  const refreshFreePostCount = useCallback(() => {
    if (!isApiConfigured()) return;
    const raw = localStorage.getItem('gf_user');
    if (!raw) return;
    const token = JSON.parse(raw).token;
    fetch(`${getApiBase()}/api/auth/free-post-status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        const d = json.data || json;
        if (d.free_posts_used !== undefined) setFreePostsUsed(d.free_posts_used);
      })
      .catch(() => { /* ignore */ });
  }, []);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const result = await generateDescription({
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: form.price,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        sqft: form.sqft,
        address: form.address,
        city: form.city,
        state: form.state,
        isVip: form.tier === 'pro',
      });
      setForm((prev) => ({ ...prev, description: result }));
    } catch {
      /* ignore */
    } finally {
      setAiLoading(false);
    }
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles_ = fileArray.filter((f) => f.type.startsWith('image/'));

    if (imageFiles_.length === 0) return;

    // Check file sizes and warn about oversized images
    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const oversized = imageFiles_.filter((f) => f.size > maxBytes);
    const validFiles = imageFiles_.filter((f) => f.size <= maxBytes);

    if (oversized.length > 0) {
      const names = oversized.map((f) => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)}MB)`).join(', ');
      setImageSizeError(
        `${oversized.length} ảnh vượt quá ${MAX_IMAGE_SIZE_MB}MB và đã bị bỏ qua: ${names}`
      );
    } else {
      setImageSizeError('');
    }

    if (validFiles.length === 0) return;

    setImageProcessing(true);

    // Keep raw File references for API upload
    setImageFiles((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      return [...prev, ...validFiles.slice(0, remaining)];
    });

    setImagePreviews((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      const toAdd = validFiles.slice(0, remaining);
      let pending = toAdd.length;

      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const rawDataUrl = e.target?.result as string;
          try {
            // Resize + bake watermark into the data URL before storing
            const watermarked = await resizeAndWatermark(rawDataUrl, 1600, 0.75);
            setImagePreviews((current) => {
              if (current.length >= MAX_IMAGES) return current;
              return [...current, watermarked];
            });
          } catch {
            // Fallback: store original if watermark fails
            setImagePreviews((current) => {
              if (current.length >= MAX_IMAGES) return current;
              return [...current, rawDataUrl];
            });
          }
          pending--;
          if (pending <= 0) setImageProcessing(false);
        };
        reader.readAsDataURL(file);
      });

      return prev;
    });
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // Reset so the same file(s) can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (videoPreviewRef.current) {
      URL.revokeObjectURL(videoPreviewRef.current);
      videoPreviewRef.current = null;
    }
    setVideoFile(null);
    setVideoPreview('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrors((prev) => ({ ...prev, videoFile: t('err.invalidVideo') }));
      e.target.value = '';
      return;
    }

    const maxBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrors((prev) => ({ ...prev, videoFile: formatTemplate(t('post.videoTooLarge'), { size: MAX_VIDEO_SIZE_MB }) }));
      e.target.value = '';
      return;
    }

    if (videoPreviewRef.current) {
      URL.revokeObjectURL(videoPreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    videoPreviewRef.current = previewUrl;
    setVideoFile(file);
    setVideoPreview(previewUrl);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.videoFile;
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = t('err.titleRequired');
    if (!form.price.trim()) errs.price = t('err.priceRequired');
    else if (isNaN(Number(form.price))) errs.price = t('err.priceNumber');
    if (!form.bedrooms.trim()) errs.bedrooms = t('err.bedroomsRequired');
    else if (isNaN(Number(form.bedrooms))) errs.bedrooms = t('err.mustBeNumber');
    if (!form.bathrooms.trim()) errs.bathrooms = t('err.bathroomsRequired');
    else if (isNaN(Number(form.bathrooms))) errs.bathrooms = t('err.mustBeNumber');
    if (!form.address.trim()) errs.address = t('err.addressRequired');
    if (!form.city.trim()) errs.city = t('err.cityRequired');
    if (!form.state.trim()) errs.state = t('err.stateRequired');
    // Contact info required
    if (isApiConfigured()) {
      if (!form.contactName.trim()) errs.contactName = t('post.fullNameRequired');
      if (!form.contactPhone.trim()) errs.contactPhone = t('post.phoneRequired');
      if (!form.contactEmail.trim()) {
        errs.contactEmail = t('post.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
        errs.contactEmail = t('err.invalidEmail');
      }
    }
    externalLinkFields.forEach(({ key, label }) => {
      const value = form[key].trim();
      if (value && !isValidHttpUrl(value)) {
        errs[key] = formatTemplate(t('post.linkMustStart'), { label });
      }
    });
    const whatsappValue = form.whatsappUrl.trim();
    if (whatsappValue && !isValidHttpUrl(whatsappValue) && !hasEnoughPhoneDigits(whatsappValue)) {
      errs.whatsappUrl = t('post.whatsappInvalid');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    if (isPro && !paypalOrderId) {
      setSubmitError(t('err.paypalRequired'));
      return;
    }

    if (!isPro) {
      // Card verification temporarily disabled (PayPal restricted)
      if (freePostsRemaining <= 0) {
        setSubmitError(t('err.freePostLimitReached'));
        return;
      }
    }

    setSubmitting(true);
    setSubmitError('');

    const numericPrice = Number(form.price);
    const isRent = form.listingType === 'rent';
    const priceStr = isRent
      ? `$${numericPrice.toLocaleString()}${t('prop.perMonth')}`
      : `$${numericPrice.toLocaleString()}`;
    const cleanDescription = form.description.trim() || t('post.noDescription');
    const listingWhatsappUrl = buildWhatsappUrl(form.whatsappUrl) || buildWhatsappUrl(form.contactPhone);

    try {
      // ── API mode: public submit via /api/public/submit ──
      if (isApiConfigured()) {
        const result = await publicSubmitProperty(
          {
            title: form.title.trim(),
            listing_type: form.listingType,
            property_type: form.propertyType,
            price: numericPrice,
            bedrooms: Number(form.bedrooms),
            bathrooms: Number(form.bathrooms),
            sqft: form.sqft ? Number(form.sqft) : 0,
            address: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip,
            latitude: form.latitude,
            longitude: form.longitude,
            description: cleanDescription,
            contact_name: form.contactName.trim(),
            contact_phone: form.contactPhone.trim(),
            contact_email: form.contactEmail.trim(),
            youtube_url: form.youtubeUrl.trim() || undefined,
            facebook_url: form.facebookUrl.trim() || undefined,
            instagram_url: form.instagramUrl.trim() || undefined,
            tiktok_url: form.tiktokUrl.trim() || undefined,
            x_url: form.xUrl.trim() || undefined,
            whatsapp_url: listingWhatsappUrl || undefined,
            ...(paypalOrderId ? { paypal_order_id: paypalOrderId, pro_fee: selectedProPrice } : {}),
          } as PublicSubmitData,
          imageFiles,
          videoFile,
        );

        if (result.ok) {
          if (!isPro) {
            refreshFreePostCount();
          }
          setSubmitted(true);
          removeUserItem(DRAFT_KEY);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // API returned error — show it, do NOT fall back to localStorage
        setSubmitError(result.error || t('post.submitErrorSupport'));
        return;
      }

      // ── Demo/fallback mode: save to localStorage ──
      const newProp = {
        id: `mock-${Date.now()}`,
        title: form.title.trim(),
        image: imagePreviews[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        tag: 'New Listing',
        tagColor: 'bg-emerald-600',
        price: priceStr,
        numericPrice,
        bds: Number(form.bedrooms),
        ba: Number(form.bathrooms),
        sqft: form.sqft ? Number(form.sqft).toLocaleString() : '0',
        status: isRent ? 'For Rent' : 'For Sale',
        listingType: form.listingType,
        address: `${form.address}, ${form.city}, ${form.state}${form.zip ? ' ' + form.zip : ''}`,
        city: form.city,
        state: form.state,
        propertyType: form.propertyType,
        mls: `MLS# MOCK-${Date.now().toString(36).toUpperCase()}`,
        description: cleanDescription,
        imageCount: imagePreviews.length,
        videoUrl: videoPreview || undefined,
        youtubeUrl: form.youtubeUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        tiktokUrl: form.tiktokUrl.trim() || undefined,
        xUrl: form.xUrl.trim() || undefined,
        whatsappUrl: listingWhatsappUrl || undefined,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        isVip: form.tier === 'pro',
        numericSqft: form.sqft ? Number(form.sqft) : 0,
        createdAt: new Date().toISOString(),
        expiresAt: createExpiryDate(form.listingDays),
      };

      await listingService.create(newProp as Property & Record<string, unknown>);

      if (!isPro) {
        refreshFreePostCount();
      }
      setSubmitted(true);
      removeUserItem(DRAFT_KEY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('post.submitErrorRetry');
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto pt-12 sm:pt-16 pb-8 sm:pb-10 min-w-0">
          <h1
            className="hero-gold-text font-extrabold mb-2 leading-tight break-words"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)' }}
          >
            {t('post.title')}
          </h1>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
            {t('post.subtitle')}
          </p>
          {draftSaved && (
            <p className="text-emerald-400/70 text-[12px] mt-2 flex items-center gap-1.5 transition-opacity animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('post.draftSaved')}
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16">
        {submitted ? (
          /* ====== Success State ====== */
          <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-8 sm:p-12 text-center min-w-0">
            <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-[#F6D37A] font-bold text-[22px] sm:text-[26px] mb-3 break-words">
              {t('post.successPublishedTitle')}
            </h2>
            <p className="text-[#A7ABB6] text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-md mx-auto break-words">
              {t('post.successPublishedMsg')}
            </p>



            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
              >
                {t('post.goToDashboard')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/buy"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-[#F5F0E6] font-semibold text-[14px] transition-colors"
              >
                {t('post.browseListings')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ====== Form ====== */
          <form onSubmit={handleSubmit} noValidate>
            {/* Submit Error Alert */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium text-[14px]">{t('post.submissionFailed')}</p>
                  <p className="text-red-300/80 text-[13px] mt-1">{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError('')}
                  className="ml-auto text-red-400 hover:text-red-300 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {/* Section 1: Basic Info */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <SectionHeader num={sections[0].num} title={sections[0].title} icon={sections[0].icon} />
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    {t('post.formTitle')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('post.titlePlaceholder')}
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                  />
                  {errors.title && <p className={errorClass}>{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="min-w-0">
                    <label className={labelClass}>{t('post.propertyType')}</label>
                    <select
                      className={selectClass}
                      value={form.propertyType}
                      onChange={(e) => update('propertyType', e.target.value)}
                    >
                      <option value="Single Family">{t('post.singleFamily')}</option>
                      <option value="Condo">{t('post.condo')}</option>
                      <option value="Townhouse">{t('post.townhouse')}</option>
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass}>{t('post.listingType')}</label>
                    <select
                      className={selectClass}
                      value={form.listingType}
                      onChange={(e) => update('listingType', e.target.value)}
                    >
                      <option value="sale">{t('post.forSale')}</option>
                      <option value="rent">{t('post.forRent')}</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 2: Price & Specs */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <SectionHeader num={sections[1].num} title={sections[1].title} icon={sections[1].icon} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="min-w-0">
                  <label className={labelClass}>
                    {t('post.price')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={t('post.pricePlaceholder')}
                    className={inputClass}
                    value={form.price}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                      update('price', clean);
                    }}
                  />
                  {errors.price && <p className={errorClass}>{errors.price}</p>}
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>
                    {t('post.bedrooms')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    className={inputClass}
                    value={form.bedrooms}
                    onChange={(e) => update('bedrooms', e.target.value)}
                  />
                  {errors.bedrooms && <p className={errorClass}>{errors.bedrooms}</p>}
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>
                    {t('post.bathrooms')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    className={inputClass}
                    value={form.bathrooms}
                    onChange={(e) => update('bathrooms', e.target.value)}
                  />
                  {errors.bathrooms && <p className={errorClass}>{errors.bathrooms}</p>}
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>{t('post.sqft')}</label>
                  <input
                    type="number"
                    placeholder="e.g. 2400"
                    className={inputClass}
                    value={form.sqft}
                    onChange={(e) => update('sqft', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Location */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <SectionHeader num={sections[2].num} title={sections[2].title} icon={sections[2].icon} />
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    {t('post.address')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('post.addressPlaceholder')}
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                  {errors.address && <p className={errorClass}>{errors.address}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="min-w-0">
                    <label className={labelClass}>
                      {t('post.city')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('post.cityPlaceholder')}
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                    {errors.city && <p className={errorClass}>{errors.city}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass}>
                      {t('post.state')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('post.statePlaceholder')}
                      className={inputClass}
                      value={form.state}
                      onChange={(e) => update('state', e.target.value)}
                    />
                    {errors.state && <p className={errorClass}>{errors.state}</p>}
                  </div>
                  <div className="min-w-0">
                    <label className={labelClass}>{t('post.zip')}</label>
                    <input
                      type="text"
                      placeholder={t('post.zipPlaceholder')}
                      className={inputClass}
                      value={form.zip}
                      onChange={(e) => update('zip', e.target.value)}
                    />
                  </div>
                </div>
                {/* Map preview + pin */}
                <LocationMapPicker
                  address={form.address}
                  city={form.city}
                  state={form.state}
                  zip={form.zip}
                  onLocationChange={(lat, lng) => { setForm(prev => ({ ...prev, latitude: lat, longitude: lng })); }}
                />
              </div>
            </div>

            {/* Section 4: Photos — file upload with preview */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <SectionHeader num={sections[3].num} title={sections[3].title} icon={sections[3].icon} />

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Upload area */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 sm:p-10 transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-[#F6D37A] bg-[#F6D37A]/[0.06]'
                    : 'border-white/[0.12] bg-[#0c0c12] hover:border-[#B88717]/40 hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#B88717]/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#F6D37A]" />
                </div>
                <div className="text-center">
                  <p className="text-[#F5F0E6] text-[15px] font-medium mb-1">
                    {t('post.selectPhotos')}
                  </p>
                  <p className="text-[#7D8291] text-[13px]">
                    {formatTemplate(t('post.dragDropPhotos'), { max: MAX_IMAGES, size: MAX_IMAGE_SIZE_MB })}
                  </p>
                </div>
              </div>

              {/* Image size warning */}
              {imageSizeError && (
                <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08]">
                  <p className="text-amber-300 text-[13px] leading-relaxed">
                    ⚠️ {imageSizeError}
                  </p>
                </div>
              )}

              {/* Image previews grid */}
              {imagePreviews.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#A7ABB6] text-[13px] font-medium">
                      {formatTemplate(t('post.photosSelected'), { count: imagePreviews.length, max: MAX_IMAGES })}
                      {imageProcessing && <span className="ml-2 inline-flex items-center gap-1 text-[#B88717]"><Loader2 className="w-3 h-3 animate-spin" />{t('post.processing')}</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setImagePreviews([]); setImageFiles([]); }}
                      className="text-[12px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      {t('post.removeAll')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-white/[0.085] aspect-square cursor-pointer"
                        onClick={() => setPreviewLightbox(idx)}
                      >
                        <img
                          src={src}
                          alt={`Upload preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Watermark overlay — inline style đảm bảo luôn hiện */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                          <span style={{
                            transform: 'rotate(-22deg)',
                            opacity: 0.22,
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            color: 'white',
                            whiteSpace: 'nowrap',
                          }}>So Do Van Phuc</span>
                        </div>
                        {/* Hover overlay with zoom hint */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                          <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label={`Remove image ${idx + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-[#B88717] text-[#030405] text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {t('post.cover')}
                          </span>
                        )}
                      </div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.08] bg-[#0c0c12] aspect-square hover:border-[#B88717]/30 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="h-6 w-6 text-[#7D8291]" />
                        <span className="text-[11px] text-[#7D8291]">{t('post.addMore')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[#7D8291] text-[12px] mt-3 break-words">
                {isApiConfigured()
                  ? <><span className="text-emerald-400">{t('post.apiMode')}</span> {t('post.apiModeDesc')}</>
                  : <><span className="text-emerald-400">{t('post.demoNote')}</span> {t('post.demoModeDesc')}</>}
              </p>
            </div>

            {/* Section 5: Description */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <SectionHeader num={sections[4].num} title={sections[4].title} icon={sections[4].icon} />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass + ' mb-0'}>{t('post.descLabel')}</label>
                  <button type="button" onClick={handleAIGenerate} disabled={aiLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] text-[12px] font-medium hover:bg-[#B88717]/20 transition-colors disabled:opacity-50">
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? t('post.generating') : t('post.aiGenerate')}
                  </button>
                </div>
                <textarea
                  rows={5}
                  placeholder={t('post.descriptionPlaceholder')}
                  className={`${inputClass} resize-none`}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>
            </div>

            {/* Section 6: Video */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-8 min-w-0">
              <SectionHeader num={sections[5].num} title={sections[5].title} icon={sections[5].icon} />
              <input
                ref={videoInputRef}
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>{t('post.uploadVideo')}</label>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/[0.12] bg-[#0c0c12] p-6 text-center transition-colors hover:border-[#B88717]/40 hover:bg-white/[0.02]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#B88717]/10 flex items-center justify-center">
                      <Video className="h-5 w-5 text-[#F6D37A]" />
                    </div>
                    <div>
                      <p className="text-[#F5F0E6] text-[15px] font-medium mb-1">
                        {formatTemplate(t('post.selectVideo'), { max: MAX_VIDEOS })}
                      </p>
                      <p className="text-[#7D8291] text-[13px]">
                        {formatTemplate(t('post.videoFormats'), { size: MAX_VIDEO_SIZE_MB })}
                      </p>
                    </div>
                  </button>
                  {errors.videoFile && <p className={errorClass}>{errors.videoFile}</p>}
                </div>

                {videoFile && videoPreview && (
                  <div className="rounded-xl border border-white/[0.085] bg-[#0c0c12] overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.085]">
                      <div className="min-w-0">
                        <p className="text-[#F5F0E6] text-[13px] font-semibold truncate">{videoFile.name}</p>
                        <p className="text-[#7D8291] text-[12px]">
                          {formatTemplate(t('post.mbSelected'), { size: (videoFile.size / (1024 * 1024)).toFixed(1) })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                        aria-label="Remove video"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <video
                      src={videoPreview}
                      controls
                      className="w-full aspect-video bg-black"
                    />
                  </div>
                )}

                <div className="rounded-xl border border-white/[0.085] bg-[#0c0c12] p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#B88717]/10 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-4.5 w-4.5 text-[#F6D37A]" />
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass + ' mb-1'}>{t('post.importLinks')}</label>
                      <p className="text-[#7D8291] text-[12px] leading-relaxed">
                        {t('post.importLinksDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {externalLinkFields.map((field) => (
                      <div key={field.key} className="min-w-0">
                        <label className={labelClass}>{field.label}</label>
                        <input
                          type="url"
                          className={inputClass}
                          placeholder={field.placeholder}
                          value={form[field.key]}
                          onChange={(e) => update(field.key, e.target.value)}
                        />
                        {errors[field.key] && <p className={errorClass}>{errors[field.key]}</p>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Section 7: Contact Information (shown in API mode) */}
            {isApiConfigured() && (
              <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
                <SectionHeader num={sections[6].num} title={sections[6].title} icon={sections[6].icon} />
                <p className="text-[#7D8291] text-[13px] mb-5 -mt-3">
                  {t('post.contactVisibility')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Contact Name */}
                  <div>
                    <label className={labelClass}>
                      {t('post.contactName')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="John Smith"
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      required
                    />
                    <p className="text-[11px] text-[#7D8291] mt-1.5 leading-relaxed">
                      {t('post.contactNameHelp')}
                    </p>
                    {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
                  </div>
                  {/* Contact Phone */}
                  <div>
                    <label className={labelClass}>
                      {t('post.contactPhone')} <span className="text-red-400">*</span>
                    </label>
                    <PhoneInput
                      value={form.contactPhone}
                      onChange={(val) => setForm({ ...form, contactPhone: val })}
                    />
                    <p className="text-[11px] text-[#7D8291] mt-1.5 leading-relaxed">
                      {t('post.contactPhoneHelp')}
                    </p>
                    {errors.contactPhone && <p className={errorClass}>{errors.contactPhone}</p>}
                  </div>
                  {/* Listing WhatsApp */}
                  <div>
                    <label className={labelClass}>
                      {t('post.contactWhatsapp')}
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder={t('post.contactWhatsappPlaceholder')}
                      value={form.whatsappUrl}
                      onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                    />
                    <p className="text-[11px] text-[#7D8291] mt-1.5 leading-relaxed">
                      {t('post.contactWhatsappHelp')}
                    </p>
                    {errors.whatsappUrl && <p className={errorClass}>{errors.whatsappUrl}</p>}
                  </div>
                  {/* Contact Email */}
                  <div>
                    <label className={labelClass}>
                      {t('post.contactEmail')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="contact@gmail.com"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      required
                    />
                    <p className="text-[11px] text-[#7D8291] mt-1.5 leading-relaxed">
                      <span className="text-emerald-400/80">🔒</span> {t('post.contactEmailHelp')}
                    </p>
                    {errors.contactEmail && <p className={errorClass}>{errors.contactEmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Listing plan and payment belong at the end of the posting flow. */}
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 sm:p-8 mb-6 min-w-0">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="h-4 w-4 text-[#F6D37A] flex-shrink-0" />
                <h3 className="text-[#F6D37A] font-semibold text-[17px] break-words">{t('post.listingPlan')}</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Free Tier */}
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, listingDays: prev.listingDays, tier: 'free' }))}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        form.tier === 'free'
                          ? 'bg-white/[0.06] border-white/[0.2] ring-1 ring-white/[0.1]'
                          : 'bg-transparent border-white/[0.085] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="text-[#F5F0E6] font-bold text-[15px] mb-1">{t('post.free')}</div>
                      <div className="text-[#7D8291] text-[11px] leading-relaxed">{t('post.max10')}</div>
                    </button>
                    {/* Pro Tier */}
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, listingDays: prev.listingDays, tier: 'pro' }))}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        form.tier === 'pro'
                          ? 'bg-[#B88717]/10 border-[#B88717]/40 ring-1 ring-[#B88717]/30'
                          : 'bg-transparent border-white/[0.085] hover:border-[#B88717]/25'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#F6D37A] font-bold text-[15px]">{t('post.pro')}</span>
                      </div>
                      <div className="text-[#7D8291] text-[11px] leading-relaxed mt-1">{t('post.proFrom')}</div>
                    </button>
                  </div>

                  {/* Duration Options */}
                  <label className={labelClass}>{t('post.listingDuration')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(() => {
                      const options = [
                        { days: 7, price: PRO_PRICES[7], label: `7 ${t('post.days')}` },
                        { days: 14, price: PRO_PRICES[14], label: `14 ${t('post.days')}` },
                        { days: 21, price: PRO_PRICES[21], label: `21 ${t('post.days')}` },
                        { days: 30, price: PRO_PRICES[30], label: `1 ${t('post.month')}`, bonus: isPro ? t('post.monthFreeBonus') : undefined },
                      ];
                      return options.map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, listingDays: opt.days }))}
                          className={`relative py-3 px-2 rounded-xl text-center border transition-all ${
                            form.listingDays === opt.days
                              ? isPro
                                ? 'bg-[#B88717]/15 border-[#B88717]/40 text-[#F6D37A]'
                                : 'bg-white/[0.08] border-white/[0.2] text-[#F5F0E6]'
                              : 'bg-transparent border-white/[0.085] text-[#7D8291] hover:border-white/[0.15]'
                          }`}
                        >
                          <div className="text-[13px] font-semibold leading-snug">
                            {opt.label} / {isPro ? `$${opt.price}` : t('post.free')}
                          </div>
                          {opt.bonus && (
                            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">(+{opt.bonus})</div>
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                  <p className="text-[11px] text-[#7D8291] mt-2">
                    {form.tier === 'pro'
                      ? t('post.proVip')
                      : t('post.freeDesc')}
                  </p>
                </div>

                {/* Verification / Payment Section */}
                {isPro ? (
                  <div className="bg-[#0D0D14] rounded-xl border border-white/[0.085] p-5 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-[#F6D37A]" />
                      <span className="text-[#F5F0E6] text-[13px] font-semibold">{t('post.payment')}</span>
                      <span className="text-[10px] text-[#7D8291] ml-auto">
                        {paypalOrderId ? t('post.paymentComplete') : t('post.paymentRequired')}
                      </span>
                    </div>
                    {paypalOrderId ? (
                      <div className="flex items-center gap-2 py-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-emerald-400 text-[13px] font-semibold">{t('post.paymentSuccess')}</p>
                          <p className="text-[#7D8291] text-[11px]">{t('post.order')} {paypalOrderId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-[#B88717]/10 rounded-lg px-3 py-2 mb-2">
                          <p className="text-[#F6D37A] text-[13px] font-semibold">
                            {t('post.total')} ${selectedProPrice}
                          </p>
                          <p className="text-[#7D8291] text-[10px]">{formatTemplate(t('post.proListingDays'), { days: form.listingDays })}</p>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-[#B88717]/20 bg-[#B88717]/10 px-3 py-2">
                          <Info className="h-4 w-4 text-[#F6D37A] mt-0.5 flex-shrink-0" />
                          <p className="text-[#F5F0E6] text-[12px] leading-relaxed">{paymentExplain}</p>
                        </div>
                        <PaymentGateway
                          amount={selectedProPrice}
                          description={`So Do Van Phuc Pro Listing - ${form.listingDays} days`}
                          onSuccess={(orderId) => setPaypalOrderId(orderId)}
                          onError={(err) => console.error('PayPal error:', err)}
                          mode="payment"
                          purpose="pro_listing"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0D0D14] rounded-xl border border-white/[0.085] p-5 mt-2">
                    <div className="rounded-lg border border-white/[0.085] bg-[#15151D] px-3 py-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[#F5F0E6] text-[12px] font-semibold">{freePostsText}</span>
                        <span className="text-[#F6D37A] text-[11px] font-semibold">
                          {freePostsRemaining}/{FREE_POST_LIMIT}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#0c0c12]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#B88717] to-[#F6D37A] transition-all"
                          style={{ width: `${freePostsProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[15px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>{t('post.submitting')}</>
              ) : (
                <>{t('post.submitListing')} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        )}
      </div>
    </PageShell>

    {/* ── Image Preview Lightbox ── */}
    {previewLightbox !== null && (
      <div
        className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
        onClick={() => setPreviewLightbox(null)}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-white/70 text-[13px]">
            {previewLightbox + 1} <span className="text-white/40">{t('post.of')}</span> {imagePreviews.length}
            <span className="ml-2 text-[11px] text-[#B88717] uppercase tracking-wide font-semibold">{t('post.previewOnly')}</span>
          </span>
          <button
            type="button"
            onClick={() => setPreviewLightbox(null)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center px-4 pb-4 relative min-h-0" onClick={(e) => e.stopPropagation()}>
          <div className="relative max-w-full max-h-full">
            <img
              src={imagePreviews[previewLightbox]}
              alt={`Preview ${previewLightbox + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
            {/* Watermark on lightbox */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-xl">
              <span style={{ transform: 'rotate(-22deg)', opacity: 0.15, fontSize: '32px', fontWeight: 800, letterSpacing: '0.12em', color: 'white', whiteSpace: 'nowrap' }}>So Do Van Phuc</span>
            </div>
          </div>

          {/* Prev button */}
          {previewLightbox > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewLightbox(previewLightbox - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="text-white text-lg">‹</span>
            </button>
          )}
          {/* Next button */}
          {previewLightbox < imagePreviews.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewLightbox(previewLightbox + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="text-white text-lg">›</span>
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto justify-center" onClick={(e) => e.stopPropagation()}>
          {imagePreviews.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPreviewLightbox(i)}
              className={`flex-shrink-0 w-14 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${i === previewLightbox ? 'border-[#F6D37A] opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    )}
    </>
  );
};

export default PostPropertyPage;
