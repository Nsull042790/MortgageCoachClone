import type { LoanCalculation } from '../types';
import { LOAN_TYPE_INFO } from '../types';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../utils/mortgageCalculations';

interface ComparisonCardProps {
  calculation: LoanCalculation;
  isLowest: boolean;
}

// Determine if a color is light (needs dark text) or dark (needs light text)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function ComparisonCard({ calculation, isLowest }: ComparisonCardProps) {
  const { loanType, interestRate, apr, totalMonthly, monthlyPI, monthlyMI, monthlyTaxes, monthlyInsurance, upfrontFees, cashToClose, totalCost } = calculation;

  const info = LOAN_TYPE_INFO[loanType];
  const headerBgColor = info.bgColor;
  const headerTextColor = isLightColor(headerBgColor) ? '#0d173c' : '#ffffff';

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
      <div
        className="px-4 py-4 text-center"
        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
      >
        <h3 className="text-lg font-semibold">{info.name}</h3>
        <p className="text-3xl font-bold mt-1">{formatPercent(interestRate, 3)}</p>
        <p className="text-sm opacity-80 mt-0.5">{formatPercent(apr, 3)} APR</p>
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
