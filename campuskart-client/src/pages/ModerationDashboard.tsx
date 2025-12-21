import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

interface ModerationStats {
  pending: number;
  reviewing: number;
  flagged: number;
  approved: number;
  rejected: number;
  usersWarned: number;
  usersSuspended: number;
  usersBanned: number;
  reportedImages: number;
}

interface PendingImage {
  _id: string;
  imageUrl: string;
  status: string;
  aiScores: Record<string, number>;
  detectedLabels: string[];
  reportCount: number;
  createdAt: string;
  rejectionReasons?: string[];
  notes?: string;
  itemId: {
    _id: string;
    title: string;
    category: string;
    userName: string;
    userEmail: string;
  };
}

const ModerationDashboard: React.FC = () => {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PendingImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlurred, setShowBlurred] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'violations'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [reverseAction, setReverseAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchStats();
    fetchImages();
  }, [activeTab, searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/moderation/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPendingImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/moderation/pending');
      setPendingImages(response.data.images);
    } catch (error) {
      console.error('Failed to fetch pending images:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      if (activeTab === 'pending') {
        endpoint = `/api/moderation/pending?search=${searchTerm}`;
      } else if (activeTab === 'violations') {
        return; // Handle violations separately
      } else {
        endpoint = `/api/moderation/images?status=${activeTab.toUpperCase()}&search=${searchTerm}`;
      }
      
      const response = await axios.get(endpoint);
      setPendingImages(response.data.images);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (imageId: string) => {
    try {
      await axios.post(`/api/moderation/${imageId}/approve`, {
        notes: actionNotes
      });
      alert('Image approved successfully');
      setActionNotes('');
      setSelectedImage(null);
      setReverseAction(null);
      fetchImages();
      fetchStats();
    } catch (error: any) {
      alert('Failed to approve image: ' + error.response?.data?.message);
    }
  };

  const handleReject = async (imageId: string, reasons: string[]) => {
    try {
      await axios.post(`/api/moderation/${imageId}/reject`, {
        reasons,
        notes: actionNotes,
        addViolation: true
      });
      alert('Image rejected and violation recorded');
      setActionNotes('');
      setSelectedImage(null);
      setReverseAction(null);
      fetchImages();
      fetchStats();
    } catch (error: any) {
      alert('Failed to reject image: ' + error.response?.data?.message);
    }
  };

  const handleReverseDecision = async (imageId: string, newStatus: string) => {
    try {
      await axios.post(`/api/moderation/${imageId}/reverse`, {
        newStatus,
        notes: actionNotes
      });
      alert('Decision reversed successfully');
      setActionNotes('');
      setSelectedImage(null);
      setReverseAction(null);
      fetchImages();
      fetchStats();
    } catch (error: any) {
      alert('Failed to reverse decision: ' + error.response?.data?.message);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600 font-bold';
    if (score >= 0.4) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'HIGH RISK';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Image Moderation Dashboard
        </h1>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`bg-white rounded-lg shadow p-4 text-left transition ${activeTab === 'pending' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            >
              <div className="text-sm text-gray-500">Pending Review</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.reviewing + stats.flagged}
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('approved')}
              className={`bg-white rounded-lg shadow p-4 text-left transition ${activeTab === 'approved' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
            >
              <div className="text-sm text-gray-500">Approved</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('rejected')}
              className={`bg-white rounded-lg shadow p-4 text-left transition ${activeTab === 'rejected' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
            >
              <div className="text-sm text-gray-500">Rejected</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </div>
            </button>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">User Reports</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.reportedImages}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Users Warned</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.usersWarned}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Suspended</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.usersSuspended}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Banned</div>
              <div className="text-2xl font-bold text-red-700">
                {stats.usersBanned}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title, user name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tab Title */}
        <h2 className="text-2xl font-semibold mb-4 capitalize">
          {activeTab === 'pending' ? 'Pending Review' : activeTab} Images
        </h2>

        {/* Pending Images Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Pending Images ({pendingImages.length})
          </h2>

          {pendingImages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No images pending review
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingImages.map((image) => (
                <div
                  key={image._id}
                  className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  {/* Image Preview */}
                  <div className="relative mb-3">
                    <img
                      src={`/api/moderation/${image._id}/preview?blur=${showBlurred}`}
                      alt="Pending moderation"
                      className="w-full h-48 object-cover rounded"
                    />
                    {image.reportCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {image.reportCount} Reports
                      </span>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="mb-2">
                    <div className="font-semibold truncate">
                      {image.itemId?.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {image.itemId?.category}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {image.itemId?.userName}
                    </div>
                  </div>

                  {/* AI Scores */}
                  <div className="space-y-1 text-sm">
                    {Object.entries(image.aiScores || {})
                      .filter(([key, value]) => value > 0.2)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className={getScoreColor(value)}>
                            {(value * 100).toFixed(0)}% - {getScoreLabel(value)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Labels */}
                  {image.detectedLabels && image.detectedLabels.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Detected:</div>
                      <div className="flex flex-wrap gap-1">
                        {image.detectedLabels.slice(0, 5).map((label, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-200 px-2 py-0.5 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Rejection Reasons */}
                  {image.rejectionReasons && image.rejectionReasons.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs font-semibold text-red-700 mb-1">⚠️ AI Flagged:</div>
                      <div className="space-y-1">
                        {image.rejectionReasons.map((reason, idx) => (
                          <div key={idx} className="text-xs text-red-600">
                            • {reason.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Notes */}
                  {image.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-xs font-semibold text-yellow-700 mb-1">📝 Note:</div>
                      <div className="text-xs text-yellow-600">{image.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Detail Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold">Image Review</h3>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Image Preview with Blur Toggle */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showBlurred}
                        onChange={(e) => setShowBlurred(e.target.checked)}
                        className="mr-2"
                      />
                      Blur Preview (for safety)
                    </label>
                  </div>
                  <img
                    src={`/api/moderation/${selectedImage._id}/preview?blur=${showBlurred}`}
                    alt="Review"
                    className="w-full max-h-96 object-contain rounded border"
                  />
                </div>

                {/* Item Details */}
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-bold mb-2">Listing Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Title: {selectedImage.itemId?.title}</div>
                    <div>Category: {selectedImage.itemId?.category}</div>
                    <div>User: {selectedImage.itemId?.userName}</div>
                    <div>Email: {selectedImage.itemId?.userEmail}</div>
                  </div>
                </div>

                {/* AI Scores */}
                <div className="mb-4">
                  <h4 className="font-bold mb-2">AI Moderation Scores</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedImage.aiScores || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="capitalize">{key}</span>
                          <span className={getScoreColor(value)}>
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Detected Labels */}
                {selectedImage.detectedLabels &&
                  selectedImage.detectedLabels.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Detected Objects/Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedImage.detectedLabels.map((label, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Moderator Notes */}
                <div className="mb-4">
                  <label className="block font-bold mb-2">Moderator Notes</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full border rounded p-2"
                    rows={3}
                    placeholder="Add notes about your decision..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedImage._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
                      >
                        ✓ Approve Image
                      </button>
                      <button
                        onClick={() =>
                          handleReject(selectedImage._id, ['INAPPROPRIATE'])
                        }
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
                      >
                        ✕ Reject & Add Violation
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'approved' && (
                    <button
                      onClick={() => handleReverseDecision(selectedImage._id, 'REJECTED')}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
                    >
                      ✕ Reverse - Reject Image
                    </button>
                  )}
                  
                  {activeTab === 'rejected' && (
                    <button
                      onClick={() => handleReverseDecision(selectedImage._id, 'APPROVED')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
                    >
                      ✓ Reverse - Approve Image
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
