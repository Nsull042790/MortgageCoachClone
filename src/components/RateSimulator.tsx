import { useState, useMemo } from 'react';
import { useLoan } from '../context/LoanContext';
import { calculateAllLoans, formatCurrency } from '../utils/mortgageCalculations';
import { LOAN_TYPE_INFO } from '../types';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

// Determine if a color is light (needs dark text) or dark (needs light text)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function RateSimulator() {
  const { currentScenario } = useLoan();
  const [rateAdjustment, setRateAdjustment] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate adjusted rates and new payments
  const adjustedCalculations = useMemo(() => {
    if (rateAdjustment === 0) return null;

    // Create adjusted inputs with modified interest rates
    const adjustedInputs = {
      ...currentScenario.inputs,
      interestRates: Object.fromEntries(
        Object.entries(currentScenario.inputs.interestRates).map(([type, rate]) => [
          type,
          Math.max(0.1, rate + rateAdjustment), // Ensure rate doesn't go below 0.1%
        ])
      ) as typeof currentScenario.inputs.interestRates,
    };

    return calculateAllLoans(adjustedInputs, currentScenario.selectedLoanTypes);
  }, [currentScenario.inputs, currentScenario.selectedLoanTypes, rateAdjustment]);

  // Original calculations for comparison
  const originalCalculations = useMemo(() => {
    return calculateAllLoans(currentScenario.inputs, currentScenario.selectedLoanTypes);
  }, [currentScenario.inputs, currentScenario.selectedLoanTypes]);

  const formatRateChange = (value: number): string => {
    if (value === 0) return 'Current rates';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: '#0d173c' }}
          >
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Rate Change Simulator</h3>
            <p className="text-sm text-gray-500">See how rate changes affect your payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rateAdjustment !== 0 && (
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                rateAdjustment > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {formatRateChange(rateAdjustment)}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Adjust all rates by:</span>
              <span
                className={`text-lg font-semibold ${
                  rateAdjustment > 0
                    ? 'text-red-600'
                    : rateAdjustment < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}
              >
                {formatRateChange(rateAdjustment)}
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="-2"
                max="2"
                step="0.125"
                value={rateAdjustment}
                onChange={(e) => setRateAdjustment(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0d173c]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                  -2%
                </span>
                <span>Current</span>
                <span className="flex items-center gap-1">
                  +2%
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 justify-center">
              {[-1, -0.5, 0, 0.5, 1].map((value) => (
                <button
                  key={value}
                  onClick={() => setRateAdjustment(value)}
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    rateAdjustment === value
                      ? 'border-[#0d173c] bg-[#0d173c] text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {value === 0 ? 'Reset' : `${value > 0 ? '+' : ''}${value}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          {rateAdjustment !== 0 && adjustedCalculations && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Loan Type</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Current Rate</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">New Rate</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Current Payment</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">New Payment</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustedCalculations.map((adjusted, index) => {
                    const original = originalCalculations[index];
                    const diff = adjusted.totalMonthly - original.totalMonthly;
                    const info = LOAN_TYPE_INFO[adjusted.loanType];
                    const bgColor = info.bgColor;
                    const textColor = isLightColor(bgColor) ? '#0d173c' : '#ffffff';

                    return (
                      <tr key={adjusted.loanType} className="border-b last:border-0">
                        <td className="py-2 px-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            {info.shortName}
                          </span>
                        </td>
                        <td className="text-right py-2 px-2 text-gray-600">
                          {original.interestRate.toFixed(3)}%
                        </td>
                        <td className="text-right py-2 px-2 font-medium" style={{ color: '#0d173c' }}>
                          {adjusted.interestRate.toFixed(3)}%
                        </td>
                        <td className="text-right py-2 px-2 text-gray-600">
                          {formatCurrency(original.totalMonthly)}
                        </td>
                        <td className="text-right py-2 px-2 font-medium" style={{ color: '#0d173c' }}>
                          {formatCurrency(adjusted.totalMonthly)}
                        </td>
                        <td
                          className={`text-right py-2 px-2 font-semibold ${
                            diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-500'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {formatCurrency(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary when adjusted */}
          {rateAdjustment !== 0 && adjustedCalculations && (
            <div
              className={`p-4 rounded-lg ${
                rateAdjustment > 0 ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <p className={`text-sm ${rateAdjustment > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {rateAdjustment > 0 ? (
                  <>
                    <strong>If rates increase by {rateAdjustment.toFixed(2)}%:</strong> Your monthly
                    payments would go up. Locking in today's rate could save you money.
                  </>
                ) : (
                  <>
                    <strong>If rates decrease by {Math.abs(rateAdjustment).toFixed(2)}%:</strong> Your
                    monthly payments would be lower. Consider watching rates for potential savings.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Reset hint */}
          {rateAdjustment === 0 && (
            <p className="text-center text-sm text-gray-500">
              Use the slider above to see how rate changes would affect your monthly payments
            </p>
          )}
        </div>
      )}
    </div>
  );
}
