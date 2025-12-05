import React, { useState, useMemo } from 'react';
import { useLoan } from '../context/LoanContext';
import { formatCurrencyWhole } from '../utils/mortgageCalculations';
import { LOAN_TYPE_INFO } from '../types';
import { BanknotesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Closing cost item structure
interface ClosingCostItem {
  name: string;
  amount: number;
  category: 'lender' | 'title' | 'government' | 'prepaid' | 'other';
  editable?: boolean;
}

/**
 * Calculate title insurance based on purchase price
 * Uses industry-standard tiered formula
 */
function calculateTitleInsurance(purchasePrice: number, type: 'lender' | 'owner'): number {
  // Lender's title insurance is typically based on loan amount, owner's on purchase price
  // Base rate approximately $4.50 per thousand
  const baseRate = type === 'lender' ? 4.51 : 0.39;
  return Math.ceil(purchasePrice / 1000) * baseRate;
}

// Calculate itemized closing costs based on loan amount (matching Excel structure)
function calculateClosingCostItems(loanAmount: number, homePrice: number): ClosingCostItem[] {
  const lenderTitleIns = calculateTitleInsurance(loanAmount, 'lender');
  const ownerTitleIns = calculateTitleInsurance(homePrice, 'owner');

  return [
    // Origination Charges (Lender Fees)
    { name: 'Commitment/Origination Fee', amount: loanAmount * 0.00266, category: 'lender', editable: true }, // ~0.266% of loan
    { name: 'Discount Points', amount: 0, category: 'lender', editable: true },

    // Services You Cannot Shop For
    { name: 'Appraisal Fee', amount: 475, category: 'lender', editable: true },
    { name: 'Credit Report Fee', amount: 309, category: 'lender', editable: true },
    { name: 'Flood Certification', amount: 10, category: 'lender' },
    { name: 'Tax Service Fee', amount: 0, category: 'lender', editable: true },

    // Services You Can Shop For (Title Fees)
    { name: 'Title - Closing Protection Letter', amount: 75, category: 'title' },
    { name: 'Title - Settlement Fee', amount: 650, category: 'title', editable: true },
    { name: 'Title - Courier Fee', amount: 60, category: 'title' },
    { name: 'Title - E Doc Title Fee', amount: 50, category: 'title' },
    { name: 'Title - Lender Title Insurance', amount: lenderTitleIns, category: 'title', editable: true },
    { name: 'Title - Notary Fees', amount: 25, category: 'title' },
    { name: 'Title - Recording Service Fee', amount: 15, category: 'title' },
    { name: 'Title - Title Endorsement', amount: 100, category: 'title' },
    { name: 'Title - Title Examination', amount: 100, category: 'title' },
    { name: 'Title - Title Search', amount: 187, category: 'title', editable: true },
    { name: 'Title - Wire Transfer Fee', amount: 12, category: 'title' },

    // Government Fees (Taxes and Govt. Fees)
    { name: 'Govt. Recording Fee - Deed', amount: 83, category: 'government' },
    { name: 'Govt. Recording Fee - Mortgage', amount: 333, category: 'government' },
    { name: 'Other Recording Fees', amount: 20, category: 'government' },
    { name: 'State/Local Transfer Tax', amount: 0, category: 'government', editable: true }, // NJ Mansion Tax etc.

    // Other Fees
    { name: 'Borrower Attorney Fee', amount: 1500, category: 'other', editable: true },
    { name: 'Owners Title Insurance', amount: ownerTitleIns, category: 'other', editable: true },
  ];
}

// Category colors matching brand
const CATEGORY_COLORS = {
  lender: '#0d173c',     // Navy
  title: '#967db9',      // Purple
  government: '#96daf8', // Light blue
  prepaid: '#ffd159',    // Gold
  other: '#ce92c1',      // Pink
};

const CATEGORY_NAMES = {
  lender: 'Lender Fees',
  title: 'Title & Settlement',
  government: 'Government Fees',
  prepaid: 'Prepaid Items',
  other: 'Other Services',
};

// Determine if a color needs light text
function needsLightText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function ClosingCostsBreakdown() {
  const { currentScenario, calculations } = useLoan();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sellerConcession, setSellerConcession] = useState(0);
  const [lenderCredit, setLenderCredit] = useState(0);
  const [customCosts, setCustomCosts] = useState<Record<string, number>>({});
  const [selectedLoanType, setSelectedLoanType] = useState(
    currentScenario.selectedLoanTypes[0] || 'conventional30'
  );

  const loanAmount = currentScenario.inputs.homePrice - currentScenario.inputs.downPayment;
  const homePrice = currentScenario.inputs.homePrice;

  // Get the calculation for selected loan type
  const selectedCalc = calculations.find(c => c.loanType === selectedLoanType) || calculations[0];

  // Calculate base closing cost items
  const baseItems = useMemo(() =>
    calculateClosingCostItems(loanAmount, homePrice),
    [loanAmount, homePrice]
  );

  // Apply custom overrides
  const closingCostItems = useMemo(() =>
    baseItems.map(item => ({
      ...item,
      amount: customCosts[item.name] ?? item.amount,
    })),
    [baseItems, customCosts]
  );

  // Calculate prepaid items and initial escrow (matching Excel format)
  const prepaidItems: ClosingCostItem[] = useMemo(() => {
    const monthlyTaxes = currentScenario.inputs.annualTaxes / 12;
    const monthlyInsurance = currentScenario.inputs.annualInsurance / 12;
    const dailyInterest = (loanAmount * (selectedCalc?.interestRate || 6.5) / 100) / 365;

    // Per Excel structure:
    // Prepaid Items:
    // - Homeowners Insurance Premium (1 year upfront)
    // - Prepaid Interest (15 days at daily rate)
    // - Property Taxes (2 months)
    //
    // Initial Escrow Collection (separate from prepaid):
    // - Homeowners Insurance (4 months cushion)
    // - Property Taxes (3 months cushion)

    return [
      // Prepaid Items
      { name: 'Homeowners Insurance Premium (1 year)', amount: currentScenario.inputs.annualInsurance, category: 'prepaid' as const },
      { name: `Prepaid Interest (15 days @ $${dailyInterest.toFixed(2)}/day)`, amount: dailyInterest * 15, category: 'prepaid' as const },
      { name: `Property Taxes (2 months @ $${monthlyTaxes.toFixed(2)}/mo)`, amount: monthlyTaxes * 2, category: 'prepaid' as const },
      // Initial Escrow Collection
      { name: `HOI Escrow (4 months @ $${monthlyInsurance.toFixed(2)}/mo)`, amount: monthlyInsurance * 4, category: 'prepaid' as const },
      { name: `Property Tax Escrow (3 months @ $${monthlyTaxes.toFixed(2)}/mo)`, amount: monthlyTaxes * 3, category: 'prepaid' as const },
    ];
  }, [currentScenario.inputs, loanAmount, selectedCalc]);

  // Calculate upfront fees for selected loan type
  const upfrontFees = selectedCalc?.upfrontFees || 0;

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ClosingCostItem[]> = {
      lender: [],
      title: [],
      government: [],
      prepaid: [],
      other: [],
    };

    closingCostItems.forEach(item => {
      groups[item.category].push(item);
    });

    prepaidItems.forEach(item => {
      groups.prepaid.push(item);
    });

    return groups;
  }, [closingCostItems, prepaidItems]);

  // Calculate totals
  const closingCostsTotal = closingCostItems.reduce((sum, item) => sum + item.amount, 0);
  const prepaidTotal = prepaidItems.reduce((sum, item) => sum + item.amount, 0);
  const grossTotal = closingCostsTotal + prepaidTotal + upfrontFees;
  const netTotal = Math.max(0, grossTotal - sellerConcession - lenderCredit);
  const totalCashToClose = currentScenario.inputs.downPayment + netTotal;

  // Category totals for pie chart
  const categoryTotals = useMemo(() => {
    return Object.entries(groupedItems).map(([category, items]) => ({
      category,
      name: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES],
      total: items.reduce((sum, item) => sum + item.amount, 0),
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    })).filter(c => c.total > 0);
  }, [groupedItems]);

  const handleCostChange = (name: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomCosts(prev => ({ ...prev, [name]: numValue }));
  };

  const resetToDefaults = () => {
    setCustomCosts({});
    setSellerConcession(0);
    setLenderCredit(0);
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
            style={{ backgroundColor: '#967db9' }}
          >
            <BanknotesIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Closing Costs Breakdown</h3>
            <p className="text-sm text-gray-500">Detailed view of all fees and prepaid items</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold" style={{ color: '#0d173c' }}>
              {formatCurrencyWhole(totalCashToClose)}
            </p>
            <p className="text-xs text-gray-500">Total Cash to Close</p>
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
        <div className="px-6 pb-6 space-y-6">
          {/* Loan Type Selector */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">View costs for:</label>
            <select
              value={selectedLoanType}
              onChange={(e) => setSelectedLoanType(e.target.value as typeof selectedLoanType)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {currentScenario.selectedLoanTypes.map(type => (
                <option key={type} value={type}>
                  {LOAN_TYPE_INFO[type].name}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Distribution</h4>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-40 h-40">
                  {(() => {
                    let cumulative = 0;
                    const total = categoryTotals.reduce((sum, c) => sum + c.total, 0) + upfrontFees;
                    const segments: React.ReactNode[] = [];

                    // Add upfront fees segment if applicable
                    if (upfrontFees > 0) {
                      const percentage = upfrontFees / total;
                      const startAngle = cumulative * 360;
                      const endAngle = (cumulative + percentage) * 360;
                      cumulative += percentage;

                      const start = {
                        x: 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180),
                        y: 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180),
                      };
                      const end = {
                        x: 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180),
                        y: 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180),
                      };
                      const largeArc = percentage > 0.5 ? 1 : 0;

                      segments.push(
                        <path
                          key="upfront"
                          d={`M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                          fill="#22c55e"
                        />
                      );
                    }

                    categoryTotals.forEach((cat, idx) => {
                      const percentage = cat.total / total;
                      if (percentage === 0) return;

                      const startAngle = cumulative * 360;
                      const endAngle = (cumulative + percentage) * 360;
                      cumulative += percentage;

                      const start = {
                        x: 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180),
                        y: 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180),
                      };
                      const end = {
                        x: 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180),
                        y: 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180),
                      };
                      const largeArc = percentage > 0.5 ? 1 : 0;

                      segments.push(
                        <path
                          key={idx}
                          d={`M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                          fill={cat.color}
                        />
                      );
                    });

                    return segments;
                  })()}
                  {/* Center hole for donut effect */}
                  <circle cx="50" cy="50" r="25" fill="white" />
                </svg>
              </div>
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {upfrontFees > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                      <span className="text-gray-600">Loan Program Fees</span>
                    </div>
                    <span className="font-medium">{formatCurrencyWhole(upfrontFees)}</span>
                  </div>
                )}
                {categoryTotals.map(cat => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrencyWhole(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-3">
              {/* Down Payment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Down Payment</span>
                  <span className="text-lg font-semibold" style={{ color: '#0d173c' }}>
                    {formatCurrencyWhole(currentScenario.inputs.downPayment)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {((currentScenario.inputs.downPayment / homePrice) * 100).toFixed(1)}% of home price
                </p>
              </div>

              {/* Closing Costs */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Closing Costs</span>
                  <span className="text-lg font-semibold" style={{ color: '#967db9' }}>
                    {formatCurrencyWhole(closingCostsTotal)}
                  </span>
                </div>
              </div>

              {/* Prepaid Items */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prepaid Items</span>
                  <span className="text-lg font-semibold" style={{ color: '#ffd159' }}>
                    {formatCurrencyWhole(prepaidTotal)}
                  </span>
                </div>
              </div>

              {/* Upfront Fees (if any) */}
              {upfrontFees > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedCalc?.loanType.includes('fha') ? 'Upfront MIP' :
                       selectedCalc?.loanType.includes('va') ? 'VA Funding Fee' :
                       selectedCalc?.loanType.includes('usda') ? 'USDA Guarantee Fee' : 'Upfront Fees'}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrencyWhole(upfrontFees)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Can be financed into loan</p>
                </div>
              )}
            </div>
          </div>

          {/* Credits Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Concession
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={sellerConcession || ''}
                  onChange={(e) => setSellerConcession(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Credits from seller to cover costs</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lender Credit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={lenderCredit || ''}
                  onChange={(e) => setLenderCredit(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Credits from lender (may increase rate)</p>
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Itemized Costs</h4>
              <button
                onClick={resetToDefaults}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset to defaults
              </button>
            </div>

            {Object.entries(groupedItems).map(([category, items]) => {
              if (items.length === 0) return null;
              const catColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
              const catName = CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES];

              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div
                    className="px-4 py-2 flex items-center justify-between"
                    style={{
                      backgroundColor: catColor,
                      color: needsLightText(catColor) ? 'white' : '#0d173c'
                    }}
                  >
                    <span className="font-medium text-sm">{catName}</span>
                    <span className="font-semibold">
                      {formatCurrencyWhole(items.reduce((sum, i) => sum + i.amount, 0))}
                    </span>
                  </div>
                  <div className="divide-y">
                    {items.map((item, idx) => (
                      <div key={idx} className="px-4 py-2 flex items-center justify-between bg-white">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        {item.editable ? (
                          <div className="relative w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                              value={customCosts[item.name] ?? Math.round(item.amount)}
                              onChange={(e) => handleCostChange(item.name, e.target.value)}
                              className="w-full pl-5 pr-2 py-1 text-sm text-right border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrencyWhole(item.amount)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal (Costs + Prepaid)</span>
              <span className="font-medium">{formatCurrencyWhole(grossTotal)}</span>
            </div>
            {(sellerConcession > 0 || lenderCredit > 0) && (
              <>
                {sellerConcession > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Seller Concession</span>
                    <span>-{formatCurrencyWhole(sellerConcession)}</span>
                  </div>
                )}
                {lenderCredit > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Lender Credit</span>
                    <span>-{formatCurrencyWhole(lenderCredit)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Net Closing Costs</span>
                  <span className="font-medium">{formatCurrencyWhole(netTotal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Down Payment</span>
              <span className="font-medium">{formatCurrencyWhole(currentScenario.inputs.downPayment)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-gray-900">Total Cash to Close</span>
              <span className="text-xl font-bold" style={{ color: '#0d173c' }}>
                {formatCurrencyWhole(totalCashToClose)}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            These are estimates. Actual closing costs will be provided in your Loan Estimate.
          </p>
        </div>
      )}
    </div>
  );
}
