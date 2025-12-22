import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Notifications() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [buyerBookingUpdates, setBuyerBookingUpdates] = useState<Booking[]>([]);
  const [moderationNotifications, setModerationNotifications] = useState<ModerationNotification[]>([]);
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    // Set axios auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Fetch initial data
    fetchNotifications();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const [bookingResponse, sellerBookingsResponse, buyerBookingsResponse, modNotificationsResponse] = await Promise.all([
        axios.get('/api/booking/unread-count'),
        axios.get('/api/booking/seller'),
        axios.get('/api/booking/buyer'),
        axios.get('/api/notifications?limit=20')
      ]);

      const bookCount = bookingResponse.data.unreadCount || 0;
      const allNotifications = modNotificationsResponse.data.notifications || [];
      
      // Separate BOOKING type notifications from moderation notifications
      const bookingNotifications = allNotifications.filter((n: ModerationNotification) => n.type === 'BOOKING');
      const moderationOnly = allNotifications.filter((n: ModerationNotification) => n.type !== 'BOOKING');
      
      const bookingNotifCount = bookingNotifications.filter((n: ModerationNotification) => !n.read).length;
      const modCount = moderationOnly.filter((n: ModerationNotification) => !n.read).length;
      
      // Get buyer booking updates (accepted/rejected) that are unread - OLD SYSTEM (kept for backwards compatibility)
      const buyerBookings = (buyerBookingsResponse.data.bookings || [])
        .filter((booking: Booking) => !booking.read && (booking.status === 'accepted' || booking.status === 'rejected'))
        .slice(0, 3);
      setBuyerBookingUpdates(buyerBookings);
      
      const buyerUpdatesCount = buyerBookings.length;
      
      setUnreadBookingsCount(bookCount);
      setUnreadCount(bookCount + modCount + buyerUpdatesCount + bookingNotifCount);
      
      // Get recent unread bookings (for seller - incoming requests)
      const unreadBookings = (sellerBookingsResponse.data.bookings || [])
        .filter((booking: Booking) => !booking.read && booking.status === 'pending')
        .slice(0, 3);
      setRecentBookings(unreadBookings);
      
      // Set moderation notifications (excluding BOOKING type - those are shown separately)
      setModerationNotifications(moderationOnly);
      
      // Set booking notifications
      setBuyerBookingUpdates(prev => {
        // Combine old booking system with new notification system
        const combined = [...bookingNotifications.map((n: ModerationNotification) => ({
          _id: n._id,
          itemTitle: n.message.split('"')[1] || 'Unknown Item',
          buyerId: '',
          buyerName: '',
          sellerName: '',
          status: n.title.includes('Accepted') ? 'accepted' : 'rejected',
          message: n.message,
          rejectionNote: n.title.includes('Rejected') ? n.message.split('Reason: ')[1] : undefined,
          read: n.read,
          createdAt: n.createdAt
        })), ...buyerBookings];
        return combined.slice(0, 5);
      });
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleBookingClick = async (booking: Booking) => {
    setShowDropdown(false);
    try {
      const token = localStorage.getItem('token');
      
      // Mark booking as read (dismiss notification)
      await axios.put(
        `${API_URL}/api/booking/${booking._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state to reflect read status
      setRecentBookings(prev => prev.map(b => 
        b._id === booking._id ? { ...b, read: true } : b
      ));
      
      // Update unread counts
      setUnreadBookingsCount(prev => Math.max(0, prev - 1));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error handling booking:', error);
    }
  };

  const handleBuyerBookingClick = async (booking: Booking) => {
    setShowDropdown(false);
    
    // If this is a new notification-based booking update, delete the notification
    if (booking._id && booking._id.length === 24) {
      try {
        // Check if this is a notification ID (24 chars) vs booking ID
        const isNotificationId = !booking.buyerId; // Notification-based bookings won't have buyerId
        
        if (isNotificationId) {
          await axios.delete(`/api/notifications/${booking._id}`);
        } else {
          // Old system - mark booking as read
          const token = localStorage.getItem('token');
          await axios.put(
            `${API_URL}/api/booking/${booking._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        
        // Refresh notifications
        fetchNotifications();
      } catch (error) {
        console.error('Error handling buyer booking:', error);
      }
    }
    
    // Navigate to bookings page
    navigate('/bookings');
  };

  const handleModerationNotificationClick = async (notification: ModerationNotification) => {
    setShowDropdown(false);
    
    // Mark as read
    if (!notification.read) {
      try {
        await axios.put(`/api/notifications/${notification._id}/read`);
        // Refresh notifications
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to item or profile page
    if (notification.itemId) {
      navigate(`/item/${notification.itemId}`);
    } else {
      navigate('/profile');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      await axios.delete('/api/notifications/clear-all/all');
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
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

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-lg ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}
        aria-label="Notifications"
      >
        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-80 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto transition-colors duration-300`}>
            {/* Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                  {moderationNotifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      title="Clear all notifications"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y dark:divide-gray-700">
              {/* Bookings Section */}
              <div className={`p-4 ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    📦 Booking Requests
                    {unreadBookingsCount > 0 && (
                      <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadBookingsCount}
                      </span>
                    )}
                  </h4>
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                {recentBookings.length > 0 ? (
                  recentBookings.map(booking => (
                    <button
                      key={booking._id}
                      onClick={() => handleBookingClick(booking)}
                      className={`w-full text-left p-2 rounded ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-white'
                      } transition-colors mb-1`}
                    >
                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        New booking from {booking.buyerName}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        Item: {booking.itemTitle}
                      </p>
                      {booking.message && (
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                          "{booking.message}"
                        </p>
                      )}
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(booking.createdAt).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                    No new booking requests
                  </p>
                )}
              </div>

              {/* Buyer Booking Updates Section */}
              {buyerBookingUpdates.length > 0 && (
                <div className={`p-4 ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      📬 Your Bookings
                      {buyerBookingUpdates.length > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {buyerBookingUpdates.length}
                        </span>
                      )}
                    </h4>
                    <Link
                      to="/bookings"
                      onClick={() => setShowDropdown(false)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  {buyerBookingUpdates.map(booking => (
                    <button
                      key={booking._id}
                      onClick={() => handleBuyerBookingClick(booking)}
                      className={`w-full text-left p-2 rounded ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-white'
                      } transition-colors mb-1 border-l-4 ${
                        booking.status === 'accepted' 
                          ? 'border-green-500' 
                          : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {booking.status === 'accepted' ? '✅' : '❌'}
                        </span>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Booking {booking.status === 'accepted' ? 'Accepted' : 'Rejected'}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                            Item: {booking.itemTitle}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Seller: {booking.sellerName}
                          </p>
                          {booking.status === 'rejected' && booking.rejectionNote && (
                            <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-1 italic`}>
                              Reason: {booking.rejectionNote}
                            </p>
                          )}
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(booking.createdAt).toLocaleString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Moderation Notifications Section */}
              {moderationNotifications.length > 0 && (
                <div className={`p-4 ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    🛡️ Item Moderation
                  </h4>
                  {moderationNotifications.map(notification => (
                    <button
                      key={notification._id}
                      onClick={() => handleModerationNotificationClick(notification)}
                      className={`w-full text-left p-3 rounded ${
                        !notification.read 
                          ? theme === 'dark' 
                            ? 'bg-gray-700 border-l-4 border-indigo-500' 
                            : 'bg-white border-l-4 border-indigo-500'
                          : theme === 'dark' 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-white'
                      } transition-colors mb-2 relative group`}
                    >
                      <div className="flex items-start gap-2">
                        {notification.imageUrl && (
                          <img 
                            src={notification.imageUrl} 
                            alt="" 
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1 line-clamp-2`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(notification.createdAt).toLocaleString([], { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {!notification.read && (
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">NEW</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification._id)}
                          className={`flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            theme === 'dark' 
                              ? 'hover:bg-red-900/30 text-red-400' 
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Delete notification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {recentBookings.length === 0 && moderationNotifications.length === 0 && (
                <div className="p-8 text-center">
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notifications
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
