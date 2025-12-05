/**
 * PMI Rate Tables - Based on Black Box PMI Rates
 * Rates organized by:
 * - Down payment percentage (determines LTV)
 * - Number of borrowers (single vs multi)
 * - FICO score range
 * - PMI type (BPMI monthly, LPMI, Single Premium Paid in Full, Single Premium Financed)
 */

import type { CreditScoreRange, BorrowerCount, PMIOption } from '../types';

type FicoRange = '620-639' | '640-659' | '660-679' | '680-699' | '700-719' | '720-739' | '740-759' | '760-779' | '780-799' | '800-850';

interface PMIRateSet {
  bpmi: number;
  lpmi: number | null;
  singlePIF: number;
  singleFin: number;
}

type PMIRateTable = Record<FicoRange, PMIRateSet>;

// 30 Year Term - Standard PMI Rates

// 3% Down (97% LTV) - Single Borrower
const rates3DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0186, lpmi: null, singlePIF: 0.0655, singleFin: 0.0521 },
  '640-659': { bpmi: 0.0165, lpmi: null, singlePIF: 0.0598, singleFin: 0.0493 },
  '660-679': { bpmi: 0.0146, lpmi: null, singlePIF: 0.0552, singleFin: 0.0465 },
  '680-699': { bpmi: 0.0100, lpmi: null, singlePIF: 0.0411, singleFin: 0.0368 },
  '700-719': { bpmi: 0.0082, lpmi: null, singlePIF: 0.0331, singleFin: 0.0318 },
  '720-739': { bpmi: 0.0073, lpmi: null, singlePIF: 0.0277, singleFin: 0.0275 },
  '740-759': { bpmi: 0.0059, lpmi: null, singlePIF: 0.0217, singleFin: 0.0219 },
  '760-779': { bpmi: 0.0045, lpmi: 0.00625, singlePIF: 0.0151, singleFin: 0.0158 },
  '780-799': { bpmi: 0.0045, lpmi: 0.0055, singlePIF: 0.0133, singleFin: 0.0158 },
  '800-850': { bpmi: 0.0043, lpmi: 0.0055, singlePIF: 0.0131, singleFin: 0.0158 },
};

// 3% Down (97% LTV) - Multi Borrower
const rates3DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0168, lpmi: null, singlePIF: 0.0628, singleFin: 0.0521 },
  '640-659': { bpmi: 0.0147, lpmi: null, singlePIF: 0.0575, singleFin: 0.0470 },
  '660-679': { bpmi: 0.0130, lpmi: null, singlePIF: 0.0530, singleFin: 0.0443 },
  '680-699': { bpmi: 0.0089, lpmi: null, singlePIF: 0.0390, singleFin: 0.0347 },
  '700-719': { bpmi: 0.0073, lpmi: null, singlePIF: 0.0311, singleFin: 0.0298 },
  '720-739': { bpmi: 0.0065, lpmi: null, singlePIF: 0.0257, singleFin: 0.0255 },
  '740-759': { bpmi: 0.0051, lpmi: null, singlePIF: 0.0197, singleFin: 0.0199 },
  '760-779': { bpmi: 0.0038, lpmi: 0.0055, singlePIF: 0.0133, singleFin: 0.0140 },
  '780-799': { bpmi: 0.0038, lpmi: 0.0035, singlePIF: 0.0115, singleFin: 0.0140 },
  '800-850': { bpmi: 0.0038, lpmi: 0.0035, singlePIF: 0.0113, singleFin: 0.0140 },
};

