import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import TokenPurchase from './TokenPurchase';

const TokensSection: React.FC = () => {
  const [tokens, setTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    fetchTokenBalance();
  }, []);

  const fetchTokenBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTokens(response.data.currentTokens);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseToken = async (packageId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to purchase tokens');
        return;
      }

      const response = await axios.post(
        '/api/tokens/purchase',
        { packageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.requiresPayment) {
        // Load Razorpay
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: response.data.order.amount,
            currency: response.data.order.currency,
            name: 'CampusZon',
            description: `${response.data.packageDetails.tokens} Unlock Tokens`,
            order_id: response.data.order.id,
            handler: async (razorpayResponse: any) => {
              try {
                const verifyResponse = await axios.post(
                  '/api/tokens/verify',
                  {
                    razorpay_order_id: razorpayResponse.razorpay_order_id,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                    paymentId: response.data.payment.id
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (verifyResponse.data.success) {
                  alert(`✅ Successfully added ${verifyResponse.data.tokensAdded} tokens!`);
                  setShowPurchaseModal(false);
                  fetchTokenBalance(); // Refresh balance
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                alert('Payment verification failed. Please contact support.');
              }
            },
            prefill: {
              name: localStorage.getItem('username') || '',
              email: localStorage.getItem('email') || '',
            },
            theme: {
              color: '#4F46E5'
            }
          };

          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        };
      }
    } catch (error: any) {
      console.error('Token purchase error:', error);
      alert(error.response?.data?.message || 'Failed to initiate purchase');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-lg p-3 shadow animate-pulse">
        <div className="h-12 bg-white/20 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-lg p-3 sm:p-4 shadow">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="text-white">
              <h3 className="text-xs font-medium opacity-90">Tokens</h3>
              <p className="text-xl sm:text-2xl font-bold">{tokens}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:scale-105 shadow flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Top Up
          </button>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Up Tokens</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <TokenPurchase onSelectPackage={handlePurchaseToken} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TokensSection;
