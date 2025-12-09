export type LoanType = 'conventional30' | 'conventional15' | 'fha30' | 'va30' | 'usda30' | 'arm51' | 'arm71' | 'arm101';

export type CreditScoreRange =
  | '760+'
  | '740-759'
  | '720-739'
  | '700-719'
  | '680-699'
  | '660-679'
  | '640-659'
  | '620-639'
  | '<620';

export type BorrowerCount = 'single' | 'multi';

export type PMIOption = 'bpmi' | 'lpmi' | 'singlePIF' | 'singleFin' | 'none';

export const PMI_OPTION_INFO: Record<PMIOption, { name: string; description: string }> = {
  bpmi: { name: 'Monthly PMI', description: 'Borrower-paid monthly PMI added to payment' },
  lpmi: { name: 'Lender-Paid PMI', description: 'Higher rate, no monthly PMI' },
  singlePIF: { name: 'Single Premium (Paid)', description: 'One-time upfront PMI payment' },
  singleFin: { name: 'Single Premium (Financed)', description: 'PMI added to loan amount' },
  none: { name: 'No PMI', description: '20%+ down payment, no PMI required' },
};

// ARM Configuration
export interface ARMConfig {
  initialPeriodYears: number; // 5, 7, or 10 for 5/1, 7/1, 10/1 ARMs
  adjustmentPeriodMonths: number; // Typically 12 (annual adjustments)
  margin: number; // Added to index to get new rate (typically 2.75%)
  initialCap: number; // Max first adjustment (typically 2%)
  periodicCap: number; // Max each subsequent adjustment (typically 2%)
  lifetimeCap: number; // Max total rate increase (typically 5%)
  floor: number; // Minimum rate (typically initial rate)
  expectedIndexRate: number; // Projected SOFR/index rate for future adjustments
}

export interface LoanInputs {
  homePrice: number;
  downPayment: number;
  creditScore: CreditScoreRange;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHOA: number;
  interestRates: Record<LoanType, number>;
  borrowerCount: BorrowerCount;
  firstTimeHomeBuyer: boolean;
  pmiOption: PMIOption;
  closingDate?: string; // For prepaid interest calculation
  // APR Adjustments
  discountPoints?: Record<LoanType, number>; // Points paid to lower rate (each point = 1% of loan)
  lenderCredits?: Record<LoanType, number>; // Credits from lender (reduces closing costs)
  // AI Recommendation fields
  timeHorizon?: number; // Years planning to stay in home
  monthlyIncome?: number; // Gross monthly income for DTI
  monthlyDebts?: number; // Other monthly debt payments
  isVeteran?: boolean; // Eligible for VA loan
  isRural?: boolean; // Eligible for USDA loan
  // ARM-specific fields
  armConfig?: ARMConfig;
}

export type TimeHorizonOption = 3 | 5 | 7 | 10 | 15 | 30;

export const TIME_HORIZON_OPTIONS: { value: TimeHorizonOption; label: string }[] = [
  { value: 3, label: '1-3 years' },
  { value: 5, label: '4-5 years' },
  { value: 7, label: '6-7 years' },
  { value: 10, label: '8-10 years' },
  { value: 15, label: '10-15 years' },
  { value: 30, label: '15+ years (forever home)' },
];

export interface LoanCalculation {
  loanType: LoanType;
  loanAmount: number;
  interestRate: number;
  apr: number; // Annual Percentage Rate (includes fees)
  termMonths: number;
  monthlyPI: number;
  monthlyMI: number; // PMI, MIP, or funding fee amortized
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthly: number;
  upfrontFees: number;
  cashToClose: number;
  totalCost: number; // Total cost over life of loan
  // ARM-specific fields
  isARM?: boolean;
  armDetails?: {
    initialRate: number;
    initialPeriodYears: number;
    maxRate: number;
    estimatedRateAfterAdjustment: number;
    estimatedPaymentAfterAdjustment: number;
    worstCasePayment: number; // Payment at lifetime cap
  };
}

export interface VideoMessage {
  vimeoId?: string;
  recordedVideoUrl?: string; // Blob URL for locally recorded video
  thumbnailUrl?: string;
}

