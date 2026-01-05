import React from 'react';
import { TOKEN_PACKAGES, TokenPackage } from '../config/tokenPackages';

interface TokenPurchaseProps {
  onSelectPackage: (packageId: string) => void;
  currentTokens: number;
}

const TokenPurchase: React.FC<TokenPurchaseProps> = ({ onSelectPackage, currentTokens }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Purchase Unlock Tokens
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You have <span className="font-bold text-green-600">{currentTokens} tokens</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          1 token = unlock any item instantly
        </p>
      </div>

      {/* Token Packages Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
        {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
          <div
            key={pkg.id}
            className={`relative border-2 rounded-lg sm:rounded-xl p-3 sm:p-5 cursor-pointer transition-all hover:shadow-xl ${
              pkg.popular
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg md:scale-105'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
            onClick={() => onSelectPackage(pkg.id)}
          >
            {/* Popular Badge */}
            {pkg.popular && (
              <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  POPULAR
                </span>
              </div>
            )}

            {/* Best Value Badge */}
            {pkg.badge && (
              <div className="absolute -top-2 sm:-top-3 right-1 sm:right-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {pkg.badge}
                </span>
              </div>
            )}

            {/* Token Count */}
            <div className="text-center mb-2 sm:mb-3">
              <div className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {pkg.tokens}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Token{pkg.tokens > 1 ? 's' : ''}
              </div>
            </div>

            {/* Package Name */}
            <h4 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white text-center mb-1 sm:mb-2">
              {pkg.name}
            </h4>

            {/* Description - Hide on mobile */}
            <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
              {pkg.description}
            </p>

            {/* Price */}
            <div className="text-center mb-2 sm:mb-3">
              <div className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                ₹{pkg.price}
              </div>
              {pkg.pricePerToken && (
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  ₹{pkg.pricePerToken.toFixed(2)}/token
                </div>
              )}
            </div>

            {/* Savings */}
            {pkg.savings && (
              <div className="text-center mb-2">
                <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  Save {pkg.savings}
                </span>
              </div>
            )}

            {/* Buy Button */}
            <button
              className={`w-full mt-2 sm:mt-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-base font-semibold transition-colors ${
                pkg.popular
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPackage(pkg.id);
              }}
            >
              <span className="hidden sm:inline">Purchase Now</span>
              <span className="sm:hidden">Buy</span>
            </button>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Use 1 token to unlock any item's full seller contact info</li>
              <li>• Tokens never expire and can be used anytime</li>
              <li>• New users get 2 free tokens to start!</li>
              <li>• Bigger packs = better value per token</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
