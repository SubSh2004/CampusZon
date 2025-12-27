import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PaymentSuccessState {
  paymentId: string;
  orderId: string;
  amount: number;
  itemTitle: string;
  sellerInfo?: {
    name: string;
    hostel: string;
    email: string;
    phone: string;
  };
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentSuccessState;

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your payment has been processed successfully
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <h2 className="text-2xl font-semibold">Transaction Details</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Item</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {state.itemTitle}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Payment ID</span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {state.paymentId}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Order ID</span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {state.orderId}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Amount Paid</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-xl">
                ₹{state.amount}
              </span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Success
              </span>
            </div>
          </div>
        </div>

        {/* Seller Information Card */}
        {state.sellerInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-semibold">Seller Contact Information</h2>
              <p className="text-blue-100 mt-1">You can now contact the seller</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {state.sellerInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {state.sellerInfo.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {state.sellerInfo.hostel}
                  </div>
                </div>
              </div>

              {state.sellerInfo.email && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-500"
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
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                    <a
                      href={`mailto:${state.sellerInfo.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {state.sellerInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {state.sellerInfo.phone && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                    <a
                      href={`tel:${state.sellerInfo.phone}`}
                      className="text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                      {state.sellerInfo.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => navigate('/bookings')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg
                     shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200
                     flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                     text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg border-2
                     border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transform
                     hover:scale-[1.02] transition-all duration-200"
          >
            Continue Shopping
          </button>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Next Steps
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                ✅ Payment successful! The item has been automatically booked for you. A confirmation email has been sent. 
                You can now contact the seller to arrange the purchase or rental. Check your bookings to see the details.
              </p>
            </div>
          </div>
        </div>

        {/* Download Receipt */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
