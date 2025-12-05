import { useState } from 'react';
import { LoanProvider, useLoan } from './context/LoanContext';
import {
  Header,
  LoanInputs,
  InterestRates,
  LoanTypeSelector,
  ComparisonGrid,
  SavedScenariosSidebar,
  VideoWidget,
  PaymentCharts,
  ClientNameInput,
  RateSimulator,
  ClosingCostsBreakdown,
} from './components';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isClientView } = useLoan();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - hidden in client view */}
      {!isClientView && (
        <SavedScenariosSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto">
          <div id="pdf-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Client Name Input - hidden in client view */}
            <ClientNameInput />

            {/* Loan Inputs - read-only display in client view */}
            <LoanInputs />

            {/* Interest Rates - hidden in client view */}
            {!isClientView && <InterestRates />}

            {/* Loan Type Selector - hidden in client view */}
            {!isClientView && (
              <div className="py-4">
                <LoanTypeSelector />
              </div>
            )}

            {/* Comparison Cards */}
            <ComparisonGrid />

            {/* Payment Analysis Charts */}
            <PaymentCharts />

            {/* Rate Change Simulator */}
            <RateSimulator />

            {/* Closing Costs Breakdown */}
            <ClosingCostsBreakdown />

            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-400 pt-8 pb-4">
              <p>
                This calculator provides estimates only. Actual rates, terms, and costs may vary.
                Contact your loan officer for accurate quotes and eligibility requirements.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Video Widget - visible to clients */}
      <VideoWidget />
    </div>
  );
}

function App() {
  return (
    <LoanProvider>
      <AppContent />
    </LoanProvider>
  );
}

export default App;
