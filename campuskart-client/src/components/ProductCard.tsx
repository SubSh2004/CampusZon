import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';
import { API_URL, SOCKET_URL } from '../config/api';
import { io, Socket } from 'socket.io-client';
import ReportButton from './ReportButton';

interface Item {
  id: string; // MongoDB ObjectId as string
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls?: string[]; // Multiple images support
  available: boolean;
  createdAt: string;
  userId: string; // Required for booking
  userName: string; // Required for booking
  userEmail: string;
  userPhone: string;
}

interface ProductCardProps {
  item: Item;
}

export default function ProductCard({ item }: ProductCardProps) {
  const navigate = useNavigate();
  const currentUser = useRecoilValue(userAtom);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Use imageUrl directly (it's either a full ImgBB URL or null)
  const imageUrl = (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : item.imageUrl) || '/placeholder.jpg';
  const imageCount = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls.length : (item.imageUrl ? 1 : 0);
  
  // Check if current user uploaded this item
  const isOwnItem = currentUser?.email === item.userEmail;

  // Check if item is unlocked
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!currentUser?.isLoggedIn || isOwnItem) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/unlock/items/${item.id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsUnlocked(response.data.unlocked);
      } catch (error) {
        console.error('Error checking unlock status:', error);
      }
    };

    checkUnlockStatus();
  }, [item.id, currentUser, isOwnItem]);

  // Initialize socket connection
  useEffect(() => {
    // TEMPORARILY DISABLED - Socket.io not set up on Render backend yet
    // const newSocket = io(SOCKET_URL);
    // setSocket(newSocket);

    return () => {
      // newSocket.close();
    };
  }, []);

  const handleChatClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to chat');
        navigate('/login');
        return;
      }

      if (!item.userId) {
        alert('Unable to start chat: Seller information not available');
        return;
      }

      // Create or get chat with the seller (correct endpoint)
      const response = await axios.get(
        `${API_URL}/api/chat/chat/${item.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Navigate to chat page with the selected chat
        navigate('/chat', { state: { selectedChatId: response.data.chat._id } });
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item.userPhone) {
      alert('Phone number not available');
      return;
    }

    // Open phone dialer with the seller's number
    window.location.href = `tel:${item.userPhone}`;
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to book items');
      navigate('/login');
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    if (!item.userId || !item.userName) {
      console.error('Missing seller info:', { userId: item.userId, userName: item.userName });
      alert('Seller information is missing. Please refresh the page and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/booking/create`,
        {
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: item.price,
          itemCategory: item.category,
          sellerId: item.userId,
          sellerName: item.userName,
          message: bookingMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Send real-time notification via socket
        socket?.emit('sendBookingRequest', {
          sellerId: item.userId,
          booking: response.data.booking
        });

        // The server creates the booking message and notifies the seller directly.
        // No need to emit 'sendPrivateMessage' from the client (avoids duplicate saves).

        alert('Booking request sent successfully!');
        setShowBookingModal(false);
        setBookingMessage('');
      }
    } catch (error: any) {
      console.error('Error booking item:', error);
      alert(error.response?.data?.message || 'Failed to send booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Link to={`/item/${item.id}`} className="block group">
        <div className="relative bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-700">
          
          {/* "Uploaded by you" badge above image */}
          {isOwnItem && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 text-center">
              ✨ Uploaded by you
            </div>
          )}
          
          <div className="aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            
            {/* Image Count Indicator */}
            {imageCount > 1 && (
              <div className="absolute bottom-3 right-3 z-20">
                <span className="backdrop-blur-md bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  {imageCount}
                </span>
              </div>
            )}
            
            {/* Availability Badge */}
            <div className="absolute top-3 right-3 z-20">
              {item.available ? (
                <span className="bg-green-600 text-white text-xs font-semibold px-2 sm:px-3 py-1 rounded shadow-sm">
                  Available
                </span>
              ) : (
                <span className="relative bg-gradient-to-r from-red-400 to-rose-500 text-white text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                  <span className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-50"></span>
                  <span className="relative">✕ Sold Out</span>
                </span>
              )}
            </div>
            
            {/* Category Badge on Image */}
            <div className="absolute top-3 left-3 z-20">
              <span className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg border border-indigo-200 dark:border-indigo-700">
                {item.category}
              </span>
            </div>
          </div>
          <div className="p-3 sm:p-4 relative z-20">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300">
              {item.title}
            </h3>
            
            {/* Category Badge in Card Content */}
            <div className="mb-2">
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                📂 {item.category}
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {item.description}
            </p>
            
            {/* Price with Gradient Background */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <span className="relative text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ₹{parseFloat(item.price.toString()).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons with Gradients */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {isUnlocked && !isOwnItem ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBookingModal(true);
                  }}
                  className="relative flex-1 group/btn bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 text-white text-xs sm:text-sm font-bold py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 overflow-hidden shadow-md hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="relative z-10">Book Item</span>
                </button>
              ) : (
                <Link
                  to={`/item/${item.id}`}
                  className="relative flex-1 group/btn bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:from-indigo-700 active:to-purple-700 text-white text-xs sm:text-sm font-bold py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 overflow-hidden shadow-md hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="relative z-10">View Details</span>
                </Link>
              )}
            </div>

            {/* Report Button */}
            {!isOwnItem && (
              <div 
                className="mt-2 flex justify-end" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ReportButton itemId={item.id} itemTitle={item.title} />
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Book Item</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
              Send a booking request for <span className="font-semibold">{item.title}</span>
            </p>
            <textarea
              value={bookingMessage}
              onChange={(e) => setBookingMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white mb-3 sm:mb-4 min-h-[80px] sm:min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={isSubmitting}
                className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
