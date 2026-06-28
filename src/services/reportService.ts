/**
 * Report service — API-first with localStorage fallback.
 *
 * When API is configured: ALL data goes through the database API only.
 * When API is NOT configured (demo mode): localStorage is used.
 */

import type { Report, ReportStatus } from '../types/types';
import { isApiConfigured } from './apiClient';
import { mapApiReports, mapApiReport } from './apiMappers';
import {
  listReports,
  createReport as apiCreateReport,
  updateReportStatus as apiUpdateReportStatus,
  deleteReport as apiDeleteReport,
} from './propertyApi';

const STORAGE_KEY = 'gf_reports';

function readAll(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(reports: Report[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export const reportService = {
  async getAll(): Promise<Report[]> {
    if (isApiConfigured()) {
      const result = await listReports();
      if (result.ok && result.data) {
        return mapApiReports(result.data as Record<string, unknown>[]);
      }
      const errMsg = result.error || 'Failed to load reports';
      throw new Error(errMsg.includes('401') || errMsg.includes('Unauthorized')
        ? 'Admin session expired. Please login again.' : errMsg);
    }
    return readAll();
  },

  async create(report: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<Report> {
    const newReport: Report = {
      ...report,
      id: `rpt-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (isApiConfigured()) {
      const result = await apiCreateReport({
        property_id: report.propertyId,
        property_address: report.propertyAddress,
        reason: report.reason,
        description: report.description,
        contact_email: report.contactEmail,
      });
      if (result.ok) {
        return result.data ? mapApiReport(result.data as Record<string, unknown>) : newReport;
      }
      throw new Error(result.error || 'Failed to submit report. Please try again.');
    }

    // Demo mode: localStorage
    const all = readAll();
    all.push(newReport);
    writeAll(all);
    return newReport;
  },

  async updateStatus(id: string, status: ReportStatus): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiUpdateReportStatus(id, status);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update report status');
      }
      return;
    }
    // Demo mode: localStorage
    const all = readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx >= 0) {
      all[idx].status = status;
      writeAll(all);
    }
  },

  async remove(id: string): Promise<void> {
    if (isApiConfigured()) {
      const result = await apiDeleteReport(id);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete report');
      }
      return;
    }
    writeAll(readAll().filter((r) => r.id !== id));
  },

  async getByPropertyId(propertyId: string): Promise<Report[]> {
    if (isApiConfigured()) {
      const result = await listReports();
      if (result.ok && result.data) {
        const all = mapApiReports(result.data as Record<string, unknown>[]);
        return all.filter((r) => r.propertyId === propertyId);
      }
      return [];
    }
    return readAll().filter((r) => r.propertyId === propertyId);
  },
};
