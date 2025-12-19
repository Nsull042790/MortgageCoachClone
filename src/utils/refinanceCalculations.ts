/**
 * Refinance calculation utilities
 */

export interface CurrentLoanDetails {
  originalLoanAmount: number;
  currentBalance: number;
  interestRate: number;
  originalTermYears: number;
  yearsRemaining: number;
  monthlyPayment: number;
  originationDate: string; // YYYY-MM format
}

export interface NewLoanOption {
  name: string;
  loanAmount: number;
  interestRate: number;
  termYears: number;
  closingCosts: number;
  monthlyPayment: number;
}

export interface RefinanceComparison {
  currentLoan: CurrentLoanDetails;
  newLoan: NewLoanOption;
  monthlySavings: number;
  totalInterestCurrent: number;
  totalInterestNew: number;
  interestSavings: number;
  breakEvenMonths: number;
  totalCostCurrent: number;
  totalCostNew: number;
  netSavings: number;
  amortizationWarning: string;
}

/**
 * Calculate monthly payment for a loan
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Calculate remaining balance on a loan
 */
export function calculateRemainingBalance(
  originalPrincipal: number,
  annualRate: number,
  originalTermYears: number,
  paymentsMade: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = originalTermYears * 12;

  if (monthlyRate === 0) {
    return originalPrincipal - (originalPrincipal / numPayments) * paymentsMade;
  }

  const monthlyPayment = calculateMonthlyPayment(originalPrincipal, annualRate, originalTermYears);

  return (
    originalPrincipal * Math.pow(1 + monthlyRate, paymentsMade) -
    monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate)
  );
}

/**
 * Calculate total interest remaining on current loan
 */
export function calculateTotalInterestRemaining(
  currentBalance: number,
  monthlyPayment: number,
  monthsRemaining: number
): number {
  return monthlyPayment * monthsRemaining - currentBalance;
}

/**
 * Calculate total interest for a new loan
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  return monthlyPayment * termYears * 12 - principal;
}

/**
 * Calculate break-even point in months
 */
export function calculateBreakEvenMonths(
  closingCosts: number,
  monthlySavings: number
): number {
  if (monthlySavings <= 0) return Infinity;
  return Math.ceil(closingCosts / monthlySavings);
}

/**
 * Generate amortization schedule
 */
export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  startingMonth: number = 1
): AmortizationEntry[] {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;

    schedule.push({
      month: startingMonth + month - 1,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      totalInterestPaid,
      totalPrincipalPaid,
    });
  }

  return schedule;
}

/**
 * Calculate comprehensive refinance comparison
 */
export function calculateRefinanceComparison(
  currentLoan: CurrentLoanDetails,
  newLoan: NewLoanOption
): RefinanceComparison {
  const monthsRemaining = currentLoan.yearsRemaining * 12;

  // Current loan totals
  const totalInterestCurrent = calculateTotalInterestRemaining(
    currentLoan.currentBalance,
    currentLoan.monthlyPayment,
    monthsRemaining
  );
  const totalCostCurrent = currentLoan.monthlyPayment * monthsRemaining;

  // New loan totals
  const totalInterestNew = calculateTotalInterest(
    newLoan.loanAmount,
    newLoan.interestRate,
    newLoan.termYears
  );
  const totalCostNew = newLoan.monthlyPayment * newLoan.termYears * 12 + newLoan.closingCosts;

  // Savings calculations
  const monthlySavings = currentLoan.monthlyPayment - newLoan.monthlyPayment;
  const interestSavings = totalInterestCurrent - totalInterestNew;
  const netSavings = totalCostCurrent - totalCostNew;

  // Break-even
  const breakEvenMonths = calculateBreakEvenMonths(newLoan.closingCosts, monthlySavings);

  // Amortization warning
  const yearsIntoCurrent = currentLoan.originalTermYears - currentLoan.yearsRemaining;
  let amortizationWarning = '';

  if (yearsIntoCurrent >= 10) {
    amortizationWarning = `You're ${yearsIntoCurrent} years into your current loan. Most of your payment now goes to principal. Refinancing restarts the amortization clock.`;
  } else if (yearsIntoCurrent >= 5) {
    amortizationWarning = `You're ${yearsIntoCurrent} years into your current loan. Consider the impact of restarting your amortization schedule.`;
  }

  return {
    currentLoan,
    newLoan,
    monthlySavings,
    totalInterestCurrent,
    totalInterestNew,
    interestSavings,
    breakEvenMonths,
    totalCostCurrent,
    totalCostNew,
    netSavings,
    amortizationWarning,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with cents
 */
export function formatCurrencyWithCents(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate principal vs interest ratio at a given point
 */
export function getPrincipalInterestRatio(
  principal: number,
  annualRate: number,
  termYears: number,
  monthsIn: number
): { principalPercent: number; interestPercent: number } {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  // Calculate balance after monthsIn payments
  let balance = principal;
  for (let i = 0; i < monthsIn; i++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance -= principalPayment;
  }

  // Current month's breakdown
  const currentInterest = balance * monthlyRate;
  const currentPrincipal = monthlyPayment - currentInterest;

  const total = currentPrincipal + currentInterest;
  return {
    principalPercent: (currentPrincipal / total) * 100,
    interestPercent: (currentInterest / total) * 100,
  };
}
