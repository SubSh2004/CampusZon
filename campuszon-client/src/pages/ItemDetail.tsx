import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useSetRecoilState } from 'recoil';
import { cartAtom } from '../store/cart.atom';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import UnlockModal from '../components/UnlockModal';
import FreeCreditsIndicator from '../components/FreeCreditsIndicator';
import ReportButton from '../components/ReportButton';

interface Item {
  id: string; // MongoDB ObjectId as string
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls?: string[]; // Multiple images support
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
  const setCart = useSetRecoilState(cartAtom);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Unlock system state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [unlockTier, setUnlockTier] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);

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
    
    // Fetch token balance
    fetchTokenBalance();

    // Initialize socket
    // TEMPORARILY DISABLED - Socket.io not set up on Render backend yet
    // const newSocket = io(SOCKET_URL);
    // setSocket(newSocket);

    return () => {
      // newSocket.close();
    };
  }, [id]);

  const fetchTokenBalance = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenBalance(response.data.currentTokens);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const checkUnlockStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    try {
      const response = await axios.get(`/api/unlock/items/${id}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.unlocked) {
        setUnlocked(true);
        // Seller info is already in item, just mark as unlocked
      }
      
      // Also get token balance from the response
      if (response.data.unlockTokens !== undefined) {
        setTokenBalance(response.data.unlockTokens);
      }
    } catch (error) {
      console.error('Error checking unlock status:', error);
    }
  };

  const handleUnlockSuccess = (seller: any) => {
    setSellerInfo(seller);
    setUnlocked(true);
    fetchTokenBalance(); // Refresh token balance
  };

  const handleUnlockClick = () => {
    if (tokenBalance === 0) {
      setShowInsufficientTokens(true);
      setTimeout(() => setShowInsufficientTokens(false), 4000);
    } else {
      setShowUnlockModal(true);
    }
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

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!item) return;

    try {
      setIsAddingToCart(true);
      const response = await axios.post(
        '/api/cart/add',
        { itemId: item.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCart({
          items: response.data.items,
          count: response.data.count
        });
        setBookingStatus({ 
          type: 'success', 
          message: '✅ Item added to cart!' 
        });
        setTimeout(() => setBookingStatus(null), 3000);
      }
    } catch (err: any) {
      setBookingStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to add item to cart'
      });
      setTimeout(() => setBookingStatus(null), 3000);
    } finally {
      setIsAddingToCart(false);
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
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <span className="text-2xl">🎫</span>
            <div className="text-right">
              <p className="text-xs opacity-90">Tokens</p>
              <p className="text-lg font-bold">{tokenBalance}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto transition-colors duration-300">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-8">
              {(() => {
                const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
                
                if (images.length === 0) {
                  return (
                    <div className="text-gray-400 dark:text-gray-500 text-center">
                      <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No image available</p>
                    </div>
                  );
                }
                
                return (
                  <div className="relative w-full">
                    {/* Main Image */}
                    <img
                      src={images[currentImageIndex]}
                      alt={`${item.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-auto max-h-96 object-contain rounded-lg"
                    />
                    
                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                    
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition"
                          aria-label="Previous image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition"
                          aria-label="Next image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {/* Thumbnail Navigation */}
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {images.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition ${
                              index === currentImageIndex
                                ? 'border-indigo-600 dark:border-indigo-400'
                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
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

              {/* Category and Report Button */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 dark:text-gray-400">{item.category}</p>
                <ReportButton itemId={item.id} itemTitle={item.title} />
              </div>

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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unlock to see name, phone & email</p>
                      </div>
                      
                      {showInsufficientTokens && (
                        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                          <p className="text-red-700 dark:text-red-400 text-sm font-semibold text-center">
                            ⚠️ Insufficient tokens! Please top up to unlock.
                          </p>
                          <button
                            onClick={() => navigate('/')}
                            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition"
                          >
                            Go to Home & Top Up
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={handleUnlockClick}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-xl">🎫</span>
                        🔓 Unlock with 1 Token
                      </button>
                      
                      <p className="text-center text-sm text-green-600 dark:text-green-400 font-semibold mt-3">
                        🎁 New users get 2 free tokens!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED STATE - Show full info */
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4 border border-green-200 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-400 text-sm font-medium text-center">
                        ✅ Full Contact Access Unlocked
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
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {unlocked ? (
                    <>
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-md transition font-semibold"
                      >
                        ✅ Book This Item
                      </button>
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-6 rounded-md transition font-semibold disabled:opacity-50"
                      >
                        {isAddingToCart ? '🔄 Adding...' : '🛒 Add to Cart'}
                      </button>
                      <a
                        href={`tel:${sellerInfo?.phone || item.userPhone}`}
                        className="w-full block text-center bg-blue-600 dark:bg-blue-700 text-white py-3 px-6 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium"
                      >
                        📞 Call Seller
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-md transition font-semibold"
                    >
                      🔓 Unlock Contact Details (₹11)
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
          itemPrice={item.price}
          sellerName={item.userName}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}
    </div>
  );
}
