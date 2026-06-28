/**
 * Expiry/VIP status utilities for listing lifecycle management.
 */

/** Check if a date string is in the past */
export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/** Check if expiry is within the next N days (default 3) */
export function isExpiringSoon(expiresAt?: string, withinDays = 3): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  if (expiry < now) return false; // already expired
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
  return daysLeft <= withinDays;
}

/** Days remaining until expiry */
export function daysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Get display status */
export function getExpiryStatus(expiresAt?: string): 'active' | 'expiring-soon' | 'expired' {
  if (!expiresAt) return 'active';
  if (isExpired(expiresAt)) return 'expired';
  if (isExpiringSoon(expiresAt)) return 'expiring-soon';
  return 'active';
}

/** Generate ISO expiry date from now, adding N days */
export function createExpiryDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}
