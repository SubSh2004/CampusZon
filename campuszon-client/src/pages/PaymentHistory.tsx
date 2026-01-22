import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';

interface PaymentRecord {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  type: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    itemTitle?: string;
    tokens?: number;
    tier?: string;
    sellerName?: string;
    packageId?: string;
  };
  item?: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
  } | null;
}

interface PaymentStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  totalSpent: number;
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/payment/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPayments(response.data.payments);
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError(err.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSlip = async (paymentId: string) => {
    try {
      setDownloadingId(paymentId);
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/payment/slip/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-slip-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading payment slip:', err);
      alert(err.response?.data?.message || 'Failed to download payment slip');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      refunded: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
    };
    const labels = {
      completed: '✓ Success',
      failed: '✗ Failed',
      pending: '⏳ Pending',
      refunded: '↺ Refunded'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentTypeLabel = (type: string, metadata: any) => {
    if (type === 'token_purchase') {
      return `Token Purchase (${metadata.tokens || 0} tokens)`;
    }
    if (type === 'unlock_basic' || type === 'unlock_premium') {
      return `${metadata.tier ? metadata.tier.charAt(0).toUpperCase() + metadata.tier.slice(1) : ''} Unlock`;
    }
    if (type === 'transaction') return 'Transaction';
    if (type === 'featured_listing') return 'Featured Listing';
    return type;
  };

  const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.transactionId?.toLowerCase().includes(search) ||
      payment.metadata.itemTitle?.toLowerCase().includes(search) ||
      payment.type.toLowerCase().includes(search) ||
      payment.status.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💳 Payment History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your transactions and download payment receipts
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successful}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Spent</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{stats.totalSpent}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by transaction ID, item, type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No payments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search term'
                : "You haven't made any payments yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Payment Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                            {payment.metadata.itemTitle || getPaymentTypeLabel(payment.type, payment.metadata)}
                          </h3>
                          <div className="flex flex-wrap gap-2 items-center">
                            {getStatusBadge(payment.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {payment.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <span className="font-medium mr-2">Transaction ID:</span>
                          <span className="font-mono text-xs">{payment.transactionId}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <span className="font-medium mr-2">Date:</span>
                          <span>
                            {new Date(payment.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="lg:text-right space-y-3">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{payment.amount.toFixed(2)}
                      </div>
                      
                      {payment.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadSlip(payment.id)}
                          disabled={downloadingId === payment.id}
                          className="w-full lg:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {downloadingId === payment.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Receipt
                            </>
                          )}
                        </button>
                      )}
                      
                      {payment.status === 'failed' && (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Payment failed - No receipt available
                        </div>
                      )}
                      
                      {payment.status === 'pending' && (
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          Payment pending - Receipt after completion
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {payment.metadata && Object.keys(payment.metadata).length > 0 && (
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
                          <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                          <span className="text-gray-900 dark:text-white font-mono text-xs">
                            {payment.id}
                          </span>
                        </div>
                        {payment.metadata.tokens && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                            <span className="text-gray-900 dark:text-white">{payment.metadata.tokens}</span>
                          </div>
                        )}
                        {payment.metadata.tier && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tier:</span>
                            <span className="text-gray-900 dark:text-white capitalize">{payment.metadata.tier}</span>
                          </div>
                        )}
                        {payment.metadata.sellerName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Seller:</span>
                            <span className="text-gray-900 dark:text-white">{payment.metadata.sellerName}</span>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
