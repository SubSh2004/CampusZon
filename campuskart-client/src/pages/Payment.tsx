import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import TestCardHelper from '../components/TestCardHelper';

interface PaymentDetails {
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  sellerName: string;
  amount: number;
  tier?: 'basic' | 'premium' | 'standard';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentDetails = location.state as PaymentDetails;

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState({
    card: true,
    upi: true,
    netbanking: true,
    wallet: true,
  });
  const [userDetails, setUserDetails] = useState({
    name: localStorage.getItem('username') || '',
    email: localStorage.getItem('email') || '',
    phone: '',
  });

  useEffect(() => {
    if (!paymentDetails) {
      navigate('/');
      return;
    }
    loadRazorpayScript();
  }, [paymentDetails, navigate]);

  const loadRazorpayScript = () => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const autoBookItem = async (token: string) => {
    try {
      console.log('🎫 Auto-booking item:', paymentDetails.itemId);
      const response = await axios.post(
        '/api/bookings',
        {
          itemId: paymentDetails.itemId,
          message: `I want to purchase "${paymentDetails.itemTitle}" for ₹${paymentDetails.itemPrice}. Payment completed successfully.`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Item auto-booked successfully:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Auto-booking error:', error.response?.data || error.message);
      // Don't throw error - payment was successful, booking is bonus
      return false;
    }
  };

  const createOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/unlock/items/${paymentDetails.itemId}/unlock`,
        { useFreeCredit: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.requiresPayment) {
        return {
          order: response.data.order,
          paymentId: response.data.payment,
        };
      }
      return null;
    } catch (error: any) {
      console.error('Order creation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  };

  const verifyPayment = async (razorpayResponse: any, paymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/unlock/payment/verify',
        {
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          paymentId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Auto-book the item after successful payment
      if (response.data.success) {
        console.log('💳 Payment verified, auto-booking item...');
        const booked = await autoBookItem(token);
        console.log('📋 Booking result:', booked ? 'Success' : 'Failed');
      }

      return response.data;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order
      const orderData = await createOrder();
      if (!orderData) {
        alert('Unable to create payment order');
        setLoading(false);
        return;
      }

      const { order, paymentId } = orderData;

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'CampusKart',
        description: `Unlock: ${paymentDetails.itemTitle}`,
        image: '/logo.png', // Add your logo
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const result = await verifyPayment(response, paymentId);
            if (result.success) {
              // Payment successful
              navigate('/payment-success', {
                state: {
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: order.amount / 100,
                  itemTitle: paymentDetails.itemTitle,
                  sellerInfo: result.sellerInfo,
                },
              });
            }
          } catch (error: any) {
            navigate('/payment-failed', {
              state: { error: error.message },
            });
          }
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        notes: {
          itemId: paymentDetails.itemId,
          itemTitle: paymentDetails.itemTitle,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log('Payment cancelled by user');
          },
        },
        config: {
          display: {
            blocks: {
              card: { name: 'Pay using Card', instruments: paymentMethods.card ? [] : undefined },
              upi: { name: 'UPI', instruments: paymentMethods.upi ? [] : undefined },
              netbanking: {
                name: 'Netbanking',
                instruments: paymentMethods.netbanking ? [] : undefined,
              },
              wallet: { name: 'Wallet', instruments: paymentMethods.wallet ? [] : undefined },
            },
            sequence: ['block.card', 'block.upi', 'block.netbanking', 'block.wallet'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        navigate('/payment-failed', {
          state: {
            error: response.error.description,
            reason: response.error.reason,
          },
        });
      });
      razorpay.open();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (!paymentDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure payment powered by Razorpay
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-100">Item</span>
                <span className="font-medium">{paymentDetails.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Seller</span>
                <span className="font-medium">{paymentDetails.sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Item Price</span>
                <span className="font-medium">₹{paymentDetails.itemPrice}</span>
              </div>
              <div className="border-t border-blue-400 pt-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Unlock Fee</span>
                  <span className="font-bold">₹{paymentDetails.amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Details Form */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={userDetails.name}
                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={userDetails.phone}
                  onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={handlePayment}
              disabled={loading || !userDetails.name || !userDetails.email}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-lg
                       font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `Pay ₹${paymentDetails.amount} Securely`
              )}
            </button>

            <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Payment
              </span>
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
                Powered by Razorpay
              </span>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">256-bit SSL</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Encrypted</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">💯</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">100% Secure</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">PCI Compliant</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Instant</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Confirmation</div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            ← Back to Item
          </button>
        </div>

        {/* Test Card Helper (only in development) */}
        <TestCardHelper />
      </div>
    </div>
  );
};

export default Payment;
