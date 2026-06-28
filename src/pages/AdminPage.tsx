import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  EyeOff,
  Trash2,
  Edit,
  Send,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Star,
  Calendar,
  AlertTriangle,
  Flag,
  LogOut,
  ShieldCheck,
  ShieldBan,
  Mail,
  Phone,
  UserCheck,
  X,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import AdminLoginPanel from '../components/AdminLoginPanel';
import { properties, type Property } from '../data/properties';
import { reportService } from '../services/reportService';
import { scheduleService } from '../services/scheduleService';
import { listingService } from '../services/listingService';
import { inquiryService, type InquiryStatus as StoredInquiryStatus, type InquiryRecord } from '../services/inquiryService';
import { isApiConfigured, getApiBase, apiFetch } from '../services/apiClient';
import { isAuthenticated, logout, getToken } from '../services/authService';
import { updatePropertyStatus, deleteProperty } from '../services/propertyApi';
import { getExpiryStatus, daysUntilExpiry } from '../utils/expiryUtils';
import type { Report, ReportStatus, ScheduleViewing, ScheduleStatus } from '../types/types';
import { useLanguage } from '../contexts/LanguageContext';

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type ListingStatus = 'Active' | 'Pending' | 'Hidden' | 'Expired';
type InquiryStatus = 'New' | 'Read' | 'Replied';
type PostStatus = 'Draft' | 'Published';
type TabKey = 'listings' | 'inquiries' | 'banners' | 'blog' | 'reports' | 'schedules' | 'users' | 'transactions';

interface ListingRow {
  id: string;
  title?: string;
  property: string;
  location: string;
  status: ListingStatus;
  isVip?: boolean;
  expiresAt?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  whatsappUrl?: string;
}

interface ListingContactDraft {
  contactName: string;
  contactPhone: string;
  whatsappUrl: string;
  contactEmail: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  property: string;
  date: string;
  message: string;
  status: InquiryStatus;
}