// 5% Down (95% LTV) - Single Borrower
const rates5DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0142, lpmi: null, singlePIF: 0.0508, singleFin: 0.0444 },
  '640-659': { bpmi: 0.0131, lpmi: null, singlePIF: 0.0458, singleFin: 0.0391 },
  '660-679': { bpmi: 0.0116, lpmi: null, singlePIF: 0.0421, singleFin: 0.0369 },
  '680-699': { bpmi: 0.0074, lpmi: null, singlePIF: 0.0318, singleFin: 0.0292 },
  '700-719': { bpmi: 0.0059, lpmi: null, singlePIF: 0.0257, singleFin: 0.0252 },
  '720-739': { bpmi: 0.0050, lpmi: null, singlePIF: 0.0217, singleFin: 0.0216 },
  '740-759': { bpmi: 0.0042, lpmi: 0.00875, singlePIF: 0.0174, singleFin: 0.0173 },
  '760-779': { bpmi: 0.0031, lpmi: 0.0055, singlePIF: 0.0124, singleFin: 0.0122 },
  '780-799': { bpmi: 0.0031, lpmi: 0.0035, singlePIF: 0.0103, singleFin: 0.0122 },
  '800-850': { bpmi: 0.0029, lpmi: 0.0035, singlePIF: 0.0096, singleFin: 0.0122 },
};

// 5% Down (95% LTV) - Multi Borrower
const rates5DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0125, lpmi: null, singlePIF: 0.0483, singleFin: 0.0444 },
  '640-659': { bpmi: 0.0112, lpmi: null, singlePIF: 0.0439, singleFin: 0.0372 },
  '660-679': { bpmi: 0.0102, lpmi: null, singlePIF: 0.0404, singleFin: 0.0352 },
  '680-699': { bpmi: 0.0064, lpmi: null, singlePIF: 0.0302, singleFin: 0.0276 },
  '700-719': { bpmi: 0.0052, lpmi: null, singlePIF: 0.0257, singleFin: 0.0236 },
  '720-739': { bpmi: 0.0043, lpmi: null, singlePIF: 0.0203, singleFin: 0.0202 },
  '740-759': { bpmi: 0.0035, lpmi: 0.00625, singlePIF: 0.0160, singleFin: 0.0159 },
  '760-779': { bpmi: 0.0024, lpmi: 0.0035, singlePIF: 0.0110, singleFin: 0.0108 },
  '780-799': { bpmi: 0.0024, lpmi: 0.0030, singlePIF: 0.0089, singleFin: 0.0108 },
  '800-850': { bpmi: 0.0024, lpmi: 0.0030, singlePIF: 0.0082, singleFin: 0.0108 },
};

// 10% Down (90% LTV) - Single Borrower
const rates10DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0085, lpmi: null, singlePIF: 0.0384, singleFin: 0.0281 },
  '640-659': { bpmi: 0.0085, lpmi: null, singlePIF: 0.0351, singleFin: 0.0265 },
  '660-679': { bpmi: 0.0077, lpmi: null, singlePIF: 0.0328, singleFin: 0.0250 },
  '680-699': { bpmi: 0.0055, lpmi: null, singlePIF: 0.0217, singleFin: 0.0199 },
  '700-719': { bpmi: 0.0043, lpmi: null, singlePIF: 0.0197, singleFin: 0.0175 },
  '720-739': { bpmi: 0.0036, lpmi: 0.00625, singlePIF: 0.0160, singleFin: 0.0148 },
  '740-759': { bpmi: 0.0028, lpmi: 0.0055, singlePIF: 0.0134, singleFin: 0.0116 },
  '760-779': { bpmi: 0.0020, lpmi: 0.0035, singlePIF: 0.0094, singleFin: 0.0087 },
  '780-799': { bpmi: 0.0020, lpmi: 0.0025, singlePIF: 0.0083, singleFin: 0.0087 },
  '800-850': { bpmi: 0.0020, lpmi: 0.0020, singlePIF: 0.0079, singleFin: 0.0087 },
};

