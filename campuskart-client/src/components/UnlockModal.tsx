import React, { useState, useEffect } from 'react';
import TierComparison from './TierComparison';
import axios from '../config/axios';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  onUnlockSuccess: (sellerInfo: any, tier: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const UnlockModal: React.FC<UnlockModalProps> = ({ 
  isOpen, 
  onClose, 
  itemId, 
  itemTitle,
  onUnlockSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [freeCredits, setFreeCredits] = useState(0);
  const [unlockStatus, setUnlockStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      checkUnlockStatus();
      loadRazorpayScript();
    }
  }, [isOpen, itemId]);

  const loadRazorpayScript = () => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const checkUnlockStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/unlock/items/${itemId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnlockStatus(response.data);
      setFreeCredits(response.data.freeCredits);
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  };

  const handleUnlock = async (tier: 'basic' | 'premium', useFreeCredit?: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = tier === 'basic' 
        ? `/api/unlock/items/${itemId}/unlock/basic`
        : `/api/unlock/items/${itemId}/unlock/premium`;

      const response = await axios.post(
        endpoint,
        { useFreeCredit },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If free credit used, no payment needed
      if (response.data.success && !response.data.requiresPayment) {
        onUnlockSuccess(response.data.sellerInfo, tier);
        setFreeCredits(response.data.remainingCredits);
        onClose();
        return;
      }

      // If payment required, open Razorpay
      if (response.data.requiresPayment) {
        openRazorpay(response.data.order, response.data.payment, tier);
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      alert(error.response?.data?.message || 'Failed to unlock. Please try again.');
      setLoading(false);
    }
  };

  const openRazorpay = (order: any, paymentId: string, tier: string) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
      amount: order.amount,
      currency: order.currency,
      name: 'Campus-Kart',
      description: `Unlock ${tier} tier - ${itemTitle}`,
      order_id: order.id,
      handler: async (response: any) => {
        await verifyPayment(response, paymentId, tier);
      },
      prefill: {
        name: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
      },
      theme: {
        color: '#3b82f6',
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifyPayment = async (razorpayResponse: any, paymentId: string, tier: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/unlock/payment/verify',
        {
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          paymentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onUnlockSuccess(response.data.sellerInfo, tier);
        onClose();
        alert('✅ Payment successful! You can now contact the seller.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      alert(error.response?.data?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
          disabled={loading}
        >
          ×
        </button>

        <div className="p-6">
          <TierComparison
            onSelectTier={handleUnlock}
            freeCredits={freeCredits}
            hasBasicUnlock={unlockStatus?.tier === 'basic'}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
