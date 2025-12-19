import { useState, useMemo } from 'react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  calculateMonthlyPayment,
  calculateRefinanceComparison,
  formatCurrency,
  formatCurrencyWithCents,
  getPrincipalInterestRatio,
  type CurrentLoanDetails,
  type NewLoanOption,
  type RefinanceComparison,
} from '../utils/refinanceCalculations';

// Luminate colors
const COLORS = {
  navy: '#0d173c',
  lightBlue: '#96daf8',
  pink: '#ce92c1',
  purple: '#967db9',
  gold: '#ffd159',
};

interface NewLoanInputs {
  id: string;
  name: string;
  interestRate: number;
  termYears: number;
  closingCosts: number;
  cashOut: number;
}

export function RefinanceCalculator() {
  // Current loan state
  const [currentLoan, setCurrentLoan] = useState<CurrentLoanDetails>({
    originalLoanAmount: 400000,
    currentBalance: 350000,
    interestRate: 6.5,
    originalTermYears: 30,
    yearsRemaining: 27,
    monthlyPayment: 2528,
    originationDate: '2022-01',
  });

  // New loan options
  const [newLoans, setNewLoans] = useState<NewLoanInputs[]>([
    { id: '1', name: '30-Year Fixed', interestRate: 6.0, termYears: 30, closingCosts: 8000, cashOut: 0 },
    { id: '2', name: '15-Year Fixed', interestRate: 5.5, termYears: 15, closingCosts: 8000, cashOut: 0 },
  ]);

  // Calculate current loan monthly payment when inputs change
  const calculatedCurrentPayment = useMemo(() => {
    return calculateMonthlyPayment(
      currentLoan.originalLoanAmount,
      currentLoan.interestRate,
      currentLoan.originalTermYears
    );
  }, [currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalTermYears]);

  // Update current loan with calculated payment
  const effectiveCurrentLoan = {
    ...currentLoan,
    monthlyPayment: calculatedCurrentPayment,
  };

  // Calculate comparisons for each new loan
  const comparisons: RefinanceComparison[] = useMemo(() => {
    return newLoans.map((loan) => {
      const loanAmount = currentLoan.currentBalance + loan.cashOut;
      const monthlyPayment = calculateMonthlyPayment(loanAmount, loan.interestRate, loan.termYears);

      const newLoanOption: NewLoanOption = {
        name: loan.name,
        loanAmount,
        interestRate: loan.interestRate,
        termYears: loan.termYears,
        closingCosts: loan.closingCosts,
        monthlyPayment,
      };

      return calculateRefinanceComparison(effectiveCurrentLoan, newLoanOption);
    });
  }, [newLoans, effectiveCurrentLoan, currentLoan.currentBalance]);

  // Principal/Interest ratio for current loan
  const yearsIntoCurrent = currentLoan.originalTermYears - currentLoan.yearsRemaining;
  const monthsIntoCurrent = yearsIntoCurrent * 12;
  const currentRatio = useMemo(() => {
    return getPrincipalInterestRatio(
      currentLoan.originalLoanAmount,
      currentLoan.interestRate,
      currentLoan.originalTermYears,
      monthsIntoCurrent
    );
  }, [currentLoan.originalLoanAmount, currentLoan.interestRate, currentLoan.originalTermYears, monthsIntoCurrent]);

  const addNewLoan = () => {
    if (newLoans.length >= 3) return;
    setNewLoans([
      ...newLoans,
      {
        id: Date.now().toString(),
        name: `Option ${newLoans.length + 1}`,
        interestRate: 6.0,
        termYears: 30,
        closingCosts: 8000,
        cashOut: 0,
      },
    ]);
  };

  const removeNewLoan = (id: string) => {
    if (newLoans.length <= 1) return;
    setNewLoans(newLoans.filter((l) => l.id !== id));
  };

  const updateNewLoan = (id: string, updates: Partial<NewLoanInputs>) => {
    setNewLoans(newLoans.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  return (
    <div className="space-y-6">
      {/* Current Loan Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BanknotesIcon className="w-5 h-5" style={{ color: COLORS.navy }} />
          <h2 className="text-lg font-semibold text-gray-900">Current Loan Details</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Loan Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={currentLoan.originalLoanAmount}
                onChange={(e) =>
                  setCurrentLoan({ ...currentLoan, originalLoanAmount: Number(e.target.value) })
                }
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={currentLoan.currentBalance}
                onChange={(e) =>
                  setCurrentLoan({ ...currentLoan, currentBalance: Number(e.target.value) })
                }
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate</label>
            <div className="relative">
              <input
                type="number"
                step="0.125"
                value={currentLoan.interestRate}
                onChange={(e) =>
                  setCurrentLoan({ ...currentLoan, interestRate: Number(e.target.value) })
                }
                className="w-full pr-7 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Term</label>
            <select
              value={currentLoan.originalTermYears}
              onChange={(e) =>
                setCurrentLoan({ ...currentLoan, originalTermYears: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={30}>30 years</option>
              <option value={20}>20 years</option>
              <option value={15}>15 years</option>
              <option value={10}>10 years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years Remaining</label>
            <input
              type="number"
              value={currentLoan.yearsRemaining}
              onChange={(e) =>
                setCurrentLoan({ ...currentLoan, yearsRemaining: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origination Date</label>
            <input
              type="month"
              value={currentLoan.originationDate}
              onChange={(e) =>
                setCurrentLoan({ ...currentLoan, originationDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Monthly Payment</label>
            <div className="text-2xl font-bold" style={{ color: COLORS.navy }}>
              {formatCurrencyWithCents(calculatedCurrentPayment)}
            </div>
            <p className="text-xs text-gray-500">Principal & Interest only</p>
          </div>
        </div>

        {/* Amortization Position */}
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Current Payment Breakdown</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: '#e5e7eb' }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${currentRatio.principalPercent}%`, backgroundColor: COLORS.navy }}
                />
                <div
                  className="h-full transition-all"
                  style={{ width: `${currentRatio.interestPercent}%`, backgroundColor: COLORS.pink }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 whitespace-nowrap">
              <span style={{ color: COLORS.navy }}>{currentRatio.principalPercent.toFixed(0)}% Principal</span>
              {' / '}
              <span style={{ color: COLORS.pink }}>{currentRatio.interestPercent.toFixed(0)}% Interest</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {yearsIntoCurrent} years into your loan • {currentLoan.yearsRemaining} years remaining
          </p>
        </div>
      </div>

      {/* New Loan Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" style={{ color: COLORS.purple }} />
            <h2 className="text-lg font-semibold text-gray-900">New Loan Options</h2>
          </div>
          {newLoans.length < 3 && (
            <button
              onClick={addNewLoan}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: COLORS.navy }}
            >
              <PlusIcon className="w-4 h-4" />
              Add Option
            </button>
          )}
        </div>

        <div className="space-y-4">
          {newLoans.map((loan, index) => (
            <div key={loan.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={loan.name}
                  onChange={(e) => updateNewLoan(loan.id, { name: e.target.value })}
                  className="font-medium text-gray-900 border-none focus:ring-0 p-0 bg-transparent"
                />
                {newLoans.length > 1 && (
                  <button
                    onClick={() => removeNewLoan(loan.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Interest Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.125"
                      value={loan.interestRate}
                      onChange={(e) => updateNewLoan(loan.id, { interestRate: Number(e.target.value) })}
                      className="w-full pr-6 pl-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Term</label>
                  <select
                    value={loan.termYears}
                    onChange={(e) => updateNewLoan(loan.id, { termYears: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={30}>30 years</option>
                    <option value={20}>20 years</option>
                    <option value={15}>15 years</option>
                    <option value={10}>10 years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Closing Costs</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={loan.closingCosts}
                      onChange={(e) => updateNewLoan(loan.id, { closingCosts: Number(e.target.value) })}
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cash Out</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={loan.cashOut}
                      onChange={(e) => updateNewLoan(loan.id, { cashOut: Number(e.target.value) })}
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">New Payment</label>
                  <div className="text-lg font-bold" style={{ color: COLORS.navy }}>
                    {formatCurrencyWithCents(comparisons[index]?.newLoan.monthlyPayment || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="w-5 h-5" style={{ color: COLORS.gold }} />
          <h2 className="text-lg font-semibold text-gray-900">Refinance Analysis</h2>
        </div>

        {/* Amortization Warning */}
        {comparisons[0]?.amortizationWarning && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{comparisons[0].amortizationWarning}</p>
            </div>
          </div>
        )}

        {/* Comparison Cards */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${newLoans.length + 1}, 1fr)` }}>
          {/* Current Loan Card */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: COLORS.navy, backgroundColor: '#f8fafc' }}>
            <div className="text-center mb-3">
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: COLORS.navy }}
              >
                CURRENT
              </span>
              <h3 className="font-semibold text-gray-900 mt-1">Keep Existing Loan</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Payment</span>
                <span className="font-medium">{formatCurrencyWithCents(calculatedCurrentPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Years Remaining</span>
                <span className="font-medium">{currentLoan.yearsRemaining} yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Interest Rate</span>
                <span className="font-medium">{currentLoan.interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Interest Left</span>
                <span className="font-medium">{formatCurrency(comparisons[0]?.totalInterestCurrent || 0)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Cost Left</span>
                  <span className="font-bold" style={{ color: COLORS.navy }}>
                    {formatCurrency(comparisons[0]?.totalCostCurrent || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* New Loan Cards */}
          {comparisons.map((comparison, index) => {
            const isBest = comparison.netSavings > 0 && comparison.breakEvenMonths < 60;
            return (
              <div
                key={newLoans[index].id}
                className="p-4 rounded-lg border-2"
                style={{
                  borderColor: isBest ? '#22c55e' : '#e5e7eb',
                  backgroundColor: isBest ? '#f0fdf4' : 'white',
                }}
              >
                <div className="text-center mb-3">
                  {isBest && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white bg-green-500">
                      RECOMMENDED
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 mt-1">{comparison.newLoan.name}</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Payment</span>
                    <span className="font-medium">
                      {formatCurrencyWithCents(comparison.newLoan.monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Savings</span>
                    <span
                      className="font-medium"
                      style={{ color: comparison.monthlySavings > 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {comparison.monthlySavings > 0 ? '+' : ''}
                      {formatCurrencyWithCents(comparison.monthlySavings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Interest Rate</span>
                    <span className="font-medium">{comparison.newLoan.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Break-even</span>
                    <span className="font-medium">
                      {comparison.breakEvenMonths === Infinity
                        ? 'Never'
                        : `${comparison.breakEvenMonths} months`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Interest Savings</span>
                    <span
                      className="font-medium"
                      style={{ color: comparison.interestSavings > 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {formatCurrency(comparison.interestSavings)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Net Savings</span>
                      <span
                        className="font-bold"
                        style={{ color: comparison.netSavings > 0 ? '#22c55e' : '#ef4444' }}
                      >
                        {comparison.netSavings > 0 ? '+' : ''}
                        {formatCurrency(comparison.netSavings)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Break-even Timeline */}
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Break-even Timeline</span>
          </div>
          <div className="space-y-2">
            {comparisons.map((comparison, index) => {
              const months = comparison.breakEvenMonths;
              const maxMonths = 60; // 5 years max for visualization
              const width = months === Infinity ? 100 : Math.min((months / maxMonths) * 100, 100);

              return (
                <div key={newLoans[index].id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 truncate">{comparison.newLoan.name}</span>
                  <div className="flex-1 h-6 rounded bg-gray-200 relative overflow-hidden">
                    <div
                      className="h-full rounded transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${width}%`,
                        backgroundColor: months <= 24 ? '#22c55e' : months <= 48 ? COLORS.gold : '#ef4444',
                      }}
                    >
                      <span className="text-xs font-medium text-white">
                        {months === Infinity ? 'No savings' : `${months} mo`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>0</span>
            <span>1 yr</span>
            <span>2 yr</span>
            <span>3 yr</span>
            <span>4 yr</span>
            <span>5+ yr</span>
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: COLORS.navy }}>
          <h3 className="font-semibold text-gray-900 mb-2">Recommendation</h3>
          {(() => {
            const bestOption = comparisons.reduce(
              (best, curr, index) => {
                if (curr.netSavings > best.savings && curr.breakEvenMonths < 60) {
                  return { index, savings: curr.netSavings, breakEven: curr.breakEvenMonths };
                }
                return best;
              },
              { index: -1, savings: 0, breakEven: Infinity }
            );

            if (bestOption.index === -1) {
              return (
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Based on the current options, keeping your existing loan may be the best choice. The
                    closing costs and/or higher payments don't justify refinancing at this time.
                  </p>
                </div>
              );
            }

            const best = comparisons[bestOption.index];
            return (
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  <strong>{best.newLoan.name}</strong> offers the best value with{' '}
                  <strong className="text-green-600">{formatCurrency(best.netSavings)}</strong> in total
                  savings. You'll break even in <strong>{best.breakEvenMonths} months</strong> and save{' '}
                  <strong className="text-green-600">{formatCurrencyWithCents(best.monthlySavings)}</strong>{' '}
                  per month.
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
