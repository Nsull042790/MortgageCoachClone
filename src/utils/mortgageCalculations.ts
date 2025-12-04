import type { LoanType, LoanInputs, LoanCalculation, CreditScoreRange } from '../types';
import { LOAN_TYPE_INFO } from '../types';

/**
 * Calculate monthly Principal & Interest payment
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPI(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;

  const monthlyRate = annualRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Get PMI rate based on LTV and credit score
 * PMI is required when LTV > 80% for conventional loans
 */
export function getPMIRate(ltv: number, creditScore: CreditScoreRange): number {
  if (ltv <= 80) return 0;

  // PMI rates vary by LTV and credit score (annual rate as percentage)
  const pmiRates: Record<string, Record<string, number>> = {
    '760+': { '80-85': 0.30, '85-90': 0.38, '90-95': 0.52, '95+': 0.78 },
    '740-759': { '80-85': 0.35, '85-90': 0.44, '90-95': 0.58, '95+': 0.85 },
    '720-739': { '80-85': 0.40, '85-90': 0.50, '90-95': 0.65, '95+': 0.92 },
    '700-719': { '80-85': 0.50, '85-90': 0.60, '90-95': 0.78, '95+': 1.05 },
    '680-699': { '80-85': 0.60, '85-90': 0.75, '90-95': 0.95, '95+': 1.25 },
    '660-679': { '80-85': 0.75, '85-90': 0.95, '90-95': 1.15, '95+': 1.45 },
    '640-659': { '80-85': 0.90, '85-90': 1.10, '90-95': 1.35, '95+': 1.65 },
    '620-639': { '80-85': 1.05, '85-90': 1.25, '90-95': 1.50, '95+': 1.85 },
    '<620': { '80-85': 1.20, '85-90': 1.45, '90-95': 1.75, '95+': 2.10 },
  };

  let ltvBracket: string;
  if (ltv <= 85) ltvBracket = '80-85';
  else if (ltv <= 90) ltvBracket = '85-90';
  else if (ltv <= 95) ltvBracket = '90-95';
  else ltvBracket = '95+';

  return pmiRates[creditScore]?.[ltvBracket] ?? 0.8;
}

/**
 * Calculate FHA MIP (Mortgage Insurance Premium)
 * - Upfront MIP: 1.75% of loan amount
 * - Annual MIP: Based on loan term and LTV
 */
export function getFHAMIP(loanAmount: number, ltv: number, termYears: number): { upfront: number; annualRate: number } {
  // Upfront MIP is always 1.75%
  const upfront = loanAmount * 0.0175;

  // Annual MIP rates (as percentage)
  // For loans > 15 years
  let annualRate: number;
  if (termYears > 15) {
    if (loanAmount <= 726200) {
      annualRate = ltv <= 90 ? 0.50 : 0.55;
    } else {
      annualRate = ltv <= 90 ? 0.70 : 0.75;
    }
  } else {
    // For loans <= 15 years
    if (loanAmount <= 726200) {
      annualRate = ltv <= 90 ? 0.15 : 0.40;
    } else {
      annualRate = ltv <= 90 ? 0.15 : 0.65;
    }
  }

  return { upfront, annualRate };
}

/**
 * Calculate VA Funding Fee
 * Based on down payment, first-time use, and type of service
 */
export function getVAFundingFee(
  loanAmount: number,
  downPaymentPercent: number,
  isFirstTimeUse: boolean = true
): number {
  // VA Funding Fee rates (as percentage)
  let rate: number;

  if (downPaymentPercent >= 10) {
    rate = 1.25;
  } else if (downPaymentPercent >= 5) {
    rate = 1.5;
  } else {
    rate = isFirstTimeUse ? 2.15 : 3.3;
  }

  return loanAmount * (rate / 100);
}

/**
 * Calculate USDA fees
 * - Upfront guarantee fee: 1%
 * - Annual fee: 0.35%
 */
export function getUSDAFees(loanAmount: number): { upfront: number; annualRate: number } {
  return {
    upfront: loanAmount * 0.01,
    annualRate: 0.35,
  };
}

/**
 * Calculate APR (Annual Percentage Rate)
 * APR accounts for fees by finding the rate that makes:
 * Net Loan Amount = Present Value of all payments
 * Uses Newton-Raphson method for iteration
 */
