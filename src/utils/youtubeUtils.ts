/**
 * YouTube URL validation & ID extraction utilities.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/
 */

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    if (!['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'].includes(u.hostname)) {
      return false;
    }
    return YT_REGEX.test(url.trim());
  } catch {
    return false;
  }
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(YT_REGEX);
  return match ? match[1] : null;
}
