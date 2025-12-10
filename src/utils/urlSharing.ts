import type { LoanInputs, LoanType, BorrowerCount, PMIOption } from '../types';

/**
 * Expiration options for shared links
 */
export type ExpirationOption = '24h' | '7d' | '30d' | 'never';

/**
 * Get expiration timestamp based on option
 */
export function getExpirationTimestamp(option: ExpirationOption): number | null {
  const now = Date.now();
  switch (option) {
    case '24h':
      return now + 24 * 60 * 60 * 1000; // 24 hours
    case '7d':
      return now + 7 * 24 * 60 * 60 * 1000; // 7 days
    case '30d':
      return now + 30 * 24 * 60 * 60 * 1000; // 30 days
    case 'never':
    default:
      return null;
  }
}

/**
 * Check if a link has expired
 */
export function isLinkExpired(expirationTimestamp: number | null | undefined): boolean {
  if (!expirationTimestamp) return false; // No expiration = never expires
  return Date.now() > expirationTimestamp;
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Data structure for sharing via URL (minimal data needed to reconstruct scenario)
 */
interface ShareableData {
  hp: number;      // homePrice
  dp: number;      // downPayment
  cs: string;      // creditScore
  at: number;      // annualTaxes
  ai: number;      // annualInsurance
  hoa: number;     // monthlyHOA
  lt: string[];    // selectedLoanTypes
  ir: Record<string, number>; // interestRates
  cn?: string;     // clientName (optional)
  vid?: string;    // vimeoId (optional)
  tid?: string;    // trackingId (optional)
  bc?: string;     // borrowerCount (optional, default 'single')
  fthb?: boolean;  // firstTimeHomeBuyer (optional, default false)
  pmi?: string;    // pmiOption (optional, default 'bpmi')
  exp?: number;    // expirationTimestamp (optional)
}

/**
 * Encode scenario data to a URL-safe string
 */
export function encodeScenario(
  inputs: LoanInputs,
  selectedLoanTypes: LoanType[],
  clientName?: string,
  vimeoId?: string,
  trackingId?: string,
  expirationTimestamp?: number | null
): string {
  const data: ShareableData = {
    hp: inputs.homePrice,
    dp: inputs.downPayment,
    cs: inputs.creditScore,
    at: inputs.annualTaxes,
    ai: inputs.annualInsurance,
    hoa: inputs.monthlyHOA,
    lt: selectedLoanTypes,
    ir: inputs.interestRates,
    bc: inputs.borrowerCount,
    fthb: inputs.firstTimeHomeBuyer,
    pmi: inputs.pmiOption,
  };

  if (clientName) {
    data.cn = clientName;
  }

  if (vimeoId) {
    data.vid = vimeoId;
  }

  if (trackingId) {
    data.tid = trackingId;
  }

  if (expirationTimestamp) {
    data.exp = expirationTimestamp;
  }

  const jsonString = JSON.stringify(data);
  const base64 = btoa(encodeURIComponent(jsonString));
  return base64;
}

/**
 * Decode URL string back to scenario data
 */
export function decodeScenario(encoded: string): {
  inputs: LoanInputs;
  selectedLoanTypes: LoanType[];
  clientName?: string;
  vimeoId?: string;
  trackingId?: string;
  expirationTimestamp?: number;
} | null {
  try {
    const jsonString = decodeURIComponent(atob(encoded));
    const data: ShareableData = JSON.parse(jsonString);

    const inputs: LoanInputs = {
      homePrice: data.hp,
      downPayment: data.dp,
      creditScore: data.cs as LoanInputs['creditScore'],
      annualTaxes: data.at,
      annualInsurance: data.ai,
      monthlyHOA: data.hoa,
      interestRates: data.ir as Record<LoanType, number>,
      // New fields with defaults for backward compatibility
      borrowerCount: (data.bc as BorrowerCount) || 'single',
      firstTimeHomeBuyer: data.fthb ?? false,
      pmiOption: (data.pmi as PMIOption) || 'bpmi',
    };

    return {
      inputs,
      selectedLoanTypes: data.lt as LoanType[],
      clientName: data.cn,
      vimeoId: data.vid,
      trackingId: data.tid,
      expirationTimestamp: data.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL for the current scenario
 */
export function generateShareableUrl(
  inputs: LoanInputs,
  selectedLoanTypes: LoanType[],
  clientName?: string,
  vimeoId?: string,
  trackingId?: string,
  expirationTimestamp?: number | null
): string {
  const encoded = encodeScenario(inputs, selectedLoanTypes, clientName, vimeoId, trackingId, expirationTimestamp);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?s=${encoded}`;
}

/**
 * Check if current URL has shared scenario data
 */
export function getSharedScenarioFromUrl(): ReturnType<typeof decodeScenario> {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('s');

  if (!encoded) return null;

  return decodeScenario(encoded);
}

/**
 * Clear the shared scenario from URL (without reloading)
 */
export function clearSharedScenarioFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  window.history.replaceState({}, '', url.toString());
}