interface Banner {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

interface BlogDraft {
  id: string;
  title: string;
  status: PostStatus;
  date: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

const mapBackendStatus = (raw: Record<string, unknown>): ListingStatus => {
  const s = String(raw.listingStatus || raw.status || 'active').toLowerCase();
  if (s === 'pending') return 'Pending';
  if (s === 'hidden') return 'Hidden';
  if (s === 'expired') return 'Expired';
  return 'Active';
};

const statusToApiValue = (s: ListingStatus): string => {
  if (s === 'Active') return 'active';
  if (s === 'Pending') return 'pending';
  if (s === 'Hidden') return 'hidden';
  return 'active';
};

const mapToListingRows = (items: (Property & Record<string, unknown>)[]): ListingRow[] =>
  items.map((p) => ({
    id: p.id,
    title: typeof (p as Record<string, unknown>).title === 'string'
      ? (p as Record<string, unknown>).title as string
      : undefined,
    property: `${p.propertyType} — ${p.bds}bd/${p.ba}ba — ${p.price}`,
    location: p.address,
    status: mapBackendStatus(p as Record<string, unknown>),
    isVip: !!(p as Record<string, unknown>).isVip,
    expiresAt: (p as Record<string, unknown>).expiresAt as string | undefined,
    contactName: (p as Record<string, unknown>).contactName as string | undefined,
    contactPhone: (p as Record<string, unknown>).contactPhone as string | undefined,
    contactEmail: (p as Record<string, unknown>).contactEmail as string | undefined,
    whatsappUrl: (p as Record<string, unknown>).whatsappUrl as string | undefined,
  }));

const buildInitialListings = async (): Promise<ListingRow[]> => {
  if (isApiConfigured()) {
    // API mode: let errors propagate to caller — no catch, no fallback
    const apiListings = await listingService.getAllAdmin();
    return mapToListingRows(apiListings);
  }

  // Demo mode: localStorage + static data
  let localListings: (Property & Record<string, unknown>)[] = [];
  try { localListings = await listingService.getAllAdmin(); } catch { /* demo ok */ }
  const staticListings: ListingRow[] = properties.slice(0, 5).map((p, i) => ({
    id: p.id,
    property: `${p.propertyType} — ${p.bds}bd/${p.ba}ba — ${p.price}`,
    location: p.address,
    status: (['Active', 'Active', 'Pending', 'Active', 'Hidden'] as ListingStatus[])[i],
    isVip: false,
    expiresAt: undefined,
  }));
  return [...mapToListingRows(localListings), ...staticListings];
};

const initialInquiries: Inquiry[] = [
  {
    id: 'inq-1',
    name: 'James Robinson',
    email: 'james.r@email.com',
    property: '1234 Pacific Coast Hwy, Malibu',
    date: 'May 18, 2026',
    message:
      'I am very interested in this Malibu property. Could you please schedule a private showing this weekend? I have been pre-approved for a mortgage and am ready to move quickly if the home meets our expectations. My family is relocating from Chicago and we would love a beachfront location.',
    status: 'New',
  },
  {
    id: 'inq-2',
    name: 'Sophia Nguyen',
    email: 'sophia.n@email.com',
    property: '9821 Westheimer Rd, Houston',
    date: 'May 16, 2026',
    message:
      'Hi, I would like to know more about the HOA fees and what the neighborhood is like for families with young children. We are considering Houston for its lower cost of living. Any information on nearby schools and parks would be greatly appreciated.',
    status: 'Read',
  },
  {
    id: 'inq-3',
    name: 'Marcus Thompson',
    email: 'marcus.t@email.com',
    property: '450 Royal Palm Way, Boca Raton',
    date: 'May 14, 2026',
    message:
      'Interested in the waterfront property in Boca Raton. I am an investor looking for vacation rental potential. Can you provide information on rental income estimates and any HOA restrictions on short-term rentals?',
    status: 'Replied',
  },
  {
    id: 'inq-4',
    name: 'Emily Carter',
    email: 'emily.c@email.com',
    property: '88 Greenwich St, New York',
    date: 'May 12, 2026',
    message:
      'I saw your listing for the penthouse condo in the Financial District. Is the price negotiable? Also, could you share the building financial statements and recent assessment history? I want to ensure the building is well-managed before proceeding.',
    status: 'New',
  },
];

const normalizeInquiryStatus = (status?: StoredInquiryStatus): InquiryStatus => {
  if (status === 'read') return 'Read';
  if (status === 'replied') return 'Replied';
  return 'New';
};

const formatInquiryDate = (value?: string): string => {
  if (!value) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapStoredInquiries = (stored: InquiryRecord[]): Inquiry[] =>
  stored.map((inquiry, index) => ({
    id: `stored-${inquiry.id || index}`,
    name: inquiry.name.trim() ? inquiry.name : 'Website visitor',
    email: inquiry.email.trim() ? inquiry.email : 'No email provided',
    property: inquiry.property.trim() ? inquiry.property : 'Unknown property',
    date: formatInquiryDate(inquiry.date),
    message: inquiry.message.trim() ? inquiry.message : 'No message provided.',
    status: normalizeInquiryStatus(inquiry.status),
  }));

const buildInitialInquiries = async (): Promise<Inquiry[]> => {
  if (isApiConfigured()) {
    // API mode: let errors propagate to caller — no catch, no mock fallback
    const stored = await inquiryService.getAll();
    return mapStoredInquiries(stored);
  }

  // Demo mode: localStorage + mock data
  try {
    const stored = await inquiryService.getAll();
    return [...mapStoredInquiries(stored), ...initialInquiries];
  } catch {
    return initialInquiries;
  }
};

const initialBanners: Banner[] = [
  {
    id: 'ban-1',
    title: 'Spring Sale Event',
    description: 'Up to 5% closing cost credit on select properties through June 30.',
    active: true,
  },
  {
    id: 'ban-2',
    title: 'New Listings Alert',
    description: 'Fresh properties added weekly across California, Florida, and Texas.',
    active: true,
  },
  {
    id: 'ban-3',
    title: 'Investor Webinar',
    description: 'Join our free webinar on multifamily investing strategies — June 15.',
    active: false,
  },
];

const initialBlogDrafts: BlogDraft[] = [
  { id: 'draft-1', title: 'Top 10 Neighborhoods to Watch in 2026', status: 'Draft', date: 'May 19, 2026' },
  { id: 'draft-2', title: 'How Remote Work Reshaped Suburban Demand', status: 'Published', date: 'May 10, 2026' },
  { id: 'draft-3', title: 'Understanding Cap Rates: A Beginner\u2019s Guide', status: 'Draft', date: 'May 5, 2026' },
];

// tabs moved inside component for lang access

const reportBadge = (status: ReportStatus) => {
  const map: Record<ReportStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    reviewed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    dismissed: 'bg-white/[0.06] text-[#7D8291] border-white/[0.1]',
  };
  return map[status];
};

const scheduleBadge = (status: ScheduleStatus) => {
  const map: Record<ScheduleStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return map[status];
};

const expiryBadge = (expiresAt?: string, lang?: string) => {
  const status = getExpiryStatus(expiresAt);
  if (status === 'expired') return { label: lang === 'vi' ? 'Hết hạn' : 'Expired', cls: 'bg-red-500/15 text-red-400 border-red-500/20' };
  if (status === 'expiring-soon') {
    const days = daysUntilExpiry(expiresAt);
    return { label: lang === 'vi' ? `Hết hạn sau ${days} ngày` : `Expiring in ${days}d`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
  }
  const days = daysUntilExpiry(expiresAt);
  if (days !== null) {
    return { label: lang === 'vi' ? `Còn ${days} ngày` : `Expires in ${days}d`, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }
  return null;
};

const statusBadge = (status: ListingStatus) => {
  const map: Record<ListingStatus, string> = {
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Hidden: 'bg-white/[0.06] text-[#7D8291] border-white/[0.1]',
    Expired: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return map[status];
};

const inquiryBadge = (status: InquiryStatus) => {
  const map: Record<InquiryStatus, string> = {
    New: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Read: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Replied: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };
  return map[status];
};

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AdminPage = () => {
  const { t, lang } = useLanguage();
  usePageTitle(t('page.admin'));
  const [adminAuthed, setAdminAuthed] = useState(() => {
    // In demo mode (no API), skip auth gate
    if (!isApiConfigured()) return true;
    return isAuthenticated();
  });
  const [activeTab, setActiveTab] = useState<TabKey>('listings');
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    isApiConfigured() ? [] : initialInquiries
  );
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [banners, setBanners] = useState(initialBanners);
  const [blogDrafts, setBlogDrafts] = useState(initialBlogDrafts);
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<ScheduleViewing[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transferFilter, setTransferFilter] = useState<string>('all');
  const [actionError, setActionError] = useState<string>('');
  const [editingListing, setEditingListing] = useState<ListingRow | null>(null);
  const [contactDraft, setContactDraft] = useState<ListingContactDraft>({
    contactName: '',
    contactPhone: '',
    whatsappUrl: '',
    contactEmail: '',
  });
  const [contactSaving, setContactSaving] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'listings', label: lang === 'vi' ? 'Tin đăng' : 'Listings' },
    { key: 'inquiries', label: lang === 'vi' ? 'Yêu cầu' : 'Inquiries' },
    { key: 'reports', label: lang === 'vi' ? 'Báo cáo' : 'Reports' },
    { key: 'schedules', label: lang === 'vi' ? 'Lịch xem' : 'Schedules' },
    { key: 'banners', label: 'Banner' },
    { key: 'blog', label: 'Blog' },
    { key: 'users', label: lang === 'vi' ? 'Người dùng' : 'Users' },
    { key: 'transactions', label: lang === 'vi' ? 'Giao dịch' : 'Transactions' },
  ];

  const pendingCount = listings.filter((l) => l.status === 'Pending').length;
  const activeCount = listings.filter((l) => l.status === 'Active').length;
  const apiMode = isApiConfigured();
  const stats = [
    { label: lang === 'vi' ? 'Tổng tin đăng' : 'Total Listings', value: apiMode ? listings.length : (listings.length || 24), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: lang === 'vi' ? 'Đang hoạt động' : 'Active Listings', value: apiMode ? activeCount : (activeCount || 15), icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: lang === 'vi' ? 'Chờ duyệt' : 'Pending Review', value: apiMode ? pendingCount : (pendingCount || 3), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: lang === 'vi' ? 'Yêu cầu' : 'Inquiries', value: apiMode ? inquiries.length : (inquiries.length || 8), icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  // Load async data on mount (only when authed)
  const fetchAllData = useCallback(() => {
    if (!adminAuthed) return;
    let cancelled = false;

    const handleAuthError = (err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('session expired') || msg.includes('login again')) {
        logout();
        setAdminAuthed(false);
        // Clear all data — don't leave stale/mock data visible
        setListings([]);
        setInquiries([]);
        setReports([]);
        setSchedules([]);
        setUsers([]);
        setActionError(t('admin.sessionExpired'));
      } else {
        setActionError(msg);
      }
    };

    buildInitialListings().then((data) => { if (!cancelled) setListings(data); }).catch(handleAuthError);
    buildInitialInquiries().then((data) => { if (!cancelled) setInquiries(data); }).catch(handleAuthError);
    reportService.getAll().then((data) => { if (!cancelled) setReports(data); }).catch(handleAuthError);
    scheduleService.getAll().then((data) => { if (!cancelled) setSchedules(data); }).catch(handleAuthError);

    // Fetch users
    (async () => {
      try {
        const usersRes = await fetch(`${getApiBase()}/api/users`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        const usersJson = await usersRes.json();
        if (!cancelled && usersJson.ok && usersJson.data?.users) setUsers(usersJson.data.users);
      } catch (err) { console.warn('Failed to fetch users', err); }
    })();

    // Fetch bank transfers
    (async () => {
      try {
        const res = await apiFetch<any>('/api/bank-transfers', {}, true);
        if (!cancelled && res.ok && res.data?.transfers) setTransfers(res.data.transfers);
      } catch (e) { /* ignore */ }
    })();

    return () => { cancelled = true; };
  }, [adminAuthed, t]);

  useEffect(() => {
    return fetchAllData();
  }, [fetchAllData]);

  // Auth guard: show login panel when API mode is on but not authenticated
  if (!adminAuthed) {
    return (
      <PageShell raw>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <AdminLoginPanel onLoginSuccess={() => setAdminAuthed(true)} />
        </div>
      </PageShell>
    );
  }

  const handleLogout = () => {
    logout();
    setAdminAuthed(false);
  };

  /* Listing actions */
  const setListingStatus = async (id: string, status: ListingStatus) => {
    const prevStatus = listings.find((l) => l.id === id)?.status;
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (isApiConfigured()) {
      try {
        const result = await updatePropertyStatus(id, statusToApiValue(status));
        if (!result.ok) {
          throw new Error(result.error || 'Failed to update status');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update listing status';
        setActionError(msg.includes('401') || msg.includes('Unauthorized')
          ? 'Admin session expired. Please login again.' : msg);
        if (prevStatus) {
          setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: prevStatus } : l)));
        }
      }
    }
  };
  const deleteListing = async (id: string) => {
    if (!confirm(lang === 'vi' ? 'Bạn có chắc muốn xóa tin này? Hành động không thể hoàn tác.' : 'Are you sure you want to delete this listing? This cannot be undone.')) return;
    const backup = listings;
    setListings((prev) => prev.filter((l) => l.id !== id));
    if (isApiConfigured()) {
      try {
        const result = await deleteProperty(id);
        if (!result.ok) {
          throw new Error(result.error || 'Failed to delete listing');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete listing';
        setActionError(msg.includes('401') || msg.includes('Unauthorized')
          ? 'Admin session expired. Please login again.' : msg);
        setListings(backup);
      }
    } else {
      void listingService.remove(id);
    }
  };

  const openContactEditor = (row: ListingRow) => {
    setEditingListing(row);
    setContactDraft({
      contactName: row.contactName || '',
      contactPhone: row.contactPhone || '',
      whatsappUrl: row.whatsappUrl || '',
      contactEmail: row.contactEmail || '',
    });
    setActionError('');
  };

  const updateContactDraft = (field: keyof ListingContactDraft, value: string) => {
    setContactDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveListingContact = async () => {
    if (!editingListing || contactSaving) return;
    const email = contactDraft.contactEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setActionError(lang === 'vi' ? 'Email liên hệ không hợp lệ.' : 'Listing contact email is invalid.');
      return;
    }
    const whatsappInput = contactDraft.whatsappUrl.trim();
    if (whatsappInput && !isValidHttpUrl(whatsappInput) && !hasEnoughPhoneDigits(whatsappInput)) {
      setActionError(lang === 'vi' ? 'WhatsApp phải là số điện thoại hoặc link http(s).' : 'WhatsApp must be a phone number or an http(s) link.');
      return;
    }

    const nextContact = {
      contactName: contactDraft.contactName.trim(),
      contactPhone: contactDraft.contactPhone.trim(),
      contactEmail: email,
      whatsappUrl: buildWhatsappUrl(whatsappInput) || buildWhatsappUrl(contactDraft.contactPhone),
    };
    const backup = listings;
    setContactSaving(true);
    setListings((prev) =>
      prev.map((row) => (row.id === editingListing.id ? { ...row, ...nextContact } : row)),
    );
    try {
      await listingService.update(editingListing.id, nextContact);
      setEditingListing(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update listing contact';
      setListings(backup);
      setActionError(msg.includes('401') || msg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : msg);
    } finally {
      setContactSaving(false);
    }
  };

  /* VIP toggle */
  const toggleVip = async (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isVip: !l.isVip } : l)),
    );
    try {
      await listingService.toggleVip(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle VIP';
      setActionError(msg);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isVip: !l.isVip } : l)),
      );
    }
  };

  /* Report actions */
  const cycleReportStatus = async (id: string) => {
    const order: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed'];
    const prev = reports.find((r) => r.id === id);
    if (!prev) return;
    const next = order[(order.indexOf(prev.status) + 1) % order.length];
    setReports((rs) => rs.map((r) => r.id === id ? { ...r, status: next } : r));
    try {
      await reportService.updateStatus(id, next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update report status';
      setActionError(msg);
      setReports((rs) => rs.map((r) => r.id === id ? { ...r, status: prev.status } : r));
    }
  };
  const deleteReport = async (id: string) => {
    const backup = reports;
    setReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await reportService.remove(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete report';
      setActionError(msg.includes('401') || msg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : msg);
      setReports(backup);
    }
  };

  /* Schedule actions */
  const cycleScheduleStatus = async (id: string) => {
    const order: ScheduleStatus[] = ['pending', 'confirmed', 'cancelled'];
    const prev = schedules.find((s) => s.id === id);
    if (!prev) return;
    const next = order[(order.indexOf(prev.status) + 1) % order.length];
    setSchedules((ss) => ss.map((s) => s.id === id ? { ...s, status: next } : s));
    try {
      await scheduleService.updateStatus(id, next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update schedule status';
      setActionError(msg);
      setSchedules((ss) => ss.map((s) => s.id === id ? { ...s, status: prev.status } : s));
    }
  };
  /* Fetch bank transfers (standalone, for refresh after status change) */
  const fetchTransfers = async () => {
    try {
      const res = await apiFetch<any>('/api/bank-transfers', {}, true);
      if (res.ok && res.data?.transfers) {
        setTransfers(res.data.transfers);
      }
    } catch (e) { /* ignore */ }
  };

  /* Bank transfer status handler */
  const handleTransferStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/bank-transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, true);
      fetchTransfers();
    } catch (e) { /* ignore */ }
  };

  const deleteSchedule = async (id: string) => {
    const backup = schedules;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    try {
      await scheduleService.remove(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete schedule';
      setActionError(msg.includes('401') || msg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : msg);
      setSchedules(backup);
    }
  };

  /* User actions */
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`${getApiBase()}/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } else {
        setActionError(json.error || 'Failed to update user status');
      }
    } catch (err) {
      setActionError('Network error updating user');
    }
  };

  /* Inquiry actions */
  const cycleInquiryStatus = (id: string) => {
    const order: InquiryStatus[] = ['New', 'Read', 'Replied'];
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== id) return inq;
        const next = order[(order.indexOf(inq.status) + 1) % order.length];
        if (id.startsWith('stored-')) {
          const storedId = id.replace(/^stored-/, '');
          void inquiryService.updateStatus(storedId, next.toLowerCase() as StoredInquiryStatus);
        }
        return { ...inq, status: next };
      }),
    );
  };

  /* Banner toggle */
  const toggleBanner = (id: string) =>
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  const updateBanner = (id: string, field: 'title' | 'description', value: string) =>
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  /* Blog toggle */
  const togglePostStatus = (id: string) =>
    setBlogDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: d.status === 'Draft' ? 'Published' : 'Draft' } : d,
      ),
    );

  return (
    <PageShell>
      {/* Action error toast */}
      {actionError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-red-500/95 text-white rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 animate-[slideIn_0.3s_ease-out]">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-medium">{actionError}</p>
          </div>
          <button onClick={() => setActionError('')} className="text-white/80 hover:text-white p-1">
            ×
          </button>
        </div>
      )}

      {/* Demo banner (only when no API configured) */}
      {!isApiConfigured() && (
        <div className="flex items-start gap-3 rounded-xl bg-[#B88717]/10 border border-[#B88717]/20 px-4 py-3 mb-8 min-w-0">
          <Info className="w-5 h-5 text-[#F6D37A] flex-shrink-0 mt-0.5" />
          <p className="text-[#F6D37A] text-[13px] sm:text-[14px] leading-relaxed break-words min-w-0">
            {lang === 'vi' ? 'Bảng quản trị Demo — Chưa kết nối backend. Dữ liệu lưu cục bộ.' : 'Demo Admin Panel — No backend connected. Data is stored locally.'}
          </p>
        </div>
      )}

      {/* Page title + logout */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-[#F6D37A] font-bold break-words"
          style={{ fontSize: 'clamp(24px, 5vw, 34px)' }}
        >
          {t('admin.title')}
        </h1>
        {isApiConfigured() && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#A7ABB6] hover:text-[#F5F0E6] text-[13px] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {lang === 'vi' ? 'Đăng xuất' : 'Logout'}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 min-w-0"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-[#F5F0E6] font-bold text-[24px] sm:text-[28px] leading-none mb-1">
                {s.value}
              </p>
              <p className="text-[#7D8291] text-[12px] sm:text-[13px] break-words">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-8 overflow-x-auto scrollbar-hide border-b border-white/[0.085]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-[13px] sm:text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'text-[#F6D37A] border-[#B88717]'
                : 'text-[#7D8291] border-transparent hover:text-[#A7ABB6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== LISTINGS TAB ==================== */}
      {activeTab === 'listings' && (
        <div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto -mx-4 px-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.085]">
                  <th className="text-[#7D8291] text-[12px] font-medium uppercase tracking-wider pb-3 pr-4">{lang === 'vi' ? 'Bất động sản' : 'Property'}</th>
                  <th className="text-[#7D8291] text-[12px] font-medium uppercase tracking-wider pb-3 pr-4">{lang === 'vi' ? 'Địa điểm' : 'Location'}</th>
                  <th className="text-[#7D8291] text-[12px] font-medium uppercase tracking-wider pb-3 pr-4">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                  <th className="text-[#7D8291] text-[12px] font-medium uppercase tracking-wider pb-3 text-right">{lang === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((row) => {
                  const expiry = expiryBadge(row.expiresAt, lang);
                  return (
                  <tr key={row.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="py-4 pr-4 text-[#F5F0E6] text-[14px] break-words max-w-[260px]">
                      <div className="flex items-start gap-2">
                        {row.isVip && <Star className="w-4 h-4 text-[#F6D37A] fill-[#F6D37A] flex-shrink-0" />}
                        <div className="min-w-0">
                          {row.title && (
                            <div className="font-semibold text-[#F5F0E6] break-words">{row.title}</div>
                          )}
                          <div className={row.title ? 'text-[12px] text-[#A7ABB6] break-words mt-0.5' : ''}>
                            {row.property}
                          </div>
                          {(row.contactName || row.contactPhone || row.contactEmail || row.whatsappUrl) && (
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#7D8291]">
                              {row.contactName && <span>{lang === 'vi' ? 'Liên hệ' : 'Contact'}: {row.contactName}</span>}
                              {row.contactPhone && <span>{row.contactPhone}</span>}
                              {row.contactEmail && <span>{row.contactEmail}</span>}
                              {row.whatsappUrl && <span>WhatsApp</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-[#A7ABB6] text-[13px] break-words max-w-[220px]">{row.location}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                        {expiry && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${expiry.cls}`}>
                            <AlertTriangle className="w-3 h-3" />
                            {expiry.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openContactEditor(row)}
                          title={lang === 'vi' ? 'Sửa liên hệ' : 'Edit contact'}
                          className="p-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] hover:bg-[#B88717]/20 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleVip(row.id)}
                          title={row.isVip ? 'Remove VIP' : 'Make VIP'}
                          className={`p-1.5 rounded-lg transition-colors ${row.isVip ? 'bg-[#B88717]/20 text-[#F6D37A] hover:bg-[#B88717]/30' : 'bg-white/[0.06] text-[#7D8291] hover:bg-white/[0.1]'}`}
                        >
                          <Star className={`w-4 h-4 ${row.isVip ? 'fill-[#F6D37A]' : ''}`} />
                        </button>
                        {row.status !== 'Active' && (
                          <button
                            onClick={() => setListingStatus(row.id, 'Active')}
                            title="Approve"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {row.status !== 'Hidden' && (
                          <button
                            onClick={() => setListingStatus(row.id, 'Hidden')}
                            title="Hide"
                            className="p-1.5 rounded-lg bg-white/[0.06] text-[#7D8291] hover:bg-white/[0.1] transition-colors"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteListing(row.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {listings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[#7D8291] text-[14px]">
                      No listings to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {listings.map((row) => {
              const expiry = expiryBadge(row.expiresAt, lang);
              return (
              <div
                key={row.id}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 min-w-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  {row.isVip && <Star className="w-4 h-4 text-[#F6D37A] fill-[#F6D37A] flex-shrink-0" />}
                  <div className="min-w-0">
                    {row.title && (
                      <p className="text-[#F5F0E6] text-[14px] font-semibold break-words">{row.title}</p>
                    )}
                    <p className={`${row.title ? 'text-[#A7ABB6] text-[12px]' : 'text-[#F5F0E6] text-[14px] font-medium'} break-words`}>
                      {row.property}
                    </p>
                    {(row.contactName || row.contactPhone || row.contactEmail || row.whatsappUrl) && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#7D8291]">
                        {row.contactName && <span>{lang === 'vi' ? 'Liên hệ' : 'Contact'}: {row.contactName}</span>}
                        {row.contactPhone && <span>{row.contactPhone}</span>}
                        {row.contactEmail && <span>{row.contactEmail}</span>}
                        {row.whatsappUrl && <span>WhatsApp</span>}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[#A7ABB6] text-[12px] mb-3 break-words">{row.location}</p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(row.status)}`}>
                      {row.status}
                    </span>
                    {expiry && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${expiry.cls}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {expiry.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openContactEditor(row)}
                      className="p-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] hover:bg-[#B88717]/20 transition-colors"
                      aria-label={lang === 'vi' ? 'Sửa liên hệ' : 'Edit contact'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleVip(row.id)}
                      title={row.isVip ? 'Remove VIP' : 'Make VIP'}
                      className={`p-1.5 rounded-lg transition-colors ${row.isVip ? 'bg-[#B88717]/20 text-[#F6D37A] hover:bg-[#B88717]/30' : 'bg-white/[0.06] text-[#7D8291] hover:bg-white/[0.1]'}`}
                    >
                      <Star className={`w-4 h-4 ${row.isVip ? 'fill-[#F6D37A]' : ''}`} />
                    </button>
                    {row.status !== 'Active' && (
                      <button
                        onClick={() => setListingStatus(row.id, 'Active')}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {row.status !== 'Hidden' && (
                      <button
                        onClick={() => setListingStatus(row.id, 'Hidden')}
                        className="p-1.5 rounded-lg bg-white/[0.06] text-[#7D8291] hover:bg-white/[0.1] transition-colors"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteListing(row.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
            {listings.length === 0 && (
              <p className="py-10 text-center text-[#7D8291] text-[14px]">No listings to display.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== INQUIRIES TAB ==================== */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const isExpanded = expandedInquiry === inq.id;
            return (
              <div
                key={inq.id}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] overflow-hidden min-w-0"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedInquiry(isExpanded ? null : inq.id)}
                  className="w-full flex items-start sm:items-center justify-between gap-3 p-4 sm:p-5 text-left"
                >
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[#F5F0E6] font-semibold text-[14px] sm:text-[15px] break-words">
                        {inq.name}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${inquiryBadge(inq.status)}`}>
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-[#A7ABB6] text-[12px] sm:text-[13px] break-words">{inq.email}</p>
                    <p className="text-[#7D8291] text-[12px] mt-1 break-words">
                    <span className="text-[#A7ABB6]">{lang === 'vi' ? 'BĐS:' : 'Property:'}</span> {inq.property}
                    </p>
                    <p className="text-[#7D8291] text-[11px] mt-1">{inq.date}</p>
                    {!isExpanded && (
                      <p className="text-[#7D8291] text-[12px] mt-2 line-clamp-1 break-words">
                        {inq.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#7D8291]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#7D8291]" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-white/[0.06]">
                    <p className="text-[#A7ABB6] text-[13px] sm:text-[14px] leading-relaxed pt-4 break-words">
                      {inq.message}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => cycleInquiryStatus(inq.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] text-[12px] font-medium hover:bg-[#B88717]/20 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {lang === 'vi' ? `Đánh dấu ${inq.status === 'New' ? 'Đã đọc' : inq.status === 'Read' ? 'Đã trả lời' : 'Mới'}` : `Mark as ${inq.status === 'New' ? 'Read' : inq.status === 'Read' ? 'Replied' : 'New'}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== BANNERS TAB ==================== */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className="bg-[#15151D] rounded-xl border border-white/[0.085] p-5 sm:p-6 min-w-0"
            >
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h3 className="text-[#F6D37A] font-semibold text-[15px] break-words">
                  {lang === 'vi' ? `Vị trí banner ${idx + 1}` : `Banner Slot ${idx + 1}`}
                </h3>
                <button
                  onClick={() => toggleBanner(banner.id)}
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                >
                  {banner.active ? (
                    <>
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                      <span className="text-emerald-400">{lang === 'vi' ? 'Hoạt động' : 'Active'}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6 text-[#7D8291]" />
                      <span className="text-[#7D8291]">{lang === 'vi' ? 'Tắt' : 'Inactive'}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[#A7ABB6] text-[12px] font-medium mb-1.5">{lang === 'vi' ? 'Tiêu đề' : 'Title'}</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => updateBanner(banner.id, 'title', e.target.value)}
                    className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7ABB6] text-[12px] font-medium mb-1.5">{lang === 'vi' ? 'Mô tả' : 'Description'}</label>
                  <input
                    type="text"
                    value={banner.description}
                    onChange={(e) => updateBanner(banner.id, 'description', e.target.value)}
                    className="w-full bg-[#0c0c12] border border-white/[0.085] rounded-xl text-[#F5F0E6] placeholder-[#7D8291] px-4 py-3 text-sm focus:border-[#B88717]/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== REPORTS TAB ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-[#15151D] border border-white/[0.085] rounded-xl p-8 text-center">
              <Flag className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-[#A7ABB6] text-sm">{lang === 'vi' ? 'Chưa có báo cáo nào.' : 'No reports submitted yet.'}</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 sm:p-5 min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[#F5F0E6] font-semibold text-[14px] sm:text-[15px] mb-1 break-words">
                      {report.propertyAddress}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B88717]/15 text-[#F6D37A] border border-[#B88717]/20 capitalize">
                        {report.reason}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${reportBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-[#A7ABB6] text-[13px] leading-relaxed break-words mb-2">
                      {report.description}
                    </p>
                    {(report.contactEmail || report.contactPhone) && (
                      <p className="text-[#7D8291] text-[12px] break-words">
                        Contact: {report.contactEmail}{report.contactEmail && report.contactPhone ? ' · ' : ''}{report.contactPhone}
                      </p>
                    )}
                    <p className="text-[#7D8291] text-[11px] mt-1">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => cycleReportStatus(report.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] text-[12px] font-medium hover:bg-[#B88717]/20 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {lang === 'vi' ? (report.status === 'pending' ? 'Xem xét' : report.status === 'reviewed' ? 'Giải quyết' : report.status === 'resolved' ? 'Bỏ qua' : 'Mở lại') : (report.status === 'pending' ? 'Review' : report.status === 'reviewed' ? 'Resolve' : report.status === 'resolved' ? 'Dismiss' : 'Reopen')}
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== SCHEDULES TAB ==================== */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-[#15151D] border border-white/[0.085] rounded-xl p-8 text-center">
              <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-[#A7ABB6] text-sm">{lang === 'vi' ? 'Chưa có lịch xem nhà.' : 'No scheduled viewings yet.'}</p>
            </div>
          ) : (
            schedules.map((sch) => (
              <div
                key={sch.id}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 sm:p-5 min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[#F5F0E6] font-semibold text-[14px] sm:text-[15px] mb-1 break-words">
                      {sch.propertyAddress}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${scheduleBadge(sch.status)}`}>
                        {sch.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px] mb-2">
                      <p className="text-[#A7ABB6] break-words">
                        <span className="text-[#7D8291]">{lang === 'vi' ? 'Tên:' : 'Name:'}</span> {sch.name}
                      </p>
                      <p className="text-[#A7ABB6] break-words">
                        <span className="text-[#7D8291]">{lang === 'vi' ? 'SĐT:' : 'Phone:'}</span> {sch.phone}
                      </p>
                      <p className="text-[#A7ABB6] break-words">
                        <span className="text-[#7D8291]">Email:</span> {sch.email}
                      </p>
                      <p className="text-[#A7ABB6] break-words">
                        <span className="text-[#7D8291]">{lang === 'vi' ? 'Ngày/Giờ:' : 'Date/Time:'}</span> {sch.date} at {sch.time}
                      </p>
                    </div>
                    {sch.message && (
                      <p className="text-[#7D8291] text-[12px] break-words italic">
                        &ldquo;{sch.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => cycleScheduleStatus(sch.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717]/10 text-[#F6D37A] text-[12px] font-medium hover:bg-[#B88717]/20 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {lang === 'vi' ? (sch.status === 'pending' ? 'Xác nhận' : sch.status === 'confirmed' ? 'Hủy' : 'Mở lại') : (sch.status === 'pending' ? 'Confirm' : sch.status === 'confirmed' ? 'Cancel' : 'Reopen')}
                    </button>
                    <button
                      onClick={() => deleteSchedule(sch.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== BLOG TAB ==================== */}
      {activeTab === 'blog' && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <h2 className="text-[#F6D37A] font-semibold text-[16px] break-words">{lang === 'vi' ? 'Bài nháp' : 'Draft Posts'}</h2>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[#F6D37A] text-[13px] font-medium hover:text-[#D4A020] transition-colors"
            >
              {lang === 'vi' ? 'Xem Blog' : 'View Blog'}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {blogDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
              >
                <div className="min-w-0 flex-grow">
                  <p className="text-[#F5F0E6] font-medium text-[14px] sm:text-[15px] mb-1 break-words">
                    {draft.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[12px]">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-semibold border ${
                        draft.status === 'Published'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {draft.status}
                    </span>
                    <span className="text-[#7D8291]">{draft.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-[#A7ABB6] text-[12px] font-medium hover:bg-white/[0.1] hover:text-[#F5F0E6] transition-colors border border-white/[0.12]">
                    <Edit className="w-3.5 h-3.5" />
                    {lang === 'vi' ? 'Sửa' : 'Edit'}
                  </button>
                  <button
                    onClick={() => togglePostStatus(draft.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B88717] hover:bg-[#D4A020] text-[#030405] text-[12px] font-semibold transition-colors"
                  >
                    {lang === 'vi' ? (draft.status === 'Draft' ? 'Xuất bản' : 'Gỡ xuống') : (draft.status === 'Draft' ? 'Publish' : 'Unpublish')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== USERS TAB ==================== */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-[#F6D37A] font-semibold text-[16px] mb-6">{lang === 'vi' ? 'Quản lý người dùng' : 'User Management'}</h2>
          {users.length === 0 ? (
            <div className="text-center py-12 text-[#7D8291]">{lang === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0 flex-grow">
                    <p className="text-[#F5F0E6] font-medium text-[14px] sm:text-[15px] mb-1 break-words">
                      {user.full_name || 'No name'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#7D8291]">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                      {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold border ${user.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                        {user.status}
                      </span>
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{user.role}</span>
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${user.status === 'active' ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'}`}
                  >
                    {user.status === 'active' ? <><ShieldBan className="w-3.5 h-3.5" />{lang === 'vi' ? 'Tạm ngưng' : 'Suspend'}</> : <><ShieldCheck className="w-3.5 h-3.5" />{lang === 'vi' ? 'Kích hoạt' : 'Activate'}</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TRANSACTIONS TAB ==================== */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#F6D37A] font-semibold text-[16px]">
              {lang === 'vi' ? 'Quản lý giao dịch chuyển khoản' : 'Bank Transfer Management'}
            </h2>
            <div className="flex gap-2">
              {['all', 'pending', 'verified', 'rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTransferFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                    transferFilter === f
                      ? 'bg-[#B88717]/20 text-[#F6D37A] border-[#B88717]/30'
                      : 'bg-white/[0.03] text-[#7D8291] border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {f === 'all' ? (lang === 'vi' ? 'Tất cả' : 'All')
                   : f === 'pending' ? (lang === 'vi' ? 'Chờ xác minh' : 'Pending')
                   : f === 'verified' ? (lang === 'vi' ? 'Đã xác minh' : 'Verified')
                   : (lang === 'vi' ? 'Từ chối' : 'Rejected')}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const filtered = transferFilter === 'all' 
              ? transfers 
              : transfers.filter((t: any) => t.status === transferFilter);
            
            if (filtered.length === 0) {
              return <div className="text-center py-12 text-[#7D8291]">{lang === 'vi' ? 'Chưa có giao dịch nào' : 'No transactions found'}</div>;
            }

            return (
              <div className="space-y-3">
                {filtered.map((tx: any) => (
                  <div key={tx.id} className="bg-[#15151D] rounded-xl border border-white/[0.085] p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-bold text-[#F6D37A]">${tx.amount} {tx.currency}</span>
                          <span className="text-[11px] text-[#7D8291] bg-white/[0.04] px-2 py-0.5 rounded font-mono">{tx.ref_code}</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            tx.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : tx.status === 'rejected' ? 'bg-red-500/15 text-red-400 border-red-500/20'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                          }`}>{tx.status === 'pending' ? (lang === 'vi' ? 'Chờ xác minh' : 'Pending') : tx.status === 'verified' ? (lang === 'vi' ? 'Đã xác minh' : 'Verified') : (lang === 'vi' ? 'Từ chối' : 'Rejected')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#7D8291]">
                          <span>{lang === 'vi' ? 'Mục đích' : 'Purpose'}: <strong className="text-[#A7ABB6]">{tx.purpose === 'deposit' ? (lang === 'vi' ? 'Đặt cọc' : 'Deposit') : tx.purpose === 'pro_listing' ? 'Pro Listing' : tx.purpose === 'verification' ? (lang === 'vi' ? 'Xác minh' : 'Verification') : (lang === 'vi' ? 'Khác' : 'Other')}</strong></span>
                          {(tx.user_name || tx.sender_name) && <span>👤 {tx.user_name || tx.sender_name}</span>}
                          {(tx.user_email || tx.sender_email) && <span>✉️ {tx.user_email || tx.sender_email}</span>}
                          <span>🕒 {new Date(tx.created_at).toLocaleString()}</span>
                          {tx.verified_at && <span>✅ {new Date(tx.verified_at).toLocaleString()}</span>}
                        </div>
                        {tx.description && <p className="text-[11px] text-[#7D8291] mt-1 italic">{tx.description}</p>}
                      </div>

                      {tx.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleTransferStatus(tx.id, 'verified')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors"
                          >
                            ✓ {lang === 'vi' ? 'Xác nhận' : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleTransferStatus(tx.id, 'rejected')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-colors"
                          >
                            ✕ {lang === 'vi' ? 'Từ chối' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.085] bg-[#15151D] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-[#F6D37A] text-[17px] font-bold break-words">
                  {lang === 'vi' ? 'Sửa liên hệ riêng của tin' : 'Edit Listing Contact'}
                </h2>
                <p className="mt-1 text-[#7D8291] text-[12px] break-words">
                  {editingListing.title || editingListing.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#A7ABB6] transition-colors hover:bg-white/[0.1] hover:text-[#F5F0E6]"
                aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="space-y-4 px-5 py-5"
              onSubmit={(e) => {
                e.preventDefault();
                void saveListingContact();
              }}
            >
              <p className="text-[#A7ABB6] text-[13px] leading-relaxed">
                {lang === 'vi'
                  ? 'Thông tin này áp dụng riêng cho tin đăng này. Khách xem tin sẽ gọi, email hoặc nhắn WhatsApp theo các thông tin bên dưới.'
                  : 'These details belong to this listing only. Buyers will call, email, or message the contact below.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#A7ABB6]">
                    {lang === 'vi' ? 'Tên chủ nhà / môi giới' : 'Owner / agent name'}
                  </label>
                  <input
                    value={contactDraft.contactName}
                    onChange={(e) => updateContactDraft('contactName', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] px-4 py-3 text-[13px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#A7ABB6]">
                    {lang === 'vi' ? 'Số điện thoại gọi' : 'Call phone'}
                  </label>
                  <input
                    value={contactDraft.contactPhone}
                    onChange={(e) => updateContactDraft('contactPhone', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] px-4 py-3 text-[13px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    placeholder="+1 305 555 8844"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#A7ABB6]">
                    {lang === 'vi' ? 'WhatsApp của tin đăng' : 'Listing WhatsApp'}
                  </label>
                  <input
                    value={contactDraft.whatsappUrl}
                    onChange={(e) => updateContactDraft('whatsappUrl', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] px-4 py-3 text-[13px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    placeholder={lang === 'vi' ? 'Số WhatsApp hoặc https://wa.me/...' : 'Phone number or https://wa.me/...'}
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#7D8291]">
                    {lang === 'vi' ? 'Bỏ trống thì hệ thống dùng số điện thoại gọi làm WhatsApp.' : 'Leave blank to use the call phone number for WhatsApp.'}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#A7ABB6]">
                    {lang === 'vi' ? 'Email của tin đăng' : 'Listing email'}
                  </label>
                  <input
                    type="email"
                    value={contactDraft.contactEmail}
                    onChange={(e) => updateContactDraft('contactEmail', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.085] bg-[#0c0c12] px-4 py-3 text-[13px] text-[#F5F0E6] outline-none transition-colors placeholder:text-[#7D8291] focus:border-[#B88717]/50"
                    placeholder="contact@gmail.com"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-[#A7ABB6] transition-colors hover:bg-white/[0.08] hover:text-[#F5F0E6]"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={contactSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B88717] px-4 py-2.5 text-[13px] font-bold text-[#030405] transition-colors hover:bg-[#D4A020] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {contactSaving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu liên hệ' : 'Save contact')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminPage;
