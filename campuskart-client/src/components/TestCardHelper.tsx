import React, { useState } from 'react';

const TestCardHelper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const testCards = [
    {
      name: 'Success Card',
      number: '4111 1111 1111 1111',
      cvv: '123',
      expiry: '12/25',
      description: 'Use this card for successful payments',
      color: 'green',
    },
    {
      name: 'Failure Card',
      number: '4000 0000 0000 0002',
      cvv: '123',
      expiry: '12/25',
      description: 'Use this card to test payment failures',
      color: 'red',
    },
  ];

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <span className="text-sm font-medium">Test Cards</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 w-80 border-2 border-blue-500">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="font-semibold">Test Cards (Dev Mode)</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {testCards.map((card, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${
              card.color === 'green'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{card.name}</h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  card.color === 'green'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {card.color === 'green' ? '✓ Success' : '✗ Fail'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{card.description}</p>

            <div className="space-y-2">
              {/* Card Number */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Card Number</div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white">{card.number}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(card.number.replace(/\s/g, ''), `${card.name}-number`)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {copied === `${card.name}-number` ? (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* CVV and Expiry */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">CVV</div>
                    <div className="font-mono text-sm text-gray-900 dark:text-white">{card.cvv}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(card.cvv, `${card.name}-cvv`)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {copied === `${card.name}-cvv` ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Expiry</div>
                    <div className="font-mono text-sm text-gray-900 dark:text-white">{card.expiry}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(card.expiry, `${card.name}-expiry`)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {copied === `${card.name}-expiry` ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> These test cards only work in TEST mode. No real money is charged.
              Click the copy icon to quickly copy values.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCardHelper;
