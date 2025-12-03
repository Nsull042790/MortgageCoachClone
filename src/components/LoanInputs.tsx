import { useState, type ChangeEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import type { CreditScoreRange } from '../types';
import { CREDIT_SCORE_OPTIONS } from '../types';
import { formatCurrencyWhole, formatPercent } from '../utils/mortgageCalculations';

export function LoanInputs() {
  const { currentScenario, updateInputs } = useLoan();
  const { inputs } = currentScenario;
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [downPaymentMode, setDownPaymentMode] = useState<'$' | '%'>('$');

  const loanAmount = inputs.homePrice - inputs.downPayment;
  const ltv = inputs.homePrice > 0 ? (loanAmount / inputs.homePrice) * 100 : 0;
  const downPercent = inputs.homePrice > 0 ? (inputs.downPayment / inputs.homePrice) * 100 : 0;

  const handleNumberChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateInputs({ [field]: value });
  };

  const handleDownPaymentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (downPaymentMode === '%') {
      // Convert percentage to dollar amount
      const dollarAmount = (value / 100) * inputs.homePrice;
      updateInputs({ downPayment: Math.round(dollarAmount) });
    } else {
      updateInputs({ downPayment: value });
    }
  };

  const handleCreditScoreChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateInputs({ creditScore: e.target.value as CreditScoreRange });
  };

  const toggleDownPaymentMode = () => {
    setDownPaymentMode(downPaymentMode === '$' ? '%' : '$');
  };

  // Get the display value based on current mode
  const downPaymentDisplayValue = downPaymentMode === '%'
    ? (inputs.homePrice > 0 ? downPercent.toFixed(2) : '')
    : (inputs.downPayment || '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Main Inputs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Home Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Price</label>
          <input
            type="number"
            value={inputs.homePrice || ''}
            onChange={handleNumberChange('homePrice')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="400000"
          />
        </div>

        {/* Down Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment</label>
          <div className="flex">
            <input
              type="number"
              value={downPaymentDisplayValue}
              onChange={handleDownPaymentChange}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder={downPaymentMode === '%' ? '5' : '20000'}
              step={downPaymentMode === '%' ? '0.5' : '1000'}
            />
            <button
              type="button"
              onClick={toggleDownPaymentMode}
              className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors min-w-[50px]"
              title={`Switch to ${downPaymentMode === '$' ? 'percentage' : 'dollar amount'}`}
            >
              {downPaymentMode}
            </button>
          </div>
        </div>

        {/* Credit Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credit Score</label>
          <select
            value={inputs.creditScore}
            onChange={handleCreditScoreChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            {CREDIT_SCORE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculated Values */}
      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-gray-500">Loan Amount: </span>
          <span className="font-semibold text-gray-900">{formatCurrencyWhole(loanAmount)}</span>
        </div>
        <div>
          <span className="text-gray-500">LTV: </span>
          <span className={`font-semibold ${ltv > 80 ? 'text-amber-600' : 'text-green-600'}`}>
            {formatPercent(ltv)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Down: </span>
          <span className="font-semibold text-gray-900">{formatPercent(downPercent)}</span>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        {showAdvanced ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
        Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Annual Taxes */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Annual Taxes</label>
            <input
              type="number"
              value={inputs.annualTaxes || ''}
              onChange={handleNumberChange('annualTaxes')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="4800"
            />
          </div>

          {/* Annual Insurance */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Annual Insurance</label>
            <input
              type="number"
              value={inputs.annualInsurance || ''}
              onChange={handleNumberChange('annualInsurance')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="1800"
            />
          </div>

          {/* Monthly HOA */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Monthly HOA</label>
            <input
              type="number"
              value={inputs.monthlyHOA || ''}
              onChange={handleNumberChange('monthlyHOA')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
