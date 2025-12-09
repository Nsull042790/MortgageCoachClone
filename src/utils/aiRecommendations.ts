/**
 * AI Recommendation Engine
 * Analyzes borrower profile and loan options to provide intelligent suggestions
 */

import type { LoanInputs, LoanCalculation, LoanType, CreditScoreRange } from '../types';
import { LOAN_TYPE_INFO } from '../types';

export type RecommendationType =
  | 'best_loan'
  | 'credit_improvement'
  | 'down_payment'
  | 'pmi_strategy'
  | 'affordability'
  | 'time_horizon'
  | 'rate_timing'
  | 'fha_consideration'
  | 'va_consideration';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  details?: string;
  savings?: {
    monthly?: number;
    total?: number;
    percentage?: number;
  };
  action?: string;
  icon: 'star' | 'trending-up' | 'dollar' | 'shield' | 'alert' | 'clock' | 'home' | 'chart';
}

// Credit score thresholds that affect PMI rates
const CREDIT_THRESHOLDS = [620, 640, 660, 680, 700, 720, 740, 760, 780, 800];

// Map credit score range to numeric value for calculations
function creditScoreToNumber(creditScore: CreditScoreRange): number {
  const mapping: Record<CreditScoreRange, number> = {
    '760+': 780,
    '740-759': 750,
    '720-739': 730,
    '700-719': 710,
    '680-699': 690,
    '660-679': 670,
    '640-659': 650,
    '620-639': 630,
    '<620': 600,
  };
  return mapping[creditScore] || 700;
}

// Get next credit threshold
function getNextCreditThreshold(currentScore: number): { threshold: number; pointsAway: number } | null {
  for (const threshold of CREDIT_THRESHOLDS) {
    if (currentScore < threshold) {
      return { threshold, pointsAway: threshold - currentScore };
    }
  }
  return null;
}

// Calculate PMI savings for reaching next threshold (simplified)
function estimatePMISavings(
  loanAmount: number,
  currentScore: number,
  _nextThreshold: number,
  ltv: number
): { monthly: number; total: number } {
  // Approximate PMI rate reduction per threshold (varies by LTV)
  const rateReductionPerThreshold = ltv > 90 ? 0.15 : ltv > 85 ? 0.10 : 0.05;
  const currentPMIRate = getPMIRateEstimate(currentScore, ltv);
  const newPMIRate = Math.max(0, currentPMIRate - rateReductionPerThreshold);

  const currentMonthlyPMI = (loanAmount * currentPMIRate / 100) / 12;
  const newMonthlyPMI = (loanAmount * newPMIRate / 100) / 12;
  const monthlySavings = currentMonthlyPMI - newMonthlyPMI;

  // Assume PMI for ~8 years average before 78% LTV
  const totalSavings = monthlySavings * 96;

  return { monthly: monthlySavings, total: totalSavings };
}

// Estimate PMI rate based on credit score and LTV
function getPMIRateEstimate(creditScore: number, ltv: number): number {
  if (ltv <= 80) return 0;

  let baseRate = 0.5;
  if (creditScore >= 760) baseRate = 0.3;
  else if (creditScore >= 740) baseRate = 0.35;
  else if (creditScore >= 720) baseRate = 0.4;
  else if (creditScore >= 700) baseRate = 0.5;
  else if (creditScore >= 680) baseRate = 0.65;
  else if (creditScore >= 660) baseRate = 0.8;
  else baseRate = 1.0;

  // Adjust for LTV
  if (ltv > 95) baseRate *= 1.5;
  else if (ltv > 90) baseRate *= 1.3;
  else if (ltv > 85) baseRate *= 1.15;

  return baseRate;
}

// Calculate extra down payment needed to eliminate PMI
function calculatePMIEliminationAmount(homePrice: number, currentDownPayment: number): {
  extraNeeded: number;
  newDownPayment: number;
  newDownPaymentPercent: number;
} {
  const targetDownPayment = homePrice * 0.20;
  const extraNeeded = Math.max(0, targetDownPayment - currentDownPayment);
  return {
    extraNeeded,
    newDownPayment: targetDownPayment,
    newDownPaymentPercent: 20,
  };
}

// Calculate break-even for extra down payment
function calculateDownPaymentBreakEven(
  extraDownPayment: number,
  monthlyPMISavings: number
): number {
  if (monthlyPMISavings <= 0) return Infinity;
  return Math.ceil(extraDownPayment / monthlyPMISavings);
}

