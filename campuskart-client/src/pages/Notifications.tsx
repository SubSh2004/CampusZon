import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api';

interface Booking {
  _id: string;
  itemTitle: string;
  buyerId: string;
  buyerName: string;
  sellerName: string;
  status: string;
  message: string;
  rejectionNote?: string;
  read: boolean;
  createdAt: string;
  isNotification?: boolean; // Flag to distinguish notification-based from booking-based
}

interface ModerationNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  itemId?: any;
  imageUrl?: string;
  read: boolean;
  createdAt: string;
}

type NotificationTab = 'booking' | 'moderation';
type BookingSubTab = 'incoming' | 'updates';

export default function Notifications() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<NotificationTab>('booking');
  const [bookingSubTab, setBookingSubTab] = useState<BookingSubTab>('incoming');
  const [loading, setLoading] = useState(true);
  
  // Booking notifications
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [bookingUpdates, setBookingUpdates] = useState<Booking[]>([]);
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);
  
  // Moderation notifications
  const [moderationNotifications, setModerationNotifications] = useState<ModerationNotification[]>([]);
  const [unreadModerationCount, setUnreadModerationCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const [, sellerBookingsResponse, buyerBookingsResponse, modNotificationsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/booking/unread-count`),
        axios.get(`${API_URL}/api/booking/seller`),
        axios.get(`${API_URL}/api/booking/buyer`),
        axios.get(`${API_URL}/api/notifications?limit=100`)
      ]);

      const allNotifications = modNotificationsResponse.data.notifications || [];
      
      // Separate BOOKING type notifications from moderation notifications
      const bookingNotifications = allNotifications.filter((n: ModerationNotification) => n.type === 'BOOKING');
      const moderationOnly = allNotifications.filter((n: ModerationNotification) => n.type !== 'BOOKING');
      
      const modCount = moderationOnly.filter((n: ModerationNotification) => !n.read).length;
      
      // Get all seller bookings (incoming requests) and deduplicate by ID
      const allSellerBookings = (sellerBookingsResponse.data.bookings || [])
        .filter((booking: Booking) => booking.status === 'pending');
      
      // Deduplicate by ID
      const uniqueBookingRequestsMap = new Map();
      allSellerBookings.forEach((booking: Booking) => {
        if (!uniqueBookingRequestsMap.has(booking._id)) {
          uniqueBookingRequestsMap.set(booking._id, booking);
        }
      });
      
      const uniqueSellerBookings = Array.from(uniqueBookingRequestsMap.values())
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setBookingRequests(uniqueSellerBookings);
      
      // Get buyer booking updates (accepted/rejected)
      const buyerBookings = (buyerBookingsResponse.data.bookings || [])
        .filter((booking: Booking) => booking.status === 'accepted' || booking.status === 'rejected');
      
      // Combine new notification system with old booking system and deduplicate
      const notificationBasedUpdates = bookingNotifications.map((n: ModerationNotification) => ({
        _id: n._id,
        itemTitle: n.message.split('"')[1] || 'Unknown Item',
        buyerId: '',
        buyerName: '',
        sellerName: 'Seller',
        status: n.title.includes('Accepted') ? 'accepted' : 'rejected',
        message: n.message,
        rejectionNote: n.title.includes('Rejected') ? n.message.split('Reason: ')[1] : undefined,
        read: n.read,
        createdAt: n.createdAt,
        isNotification: true
      }));
      
      // Create a Set of item titles from notifications to avoid duplicates
      const notificationItemTitles = new Set(
        notificationBasedUpdates.map((n: any) => `${n.itemTitle}-${n.status}`)
      );
      
      // Only include buyer bookings that don't have a corresponding notification
      const uniqueBuyerBookings = buyerBookings
        .filter((b: Booking) => !notificationItemTitles.has(`${b.itemTitle}-${b.status}`))
        .map((b: Booking) => ({ ...b, isNotification: false }));
      
      const allBookingUpdates = [
        ...notificationBasedUpdates,
        ...uniqueBuyerBookings
      ];
      
      // Further deduplicate by _id to ensure no exact duplicates
      const uniqueUpdatesMap = new Map();
      allBookingUpdates.forEach((booking: any) => {
        if (!uniqueUpdatesMap.has(booking._id)) {
          uniqueUpdatesMap.set(booking._id, booking);
        }
      });
      
      const combinedBookingUpdates = Array.from(uniqueUpdatesMap.values())
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setBookingUpdates(combinedBookingUpdates);
      
      // Calculate unread count from actual displayed data (after deduplication)
      const unreadRequestsCount = uniqueSellerBookings.filter((b: Booking) => !b.read).length;
      const unreadUpdatesCount = combinedBookingUpdates.filter((b: any) => !b.read).length;
      setUnreadBookingsCount(unreadRequestsCount + unreadUpdatesCount);
      
      // Set moderation notifications (excluding BOOKING type)
      setModerationNotifications(moderationOnly);
      setUnreadModerationCount(modCount);
      
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkModerationAsRead = async (notificationId: string) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${notificationId}/read`);
      
      // Immediately update local state and decrement count
      const notification = moderationNotifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        setUnreadModerationCount(prev => Math.max(0, prev - 1));
      }
      
      setModerationNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, isBooking: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      if (isBooking) {
        // Check if it's a notification-based booking or regular booking
        const booking = bookingUpdates.find(b => b._id === notificationId);
        const isNotificationBased = booking && !booking.buyerId;
        
        if (isNotificationBased) {
          // Delete from notification system
          await axios.delete(`${API_URL}/api/notifications/${notificationId}`);
        } else {
          // Mark as read for old booking system
          await axios.put(
            `${API_URL}/api/booking/${notificationId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } else {
        await axios.delete(`${API_URL}/api/notifications/${notificationId}`);
      }
      
      // Immediately update local state and counts
      if (isBooking) {
        const deletedBooking = [...bookingRequests, ...bookingUpdates].find(b => b._id === notificationId);
        if (deletedBooking && !deletedBooking.read) {
          setUnreadBookingsCount(prev => Math.max(0, prev - 1));
        }
        setBookingRequests(prev => prev.filter(b => b._id !== notificationId));
        setBookingUpdates(prev => prev.filter(b => b._id !== notificationId));
      } else {
        const deletedNotif = moderationNotifications.find(n => n._id === notificationId);
        if (deletedNotif && !deletedNotif.read) {
          setUnreadModerationCount(prev => Math.max(0, prev - 1));
        }
        setModerationNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteBookingRequest = async (bookingId: string) => {
    try {
      const booking = bookingRequests.find(b => b._id === bookingId);
      if (!booking) return;
      
      const token = localStorage.getItem('token');
      
      // Update UI immediately for better UX
      const wasUnread = !booking.read;
      if (wasUnread) {
        setUnreadBookingsCount(prev => Math.max(0, prev - 1));
      }
      setBookingRequests(prev => prev.filter(b => b._id !== bookingId));
      
      // Then make API call
      await axios.put(
        `${API_URL}/api/booking/${bookingId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error deleting booking request:', error);
      // Refresh on error to get correct state
      fetchNotifications();
    }
  };

  const handleDeleteBookingUpdate = async (bookingId: string) => {
    try {
      const booking = bookingUpdates.find(b => b._id === bookingId);
      if (!booking) return;
      
      const isNotificationBased = booking.isNotification === true;
      const token = localStorage.getItem('token');
      
      // First update UI immediately for better UX
      const wasUnread = !booking.read;
      if (wasUnread) {
        setUnreadBookingsCount(prev => Math.max(0, prev - 1));
      }
      setBookingUpdates(prev => prev.filter(b => b._id !== bookingId));
      
      // Then make API call
      if (isNotificationBased) {
        await axios.delete(`${API_URL}/api/notifications/${bookingId}`);
      } else {
        await axios.put(
          `${API_URL}/api/booking/${bookingId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error deleting booking update:', error);
      // Refresh on error to get correct state
      fetchNotifications();
    }
  };

  const handleManageBookingRequest = async (bookingId: string) => {
    try {
      const booking = bookingRequests.find(b => b._id === bookingId);
      if (!booking) {
        navigate('/bookings');
        return;
      }
      
      // Only mark as read if it's unread
      if (!booking.read) {
        const token = localStorage.getItem('token');
        
        // Update UI immediately for better UX
        setUnreadBookingsCount(prev => Math.max(0, prev - 1));
        setBookingRequests(prev => prev.map(b => 
          b._id === bookingId ? { ...b, read: true } : b
        ));
        
        // Then make API call
        await axios.put(
          `${API_URL}/api/booking/${bookingId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error marking booking as read:', error);
      // Refresh on error to get correct state
      fetchNotifications();
    }
    
    // Navigate to bookings page
    navigate('/bookings');
  };

  const handleMarkBookingUpdateAsRead = async (bookingId: string) => {
    try {
      const booking = bookingUpdates.find(b => b._id === bookingId);
      if (!booking) return;
      
      // Only mark as read if it's unread
      if (!booking.read) {
        const isNotificationBased = booking.isNotification === true;
        const token = localStorage.getItem('token');
        
        // First make API call, then update UI only on success
        if (isNotificationBased) {
          await axios.put(`${API_URL}/api/notifications/${bookingId}/read`);
        } else {
          await axios.put(
            `${API_URL}/api/booking/${bookingId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        
        // Only update UI after successful API call
        setUnreadBookingsCount(prev => Math.max(0, prev - 1));
        setBookingUpdates(prev => prev.map(b => 
          b._id === bookingId ? { ...b, read: true } : b
        ));
      }
    } catch (error) {
      console.error('Error marking booking update as read:', error);
      alert('Failed to mark as read. Please try again.');
    }
  };

  const handleViewBookingUpdate = () => {
    // Just navigate to bookings page
    navigate('/bookings');
  };

  const handleClearAllBookings = async () => {
    if (!confirm('Are you sure you want to clear all booking notifications?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/notifications/clear-all/booking`);
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing booking notifications:', error);
    }
  };

  const handleClearAllModeration = async () => {
    if (!confirm('Are you sure you want to clear all moderation notifications?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/notifications/clear-all/moderation`);
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing moderation notifications:', error);
    }
  };

  const handleViewItem = (itemId: any, notificationId: string, isBooking: boolean) => {
    if (!isBooking) {
      handleMarkModerationAsRead(notificationId);
    }
    if (itemId) {
      navigate(`/item/${itemId}`);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ITEM_KEPT_ACTIVE':
      case 'ITEM_APPROVED':
        return 'text-green-600 dark:text-green-400';
      case 'ITEM_WARNED':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'ITEM_REMOVED':
      case 'ITEM_REJECTED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ITEM_KEPT_ACTIVE':
      case 'ITEM_APPROVED':
        return '✅';
      case 'ITEM_WARNED':
        return '⚠️';
      case 'ITEM_REMOVED':
      case 'ITEM_REJECTED':
        return '❌';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            theme === 'dark'
              ? 'text-gray-300 hover:text-white hover:bg-gray-800'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🔔 Notifications
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {unreadBookingsCount + unreadModerationCount} unread notifications
          </p>
        </div>

        {/* Tabs */}
        <div className={`mb-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'booking'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 Bookings
              {unreadBookingsCount > 0 && (
                <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadBookingsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'moderation'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🛡️ Moderation
              {unreadModerationCount > 0 && (
                <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadModerationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Booking Notifications Tab */}
        {activeTab === 'booking' && (
          <div className="space-y-6">
            {/* Sub-tabs for Booking Section */}
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-4">
                <button
                  onClick={() => setBookingSubTab('incoming')}
                  className={`px-4 py-2 font-medium border-b-2 transition ${
                    bookingSubTab === 'incoming'
                      ? 'border-green-600 text-green-600 dark:text-green-400'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📨 Incoming Requests
                  {bookingRequests.length > 0 && (
                    <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {bookingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setBookingSubTab('updates')}
                  className={`px-4 py-2 font-medium border-b-2 transition ${
                    bookingSubTab === 'updates'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📬 Your Booking Updates
                  {bookingUpdates.length > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {bookingUpdates.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Incoming Booking Requests */}
            {bookingSubTab === 'incoming' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Incoming Requests
                  {bookingRequests.length > 0 && (
                    <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({bookingRequests.length})
                    </span>
                  )}
                </h2>
                {bookingRequests.length > 0 && (
                  <Link
                    to="/bookings"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View in Bookings →
                  </Link>
                )}
              </div>
              
              {bookingRequests.length > 0 ? (
                <div className="space-y-3">
                  {bookingRequests.map((booking) => (
                    <div
                      key={booking._id}
                      className={`${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      } border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        !booking.read ? 'border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">📨</span>
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              New booking from {booking.buyerName}
                            </h3>
                            {!booking.read && (
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full font-semibold">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Item:</span> {booking.itemTitle}
                          </p>
                          {booking.message && (
                            <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} italic`}>
                              Message: "{booking.message}"
                            </p>
                          )}
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(booking.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleDeleteBookingRequest(booking._id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                              theme === 'dark'
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Delete notification"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleManageBookingRequest(booking._id)}
                            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    No incoming booking requests
                  </p>
                </div>
              )}
            </div>
            )}

            {/* Your Booking Updates */}
            {bookingSubTab === 'updates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Your Booking Updates
                  {bookingUpdates.length > 0 && (
                    <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({bookingUpdates.length})
                    </span>
                  )}
                </h2>
                {bookingUpdates.length > 0 && (
                  <button
                    onClick={handleClearAllBookings}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {bookingUpdates.length > 0 ? (
                <div className="space-y-3">
                  {bookingUpdates.map((booking) => (
                    <div
                      key={booking._id}
                      className={`${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      } border rounded-lg p-4 hover:shadow-md transition-shadow border-l-4 ${
                        booking.status === 'accepted' ? 'border-l-green-500' : 'border-l-red-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl flex-shrink-0">
                            {booking.status === 'accepted' ? '✅' : '❌'}
                          </span>
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-2 ${
                              booking.status === 'accepted'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              Booking {booking.status === 'accepted' ? 'Accepted' : 'Rejected'}
                            </h3>
                            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Item:</span> {booking.itemTitle}
                            </p>
                            {booking.sellerName && booking.sellerName !== 'Seller' && (
                              <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="font-medium">Seller:</span> {booking.sellerName}
                              </p>
                            )}
                            {booking.status === 'rejected' && booking.rejectionNote && (
                              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} italic`}>
                                <span className="font-medium">Reason:</span> {booking.rejectionNote}
                              </p>
                            )}
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(booking.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleDeleteBookingUpdate(booking._id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                              theme === 'dark'
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Delete notification"
                          >
                            Delete
                          </button>
                          {!booking.read && (
                            <button
                              onClick={() => handleMarkBookingUpdateAsRead(booking._id)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                theme === 'dark'
                                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                              title="Mark as read"
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={() => handleViewBookingUpdate()}
                            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    No booking updates
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* Moderation Notifications Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Item Moderation Updates
                {moderationNotifications.length > 0 && (
                  <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ({moderationNotifications.length})
                  </span>
                )}
              </h2>
              {moderationNotifications.length > 0 && (
                <button
                  onClick={handleClearAllModeration}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {moderationNotifications.length > 0 ? (
              <div className="space-y-3">
                {moderationNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      !notification.read ? 'border-l-4 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      {notification.imageUrl && (
                        <img 
                          src={notification.imageUrl} 
                          alt="" 
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                          onClick={() => handleViewItem(notification.itemId, notification._id, false)}
                        />
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          <h3 className={`font-semibold ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs px-2 py-1 rounded-full font-semibold">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkModerationAsRead(notification._id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id, false)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition ${
                            theme === 'dark'
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title="Delete notification"
                        >
                          Delete
                        </button>
                        {notification.itemId && (
                          <button
                            onClick={() => handleViewItem(notification.itemId, notification._id, false)}
                            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                          >
                            View Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
                <div className="text-6xl mb-4">🛡️</div>
                <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No moderation notifications
                </h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  You'll see item moderation updates here
                </p>
                <Link
                  to="/profile"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  View Your Items
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