export function calculateAPR(
  loanAmount: number,
  monthlyPayment: number,
  termMonths: number,
  upfrontFees: number,
  closingCosts: number
): number {
  // Net amount received by borrower
  const netLoan = loanAmount - upfrontFees - closingCosts;

  if (netLoan <= 0 || monthlyPayment <= 0) return 0;

  // Start with nominal rate as initial guess
  let rate = monthlyPayment * 12 / netLoan * 0.8;

  // Newton-Raphson iteration
  for (let i = 0; i < 100; i++) {
    const monthlyRate = rate / 12;

    // Calculate present value of payments at current rate
    let pv = 0;
    let pvDerivative = 0;

    for (let n = 1; n <= termMonths; n++) {
      const discount = Math.pow(1 + monthlyRate, -n);
      pv += monthlyPayment * discount;
      pvDerivative -= monthlyPayment * n * discount / (1 + monthlyRate) / 12;
    }

    const diff = pv - netLoan;

    // Check convergence
    if (Math.abs(diff) < 0.01) break;

    // Newton-Raphson update
    if (Math.abs(pvDerivative) > 0.0001) {
      rate -= diff / pvDerivative;
    }

    // Keep rate in reasonable bounds
    rate = Math.max(0.001, Math.min(0.5, rate));
  }

  return rate * 100; // Return as percentage
}

/**
 * Calculate full loan details for a specific loan type
 */
export function calculateLoan(inputs: LoanInputs, loanType: LoanType): LoanCalculation {
  const { homePrice, downPayment, creditScore, annualTaxes, annualInsurance, monthlyHOA, interestRates } = inputs;

  const loanAmount = homePrice - downPayment;
  const ltv = (loanAmount / homePrice) * 100;
  const downPaymentPercent = (downPayment / homePrice) * 100;
  const interestRate = interestRates[loanType];
  const termYears = LOAN_TYPE_INFO[loanType].termYears;
  const termMonths = termYears * 12;

  // Calculate P&I
  const monthlyPI = calculateMonthlyPI(loanAmount, interestRate, termMonths);

  // Calculate monthly taxes and insurance
  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;

  // Calculate mortgage insurance and upfront fees based on loan type
  let monthlyMI = 0;
  let upfrontFees = 0;

  switch (loanType) {
    case 'conventional30':
    case 'conventional15': {
      const pmiRate = getPMIRate(ltv, creditScore);
      monthlyMI = (loanAmount * (pmiRate / 100)) / 12;
      break;
    }
    case 'fha30': {
      const fhaMIP = getFHAMIP(loanAmount, ltv, termYears);
      upfrontFees = fhaMIP.upfront;
      monthlyMI = (loanAmount * (fhaMIP.annualRate / 100)) / 12;
      break;
    }
    case 'va30': {
      upfrontFees = getVAFundingFee(loanAmount, downPaymentPercent);
      // VA loans don't have monthly MI
      monthlyMI = 0;
      break;
    }
    case 'usda30': {
      const usdaFees = getUSDAFees(loanAmount);
      upfrontFees = usdaFees.upfront;
      monthlyMI = (loanAmount * (usdaFees.annualRate / 100)) / 12;
      break;
    }
  }

  // Total monthly payment
  const totalMonthly = monthlyPI + monthlyMI + monthlyTaxes + monthlyInsurance + monthlyHOA;

  // Cash to close (down payment + upfront fees + estimated closing costs ~3%)
  const estimatedClosingCosts = loanAmount * 0.03;
  const cashToClose = downPayment + upfrontFees + estimatedClosingCosts;

  // Total cost over life of loan
  const totalPayments = totalMonthly * termMonths;
  const totalCost = totalPayments + downPayment + upfrontFees;

  // Calculate APR (includes P&I and MI in the payment, plus fees)
  const apr = calculateAPR(loanAmount, monthlyPI + monthlyMI, termMonths, upfrontFees, estimatedClosingCosts);

  return {
    loanType,
    loanAmount,
    interestRate,
    apr,
    termMonths,
    monthlyPI,
    monthlyMI,
    monthlyTaxes,
    monthlyInsurance,
    monthlyHOA,
    totalMonthly,
    upfrontFees,
    cashToClose,
    totalCost,
  };
}

/**
 * Calculate all selected loan types
 */
export function calculateAllLoans(inputs: LoanInputs, selectedLoanTypes: LoanType[]): LoanCalculation[] {
  return selectedLoanTypes.map((loanType) => calculateLoan(inputs, loanType));
}

/**
 * Find the loan with lowest monthly payment
 */
export function findLowestMonthlyPayment(calculations: LoanCalculation[]): LoanType | null {
  if (calculations.length === 0) return null;
  const lowest = calculations.reduce((min, calc) => (calc.totalMonthly < min.totalMonthly ? calc : min));
  return lowest.loanType;
}

/**
 * Find the loan with lowest total cost
 */
export function findLowestTotalCost(calculations: LoanCalculation[]): LoanType | null {
  if (calculations.length === 0) return null;
  const lowest = calculations.reduce((min, calc) => (calc.totalCost < min.totalCost ? calc : min));
  return lowest.loanType;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without decimals
 */
export function formatCurrencyWhole(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