// 10% Down (90% LTV) - Multi Borrower
const rates10DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0070, lpmi: null, singlePIF: 0.0369, singleFin: 0.0281 },
  '640-659': { bpmi: 0.0071, lpmi: null, singlePIF: 0.0339, singleFin: 0.0253 },
  '660-679': { bpmi: 0.0066, lpmi: null, singlePIF: 0.0320, singleFin: 0.0239 },
  '680-699': { bpmi: 0.0045, lpmi: null, singlePIF: 0.0217, singleFin: 0.0188 },
  '700-719': { bpmi: 0.0036, lpmi: null, singlePIF: 0.0187, singleFin: 0.0165 },
  '720-739': { bpmi: 0.0030, lpmi: 0.00625, singlePIF: 0.0154, singleFin: 0.0138 },
  '740-759': { bpmi: 0.0024, lpmi: 0.0055, singlePIF: 0.0124, singleFin: 0.0106 },
  '760-779': { bpmi: 0.0018, lpmi: 0.0030, singlePIF: 0.0084, singleFin: 0.0077 },
  '780-799': { bpmi: 0.0018, lpmi: 0.0020, singlePIF: 0.0073, singleFin: 0.0077 },
  '800-850': { bpmi: 0.0016, lpmi: 0.0020, singlePIF: 0.0069, singleFin: 0.0077 },
};

// 15% Down (85% LTV) - Single Borrower
const rates15DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0044, lpmi: 0.00625, singlePIF: 0.0143, singleFin: 0.0127 },
  '640-659': { bpmi: 0.0038, lpmi: 0.0055, singlePIF: 0.0134, singleFin: 0.0106 },
  '660-679': { bpmi: 0.0031, lpmi: 0.0055, singlePIF: 0.0121, singleFin: 0.0100 },
  '680-699': { bpmi: 0.0022, lpmi: 0.0035, singlePIF: 0.0090, singleFin: 0.0085 },
  '700-719': { bpmi: 0.0020, lpmi: 0.0020, singlePIF: 0.0077, singleFin: 0.0071 },
  '720-739': { bpmi: 0.0018, lpmi: 0.0020, singlePIF: 0.0067, singleFin: 0.0064 },
  '740-759': { bpmi: 0.0016, lpmi: 0.0020, singlePIF: 0.0057, singleFin: 0.0054 },
  '760-779': { bpmi: 0.0014, lpmi: 0.00125, singlePIF: 0.0047, singleFin: 0.0047 },
  '780-799': { bpmi: 0.0014, lpmi: 0.00125, singlePIF: 0.0047, singleFin: 0.0047 },
  '800-850': { bpmi: 0.0014, lpmi: 0.00125, singlePIF: 0.0047, singleFin: 0.0047 },
};

// 15% Down (85% LTV) - Multi Borrower
const rates15DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0039, lpmi: 0.00625, singlePIF: 0.0139, singleFin: 0.0123 },
  '640-659': { bpmi: 0.0033, lpmi: 0.00625, singlePIF: 0.0130, singleFin: 0.0102 },
  '660-679': { bpmi: 0.0025, lpmi: 0.0055, singlePIF: 0.0117, singleFin: 0.0096 },
  '680-699': { bpmi: 0.0018, lpmi: 0.0025, singlePIF: 0.0086, singleFin: 0.0081 },
  '700-719': { bpmi: 0.0016, lpmi: 0.0020, singlePIF: 0.0074, singleFin: 0.0068 },
  '720-739': { bpmi: 0.0016, lpmi: 0.0020, singlePIF: 0.0064, singleFin: 0.0061 },
  '740-759': { bpmi: 0.0012, lpmi: 0.00125, singlePIF: 0.0054, singleFin: 0.0051 },
  '760-779': { bpmi: 0.0012, lpmi: 0.00125, singlePIF: 0.0044, singleFin: 0.0044 },
  '780-799': { bpmi: 0.0012, lpmi: 0.00125, singlePIF: 0.0044, singleFin: 0.0044 },
  '800-850': { bpmi: 0.0012, lpmi: 0.00125, singlePIF: 0.0044, singleFin: 0.0044 },
};

