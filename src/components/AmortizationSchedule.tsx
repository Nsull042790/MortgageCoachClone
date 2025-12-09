import { useState, useMemo } from 'react';
import { useLoan } from '../context/LoanContext';
import { formatCurrency, formatCurrencyWhole, isARMLoan, getARMConfig, calculateARMRateAdjustment, calculateMonthlyPI } from '../utils/mortgageCalculations';
import { LOAN_TYPE_INFO } from '../types';
import type { LoanType } from '../types';
import { TableCellsIcon, ChevronDownIcon, ChevronUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  pmi: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
  rate?: number; // Interest rate for this month (for ARM tracking)
  isRateChange?: boolean; // Flag if rate changed this month
}

// Generate amortization schedule (supports both fixed and ARM loans)
function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  monthlyPMI: number,
  pmiEndLtv: number = 80, // PMI typically ends at 80% LTV
  loanType?: LoanType
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const isARM = loanType ? isARMLoan(loanType) : false;

  // Get ARM config if applicable
  let armConfig: ReturnType<typeof getARMConfig> | null = null;
  let initialPeriodMonths = 0;
  if (isARM && (loanType === 'arm51' || loanType === 'arm71' || loanType === 'arm101')) {
    armConfig = getARMConfig(loanType);
    initialPeriodMonths = armConfig.initialPeriodYears * 12;
  }

  let currentRate = annualRate;
  let monthlyRate = currentRate / 100 / 12;

  // Calculate initial monthly P&I payment
  let monthlyPI: number;
  if (monthlyRate === 0) {
    monthlyPI = loanAmount / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPI = loanAmount * (monthlyRate * factor) / (factor - 1);
  }

  let balance = loanAmount;
  let totalInterest = 0;
  let totalPrincipal = 0;
  const originalLoan = loanAmount;

  for (let month = 1; month <= termMonths && balance > 0; month++) {
    let isRateChange = false;

    // Check for ARM rate adjustment
    if (isARM && armConfig && month > initialPeriodMonths && (month - initialPeriodMonths) % 12 === 1) {
      const isFirstAdjustment = month === initialPeriodMonths + 1;
      currentRate = calculateARMRateAdjustment(
        currentRate,
        annualRate, // initial rate
        armConfig.expectedIndexRate,
        armConfig.margin,
        armConfig.initialCap,
        armConfig.periodicCap,
        armConfig.lifetimeCap,
        isFirstAdjustment
      );
      monthlyRate = currentRate / 100 / 12;

      // Recalculate payment with remaining balance and term
      const remainingMonths = termMonths - month + 1;
      monthlyPI = calculateMonthlyPI(balance, currentRate, remainingMonths);
      isRateChange = true;
    }

    const interest = balance * monthlyRate;
    let principal = monthlyPI - interest;

    // Handle final payment
    if (principal > balance) {
      principal = balance;
    }

    balance -= principal;
    totalInterest += interest;
    totalPrincipal += principal;

    // Determine if PMI applies (based on remaining LTV)
    const currentLtv = (balance / originalLoan) * 100;
    const pmi = currentLtv > pmiEndLtv ? monthlyPMI : 0;

    schedule.push({
      month,
      payment: monthlyPI + pmi,
      principal,
      interest,
      pmi,
      balance: Math.max(0, balance),
      totalInterest,
      totalPrincipal,
      rate: currentRate,
      isRateChange,
    });
  }

  return schedule;
}

