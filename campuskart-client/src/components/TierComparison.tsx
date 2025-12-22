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

const TierComparison: React.FC<TierComparisonProps> = ({ 
  onSelectTier, 
  freeCredits, 
  hasBasicUnlock = false,
  loading = false 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">
        Unlock Seller Contact
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Choose your access level to contact the seller
      </p>

      {freeCredits > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
          <span className="text-green-700 font-semibold">
            🎁 You have {freeCredits} free unlock{freeCredits > 1 ? 's' : ''} remaining!
          </span>
          <p className="text-sm text-green-600 mt-1">
            Use a free unlock on Basic tier at no cost
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Tier */}
        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition-all">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Basic</h3>
            <div className="mt-2">
              {freeCredits > 0 ? (
                <>
                  <span className="text-3xl font-bold text-green-600">FREE</span>
                  <p className="text-sm text-gray-500 line-through">₹10</p>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">₹10</span>
              )}
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">See seller's full name</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">See hostel & room number</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">Contact seller details</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">✓ Verified Inquiry badge</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-400">No phone number</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-400">No email</span>
            </li>
          </ul>

          <button
            onClick={() => onSelectTier('basic', freeCredits > 0)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : freeCredits > 0 ? 'Use Free Unlock' : 'Unlock Basic - ₹10'}
          </button>
        </div>

        {/* Premium Tier */}
        <div className="border-2 border-purple-400 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50 relative hover:shadow-xl transition-all">
          <div className="absolute -top-3 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            POPULAR
          </div>

          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Premium</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-purple-600">
                {hasBasicUnlock ? '₹15' : '₹25'}
              </span>
              {hasBasicUnlock && (
                <p className="text-sm text-gray-500">Upgrade from Basic</p>
              )}
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700 font-semibold">Everything in Basic, plus:</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">📞 Phone number</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">📧 Email address</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">💬 Direct contact access</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">⭐ Premium Buyer badge</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">🎯 Priority in seller's inbox</span>
            </li>
          </ul>

          <button
            onClick={() => onSelectTier('premium')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Processing...' : hasBasicUnlock ? 'Upgrade to Premium - ₹15' : 'Unlock Premium - ₹25'}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 Tip: Premium buyers get 3x faster response rates from sellers</p>
        <p className="mt-1">🔒 Secure payment powered by Razorpay</p>
      </div>
    </div>
  );
};

export default TierComparison;
