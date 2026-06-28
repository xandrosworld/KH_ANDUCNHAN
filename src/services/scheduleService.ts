/**
 * Schedule viewing service — API-first with localStorage fallback.
 *
 * When API is configured: ALL data goes through the database API only.
 * When API is NOT configured (demo mode): localStorage is used.
 */

import type { ScheduleViewing, ScheduleStatus } from '../types/types';
import { isApiConfigured } from './apiClient';
import { mapApiSchedules, mapApiSchedule } from './apiMappers';
import {
  listSchedules,
  createSchedule as apiCreateSchedule,
  updateScheduleStatus as apiUpdateScheduleStatus,
  deleteSchedule as apiDeleteSchedule,
} from './propertyApi';

const STORAGE_KEY = 'gf_schedules';

function readAll(): ScheduleViewing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ScheduleViewing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const scheduleService = {
  async getAll(): Promise<ScheduleViewing[]> {
    if (isApiConfigured()) {
      const result = await listSchedules();
      if (result.ok && result.data) {
        return mapApiSchedules(result.data as Record<string, unknown>[]);
      }
      const errMsg = result.error || 'Failed to load schedules';
      throw new Error(errMsg.includes('401') || errMsg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : errMsg);
    }
    return readAll();
  },

  async create(data: Omit<ScheduleViewing, 'id' | 'status' | 'createdAt'>): Promise<ScheduleViewing> {
    const newItem: ScheduleViewing = {
      ...data,
      id: `sch-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (isApiConfigured()) {
      const result = await apiCreateSchedule({
        property_id: data.propertyId,
        property_address: data.propertyAddress,
        name: data.name,
        phone: data.phone,
        email: data.email,
        date: data.date,
        time: data.time,
        message: data.message,
        paypal_order_id: (data as Record<string, unknown>).paypalOrderId as string || undefined,
      });
      if (result.ok) {
        return result.data ? mapApiSchedule(result.data as Record<string, unknown>) : newItem;
      }
      throw new Error(result.error || 'Failed to schedule viewing. Please try again.');
    }

    // Demo mode: localStorage
    const all = readAll();
    all.push(newItem);
    writeAll(all);
    return newItem;
  },

  async updateStatus(id: string, status: ScheduleStatus): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiUpdateScheduleStatus(id, status);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update schedule status');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx >= 0) {
      all[idx].status = status;
      writeAll(all);
    }
  },

  async remove(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiDeleteSchedule(id);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete schedule');
      }
      return;
    }
    writeAll(readAll().filter((s) => s.id !== id));
  },

  async getByPropertyId(propertyId: string): Promise<ScheduleViewing[]> {
    if (isApiConfigured()) {
      const result = await listSchedules();
      if (result.ok && result.data) {
        const all = mapApiSchedules(result.data as Record<string, unknown>[]);
        return all.filter((s) => s.propertyId === propertyId);
      }
      return [];
    }
    return readAll().filter((s) => s.propertyId === propertyId);
  },
};
