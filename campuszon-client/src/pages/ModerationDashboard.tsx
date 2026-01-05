import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';

interface Report {
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  description: string;
  createdAt: string;
}

interface Review {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  available: boolean;
  userName: string;
  userEmail: string;
  userPhone: string;
  reports: Report[];
  reportCount: number;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  moderationStatus: 'active' | 'warned' | 'removed';
  moderationNotes?: string;
  moderatedAt?: string;
  createdAt: string;
}

const ModerationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useRecoilValue(userAtom);
  const [activeTab, setActiveTab] = useState<'reported' | 'all'>('reported');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warned' | 'removed'>('all');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user.isLoggedIn || !user.isAdmin) {
      alert('Admin access required');
      navigate('/');
      return;
    }
    
    fetchItems();
  }, [activeTab, statusFilter, user.isLoggedIn, user.isAdmin, navigate]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'reported' ? '/api/items/reported' : '/api/items/admin/all';
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        let fetchedItems = response.data.items || [];
        
        // Ensure all items have required fields with defaults
        fetchedItems = fetchedItems.map((item: any) => ({
          ...item,
          reports: item.reports || [],
          reportCount: item.reportCount || 0,
          reviews: item.reviews || [],
          moderationStatus: item.moderationStatus || 'active',
          imageUrls: item.imageUrls || [],
        }));
        
        // Apply status filter if on 'all' tab
        if (activeTab === 'all' && statusFilter !== 'all') {
          fetchedItems = fetchedItems.filter((item: Item) => item.moderationStatus === statusFilter);
        }
        
        setItems(fetchedItems);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      alert('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (itemId: string, action: 'keep' | 'warn' | 'remove') => {
    if (!itemId) return;

    const confirmMessages = {
      keep: 'This will mark the item as safe and clear all reports. Continue?',
      warn: 'This will warn the user about this item. The item will remain visible. Continue?',
      remove: 'This will remove the item from the marketplace. Continue?'
    };

    if (!window.confirm(confirmMessages[action])) {
      return;
    }

    try {
      setProcessingAction(true);
      const response = await axios.post(`/api/items/${itemId}/moderate`, {
        action,
        notes: actionNotes,
        adminId: user.userId
      });

      if (response.data.success) {
        alert(`Item ${action === 'keep' ? 'kept active' : action === 'warn' ? 'warned' : 'removed'} successfully!`);
        setShowDetailsModal(false);
        setSelectedItem(null);
        setActionNotes('');
        fetchItems(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Action failed:', error);
      alert(error.response?.data?.message || 'Failed to perform action');
    } finally {
      setProcessingAction(false);
    }
  };

  const openDetailsModal = (item: Item) => {
    setSelectedItem(item);
    setActionNotes(item.moderationNotes || '');
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      warned: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      removed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Moderation Dashboard</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('reported')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'reported'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Reported Items
            {activeTab === 'reported' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'all'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            All Items
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
            )}
          </button>
        </div>

        {/* Status Filter (only show on 'all' tab) */}
        {activeTab === 'all' && (
          <div className="mb-6 flex gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center mr-2">Filter by status:</span>
            {(['all', 'active', 'warned', 'removed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'reported' ? 'No reported items' : 'No items found'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={item.imageUrl || '/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.category}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{item.description}</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.moderationStatus)}`}>
                          {item.moderationStatus.toUpperCase()}
                        </span>
                        {item.reportCount > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                            {item.reportCount} Report{item.reportCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => openDetailsModal(item)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm font-medium"
                      >
                        View Details & Take Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Item Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Item Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <img
                    src={selectedItem.imageUrl || '/placeholder.jpg'}
                    alt={selectedItem.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedItem.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedItem.description}</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Price:</strong> ₹{selectedItem.price.toFixed(2)}</p>
                    <p><strong>Category:</strong> {selectedItem.category}</p>
                    <p><strong>Seller:</strong> {selectedItem.userName}</p>
                    <p><strong>Email:</strong> {selectedItem.userEmail}</p>
                    <p><strong>Phone:</strong> {selectedItem.userPhone}</p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(selectedItem.moderationStatus)}`}>{selectedItem.moderationStatus}</span></p>
                  </div>
                </div>
              </div>

              {/* Reports Section */}
              {selectedItem.reports && selectedItem.reports.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Reports ({selectedItem.reportCount})
                  </h3>
                  <div className="space-y-3">
                    {selectedItem.reports.map((report, index) => (
                      <div key={`${report.userId}-${index}`} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{report.userName || 'Anonymous'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{report.userEmail || 'No email'}</p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-sm"><strong>Reason:</strong> {report.reason}</p>
                        {report.description && (
                          <p className="text-sm mt-1"><strong>Details:</strong> {report.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selectedItem.id, 'keep')}
                  disabled={processingAction}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  ✓ Keep Active
                </button>
                <button
                  onClick={() => handleAction(selectedItem.id, 'warn')}
                  disabled={processingAction}
                  className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-md hover:bg-yellow-700 transition font-medium disabled:opacity-50"
                >
                  ⚠ Warn
                </button>
                <button
                  onClick={() => handleAction(selectedItem.id, 'remove')}
                  disabled={processingAction}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;