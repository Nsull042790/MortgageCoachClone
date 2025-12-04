/**
 * View tracking utility for shared scenarios
 * Uses localStorage to track views (works without a backend)
 */

interface ViewRecord {
  trackingId: string;
  clientName?: string;
  viewedAt: string;
  userAgent?: string;
}

interface TrackingSummary {
  trackingId: string;
  clientName?: string;
  totalViews: number;
  lastViewedAt?: string;
  views: ViewRecord[];
}

const STORAGE_KEY = 'loan_scenario_views';
const TRACKING_IDS_KEY = 'loan_tracking_ids';

/**
 * Generate a unique tracking ID
 */
export function generateTrackingId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Record a view for a tracking ID
 */
export function recordView(trackingId: string, clientName?: string): void {
  const views = getStoredViews();

  const newView: ViewRecord = {
    trackingId,
    clientName,
    viewedAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  views.push(newView);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch (e) {
    console.warn('Failed to save view record:', e);
  }
}

/**
 * Get all stored views
 */
function getStoredViews(): ViewRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get view summary for a specific tracking ID
 */
export function getViewSummary(trackingId: string): TrackingSummary | null {
  const views = getStoredViews();
  const matchingViews = views.filter(v => v.trackingId === trackingId);

  if (matchingViews.length === 0) return null;

  const sortedViews = matchingViews.sort((a, b) =>
    new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );

  return {
    trackingId,
    clientName: matchingViews[0].clientName,
    totalViews: matchingViews.length,
    lastViewedAt: sortedViews[0]?.viewedAt,
    views: sortedViews,
  };
}

/**
 * Get all tracking summaries
 */
export function getAllTrackingSummaries(): TrackingSummary[] {
  const views = getStoredViews();
  const trackingIds = [...new Set(views.map(v => v.trackingId))];

  return trackingIds
    .map(id => getViewSummary(id))
    .filter((s): s is TrackingSummary => s !== null)
    .sort((a, b) => {
      const aTime = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
      const bTime = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
      return bTime - aTime;
    });
}

/**
 * Save a tracking ID with associated client name (for LO reference)
 */
export function saveTrackingId(trackingId: string, clientName?: string): void {
  try {
    const stored = localStorage.getItem(TRACKING_IDS_KEY);
    const trackingIds: Record<string, { clientName?: string; createdAt: string }> = stored ? JSON.parse(stored) : {};

    trackingIds[trackingId] = {
      clientName,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(TRACKING_IDS_KEY, JSON.stringify(trackingIds));
  } catch (e) {
    console.warn('Failed to save tracking ID:', e);
  }
}

/**
 * Get all saved tracking IDs with their metadata
 */
export function getSavedTrackingIds(): Record<string, { clientName?: string; createdAt: string }> {
  try {
    const stored = localStorage.getItem(TRACKING_IDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
