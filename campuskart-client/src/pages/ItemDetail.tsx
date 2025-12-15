import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import UnlockModal from '../components/UnlockModal';
import FreeCreditsIndicator from '../components/FreeCreditsIndicator';

interface Item {
  id: string; // MongoDB ObjectId as string
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  userName: string;
  userPhone: string;
  userEmail: string;
  userHostel: string;
  userId: string;
  createdAt: string;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Unlock system state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [unlockTier, setUnlockTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await axios.get(`/api/items/${id}`);
        if (response.data.success) {
          setItem(response.data.item);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();

    // Check unlock status
    checkUnlockStatus();

    // Initialize socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [id]);

  const checkUnlockStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    try {
      const response = await axios.get(`/api/unlock/items/${id}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.unlocked) {
        setUnlocked(true);
        setUnlockTier(response.data.tier);
        // Seller info is already in item, just mark as unlocked
      }
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  };

  const handleUnlockSuccess = (seller: any, tier: string) => {
    setSellerInfo(seller);
    setUnlockTier(tier);
    setUnlocked(true);
  };

  const handleBookItem = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!item) return;

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.post('/api/booking/create', {
        itemId: item.id,
        itemTitle: item.title,
        itemPrice: item.price,
        itemCategory: item.category,
        sellerId: item.userId,
        sellerName: item.userName,
        message: bookingMessage
      });

      if (response.data.success) {
        // Send real-time notification via socket
        socket?.emit('sendBookingRequest', {
          sellerId: item.userId,
          booking: response.data.booking
        });

        // The server creates the booking message and notifies the seller directly.
        // No need to emit 'sendPrivateMessage' from the client (avoids duplicate saves).

        setBookingStatus({ type: 'success', message: response.data.message });
        setShowBookingModal(false);
        setBookingMessage('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setBookingStatus(null), 3000);
      }
    } catch (err: any) {
      setBookingStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send booking request'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Item Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The item you are looking for does not exist.'}</p>
          <Link to="/" className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Free Credits Indicator */}
      <FreeCreditsIndicator />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-icon.jpg" alt="CampusZon" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Item Details</span>
          </div>
          <div className="w-28"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto transition-colors duration-300">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-8">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500 text-center">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-8">
              {/* Availability Badge */}
              <div className="mb-4">
                {item.available ? (
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Not Available
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h1>

              {/* Category */}
              <p className="text-gray-500 dark:text-gray-400 mb-4">{item.category}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{parseFloat(item.price.toString()).toFixed(2)}
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.description}</p>
              </div>

              {/* Seller Information */}
              <div className="border-t dark:border-gray-700 pt-6 transition-colors duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seller Information</h2>
                
                {!unlocked ? (
                  /* LOCKED STATE - Show limited info */
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hostel</p>
                        <p className="font-medium text-gray-900 dark:text-white">{item.userHostel}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-gray-500">
                      <div className="text-center mb-3">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">🔒 Contact details hidden</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unlock to see name, phone, email & chat</p>
                      </div>
                      
                      <button
                        onClick={() => setShowUnlockModal(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        🔓 Unlock Contact Details
                      </button>
                      
                      <p className="text-center text-sm text-green-600 dark:text-green-400 font-semibold mt-3">
                        🎁 First 3 unlocks FREE!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED STATE - Show full info */
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4 border border-green-200 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-400 text-sm font-medium text-center">
                        ✅ Contact Unlocked - {unlockTier === 'premium' ? '⭐ Premium' : 'Basic'} Tier
                      </p>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{sellerInfo?.name || item.userName}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hostel</p>
                        <p className="font-medium text-gray-900 dark:text-white">{sellerInfo?.hostel || item.userHostel}</p>
                      </div>
                    </div>

                    {unlockTier === 'premium' && (
                      <>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <a href={`tel:${sellerInfo?.phone || item.userPhone}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                              {sellerInfo?.phone || item.userPhone}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <a href={`mailto:${sellerInfo?.email || item.userEmail}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                              {sellerInfo?.email || item.userEmail}
                            </a>
                          </div>
                        </div>
                      </>
                    )}

                    {unlockTier === 'basic' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                          💡 <strong>Upgrade to Premium</strong> for phone & email access
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {unlocked ? (
                    <>
                      <button
                        onClick={() => navigate('/chat', { state: { sellerId: item.userId } })}
                        className="w-full block text-center bg-indigo-600 dark:bg-indigo-500 text-white py-3 px-6 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
                      >
                        💬 Chat with Seller {unlockTier === 'basic' && '(10 messages total)'}
                      </button>
                      {unlockTier === 'basic' && (
                        <button
                          onClick={() => setShowUnlockModal(true)}
                          className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-md transition font-semibold"
                        >
                          ⬆️ Upgrade to Premium for ₹15 📥 (Get phone & email + unlimited messages)
                        </button>
                      )}
                      {unlockTier === 'premium' && (
                        <a
                          href={`tel:${sellerInfo?.phone || item.userPhone}`}
                          className="w-full block text-center bg-gray-600 dark:bg-gray-700 text-white py-3 px-6 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium"
                        >
                          📞 Call Seller
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md transition font-semibold"
                    >
                      🔓 Unlock to Contact Seller
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status Message */}
        {bookingStatus && (
          <div className={`mt-4 max-w-5xl mx-auto p-4 rounded-lg ${
            bookingStatus.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          } transition-colors duration-300`}>
            {bookingStatus.message}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6 transition-colors duration-300`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Book This Item
            </h2>
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Send a booking request to the seller. They will be notified and can accept or reject your request.
            </p>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Message to Seller (Optional)
              </label>
              <textarea
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                placeholder="Add any details or questions..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingMessage('');
                }}
                className={`flex-1 py-2 px-4 rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                } transition font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleBookItem}
                className="flex-1 py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition font-medium"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {item && (
        <UnlockModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          itemId={item.id}
          itemTitle={item.title}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}
    </div>
  );
}
