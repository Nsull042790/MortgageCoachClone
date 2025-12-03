import { useLoan } from '../context/LoanContext';
import type { LoanType } from '../types';
import { LOAN_TYPE_INFO } from '../types';

const LOAN_TYPES: LoanType[] = ['conventional30', 'conventional15', 'fha30', 'va30', 'usda30'];

const BUTTON_COLORS: Record<LoanType, { active: string; inactive: string }> = {
  conventional30: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-white text-blue-500 border-blue-500 hover:bg-blue-50',
  },
  conventional15: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-white text-blue-500 border-blue-500 hover:bg-blue-50',
  },
  fha30: {
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'bg-white text-green-500 border-green-500 hover:bg-green-50',
  },
  va30: {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-white text-red-500 border-red-500 hover:bg-red-50',
  },
  usda30: {
    active: 'bg-gray-500 text-white border-gray-500',
    inactive: 'bg-white text-gray-500 border-gray-500 hover:bg-gray-50',
  },
};

export function LoanTypeSelector() {
  const { toggleLoanType, isLoanTypeSelected, currentScenario } = useLoan();
  const selectedCount = currentScenario.selectedLoanTypes.length;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {LOAN_TYPES.map((loanType) => {
        const isSelected = isLoanTypeSelected(loanType);
        const colors = BUTTON_COLORS[loanType];
        const canToggle = isSelected ? selectedCount > 1 : selectedCount < 4;

        return (
          <button
            key={loanType}
            onClick={() => toggleLoanType(loanType)}
            disabled={!canToggle}
            className={`
              px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200
              ${isSelected ? colors.active : colors.inactive}
              ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {LOAN_TYPE_INFO[loanType].name}
          </button>
        );
      })}
    </div>
  );
}
