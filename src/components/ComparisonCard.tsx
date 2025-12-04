import type { LoanCalculation, LoanType } from '../types';
import { LOAN_TYPE_INFO } from '../types';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../utils/mortgageCalculations';

interface ComparisonCardProps {
  calculation: LoanCalculation;
  isLowest: boolean;
}

const HEADER_COLORS: Record<LoanType, string> = {
  conventional30: 'bg-blue-500',
  conventional15: 'bg-blue-500',
  fha30: 'bg-green-500',
  va30: 'bg-red-500',
  usda30: 'bg-gray-500',
};

export function ComparisonCard({ calculation, isLowest }: ComparisonCardProps) {
  const { loanType, interestRate, totalMonthly, monthlyPI, monthlyMI, monthlyTaxes, monthlyInsurance, upfrontFees, cashToClose, totalCost } = calculation;

  const info = LOAN_TYPE_INFO[loanType];
  const headerColor = HEADER_COLORS[loanType];

  // Determine MI label based on loan type
  const getMILabel = (): string => {
    switch (loanType) {
      case 'fha30':
        return 'MIP';
      case 'va30':
        return ''; // VA doesn't have monthly MI
      case 'usda30':
        return 'Guarantee Fee';
      default:
        return 'PMI';
    }
  };

  const miLabel = getMILabel();
  const taxInsTotal = monthlyTaxes + monthlyInsurance;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${isLowest ? 'border-green-400 ring-2 ring-green-200' : 'border-transparent'}`}>
      {/* Header */}
      <div className={`${headerColor} text-white px-4 py-4 text-center`}>
        <h3 className="text-lg font-semibold">{info.name}</h3>
        <p className="text-3xl font-bold mt-1">{formatPercent(interestRate, 3)}</p>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Total Monthly */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Total Monthly</p>
          <p className={`text-3xl font-bold ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
            {formatCurrency(totalMonthly)}
          </p>
          {isLowest && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
              LOWEST
            </span>
          )}
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">P&I</span>
            <span className="text-gray-900 font-medium">{formatCurrency(monthlyPI)}</span>
          </div>

          {monthlyMI > 0 && miLabel && (
            <div className="flex justify-between">
              <span className="text-gray-500">{miLabel}</span>
              <span className="text-gray-900 font-medium">{formatCurrency(monthlyMI)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">Tax+Ins</span>
            <span className="text-gray-900 font-medium">{formatCurrency(taxInsTotal)}</span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2 text-sm border-t border-gray-100 pt-4 mt-4">
          {upfrontFees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Upfront Fees</span>
              <span className="text-gray-900 font-medium">{formatCurrencyWhole(upfrontFees)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">Cash to Close</span>
            <span className="text-gray-900 font-medium">{formatCurrencyWhole(cashToClose)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Total Cost (life of loan)</span>
            <span className="text-gray-900 font-medium">{formatCurrencyWhole(totalCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
