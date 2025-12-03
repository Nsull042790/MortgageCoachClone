import { type ChangeEvent } from 'react';
import { useLoan } from '../context/LoanContext';
import type { LoanType } from '../types';

const LOAN_TYPES: LoanType[] = ['conventional30', 'conventional15', 'fha30', 'va30', 'usda30'];

const RATE_LABELS: Record<LoanType, string> = {
  conventional30: 'Conventional 30yr',
  conventional15: 'Conventional 15yr',
  fha30: 'FHA 30yr',
  va30: 'VA 30yr',
  usda30: 'USDA 30yr',
};

const RATE_COLORS: Record<LoanType, string> = {
  conventional30: 'text-blue-600',
  conventional15: 'text-blue-600',
  fha30: 'text-green-600',
  va30: 'text-red-600',
  usda30: 'text-gray-600',
};

export function InterestRates() {
  const { currentScenario, updateInterestRate } = useLoan();
  const { interestRates } = currentScenario.inputs;

  const handleRateChange = (loanType: LoanType) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateInterestRate(loanType, value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Interest Rates</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {LOAN_TYPES.map((loanType) => (
          <div key={loanType}>
            <label className={`block text-xs font-medium mb-2 ${RATE_COLORS[loanType]}`}>
              {RATE_LABELS[loanType]}
            </label>
            <input
              type="number"
              step="0.001"
              value={interestRates[loanType] || ''}
              onChange={handleRateChange(loanType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
              placeholder="6.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
