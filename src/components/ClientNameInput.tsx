import { UserIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';

export function ClientNameInput() {
  const { currentScenario, updateClientName, isClientView } = useLoan();

  // Don't show in client view
  if (isClientView) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <label htmlFor="clientName" className="block text-xs font-medium text-gray-500 mb-1">
            Client Name
          </label>
          <input
            type="text"
            id="clientName"
            value={currentScenario.clientName || ''}
            onChange={(e) => updateClientName(e.target.value)}
            placeholder="Enter client's name..."
            className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
