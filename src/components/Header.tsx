import { useState, type KeyboardEvent } from 'react';
import { ShareIcon, DocumentArrowDownIcon, BookmarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { generatePDF } from '../utils/pdfGenerator';
import { PDFOptionsModal, type PDFOptions } from './PDFOptionsModal';
import { ShareModal } from './ShareModal';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { currentScenario, saveCurrentScenario, updateScenarioName, createNewScenario, isClientView, clientName } = useLoan();
  const { name } = currentScenario;
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
            {/* Left side - Logo & Title */}
            <div className="flex items-center gap-4">
              {!isClientView && (
                <button
                  onClick={onOpenSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                  title="View saved scenarios"
                >
                  <BookmarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <img
                src="https://lirp.cdn-website.com/e49062f7/dms3rep/multi/opt/Luminatebank_PrimaryLogo_Color-1920w.jpg"
                alt="Luminate Bank Logo"
                className="h-10 w-auto hidden sm:block"
                crossOrigin="anonymous"
              />
              <div>
                {isClientView ? (
                  <h1 className="text-xl font-bold text-gray-900">
                    {clientName ? `Loan Options for ${clientName}` : 'Your Loan Comparison'}
                  </h1>
                ) : isEditingName ? (
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
                <p className="text-sm text-gray-500">
                  {isClientView ? 'Prepared specially for you' : 'Compare up to 4 loan products side-by-side'}
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {!isClientView && (
                <>
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
                </>
              )}

              {/* Download PDF */}
              <button
                onClick={() => setShowPDFModal(true)}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 text-gray-700 hover:bg-gray-100"
                style={isClientView ? { backgroundColor: '#0d173c', color: '#ffffff' } : undefined}
                title="Download PDF"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span className="hidden md:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
              </button>

              {!isClientView && (
                /* Share with Client */
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: '#0d173c' }}
                >
                  <ShareIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* PDF Options Modal */}
      <PDFOptionsModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onGenerate={handleDownloadPDF}
        isGenerating={isGeneratingPDF}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
