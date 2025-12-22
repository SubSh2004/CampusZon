import { useState } from 'react';
import axios from 'axios';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';

interface ReportButtonProps {
  itemId: string;
  itemTitle: string;
}

export default function ReportButton({ itemId, itemTitle }: ReportButtonProps) {
  const user = useRecoilValue(userAtom);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 Report Submit - Start');
    console.log('Reason:', reason);
    console.log('Description:', description);
    console.log('Item ID:', itemId);
    console.log('User:', { userId: user.userId, userName: user.username, userEmail: user.email });
    
    if (!reason) {
      console.warn('⚠️ No reason selected');
      setMessage('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Sending report request...');
      
      const response = await axios.post(`/api/items/${itemId}/report`, {
        userId: user.userId,
        userName: user.username,
        userEmail: user.email,
        reason,
        description
      });

      console.log('✅ Report response:', response.data);

      if (response.data.success) {
        setMessage('Thank you! Your report has been submitted to the admin.');
        setTimeout(() => {
          setShowModal(false);
          setReason('');
          setDescription('');
          setMessage('');
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Report error:', error);
      console.error('Error response:', error.response?.data);
      setMessage(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
      console.log('🔍 Report Submit - End');
    }
  };

  const handleModalClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs sm:text-sm"
        title="Report this item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <span className="hidden sm:inline">Report</span>
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-[9999]" 
          onClick={handleModalClose}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ isolation: 'isolate' }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative z-10" 
            onClick={handleModalContentClick}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Report Item</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You're reporting: <strong>{itemTitle}</strong>
            </p>

            {message && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                message.includes('Thank you') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} onClick={handleModalContentClick} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for reporting *
                </label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Spam">Spam</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Scam or fraud">Scam or fraud</option>
                  <option value="Prohibited item">Prohibited item</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Provide more details about why you're reporting this item..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowModal(false);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
