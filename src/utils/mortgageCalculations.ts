import type { LoanType, LoanInputs, LoanCalculation, CreditScoreRange } from '../types';
import { LOAN_TYPE_INFO, DEFAULT_ARM_CONFIG, CURRENT_SOFR_RATE } from '../types';
import { calculatePMI, getLPMIRateAdjustment } from './pmiRates';

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
 * Check if a loan type is an ARM
 */
export function isARMLoan(loanType: LoanType): boolean {
  return loanType === 'arm51' || loanType === 'arm71' || loanType === 'arm101';
}

/**
 * Get ARM configuration for a loan type
 */
export function getARMConfig(loanType: 'arm51' | 'arm71' | 'arm101') {
  const config = DEFAULT_ARM_CONFIG[loanType];
  const initialPeriodYears = LOAN_TYPE_INFO[loanType].initialPeriodYears || 5;

  return {
    ...config,
    initialPeriodYears,
    adjustmentPeriodMonths: 12, // Annual adjustments
    floor: 0, // Minimum rate
    expectedIndexRate: CURRENT_SOFR_RATE,
  };
}

/**
 * Calculate ARM rate after initial period
 * New Rate = Index Rate + Margin, subject to caps
 */
export function calculateARMRateAdjustment(
  currentRate: number,
  initialRate: number,
  indexRate: number,
  margin: number,
  initialCap: number,
  periodicCap: number,
  lifetimeCap: number,
  isFirstAdjustment: boolean
): number {
  const fullyIndexedRate = indexRate + margin;
  const maxRate = initialRate + lifetimeCap;
  const cap = isFirstAdjustment ? initialCap : periodicCap;

  // New rate is fully indexed rate, but capped by adjustment limits
  let newRate = fullyIndexedRate;

  // Apply periodic/initial cap
  if (newRate > currentRate + cap) {
    newRate = currentRate + cap;
  }
  if (newRate < currentRate - cap) {
    newRate = currentRate - cap;
  }

  // Apply lifetime cap
  if (newRate > maxRate) {
    newRate = maxRate;
  }

  // Apply floor (can't go below 0)
  if (newRate < 0) {
    newRate = 0;
  }

  return newRate;
}

/**
 * Calculate estimated total cost for ARM over loan life
 * Uses projected rate adjustments
 */
