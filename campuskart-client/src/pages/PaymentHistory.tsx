import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

interface UnlockRecord {
  unlockId: string;
  tier?: string;
  amount: number;
  isFreeCredit?: boolean;
  unlockedAt: string;
  messageCount?: number;
  messageLimit?: number;
  item?: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
  } | null;
}

const PaymentHistory: React.FC = () => {
  const [unlocks, setUnlocks] = useState<UnlockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUnlocks();
  }, []);

  const fetchUnlocks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/unlock/user/unlocks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnlocks(response.data.unlocks || []);
    } catch (error) {
      console.error('Error fetching unlocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierLabel = (tier?: string) => {
    if (!tier) return 'Unlock';
    if (tier === 'basic') return 'Basic Unlock';
    if (tier === 'premium') return 'Premium Unlock';
    return tier.charAt(0).toUpperCase() + tier.slice(1) + ' Unlock';
  };

  const filteredUnlocks = unlocks.filter((unlock) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      unlock.item?.title?.toLowerCase().includes(search) ||
      unlock.tier?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: unlocks.length,
    totalSpent: unlocks.reduce((sum, u) => sum + (u.amount || 0), 0),
    freeCredits: unlocks.filter((u) => u.isFreeCredit).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading unlock history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your unlocks and credits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Unlocks</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Free Credits Used</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.freeCredits}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{stats.totalSpent}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by item or tier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Unlock List */}
        {filteredUnlocks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No unlocks found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search term'
                : "You haven't unlocked any items yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUnlocks.map((unlock) => (
              <div
                key={unlock.unlockId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Item Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {unlock.item?.title || 'Unknown Item'}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-xs mt-1">
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                              {getTierLabel(unlock.tier)}
                            </span>
                            {unlock.isFreeCredit && (
                              <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-medium">
                                Free Credit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Unlock Details */}
                    <div className="lg:text-right space-y-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{unlock.amount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(unlock.unlockedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-3">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>View Details</span>
                      <svg
                        className="w-5 h-5 transform group-open:rotate-180 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Unlock ID:</span>
                        <span className="text-gray-900 dark:text-white font-mono text-xs">
                          {unlock.unlockId}
                        </span>
                      </div>
                      {unlock.item && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Item ID:</span>
                          <span className="text-gray-900 dark:text-white font-mono text-xs">
                            {unlock.item.id}
                          </span>
                        </div>
                      )}
                      {unlock.messageLimit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Message Limit:</span>
                          <span className="text-gray-900 dark:text-white">{unlock.messageLimit}</span>
                        </div>
                      )}
                      {unlock.messageCount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Messages Used:</span>
                          <span className="text-gray-900 dark:text-white">{unlock.messageCount}</span>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
