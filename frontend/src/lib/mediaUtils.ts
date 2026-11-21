/**
 * Utility functions for handling banner & advertisement media (Images, HTML5 MP4/WebM videos, and YouTube embeds).
 */

export function isMediaVideo(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mov') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.startsWith('data:video/')
  );
}

export function isYouTubeVideo(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return lower.includes('youtube.com') || lower.includes('youtu.be');
}

export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function formatMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes(':3000/uploads/')) {
    return trimmed.replace(':3000/uploads/', ':4000/uploads/');
  }
  return trimmed;
}
