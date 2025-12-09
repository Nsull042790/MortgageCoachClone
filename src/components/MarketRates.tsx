import { useState, useEffect } from 'react';
import { ArrowPathIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { getMarketRates, fetchMarketRates, formatRateDate, type MarketRates as MarketRatesType } from '../utils/fredApi';
import { useLoan } from '../context/LoanContext';
import { DEFAULT_INTEREST_RATES } from '../types';

interface RateDisplayProps {
  label: string;
  marketRate: number | null;
  currentRate: number;
  onApply: (rate: number) => void;
}

function RateDisplay({ label, marketRate, currentRate, onApply }: RateDisplayProps) {
  if (marketRate === null) return null;

  const diff = currentRate - marketRate;
  const isHigher = diff > 0.05;
  const isLower = diff < -0.05;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">{label}</span>
        {isHigher && (
          <ArrowTrendingUpIcon className="w-3 h-3 text-amber-500" title="Your rate is higher" />
        )}
        {isLower && (
          <ArrowTrendingDownIcon className="w-3 h-3 text-green-500" title="Your rate is lower" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{marketRate.toFixed(2)}%</span>
        <button
          onClick={() => onApply(marketRate)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          title="Apply this rate to your scenario"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function MarketRates() {
  const { currentScenario, updateInputs } = useLoan();
  const [rates, setRates] = useState<MarketRatesType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rates on mount
  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const marketRates = await getMarketRates();
      setRates(marketRates);
    } catch (err) {
      setError('Failed to load rates');
      console.error('Rate loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const marketRates = await fetchMarketRates();
      setRates(marketRates);
    } catch (err) {
      setError('Failed to refresh rates');
      console.error('Rate refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyRate = (loanType: 'conventional30' | 'conventional15' | 'arm51', rate: number) => {
    const newRates = { ...currentScenario.inputs.interestRates };
    newRates[loanType] = rate;

    // Also update related loan types with estimated spreads
    if (loanType === 'conventional30') {
      // FHA/VA/USDA typically 0.25-0.5% lower than conventional
      newRates.fha30 = Math.max(rate - 0.375, 3);
      newRates.va30 = Math.max(rate - 0.5, 3);
      newRates.usda30 = Math.max(rate - 0.375, 3);
    }

    if (loanType === 'arm51') {
      // 7/1 and 10/1 ARMs typically higher than 5/1
      newRates.arm71 = rate + 0.25;
      newRates.arm101 = rate + 0.5;
    }

    updateInputs({ interestRates: newRates });
  };

  const applyAllRates = () => {
    if (!rates) return;

    const newRates = { ...DEFAULT_INTEREST_RATES };

    if (rates.conventional30) {
      newRates.conventional30 = rates.conventional30;
      newRates.fha30 = Math.max(rates.conventional30 - 0.375, 3);
      newRates.va30 = Math.max(rates.conventional30 - 0.5, 3);
      newRates.usda30 = Math.max(rates.conventional30 - 0.375, 3);
    }

    if (rates.conventional15) {
      newRates.conventional15 = rates.conventional15;
    }

    if (rates.arm51) {
      newRates.arm51 = rates.arm51;
      newRates.arm71 = rates.arm51 + 0.25;
      newRates.arm101 = rates.arm51 + 0.5;
    }

    updateInputs({ interestRates: newRates });
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Market Rates</h3>
        </div>
        <button
          onClick={refreshRates}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          title="Refresh rates from FRED"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && !rates && (
        <div className="text-center py-4">
          <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-1">Loading rates...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-2">
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={refreshRates}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Rates display */}
      {rates && (
        <>
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <RateDisplay
              label="30-Year Fixed"
              marketRate={rates.conventional30}
              currentRate={currentScenario.inputs.interestRates.conventional30}
              onApply={(rate) => applyRate('conventional30', rate)}
            />
            <RateDisplay
              label="15-Year Fixed"
              marketRate={rates.conventional15}
              currentRate={currentScenario.inputs.interestRates.conventional15}
              onApply={(rate) => applyRate('conventional15', rate)}
            />
            <RateDisplay
              label="5/1 ARM"
              marketRate={rates.arm51}
              currentRate={currentScenario.inputs.interestRates.arm51}
              onApply={(rate) => applyRate('arm51', rate)}
            />
          </div>

          {/* Apply all button */}
          <button
            onClick={applyAllRates}
            className="w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Apply All Market Rates
          </button>

          {/* Source & date */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">
              {rates.source === 'fred' ? 'Source: Freddie Mac PMMS' : 'Using default rates'}
            </p>
            <p className="text-xs text-gray-400">
              Updated: {formatRateDate(rates.lastUpdated)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
