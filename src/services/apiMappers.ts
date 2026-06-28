/**
 * Centralized API response ↔ frontend type mappers.
 *
 * Backend (MySQL) uses snake_case, frontend uses camelCase.
 * These mappers ensure the conversion is done in ONE place,
 * not scattered across pages and services.
 */

import type { Property } from '../data/properties';
import type { InquiryRecord, InquiryStatus } from './inquiryService';
import type { Report, ReportStatus, ScheduleViewing, ScheduleStatus } from '../types/types';

// ─── Generic helpers ────────────────────────────────────────────────────────

type ApiRow = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v === 'true';
  return false;
}

// ─── Property mapper ────────────────────────────────────────────────────────

function formatPrice(rawPrice: unknown, listingType: unknown): string {
  const n = num(rawPrice);
  const formatted = n.toLocaleString('en-US');
  return str(listingType) === 'rent' ? `$${formatted}/mo` : `$${formatted}`;
}

/**
 * Map a single backend property row to the frontend Property shape.
 */
export function mapApiProperty(raw: ApiRow): Property & Record<string, unknown> {
  const images = Array.isArray(raw.images) ? (raw.images as string[]) : [];
  const mainImage = str(raw.main_image) || images[0] || '';

  return {
    id: str(raw.id),
    title: str(raw.title),
    image: mainImage,
    images,
    tag: bool(raw.is_vip) ? 'VIP' : 'New Listing',
    tagColor: bool(raw.is_vip) ? 'bg-amber-600' : 'bg-emerald-600',
    price: formatPrice(raw.price, raw.listing_type),
    numericPrice: num(raw.price),
    bds: num(raw.bedrooms),
    ba: num(raw.bathrooms),
    sqft: String(num(raw.sqft)),
    status: str(raw.listing_type) === 'rent' ? 'For Rent' : 'For Sale',
    listingType: (str(raw.listing_type) || 'sale') as 'sale' | 'rent',
    address: str(raw.address),
    city: str(raw.city),
    state: str(raw.state),
    zip: str(raw.zip),
    propertyType: str(raw.property_type, 'Single Family'),
    latitude: raw.latitude != null ? num(raw.latitude) : null,
    longitude: raw.longitude != null ? num(raw.longitude) : null,
    mls: str(raw.mls, `MLS# ${str(raw.id).toUpperCase()}`),
    description: str(raw.description, 'No description provided.'),
    // Extended fields
    videoUrl: str(raw.video_url) || undefined,
    youtubeUrl: str(raw.youtube_url) || undefined,
    facebookUrl: str(raw.facebook_url) || undefined,
    instagramUrl: str(raw.instagram_url) || undefined,
    tiktokUrl: str(raw.tiktok_url) || undefined,
    xUrl: str(raw.x_url) || undefined,
    whatsappUrl: str(raw.whatsapp_url) || undefined,
    isVip: bool(raw.is_vip),
    numericSqft: num(raw.sqft),
    createdAt: str(raw.created_at),
    expiresAt: str(raw.expires_at) || undefined,
    listingStatus: str(raw.status, 'active') as 'active' | 'pending' | 'hidden' | 'expired',
    // Contact info (may be present for detail view)
    contactName: str(raw.contact_name) || undefined,
    contactPhone: str(raw.contact_phone) || undefined,
    contactEmail: str(raw.contact_email) || undefined,
  };
}

/**
 * Map an array of backend property rows.
 */
export function mapApiProperties(rows: ApiRow[]): (Property & Record<string, unknown>)[] {
  return rows.map(mapApiProperty);
}

// ─── Inquiry mapper ─────────────────────────────────────────────────────────

/**
 * Map a backend inquiry row to the frontend InquiryRecord shape.
 */
export function mapApiInquiry(raw: ApiRow): InquiryRecord {
  return {
    id: str(raw.id),
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone) || undefined,
    message: str(raw.message),
    property: str(raw.property_id) || str(raw.property),
    date: str(raw.created_at) || str(raw.date),
    status: (str(raw.status, 'new') as InquiryStatus),
  };
}

export function mapApiInquiries(rows: ApiRow[]): InquiryRecord[] {
  return rows.map(mapApiInquiry);
}

// ─── Report mapper ──────────────────────────────────────────────────────────

/**
 * Map a backend report row to the frontend Report shape.
 */
export function mapApiReport(raw: ApiRow): Report {
  return {
    id: str(raw.id),
    propertyId: str(raw.property_id) || str(raw.propertyId),
    propertyAddress: str(raw.property_address) || str(raw.propertyAddress),
    reason: str(raw.reason, 'other') as Report['reason'],
    description: str(raw.description),
    contactEmail: str(raw.contact_email) || str(raw.contactEmail) || undefined,
    contactPhone: str(raw.contact_phone) || str(raw.contactPhone) || undefined,
    status: (str(raw.status, 'pending') as ReportStatus),
    createdAt: str(raw.created_at) || str(raw.createdAt),
  };
}

export function mapApiReports(rows: ApiRow[]): Report[] {
  return rows.map(mapApiReport);
}

// ─── Schedule mapper ────────────────────────────────────────────────────────

/**
 * Map a backend schedule row to the frontend ScheduleViewing shape.
 */
export function mapApiSchedule(raw: ApiRow): ScheduleViewing {
  return {
    id: str(raw.id),
    propertyId: str(raw.property_id) || str(raw.propertyId),
    propertyAddress: str(raw.property_address) || str(raw.propertyAddress),
    name: str(raw.name),
    phone: str(raw.phone),
    email: str(raw.email),
    date: str(raw.date),
    time: str(raw.time),
    message: str(raw.message),
    status: (str(raw.status, 'pending') as ScheduleStatus),
    createdAt: str(raw.created_at) || str(raw.createdAt),
  };
}

export function mapApiSchedules(rows: ApiRow[]): ScheduleViewing[] {
  return rows.map(mapApiSchedule);
}
