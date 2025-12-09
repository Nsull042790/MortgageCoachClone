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
  AmortizationSchedule,
  AIRecommendations,
  APRAdjustments,
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

            {/* APR Adjustments (Points & Credits) - hidden in client view */}
            {!isClientView && <APRAdjustments />}

            {/* Loan Type Selector - hidden in client view */}
            {!isClientView && (
              <div className="py-4">
                <LoanTypeSelector />
              </div>
            )}

            {/* Comparison Cards */}
            <ComparisonGrid />

            {/* AI Recommendations */}
            <AIRecommendations />

            {/* Payment Analysis Charts */}
            <PaymentCharts />

            {/* Rate Change Simulator */}
            <RateSimulator />

            {/* Closing Costs Breakdown */}
            <ClosingCostsBreakdown />

            {/* Amortization Schedule */}
            <AmortizationSchedule />

            {/* Compliance Footer */}
            <div className="text-center text-xs text-gray-500 pt-8 pb-4 border-t border-gray-200 mt-8">
              <div className="max-w-4xl mx-auto space-y-3">
                <p className="font-medium text-gray-600">
                  Luminate Bank NMLS 1281698
                </p>
                <p>
                  Bank Headquarters: 2523 S. Wayzata Blvd., Suite 100, Minneapolis, MN 55405 | (952) 939-7200
                </p>
                <p className="text-gray-400 leading-relaxed">
                  This is not an offer to enter into an agreement. Any information provided outlining minimum down payment requirements that are allowed by specific loan program and product guidelines. Information, rates and programs are subject to change without prior notice and may not be available in all states. All loans are subject to credit and property approval. Luminate Bank is not affiliated with any government agency.
                </p>
                <p className="text-gray-500">
                  © Luminate Bank. All rights reserved. Member FDIC. Equal Housing Opportunity Lender.
                </p>
              </div>
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
