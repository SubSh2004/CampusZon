import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';
import { cartAtom } from '../store/cart.atom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getOrganizationName } from '../utils/domainMapper';
import ProductsList from '../components/ProductsList';
import Notifications from '../components/Notifications';
import SearchWithAutoComplete from '../components/SearchWithAutoComplete';
import TokenPurchase from '../components/TokenPurchase';
import { generateSuggestions } from '../utils/searchUtils';
import axios from '../config/axios';

type SuggestionSourceItem = {
  title: string;
  description: string;
  category: string;
};

export default function Home() {
  const user = useRecoilValue(userAtom);
  const cart = useRecoilValue(cartAtom);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [itemsForSuggestions, setItemsForSuggestions] = useState<SuggestionSourceItem[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokens, setTokens] = useState<number>(0);
  
  const organizationName = user.email ? getOrganizationName(user.email) : '';

  const categories = [
    'All',
    'Electronics',
    'Books',
    'Furniture',
    'Clothing',
    'Sports',
    'Other'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    setSearchSuggestions(generateSuggestions(itemsForSuggestions, searchQuery));
  }, [itemsForSuggestions, searchQuery]);

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchTokenBalance();
    }
  }, [user.isLoggedIn]);

  const fetchTokenBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTokens(response.data.currentTokens);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const handlePurchaseToken = async (packageId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to purchase tokens');
        return;
      }

      const response = await axios.post(
        '/api/tokens/purchase',
        { packageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.requiresPayment) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: response.data.order.amount,
            currency: response.data.order.currency,
            name: 'CampusZon',
            description: `${response.data.packageDetails.tokens} Unlock Tokens`,
            order_id: response.data.order.id,
            handler: async (razorpayResponse: any) => {
              try {
                const verifyResponse = await axios.post(
                  '/api/tokens/verify',
                  {
                    razorpay_order_id: razorpayResponse.razorpay_order_id,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                    paymentId: response.data.payment.id
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (verifyResponse.data.success) {
                  alert(`✅ Successfully added ${verifyResponse.data.tokensAdded} tokens!`);
                  setShowTokenModal(false);
                  fetchTokenBalance();
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                alert('Payment verification failed. Please contact support.');
              }
            },
            prefill: {
              name: user.username || '',
              email: user.email || '',
            },
            theme: {
              color: '#4F46E5'
            }
          };

          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
        };
      }
    } catch (error: any) {
      console.error('Token purchase error:', error);
      alert(error.response?.data?.message || 'Failed to initiate purchase');
    }
  };

  const handleItemsFetched = useCallback((items: SuggestionSourceItem[]) => {
    setItemsForSuggestions(items);
  }, []);

  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) + (listingTypeFilter !== 'All' ? 1 : 0) + (availabilityFilter !== 'All' ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Professional Welcome Banner */}
      {user.isLoggedIn && organizationName && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-b border-slate-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center text-center">
              <div>
                <p className="text-sm font-semibold text-white">
                  {organizationName} Marketplace
                </p>
                <p className="text-xs text-slate-300 mt-0.5">Connect, buy, and sell within your campus community</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Professional Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile: Stack everything vertically */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Top Row: Logo and Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <img 
                  src="/logo-icon.jpg" 
                  alt="CampusZon Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">CampusZon</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                    {user.isLoggedIn && organizationName 
                      ? `Marketplace for ${organizationName}` 
                      : 'Campus Marketplace'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
                
                {/* Cart Icon - Only show when logged in */}
                {user.isLoggedIn && (
                  <Link
                    to="/cart"
                    className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Shopping cart"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cart.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cart.count > 9 ? '9+' : cart.count}
                      </span>
                    )}
                  </Link>
                )}
                
                {/* Notifications - Only show when logged in */}
                {user.isLoggedIn && <Notifications />}
              </div>
            </div>
            
            {/* Bottom Row: Navigation (only when logged in) */}
            {user.isLoggedIn ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap hidden sm:block">Welcome, {user.username}!</span>
                <Link
                  to="/profile"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link
                  to="/add-item"
                  className="flex items-center gap-1 bg-indigo-600 dark:bg-indigo-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium text-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </Link>
                <Link
                  to="/bookings"
                  className="flex items-center gap-1 bg-green-600 dark:bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-medium text-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Bookings
                </Link>
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition font-medium text-sm whitespace-nowrap shadow-sm"
                >
                  <span className="text-base">🎫</span>
                  <span className="font-bold">{tokens}</span>
                  <span className="hidden sm:inline">Tokens</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-red-700 dark:text-red-400 text-sm font-medium whitespace-nowrap ml-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Token Purchase Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTokenModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    🎫 Top Up Tokens
                  </h2>
                  <p className="text-sm sm:text-base text-indigo-100 mt-1">
                    You have <span className="font-bold text-white">{tokens}</span> {tokens === 1 ? 'token' : 'tokens'}
                  </p>
                </div>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <TokenPurchase onSelectPackage={handlePurchaseToken} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Search Bar with Auto-Complete */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="max-w-3xl mx-auto">
            <SearchWithAutoComplete
              value={searchQuery}
              onChange={setSearchQuery}
              suggestions={searchSuggestions}
              placeholder="Search for items (laptop, books, furniture...)"
            />
          </div>
        </div>

        {/* Filter Dropdown - Compact & Mobile-Friendly */}
        <div className="mb-6">
          <div className="max-w-5xl mx-auto" ref={filterRef}>
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-between w-full sm:w-auto px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-gray-200">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <svg className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-80 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                  {/* Listing Type Section */}
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Listing Type</h3>
                      {listingTypeFilter !== 'All' && (
                        <button
                          onClick={() => setListingTypeFilter('All')}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setListingTypeFilter('All')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          listingTypeFilter === 'All'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setListingTypeFilter('For Sale')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          listingTypeFilter === 'For Sale'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        💰 For Sale
                      </button>
                      <button
                        onClick={() => setListingTypeFilter('For Rent')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          listingTypeFilter === 'For Rent'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        🏠 For Rent
                      </button>
                    </div>
                  </div>

                  {/* Category Section */}
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Category</h3>
                      {selectedCategory !== 'All' && (
                        <button
                          onClick={() => setSelectedCategory('All')}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Availability</h3>
                      {availabilityFilter !== 'All' && (
                        <button
                          onClick={() => setAvailabilityFilter('All')}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAvailabilityFilter('All')}
                        className={`w-full px-3 py-2 rounded-md text-sm font-medium text-left transition-all ${
                          availabilityFilter === 'All'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        All Items
                      </button>
                      <button
                        onClick={() => setAvailabilityFilter('Available')}
                        className={`w-full px-3 py-2 rounded-md text-sm font-medium text-left transition-all flex items-center gap-2 ${
                          availabilityFilter === 'Available'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Available Only
                      </button>
                      <button
                        onClick={() => setAvailabilityFilter('Sold Out')}
                        className={`w-full px-3 py-2 rounded-md text-sm font-medium text-left transition-all flex items-center gap-2 ${
                          availabilityFilter === 'Sold Out'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Sold Out
                      </button>
                    </div>
                  </div>

                  {/* Clear All Button */}
                  {activeFiltersCount > 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setListingTypeFilter('All');
                          setAvailabilityFilter('All');
                        }}
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery 
              ? `Results for "${searchQuery}"` 
              : selectedCategory === 'All' && availabilityFilter === 'All'
                ? 'All Items' 
                : [
                    selectedCategory !== 'All' ? selectedCategory : null,
                    availabilityFilter !== 'All' ? availabilityFilter : null
                  ].filter(Boolean).join(' - ') || 'All Items'}
          </h2>
          {user.isLoggedIn && organizationName ? (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
              Showing items from <span className="font-semibold text-gray-900 dark:text-white">{organizationName}</span> students
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">Login to browse items from your campus</p>
          )}
        </div>
        
        <ProductsList
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          listingTypeFilter={listingTypeFilter}
          availabilityFilter={availabilityFilter}
          onItemsFetched={handleItemsFetched}
        />
      </main>

      {/* Clean Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-600 dark:text-slate-400">
          <p>&copy; 2025 CampusZon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
