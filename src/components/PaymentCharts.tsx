import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChevronDownIcon, ChevronUpIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { LOAN_TYPE_INFO } from '../types';
import type { LoanCalculation } from '../types';

const PIE_COLORS = {
  pi: '#0d173c',      // Primary - Principal & Interest
  mi: '#ffd159',      // Golden - Mortgage Insurance
  taxes: '#96daf8',   // Light blue - Property Taxes
  insurance: '#967db9', // Purple - Home Insurance
  hoa: '#ce92c1',     // Pink - HOA
};

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      totalMonthly: number;
      color: string;
    };
  }>;
}

function BarChartTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Monthly: <span className="font-semibold">{formatCurrency(data.totalMonthly)}</span>
        </p>
      </div>
    );
  }
  return null;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      percent: number;
    };
  }>;
}

function PieChartTooltip({ active, payload }: PieTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency(data.value)} <span className="text-gray-400">({(data.payload.percent * 100).toFixed(1)}%)</span>
        </p>
      </div>
    );
  }
  return null;
}

export function PaymentCharts() {
  const { currentScenario } = useLoan();
  const { calculations } = currentScenario;
  const [selectedLoanIndex, setSelectedLoanIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded

  if (calculations.length === 0) {
    return null;
  }

  // Prepare bar chart data
  const barChartData = calculations.map((calc) => ({
    name: LOAN_TYPE_INFO[calc.loanType].shortName,
    totalMonthly: calc.totalMonthly,
    color: LOAN_TYPE_INFO[calc.loanType].color,
  }));

  // Find lowest payment for highlighting
  const lowestPayment = Math.min(...calculations.map(c => c.totalMonthly));

  // Prepare pie chart data for selected loan
  const selectedCalc: LoanCalculation = calculations[selectedLoanIndex] || calculations[0];
  const pieChartData = [
    { name: 'Principal & Interest', value: selectedCalc.monthlyPI, color: PIE_COLORS.pi },
    { name: 'Mortgage Insurance', value: selectedCalc.monthlyMI, color: PIE_COLORS.mi },
    { name: 'Property Taxes', value: selectedCalc.monthlyTaxes, color: PIE_COLORS.taxes },
    { name: 'Home Insurance', value: selectedCalc.monthlyInsurance, color: PIE_COLORS.insurance },
    { name: 'HOA', value: selectedCalc.monthlyHOA, color: PIE_COLORS.hoa },
  ].filter(item => item.value > 0).map(item => ({
    ...item,
    percent: item.value / selectedCalc.totalMonthly,
  }));

  // Find lowest payment for header display
  const lowestMonthly = Math.min(...calculations.map(c => c.totalMonthly));

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: '#96daf8' }}
          >
            <ChartBarIcon className="w-5 h-5 text-gray-800" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Payment Analysis</h3>
            <p className="text-sm text-gray-500">Compare monthly payments across loan types</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold" style={{ color: '#0d173c' }}>
              {formatCurrency(lowestMonthly)}
            </p>
            <p className="text-xs text-gray-500">Lowest Payment</p>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Monthly Payment Comparison */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Payment Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<BarChartTooltip />} />
                <Bar
                  dataKey="totalMonthly"
                  radius={[4, 4, 0, 0]}
                >
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.totalMonthly === lowestPayment ? '#ffd159' : entry.color}
                      opacity={entry.totalMonthly === lowestPayment ? 1 : 0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            <span className="inline-block w-3 h-3 rounded mr-1" style={{ backgroundColor: '#ffd159' }}></span>
            Lowest monthly payment
          </p>
        </div>

        {/* Pie Chart - Payment Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Payment Breakdown</h3>
            {calculations.length > 1 && (
              <select
                value={selectedLoanIndex}
                onChange={(e) => setSelectedLoanIndex(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {calculations.map((calc, index) => (
                  <option key={calc.loanType} value={index}>
                    {LOAN_TYPE_INFO[calc.loanType].shortName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieChartTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => {
                    const item = pieChartData.find(d => d.name === value);
                    return (
                      <span className="text-xs text-gray-600">
                        {value}: {item ? formatCurrency(item.value) : ''}
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(selectedCalc.totalMonthly)}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <p className="text-xs text-gray-500">
              {LOAN_TYPE_INFO[selectedCalc.loanType].name}
            </p>
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}
