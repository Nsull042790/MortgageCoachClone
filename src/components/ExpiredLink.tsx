import { ClockIcon } from '@heroicons/react/24/outline';

interface ExpiredLinkProps {
  clientName?: string | null;
}

export function ExpiredLink({ clientName }: ExpiredLinkProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Logo */}
        <img
          src="https://lirp.cdn-website.com/e49062f7/dms3rep/multi/opt/Luminatebank_PrimaryLogo_Color-1920w.jpg"
          alt="Luminate Bank Logo"
          className="h-12 w-auto mx-auto mb-6"
          crossOrigin="anonymous"
        />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#fef3c7' }}
        >
          <ClockIcon className="w-8 h-8 text-amber-600" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Link Expired
        </h1>

        <p className="text-gray-600 mb-6">
          {clientName ? (
            <>Hi {clientName}, this</>
          ) : (
            <>This</>
          )} loan comparison link has expired and is no longer available.
        </p>

        {/* What to do */}
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">What you can do:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Contact your loan officer for an updated comparison
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Request a new link to be sent to you
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Visit our website for more information
            </li>
          </ul>
        </div>

        {/* Contact CTA */}
        <a
          href="https://www.luminatebank.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 px-6 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#0d173c' }}
        >
          Visit Luminate Bank
        </a>
      </div>
    </div>
  );
}
