import React, { useState } from 'react';
import axios from '../config/axios';

interface ReportImageButtonProps {
  itemId: string;
  imageUrl: string;
  onReported?: () => void;
}

const ReportImageButton: React.FC<ReportImageButtonProps> = ({
  itemId,
  imageUrl,
  onReported
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = [
    { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
    { value: 'PORNOGRAPHIC', label: 'Pornographic/Sexual Content' },
    { value: 'VIOLENT', label: 'Violent or Disturbing' },
    { value: 'OFFENSIVE', label: 'Offensive/Hate Content' },
    { value: 'FAKE', label: 'Fake or Misleading' },
    { value: 'SPAM', label: 'Spam/Advertisement' }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/api/moderation/report/${itemId}`, {
        imageUrl,
        reason: selectedReason,
        comments
      });

      alert('Image reported successfully. Our moderation team will review it.');
      setShowModal(false);
      setSelectedReason('');
      setComments('');
      
      if (onReported) {
        onReported();
      }
    } catch (error: any) {
      alert(
        error.response?.data?.message || 'Failed to report image. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
        title="Report inappropriate image"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Report Image</h3>

            <p className="text-gray-600 mb-4 text-sm">
              Help us maintain a safe marketplace. Select why you're reporting this
              image.
            </p>

            <div className="space-y-3 mb-4">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={3}
                placeholder="Provide more details about why you're reporting this image..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedReason}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReason('');
                  setComments('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              False reports may result in account restrictions. All reports are
              logged and reviewed by our moderation team.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportImageButton;