export function calculateARMTotalCost(
  loanAmount: number,
  initialRate: number,
  initialPeriodYears: number,
  indexRate: number,
  margin: number,
  initialCap: number,
  periodicCap: number,
  lifetimeCap: number,
  termYears: number = 30,
  monthlyTaxes: number = 0,
  monthlyInsurance: number = 0,
  monthlyHOA: number = 0,
  monthlyMI: number = 0
): { totalCost: number; estimatedRateAfterAdjustment: number; estimatedPaymentAfterAdjustment: number; worstCasePayment: number } {
  const termMonths = termYears * 12;
  const initialPeriodMonths = initialPeriodYears * 12;

  let totalCost = 0;
  let balance = loanAmount;
  let currentRate = initialRate;

  // Calculate initial P&I payment
  let monthlyPI = calculateMonthlyPI(balance, currentRate, termMonths);

  // Track for reporting
  let estimatedRateAfterAdjustment = initialRate;
  let estimatedPaymentAfterAdjustment = monthlyPI;

  for (let month = 1; month <= termMonths && balance > 0; month++) {
    // Check if we need to adjust the rate (after initial period)
    if (month > initialPeriodMonths && (month - initialPeriodMonths) % 12 === 1) {
      const isFirstAdjustment = month === initialPeriodMonths + 1;
      currentRate = calculateARMRateAdjustment(
        currentRate,
        initialRate,
        indexRate,
        margin,
        initialCap,
        periodicCap,
        lifetimeCap,
        isFirstAdjustment
      );

      // Recalculate payment with remaining balance and term
      const remainingMonths = termMonths - month + 1;
      monthlyPI = calculateMonthlyPI(balance, currentRate, remainingMonths);

      // Capture first adjustment values
      if (isFirstAdjustment) {
        estimatedRateAfterAdjustment = currentRate;
        estimatedPaymentAfterAdjustment = monthlyPI;
      }
    }

    // Calculate interest and principal for this month
    const monthlyRate = currentRate / 100 / 12;
    const interest = balance * monthlyRate;
    const principal = monthlyPI - interest;
    balance -= principal;

    // Add to total cost
    totalCost += monthlyPI + monthlyTaxes + monthlyInsurance + monthlyHOA + monthlyMI;
  }

  // Calculate worst case payment (at lifetime cap)
  const maxRate = initialRate + lifetimeCap;
  const worstCasePI = calculateMonthlyPI(loanAmount, maxRate, termMonths);
  const worstCasePayment = worstCasePI + monthlyTaxes + monthlyInsurance + monthlyHOA + monthlyMI;

  return {
    totalCost,
    estimatedRateAfterAdjustment,
    estimatedPaymentAfterAdjustment: estimatedPaymentAfterAdjustment + monthlyTaxes + monthlyInsurance + monthlyHOA + monthlyMI,
    worstCasePayment,
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
  const {
    homePrice,
    downPayment,
    creditScore,
    annualTaxes,
    annualInsurance,
    monthlyHOA,
    interestRates,
    borrowerCount = 'single',
    firstTimeHomeBuyer = false,
    pmiOption = 'bpmi',
    discountPoints,
    lenderCredits
  } = inputs;

  let loanAmount = homePrice - downPayment;

  // Get discount points and lender credits for this loan type (default to 0)
  const points = discountPoints?.[loanType] ?? 0;
  const credits = lenderCredits?.[loanType] ?? 0;

  // Calculate points cost (1 point = 1% of loan amount)
  const pointsCost = (points / 100) * loanAmount;
  const ltv = (loanAmount / homePrice) * 100;
  const downPaymentPercent = (downPayment / homePrice) * 100;
  let interestRate = interestRates[loanType];
  const termYears = LOAN_TYPE_INFO[loanType].termYears;
  const termMonths = termYears * 12;

  // Calculate mortgage insurance and upfront fees based on loan type
  let monthlyMI = 0;
  let upfrontFees = 0;

  // ARM-specific variables
  let armDetails: LoanCalculation['armDetails'] = undefined;
  const isARM = isARMLoan(loanType);

  switch (loanType) {
    case 'conventional30':
    case 'conventional15': {
      // Use enhanced PMI calculation with borrower count and first-time buyer status
      const pmiResult = calculatePMI(
        loanAmount,
        homePrice,
        creditScore,
        borrowerCount,
        firstTimeHomeBuyer,
        pmiOption
      );

      monthlyMI = pmiResult.monthlyPremium;
      upfrontFees = pmiResult.upfrontPremium;

      // For single premium financed, add to loan amount
      if (pmiResult.additionalLoanAmount > 0) {
        loanAmount += pmiResult.additionalLoanAmount;
      }

      // For LPMI, adjust interest rate
      if (pmiResult.pmiType === 'lpmi') {
        const lpmiAdjustment = getLPMIRateAdjustment(
          homePrice,
          loanAmount,
          creditScore,
          borrowerCount,
          firstTimeHomeBuyer
        );
        interestRate += lpmiAdjustment;
      }
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
    case 'arm51':
    case 'arm71':
    case 'arm101': {
      // ARM loans use conventional PMI rules
      const pmiResult = calculatePMI(
        loanAmount,
        homePrice,
        creditScore,
        borrowerCount,
        firstTimeHomeBuyer,
        pmiOption
      );

      monthlyMI = pmiResult.monthlyPremium;
      upfrontFees = pmiResult.upfrontPremium;

      if (pmiResult.additionalLoanAmount > 0) {
        loanAmount += pmiResult.additionalLoanAmount;
      }

      if (pmiResult.pmiType === 'lpmi') {
        const lpmiAdjustment = getLPMIRateAdjustment(
          homePrice,
          loanAmount,
          creditScore,
          borrowerCount,
          firstTimeHomeBuyer
        );
        interestRate += lpmiAdjustment;
      }
      break;
    }
  }

  // Calculate P&I (after potential loan amount adjustment for financed PMI)
  const monthlyPI = calculateMonthlyPI(loanAmount, interestRate, termMonths);

  // Calculate monthly taxes and insurance
  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;

  // Total monthly payment
  const totalMonthly = monthlyPI + monthlyMI + monthlyTaxes + monthlyInsurance + monthlyHOA;

  // Cash to close (down payment + upfront fees + points - credits + estimated closing costs ~3%)
  const estimatedClosingCosts = loanAmount * 0.03;
  const cashToClose = downPayment + upfrontFees + pointsCost - credits + estimatedClosingCosts;

  // Calculate total cost and ARM details
  let totalCost: number;

  if (isARM && (loanType === 'arm51' || loanType === 'arm71' || loanType === 'arm101')) {
    // For ARM, calculate using projected rate adjustments
    const armConfig = getARMConfig(loanType);
    const armCalc = calculateARMTotalCost(
      loanAmount,
      interestRate,
      armConfig.initialPeriodYears,
      armConfig.expectedIndexRate,
      armConfig.margin,
      armConfig.initialCap,
      armConfig.periodicCap,
      armConfig.lifetimeCap,
      termYears,
      monthlyTaxes,
      monthlyInsurance,
      monthlyHOA,
      monthlyMI
    );

    totalCost = armCalc.totalCost + downPayment + upfrontFees + pointsCost - credits;

    armDetails = {
      initialRate: interestRate,
      initialPeriodYears: armConfig.initialPeriodYears,
      maxRate: interestRate + armConfig.lifetimeCap,
      estimatedRateAfterAdjustment: armCalc.estimatedRateAfterAdjustment,
      estimatedPaymentAfterAdjustment: armCalc.estimatedPaymentAfterAdjustment,
      worstCasePayment: armCalc.worstCasePayment,
    };
  } else {
    // Fixed rate - simple calculation
    const totalPayments = totalMonthly * termMonths;
    totalCost = totalPayments + downPayment + upfrontFees + pointsCost - credits;
  }

  // Calculate APR (includes P&I and MI in the payment, plus fees and discount points)
  const apr = calculateAPR(loanAmount, monthlyPI + monthlyMI, termMonths, upfrontFees + pointsCost, estimatedClosingCosts - credits);

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
    isARM,
    armDetails,
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
