import { useState, type KeyboardEvent } from 'react';
import { EnvelopeIcon, EyeIcon, DocumentArrowDownIcon, BookmarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { generatePDF } from '../utils/pdfGenerator';
import { PDFOptionsModal, type PDFOptions } from './PDFOptionsModal';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { currentScenario, simulateEmailSent, simulateEmailOpened, saveCurrentScenario, updateScenarioName, createNewScenario } = useLoan();
  const { emailTracking, name } = currentScenario;
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showEmailSentToast, setShowEmailSentToast] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const handleNameClick = () => {
    setTempName(name);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    updateScenarioName(tempName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleEmailToClient = () => {
    simulateEmailSent();
    setShowEmailSentToast(true);
    setTimeout(() => setShowEmailSentToast(false), 3000);

    // Simulate client opening email after 2 seconds (for demo purposes)
    setTimeout(() => {
      simulateEmailOpened();
    }, 2000);
  };

  const handleDownloadPDF = async (options: PDFOptions) => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF('pdf-content', currentScenario, undefined, options);
    } catch (error) {
      console.warn('PDF generation failed:', error);
    } finally {
      setIsGeneratingPDF(false);
      setShowPDFModal(false);
    }
  };

  const handleSave = () => {
    saveCurrentScenario();
    // Show brief feedback
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.classList.add('bg-green-600');
      setTimeout(() => btn.classList.remove('bg-green-600'), 1000);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onOpenSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                title="View saved scenarios"
              >
                <BookmarkIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyDown}
                    className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={handleNameClick}
                    className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                    title="Click to edit name"
                  >
                    Loan Scenario Comparison
                  </h1>
                )}
                <p className="text-sm text-gray-500">Compare up to 4 loan products side-by-side</p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* New Scenario */}
              <button
                onClick={createNewScenario}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Create new scenario"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden md:inline">New</span>
              </button>

              {/* Save */}
              <button
                id="save-btn"
                onClick={handleSave}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Save scenario"
              >
                <BookmarkIcon className="w-4 h-4" />
                <span className="hidden md:inline">Save</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={() => setShowPDFModal(true)}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Download PDF"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span className="hidden md:inline">{isGeneratingPDF ? 'Generating...' : 'PDF'}</span>
              </button>

              {/* Email Tracking */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <EyeIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email Tracking</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {emailTracking.opened} opened
                </span>
              </div>

              {/* Email to Client */}
              <button
                onClick={handleEmailToClient}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Email to Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast notification */}
        {showEmailSentToast && (
          <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            Email sent successfully! (Demo)
          </div>
        )}
      </header>

      {/* PDF Options Modal */}
      <PDFOptionsModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onGenerate={handleDownloadPDF}
        isGenerating={isGeneratingPDF}
      />
    </>
  );
}
