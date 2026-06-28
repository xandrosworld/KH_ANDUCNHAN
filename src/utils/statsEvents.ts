export const STATS_CHANGED_EVENT = 'gf-stats-changed';

export function getFingerprint(): string {
  try {
    const stored = localStorage.getItem('gf_fingerprint');
    if (stored) return stored;

    const fingerprint = `fp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem('gf_fingerprint', fingerprint);
    return fingerprint;
  } catch {
    return `fp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

export function emitStatsChanged(detail?: { likesDelta?: number }) {
  window.dispatchEvent(new CustomEvent(STATS_CHANGED_EVENT, { detail }));
}

export function readLocalUserName(): string | null {
  try {
    const raw = localStorage.getItem('gf_user');
    if (!raw) return null;

    const user = JSON.parse(raw);
    const name = String(user?.name || user?.fullName || user?.full_name || '').trim();
    if (name) return name;

    const email = String(user?.email || '').trim();
    if (email) return email.replace(/@.*/, '');
  } catch {
    return null;
  }
  return null;
}
