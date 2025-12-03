import { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export interface PDFOptions {
  clientName: string;
  loName: string;
  loTitle: string;
  loPhone: string;
  loEmail: string;
  loCompany: string;
  loNMLS: string;
}

interface PDFOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: PDFOptions) => void;
  isGenerating: boolean;
}

const STORAGE_KEY = 'loanOfficerInfo';

function getStoredLOInfo(): Partial<PDFOptions> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeLOInfo(info: Partial<PDFOptions>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Ignore storage errors
  }
}

export function PDFOptionsModal({ isOpen, onClose, onGenerate, isGenerating }: PDFOptionsModalProps) {
  const storedInfo = getStoredLOInfo();

  const [options, setOptions] = useState<PDFOptions>({
    clientName: '',
    loName: storedInfo.loName || '',
    loTitle: storedInfo.loTitle || 'Loan Officer',
    loPhone: storedInfo.loPhone || '',
    loEmail: storedInfo.loEmail || '',
    loCompany: storedInfo.loCompany || '',
    loNMLS: storedInfo.loNMLS || '',
  });

  const handleChange = (field: keyof PDFOptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = () => {
    // Store LO info for future use
    storeLOInfo({
      loName: options.loName,
      loTitle: options.loTitle,
      loPhone: options.loPhone,
      loEmail: options.loEmail,
      loCompany: options.loCompany,
      loNMLS: options.loNMLS,
    });
    onGenerate(options);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Generate PDF</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Client Information</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client Name</label>
              <input
                type="text"
                value={options.clientName}
                onChange={handleChange('clientName')}
                placeholder="John & Jane Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* LO Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Loan Officer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={options.loName}
                  onChange={handleChange('loName')}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={options.loTitle}
                  onChange={handleChange('loTitle')}
                  placeholder="Loan Officer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={options.loPhone}
                  onChange={handleChange('loPhone')}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={options.loEmail}
                  onChange={handleChange('loEmail')}
                  placeholder="jane@mortgage.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company</label>
                <input
                  type="text"
                  value={options.loCompany}
                  onChange={handleChange('loCompany')}
                  placeholder="ABC Mortgage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">NMLS #</label>
                <input
                  type="text"
                  value={options.loNMLS}
                  onChange={handleChange('loNMLS')}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Loan officer information is saved locally for future use.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
