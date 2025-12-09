import { useLoan } from '../context/LoanContext';
import type { LoanType } from '../types';
import { LOAN_TYPE_INFO } from '../types';

const FIXED_LOAN_TYPES: LoanType[] = ['conventional30', 'conventional15', 'fha30', 'va30', 'usda30'];
const ARM_LOAN_TYPES: LoanType[] = ['arm51', 'arm71', 'arm101'];

// Determine if a color is light (needs dark text) or dark (needs light text)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function LoanTypeSelector() {
  const { toggleLoanType, isLoanTypeSelected, currentScenario } = useLoan();
  const selectedCount = currentScenario.selectedLoanTypes.length;

  const renderLoanButton = (loanType: LoanType) => {
    const isSelected = isLoanTypeSelected(loanType);
    const canToggle = isSelected ? selectedCount > 1 : selectedCount < 4;
    const color = LOAN_TYPE_INFO[loanType].color;
    const textColor = isLightColor(color) ? '#0d173c' : '#ffffff';

    return (
      <button
        key={loanType}
        onClick={() => toggleLoanType(loanType)}
        disabled={!canToggle}
        className={`
          px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200
          ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
        `}
        style={
          isSelected
            ? { backgroundColor: color, color: textColor, borderColor: color }
            : { backgroundColor: 'white', color: color, borderColor: color }
        }
      >
        {LOAN_TYPE_INFO[loanType].name}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Fixed Rate Loans */}
      <div>
        <p className="text-xs text-gray-500 text-center mb-2 font-medium">Fixed Rate</p>
        <div className="flex flex-wrap justify-center gap-3">
          {FIXED_LOAN_TYPES.map(renderLoanButton)}
        </div>
      </div>

      {/* ARM Loans */}
      <div>
        <p className="text-xs text-gray-500 text-center mb-2 font-medium">Adjustable Rate (ARM)</p>
        <div className="flex flex-wrap justify-center gap-3">
          {ARM_LOAN_TYPES.map(renderLoanButton)}
        </div>
      </div>
    </div>
  );
}
