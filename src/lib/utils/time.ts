/**
 * Time utility helpers.
 */

/**
 * Format an ISO timestamp as a human-readable relative time string.
 *
 * Examples:
 *   "just now"  — < 60 seconds ago
 *   "5m ago"    — < 60 minutes ago
 *   "3h ago"    — < 24 hours ago
 *   "2d ago"    — < 7 days ago
 *   "Jan 3"     — older than 7 days
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
