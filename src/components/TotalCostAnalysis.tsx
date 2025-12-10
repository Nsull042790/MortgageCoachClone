import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, HomeIcon, BanknotesIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { LOAN_TYPE_INFO } from '../types';
import {
  calculateTCAMultipleHorizons,
  formatTCACurrency,
  type TCAInputs,
} from '../utils/tcaCalculations';

const TIME_HORIZONS = [5, 7, 10, 15, 30];

const TAX_BRACKETS = [
  { value: 10, label: '10%' },
  { value: 12, label: '12%' },
  { value: 22, label: '22%' },
  { value: 24, label: '24%' },
  { value: 32, label: '32%' },
  { value: 35, label: '35%' },
  { value: 37, label: '37%' },
];

export function TotalCostAnalysis() {
  const { currentScenario } = useLoan();
  const { calculations, inputs } = currentScenario;
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLoanIndex, setSelectedLoanIndex] = useState(0);
  const [selectedHorizon, setSelectedHorizon] = useState(10);

  // TCA inputs with defaults
  const [tcaInputs, setTcaInputs] = useState<TCAInputs>({
    homePrice: inputs.homePrice,
    downPayment: inputs.downPayment,
    appreciationRate: 3.5,
    taxBracket: 22,
    monthlyRent: Math.round(inputs.homePrice * 0.004), // ~0.4% of home price as rough rent estimate
    rentIncreaseRate: 3,
    sellingCostPercent: 6,
    investmentReturnRate: 7,
  });

  // Update home price/down payment when inputs change
  useMemo(() => {
    setTcaInputs(prev => ({
      ...prev,
      homePrice: inputs.homePrice,
      downPayment: inputs.downPayment,
      monthlyRent: prev.monthlyRent || Math.round(inputs.homePrice * 0.004),
    }));
  }, [inputs.homePrice, inputs.downPayment]);

  const selectedCalc = calculations[selectedLoanIndex];

  // Calculate TCA for selected loan at all horizons
  const tcaResults = useMemo(() => {
    if (!selectedCalc) return null;
    return calculateTCAMultipleHorizons(selectedCalc, tcaInputs, TIME_HORIZONS);
  }, [selectedCalc, tcaInputs]);

  const currentResult = tcaResults?.[selectedHorizon];

  if (calculations.length === 0) {
    return null;
  }

  const handleInputChange = (field: keyof TCAInputs, value: number) => {
    setTcaInputs(prev => ({ ...prev, [field]: value }));
  };

  // Find max equity for chart scaling
  const maxEquity = currentResult?.yearlyData.reduce(
    (max, d) => Math.max(max, d.equity, d.homeValue),
    0
  ) || 100000;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ScaleIcon className="w-5 h-5 text-[#0d173c]" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Total Cost Analysis</h3>
            <p className="text-sm text-gray-500">True cost of buying vs renting over time</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && currentResult && (
        <div className="px-6 pb-6">
          {/* Loan Selector & Time Horizon */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Loan Type</label>
              <select
                value={selectedLoanIndex}
                onChange={(e) => setSelectedLoanIndex(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {calculations.map((calc, index) => (
                  <option key={calc.loanType} value={index}>
                    {LOAN_TYPE_INFO[calc.loanType].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Time Horizon</label>
              <div className="flex gap-1">
                {TIME_HORIZONS.map((years) => (
                  <button
                    key={years}
                    onClick={() => setSelectedHorizon(years)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedHorizon === years
                        ? 'bg-[#0d173c] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {years}yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Home Appreciation
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={tcaInputs.appreciationRate}
                  onChange={(e) => handleInputChange('appreciationRate', Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{tcaInputs.appreciationRate}%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tax Bracket</label>
              <select
                value={tcaInputs.taxBracket}
                onChange={(e) => handleInputChange('taxBracket', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                {TAX_BRACKETS.map((bracket) => (
                  <option key={bracket.value} value={bracket.value}>
                    {bracket.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Comparable Rent
              </label>
              <input
                type="number"
                value={tcaInputs.monthlyRent}
                onChange={(e) => handleInputChange('monthlyRent', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Rent Increase/yr
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={tcaInputs.rentIncreaseRate}
                  onChange={(e) => handleInputChange('rentIncreaseRate', Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{tcaInputs.rentIncreaseRate}%</span>
              </div>
            </div>
          </div>

          {/* Main Analysis Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Equity Growth Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Equity Growth Over Time</h4>
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-gray-500">
                  <span>{formatTCACurrency(maxEquity)}</span>
                  <span>{formatTCACurrency(maxEquity / 2)}</span>
                  <span>$0</span>
                </div>

                {/* Chart area */}
                <div className="ml-14 h-full flex items-end gap-1">
                  {currentResult.yearlyData.map((data, index) => {
                    const equityHeight = (data.equity / maxEquity) * 100;
                    const homeValueHeight = (data.homeValue / maxEquity) * 100;

                    return (
                      <div key={data.year} className="flex-1 flex flex-col items-center">
                        <div className="w-full relative" style={{ height: '85%' }}>
                          {/* Home value bar (background) */}
                          <div
                            className="absolute bottom-0 w-full bg-gray-200 rounded-t"
                            style={{ height: `${homeValueHeight}%` }}
                          />
                          {/* Equity bar (foreground) */}
                          <div
                            className="absolute bottom-0 w-full bg-[#0d173c] rounded-t"
                            style={{ height: `${Math.max(0, equityHeight)}%` }}
                          />
                        </div>
                        {/* X-axis label - show every other for space */}
                        {(index % 2 === 0 || index === currentResult.yearlyData.length - 1) && (
                          <span className="text-xs text-gray-500 mt-1">{data.year}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#0d173c] rounded" />
                  <span className="text-gray-600">Your Equity</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 rounded" />
                  <span className="text-gray-600">Home Value</span>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-500">Home Value at Year {selectedHorizon}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatTCACurrency(currentResult.yearlyData[selectedHorizon - 1]?.homeValue || 0)}
                  </p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-500">Your Equity</p>
                  <p className="text-lg font-bold text-[#0d173c]">
                    {formatTCACurrency(currentResult.yearlyData[selectedHorizon - 1]?.equity || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Cost Comparison */}
            <div>
              {/* Buy vs Rent Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Buying Card */}
                <div className="bg-[#0d173c] rounded-lg p-4 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <HomeIcon className="w-5 h-5" />
                    <h4 className="font-semibold">Buying</h4>
                  </div>
                  <p className="text-xs opacity-70 mb-1">True Cost ({selectedHorizon} years)</p>
                  <p className="text-2xl font-bold">
                    {formatTCACurrency(currentResult.trueCostBuying)}
                  </p>
                  <div className="mt-3 space-y-1 text-xs opacity-80">
                    <div className="flex justify-between">
                      <span>Total Payments</span>
                      <span>{formatTCACurrency(currentResult.totalPayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing & Selling</span>
                      <span>{formatTCACurrency(currentResult.closingCosts + currentResult.sellingCosts)}</span>
                    </div>
                    <div className="flex justify-between text-green-300">
                      <span>- Equity at Sale</span>
                      <span>-{formatTCACurrency(currentResult.equityAtSale)}</span>
                    </div>
                    <div className="flex justify-between text-green-300">
                      <span>- Tax Savings</span>
                      <span>-{formatTCACurrency(currentResult.taxSavings)}</span>
                    </div>
                  </div>
                </div>

                {/* Renting Card */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BanknotesIcon className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-700">Renting</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">True Cost ({selectedHorizon} years)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTCACurrency(currentResult.trueCostRenting)}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Rent Paid</span>
                      <span>{formatTCACurrency(currentResult.totalRentPaid)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>- Investment Growth</span>
                      <span>-{formatTCACurrency(currentResult.investmentGrowth)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      (If down payment invested at {tcaInputs.investmentReturnRate}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div className={`rounded-lg p-4 ${currentResult.buyingAdvantage > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {currentResult.buyingAdvantage > 0 ? 'Buying Wins!' : 'Renting May Be Better'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentResult.buyingAdvantage > 0
                        ? `You save ${formatTCACurrency(currentResult.buyingAdvantage)} by buying over ${selectedHorizon} years`
                        : `Renting saves ${formatTCACurrency(Math.abs(currentResult.buyingAdvantage))} over ${selectedHorizon} years`
                      }
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${currentResult.buyingAdvantage > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {currentResult.buyingAdvantage > 0 ? '+' : ''}{formatTCACurrency(currentResult.buyingAdvantage)}
                  </div>
                </div>
                {currentResult.breakEvenYear && (
                  <p className="text-xs text-gray-500 mt-2">
                    Break-even point: ~{currentResult.breakEvenYear} years
                  </p>
                )}
              </div>

              {/* Time Horizon Comparison Table */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Cost at Different Time Horizons</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs text-gray-500">Years</th>
                        <th className="text-right py-2 text-xs text-gray-500">Buy Cost</th>
                        <th className="text-right py-2 text-xs text-gray-500">Rent Cost</th>
                        <th className="text-right py-2 text-xs text-gray-500">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_HORIZONS.map((years) => {
                        const result = tcaResults?.[years];
                        if (!result) return null;
                        const isCurrent = years === selectedHorizon;

                        return (
                          <tr
                            key={years}
                            className={`border-b border-gray-100 ${isCurrent ? 'bg-blue-50' : ''}`}
                          >
                            <td className="py-2 font-medium">{years}</td>
                            <td className="py-2 text-right">{formatTCACurrency(result.trueCostBuying)}</td>
                            <td className="py-2 text-right">{formatTCACurrency(result.trueCostRenting)}</td>
                            <td className={`py-2 text-right font-medium ${result.buyingAdvantage > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                              {result.buyingAdvantage > 0 ? '+' : ''}{formatTCACurrency(result.buyingAdvantage)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            This analysis is for illustration purposes only. Actual results will vary based on market conditions, tax situation, and other factors.
            Consult a financial advisor for personalized advice.
          </p>
        </div>
      )}
    </div>
  );
}