// HomePossible/HomeReady rates (for first-time home buyers)
// These have slightly different rates - using the same structure

// 3% Down - HomePossible Single
const ratesHP3DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0150, lpmi: null, singlePIF: 0.0498, singleFin: 0.0412 },
  '640-659': { bpmi: 0.0131, lpmi: null, singlePIF: 0.0451, singleFin: 0.0410 },
  '660-679': { bpmi: 0.0117, lpmi: null, singlePIF: 0.0411, singleFin: 0.0386 },
  '680-699': { bpmi: 0.0082, lpmi: null, singlePIF: 0.0307, singleFin: 0.0306 },
  '700-719': { bpmi: 0.0071, lpmi: null, singlePIF: 0.0247, singleFin: 0.0265 },
  '720-739': { bpmi: 0.0061, lpmi: null, singlePIF: 0.0210, singleFin: 0.0231 },
  '740-759': { bpmi: 0.0052, lpmi: 0.00875, singlePIF: 0.0167, singleFin: 0.0188 },
  '760-779': { bpmi: 0.0041, lpmi: 0.0055, singlePIF: 0.0117, singleFin: 0.0136 },
  '780-799': { bpmi: 0.0041, lpmi: 0.0055, singlePIF: 0.0111, singleFin: 0.0136 },
  '800-850': { bpmi: 0.0039, lpmi: 0.0035, singlePIF: 0.0108, singleFin: 0.0136 },
};

// 3% Down - HomePossible Multi
const ratesHP3DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0132, lpmi: null, singlePIF: 0.0471, singleFin: 0.0412 },
  '640-659': { bpmi: 0.0113, lpmi: null, singlePIF: 0.0428, singleFin: 0.0387 },
  '660-679': { bpmi: 0.0101, lpmi: null, singlePIF: 0.0389, singleFin: 0.0364 },
  '680-699': { bpmi: 0.0071, lpmi: null, singlePIF: 0.0286, singleFin: 0.0285 },
  '700-719': { bpmi: 0.0062, lpmi: null, singlePIF: 0.0227, singleFin: 0.0245 },
  '720-739': { bpmi: 0.0051, lpmi: null, singlePIF: 0.0190, singleFin: 0.0211 },
  '740-759': { bpmi: 0.0043, lpmi: 0.00625, singlePIF: 0.0147, singleFin: 0.0168 },
  '760-779': { bpmi: 0.0027, lpmi: 0.0035, singlePIF: 0.0099, singleFin: 0.0118 },
  '780-799': { bpmi: 0.0027, lpmi: 0.0035, singlePIF: 0.0093, singleFin: 0.0118 },
  '800-850': { bpmi: 0.0027, lpmi: 0.0030, singlePIF: 0.0090, singleFin: 0.0118 },
};

// 5% Down - HomePossible Single
const ratesHP5DownSingle: PMIRateTable = {
  '620-639': { bpmi: 0.0125, lpmi: null, singlePIF: 0.0434, singleFin: 0.0400 },
  '640-659': { bpmi: 0.0114, lpmi: null, singlePIF: 0.0394, singleFin: 0.0374 },
  '660-679': { bpmi: 0.0099, lpmi: null, singlePIF: 0.0361, singleFin: 0.0352 },
  '680-699': { bpmi: 0.0073, lpmi: null, singlePIF: 0.0274, singleFin: 0.0279 },
  '700-719': { bpmi: 0.0058, lpmi: null, singlePIF: 0.0221, singleFin: 0.0241 },
  '720-739': { bpmi: 0.0050, lpmi: null, singlePIF: 0.0188, singleFin: 0.0207 },
  '740-759': { bpmi: 0.0042, lpmi: 0.00875, singlePIF: 0.0150, singleFin: 0.0168 },
  '760-779': { bpmi: 0.0031, lpmi: 0.0055, singlePIF: 0.0107, singleFin: 0.0122 },
  '780-799': { bpmi: 0.0031, lpmi: 0.0035, singlePIF: 0.0101, singleFin: 0.0122 },
  '800-850': { bpmi: 0.0029, lpmi: 0.0035, singlePIF: 0.0094, singleFin: 0.0122 },
};

