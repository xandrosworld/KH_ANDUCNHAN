/**
 * Listing service — API-first with localStorage fallback.
 *
 * When API is configured: ALL data goes through the database API only.
 * When API is NOT configured (demo mode): localStorage is used.
 */

import type { Property } from '../data/properties';
import { isApiConfigured } from './apiClient';
import { mapApiProperties, mapApiProperty } from './apiMappers';
import {
  listPropertiesPublic,
  listPropertiesAdmin,
  listOwnProperties,
  getPropertyPublic,
  createProperty,
  updateProperty,
  updateOwnProperty,
  uploadOwnPropertyImages,
  deleteProperty,
  togglePropertyVip,
} from './propertyApi';

const STORAGE_KEY = 'gf_mock_listings';

function readAll(): (Property & Record<string, unknown>)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(listings: (Property & Record<string, unknown>)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}

export const listingService = {
  /** Get all listings — public API (only active/approved) */
  async getAll(): Promise<(Property & Record<string, unknown>)[]> {
    if (isApiConfigured()) {
      const result = await listPropertiesPublic();
      if (result.ok && result.data) return mapApiProperties(result.data as Record<string, unknown>[]);
      return [];
    }
    return readAll();
  },

  /** Get all listings — admin API (includes pending/hidden/expired) */
  async getAllAdmin(): Promise<(Property & Record<string, unknown>)[]> {
    if (isApiConfigured()) {
      const result = await listPropertiesAdmin();
      if (result.ok && result.data) return mapApiProperties(result.data as Record<string, unknown>[]);
      const errMsg = result.error || 'Failed to load listings';
      throw new Error(errMsg.includes('401') || errMsg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : errMsg);
    }
    return readAll();
  },

  /** Get the current user's listings, including hidden/pending listings */
  async getOwn(): Promise<(Property & Record<string, unknown>)[]> {
    if (isApiConfigured()) {
      const result = await listOwnProperties();
      if (result.ok && result.data) return mapApiProperties(result.data as Record<string, unknown>[]);
      throw new Error(result.error || 'Failed to load your listings');
    }
    return readAll();
  },

  /** Get a single listing by ID — public API */
  async getById(id: string): Promise<(Property & Record<string, unknown>) | undefined> {
    if (isApiConfigured()) {
      try {
        const result = await getPropertyPublic(id);
        if (result.ok && result.data) return mapApiProperty(result.data as Record<string, unknown>);
      } catch { /* ignore */ }
      return undefined;
    }
    return readAll().find((l) => l.id === id);
  },

  /** Create a new listing */
  async create(listing: Property & Record<string, unknown>): Promise<void> {
    if (isApiConfigured()) {
      const result = await createProperty(listing as Record<string, unknown>);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to create property via API');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    all.push(listing);
    writeAll(all);
  },

  /** Update a listing by ID */
  async update(id: string, updates: Partial<Property & Record<string, unknown>>): Promise<void> {
    if (isApiConfigured()) {
      const result = await updateProperty(id, updates);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update property via API');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      writeAll(all);
    }
  },

  /** Update a listing owned by the current user */
  async updateOwn(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<Property & Record<string, unknown>> {
    if (isApiConfigured()) {
      const result = await updateOwnProperty(id, updates);
      if (result.ok && result.data) {
        return mapApiProperty(result.data as Record<string, unknown>);
      }
      throw new Error(result.error || 'Failed to update your listing');
    }

    const all = readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx < 0) {
      throw new Error('Listing not found');
    }
    all[idx] = { ...all[idx], ...updates };
    writeAll(all);
    return all[idx];
  },

  /** Add image files to a listing owned by the current user */
  async uploadOwnImages(
    id: string,
    files: File[],
  ): Promise<Property & Record<string, unknown>> {
    if (isApiConfigured()) {
      const result = await uploadOwnPropertyImages(id, files);
      if (result.ok && result.data) {
        return mapApiProperty(result.data as Record<string, unknown>);
      }
      throw new Error(result.error || 'Failed to upload listing images');
    }

    const all = readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx < 0) {
      throw new Error('Listing not found');
    }
    return all[idx];
  },

  /** Delete a listing by ID */
  async remove(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await deleteProperty(id);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete property via API');
      }
      return;
    }
    // Demo mode: localStorage
    writeAll(readAll().filter((l) => l.id !== id));
  },

  /** Toggle VIP status */
  async toggleVip(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await togglePropertyVip(id);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to toggle VIP via API');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx >= 0) {
      const current = all[idx] as Record<string, unknown>;
      current.isVip = !current.isVip;
      writeAll(all);
    }
  },
};
