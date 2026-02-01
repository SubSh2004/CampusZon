import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import { userAtom } from '../store/user.atom';
import ProductCard from './ProductCard';

interface Item {
  id: string; // Changed from number to string for MongoDB ObjectId compatibility
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  createdAt: string;
  userId: string; // Required for booking
  userName: string; // Required for booking
  userEmail: string;
  userPhone: string;
}

interface ProductsListProps {
  searchQuery?: string;
  selectedCategory?: string;
  listingTypeFilter?: string;
  availabilityFilter?: string;
  onItemsFetched?: (items: Item[]) => void;
}

export default function ProductsList({ searchQuery = '', selectedCategory = 'All', listingTypeFilter = 'All', availabilityFilter = 'All', onItemsFetched }: ProductsListProps) {
  const user = useRecoilValue(userAtom);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Ref for the last item to trigger infinite scroll
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // Reset pagination when search, filters, or user changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [user.email, searchQuery, selectedCategory, listingTypeFilter, availabilityFilter]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        // Extract email domain from user email
        let emailDomain = '';
        if (user.email) {
          emailDomain = user.email.split('@')[1] || '';
        }
        
        // If no domain or not logged in, show message
        if (!emailDomain) {
          setError('Please login to view items from your campus.');
          setItems([]);
          onItemsFetched?.([]);
          setLoading(false);
          return;
        }
        
        // Build API URL with all filter parameters
        const params = new URLSearchParams({
          emailDomain,
          page: page.toString(),
          limit: '8'
        });
        
        if (searchQuery && searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        
        // Add filter parameters (backend will handle filtering)
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        
        if (listingTypeFilter && listingTypeFilter !== 'All') {
          params.append('listingType', listingTypeFilter);
        }
        
        if (availabilityFilter && availabilityFilter !== 'All') {
          params.append('availability', availabilityFilter);
        }
        
        const response = await axios.get(`/api/items?${params.toString()}`);
        
        if (response.data.success) {
          setItems(prev => {
            const updatedItems = page === 1 ? response.data.items : [...prev, ...response.data.items];
            onItemsFetched?.(updatedItems);
            return updatedItems;
          });
          setHasMore(response.data.pagination.hasMore);
        }
      } catch (err: any) {
        console.error('Error fetching items:', err);
        setError(err.response?.data?.message || 'Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchItems();
  }, [user.email, page, searchQuery, selectedCategory, listingTypeFilter, availabilityFilter, onItemsFetched]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  // All filtering is now handled by backend - no client-side filtering needed
  const filteredItems = items;

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 sm:py-20">
        <div className="inline-block p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mx-3">
          {searchQuery ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">No items found for "{searchQuery}"</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2">Try searching with different keywords</p>
            </>
          ) : (selectedCategory && selectedCategory !== 'All') || (availabilityFilter && availabilityFilter !== 'All') ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                No items found {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''} 
                {selectedCategory !== 'All' && availabilityFilter !== 'All' ? ' - ' : ''}
                {availabilityFilter !== 'All' ? availabilityFilter : ''}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2">Try adjusting your filters</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">No items available yet.</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2">Be the first to list an item!</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {filteredItems.map((item, index) => {
          // Attach ref to last item for infinite scroll
          if (filteredItems.length === index + 1) {
            return (
              <div key={item.id} ref={lastItemRef}>
                <ProductCard item={item} />
              </div>
            );
          } else {
            return <ProductCard key={item.id} item={item} />;
          }
        })}
      </div>
      
      {/* Loading more indicator with enhanced rolling logo */}
      {loadingMore && (
        <div className="flex flex-col items-center py-8 relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          {/* Logo with enhanced animations */}
          <div className="relative">
            {/* Spinning ring around logo */}
            <div className="absolute inset-0 -m-2">
              <div className="w-20 h-20 border-4 border-transparent border-t-indigo-500 border-r-purple-500 rounded-full animate-spin"></div>
            </div>
            
            {/* Main logo */}
            <img
              src="/logo-icon.jpg"
              alt="CampusZon loading"
              className="h-16 w-16 relative z-10"
              style={{ animation: 'rollAndGlow 2s cubic-bezier(0.4,0,0.2,1) infinite' }}
            />
          </div>
          
          {/* Loading dots */}
          <div className="flex gap-1.5 mt-4 mb-2">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 font-bold text-sm tracking-wide animate-pulse">
            Loading more items...
          </span>
          
          <style>{`
            @keyframes rollAndGlow {
              0% { 
                transform: translateY(-15px) rotate(0deg) scale(0.9);
                filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
              }
              25% { 
                transform: translateY(0) rotate(90deg) scale(1);
                filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6));
              }
              50% { 
                transform: translateY(15px) rotate(180deg) scale(1.05);
                filter: drop-shadow(0 0 16px rgba(236, 72, 153, 0.8));
              }
              75% { 
                transform: translateY(0) rotate(270deg) scale(1);
                filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6));
              }
              100% { 
                transform: translateY(-15px) rotate(360deg) scale(0.9);
                filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
              }
            }
          `}</style>
        </div>
      )}
      
      {/* No more items message */}
      {!hasMore && filteredItems.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No more items to load
        </div>
      )}
    </>
  );
}