// 5% Down - HomePossible Multi
const ratesHP5DownMulti: PMIRateTable = {
  '620-639': { bpmi: 0.0109, lpmi: null, singlePIF: 0.0409, singleFin: 0.0400 },
  '640-659': { bpmi: 0.0095, lpmi: null, singlePIF: 0.0375, singleFin: 0.0355 },
  '660-679': { bpmi: 0.0085, lpmi: null, singlePIF: 0.0344, singleFin: 0.0335 },
  '680-699': { bpmi: 0.0061, lpmi: null, singlePIF: 0.0258, singleFin: 0.0263 },
  '700-719': { bpmi: 0.0050, lpmi: null, singlePIF: 0.0207, singleFin: 0.0225 },
  '720-739': { bpmi: 0.0043, lpmi: null, singlePIF: 0.0176, singleFin: 0.0193 },
  '740-759': { bpmi: 0.0035, lpmi: 0.00625, singlePIF: 0.0138, singleFin: 0.0154 },
  '760-779': { bpmi: 0.0024, lpmi: 0.0035, singlePIF: 0.0096, singleFin: 0.0108 },
  '780-799': { bpmi: 0.0024, lpmi: 0.0030, singlePIF: 0.0089, singleFin: 0.0108 },
  '800-850': { bpmi: 0.0024, lpmi: 0.0030, singlePIF: 0.0082, singleFin: 0.0108 },
};

// Map CreditScoreRange to FicoRange used in tables
function mapCreditScoreToFico(creditScore: CreditScoreRange): FicoRange {
  switch (creditScore) {
    case '760+':
      return '760-779'; // Use conservative rate for 760+
    case '740-759':
      return '740-759';
    case '720-739':
      return '720-739';
    case '700-719':
      return '700-719';
    case '680-699':
      return '680-699';
    case '660-679':
      return '660-679';
    case '640-659':
      return '640-659';
    case '620-639':
      return '620-639';
    case '<620':
      return '620-639'; // Use highest rate for below 620
    default:
      return '720-739';
  }
}

// Determine down payment bracket
function getDownPaymentBracket(downPaymentPercent: number): '3' | '5' | '10' | '15' | '20+' {
  if (downPaymentPercent >= 20) return '20+';
  if (downPaymentPercent >= 15) return '15';
  if (downPaymentPercent >= 10) return '10';
  if (downPaymentPercent >= 5) return '5';
  return '3';
}

// Get appropriate rate table
function getRateTable(
  downPaymentBracket: '3' | '5' | '10' | '15',
  borrowerCount: BorrowerCount,
  isFirstTimeHomeBuyer: boolean
): PMIRateTable {
  if (isFirstTimeHomeBuyer) {
    // HomePossible/HomeReady rates
    if (downPaymentBracket === '3') {
      return borrowerCount === 'single' ? ratesHP3DownSingle : ratesHP3DownMulti;
    }
    if (downPaymentBracket === '5') {
      return borrowerCount === 'single' ? ratesHP5DownSingle : ratesHP5DownMulti;
    }
    // 10% and 15% use standard rates even for first-time buyers
  }

  // Standard rates
  switch (downPaymentBracket) {
    case '3':
      return borrowerCount === 'single' ? rates3DownSingle : rates3DownMulti;
    case '5':
      return borrowerCount === 'single' ? rates5DownSingle : rates5DownMulti;
    case '10':
      return borrowerCount === 'single' ? rates10DownSingle : rates10DownMulti;
    case '15':
      return borrowerCount === 'single' ? rates15DownSingle : rates15DownMulti;
    default:
      return rates10DownSingle;
  }
}

