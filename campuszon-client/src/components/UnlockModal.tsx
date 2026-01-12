import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import UnlockConfirmationModal from './UnlockConfirmationModal';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  itemPrice?: number;
  sellerName?: string;
  onUnlockSuccess: (sellerInfo: any) => void;
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
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkTokenBalance();
      checkSkipConfirmation();
    }
  }, [isOpen]);

  const checkTokenBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenBalance(response.data.currentTokens);
    } catch (error) {
      console.error('Error checking token balance:', error);
    }
  };

  const checkSkipConfirmation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkipConfirmation(response.data.user.skipUnlockConfirmation || false);
    } catch (error) {
      console.error('Error checking skip confirmation:', error);
    }
  };

  const handleUnlockClick = () => {
    if (tokenBalance < 1) {
      alert('⚠️ Insufficient tokens! Please top up to unlock.');
      onClose();
      navigate('/');
      return;
    }

    // Show confirmation popup if not skipped
    if (!skipConfirmation) {
      setShowConfirmation(true);
    } else {
      performUnlock();
    }
  };

  const handleConfirmUnlock = async (dontShowAgain: boolean) => {
    setShowConfirmation(false);
    
    // Save preference if user checked "don't show again"
    if (dontShowAgain) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          '/api/user/preferences',
          { skipUnlockConfirmation: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSkipConfirmation(true);
      } catch (error) {
        console.error('Error saving preference:', error);
      }
    }

    performUnlock();
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const performUnlock = async () => {
    if (tokenBalance < 1) {
      alert('⚠️ Insufficient tokens! Please top up to unlock.');
      onClose();
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/unlock/items/${itemId}/unlock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onUnlockSuccess(response.data.sellerInfo);
        onClose();
        alert(`✅ Item unlocked! You have ${response.data.remainingTokens} tokens left.`);
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      const message = error.response?.data?.message || 'Failed to unlock. Please try again.';
      alert(message);
      
      if (message.includes('Insufficient tokens')) {
        onClose();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unlock Item</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {/* Token Balance */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎫</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Token Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tokenBalance} tokens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unlocking</p>
            <p className="font-semibold text-gray-900 dark:text-white">{itemTitle}</p>
          </div>

          {/* What you'll get */}
          <div className="mb-6">
            <p className="font-semibold text-gray-900 dark:text-white mb-3">You'll get access to:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> Seller's full name
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> Phone number
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> Email address
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> Hostel & room details
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> Direct chat access
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUnlockClick}
              disabled={loading || tokenBalance < 1}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                loading || tokenBalance < 1
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unlocking...
                </span>
              ) : tokenBalance < 1 ? (
                '⚠️ Insufficient Tokens'
              ) : (
                '🎫 Unlock with 1 Token'
              )}
            </button>

            {tokenBalance < 1 && (
              <button
                onClick={() => { onClose(); navigate('/'); }}
                className="w-full py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition"
              >
                Top Up Tokens
              </button>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            {tokenBalance >= 1 
              ? `After unlock, you'll have ${tokenBalance - 1} token(s) remaining`
              : 'You need tokens to unlock seller details'}
          </p>
        </div>
      </div>
    </div>,
        document.body
      )}

      <UnlockConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmUnlock}
        onCancel={handleCancelConfirmation}
        itemTitle={itemTitle}
      />
    </>
  );
};

export default UnlockModal;
