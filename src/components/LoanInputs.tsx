import { useState, useEffect, type ChangeEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import type { CreditScoreRange, BorrowerCount, PMIOption } from '../types';
import { CREDIT_SCORE_OPTIONS, PMI_OPTION_INFO } from '../types';
import { formatCurrencyWhole, formatPercent } from '../utils/mortgageCalculations';

export function LoanInputs() {
  const { currentScenario, updateInputs } = useLoan();
  const { inputs } = currentScenario;
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [downPaymentMode, setDownPaymentMode] = useState<'$' | '%'>('$');
  const [downPaymentInput, setDownPaymentInput] = useState<string>(String(inputs.downPayment || ''));

  const loanAmount = inputs.homePrice - inputs.downPayment;
  const ltv = inputs.homePrice > 0 ? (loanAmount / inputs.homePrice) * 100 : 0;
  const downPercent = inputs.homePrice > 0 ? (inputs.downPayment / inputs.homePrice) * 100 : 0;

  // Sync local input when mode changes or external value changes
  useEffect(() => {
    if (downPaymentMode === '%') {
      setDownPaymentInput(inputs.homePrice > 0 ? downPercent.toFixed(2) : '');
    } else {
      setDownPaymentInput(String(inputs.downPayment || ''));
    }
  }, [downPaymentMode, inputs.homePrice]);

  const handleNumberChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateInputs({ [field]: value });
  };

  const handleDownPaymentInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDownPaymentInput(value);

    const numValue = parseFloat(value) || 0;
    if (downPaymentMode === '%') {
      const dollarAmount = (numValue / 100) * inputs.homePrice;
      updateInputs({ downPayment: Math.round(dollarAmount) });
    } else {
      updateInputs({ downPayment: numValue });
    }
  };

  const handleCreditScoreChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateInputs({ creditScore: e.target.value as CreditScoreRange });
  };

  const handleBorrowerCountChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateInputs({ borrowerCount: e.target.value as BorrowerCount });
  };

  const handleFirstTimeHomeBuyerChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateInputs({ firstTimeHomeBuyer: e.target.checked });
  };

  const handlePmiOptionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateInputs({ pmiOption: e.target.value as PMIOption });
  };

  const toggleDownPaymentMode = () => {
    setDownPaymentMode(downPaymentMode === '$' ? '%' : '$');
  };

  // Only show PMI options if LTV > 80% (for conventional loans)
  const needsPMI = ltv > 80;

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
              value={downPaymentInput}
              onChange={handleDownPaymentInputChange}
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
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
          {/* Borrower Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Number of Borrowers */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <UserGroupIcon className="w-4 h-4" />
                Borrowers
              </label>
              <select
                value={inputs.borrowerCount || 'single'}
                onChange={handleBorrowerCountChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="single">Single Borrower</option>
                <option value="multi">Multiple Borrowers</option>
              </select>
            </div>

            {/* First-Time Home Buyer */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <HomeIcon className="w-4 h-4" />
                First-Time Buyer
              </label>
              <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={inputs.firstTimeHomeBuyer || false}
                  onChange={handleFirstTimeHomeBuyerChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {inputs.firstTimeHomeBuyer ? 'Yes (HomePossible rates)' : 'No'}
                </span>
              </label>
            </div>

            {/* PMI Option (only show if LTV > 80%) */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                PMI Option
              </label>
              {needsPMI ? (
                <select
                  value={inputs.pmiOption || 'bpmi'}
                  onChange={handlePmiOptionChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  {Object.entries(PMI_OPTION_INFO)
                    .filter(([key]) => key !== 'none')
                    .map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.name}
                      </option>
                    ))}
                </select>
              ) : (
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-green-50 text-green-700 text-sm">
                  No PMI Required (20%+ down)
                </div>
              )}
              {needsPMI && inputs.pmiOption && inputs.pmiOption !== 'none' && (
                <p className="text-xs text-gray-500 mt-1">
                  {PMI_OPTION_INFO[inputs.pmiOption]?.description}
                </p>
              )}
            </div>
          </div>

          {/* Property Costs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      )}
    </div>
  );
}