// Find the best loan option
function findBestLoan(
  calculations: LoanCalculation[],
  timeHorizon: number,
  _prioritize: 'monthly' | 'total' | 'balanced' = 'balanced'
): { loan: LoanCalculation; reason: string } | null {
  if (calculations.length === 0) return null;

  const lowestMonthly = Math.min(...calculations.map(c => c.totalMonthly));
  const lowestTotal = Math.min(...calculations.map(c => c.totalCost));
  const lowestCash = Math.min(...calculations.map(c => c.cashToClose));

  // Score each loan
  const scored = calculations.map(calc => {
    let score = 0;
    const reasons: string[] = [];

    // Monthly payment score (lower is better)
    const monthlyScore = (lowestMonthly / calc.totalMonthly) * 100;

    // Total cost score (lower is better)
    const totalScore = (lowestTotal / calc.totalCost) * 100;

    // Cash to close score (lower is better)
    const cashScore = (lowestCash / calc.cashToClose) * 100;

    // Calculate payment increase percentage vs lowest
    const paymentIncreasePct = ((calc.totalMonthly - lowestMonthly) / lowestMonthly) * 100;

    // REALISTIC WEIGHTING: Most borrowers prioritize monthly affordability
    // Weight monthly payment heavily regardless of time horizon
    if (timeHorizon <= 5) {
      // Short term: strongly prioritize monthly payment
      score = monthlyScore * 0.60 + cashScore * 0.25 + totalScore * 0.15;
      if (calc.totalMonthly === lowestMonthly) reasons.push('lowest monthly payment');
    } else if (timeHorizon <= 10) {
      // Medium term: still favor monthly, some weight to total
      score = monthlyScore * 0.50 + totalScore * 0.30 + cashScore * 0.20;
      if (calc.totalMonthly === lowestMonthly) reasons.push('lowest monthly payment');
    } else {
      // Long term: balanced but still favor monthly for practicality
      score = monthlyScore * 0.45 + totalScore * 0.35 + cashScore * 0.20;
    }

    // AFFORDABILITY PENALTY: Progressive penalty for higher monthly payments
    // Small increases (under 15%) - minor penalty
    // Medium increases (15-30%) - moderate penalty
    // Large increases (30%+) - heavy penalty
    if (paymentIncreasePct > 30) {
      score -= 25; // Heavy penalty - payment is 30%+ higher
    } else if (paymentIncreasePct > 20) {
      score -= 15; // Moderate penalty
    } else if (paymentIncreasePct > 10) {
      score -= 8; // Minor penalty
    }

    // 15-YEAR SPECIFIC LOGIC
    // Only give bonus if payment is reasonably close to 30-year options
    const is15Year = calc.termMonths === 180;
    if (is15Year) {
      if (paymentIncreasePct <= 25 && timeHorizon >= 10) {
        // Payment is manageable and staying long-term - 15yr makes sense
        score += 5;
        reasons.push('faster equity build with manageable payment');
      } else if (paymentIncreasePct > 35) {
        // Payment too high - not practical for most borrowers
        score -= 10;
      }
    }

    // Bonus for no PMI
    if (calc.monthlyMI === 0) {
      score += 5;
      reasons.push('no mortgage insurance');
    }

    // Penalty for high upfront fees
    if (calc.upfrontFees > calculations[0].loanAmount * 0.02) {
      score -= 3;
    }

    // Add reason for lowest total cost if applicable (long-term only)
    if (calc.totalCost === lowestTotal && timeHorizon > 10 && paymentIncreasePct <= 25) {
      reasons.push('lowest total cost');
    }

    return { calc, score, reasons, paymentIncreasePct };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Generate appropriate reason
  let reason = '';
  if (best.reasons.length > 0) {
    reason = best.reasons.join(', ');
  } else if (best.paymentIncreasePct === 0) {
    reason = 'lowest monthly payment with good overall value';
  } else if (best.paymentIncreasePct <= 15) {
    reason = 'best balance of monthly payment and total savings';
  } else {
    reason = 'best overall value for your situation';
  }

  return { loan: best.calc, reason };
}

// Main recommendation generator
export function generateRecommendations(
  inputs: LoanInputs,
  calculations: LoanCalculation[],
  options: {
    timeHorizon?: number;
    monthlyIncome?: number;
    monthlyDebts?: number;
    isVeteran?: boolean;
    isRural?: boolean;
  } = {}
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const {
    timeHorizon = 10,
    monthlyIncome = 0,
    monthlyDebts = 0,
    isVeteran = false,
    // isRural - reserved for future USDA recommendations
  } = options;

  const { homePrice, downPayment, creditScore } = inputs;
  const loanAmount = homePrice - downPayment;
  const ltv = (loanAmount / homePrice) * 100;
  const downPaymentPercent = (downPayment / homePrice) * 100;
  const creditScoreNum = creditScoreToNumber(creditScore);

  // Get conventional calculation for PMI analysis
  const conventionalCalc = calculations.find(c => c.loanType === 'conventional30');
  const fhaCalc = calculations.find(c => c.loanType === 'fha30');

  // 1. BEST LOAN RECOMMENDATION
  const bestLoan = findBestLoan(calculations, timeHorizon);
  if (bestLoan) {
    const loanInfo = LOAN_TYPE_INFO[bestLoan.loan.loanType];
    recommendations.push({
      id: 'best_loan',
      type: 'best_loan',
      priority: 'high',
      title: `Best Fit: ${loanInfo.name}`,
      message: `Based on your ${timeHorizon}-year time horizon and profile, this option offers the ${bestLoan.reason}.`,
      details: `Monthly: $${bestLoan.loan.totalMonthly.toFixed(0)} | Total Cost: $${(bestLoan.loan.totalCost / 1000).toFixed(0)}k`,
      icon: 'star',
    });
  }

  // 2. CREDIT SCORE IMPROVEMENT
  const nextThreshold = getNextCreditThreshold(creditScoreNum);
  if (nextThreshold && nextThreshold.pointsAway <= 40 && ltv > 80) {
    const savings = estimatePMISavings(loanAmount, creditScoreNum, nextThreshold.threshold, ltv);
    if (savings.monthly > 20) {
      recommendations.push({
        id: 'credit_improvement',
        type: 'credit_improvement',
        priority: nextThreshold.pointsAway <= 20 ? 'high' : 'medium',
        title: `${nextThreshold.pointsAway} Points to ${nextThreshold.threshold}`,
        message: `Improving your credit score to ${nextThreshold.threshold} would reduce your PMI rate and save money.`,
        savings: {
          monthly: savings.monthly,
          total: savings.total,
        },
        action: 'Consider paying down credit cards or waiting a few months for score improvement.',
        icon: 'trending-up',
      });
    }
  }

  // 3. DOWN PAYMENT OPTIMIZATION - PMI Elimination
  if (ltv > 80 && ltv <= 90 && conventionalCalc && conventionalCalc.monthlyMI > 0) {
    const pmiElimination = calculatePMIEliminationAmount(homePrice, downPayment);
    const breakEven = calculateDownPaymentBreakEven(
      pmiElimination.extraNeeded,
      conventionalCalc.monthlyMI
    );

    if (pmiElimination.extraNeeded <= homePrice * 0.10 && breakEven <= 120) {
      recommendations.push({
        id: 'down_payment_pmi',
        type: 'down_payment',
        priority: breakEven <= 60 ? 'high' : 'medium',
        title: 'Eliminate PMI',
        message: `Adding $${pmiElimination.extraNeeded.toLocaleString()} to your down payment would eliminate PMI entirely.`,
        savings: {
          monthly: conventionalCalc.monthlyMI,
          total: conventionalCalc.monthlyMI * 96, // ~8 years of PMI
        },
        details: `Break-even: ${breakEven} months (${(breakEven / 12).toFixed(1)} years)`,
        action: 'Great long-term investment if you have the funds available.',
        icon: 'dollar',
      });
    }
  }

  // 4. PMI STRATEGY RECOMMENDATION
  if (ltv > 80 && conventionalCalc && conventionalCalc.monthlyMI > 0) {
    const monthlyPMICost = conventionalCalc.monthlyMI * 96; // 8 years estimate
    const singlePremiumEstimate = loanAmount * 0.02; // Rough single premium estimate

    if (timeHorizon >= 7) {
      recommendations.push({
        id: 'pmi_monthly',
        type: 'pmi_strategy',
        priority: 'medium',
        title: 'Monthly PMI Recommended',
        message: `With your ${timeHorizon}+ year timeline, monthly PMI makes sense. It drops off automatically at 78% LTV.`,
        details: `Estimated PMI period: ${Math.ceil((ltv - 78) / 2)} years until automatic removal`,
        icon: 'shield',
      });
    } else if (timeHorizon <= 5 && singlePremiumEstimate < monthlyPMICost * 0.7) {
      recommendations.push({
        id: 'pmi_single',
        type: 'pmi_strategy',
        priority: 'medium',
        title: 'Consider Single Premium PMI',
        message: `Planning to move in ${timeHorizon} years? Single premium PMI may cost less than monthly over your ownership period.`,
        details: 'Single premium can often be rolled into closing costs or loan amount.',
        icon: 'shield',
      });
    }
  }

  // 5. AFFORDABILITY CHECK (if income provided)
  if (monthlyIncome > 0) {
    const totalMonthlyPayment = calculations[0]?.totalMonthly || 0;
    const totalDebtPayments = monthlyDebts + totalMonthlyPayment;
    const dti = (totalDebtPayments / monthlyIncome) * 100;

    if (dti > 43) {
      recommendations.push({
        id: 'affordability_warning',
        type: 'affordability',
        priority: 'high',
        title: 'DTI Warning',
        message: `Your estimated debt-to-income ratio is ${dti.toFixed(0)}%, which exceeds the typical 43% maximum.`,
        details: 'Most conventional loans require DTI under 43%. FHA may allow up to 50% with compensating factors.',
        action: 'Consider a lower purchase price or paying down existing debts.',
        icon: 'alert',
      });
    } else if (dti > 36) {
      recommendations.push({
        id: 'affordability_caution',
        type: 'affordability',
        priority: 'medium',
        title: 'DTI Consideration',
        message: `Your DTI of ${dti.toFixed(0)}% is acceptable but on the higher side.`,
        details: 'You may qualify, but a lower DTI gives you more financial flexibility.',
        icon: 'alert',
      });
    }
  }

  // 6. TIME HORIZON RECOMMENDATIONS
  if (timeHorizon <= 5) {
    const conv30 = calculations.find(c => c.loanType === 'conventional30');
    const conv15 = calculations.find(c => c.loanType === 'conventional15');

    if (conv30 && conv15 && conv15.totalMonthly > conv30.totalMonthly * 1.3) {
      recommendations.push({
        id: 'time_30yr',
        type: 'time_horizon',
        priority: 'medium',
        title: '30-Year May Be Better',
        message: `Planning to move in ${timeHorizon} years? A 30-year loan keeps payments lower since you won\'t benefit from the 15-year\'s faster payoff.`,
        savings: {
          monthly: conv15.totalMonthly - conv30.totalMonthly,
        },
        icon: 'clock',
      });
    }
  }

  // 7. FHA CONSIDERATION (for lower credit scores or down payments)
  if (fhaCalc && conventionalCalc) {
    if (creditScoreNum < 680 || downPaymentPercent < 5) {
      if (fhaCalc.totalMonthly < conventionalCalc.totalMonthly) {
        recommendations.push({
          id: 'fha_consider',
          type: 'fha_consideration',
          priority: 'medium',
          title: 'FHA May Be Better',
          message: 'With your credit profile, FHA offers more favorable terms despite the upfront MIP.',
          savings: {
            monthly: conventionalCalc.totalMonthly - fhaCalc.totalMonthly,
          },
          details: 'FHA allows credit scores as low as 580 with 3.5% down.',
          icon: 'home',
        });
      }
    } else if (creditScoreNum >= 720 && downPaymentPercent >= 10) {
      // Check if conventional is clearly better
      const fhaLifetimeMIP = fhaCalc.monthlyMI * fhaCalc.termMonths;
      const convLifetimePMI = conventionalCalc.monthlyMI * 96; // PMI drops at ~8 years

      if (convLifetimePMI < fhaLifetimeMIP * 0.7) {
        recommendations.push({
          id: 'conv_over_fha',
          type: 'fha_consideration',
          priority: 'low',
          title: 'Conventional Beats FHA',
          message: 'Your strong credit and down payment make conventional the clear winner.',
          details: 'FHA MIP lasts the life of the loan, while conventional PMI drops off at 78% LTV.',
          savings: {
            total: fhaLifetimeMIP - convLifetimePMI,
          },
          icon: 'chart',
        });
      }
    }
  }

  // 8. VA CONSIDERATION (if veteran)
  if (isVeteran) {
    const vaCalc = calculations.find(c => c.loanType === 'va30');
    if (vaCalc) {
      const bestNonVA = calculations
        .filter(c => c.loanType !== 'va30')
        .reduce((best, curr) => curr.totalMonthly < best.totalMonthly ? curr : best, calculations[0]);

      if (vaCalc.totalMonthly <= bestNonVA.totalMonthly) {
        recommendations.push({
          id: 'va_benefit',
          type: 'va_consideration',
          priority: 'high',
          title: 'VA Loan Advantage',
          message: 'As a veteran, the VA loan offers no PMI and competitive rates.',
          savings: {
            monthly: bestNonVA.monthlyMI,
            total: bestNonVA.monthlyMI * bestNonVA.termMonths,
          },
          details: '0% down payment option with no monthly mortgage insurance.',
          icon: 'shield',
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// Get a single "best pick" summary
export function getBestPickSummary(
  _inputs: LoanInputs,
  calculations: LoanCalculation[],
  timeHorizon: number = 10
): {
  loanType: LoanType;
  loanName: string;
  reason: string;
  monthlyPayment: number;
  totalCost: number;
} | null {
  const bestLoan = findBestLoan(calculations, timeHorizon);
  if (!bestLoan) return null;

  return {
    loanType: bestLoan.loan.loanType,
    loanName: LOAN_TYPE_INFO[bestLoan.loan.loanType].name,
    reason: bestLoan.reason,
    monthlyPayment: bestLoan.loan.totalMonthly,
    totalCost: bestLoan.loan.totalCost,
  };
}
