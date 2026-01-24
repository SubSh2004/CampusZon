import React, { memo } from 'react';
import { TOKEN_PACKAGES, TokenPackage } from '../config/tokenPackages';

interface TokenPurchaseProps {
  onSelectPackage: (packageId: string) => void;
  isProcessing?: boolean;
}

const TokenPurchase: React.FC<TokenPurchaseProps> = memo(({ onSelectPackage, isProcessing = false }) => {
  return (
    <div className="p-4 sm:p-6">
      {/* Token Packages Grid - Compact layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
        {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
          <TokenCard
            key={pkg.id}
            pkg={pkg}
            onSelect={onSelectPackage}
            isDisabled={isProcessing}
          />
        ))}
      </div>

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800">
        <div className="flex items-start gap-2">
          <div className="text-xl flex-shrink-0">💡</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 text-xs">Quick Info:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>1 token = 1 unlock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Never expires</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>2 free tokens for new users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Bigger packs = better value</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TokenPurchase.displayName = 'TokenPurchase';

// Memoized Token Card Component for better performance
interface TokenCardProps {
  pkg: TokenPackage;
  onSelect: (packageId: string) => void;
  isDisabled: boolean;
}

const TokenCard: React.FC<TokenCardProps> = memo(({ pkg, onSelect, isDisabled }) => {
  const handleClick = () => {
    if (!isDisabled) {
      onSelect(pkg.id);
    }
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        pkg.popular ? 'transform sm:scale-105' : ''
      } ${isDisabled ? 'opacity-60 pointer-events-none' : 'hover:scale-105 active:scale-95'}`}
      onClick={handleClick}
      style={{ willChange: 'transform' }}
    >
      {/* Compact Card */}
      <div className={`h-full border-2 rounded-lg p-2.5 sm:p-3 transition-all duration-200 ${
        pkg.popular
          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
      }`}>
        {/* Popular Badge - Smaller */}
        {pkg.popular && (
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 z-10">
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
              ⭐ POPULAR
            </span>
          </div>
        )}

        {/* Best Value Badge - Smaller */}
        {pkg.badge && (
          <div className="absolute -top-1.5 -right-1.5 z-10">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
              🔥 {pkg.badge}
            </span>
          </div>
        )}

        {/* Token Icon & Count - Compact */}
        <div className="text-center mb-2">
          <div className="text-2xl mb-0.5">🎫</div>
          <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            {pkg.tokens}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            {pkg.tokens === 1 ? 'Token' : 'Tokens'}
          </div>
        </div>

        {/* Price - Compact */}
        <div className="text-center mb-2">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            ₹{pkg.price}
          </div>
          {pkg.pricePerToken && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              ₹{pkg.pricePerToken.toFixed(1)}/token
            </div>
          )}
        </div>

        {/* Savings Badge - Compact */}
        {pkg.savings && (
          <div className="text-center mb-2">
            <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              💰 {pkg.savings}
            </span>
          </div>
        )}

        {/* Buy Button - Compact with animations */}
        <button
          className={`w-full py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all duration-200 ${
            pkg.popular
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
          } active:scale-95 disabled:opacity-50`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isDisabled}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
});

TokenCard.displayName = 'TokenCard';

export default TokenPurchase;
