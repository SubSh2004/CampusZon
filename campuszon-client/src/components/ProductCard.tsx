import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userAtom } from '../store/user.atom';
import { cartAtom } from '../store/cart.atom';
import { API_URL } from '../config/api';
import ReportButton from './ReportButton';

interface Item {
  id: string; // MongoDB ObjectId as string
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  rentPrice?: number;
  category: string;
  listingType?: 'For Sale' | 'For Rent' | 'Both';
  rentalPeriod?: 'Per Day' | 'Per Week' | 'Per Month';
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
  const setCart = useSetRecoilState(cartAtom);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Use imageUrl directly (it's either a full ImgBB URL or null)
  const imageUrl = (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : item.imageUrl) || '/placeholder.jpg';
  const imageCount = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls.length : (item.imageUrl ? 1 : 0);
  
  // Check if current user uploaded this item
  const isOwnItem = currentUser?.email === item.userEmail;

  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!currentUser?.isLoggedIn || isOwnItem) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/unlock/items/${item.id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsUnlocked(response.data.unlocked || false);
      } catch (error) {
        // Silently fail
      }
    };
    checkUnlockStatus();
  }, [item.id, currentUser?.isLoggedIn, isOwnItem]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      setIsAddingToCart(true);
      const response = await axios.post(
        `${API_URL}/api/cart/add`,
        { itemId: item.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update cart state
        setCart({
          items: response.data.items,
          count: response.data.count
        });
        alert('✅ Item added to cart!');
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBookItem = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to book items');
      navigate('/login');
      return;
    }

    try {
      setIsBooking(true);
      const response = await axios.post(
        `${API_URL}/api/booking/create`,
        {
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: item.price,
          itemCategory: item.category,
          sellerId: item.userId,
          sellerName: item.userName,
          message: `I want to purchase "${item.title}" for ₹${item.price}. I have unlocked this item.`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Booking request sent successfully!');
        navigate('/bookings');
      }
    } catch (error: any) {
      console.error('Error booking item:', error);
      alert(error.response?.data?.message || 'Failed to book item');
    } finally {
      setIsBooking(false);
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
              loading="lazy"
              decoding="async"
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
            
            {/* Availability Badge - Hidden */}
            {/* <div className="absolute top-3 right-3 z-20">
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
            </div> */}
            
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
            
            {/* Price with Gradient Background and Availability Badge */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 mb-2">
              <div className="relative">
                <span className="relative text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ₹{parseFloat(item.price.toString()).toFixed(2)}
                </span>
              </div>
              
              {/* Availability Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                item.available 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  item.available ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span>{item.available ? 'Available' : 'Sold'}</span>
              </div>
            </div>

            {/* Listing Type and Rental Period Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {/* Show listing type - default to 'For Sale' if not set */}
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                (!item.listingType || item.listingType === 'For Sale')
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : item.listingType === 'For Rent'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
              }`}>
                {(!item.listingType || item.listingType === 'For Sale') && '💰'}
                {item.listingType === 'For Rent' && '🏠'}
                {item.listingType === 'Both' && '🔄'}
                <span>{item.listingType || 'For Sale'}</span>
              </span>
              {(item.listingType === 'For Rent' || item.listingType === 'Both') && item.rentalPeriod && (
                <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {item.rentalPeriod === 'Per Day' && '📅'}
                  {item.rentalPeriod === 'Per Week' && '📆'}
                  {item.rentalPeriod === 'Per Month' && '🗓️'}
                  <span>{item.rentalPeriod}</span>
                </span>
              )}
            </div>

            {/* Action Buttons with Gradients */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {!isOwnItem ? (
                <>
                  {isUnlocked ? (
                    <button
                      onClick={handleBookItem}
                      disabled={isBooking}
                      className="relative flex-1 group/btn bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:from-green-700 active:to-emerald-700 text-white text-xs sm:text-sm font-bold py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 overflow-hidden shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="relative z-10">{isBooking ? 'Booking...' : 'Book Item'}</span>
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
                      <span className="relative z-10">View</span>
                    </Link>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="relative flex-1 group/btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:from-blue-700 active:to-cyan-700 text-white text-xs sm:text-sm font-bold py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 overflow-hidden shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="relative z-10">{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                </>
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
                  <span className="relative z-10">View Your Item</span>
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
    </>
  );
}
