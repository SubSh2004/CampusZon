import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) return;

    // Set axios auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Fetch initial data
    fetchNotifications();

    // Setup Socket.IO for real-time notifications (no polling needed!)
    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Join with userId to receive notifications
    socketRef.current.emit('userJoin', userId);

    // Listen for real-time notifications
    socketRef.current.on('new-notification', () => {
      console.log('📬 Real-time notification received!');
      fetchNotifications(); // Refresh count instantly
    });

    socketRef.current.on('connect', () => {
      console.log('🔗 Socket.IO connected for notifications');
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const [bookingResponse, modNotificationsResponse] = await Promise.all([
        axios.get('/api/booking/unread-count'),
        axios.get('/api/notifications?limit=20')
      ]);

      const bookCount = bookingResponse.data.unreadCount || 0;
      const allNotifications = modNotificationsResponse.data.notifications || [];
      
      // Separate BOOKING type notifications from moderation notifications
      const bookingNotifications = allNotifications.filter((n: ModerationNotification) => n.type === 'BOOKING');
      const moderationOnly = allNotifications.filter((n: ModerationNotification) => n.type !== 'BOOKING');
      
      const bookingNotifCount = bookingNotifications.filter((n: ModerationNotification) => !n.read).length;
      const modCount = moderationOnly.filter((n: ModerationNotification) => !n.read).length;
      
      setUnreadCount(bookCount + modCount + bookingNotifCount);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/notifications')}
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
    </div>
  );
}
