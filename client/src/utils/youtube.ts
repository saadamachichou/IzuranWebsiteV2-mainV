/**
 * YouTube utility functions for handling YouTube URLs and generating embed URLs
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats and iframe embed codes
 * @param input - YouTube URL or iframe embed code
 * @returns YouTube video ID or null if not found
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;

  // First check if it's an iframe embed code
  const iframeMatch = input.match(/src="https?:\/\/www\.youtube\.com\/embed\/([^"&\n?#]+)/);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }

  // Alternative iframe pattern without quotes
  const iframeMatch2 = input.match(/src=https?:\/\/www\.youtube\.com\/embed\/([^"&\n?#\s]+)/);
  if (iframeMatch2 && iframeMatch2[1]) {
    return iframeMatch2[1];
  }

  // Check for standard YouTube URLs
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    // YouTube shorts
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    // YouTube live streams
    /youtube\.com\/live\/([^&\n?#]+)/,
    // YouTube channel URLs (not supported for embeds)
    /youtube\.com\/channel\/([^&\n?#]+)/,
    // YouTube playlist URLs (not supported for embeds)
    /youtube\.com\/playlist\?list=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Checks if the input is a YouTube iframe embed code
 * @param input - Input string to check
 * @returns boolean indicating if it's an iframe embed code
 */
export function isYouTubeIframe(input: string): boolean {
  if (!input) return false;
  return /<iframe[^>]*src="?https?:\/\/www\.youtube\.com\/embed\/[^"&\n?#\s]+"?[^>]*>/i.test(input);
}

/**
 * Checks if a URL is a valid YouTube URL
 * @param url - URL to check
 * @returns boolean indicating if it's a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  
  const youtubeDomains = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'www.youtu.be'
  ];

  try {
    const urlObj = new URL(url);
    return youtubeDomains.some(domain => urlObj.hostname === domain);
  } catch {
    return false;
  }
}

/**
 * Generates YouTube embed URL from video ID
 * @param videoId - YouTube video ID
 * @param autoplay - Whether to autoplay the video (default: false)
 * @param start - Start time in seconds (optional)
 * @returns YouTube embed URL
 */
export function generateYouTubeEmbedUrl(videoId: string, autoplay: boolean = false, start?: number): string {
  const baseUrl = 'https://www.youtube.com/embed/';
  const params = new URLSearchParams();

  if (autoplay) {
    params.append('autoplay', '1');
  }

  if (start && start > 0) {
    params.append('start', start.toString());
  }

  // Add additional parameters for better embed experience
  params.append('rel', '0'); // Don't show related videos from other channels
  params.append('modestbranding', '1'); // Minimal YouTube branding

  const queryString = params.toString();
  return queryString ? `${baseUrl}${videoId}?${queryString}` : `${baseUrl}${videoId}`;
}

/**
 * Generates YouTube thumbnail URL from video ID
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality ('default', 'medium', 'high', 'standard', 'maxres')
 * @returns YouTube thumbnail URL
 */
export function generateYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Processes a YouTube URL and returns embed-ready data
 * @param input - YouTube URL or iframe embed code
 * @returns Object with video ID, embed URL, and thumbnail URL, or null if invalid
 */
export function processYouTubeUrl(input: string): {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
} | null {
  const videoId = extractYouTubeVideoId(input);
  
  if (!videoId) {
    return null;
  }

  return {
    videoId,
    embedUrl: generateYouTubeEmbedUrl(videoId),
    thumbnailUrl: generateYouTubeThumbnailUrl(videoId)
  };
}

/**
 * Normalizes a YouTube input (URL or iframe code) to a standard watch URL
 * @param input - YouTube URL or iframe embed code
 * @returns Standard YouTube watch URL or null if invalid
 */
export function normalizeYouTubeUrl(input: string): string | null {
  const videoId = extractYouTubeVideoId(input);
  
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Validates if a YouTube URL or iframe code can be embedded
 * @param input - YouTube URL or iframe embed code to validate
 * @returns boolean indicating if the input can be embedded
 */
export function canEmbedYouTubeUrl(input: string): boolean {
  // Check if it's an iframe embed code
  if (isYouTubeIframe(input)) {
    const videoId = extractYouTubeVideoId(input);
    return videoId !== null;
  }

  // Check if it's a regular YouTube URL
  if (!isYouTubeUrl(input)) {
    return false;
  }

  const videoId = extractYouTubeVideoId(input);
  if (!videoId) {
    return false;
  }

  // Check for unsupported URL types
  const unsupportedPatterns = [
    /youtube\.com\/channel\//,
    /youtube\.com\/playlist\?list=/,
    /youtube\.com\/user\//,
    /youtube\.com\/c\//
  ];

  return !unsupportedPatterns.some(pattern => pattern.test(input));
}
