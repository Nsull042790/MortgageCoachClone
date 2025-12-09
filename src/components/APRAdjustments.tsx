import { type ChangeEvent } from 'react';
import { useLoan } from '../context/LoanContext';
import type { LoanType } from '../types';

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  conventional30: 'Conv 30yr',
  conventional15: 'Conv 15yr',
  fha30: 'FHA 30yr',
  va30: 'VA 30yr',
  usda30: 'USDA 30yr',
  arm51: '5/1 ARM',
  arm71: '7/1 ARM',
  arm101: '10/1 ARM',
};

export function APRAdjustments() {
  const { currentScenario, updateInputs } = useLoan();
  const { selectedLoanTypes } = currentScenario;
  const discountPoints = currentScenario.inputs.discountPoints || {};
  const lenderCredits = currentScenario.inputs.lenderCredits || {};

  const handlePointsChange = (loanType: LoanType) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateInputs({
      discountPoints: {
        ...discountPoints,
        [loanType]: value,
      } as Record<LoanType, number>,
    });
  };

  const handleCreditsChange = (loanType: LoanType) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateInputs({
      lenderCredits: {
        ...lenderCredits,
        [loanType]: value,
      } as Record<LoanType, number>,
    });
  };

  // Calculate points cost for display
  const loanAmount = currentScenario.inputs.homePrice - currentScenario.inputs.downPayment;
  const getPointsCost = (points: number) => (points / 100) * loanAmount;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700">APR Adjustments</h3>
        <p className="text-xs text-gray-500 mt-1">
          Discount points lower your rate (1 point = 1% of loan). Lender credits offset closing costs.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs font-medium text-gray-500">Loan Type</th>
              <th className="text-center py-2 text-xs font-medium text-gray-500">Points</th>
              <th className="text-center py-2 text-xs font-medium text-gray-500">Cost</th>
              <th className="text-center py-2 text-xs font-medium text-gray-500">Credits</th>
            </tr>
          </thead>
          <tbody>
            {selectedLoanTypes.map((loanType) => {
              const points = (discountPoints as Record<string, number>)[loanType] || 0;
              const credits = (lenderCredits as Record<string, number>)[loanType] || 0;
              const pointsCost = getPointsCost(points);

              return (
                <tr key={loanType} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700 font-medium">
                    {LOAN_TYPE_LABELS[loanType]}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.125"
                      min="0"
                      max="4"
                      value={points || ''}
                      onChange={handlePointsChange(loanType)}
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 text-center text-xs text-gray-500">
                    {points > 0 ? `$${pointsCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={credits || ''}
                      onChange={handleCreditsChange(loanType)}
                      className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                      placeholder="$0"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Points increase APR upfront cost. Credits reduce cash to close.
      </p>
    </div>
  );
}
