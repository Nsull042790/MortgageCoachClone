export type LoanType = 'conventional30' | 'conventional15' | 'fha30' | 'va30' | 'usda30';

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
}

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

export const LOAN_TYPE_INFO: Record<LoanType, { name: string; shortName: string; color: string; bgColor: string; termYears: number }> = {
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
};
