/**
 * Total Cost Analysis (TCA) Calculations
 * Comprehensive analysis of true homeownership cost vs renting
 */

import type { LoanCalculation } from '../types';

export interface TCAInputs {
  homePrice: number;
  downPayment: number;
  appreciationRate: number; // Annual % (e.g., 3.5)
  taxBracket: number; // Federal tax bracket % (e.g., 22)
  monthlyRent: number; // Current/comparable rent
  rentIncreaseRate: number; // Annual rent increase % (e.g., 3)
  sellingCostPercent: number; // Cost to sell home % (e.g., 6)
  investmentReturnRate: number; // What you'd earn investing down payment (e.g., 7)
}

export interface YearlyEquityData {
  year: number;
  homeValue: number;
  loanBalance: number;
  equity: number;
  totalPaid: number; // Cumulative payments
  totalInterest: number; // Cumulative interest
  totalTaxSavings: number; // Cumulative tax deduction savings
}

export interface TCAResult {
  yearsAnalyzed: number;

  // Buying costs
  totalPayments: number;
  totalInterestPaid: number;
  totalTaxesPaid: number; // Property taxes
  totalInsurancePaid: number;
  totalHOAPaid: number;
  closingCosts: number;
  sellingCosts: number;

  // Buying benefits
  equityAtSale: number;
  homeAppreciation: number;
  taxSavings: number;

  // Net cost of buying
  trueCostBuying: number;

  // Renting costs
  totalRentPaid: number;

  // Opportunity cost (investing down payment instead)
  investmentGrowth: number;

  // Net cost of renting
  trueCostRenting: number;

  // Comparison
  buyingAdvantage: number; // Positive = buying wins
  breakEvenYear: number | null; // When buying becomes cheaper

  // Yearly data for charts
  yearlyData: YearlyEquityData[];
}

/**
 * Calculate remaining loan balance at a given month
 */
function calculateRemainingBalance(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  monthsPaid: number
): number {
  if (monthlyRate === 0) {
    return principal - (principal / totalMonths) * monthsPaid;
  }

  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const balance = principal * Math.pow(1 + monthlyRate, monthsPaid) -
    payment * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate);

  return Math.max(0, balance);
}

/**
 * Calculate total interest paid over a period
 */
function calculateTotalInterestPaid(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  monthsPaid: number
): number {
  if (monthlyRate === 0) return 0;

  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  let totalInterest = 0;
  let balance = principal;

  for (let i = 0; i < monthsPaid; i++) {
    const interestPayment = balance * monthlyRate;
    totalInterest += interestPayment;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
  }

  return totalInterest;
}

/**
 * Calculate future value of investment with regular contributions
 */
function calculateInvestmentValue(
  initialAmount: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number
): number {
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  // Future value of initial amount
  const fvInitial = initialAmount * Math.pow(1 + monthlyRate, months);

  // Future value of monthly contributions
  const fvContributions = monthlyContribution *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return fvInitial + fvContributions;
}

/**
 * Main TCA calculation function
 */
