import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface UnlockConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
  itemTitle: string;
}

const UnlockConfirmationModal: React.FC<UnlockConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  itemTitle,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Before You Unlock
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please read this important information
              </p>
            </div>
          </div>

          {/* Item Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unlocking</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">{itemTitle}</p>
          </div>

          {/* Important Information */}
          <div className="mb-6 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-amber-500">📋</span>
                Important Information
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>
                    Unlocking this item <strong>does NOT guarantee a confirmed booking</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>
                    After unlocking, you must <strong>interact with the seller</strong> to confirm and finalize the booking.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>
                    If the seller <strong>rejects your booking request</strong> or if the <strong>booking is cancelled</strong>:
                  </span>
                </li>
              </ul>
            </div>

            {/* Refund Policy */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-green-500">💰</span>
                Refund Policy
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>
                    You will receive a <strong className="text-green-600 dark:text-green-400">0.5 token refund</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>
                    The item will remain <strong>unlocked</strong> for future access
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Don't Show Again Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Don't show this confirmation again
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(dontShowAgain)}
              className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition transform hover:scale-105"
            >
              🎫 Unlock with 1 Token
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            By proceeding, you agree to these terms and conditions
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UnlockConfirmationModal;
