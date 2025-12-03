import { useLoan } from '../context/LoanContext';
import { ComparisonCard } from './ComparisonCard';
import { findLowestMonthlyPayment } from '../utils/mortgageCalculations';

export function ComparisonGrid() {
  const { calculations } = useLoan();

  if (calculations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Select loan types above to compare options</p>
      </div>
    );
  }

  const lowestType = findLowestMonthlyPayment(calculations);

  return (
    <div id="comparison-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {calculations.map((calc) => (
        <ComparisonCard
          key={calc.loanType}
          calculation={calc}
          isLowest={calc.loanType === lowestType}
        />
      ))}
    </div>
  );
}