export function calculateTCA(
  calc: LoanCalculation,
  inputs: TCAInputs,
  years: number
): TCAResult {
  const {
    homePrice,
    downPayment,
    appreciationRate,
    taxBracket,
    monthlyRent,
    rentIncreaseRate,
    sellingCostPercent,
    investmentReturnRate,
  } = inputs;

  const monthlyRate = calc.interestRate / 100 / 12;
  const totalMonths = calc.termMonths;
  const monthsAnalyzed = years * 12;

  // Calculate yearly equity data
  const yearlyData: YearlyEquityData[] = [];
  let cumulativePaid = downPayment + calc.cashToClose - downPayment; // Closing costs
  let cumulativeInterest = 0;
  let cumulativeTaxSavings = 0;

  for (let year = 1; year <= years; year++) {
    const monthsElapsed = year * 12;

    // Home value with appreciation
    const homeValue = homePrice * Math.pow(1 + appreciationRate / 100, year);

    // Remaining loan balance
    const loanBalance = calculateRemainingBalance(
      calc.loanAmount,
      monthlyRate,
      totalMonths,
      Math.min(monthsElapsed, totalMonths)
    );

    // Equity = home value - loan balance
    const equity = homeValue - loanBalance;

    // Calculate interest paid this year for tax savings
    const interestThisYear = calculateTotalInterestPaid(
      calc.loanAmount,
      monthlyRate,
      totalMonths,
      Math.min(monthsElapsed, totalMonths)
    ) - cumulativeInterest;

    cumulativeInterest += interestThisYear;

    // Tax savings (simplified - assumes itemizing)
    const taxSavingsThisYear = interestThisYear * (taxBracket / 100);
    cumulativeTaxSavings += taxSavingsThisYear;

    // Total paid (P&I + taxes + insurance + HOA)
    const yearlyPayments = calc.totalMonthly * 12;
    cumulativePaid += yearlyPayments;

    yearlyData.push({
      year,
      homeValue,
      loanBalance,
      equity,
      totalPaid: cumulativePaid,
      totalInterest: cumulativeInterest,
      totalTaxSavings: cumulativeTaxSavings,
    });
  }

  // Final calculations at target year
  const finalYear = yearlyData[years - 1];

  // Buying costs
  const totalPayments = calc.totalMonthly * monthsAnalyzed;
  const totalInterestPaid = cumulativeInterest;
  const totalTaxesPaid = calc.monthlyTaxes * monthsAnalyzed;
  const totalInsurancePaid = calc.monthlyInsurance * monthsAnalyzed;
  const totalHOAPaid = calc.monthlyHOA * monthsAnalyzed;
  const closingCosts = calc.cashToClose - downPayment;
  const sellingCosts = finalYear.homeValue * (sellingCostPercent / 100);

  // Buying benefits
  const equityAtSale = finalYear.equity - sellingCosts;
  const homeAppreciation = finalYear.homeValue - homePrice;
  const taxSavings = cumulativeTaxSavings;

  // True cost of buying = payments + closing + selling - equity - tax savings
  const trueCostBuying =
    totalPayments +
    closingCosts +
    sellingCosts -
    equityAtSale -
    taxSavings;

  // Renting costs (with annual increases)
  let totalRentPaid = 0;
  let currentRent = monthlyRent;
  for (let year = 1; year <= years; year++) {
    totalRentPaid += currentRent * 12;
    currentRent *= (1 + rentIncreaseRate / 100);
  }

  // Opportunity cost: what if you invested the down payment?
  // Also invest the monthly savings (rent vs mortgage payment difference)
  const monthlyDifference = calc.totalMonthly - monthlyRent;
  const investmentGrowth = calculateInvestmentValue(
    downPayment + closingCosts,
    monthlyDifference > 0 ? 0 : Math.abs(monthlyDifference), // Only if rent is higher
    investmentReturnRate,
    years
  ) - downPayment - closingCosts;

  // True cost of renting = rent paid - investment growth
  const trueCostRenting = totalRentPaid - investmentGrowth;

  // Comparison
  const buyingAdvantage = trueCostRenting - trueCostBuying;

  // Find break-even year
  let breakEvenYear: number | null = null;
  let cumulativeRent = 0;
  let currentRentBE = monthlyRent;

  for (let year = 1; year <= Math.min(years, 30); year++) {
    cumulativeRent += currentRentBE * 12;
    currentRentBE *= (1 + rentIncreaseRate / 100);

    const yearData = yearlyData[year - 1];
    if (!yearData) continue;

    const buyingCostAtYear =
      calc.totalMonthly * year * 12 +
      closingCosts +
      (yearData.homeValue * sellingCostPercent / 100) -
      yearData.equity +
      (yearData.homeValue * sellingCostPercent / 100) -
      yearData.totalTaxSavings;

    const investmentAtYear = calculateInvestmentValue(
      downPayment + closingCosts,
      0,
      investmentReturnRate,
      year
    ) - downPayment - closingCosts;

    const rentingCostAtYear = cumulativeRent - investmentAtYear;

    if (buyingCostAtYear < rentingCostAtYear && breakEvenYear === null) {
      breakEvenYear = year;
    }
  }

  return {
    yearsAnalyzed: years,
    totalPayments,
    totalInterestPaid,
    totalTaxesPaid,
    totalInsurancePaid,
    totalHOAPaid,
    closingCosts,
    sellingCosts,
    equityAtSale,
    homeAppreciation,
    taxSavings,
    trueCostBuying,
    totalRentPaid,
    investmentGrowth,
    trueCostRenting,
    buyingAdvantage,
    breakEvenYear,
    yearlyData,
  };
}

/**
 * Calculate TCA at multiple time horizons
 */
export function calculateTCAMultipleHorizons(
  calc: LoanCalculation,
  inputs: TCAInputs,
  horizons: number[] = [5, 7, 10, 15, 30]
): Record<number, TCAResult> {
  const results: Record<number, TCAResult> = {};

  for (const years of horizons) {
    results[years] = calculateTCA(calc, inputs, years);
  }

  return results;
}

/**
 * Format currency for display
 */
export function formatTCACurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return (value < 0 ? '-' : '') + '$' + (absValue / 1000000).toFixed(1) + 'M';
  }
  if (absValue >= 1000) {
    return (value < 0 ? '-' : '') + '$' + (absValue / 1000).toFixed(0) + 'k';
  }
  return '$' + value.toFixed(0);
}
