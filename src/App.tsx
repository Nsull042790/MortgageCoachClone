import { useState } from 'react';
import { LoanProvider } from './context/LoanContext';
import {
  Header,
  LoanInputs,
  InterestRates,
  LoanTypeSelector,
  ComparisonGrid,
  SavedScenariosSidebar,
  VideoWidget,
} from './components';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <SavedScenariosSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto">
          <div id="pdf-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Loan Inputs */}
            <LoanInputs />

            {/* Interest Rates */}
            <InterestRates />

            {/* Loan Type Selector */}
            <div className="py-4">
              <LoanTypeSelector />
            </div>

            {/* Comparison Cards */}
            <ComparisonGrid />

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

      {/* Video Widget */}
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
