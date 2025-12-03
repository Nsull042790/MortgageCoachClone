import { type MouseEvent } from 'react';
import { XMarkIcon, TrashIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { formatCurrencyWhole } from '../utils/mortgageCalculations';

interface SavedScenariosSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedScenariosSidebar({ isOpen, onClose }: SavedScenariosSidebarProps) {
  const { savedScenarios, loadScenario, deleteScenarioById, currentScenario } = useLoan();

  const handleLoad = (scenarioId: string) => {
    loadScenario(scenarioId);
    onClose();
  };

  const handleDelete = (e: MouseEvent, scenarioId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this scenario?')) {
      deleteScenarioById(scenarioId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Saved Scenarios</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scenarios List */}
          <div className="flex-1 overflow-y-auto p-4">
            {savedScenarios.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No saved scenarios yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Click "Save" to save the current scenario
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScenarios.map((scenario) => {
                  const isActive = scenario.id === currentScenario.id;
                  const lowestCalc = scenario.calculations.length > 0
                    ? scenario.calculations.reduce((min, c) => c.totalMonthly < min.totalMonthly ? c : min)
                    : null;

                  return (
                    <div
                      key={scenario.id}
                      onClick={() => handleLoad(scenario.id)}
                      className={`
                        p-4 rounded-lg cursor-pointer transition-all border-2
                        ${isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {scenario.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(scenario.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, scenario.id)}
                          className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete scenario"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick stats */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-100 rounded px-2 py-1">
                          <span className="text-gray-500">Home: </span>
                          <span className="text-gray-700 font-medium">
                            {formatCurrencyWhole(scenario.inputs.homePrice)}
                          </span>
                        </div>
                        {lowestCalc && (
                          <div className="bg-green-100 rounded px-2 py-1">
                            <span className="text-gray-500">Lowest: </span>
                            <span className="text-green-700 font-medium">
                              {formatCurrencyWhole(lowestCalc.totalMonthly)}/mo
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Email tracking */}
                      {scenario.emailTracking.sent > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <span>Sent: {scenario.emailTracking.sent}</span>
                          <span>•</span>
                          <span>Opened: {scenario.emailTracking.opened}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