export interface LoanScenario {
  id: string;
  name: string;
  clientName?: string;
  trackingId?: string; // For view tracking when shared
  createdAt: string;
  updatedAt: string;
  inputs: LoanInputs;
  selectedLoanTypes: LoanType[];
  calculations: LoanCalculation[];
  emailTracking: EmailTracking;
  videoMessage?: VideoMessage;
}

export interface EmailTracking {
  sent: number;
  opened: number;
  lastSentAt?: string;
  lastOpenedAt?: string;
}

export const LOAN_TYPE_INFO: Record<LoanType, { name: string; shortName: string; color: string; bgColor: string; termYears: number; isARM?: boolean; initialPeriodYears?: number }> = {
  conventional30: {
    name: 'Conventional 30-Year',
    shortName: 'Conv 30yr',
    color: '#0d173c',
    bgColor: '#0d173c',
    termYears: 30,
  },
  conventional15: {
    name: 'Conventional 15-Year',
    shortName: 'Conv 15yr',
    color: '#96daf8',
    bgColor: '#96daf8',
    termYears: 15,
  },
  fha30: {
    name: 'FHA 30-Year',
    shortName: 'FHA 30yr',
    color: '#ce92c1',
    bgColor: '#ce92c1',
    termYears: 30,
  },
  va30: {
    name: 'VA 30-Year',
    shortName: 'VA 30yr',
    color: '#967db9',
    bgColor: '#967db9',
    termYears: 30,
  },
  usda30: {
    name: 'USDA 30-Year',
    shortName: 'USDA 30yr',
    color: '#ffd159',
    bgColor: '#ffd159',
    termYears: 30,
  },
  arm51: {
    name: '5/1 ARM',
    shortName: '5/1 ARM',
    color: '#4ade80', // Green
    bgColor: '#4ade80',
    termYears: 30,
    isARM: true,
    initialPeriodYears: 5,
  },
  arm71: {
    name: '7/1 ARM',
    shortName: '7/1 ARM',
    color: '#22d3d1', // Teal
    bgColor: '#22d3d1',
    termYears: 30,
    isARM: true,
    initialPeriodYears: 7,
  },
  arm101: {
    name: '10/1 ARM',
    shortName: '10/1 ARM',
    color: '#f97316', // Orange
    bgColor: '#f97316',
    termYears: 30,
    isARM: true,
    initialPeriodYears: 10,
  },
};

export const CREDIT_SCORE_OPTIONS: { value: CreditScoreRange; label: string }[] = [
  { value: '760+', label: '760+ (Excellent)' },
  { value: '740-759', label: '740-759 (Very Good)' },
  { value: '720-739', label: '720-739 (Very Good)' },
  { value: '700-719', label: '700-719 (Good)' },
  { value: '680-699', label: '680-699 (Good)' },
  { value: '660-679', label: '660-679 (Fair)' },
  { value: '640-659', label: '640-659 (Fair)' },
  { value: '620-639', label: '620-639 (Poor)' },
  { value: '<620', label: 'Below 620 (Poor)' },
];

export const DEFAULT_INTEREST_RATES: Record<LoanType, number> = {
  conventional30: 6.875,
  conventional15: 6.25,
  fha30: 6.5,
  va30: 6.375,
  usda30: 6.5,
  arm51: 5.875, // ARMs typically have lower initial rates
  arm71: 6.125,
  arm101: 6.375,
};

// Default ARM configuration
export const DEFAULT_ARM_CONFIG: Record<'arm51' | 'arm71' | 'arm101', { margin: number; initialCap: number; periodicCap: number; lifetimeCap: number }> = {
  arm51: {
    margin: 2.75,
    initialCap: 2,
    periodicCap: 2,
    lifetimeCap: 5,
  },
  arm71: {
    margin: 2.75,
    initialCap: 5, // 7/1 ARMs often have 5/2/5 caps
    periodicCap: 2,
    lifetimeCap: 5,
  },
  arm101: {
    margin: 2.75,
    initialCap: 5,
    periodicCap: 2,
    lifetimeCap: 5,
  },
};

// Current SOFR index rate (updated periodically)
export const CURRENT_SOFR_RATE = 4.5; // As of late 2024
