import { useState } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { generateShareableUrl } from '../utils/urlSharing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { currentScenario } = useLoan();
  const [clientName, setClientName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareableUrl = generateShareableUrl(
    currentScenario.inputs,
    currentScenario.selectedLoanTypes,
    clientName || undefined,
    currentScenario.videoMessage?.vimeoId
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareableUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailLink = () => {
    const subject = encodeURIComponent('Your Loan Comparison');
    const body = encodeURIComponent(
      `Hi${clientName ? ' ' + clientName : ''},\n\nI've prepared a loan comparison for you. Click the link below to view it:\n\n${shareableUrl}\n\nLet me know if you have any questions!\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Share with Client</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Client Name (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="John & Jane Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, the client's name will appear on their view
            </p>
          </div>

          {/* Shareable Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 truncate"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">What's included in the link:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Home price, down payment, and loan amount</li>
              <li>• All selected loan types with rates</li>
              <li>• Monthly payment breakdown</li>
              <li>• Visual charts for comparison</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleEmailLink}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Open in Email Client
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
