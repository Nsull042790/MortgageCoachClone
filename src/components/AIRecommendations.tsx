import { useState, useMemo, type ChangeEvent } from 'react';
import { useLoan } from '../context/LoanContext';
import { generateRecommendations, getBestPickSummary, type Recommendation } from '../utils/aiRecommendations';
import { formatCurrency, formatCurrencyWhole } from '../utils/mortgageCalculations';
import { TIME_HORIZON_OPTIONS } from '../types';
import {
  SparklesIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  HomeIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Map recommendation icon to component
function getIconComponent(icon: Recommendation['icon']) {
  switch (icon) {
    case 'star': return StarIcon;
    case 'trending-up': return ArrowTrendingUpIcon;
    case 'dollar': return CurrencyDollarIcon;
    case 'shield': return ShieldCheckIcon;
    case 'alert': return ExclamationTriangleIcon;
    case 'clock': return ClockIcon;
    case 'home': return HomeIcon;
    case 'chart': return ChartBarIcon;
    default: return LightBulbIcon;
  }
}

// Priority badge colors
const priorityColors = {
  high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
};

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getIconComponent(recommendation.icon);
  const colors = priorityColors[recommendation.priority];
  const isBestLoan = recommendation.type === 'best_loan';

  return (
    <div
      className={`rounded-lg border-2 overflow-hidden transition-all ${
        isBestLoan
          ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50'
          : `border-gray-200 bg-white hover:border-gray-300`
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              isBestLoan
                ? 'bg-yellow-400'
                : recommendation.priority === 'high'
                ? 'bg-red-100'
                : recommendation.priority === 'medium'
                ? 'bg-amber-100'
                : 'bg-blue-100'
            }`}
          >
            {isBestLoan ? (
              <StarIconSolid className="w-5 h-5 text-white" />
            ) : (
              <IconComponent
                className={`w-5 h-5 ${
                  recommendation.priority === 'high'
                    ? 'text-red-600'
                    : recommendation.priority === 'medium'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold ${isBestLoan ? 'text-amber-900' : 'text-gray-900'}`}>
                {recommendation.title}
              </h4>
              {!isBestLoan && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                >
                  {recommendation.priority}
                </span>
              )}
              {isBestLoan && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-medium">
                  AI Pick
                </span>
              )}
            </div>

            <p className={`text-sm mt-1 ${isBestLoan ? 'text-amber-800' : 'text-gray-600'}`}>
              {recommendation.message}
            </p>

            {/* Savings Display */}
            {recommendation.savings && (
              <div className="mt-3 flex flex-wrap gap-3">
                {recommendation.savings.monthly && recommendation.savings.monthly > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Save</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(recommendation.savings.monthly)}/mo
                    </span>
                  </div>
                )}
                {recommendation.savings.total && recommendation.savings.total > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Total savings</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrencyWhole(recommendation.savings.total)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Details & Action (expandable) */}
            {(recommendation.details || recommendation.action) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {isExpanded ? 'Less details' : 'More details'}
                {isExpanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            )}

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {recommendation.details && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded p-2">
                    {recommendation.details}
                  </p>
                )}
                {recommendation.action && (
                  <div className="flex items-start gap-2 text-sm bg-blue-50 text-blue-800 rounded p-2">
                    <LightBulbIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{recommendation.action}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIRecommendations() {
  const { currentScenario, calculations, updateInputs } = useLoan();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllRecs, setShowAllRecs] = useState(false);

  const { inputs } = currentScenario;

  // Generate recommendations
  const recommendations = useMemo(() => {
    return generateRecommendations(inputs, calculations, {
      timeHorizon: inputs.timeHorizon || 10,
      monthlyIncome: inputs.monthlyIncome,
      monthlyDebts: inputs.monthlyDebts,
      isVeteran: inputs.isVeteran,
      isRural: inputs.isRural,
    });
  }, [inputs, calculations]);

  // Get best pick summary
  const bestPick = useMemo(() => {
    return getBestPickSummary(inputs, calculations, inputs.timeHorizon || 10);
  }, [inputs, calculations]);

  // Calculate DTI if income provided
  const dti = useMemo(() => {
    if (!inputs.monthlyIncome || inputs.monthlyIncome <= 0) return null;
    const totalPayment = calculations[0]?.totalMonthly || 0;
    const totalDebts = (inputs.monthlyDebts || 0) + totalPayment;
    return (totalDebts / inputs.monthlyIncome) * 100;
  }, [inputs, calculations]);

  const handleTimeHorizonChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateInputs({ timeHorizon: parseInt(e.target.value) });
  };

  const handleIncomeChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateInputs({ monthlyIncome: parseFloat(e.target.value) || 0 });
  };

  const handleDebtsChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateInputs({ monthlyDebts: parseFloat(e.target.value) || 0 });
  };

  const handleVeteranChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateInputs({ isVeteran: e.target.checked });
  };

  const visibleRecommendations = showAllRecs
    ? recommendations
    : recommendations.slice(0, 4);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-lg overflow-hidden border border-indigo-100">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              AI Recommendations
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                {recommendations.length} insights
              </span>
            </h3>
            <p className="text-sm text-gray-500">Personalized suggestions based on your profile</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bestPick && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Best Fit</p>
              <p className="font-semibold text-indigo-600">{bestPick.loanName}</p>
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
          {/* Input Fields for AI Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <LightBulbIcon className="w-4 h-4 text-amber-500" />
              Help us personalize your recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Time Horizon */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  How long will you stay?
                </label>
                <select
                  value={inputs.timeHorizon || 10}
                  onChange={handleTimeHorizonChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {TIME_HORIZON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Income */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Monthly Income (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={inputs.monthlyIncome || ''}
                    onChange={handleIncomeChange}
                    placeholder="8,000"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Monthly Debts */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Other Monthly Debts
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={inputs.monthlyDebts || ''}
                    onChange={handleDebtsChange}
                    placeholder="500"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Veteran Status */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Special Eligibility
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={inputs.isVeteran || false}
                    onChange={handleVeteranChange}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Veteran (VA eligible)</span>
                </label>
              </div>
            </div>

            {/* DTI Display */}
            {dti !== null && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                <span className="text-sm text-gray-500">Debt-to-Income Ratio:</span>
                <span
                  className={`text-sm font-semibold ${
                    dti > 43 ? 'text-red-600' : dti > 36 ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {dti.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-400">
                  {dti > 43 ? '(Above typical 43% limit)' : dti > 36 ? '(Acceptable)' : '(Good)'}
                </span>
              </div>
            )}
          </div>

          {/* Best Pick Highlight */}
          {bestPick && (
            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-4 border-2 border-yellow-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-400 rounded-full">
                  <StarIconSolid className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-amber-900">AI Best Pick: {bestPick.loanName}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-amber-800 mt-0.5">
                    Based on your {inputs.timeHorizon || 10}-year timeline: {bestPick.reason}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(bestPick.monthlyPayment)}
                    <span className="text-sm font-normal">/mo</span>
                  </p>
                  <p className="text-xs text-amber-700">
                    Total: {formatCurrencyWhole(bestPick.totalCost)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations List */}
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Personalized Insights
              </h4>
              {visibleRecommendations
                .filter((r) => r.type !== 'best_loan')
                .map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}

              {recommendations.length > 4 && (
                <button
                  onClick={() => setShowAllRecs(!showAllRecs)}
                  className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showAllRecs
                    ? 'Show less'
                    : `Show ${recommendations.length - 4} more recommendations`}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Add more details above to get personalized recommendations</p>
            </div>
          )}

          {/* Quick Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Credit score of 740+ typically gets the best PMI rates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>20% down eliminates PMI entirely on conventional loans</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>VA loans offer 0% down with no monthly mortgage insurance</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
