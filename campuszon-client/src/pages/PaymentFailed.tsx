import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PaymentFailedState {
  error?: string;
  reason?: string;
}

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentFailedState;

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  const getErrorMessage = () => {
    if (state?.error) {
      return state.error;
    }
    if (state?.reason) {
      return state.reason;
    }
    return 'An unexpected error occurred during payment processing.';
  };

  const getHelpfulTips = () => {
    const tips = [
      'Ensure you have sufficient balance in your account',
      'Check if your card/UPI is active and not expired',
      'Verify that you entered correct payment details',
      'Try using a different payment method',
      'Contact your bank if the issue persists',
    ];
    return tips;
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Failed Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500 rounded-full mb-6 animate-pulse">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We couldn't process your payment
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white">
            <h2 className="text-2xl font-semibold">What went wrong?</h2>
          </div>

          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                    Error Details
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300">{getErrorMessage()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Common reasons for payment failure:
              </h3>
              <ul className="space-y-2">
                {getHelpfulTips().map((tip, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg
                     shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200
                     flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg border-2
                     border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transform
                     hover:scale-[1.02] transition-all duration-200"
          >
            Back to Home
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you continue to experience issues, please contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="mailto:support@campuszon.com"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700
                             text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email Support
                  </a>
                  <button
                    onClick={() => navigate('/help')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700
                             hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white
                             font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Help Center
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assurance Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 No money was deducted from your account
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