export interface PMIResult {
  monthlyPremium: number;
  upfrontPremium: number;
  additionalLoanAmount: number; // For single premium financed
  effectiveRate: number; // The rate being used
  pmiType: PMIOption;
  availableOptions: PMIOption[];
}

/**
 * Calculate PMI based on loan parameters and selected PMI option
 */
export function calculatePMI(
  loanAmount: number,
  homePrice: number,
  creditScore: CreditScoreRange,
  borrowerCount: BorrowerCount,
  firstTimeHomeBuyer: boolean,
  selectedPmiOption: PMIOption
): PMIResult {
  const ltv = (loanAmount / homePrice) * 100;
  const downPaymentPercent = 100 - ltv;

  // No PMI needed for 20%+ down
  if (downPaymentPercent >= 20) {
    return {
      monthlyPremium: 0,
      upfrontPremium: 0,
      additionalLoanAmount: 0,
      effectiveRate: 0,
      pmiType: 'none',
      availableOptions: ['none'],
    };
  }

  const downBracket = getDownPaymentBracket(downPaymentPercent);
  if (downBracket === '20+') {
    return {
      monthlyPremium: 0,
      upfrontPremium: 0,
      additionalLoanAmount: 0,
      effectiveRate: 0,
      pmiType: 'none',
      availableOptions: ['none'],
    };
  }

  const rateTable = getRateTable(downBracket, borrowerCount, firstTimeHomeBuyer);
  const ficoRange = mapCreditScoreToFico(creditScore);
  const rates = rateTable[ficoRange];

  // Determine available options
  const availableOptions: PMIOption[] = ['bpmi'];
  if (rates.lpmi !== null) availableOptions.push('lpmi');
  availableOptions.push('singlePIF', 'singleFin');

  // Use selected option or default to BPMI
  let pmiType = selectedPmiOption;
  if (pmiType === 'none' || !availableOptions.includes(pmiType)) {
    pmiType = 'bpmi';
  }

  let monthlyPremium = 0;
  let upfrontPremium = 0;
  let additionalLoanAmount = 0;
  let effectiveRate = 0;

  switch (pmiType) {
    case 'bpmi':
      effectiveRate = rates.bpmi;
      monthlyPremium = (loanAmount * effectiveRate) / 12;
      break;
    case 'lpmi':
      effectiveRate = rates.lpmi || 0;
      // LPMI is paid via higher interest rate, no monthly premium
      monthlyPremium = 0;
      break;
    case 'singlePIF':
      effectiveRate = rates.singlePIF;
      upfrontPremium = loanAmount * effectiveRate;
      break;
    case 'singleFin':
      effectiveRate = rates.singleFin;
      additionalLoanAmount = loanAmount * effectiveRate;
      break;
  }

  return {
    monthlyPremium,
    upfrontPremium,
    additionalLoanAmount,
    effectiveRate,
    pmiType,
    availableOptions,
  };
}

/**
 * Get LPMI rate adjustment for lender-paid PMI
 * This rate is added to the base interest rate
 */
export function getLPMIRateAdjustment(
  homePrice: number,
  loanAmount: number,
  creditScore: CreditScoreRange,
  borrowerCount: BorrowerCount,
  firstTimeHomeBuyer: boolean
): number {
  const ltv = (loanAmount / homePrice) * 100;
  const downPaymentPercent = 100 - ltv;

  if (downPaymentPercent >= 20) return 0;

  const downBracket = getDownPaymentBracket(downPaymentPercent);
  if (downBracket === '20+') return 0;

  const rateTable = getRateTable(downBracket, borrowerCount, firstTimeHomeBuyer);
  const ficoRange = mapCreditScoreToFico(creditScore);
  const rates = rateTable[ficoRange];

  // Convert LPMI rate to interest rate adjustment (approximate)
  // LPMI rates are typically expressed as a rate to add to base rate
  return rates.lpmi ? rates.lpmi * 100 : 0; // Return as percentage points
}
