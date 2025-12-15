import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { API_URL, SOCKET_URL } from '../config/api';

interface Booking {
  _id: string;
  itemTitle: string;
  buyerId: string;
  buyerName: string;
  sellerName: string;
  status: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherUser: {
    username: string;
  };
}

export default function Notifications() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    // Set axios auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Initialize socket
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      newSocket.emit('userJoin', userId);
    });

    // Listen for new messages
    newSocket.on('newPrivateMessage', () => {
      fetchNotifications();
    });

    // Listen for booking notifications
    newSocket.on('newBookingRequest', () => {
      fetchNotifications();
    });

    newSocket.on('bookingStatusChanged', () => {
      fetchNotifications();
    });

    // Fetch initial data
    fetchNotifications();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const [messageResponse, bookingResponse, chatsResponse, sellerBookingsResponse] = await Promise.all([
        axios.get('/api/chat/unread-count'),
        axios.get('/api/booking/unread-count'),
        axios.get('/api/chat/chats'),
        axios.get('/api/booking/seller')
      ]);

      const msgCount = messageResponse.data.unreadCount || 0;
      const bookCount = bookingResponse.data.unreadCount || 0;
      
      setUnreadMessagesCount(msgCount);
      setUnreadBookingsCount(bookCount);
      setUnreadCount(msgCount + bookCount);
      
      // Get recent chats with unread messages
      const chatsWithUnread = (chatsResponse.data.chats || [])
        .filter((chat: Chat) => chat.unreadCount > 0)
        .slice(0, 3);
      setRecentChats(chatsWithUnread);
      
      // Get recent unread bookings
      const unreadBookings = (sellerBookingsResponse.data.bookings || [])
        .filter((booking: Booking) => !booking.read && booking.status === 'pending')
        .slice(0, 3);
      setRecentBookings(unreadBookings);
      
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
      
      // Create or get chat with the buyer
      const response = await axios.post(
        `${API_URL}/api/chat/chat`,
        { otherUserId: booking.buyerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
      }
    } catch (error) {
      console.error('Error handling booking:', error);
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
                {unreadCount > 0 && (
                  <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y dark:divide-gray-700">
              {/* Messages Section */}
              <div className={`p-4 ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    💬 Messages
                    {unreadMessagesCount > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </h4>
                  <Link
                    to="/chat"
                    onClick={() => setShowDropdown(false)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                {recentChats.length > 0 ? (
                  recentChats.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => handleChatClick()}
                      className={`w-full text-left p-2 rounded ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-white'
                      } transition-colors mb-1`}
                    >
                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {chat.otherUser?.username || 'Unknown User'}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {chat.lastMessage || 'New message'}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                    No new messages
                  </p>
                )}
              </div>

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

              {/* Empty State */}
              {recentChats.length === 0 && recentBookings.length === 0 && (
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