export function AmortizationSchedule() {
  const { currentScenario, calculations } = useLoan();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState(
    currentScenario.selectedLoanTypes[0] || 'conventional30'
  );
  const [displayMode, setDisplayMode] = useState<'monthly' | 'yearly'>('yearly');
  const [yearsToShow, setYearsToShow] = useState(5);

  const selectedCalc = calculations.find(c => c.loanType === selectedLoanType) || calculations[0];

  // Generate full amortization schedule
  const schedule = useMemo(() => {
    if (!selectedCalc) return [];
    return generateAmortizationSchedule(
      selectedCalc.loanAmount,
      selectedCalc.interestRate,
      selectedCalc.termMonths,
      selectedCalc.monthlyMI,
      80, // pmiEndLtv
      selectedCalc.loanType
    );
  }, [selectedCalc]);

  // Check if selected loan is an ARM
  const isSelectedARM = selectedCalc ? isARMLoan(selectedCalc.loanType) : false;

  // Aggregate by year for yearly view
  const yearlySchedule = useMemo(() => {
    const years: Array<{
      year: number;
      totalPayment: number;
      totalPrincipal: number;
      totalInterest: number;
      totalPMI: number;
      endingBalance: number;
      cumulativeInterest: number;
      cumulativePrincipal: number;
      endingRate?: number;
      hasRateChange?: boolean;
    }> = [];

    for (let y = 0; y < Math.ceil(schedule.length / 12); y++) {
      const yearStart = y * 12;
      const yearEnd = Math.min(yearStart + 12, schedule.length);
      const yearRows = schedule.slice(yearStart, yearEnd);

      if (yearRows.length === 0) continue;

      const lastRow = yearRows[yearRows.length - 1];
      years.push({
        year: y + 1,
        totalPayment: yearRows.reduce((sum, r) => sum + r.payment, 0),
        totalPrincipal: yearRows.reduce((sum, r) => sum + r.principal, 0),
        totalInterest: yearRows.reduce((sum, r) => sum + r.interest, 0),
        totalPMI: yearRows.reduce((sum, r) => sum + r.pmi, 0),
        endingBalance: lastRow.balance,
        cumulativeInterest: lastRow.totalInterest,
        cumulativePrincipal: lastRow.totalPrincipal,
        endingRate: lastRow.rate,
        hasRateChange: yearRows.some(r => r.isRateChange),
      });
    }

    return years;
  }, [schedule]);

  // Calculate key milestones
  const milestones = useMemo(() => {
    if (schedule.length === 0) return null;

    const pmiEndMonth = schedule.findIndex(r => r.pmi === 0 && schedule[0]?.pmi > 0);
    const halfwayMonth = schedule.findIndex(r => r.totalPrincipal >= selectedCalc?.loanAmount / 2);
    const totalInterest = schedule[schedule.length - 1]?.totalInterest || 0;
    const firstRateChangeMonth = schedule.findIndex(r => r.isRateChange);

    return {
      pmiEndMonth: pmiEndMonth > 0 ? pmiEndMonth : null,
      halfwayMonth: halfwayMonth > 0 ? halfwayMonth : null,
      totalInterest,
      totalPayments: schedule.reduce((sum, r) => sum + r.payment, 0),
      firstRateChangeMonth: firstRateChangeMonth > 0 ? firstRateChangeMonth + 1 : null, // +1 for display (1-indexed)
    };
  }, [schedule, selectedCalc]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = isSelectedARM
      ? ['Month', 'Rate', 'Payment', 'Principal', 'Interest', 'PMI', 'Balance']
      : ['Month', 'Payment', 'Principal', 'Interest', 'PMI', 'Balance'];
    const rows = schedule.map(r => isSelectedARM
      ? [
          r.month,
          (r.rate || 0).toFixed(3),
          r.payment.toFixed(2),
          r.principal.toFixed(2),
          r.interest.toFixed(2),
          r.pmi.toFixed(2),
          r.balance.toFixed(2),
        ]
      : [
          r.month,
          r.payment.toFixed(2),
          r.principal.toFixed(2),
          r.interest.toFixed(2),
          r.pmi.toFixed(2),
          r.balance.toFixed(2),
        ]
    );

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortization-${selectedLoanType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedCalc) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#0d173c' }}>
            <TableCellsIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Amortization Schedule</h3>
            <p className="text-sm text-gray-500">Monthly breakdown of payments over loan life</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {milestones && (
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-500">Total Interest</p>
              <p className="font-semibold" style={{ color: '#ce92c1' }}>
                {formatCurrencyWhole(milestones.totalInterest)}
              </p>
            </div>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedLoanType}
                onChange={(e) => setSelectedLoanType(e.target.value as typeof selectedLoanType)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {currentScenario.selectedLoanTypes.map(type => (
                  <option key={type} value={type}>
                    {LOAN_TYPE_INFO[type].name}
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setDisplayMode('yearly')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    displayMode === 'yearly'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setDisplayMode('monthly')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    displayMode === 'monthly'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Milestones */}
          {milestones && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Total Payments</p>
                <p className="text-lg font-semibold" style={{ color: '#0d173c' }}>
                  {formatCurrencyWhole(milestones.totalPayments)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Total Interest</p>
                <p className="text-lg font-semibold" style={{ color: '#ce92c1' }}>
                  {formatCurrencyWhole(milestones.totalInterest)}
                </p>
              </div>
              {milestones.halfwayMonth && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">50% Principal Paid</p>
                  <p className="text-lg font-semibold" style={{ color: '#967db9' }}>
                    Year {Math.ceil(milestones.halfwayMonth / 12)}
                  </p>
                </div>
              )}
              {milestones.pmiEndMonth && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">PMI Ends</p>
                  <p className="text-lg font-semibold text-green-600">
                    Month {milestones.pmiEndMonth}
                  </p>
                </div>
              )}
              {isSelectedARM && milestones.firstRateChangeMonth && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-amber-700">First Rate Adjustment</p>
                  <p className="text-lg font-semibold text-amber-600">
                    Month {milestones.firstRateChangeMonth}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Schedule Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      {displayMode === 'yearly' ? 'Year' : 'Month'}
                    </th>
                    {isSelectedARM && (
                      <th className="px-4 py-3 text-right font-medium text-amber-600">Rate</th>
                    )}
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Payment</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Principal</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Interest</th>
                    {selectedCalc.monthlyMI > 0 && (
                      <th className="px-4 py-3 text-right font-medium text-gray-600">PMI</th>
                    )}
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayMode === 'yearly' ? (
                    yearlySchedule.slice(0, yearsToShow).map((row, idx) => (
                      <tr key={row.year} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${row.hasRateChange ? 'ring-1 ring-amber-300' : ''}`}>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {row.year}
                          {row.hasRateChange && <span className="ml-1 text-amber-500 text-xs">▲</span>}
                        </td>
                        {isSelectedARM && (
                          <td className={`px-4 py-2 text-right ${row.hasRateChange ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                            {row.endingRate?.toFixed(2)}%
                          </td>
                        )}
                        <td className="px-4 py-2 text-right">{formatCurrency(row.totalPayment)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatCurrency(row.totalPrincipal)}</td>
                        <td className="px-4 py-2 text-right" style={{ color: '#ce92c1' }}>
                          {formatCurrency(row.totalInterest)}
                        </td>
                        {selectedCalc.monthlyMI > 0 && (
                          <td className="px-4 py-2 text-right text-amber-600">
                            {row.totalPMI > 0 ? formatCurrency(row.totalPMI) : '-'}
                          </td>
                        )}
                        <td className="px-4 py-2 text-right font-medium" style={{ color: '#0d173c' }}>
                          {formatCurrencyWhole(row.endingBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    schedule.slice(0, yearsToShow * 12).map((row, idx) => (
                      <tr key={row.month} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${row.isRateChange ? 'ring-1 ring-amber-300 bg-amber-50' : ''}`}>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {row.month}
                          {row.isRateChange && <span className="ml-1 text-amber-500 text-xs">▲</span>}
                        </td>
                        {isSelectedARM && (
                          <td className={`px-4 py-2 text-right ${row.isRateChange ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                            {row.rate?.toFixed(2)}%
                          </td>
                        )}
                        <td className="px-4 py-2 text-right">{formatCurrency(row.payment)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatCurrency(row.principal)}</td>
                        <td className="px-4 py-2 text-right" style={{ color: '#ce92c1' }}>
                          {formatCurrency(row.interest)}
                        </td>
                        {selectedCalc.monthlyMI > 0 && (
                          <td className="px-4 py-2 text-right text-amber-600">
                            {row.pmi > 0 ? formatCurrency(row.pmi) : '-'}
                          </td>
                        )}
                        <td className="px-4 py-2 text-right font-medium" style={{ color: '#0d173c' }}>
                          {formatCurrencyWhole(row.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Show More Button */}
            {((displayMode === 'yearly' && yearsToShow < yearlySchedule.length) ||
              (displayMode === 'monthly' && yearsToShow * 12 < schedule.length)) && (
              <div className="p-3 bg-gray-50 border-t text-center">
                <button
                  onClick={() => setYearsToShow(prev => prev + 5)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Show More ({displayMode === 'yearly' ?
                    `${Math.min(5, yearlySchedule.length - yearsToShow)} more years` :
                    `${Math.min(60, schedule.length - yearsToShow * 12)} more months`})
                </button>
              </div>
            )}
          </div>

          {/* Interest vs Principal Visual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Interest vs Principal Over Time</h4>
            <div className="h-4 rounded-full overflow-hidden flex">
              {yearlySchedule.slice(0, 30).map((year) => {
                const total = year.totalPrincipal + year.totalInterest;
                const principalPercent = (year.totalPrincipal / total) * 100;
                return (
                  <div
                    key={year.year}
                    className="h-full relative group"
                    style={{ width: `${100 / Math.min(30, yearlySchedule.length)}%` }}
                    title={`Year ${year.year}: ${principalPercent.toFixed(0)}% principal`}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-green-500"
                      style={{ height: `${principalPercent}%` }}
                    />
                    <div
                      className="absolute top-0 w-full"
                      style={{ height: `${100 - principalPercent}%`, backgroundColor: '#ce92c1' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Year 1</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500"></span> Principal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ce92c1' }}></span> Interest
                </span>
              </div>
              <span>Year {Math.min(30, yearlySchedule.length)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
