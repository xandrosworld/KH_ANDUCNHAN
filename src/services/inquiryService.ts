/**
 * Inquiry service — API-first with localStorage fallback.
 *
 * When API is configured: ALL data goes through the database API only.
 * When API is NOT configured (demo mode): localStorage is used.
 */

import { isApiConfigured } from './apiClient';
import { mapApiInquiries, mapApiInquiry } from './apiMappers';
import {
  listInquiries,
  createInquiry,
  updateInquiryStatus as apiUpdateInquiryStatus,
  deleteInquiry as apiDeleteInquiry,
} from './propertyApi';

const STORAGE_KEY = 'gf_inquiries';

export type InquiryStatus = 'new' | 'read' | 'replied';

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  property: string;
  propertyId?: string;
  date: string;
  status: InquiryStatus;
}

function readAll(): InquiryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(inquiries: InquiryRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
}

export const inquiryService = {
  async getAll(): Promise<InquiryRecord[]> {
    if (isApiConfigured()) {
      const result = await listInquiries();
      if (result.ok && result.data) {
        return mapApiInquiries(result.data as Record<string, unknown>[]);
      }
      const errMsg = result.error || 'Failed to load inquiries';
      throw new Error(errMsg.includes('401') || errMsg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : errMsg);
    }
    return readAll();
  },

  async create(data: Omit<InquiryRecord, 'id' | 'date' | 'status'>): Promise<InquiryRecord> {
    const inquiry: InquiryRecord = {
      ...data,
      id: `inq-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'new',
    };

    if (isApiConfigured()) {
      const result = await createInquiry({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        property_id: data.propertyId || data.property,
      });
      if (result.ok) {
        const created = result.data
          ? mapApiInquiry(result.data as Record<string, unknown>)
          : inquiry;
        return created;
      }
      throw new Error(result.error || 'Failed to submit inquiry. Please try again.');
    }

    // Demo mode: localStorage
    const all = readAll();
    all.push(inquiry);
    writeAll(all);
    return inquiry;
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiUpdateInquiryStatus(id, status);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update inquiry status');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    const idx = all.findIndex((inquiry) => inquiry.id === id);
    if (idx >= 0) {
      all[idx].status = status;
      writeAll(all);
    }
  },

  async remove(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiDeleteInquiry(id);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete inquiry');
      }
      return;
    }
    writeAll(readAll().filter((inquiry) => inquiry.id !== id));
  },
};
