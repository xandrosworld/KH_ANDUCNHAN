/**
 * User-scoped localStorage utility.
 * 
 * Keys that should be per-user (like favorites, avatar, inquiries)
 * are prefixed with the user's ID to prevent data leaking between accounts.
 * 
 * Keys that are global (language, currency, fingerprint) remain unprefixed.
 */

// Keys that should be scoped per user
const USER_SCOPED_KEYS = [
  'gf_favorites',
  'gf_avatar',
  'gf_compare',
  'gf_compare_ids',
  'gf_inbox_messages',
  'gf_post_draft',
];

// Get current user ID from stored user data
function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('gf_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id || user?.user_id || null;
  } catch {
    return null;
  }
}

// Build the scoped key
function scopedKey(key: string): string {
  const userId = getCurrentUserId();
  if (userId && USER_SCOPED_KEYS.includes(key)) {
    return `${key}_u${userId}`;
  }
  return key;
}

/**
 * Get item from localStorage, scoped to current user if applicable.
 */
export function getUserItem(key: string): string | null {
  try {
    return localStorage.getItem(scopedKey(key));
  } catch {
    return null;
  }
}

/**
 * Set item in localStorage, scoped to current user if applicable.
 */
export function setUserItem(key: string, value: string): void {
  try {
    localStorage.setItem(scopedKey(key), value);
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Remove item from localStorage, scoped to current user if applicable.
 */
export function removeUserItem(key: string): void {
  try {
    localStorage.removeItem(scopedKey(key));
  } catch {
    // ignore
  }
}

/**
 * Migrate old unscoped data to the current user's scoped keys.
 * Call this once after login.
 */
export function migrateUserStorage(): void {
  const userId = getCurrentUserId();
  if (!userId) return;

  for (const key of USER_SCOPED_KEYS) {
    const oldValue = localStorage.getItem(key);
    const newKey = `${key}_u${userId}`;
    const newValue = localStorage.getItem(newKey);
    
    // Only migrate if old data exists and new scoped key doesn't
    if (oldValue && !newValue) {
      localStorage.setItem(newKey, oldValue);
    }
    // Remove old unscoped key to prevent confusion
    if (oldValue) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear all user-scoped data for the current user.
 * Call this on logout if you want to clear user data.
 */
export function clearUserStorage(): void {
  const userId = getCurrentUserId();
  if (!userId) return;

  for (const key of USER_SCOPED_KEYS) {
    localStorage.removeItem(`${key}_u${userId}`);
  }
}
