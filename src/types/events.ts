export interface EventSection {
  key?: string;
  title: string;
  body?: string;
  items?: string[];
}

export interface SvpEvent {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  speakerName: string;
  speakerTitle: string;
  formatLabel: string;
  scheduleLabel: string;
  ctaLabel: string;
  bannerUrl: string;
  sections: EventSection[];
  disclaimer: string;
  status: 'draft' | 'published' | 'hidden' | 'archived';
  registrationStatus: 'open' | 'closed';
  registrationCount?: number;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  svpId: string;
  careStatus: 'new' | 'contacted' | 'confirmed' | 'joined_group' | 'converted' | 'declined';
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerUrl?: string | null;
  note?: string | null;
  createdAt: string;
}
