export const DESCRIPTION_LIMIT = 800;

export function truncateText(text: string, limit: number): string {
  if (!text) return "";
  if (text.length <= limit) {
    return text;
  }
  return text.substring(0, limit) + "...";
} 