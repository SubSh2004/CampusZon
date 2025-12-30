import { useState, useRef, useEffect } from 'react';
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
  const [searchSuggestions] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const organizationName = user.email ? getOrganizationName(user.email) : '';

  const categories = [
    { name: 'All', icon: '🏪', color: 'gray' },
    { name: 'Electronics', icon: '💻', color: 'purple' },
    { name: 'Books', icon: '📚', color: 'amber' },
    { name: 'Furniture', icon: '🛋️', color: 'emerald' },
    { name: 'Clothing', icon: '👕', color: 'pink' },
    { name: 'Sports', icon: '⚽', color: 'blue' },
    { name: 'Other', icon: '🎁', color: 'gray' }
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

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-fade-in').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [selectedCategory, listingTypeFilter, availabilityFilter, searchQuery]);

  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) + (listingTypeFilter !== 'All' ? 1 : 0) + (availabilityFilter !== 'All' ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-steel-50/50 dark:from-neutral-950 dark:via-primary-950/30 dark:to-steel-950/50 transition-colors duration-500">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-steel-200/20 dark:bg-steel-800/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Glassmorphism Welcome Banner */}
      {user.isLoggedIn && organizationName && (
        <div className="relative glass border-b border-neutral-200/50 dark:border-neutral-700/30 animate-slide-up">
          <div className="container mx-auto px-4 py-4 relative z-10">
            <div className="flex items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-2xl animate-float shadow-glass">
                🎓
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-neutral-800 dark:text-neutral-100">
                  {organizationName} Marketplace
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">
                  Connect, trade, and discover within your campus
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 animate-slide-up">
        <div className="glass border-b border-neutral-200/50 dark:border-neutral-700/30 shadow-glass">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary-400/30 dark:bg-primary-600/30 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
                    <img 
                      src="/logo-icon.jpg" 
                      alt="CampusKart" 
                      className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl object-cover border-2 border-white/50 dark:border-neutral-700/50 shadow-glass group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-gradient truncate">
                      CampusKart
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 truncate font-medium">
                      {user.isLoggedIn && organizationName 
                        ? `${organizationName}` 
                        : 'Student Marketplace'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 glass rounded-xl hover:scale-105 transition-all shadow-glass hover:shadow-glass-hover"
                    aria-label="Toggle theme"
                  >
                    {theme === 'light' ? (
                      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Cart Icon */}
                  {user.isLoggedIn && (
                    <Link
                      to="/cart"
                      className="relative p-2.5 glass rounded-xl hover:scale-105 transition-all shadow-glass hover:shadow-glass-hover"
                      aria-label="Shopping cart"
                    >
                      <svg className="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cart.count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-glow-sm">
                          {cart.count > 9 ? '9+' : cart.count}
                        </span>
                      )}
                    </Link>
                  )}
                  
                  {/* Notifications */}
                  {user.isLoggedIn && <Notifications />}
                </div>
              </div>
              
              {/* Navigation Row */}
              {user.isLoggedIn ? (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
                  <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap hidden sm:block font-medium">
                    Hey, <span className="font-bold">{user.username}</span>!
                  </span>
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl hover:scale-105 transition-all text-neutral-700 dark:text-neutral-300 text-sm font-semibold whitespace-nowrap shadow-glass hover:shadow-glass-hover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                  <Link
                    to="/add-item"
                    className="flex items-center gap-1.5 btn-primary text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Sell Item
                  </Link>
                  <Link
                    to="/bookings"
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 glass rounded-xl hover:scale-105 transition-all text-emerald-700 dark:text-emerald-400 text-sm font-bold whitespace-nowrap shadow-glass hover:shadow-glass-hover border-2 border-emerald-300/50 dark:border-emerald-700/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl hover:scale-105 transition-all text-red-600 dark:text-red-400 text-sm font-semibold whitespace-nowrap ml-auto shadow-glass hover:shadow-glass-hover border border-red-300/30 dark:border-red-700/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-secondary"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10 relative z-10">
        {/* Floating Search Bar */}
        <div className="mb-8 sm:mb-10 scroll-fade-in">
          <div className="max-w-3xl mx-auto">
            <div className="relative glass-card p-1 shadow-glass-lg">
              <SearchWithAutoComplete
                value={searchQuery}
                onChange={setSearchQuery}
                suggestions={searchSuggestions}
                placeholder="🔍 Search for items..."
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-6 overflow-x-auto scrollbar-hide scroll-fade-in">
          <div className="flex gap-2 sm:gap-3 pb-2 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
            {categories.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                style={{ animationDelay: `${index * 0.1}s` }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shadow-glass hover:shadow-glass-hover animate-scale-in ${
                  selectedCategory === category.name
                    ? 'glass scale-105 border-2 border-primary-300/50 dark:border-primary-700/50'
                    : 'glass-hover'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
                {selectedCategory === category.name && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-8 scroll-fade-in" ref={filterRef}>
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-between w-full sm:w-auto px-5 py-3 glass rounded-2xl shadow-glass hover:shadow-glass-hover hover:scale-105 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl glass">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-glow-sm">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <svg className={`w-5 h-5 text-neutral-600 dark:text-neutral-300 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isFilterOpen && (
                <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-96 mt-3 glass-card shadow-glass-lg z-50 overflow-hidden animate-slide-up">
                  {/* Listing Type */}
                  <div className="p-5 border-b border-neutral-200/30 dark:border-neutral-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="text-lg">🏷️</span>
                        Listing Type
                      </h3>
                      {listingTypeFilter !== 'All' && (
                        <button
                          onClick={() => setListingTypeFilter('All')}
                          className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['All', 'For Sale', 'For Rent'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setListingTypeFilter(type)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            listingTypeFilter === type
                              ? 'bg-primary-500 text-white shadow-glow-sm scale-105'
                              : 'glass hover:scale-105'
                          }`}
                        >
                          {type === 'For Sale' ? '💰' : type === 'For Rent' ? '🏠' : '📦'} {type.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        Availability
                      </h3>
                      {availabilityFilter !== 'All' && (
                        <button
                          onClick={() => setAvailabilityFilter('All')}
                          className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {[
                        { value: 'All', label: 'All Items', icon: '📦' },
                        { value: 'Available', label: 'Available Only', icon: '✅' },
                        { value: 'Sold Out', label: 'Sold Out', icon: '❌' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setAvailabilityFilter(option.value)}
                          className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-3 ${
                            availabilityFilter === option.value
                              ? 'bg-primary-500 text-white shadow-glow-sm scale-105'
                              : 'glass hover:scale-105'
                          }`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear All */}
                  {activeFiltersCount > 0 && (
                    <div className="p-4 border-t border-neutral-200/30 dark:border-neutral-700/30 frosted">
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setListingTypeFilter('All');
                          setAvailabilityFilter('All');
                        }}
                        className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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

        {/* Section Header */}
        <div className="mb-6 sm:mb-8 scroll-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
            {searchQuery 
              ? `🔎 Results for "${searchQuery}"` 
              : selectedCategory === 'All' && availabilityFilter === 'All'
                ? '🎯 Browse All Items' 
                : `${selectedCategory !== 'All' ? categories.find(c => c.name === selectedCategory)?.icon + ' ' + selectedCategory : ''} ${availabilityFilter !== 'All' ? '• ' + availabilityFilter : ''}`}
          </h2>
          {user.isLoggedIn && organizationName ? (
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2 font-medium">
              Showing items from <span className="font-bold text-primary-500">{organizationName}</span> students
            </p>
          ) : (
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
              🔐 Login to browse items from your campus
            </p>
          )}
        </div>
        
        {/* Products Grid */}
        <div className="scroll-fade-in">
          <ProductsList 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory} 
            listingTypeFilter={listingTypeFilter} 
            availabilityFilter={availabilityFilter} 
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-neutral-200/50 dark:border-neutral-700/30 mt-12 sm:mt-16">
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/logo-icon.jpg" alt="CampusKart" className="w-10 h-10 rounded-xl shadow-glass" />
              <span className="text-xl font-display font-bold text-gradient">CampusKart</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Your trusted campus marketplace
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              &copy; 2025 CampusKart. Made with ❤️ for students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}