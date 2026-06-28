// ─── Extended Property Fields ────────────────────────────────────────
// These augment the existing Property interface in data/properties.ts
// via intersection when needed by new features.

export interface PropertyExtras {
  numericSqft?: number;
  youtubeUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  xUrl?: string;
  whatsappUrl?: string;
  isVip?: boolean;
  createdAt?: string;   // ISO date
  expiresAt?: string;   // ISO date
  listingStatus?: 'active' | 'pending' | 'hidden' | 'expired';
}

// ─── Report ──────────────────────────────────────────────────────────
export type ReportReason = 'spam' | 'incorrect' | 'scam' | 'duplicate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  propertyId: string;
  propertyAddress: string;
  reason: ReportReason;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  status: ReportStatus;
  createdAt: string;
}

// ─── Schedule Viewing ────────────────────────────────────────────────
export type ScheduleStatus = 'pending' | 'confirmed' | 'cancelled';

export interface ScheduleViewing {
  id: string;
  propertyId: string;
  propertyAddress: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  message: string;
  status: ScheduleStatus;
  createdAt: string;
}

// ─── Project ─────────────────────────────────────────────────────────
export type ProjectStatus = 'pre-sale' | 'under-construction' | 'completed' | 'sold-out';

export interface Project {
  id: string;
  name: string;
  developer: string;
  location: string;
  description: string;
  image: string;
  status: ProjectStatus;
  units: number;
  priceRange: string;
  numericPriceMin: number;
  numericPriceMax: number;
  area: string;
  completionDate: string;
  amenities: string[];
}

// ─── AI Description ──────────────────────────────────────────────────
export interface AIDescriptionInput {
  propertyType: string;
  listingType: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  address: string;
  city: string;
  state: string;
  isVip?: boolean;
  amenities?: string[];
}

// ─── Language / Currency ─────────────────────────────────────────────
export type Language = 'vi' | 'en';
export type Currency = 'USD';
