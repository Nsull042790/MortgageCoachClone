import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon, VideoCameraIcon, LinkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useLoan } from '../context/LoanContext';
import { generateShareableUrl } from '../utils/urlSharing';
import { generateTrackingId, saveTrackingId, getViewCount, formatRelativeTime } from '../utils/viewTracking';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shorten a URL using is.gd service
 */
async function shortenUrl(longUrl: string): Promise<string> {
  const response = await fetch(
    `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`
  );

  if (!response.ok) {
    throw new Error('Failed to shorten URL');
  }

  const data = await response.json();

  if (data.errorcode) {
    throw new Error(data.errormessage || 'Failed to shorten URL');
  }

  return data.shorturl;
}

/**
 * Extract Vimeo video ID from URL or return as-is if already an ID
 */
function extractVimeoId(input: string): string | null {
  if (!input.trim()) return null;

  // If it's just numbers, it's already an ID
  if (/^\d+$/.test(input.trim())) {
    return input.trim();
  }

  // Try to extract from various Vimeo URL formats
  // https://vimeo.com/123456789
  // https://player.vimeo.com/video/123456789
  // https://vimeo.com/channels/staffpicks/123456789
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[^/]+\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { currentScenario, updateTrackingId } = useLoan();
  const [clientName, setClientName] = useState('');
  const [vimeoInput, setVimeoInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // Use existing tracking ID from scenario, or generate a new one
  const trackingId = useMemo(() => {
    return currentScenario.trackingId || generateTrackingId();
  }, [currentScenario.trackingId]);

  // Save tracking ID to scenario if it's new
  useEffect(() => {
    if (!currentScenario.trackingId && trackingId) {
      updateTrackingId(trackingId);
    }
  }, [currentScenario.trackingId, trackingId, updateTrackingId]);

  // View count state
  const [viewCount, setViewCount] = useState<number>(0);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Fetch view count from API
  const fetchViewCount = async () => {
    if (!trackingId) return;
    setIsLoadingViews(true);
    try {
      const count = await getViewCount(trackingId);
      setViewCount(count);
      setLastChecked(new Date().toISOString());
    } catch (e) {
      console.warn('Failed to fetch view count:', e);
    } finally {
      setIsLoadingViews(false);
    }
  };

  // Fetch view count on mount and when modal opens
  useEffect(() => {
    if (isOpen && trackingId) {
      fetchViewCount();
    }
  }, [isOpen, trackingId]);

  // Auto-fill with client name from scenario
  useEffect(() => {
    if (currentScenario.clientName) {
      setClientName(currentScenario.clientName);
    }
  }, [currentScenario.clientName]);

  // Auto-fill with uploaded video's Vimeo ID when available
  useEffect(() => {
    if (currentScenario.videoMessage?.vimeoId) {
      setVimeoInput(currentScenario.videoMessage.vimeoId);
    }
  }, [currentScenario.videoMessage?.vimeoId]);

  // Reset short URL when inputs change
  useEffect(() => {
    setShortUrl(null);
    setShortenError(null);
  }, [clientName, vimeoInput, currentScenario.inputs, currentScenario.selectedLoanTypes]);

  // Refresh view count periodically when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchViewCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isOpen, trackingId]);

  if (!isOpen) return null;

  const vimeoId = extractVimeoId(vimeoInput);

  const shareableUrl = generateShareableUrl(
    currentScenario.inputs,
    currentScenario.selectedLoanTypes,
    clientName || undefined,
    vimeoId || undefined,
    trackingId
  );

  // Display URL - short or full
  const displayUrl = shortUrl || shareableUrl;

  const handleCopy = async () => {
    // Save tracking ID when copying the link
    saveTrackingId(trackingId, clientName || undefined);
    // Also save to the current scenario for persistence
    updateTrackingId(trackingId);

    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = displayUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShorten = async () => {
    if (shortUrl) {
      // Already shortened, reset to full URL
      setShortUrl(null);
      setShortenError(null);
      return;
    }

    setIsShortening(true);
    setShortenError(null);

    try {
      const shortened = await shortenUrl(shareableUrl);
      setShortUrl(shortened);
    } catch (err) {
      setShortenError(err instanceof Error ? err.message : 'Failed to shorten URL');
    } finally {
      setIsShortening(false);
    }
  };

  const handleEmailLink = () => {
    const subject = encodeURIComponent('Your Loan Comparison');
    const body = encodeURIComponent(
      `Hi${clientName ? ' ' + clientName : ''},\n\nI've prepared a loan comparison for you. Click the link below to view it:\n\n${displayUrl}\n\nLet me know if you have any questions!\n\nBest regards`
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

          {/* Vimeo Video (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <VideoCameraIcon className="w-4 h-4" />
                Video Message <span className="text-gray-400">(optional)</span>
              </span>
            </label>
            <input
              type="text"
              value={vimeoInput}
              onChange={(e) => setVimeoInput(e.target.value)}
              placeholder="Paste Vimeo URL or video ID"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                vimeoInput && !vimeoId ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {vimeoInput && !vimeoId ? (
                <span className="text-red-500">Invalid Vimeo URL or ID</span>
              ) : vimeoId ? (
                <span className="text-green-600">✓ Video ID: {vimeoId}</span>
              ) : (
                'Paste a Vimeo link to include a personalized video message'
              )}
            </p>
          </div>

          {/* Shareable Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shareable Link
              {shortUrl && <span className="ml-2 text-xs text-green-600">(shortened)</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={displayUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 truncate"
              />
              <button
                onClick={handleShorten}
                disabled={isShortening}
                className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors border hover:bg-gray-100 disabled:opacity-50"
                style={{
                  borderColor: shortUrl ? '#22c55e' : '#0d173c',
                  color: shortUrl ? '#22c55e' : '#0d173c'
                }}
                title={shortUrl ? 'Show full URL' : 'Shorten URL'}
              >
                {isShortening ? (
                  <span className="animate-pulse">...</span>
                ) : shortUrl ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Short
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Shorten
                  </>
                )}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: copied ? '#22c55e' : '#0d173c' }}
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
            {shortenError && (
              <p className="text-xs text-red-500 mt-1">{shortenError}</p>
            )}
          </div>

          {/* What's included */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">What's included in the link:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Home price, down payment, and loan amount</li>
              <li>• All selected loan types with rates</li>
              <li>• Monthly payment breakdown</li>
              <li>• Visual charts for comparison</li>
              {vimeoId && <li style={{ color: '#967db9' }}>• Your personalized video message</li>}
            </ul>
          </div>

          {/* View Tracking */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">View Tracking</span>
              <button
                onClick={fetchViewCount}
                disabled={isLoadingViews}
                className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                title="Refresh view count"
              >
                {isLoadingViews ? '...' : '↻'}
              </button>
            </div>
            <div className="text-right">
              <div>
                <span className="text-lg font-semibold" style={{ color: '#0d173c' }}>
                  {viewCount}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  view{viewCount !== 1 ? 's' : ''}
                </span>
                {lastChecked && (
                  <p className="text-xs text-gray-400">
                    Updated: {formatRelativeTime(lastChecked)}
                  </p>
                )}
              </div>
            </div>
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
