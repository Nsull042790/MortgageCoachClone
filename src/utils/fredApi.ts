/**
 * FRED API Integration for Mortgage Rates
 * Fetches current market rates from Federal Reserve Economic Data
 * Data source: Freddie Mac Primary Mortgage Market Survey
 */

export interface MarketRates {
  conventional30: number | null;
  conventional15: number | null;
  arm51: number | null;
  lastUpdated: string;
  source: 'fred' | 'fallback';
}

// FRED series IDs for mortgage rates
const FRED_SERIES = {
  conventional30: 'MORTGAGE30US', // 30-Year Fixed Rate Mortgage Average
  conventional15: 'MORTGAGE15US', // 15-Year Fixed Rate Mortgage Average
  arm51: 'MORTGAGE5US',           // 5/1 ARM Average
};

// Fallback rates if FRED is unavailable
const FALLBACK_RATES: MarketRates = {
  conventional30: 6.875,
  conventional15: 6.25,
  arm51: 5.875,
  lastUpdated: new Date().toISOString(),
  source: 'fallback',
};

const STORAGE_KEY = 'luminate_market_rates';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch a single rate from FRED API
 */
async function fetchFREDRate(seriesId: string): Promise<number | null> {
  try {
    // FRED API - no API key needed for basic JSON access
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&sort_order=desc&limit=1&file_type=json&api_key=DEMO_KEY`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`FRED API error for ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      const value = parseFloat(data.observations[0].value);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch FRED rate for ${seriesId}:`, error);
    return null;
  }
}

/**
 * Fetch all market rates from FRED
 */
export async function fetchMarketRates(): Promise<MarketRates> {
  try {
    // Fetch all rates in parallel
    const [rate30, rate15, rateArm] = await Promise.all([
      fetchFREDRate(FRED_SERIES.conventional30),
      fetchFREDRate(FRED_SERIES.conventional15),
      fetchFREDRate(FRED_SERIES.arm51),
    ]);

    // If we got at least one rate, consider it a success
    if (rate30 !== null || rate15 !== null || rateArm !== null) {
      const rates: MarketRates = {
        conventional30: rate30,
        conventional15: rate15,
        arm51: rateArm,
        lastUpdated: new Date().toISOString(),
        source: 'fred',
      };

      // Cache the rates
      saveRatesToStorage(rates);

      return rates;
    }

    // Fall back to cached or default rates
    return getCachedRates() || FALLBACK_RATES;
  } catch (error) {
    console.warn('Failed to fetch market rates:', error);
    return getCachedRates() || FALLBACK_RATES;
  }
}

/**
 * Get cached rates from localStorage
 */
export function getCachedRates(): MarketRates | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MarketRates;
    }
  } catch (error) {
    console.warn('Failed to read cached rates:', error);
  }
  return null;
}

/**
 * Save rates to localStorage
 */
function saveRatesToStorage(rates: MarketRates): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch (error) {
    console.warn('Failed to cache rates:', error);
  }
}

/**
 * Check if cached rates are stale (older than 24 hours)
 */
export function areRatesStale(rates: MarketRates | null): boolean {
  if (!rates) return true;

  const lastUpdated = new Date(rates.lastUpdated).getTime();
  const now = Date.now();

  return (now - lastUpdated) > CACHE_DURATION_MS;
}

/**
 * Format the last updated date
 */
export function formatRateDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get rates - from cache if fresh, otherwise fetch new
 */
export async function getMarketRates(): Promise<MarketRates> {
  const cached = getCachedRates();

  if (cached && !areRatesStale(cached)) {
    return cached;
  }

  return fetchMarketRates();
}
