import React from 'react';

interface TierComparisonProps {
  onUnlock: (useFreeCredit?: boolean) => void;
  freeCredits: number;
  loading?: boolean;
}

const TierComparison: React.FC<TierComparisonProps> = ({ 
  onUnlock, 
  freeCredits, 
  loading = false 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
        Unlock Seller Details
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        Get full access to contact the seller
      </p>

      {freeCredits > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-center">
          <span className="text-green-700 dark:text-green-400 font-semibold text-lg">
            🎁 You have {freeCredits} free unlock{freeCredits > 1 ? 's' : ''} remaining!
          </span>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            Use your free unlock at no cost
          </p>
        </div>
      )}

      <div className="border-2 border-blue-400 dark:border-blue-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 relative hover:shadow-xl transition-all">
        <div className="absolute -top-3 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          STANDARD PLAN
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Access</h3>
          <div className="mt-2">
            {freeCredits > 0 ? (
              <>
                <span className="text-4xl font-bold text-green-600 dark:text-green-400">FREE</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">₹11</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{freeCredits - 1} free unlock{freeCredits - 1 !== 1 ? 's' : ''} remaining after this</p>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">₹11</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">One-time payment</p>
              </>
            )}
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">👤 Seller's full name</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">🏠 Hostel & room number</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">📞 Phone number</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">📧 Email address</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-300">💬 Direct contact access</span>
          </li>
        </ul>

        <button
          onClick={() => onUnlock(freeCredits > 0)}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? 'Processing...' : freeCredits > 0 ? '🎁 Use Free Unlock' : 'Unlock for ₹11'}
        </button>

        {freeCredits === 0 && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            💡 New users get 2 free unlocks!
          </p>
        )}
      </div>
    </div>
  );
};

export default TierComparison;
