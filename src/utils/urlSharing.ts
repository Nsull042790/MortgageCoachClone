import type { LoanInputs, LoanType, BorrowerCount, PMIOption } from '../types';

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
}

/**
 * Encode scenario data to a URL-safe string
 */
export function encodeScenario(
  inputs: LoanInputs,
  selectedLoanTypes: LoanType[],
  clientName?: string,
  vimeoId?: string,
  trackingId?: string
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
  trackingId?: string
): string {
  const encoded = encodeScenario(inputs, selectedLoanTypes, clientName, vimeoId, trackingId);
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
