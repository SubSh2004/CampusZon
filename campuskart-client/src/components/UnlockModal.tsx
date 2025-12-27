import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import TierComparison from './TierComparison';
import axios from '../config/axios';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  itemPrice?: number;
  sellerName?: string;
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
  itemPrice = 0,
  sellerName = 'Seller',
  onUnlockSuccess 
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [freeCredits, setFreeCredits] = useState(0);

  useEffect(() => {
    if (isOpen) {
      checkUnlockStatus();
    }
  }, [isOpen, itemId]);

  const checkUnlockStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/unlock/items/${itemId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFreeCredits(response.data.freeCredits);
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  };

  const handleUnlock = async (useFreeCredit?: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/unlock/items/${itemId}/unlock`,
        { useFreeCredit },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If free credit used, no payment needed
      if (response.data.success && !response.data.requiresPayment) {
        onUnlockSuccess(response.data.sellerInfo, 'standard');
        setFreeCredits(response.data.remainingCredits);
        onClose();
        return;
      }

      // If payment required, open Razorpay
      if (response.data.requiresPayment) {
        openRazorpay(response.data.order, response.data.payment);
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      alert(error.response?.data?.message || 'Failed to unlock. Please try again.');
      setLoading(false);
    }
  };
navigate to custom payment page
      if (response.data.requiresPayment) {
        onClose();
        navigate('/payment', {
          state: {
            itemId,
            itemTitle,
            itemPrice,
            sellerName,
            amount: 11, // Unlock fee
            tier: 'standard'
          }
        });
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      alert(error.response?.data?.message || 'Failed to unlock. Please try again.');onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold z-10"
          disabled={loading}
        >
          ×
        </button>

        <div className="p-6">
          <TierComparison
            onUnlock={handleUnlock}
            freeCredits={freeCredits}
            loading={loading}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UnlockModal;
