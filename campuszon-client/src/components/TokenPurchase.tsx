import React from 'react';
import { TOKEN_PACKAGES, TokenPackage } from '../config/tokenPackages';

interface TokenPurchaseProps {
  onSelectPackage: (packageId: string) => void;
}

const TokenPurchase: React.FC<TokenPurchaseProps> = ({ onSelectPackage }) => {
  return (
    <div className="p-4 sm:p-6">
      {/* Token Packages Grid - No scrollbar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
          <div
            key={pkg.id}
            className={`relative group cursor-pointer transition-all duration-300 ${
              pkg.popular ? 'transform sm:scale-105' : ''
            }`}
            onClick={() => onSelectPackage(pkg.id)}
          >
            {/* Card */}
            <div className={`h-full border-2 rounded-xl p-4 transition-all duration-300 ${
              pkg.popular
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
            }`}>
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                    ⭐ POPULAR
                  </span>
                </div>
              )}

              {/* Best Value Badge */}
              {pkg.badge && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                    🔥 {pkg.badge}
                  </span>
                </div>
              )}

              {/* Token Icon & Count */}
              <div className="text-center mb-3">
                <div className="text-3xl mb-1">🎫</div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {pkg.tokens}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {pkg.tokens === 1 ? 'Token' : 'Tokens'}
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-3">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{pkg.price}
                </div>
                {pkg.pricePerToken && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ₹{pkg.pricePerToken.toFixed(1)}/token
                  </div>
                )}
              </div>

              {/* Savings Badge */}
              {pkg.savings && (
                <div className="text-center mb-3">
                  <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                    💰 {pkg.savings}
                  </span>
                </div>
              )}

              {/* Buy Button */}
              <button
                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPackage(pkg.id);
                }}
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">💡</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Quick Info:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>1 token = 1 unlock</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Never expires</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>2 free tokens for new users</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Bigger packs = better value</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
