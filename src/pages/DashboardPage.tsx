import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import {
  Heart,
  Building2,
  MessageSquare,
  User,
  Eye,
  Bookmark,
  Send,
  ArrowRight,
  LogIn,
  CheckCircle,
  Star,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Camera,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import PropertyCard from '../components/PropertyCard';
import { properties } from '../data/properties';

import { listingService } from '../services/listingService';
import { getExpiryStatus, daysUntilExpiry } from '../utils/expiryUtils';
import { isApiConfigured, getApiBase, toProxyUrl } from '../services/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { getToken as getAdminToken } from '../services/authService';
import { getUserItem, setUserItem } from '../utils/userStorage';

import type { Property } from '../data/properties';

interface GfUser {
  name?: string;
  email?: string;
  token?: string;
}

interface ListingEditDraft {
  title: string;
  listingType: 'sale' | 'rent';
  propertyType: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
  whatsappUrl: string;
  status: 'active' | 'hidden';
  images: string[];
}

const emptyListingDraft: ListingEditDraft = {
  title: '',
  listingType: 'sale',
  propertyType: 'Single Family',
  price: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  description: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  youtubeUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  xUrl: '',
  whatsappUrl: '',
  status: 'active',
  images: [],
};

const propertyTypeOptions = ['Single Family', 'Condo', 'Townhouse', 'Villa', 'Land', 'Commercial'];

const textValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const numberDraftValue = (value: unknown) => {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return cleaned;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? String(numberValue) : '';
};

const editInputClass =
  'w-full rounded-lg border border-white/[0.09] bg-[#0c0c12] px-3 py-2.5 text-[13px] text-[#F5F0E6] placeholder-[#7D8291] outline-none transition-colors focus:border-[#B88717]/60';

const editLabelClass = 'mb-1.5 block text-[12px] font-medium text-[#A7ABB6]';

/** Get user or admin JWT token */
const getUserToken = (): string | null => {
  // Try user token from localStorage first
  try {
    const raw = localStorage.getItem('gf_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  // Fallback to admin token
  return getAdminToken();
};

/* Recent activity will be computed dynamically inside component */
const formatTemplate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );

const DashboardPage = () => {
  const { t, lang } = useLanguage();
  usePageTitle(t('page.dashboard'));
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  const [user] = useState<GfUser | null>(() => {
    try {
      const raw = localStorage.getItem('gf_user');
      if (raw) return JSON.parse(raw) as GfUser;
    } catch { /* ignore */ }
    return null;
  });

  const [savedProperties, setSavedProperties] = useState<typeof properties>([]);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);
  const [userInquiries, setUserInquiries] = useState<Array<Record<string, unknown>>>([]);
  const [userSchedules, setUserSchedules] = useState<Array<Record<string, unknown>>>([]);

  const loadFavorites = (apiProps: typeof properties = []) => {
    try {
      const favIds = JSON.parse(getUserItem('gf_favorites') || '[]');
      const ids = new Set(apiProps.map(p => p.id));
      const merged = [...apiProps, ...properties.filter(p => !ids.has(p.id))];
      setSavedProperties(merged.filter((p) => favIds.includes(p.id)));
    } catch {
      setSavedProperties([]);
    }
  };

  /* User-posted listings from API */
  const [userListings, setUserListings] = useState<(Property & Record<string, unknown>)[]>([]);
  const [usingOwnListingFeed, setUsingOwnListingFeed] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingDraft, setListingDraft] = useState<ListingEditDraft>(emptyListingDraft);
  const [listingSaving, setListingSaving] = useState(false);
  const [listingEditError, setListingEditError] = useState('');
  const [listingEditSuccess, setListingEditSuccess] = useState('');
  const [listingImageFiles, setListingImageFiles] = useState<File[]>([]);
  const listingImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    // Load public listings for favorites, then load the private owner feed.
    listingService.getAll().then((all) => {
      if (cancelled) return;
      loadFavorites(all);

      const token = (() => {
        try {
          const raw = localStorage.getItem('gf_user');
          const parsed = raw ? JSON.parse(raw) as GfUser : null;
          return parsed?.token || null;
        } catch {
          return null;
        }
      })();
      if (isApiConfigured() && token) {
        listingService.getOwn().then((own) => {
          if (cancelled) return;
          setUsingOwnListingFeed(true);
          setUserListings(own);
        }).catch(() => {
          if (cancelled) return;
          setUsingOwnListingFeed(false);
          setUserListings(all);
        });
        return;
      }

      setUsingOwnListingFeed(false);
      setUserListings(all);
    }).catch(() => {
      if (cancelled) return;
      setUsingOwnListingFeed(false);
      setUserListings([]);
      loadFavorites([]);
    });


    // Load inquiries for current user's properties
    if (isApiConfigured()) {
      const token = getUserToken();
      if (token) {
        fetch(`${getApiBase()}/api/user/inquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok && res.data?.inquiries) {
              setUserInquiries(res.data.inquiries);
              setInquiriesCount(res.data.inquiries.length);
            }
          })
          .catch(() => {});

        // Load schedules for current user's properties
        fetch(`${getApiBase()}/api/user/schedules`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.ok && res.data?.schedules) {
              setUserSchedules(res.data.schedules);
            }
          })
          .catch(() => {});
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('gf_inquiries') || '[]');
        queueMicrotask(() => setInquiriesCount(stored.length));
      } catch { /* ignore */ }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  /* Filter listings to only show current user's own */
  const myListings = usingOwnListingFeed ? userListings : userListings.filter((l) => {
    const listingEmail = (l as Record<string, unknown>).contact_email as string || (l as Record<string, unknown>).contactEmail as string || '';
    return user?.email && listingEmail.toLowerCase() === user.email.toLowerCase();
  });
  const editingListing = editingListingId ? myListings.find((listing) => listing.id === editingListingId) : null;

  /* Expiry helpers */
  const listingsWithExpiryIssues = myListings.filter((l) => {
    const status = getExpiryStatus(l.expiresAt as string | undefined);
    return status === 'expiring-soon' || status === 'expired';
  });

  /* Dynamic recent activity from real user data */
  const recentActivity = [
    ...(savedProperties.length > 0 ? [{
      icon: Bookmark,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      title: formatTemplate(t('dash.activitySaved'), { count: savedProperties.length }),
      desc: savedProperties.slice(0, 2).map(p => p.address).join(', '),
      time: '',
    }] : []),
    ...(myListings.length > 0 ? [{
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      title: formatTemplate(t('dash.activityListings'), { count: myListings.length }),
      desc: myListings.slice(0, 2).map(l => l.address).join(', '),
      time: '',
    }] : []),
    ...(inquiriesCount > 0 ? [{
      icon: Send,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      title: formatTemplate(t('dash.activityInquiries'), { count: inquiriesCount }),
      desc: t('dash.checkAdminDetails'),
      time: '',
    }] : []),
  ];

  const displayName = user?.name || t('dash.guest');
  const initials = (user?.name || 'G')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* ── Avatar state ── */
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try {
      return getUserItem('gf_avatar') || null;
    } catch { return null; }
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load avatar from API on mount
  useEffect(() => {
    if (!isApiConfigured() || !user) return;
    const token = getUserToken();
    if (!token) return;
    fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data?.avatar_url) {
          const proxied = toProxyUrl(res.data.avatar_url);
          setAvatarUrl(proxied);
          setUserItem('gf_avatar', proxied);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview immediately
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setAvatarUploading(true);

    try {
      if (isApiConfigured()) {
        const token = getUserToken();
        const fd = new FormData();
        fd.append('avatar', file);
        const res = await fetch(`${getApiBase()}/api/auth/avatar`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const json = await res.json();
        if (json.ok && json.data?.avatar_url) {
          const proxied = toProxyUrl(json.data.avatar_url);
          setAvatarUrl(proxied);
          setUserItem('gf_avatar', proxied);
          window.dispatchEvent(new Event('avatar-changed'));
        }
      } else {
        // Fallback: store as base64 in localStorage
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAvatarUrl(dataUrl);
          setUserItem('gf_avatar', dataUrl);
          window.dispatchEvent(new Event('avatar-changed'));
        };
        reader.readAsDataURL(file);
      }
    } catch { /* ignore */ } finally {
      setAvatarUploading(false);
    }
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const dynamicStatCards = [
    { label: t('dash.savedHomes'), value: savedProperties.length.toString(), icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10', path: '/favorites' },
    { label: t('dash.myListings'), value: myListings.length.toString(), icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10', path: '/dashboard#my-listings' },
    { label: t('dash.inquiries'), value: inquiriesCount.toString(), icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10', path: '/inquiries' },
    { label: t('dash.profile'), value: t('dash.profileComplete'), icon: User, color: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: true, path: '/dashboard' },
  ];

  const propertyTypeLabel = (value: unknown) => {
    const type = String(value || '');
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

  const statusLabel = (value: unknown) => {
    const status = String(value || 'pending').toLowerCase();
    const keyByStatus: Record<string, string> = {
      new: 'inquiries.new',
      read: 'inquiries.read',
      pending: 'status.pending',
      confirmed: 'status.confirmed',
      cancelled: 'status.cancelled',
      expired: 'status.expired',
      active: 'status.active',
      hidden: 'status.hidden',
    };
    return keyByStatus[status] ? t(keyByStatus[status]) : status;
  };

  const editCopy = {
    edit: lang === 'vi' ? 'Sửa' : 'Edit',
    editListing: lang === 'vi' ? 'Sửa tin đăng' : 'Edit Listing',
    view: lang === 'vi' ? 'Xem' : 'View',
    saveChanges: lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes',
    saving: lang === 'vi' ? 'Đang lưu...' : 'Saving...',
    basicInfo: lang === 'vi' ? 'Thông tin chính' : 'Main Details',
    photos: lang === 'vi' ? 'Ảnh tin đăng' : 'Listing Photos',
    contact: lang === 'vi' ? 'Liên hệ' : 'Contact',
    linksStatus: lang === 'vi' ? 'Liên kết & trạng thái' : 'Links & Status',
    addPhotos: lang === 'vi' ? 'Thêm ảnh' : 'Add Photos',
    noPhotos: lang === 'vi' ? 'Chưa có ảnh' : 'No photos yet',
    pendingUpload: lang === 'vi' ? 'ảnh chờ tải lên' : 'photos pending upload',
    active: lang === 'vi' ? 'Đang hiển thị' : 'Active',
    hidden: lang === 'vi' ? 'Ẩn / huỷ tin' : 'Hidden / Cancelled',
    saved: lang === 'vi' ? 'Đã lưu thay đổi tin đăng.' : 'Listing changes saved.',
    fillRequired: lang === 'vi' ? 'Vui lòng nhập đủ tiêu đề, giá, địa chỉ và thông tin liên hệ.' : 'Please fill title, price, address, and contact fields.',
    invalidPrice: lang === 'vi' ? 'Giá phải là số lớn hơn 0.' : 'Price must be a number greater than 0.',
    invalidNumber: lang === 'vi' ? 'Phòng ngủ, phòng tắm và diện tích phải là số không âm.' : 'Bedrooms, bathrooms, and sqft must be non-negative numbers.',
    invalidEmail: lang === 'vi' ? 'Email liên hệ không hợp lệ.' : 'Contact email is invalid.',
  };

  const openListingEditor = (listing: Property & Record<string, unknown>) => {
    const rawStatus = textValue(listing.listingStatus).toLowerCase();
    const images = Array.isArray(listing.images)
      ? listing.images.map((url) => textValue(url)).filter(Boolean)
      : [];
    const normalizedStatus = rawStatus === 'hidden' ? 'hidden' : 'active';

    setListingDraft({
      title: textValue(listing.title || listing.address),
      listingType: listing.listingType === 'rent' ? 'rent' : 'sale',
      propertyType: textValue(listing.propertyType) || 'Single Family',
      price: numberDraftValue(listing.numericPrice || listing.price),
      bedrooms: numberDraftValue(listing.bds),
      bathrooms: numberDraftValue(listing.ba),
      sqft: numberDraftValue(listing.numericSqft || listing.sqft),
      address: textValue(listing.address),
      city: textValue(listing.city),
      state: textValue(listing.state),
      zip: textValue(listing.zip),
      description: textValue(listing.description),
      contactName: textValue(listing.contactName || user?.name),
      contactPhone: textValue(listing.contactPhone),
      contactEmail: textValue(listing.contactEmail || user?.email),
      youtubeUrl: textValue(listing.youtubeUrl),
      facebookUrl: textValue(listing.facebookUrl),
      instagramUrl: textValue(listing.instagramUrl),
      tiktokUrl: textValue(listing.tiktokUrl),
      xUrl: textValue(listing.xUrl),
      whatsappUrl: textValue(listing.whatsappUrl),
      status: normalizedStatus,
      images: images.length > 0 ? images : [textValue(listing.image)].filter(Boolean),
    });
    setListingImageFiles([]);
    setListingEditError('');
    setListingEditSuccess('');
    setEditingListingId(listing.id);
  };

  const closeListingEditor = () => {
    if (listingSaving) return;
    setEditingListingId(null);
    setListingDraft(emptyListingDraft);
    setListingImageFiles([]);
    setListingEditError('');
  };

  const updateListingDraft = (updates: Partial<ListingEditDraft>) => {
    setListingDraft((prev) => ({ ...prev, ...updates }));
    setListingEditError('');
  };

  const handleListingImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    if (files.length > 0) {
      setListingImageFiles((prev) => [...prev, ...files].slice(0, 10));
    }
    event.target.value = '';
  };

  const removeExistingListingImage = (index: number) => {
    updateListingDraft({ images: listingDraft.images.filter((_, i) => i !== index) });
  };

  const removePendingListingImage = (index: number) => {
    setListingImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const saveListingEdit = async () => {
    if (!editingListingId || listingSaving) return;

    const requiredValues = [
      listingDraft.title,
      listingDraft.price,
      listingDraft.address,
      listingDraft.city,
      listingDraft.state,
      listingDraft.contactName,
      listingDraft.contactPhone,
      listingDraft.contactEmail,
    ];
    if (requiredValues.some((value) => !value.trim())) {
      setListingEditError(editCopy.fillRequired);
      return;
    }

    const price = Number(listingDraft.price.replace(/,/g, ''));
    if (!Number.isFinite(price) || price <= 0) {
      setListingEditError(editCopy.invalidPrice);
      return;
    }

    const bedrooms = Number(listingDraft.bedrooms || 0);
    const bathrooms = Number(listingDraft.bathrooms || 0);
    const sqft = Number(listingDraft.sqft || 0);
    if ([bedrooms, bathrooms, sqft].some((value) => !Number.isFinite(value) || value < 0)) {
      setListingEditError(editCopy.invalidNumber);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(listingDraft.contactEmail.trim())) {
      setListingEditError(editCopy.invalidEmail);
      return;
    }

    setListingSaving(true);
    setListingEditError('');
    setListingEditSuccess('');

    try {
      const payload = {
        title: listingDraft.title.trim(),
        listing_type: listingDraft.listingType,
        property_type: listingDraft.propertyType,
        price,
        bedrooms,
        bathrooms,
        sqft,
        address: listingDraft.address.trim(),
        city: listingDraft.city.trim(),
        state: listingDraft.state.trim(),
        zip: listingDraft.zip.trim(),
        description: listingDraft.description.trim(),
        status: listingDraft.status,
        contact_name: listingDraft.contactName.trim(),
        contact_phone: listingDraft.contactPhone.trim(),
        contact_email: listingDraft.contactEmail.trim(),
        youtube_url: listingDraft.youtubeUrl.trim() || null,
        facebook_url: listingDraft.facebookUrl.trim() || null,
        instagram_url: listingDraft.instagramUrl.trim() || null,
        tiktok_url: listingDraft.tiktokUrl.trim() || null,
        x_url: listingDraft.xUrl.trim() || null,
        whatsapp_url: listingDraft.whatsappUrl.trim() || null,
        images: listingDraft.images,
      };

      let updated = await listingService.updateOwn(editingListingId, payload);
      if (listingImageFiles.length > 0) {
        updated = await listingService.uploadOwnImages(editingListingId, listingImageFiles);
      }

      setUserListings((prev) => prev.map((listing) => (listing.id === editingListingId ? updated : listing)));
      setListingEditSuccess(editCopy.saved);
      setEditingListingId(null);
      setListingImageFiles([]);
    } catch (err) {
      setListingEditError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setListingSaving(false);
    }
  };

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
            {formatTemplate(t('dash.welcomeBack'), { name: displayName })}
          </h1>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
            {t('dash.overview')}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pb-28 lg:pb-16">
        {/* Sign-in Banner */}
        {!user && (
          <div className="mb-8 bg-gradient-to-r from-[#B88717]/10 to-[#15151D] rounded-xl border border-[#B88717]/25 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[#F6D37A] font-semibold text-[16px] mb-1 break-words">
                {t('dash.signInPrompt')}
              </h3>
              <p className="text-[#7D8291] text-[13px] break-words">
                {t('dash.signInPromptDesc')}
              </p>
            </div>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)] flex-shrink-0"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('auth.signIn')}</span>
            </Link>
          </div>
        )}

        {/* Expiry Notice Banner */}
        {listingsWithExpiryIssues.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-500/10 to-[#15151D] rounded-xl border border-red-500/25 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#F6D37A] font-semibold text-[16px] mb-1 break-words">
                {t('dash.expiryNotice')}
              </h3>
              <p className="text-[#7D8291] text-[13px] break-words">
                {formatTemplate(t('dash.expiryNoticeDesc'), { count: listingsWithExpiryIssues.length })}
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-[13px] transition-colors border border-red-500/20 flex-shrink-0"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{t('dash.manageListings')}</span>
            </Link>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {dynamicStatCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to={stat.path}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 hover:border-[#B88717]/40 hover:bg-[#1a1a24] transition-all group min-w-0 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color} flex-shrink-0`} />
                    </div>
                    {stat.badge && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[#F6D37A] font-bold text-[22px] sm:text-[26px] leading-none mb-1">
                    {stat.value}
                  </p>
                </div>
                <p className="text-[#F6D37A] group-hover:text-[#FFE8A3] text-[12px] sm:text-[13px] break-words transition-colors">
                  {stat.label}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Saved Properties */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] break-words">
              {t('dash.savedProperties')}
            </h2>
            <Link
              to="/buy"
              className="text-[#F6D37A] hover:text-[#FFE8A3] text-[13px] font-medium flex items-center gap-1 transition-colors flex-shrink-0"
            >
              {t('dash.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedProperties.map((prop) => (
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
                    onFavoriteToggle={loadFavorites}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#15151D] border border-white/[0.085] rounded-xl p-8 text-center">
              <Heart className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-[#A7ABB6] text-sm mb-4">{t('dash.noSaved')}</p>
              <Link to="/buy" className="inline-block px-5 py-2 rounded-full bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[13px] transition-colors">
                {t('dash.findHomes')}
              </Link>
            </div>
          )}
        </div>

        {/* My Listings with VIP & Expiry */}
        {myListings.length > 0 && (
          <div className="mb-10" id="my-listings">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] break-words">
                {t('dash.myListings')}
              </h2>
              <Link
                to="/dashboard#my-listings"
                className="text-[#F6D37A] hover:text-[#FFE8A3] text-[13px] font-medium flex items-center gap-1 transition-colors flex-shrink-0"
              >
                {t('dash.manage')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {listingEditSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
                {listingEditSuccess}
              </div>
            )}
            <div className="space-y-3">
              {myListings.map((listing) => {
                const expiryStatus = getExpiryStatus(listing.expiresAt as string | undefined);
                const days = daysUntilExpiry(listing.expiresAt as string | undefined);
                const isVip = !!(listing as Record<string, unknown>).isVip;
                const listingTitle = typeof listing.title === 'string' ? listing.title : '';
                const listingStatus = String((listing as Record<string, unknown>).listingStatus || 'active');
                return (
                  <div
                    key={listing.id}
                    className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-[#B88717]/30 transition-colors min-w-0"
                  >
                    {/* Listing image thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-[#0c0c12] overflow-hidden flex-shrink-0">
                      <img
                        src={listing.image}
                        alt={listing.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[#F6D37A] font-semibold text-[14px] break-words">
                          {listingTitle || listing.address}
                        </p>
                        {isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B88717]/15 text-[#F6D37A] border border-[#B88717]/20">
                            <Star className="w-3 h-3 fill-[#F6D37A]" />
                            VIP
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          listingStatus === 'hidden'
                            ? 'bg-gray-500/10 text-gray-300 border-gray-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {statusLabel(listingStatus)}
                        </span>
                        {expiryStatus === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {t('dash.expired')}
                          </span>
                        )}
                        {expiryStatus === 'expiring-soon' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {formatTemplate(t('dash.expiringIn'), { days: days ?? 0 })}
                          </span>
                        )}
                        {expiryStatus === 'active' && days !== null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Clock className="w-3 h-3" />
                            {formatTemplate(t('dash.expiresIn'), { days })}
                          </span>
                        )}
                      </div>
                      {listingTitle && (
                        <p className="text-[#A7ABB6] text-[12px] mb-1 break-words">
                          {listing.address}
                        </p>
                      )}
                      <p className="text-[#7D8291] text-[13px] break-words">
                        {propertyTypeLabel(listing.propertyType)} - {listing.bds}{t('prop.bds')}/{listing.ba}{t('prop.ba')} - {listing.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <Link
                        to={`/property/${listing.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-[#F5F0E6] text-[12px] font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {editCopy.view}
                      </Link>
                      <button
                        type="button"
                        onClick={() => openListingEditor(listing)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#B88717] hover:bg-[#D4A020] text-[#030405] text-[12px] font-semibold transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {editCopy.edit}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inquiries Received */}
        {userInquiries.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] break-words">
                {t('dash.inquiriesReceived')}
              </h2>
              <span className="text-[#7D8291] text-[13px]">{formatTemplate(t('dash.total'), { count: userInquiries.length })}</span>
            </div>
            <div className="space-y-3">
              {userInquiries.slice(0, 10).map((inq, idx) => (
                <div
                  key={(inq.id as string) || idx}
                  className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 hover:border-[#B88717]/30 transition-colors min-w-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#F6D37A] font-semibold text-[14px] break-words">{String(inq.name)}</p>
                      <p className="text-[#7D8291] text-[12px] break-words">{String(inq.email)}{inq.phone ? ` · ${String(inq.phone)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inq.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inq.status === 'read' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-[#B88717]/10 text-[#F6D37A] border border-[#B88717]/20'
                      }`}>{statusLabel(inq.status || 'new')}</span>
                    </div>
                  </div>
                  {inq.property_address ? (
                    <p className="text-[#A7ABB6] text-[12px] mb-1.5 break-words">📍 {String(inq.property_address)}{inq.property_city ? `, ${String(inq.property_city)}` : ''}</p>
                  ) : null}
                  {inq.message ? (
                    <p className="text-[#7D8291] text-[13px] break-words leading-relaxed">{String(inq.message)}</p>
                  ) : null}
                  {inq.created_at ? (
                    <p className="text-[#7D8291] text-[11px] mt-2">{new Date(String(inq.created_at)).toLocaleString(locale)}</p>
                  ) : null}
                  {/* Reply actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    {inq.email ? (
                      <a
                        href={`mailto:${String(inq.email)}?subject=${encodeURIComponent(`Re: ${inq.property_address ? String(inq.property_address) : 'Your inquiry on So Do Van Phuc'}`)}&body=${encodeURIComponent(`Hi ${String(inq.name)},\n\nThank you for your interest.\n\n`)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717]/10 border border-[#B88717]/20 text-[#F6D37A] hover:bg-[#B88717]/20 text-[11px] font-medium transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        {t('dash.replyEmail')}
                      </a>
                    ) : null}
                    {inq.phone ? (
                      <a
                        href={`https://wa.me/${String(inq.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${String(inq.name)}, thank you for your inquiry on So Do Van Phuc regarding ${inq.property_address ? String(inq.property_address) : 'our listing'}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-medium transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Viewings Received */}
        {userSchedules.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] break-words">
                {t('dash.scheduledViewings')}
              </h2>
              <span className="text-[#7D8291] text-[13px]">{formatTemplate(t('dash.total'), { count: userSchedules.length })}</span>
            </div>
            <div className="space-y-3">
              {userSchedules.slice(0, 10).map((sch, idx) => (
                <div
                  key={String(sch.id || idx)}
                  className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 hover:border-[#B88717]/30 transition-colors min-w-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#F6D37A] font-semibold text-[14px] break-words">{String(sch.name)}</p>
                      <p className="text-[#7D8291] text-[12px] break-words">{String(sch.email || '')}{sch.phone ? ` · ${String(sch.phone)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sch.paypal_order_id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">💳 {t('dash.paid')}</span>
                      ) : null}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sch.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        sch.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-[#B88717]/10 text-[#F6D37A] border border-[#B88717]/20'
                      }`}>{statusLabel(sch.status || 'pending')}</span>
                    </div>
                  </div>
                  {sch.property_address ? (
                    <p className="text-[#A7ABB6] text-[12px] mb-1.5 break-words">📍 {String(sch.property_address)}</p>
                  ) : null}
                  <div className="flex items-center gap-3 text-[12px] text-[#7D8291]">
                    {sch.date ? <span>📅 {String(sch.date)}</span> : null}
                    {sch.time ? <span>🕐 {String(sch.time)}</span> : null}
                  </div>
                  {sch.message ? (
                    <p className="text-[#7D8291] text-[13px] break-words leading-relaxed mt-1.5">{String(sch.message)}</p>
                  ) : null}
                  {sch.created_at ? (
                    <p className="text-[#7D8291] text-[11px] mt-2">{new Date(String(sch.created_at)).toLocaleString(locale)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity & Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Recent Activity */}
          <div className="lg:col-span-2 min-w-0">
            <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] mb-5 break-words">
              {t('dash.recentActivity')}
            </h2>
            <div className="space-y-3">
              {recentActivity.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 flex items-start gap-4 hover:border-[#B88717]/30 transition-colors min-w-0"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#F6D37A] font-semibold text-[14px] mb-0.5 break-words">
                        {item.title}
                      </p>
                      <p className="text-[#7D8291] text-[13px] break-words leading-snug">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[#7D8291] text-[11px] flex-shrink-0 mt-0.5">
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Card */}
          <div className="min-w-0">
            <h2 className="text-[#F6D37A] font-bold text-[18px] sm:text-[22px] mb-5 break-words">
              {t('dash.profile')}
            </h2>
            <div className="bg-[#15151D] rounded-xl border border-white/[0.085] p-6 text-center">
              {/* Avatar with upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full mx-auto mb-4 group cursor-pointer"
                title={t('dash.changeAvatar')}
              >
                {avatarUrl ? (
                  <img
                    src={toProxyUrl(avatarUrl)}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-2 border-[#B88717]/30"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#B88717]/15 border-2 border-[#B88717]/30 flex items-center justify-center">
                    <span className="text-[#F6D37A] font-bold text-[22px]">{initials}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <p className="text-[#F6D37A] font-semibold text-[16px] mb-1 break-words">
                {displayName}
              </p>
              <p className="text-[#7D8291] text-[13px] mb-4 break-words">
                {user?.email || 'guest@sodovanphuc.vn'}
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-[12px] font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{t('dash.profileComplete')}</span>
              </div>
            </div>
          </div>
        </div>



        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/post-property"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-semibold text-[14px] transition-colors shadow-[0_10px_28px_rgba(184,135,23,0.3)]"
          >
            <Building2 className="h-4 w-4" />
            {t('dash.postProperty')}
          </Link>
          <Link
            to="/buy"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-[#F5F0E6] font-semibold text-[14px] transition-colors"
          >
            {t('dash.browseListings')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {editingListing && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/75 px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/[0.12] bg-[#15151D] shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-[#F6D37A]">{editCopy.editListing}</h3>
                  <p className="truncate text-[12px] text-[#7D8291]">{editingListing.address}</p>
                </div>
                <button
                  type="button"
                  onClick={closeListingEditor}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-[#F5F0E6] transition-colors hover:bg-white/[0.1]"
                  aria-label={t('btn.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                className="max-h-[78vh] space-y-6 overflow-y-auto px-4 py-5 sm:px-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveListingEdit();
                }}
              >
                <section>
                  <h4 className="mb-3 text-[14px] font-semibold text-[#F6D37A]">{editCopy.basicInfo}</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className={editLabelClass}>{t('post.formTitle')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.title}
                        onChange={(event) => updateListingDraft({ title: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.listingType')}</span>
                      <select
                        className={editInputClass}
                        value={listingDraft.listingType}
                        onChange={(event) => updateListingDraft({ listingType: event.target.value === 'rent' ? 'rent' : 'sale' })}
                      >
                        <option value="sale">{t('post.forSale')}</option>
                        <option value="rent">{t('post.forRent')}</option>
                      </select>
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.propertyType')}</span>
                      <select
                        className={editInputClass}
                        value={listingDraft.propertyType}
                        onChange={(event) => updateListingDraft({ propertyType: event.target.value })}
                      >
                        {propertyTypeOptions.map((option) => (
                          <option key={option} value={option}>{propertyTypeLabel(option)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.price')}</span>
                      <input
                        className={editInputClass}
                        inputMode="decimal"
                        value={listingDraft.price}
                        onChange={(event) => updateListingDraft({ price: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.bedrooms')}</span>
                      <input
                        className={editInputClass}
                        inputMode="numeric"
                        value={listingDraft.bedrooms}
                        onChange={(event) => updateListingDraft({ bedrooms: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.bathrooms')}</span>
                      <input
                        className={editInputClass}
                        inputMode="numeric"
                        value={listingDraft.bathrooms}
                        onChange={(event) => updateListingDraft({ bathrooms: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.sqft')}</span>
                      <input
                        className={editInputClass}
                        inputMode="numeric"
                        value={listingDraft.sqft}
                        onChange={(event) => updateListingDraft({ sqft: event.target.value })}
                      />
                    </label>
                    <label className="sm:col-span-2">
                      <span className={editLabelClass}>{t('post.descLabel')}</span>
                      <textarea
                        className={`${editInputClass} min-h-28 resize-y`}
                        value={listingDraft.description}
                        onChange={(event) => updateListingDraft({ description: event.target.value })}
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-[14px] font-semibold text-[#F6D37A]">{t('post.location')}</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className={editLabelClass}>{t('post.address')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.address}
                        onChange={(event) => updateListingDraft({ address: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.city')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.city}
                        onChange={(event) => updateListingDraft({ city: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.state')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.state}
                        onChange={(event) => updateListingDraft({ state: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.zip')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.zip}
                        onChange={(event) => updateListingDraft({ zip: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>Status</span>
                      <select
                        className={editInputClass}
                        value={listingDraft.status}
                        onChange={(event) => updateListingDraft({ status: event.target.value === 'hidden' ? 'hidden' : 'active' })}
                      >
                        <option value="active">{editCopy.active}</option>
                        <option value="hidden">{editCopy.hidden}</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-[14px] font-semibold text-[#F6D37A]">{editCopy.photos}</h4>
                    <button
                      type="button"
                      onClick={() => listingImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#B88717]/30 bg-[#B88717]/10 px-3 py-2 text-[12px] font-semibold text-[#F6D37A] transition-colors hover:bg-[#B88717]/20"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {editCopy.addPhotos}
                    </button>
                  </div>
                  <input
                    ref={listingImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleListingImageSelect}
                  />
                  {listingDraft.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {listingDraft.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.08] bg-[#0c0c12]">
                          <img src={toProxyUrl(image)} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingListingImage(index)}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500"
                            aria-label={lang === 'vi' ? 'Xóa ảnh' : 'Remove image'}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.03] px-4 py-5 text-center text-[13px] text-[#7D8291]">
                      {editCopy.noPhotos}
                    </div>
                  )}
                  {listingImageFiles.length > 0 && (
                    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <p className="mb-2 text-[12px] font-medium text-emerald-300">
                        {listingImageFiles.length} {editCopy.pendingUpload}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listingImageFiles.map((file, index) => (
                          <button
                            key={`${file.name}-${index}`}
                            type="button"
                            onClick={() => removePendingListingImage(index)}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200"
                          >
                            <span className="truncate">{file.name}</span>
                            <X className="h-3 w-3 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="mb-3 text-[14px] font-semibold text-[#F6D37A]">{editCopy.contact}</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <label>
                      <span className={editLabelClass}>{t('post.contactName')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.contactName}
                        onChange={(event) => updateListingDraft({ contactName: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.contactPhone')}</span>
                      <input
                        className={editInputClass}
                        value={listingDraft.contactPhone}
                        onChange={(event) => updateListingDraft({ contactPhone: event.target.value })}
                      />
                    </label>
                    <label>
                      <span className={editLabelClass}>{t('post.contactEmail')}</span>
                      <input
                        className={editInputClass}
                        type="email"
                        value={listingDraft.contactEmail}
                        onChange={(event) => updateListingDraft({ contactEmail: event.target.value })}
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-[14px] font-semibold text-[#F6D37A]">{editCopy.linksStatus}</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      ['youtubeUrl', 'YouTube'],
                      ['facebookUrl', 'Facebook'],
                      ['instagramUrl', 'Instagram'],
                      ['tiktokUrl', 'TikTok'],
                      ['xUrl', 'X'],
                      ['whatsappUrl', 'WhatsApp'],
                    ].map(([key, label]) => (
                      <label key={key}>
                        <span className={editLabelClass}>{label}</span>
                        <input
                          className={editInputClass}
                          value={textValue(listingDraft[key as keyof ListingEditDraft])}
                          onChange={(event) => updateListingDraft({ [key]: event.target.value } as Partial<ListingEditDraft>)}
                        />
                      </label>
                    ))}
                  </div>
                </section>

                {listingEditError && (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                    {listingEditError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeListingEditor}
                    disabled={listingSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-[13px] font-semibold text-[#F5F0E6] transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    {t('btn.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={listingSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B88717] px-4 py-2.5 text-[13px] font-semibold text-[#030405] transition-colors hover:bg-[#D4A020] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {listingSaving ? editCopy.saving : editCopy.saveChanges}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default DashboardPage;
