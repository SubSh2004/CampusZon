import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import axios from 'axios';
import { userAtom } from '../store/user.atom';
import ProductCard from './ProductCard';
import { fuzzySearch } from '../utils/searchUtils';

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
}

export default function ProductsList({ searchQuery = '', selectedCategory = 'All', listingTypeFilter = 'All', availabilityFilter = 'All' }: ProductsListProps) {
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

  // Reset pagination when filters change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, selectedCategory, listingTypeFilter, availabilityFilter, user.email]);

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
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/items?emailDomain=${emailDomain}&page=${page}&limit=8`);
        
        if (response.data.success) {
          setItems(prev => page === 1 ? response.data.items : [...prev, ...response.data.items]);
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
  }, [user.email, page]);

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

  // Filter items based on search query, category, and availability
  let filteredItems = items;
  
  // Apply fuzzy search if query exists
  if (searchQuery && searchQuery.trim()) {
    filteredItems = fuzzySearch(filteredItems, searchQuery, 0.3);
  }
  
  // Filter by category
  filteredItems = filteredItems.filter((item) => {
    let matchesCategory = true;
    if (selectedCategory && selectedCategory !== 'All') {
      matchesCategory = item.category.includes(selectedCategory);
    }
    
    // Filter by listing type
    let matchesListingType = true;
    if (listingTypeFilter && listingTypeFilter !== 'All') {
      matchesListingType = item.category.includes(listingTypeFilter);
    }
    
    // Filter by availability
    let matchesAvailability = true;
    if (availabilityFilter && availabilityFilter !== 'All') {
      matchesAvailability = availabilityFilter === 'Available' ? item.available : !item.available;
    }
    
    return matchesCategory && matchesListingType && matchesAvailability;
  });

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
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
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
