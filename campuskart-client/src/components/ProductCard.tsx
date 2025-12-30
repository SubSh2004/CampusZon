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
        `${API_URL}/api/bookings`,
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

  const getCategoryBadgeClass = () => {
    const categoryLower = item.category.toLowerCase();
    if (categoryLower.includes('electronics')) return 'badge-electronics';
    if (categoryLower.includes('books')) return 'badge-books';
    if (categoryLower.includes('furniture')) return 'badge-furniture';
    if (categoryLower.includes('clothing')) return 'badge-clothing';
    if (categoryLower.includes('sports')) return 'badge-sports';
    return 'badge-other';
  };

  const getCategoryIcon = () => {
    const categoryLower = item.category.toLowerCase();
    if (categoryLower.includes('electronics')) return '💻';
    if (categoryLower.includes('books')) return '📚';
    if (categoryLower.includes('furniture')) return '🛋️';
    if (categoryLower.includes('clothing')) return '👕';
    if (categoryLower.includes('sports')) return '⚽';
    return '🎁';
  };

  return (
    <>
      <Link to={`/item/${item.id}`} className="block group">
        <div className="relative glass-card glass-card-hover overflow-hidden transition-all duration-500 hover:shadow-glass-lg hover:-translate-y-2 animate-scale-in">
          
          {/* "Uploaded by you" badge */}
          {isOwnItem && (
            <div className="glass border-b border-neutral-200/30 dark:border-neutral-700/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-4 py-2 text-center">
              <span className="flex items-center justify-center gap-1.5">
                <span>✨</span>
                <span>Your Listing</span>
              </span>
            </div>
          )}
          
          {/* Image Container with Glass Overlay */}
          <div className="relative bg-gradient-to-br from-neutral-100/50 to-neutral-200/50 dark:from-neutral-800/50 dark:to-neutral-900/50 overflow-hidden">
            <div className="aspect-w-16 aspect-h-12">
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
            </div>
            
            {/* Glass Overlay on Hover */}
            <div className="absolute inset-0 frosted opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Image Count Badge */}
            {imageCount > 1 && (
              <div className="absolute bottom-3 right-3 z-20">
                <span className="glass text-neutral-700 dark:text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-glass flex items-center gap-1.5">
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
                <span className="glass text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-glass border border-emerald-300/50 dark:border-emerald-700/50 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Available
                </span>
              ) : (
                <span className="glass text-red-700 dark:text-red-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-glass border border-red-300/50 dark:border-red-700/50 flex items-center gap-1">
                  <span>✕</span>
                  Sold
                </span>
              )}
            </div>
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3 z-20">
              <span className={`glass text-xs font-bold px-3 py-1.5 rounded-xl shadow-glass border ${getCategoryBadgeClass()} flex items-center gap-1.5`}>
                <span>{getCategoryIcon()}</span>
                <span>{item.category}</span>
              </span>
            </div>
          </div>
          {/* Card Content */}
          <div className="p-4 sm:p-5 relative z-20">
            <h3 className="text-base sm:text-lg font-display font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300 leading-tight">
              {item.title}
            </h3>
            
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
            
            {/* Price Tag with Glass Effect */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative group/price">
                <div className="absolute -inset-1 bg-primary-400/20 dark:bg-primary-600/20 rounded-xl blur-md group-hover/price:blur-lg transition-all"></div>
                <div className="relative px-4 py-2 glass rounded-xl shadow-glass border border-primary-200/50 dark:border-primary-700/50">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium block">Price</span>
                  <span className="text-xl sm:text-2xl font-display font-extrabold text-primary-600 dark:text-primary-400">
                    ₹{parseFloat(item.price.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons with Glass Effect */}
            <div className="flex gap-2 mt-4">
              {!isOwnItem ? (
                <>
                  {isUnlocked ? (
                    <button
                      onClick={handleBookItem}
                      disabled={isBooking}
                      className="flex-1 glass rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-glass hover:shadow-glass-hover transition-all hover:scale-105 disabled:opacity-50 border border-emerald-300/50 dark:border-emerald-700/50"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {isBooking ? '...' : 'Book'}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={`/item/${item.id}`}
                      className="flex-1 btn-primary rounded-xl py-2.5 px-3 text-xs sm:text-sm text-center"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 glass rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold text-primary-700 dark:text-primary-300 shadow-glass hover:shadow-glass-hover transition-all hover:scale-105 disabled:opacity-50 border border-primary-300/50 dark:border-primary-700/50"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {isAddingToCart ? '...' : 'Cart'}
                    </span>
                  </button>
                </>
              ) : (
                <Link
                  to={`/item/${item.id}`}
                  className="flex-1 btn-primary rounded-xl py-2.5 px-3 text-xs sm:text-sm text-center"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Manage
                  </span>
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
