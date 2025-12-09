/**
 * View tracking utility for shared scenarios
 * Uses multiple counter APIs for cross-browser tracking + localStorage backup
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
const VIEW_COUNTS_KEY = 'loan_view_counts';

/**
 * Generate a unique tracking ID
 */
export function generateTrackingId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Try multiple counter APIs with fallback
 */
async function incrementCounter(trackingId: string): Promise<number | null> {
  // Try CountAPI first
  try {
    const response = await fetch(
      `https://api.countapi.xyz/hit/luminatebank/${trackingId}`,
      { method: 'GET', mode: 'cors' }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.value !== undefined) {
        console.log('CountAPI hit success:', data.value);
        return data.value;
      }
    }
  } catch (e) {
    console.warn('CountAPI failed:', e);
  }

  // Try alternative: use localStorage with a shared key pattern
  // This at least works for same-origin scenarios
  return null;
}

/**
 * Try multiple counter APIs to get count
 */
async function fetchCounter(trackingId: string): Promise<number | null> {
  // Try CountAPI
  try {
    const response = await fetch(
      `https://api.countapi.xyz/get/luminatebank/${trackingId}`,
      { method: 'GET', mode: 'cors' }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.value !== undefined && data.value !== null) {
        console.log('CountAPI get success:', data.value);
        return data.value;
      }
    }
  } catch (e) {
    console.warn('CountAPI get failed:', e);
  }

  return null;
}

/**
 * Record a view using external API + localStorage backup
 */
export async function recordView(trackingId: string, clientName?: string): Promise<void> {
  // Record locally first (always works)
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
    console.warn('Failed to save view record locally:', e);
  }

  // Also increment local view count (for demo purposes)
  const currentCount = getCachedViewCount(trackingId);
  updateCachedViewCount(trackingId, currentCount + 1);

  // Try external counter API (cross-browser)
  const externalCount = await incrementCounter(trackingId);
  if (externalCount !== null) {
    updateCachedViewCount(trackingId, externalCount);
  }
}

/**
 * Get view count - tries external API first, falls back to local
 */
export async function getViewCount(trackingId: string): Promise<number> {
  // Try external API first
  const externalCount = await fetchCounter(trackingId);
  if (externalCount !== null) {
    updateCachedViewCount(trackingId, externalCount);
    return externalCount;
  }

  // Fallback to cached/local count
  return getCachedViewCount(trackingId);
}

/**
 * Update cached view count in localStorage
 */
function updateCachedViewCount(trackingId: string, count: number): void {
  try {
    const cached = localStorage.getItem(VIEW_COUNTS_KEY);
    const counts: Record<string, { count: number; updatedAt: string }> = cached ? JSON.parse(cached) : {};
    counts[trackingId] = { count, updatedAt: new Date().toISOString() };
    localStorage.setItem(VIEW_COUNTS_KEY, JSON.stringify(counts));
  } catch (e) {
    console.warn('Failed to cache view count:', e);
  }
}

/**
 * Get cached view count from localStorage
 */
function getCachedViewCount(trackingId: string): number {
  try {
    const cached = localStorage.getItem(VIEW_COUNTS_KEY);
    if (cached) {
      const counts = JSON.parse(cached);
      return counts[trackingId]?.count || 0;
    }
  } catch {
    // Ignore
  }
  return 0;
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
