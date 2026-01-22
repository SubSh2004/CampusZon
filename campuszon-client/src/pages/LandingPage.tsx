import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const user = useRecoilValue(userAtom);
  const navigate = useNavigate();

  // Redirect logged-in users to /home
  useEffect(() => {
    if (user.isLoggedIn) {
      navigate('/home');
    }
  }, [user.isLoggedIn, navigate]);

  // Scroll-based animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionIndex = parseInt(entry.target.getAttribute('data-section') || '0');
            setVisibleSections((prev) => new Set(prev).add(sectionIndex));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleStartBuying = () => {
    if (user.isLoggedIn) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const faqs = [
    {
      question: "Is Campuszon free to use?",
      answer: "Yes! Browsing and listing items is completely free. We use a token-based system for unlocking seller contact details. New users get 2 free tokens to get started."
    },
    {
      question: "Who can access Campuszon?",
      answer: "Only verified college students can access Campuszon. You need to sign up with your college email and provide your hostel information to ensure campus-only access."
    },
    {
      question: "How do I know users are from my campus?",
      answer: "Every user must verify their college email and hostel name during signup. This ensures that you're only connecting with students from your own campus."
    },
    {
      question: "Can I rent items instead of buying?",
      answer: "Absolutely! Campuszon supports both buying and renting. Sellers can choose to offer their items for rent with custom pricing and duration."
    },
    {
      question: "Is payment handled by Campuszon?",
      answer: "We handle token purchases for unlocking contacts, but direct transactions (buying/renting items) happen between students. We provide a safe platform to connect within your campus."
    },
    {
      question: "What if I face an issue with a listing?",
      answer: "You can report inappropriate listings or contact our support team at campuszon@gmail.com or call +91 9332425174. We review all reports and take action to maintain a safe marketplace."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 md:pb-0">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.jpg" alt="Campuszon" className="w-8 h-8 rounded-full object-cover logo-nav" />
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Campuszon</span>
            </div>
            <div className="flex gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:scale-105"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 1️⃣ Hero Section - Mobile Optimized */}
      <section 
        data-section="0"
        className={`pt-20 md:pt-28 lg:pt-32 pb-8 md:pb-12 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all duration-700 ${
          visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ minHeight: 'clamp(70vh, 80vh, 90vh)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3 mb-3 md:mb-6">
                <img src="/logo-icon.jpg" alt="Campuszon" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover logo-hero" />
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-600 dark:text-indigo-400">Campuszon</h1>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6 animate-fade-in leading-tight">
                Buy, Sell & Rent Within Your Campus — <span className="text-indigo-600 dark:text-indigo-400 bg-clip-text">Safely.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-4 md:mb-8 line-clamp-2">
                A trusted student-to-student marketplace made exclusively for Indian campuses.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleStartBuying}
                  className="group px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base md:text-lg font-semibold rounded-lg transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110 hover:shadow-xl md:hover:shadow-2xl transform relative overflow-hidden"
                >
                  <span className="relative z-10">Start Buying</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <Link
                  to="/login"
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:text-white text-base md:text-lg font-semibold rounded-lg transition-all duration-200 md:duration-300 hover:scale-105 hover:shadow-md md:hover:shadow-lg text-center transform"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:inline-block px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base md:text-lg font-semibold rounded-lg transition-all duration-200 md:duration-300 hover:scale-105 hover:shadow-xl md:hover:shadow-2xl text-center transform"
                >
                  Sign Up
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative animate-slide-in-right">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-all duration-400 hover:shadow-3xl hover:-translate-y-2">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-all duration-200 md:duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-200 md:duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-indigo-700">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Engineering Textbooks</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Available in your hostel</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-all duration-200 md:duration-300 hover:translate-x-2 hover:shadow-lg cursor-pointer group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg flex items-center justify-center transition-all duration-200 md:duration-300 group-hover:scale-125 group-hover:-rotate-12 group-hover:bg-green-700">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Hostel Essentials</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Rent or buy from peers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-all duration-200 md:duration-300 hover:scale-105 hover:rotate-1 hover:shadow-xl cursor-pointer group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 md:duration-500 group-hover:scale-110 group-hover:rotate-180 group-hover:bg-purple-700">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Electronics & Gadgets</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">From your campus only</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ What is Campuszon? - Mobile Compressed */}
      <section 
        data-section="1"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6">
            What is Campuszon?
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 md:mb-12 line-clamp-3">
            Campuszon is an exclusive student marketplace where only verified students from your college can buy, sell, and rent items. 
            No outsiders, no scams — just trusted campus transactions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            <div className="p-4 md:p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl transition-all duration-200 md:duration-300 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-lg md:hover:shadow-2xl group cursor-pointer">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-300 md:duration-500 group-hover:bg-indigo-700 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Buy</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 line-clamp-2">Find affordable items from students in your campus</p>
            </div>
            <div className="p-4 md:p-6 bg-green-50 dark:bg-green-900/20 rounded-xl transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110 hover:shadow-lg md:hover:shadow-2xl hover:border-2 hover:border-green-500 group cursor-pointer">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-200 md:duration-300 group-hover:bg-green-700 group-hover:animate-bounce-gentle">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Sell</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 line-clamp-2">List items you no longer need and earn cash</p>
            </div>
            <div className="p-4 md:p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl transition-all duration-300 md:duration-500 hover:rotate-1 md:hover:rotate-2 hover:shadow-lg md:hover:shadow-2xl hover:bg-purple-100 dark:hover:bg-purple-900/40 group cursor-pointer">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-400 md:duration-700 group-hover:bg-purple-700 group-hover:scale-110 group-hover:rotate-[360deg]">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Rent</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 line-clamp-2">Rent items for short-term use at low prices</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ How Campuszon Works - Horizontal Scroll on Mobile */}
      <section 
        data-section="2"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-all duration-700 ${
          visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-6 md:mb-12 lg:mb-16">
            How Campuszon Works
          </h2>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {/* Step 1 */}
              <div className="snap-start w-[85vw] sm:w-96 flex-shrink-0 bg-white dark:bg-gray-900 p-5 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sign Up</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  Create account with college email and verify your hostel details.
                </p>
                <div className="mt-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-4 rounded-lg h-32 flex items-center justify-center">
                  <img src="/logo-icon.jpg" alt="Campuszon" className="w-20 h-20 rounded-full object-cover logo-onboarding" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="snap-start w-[85vw] sm:w-96 flex-shrink-0 bg-white dark:bg-gray-900 p-5 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Browse Items</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  Explore items from your campus or list your own for sale or rent.
                </p>
                <div className="mt-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-lg h-32 flex items-center justify-center">
                  <svg className="w-20 h-20 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="snap-start w-[85vw] sm:w-96 flex-shrink-0 bg-white dark:bg-gray-900 p-5 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connect Direct</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  Unlock contacts and chat with students. Discuss prices and details.
                </p>
                <div className="mt-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-lg h-32 flex items-center justify-center">
                  <svg className="w-20 h-20 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>

              {/* Step 4 */}
              <div className="snap-start w-[85vw] sm:w-96 flex-shrink-0 bg-white dark:bg-gray-900 p-5 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Meet & Exchange</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  Meet on campus at safe location and complete the exchange.
                </p>
                <div className="mt-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 p-4 rounded-lg h-32 flex items-center justify-center">
                  <svg className="w-20 h-20 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Original Grid Layout */}
          <div className="hidden lg:block space-y-12 xl:space-y-16">
            {/* Step 1 - ONLY Animated Step */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" data-animated="true">
              <div className="order-2 lg:order-1">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-indigo-500/50 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg hover:shadow-indigo-400/50">1</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sign Up with College Email</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Create your account using your college email ID and verify your hostel details. This ensures only genuine students from your campus can access the platform.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-8 rounded-xl h-64 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl animate-gradient cursor-pointer">
                  <img src="/logo-icon.jpg" alt="Campuszon" className="w-32 h-32 rounded-full object-cover logo-onboarding" />
                </div>
              </div>
            </div>

            {/* Step 2 - Animated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" data-animated="true">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-8 rounded-xl h-64 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                <svg className="w-32 h-32 text-green-600 dark:text-green-400 transition-transform duration-300 hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-green-500/50 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-lg hover:shadow-green-400/50">2</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Browse or List Items</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Explore items listed by students in your campus or add your own items for sale or rent. Everything is categorized for easy browsing.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 - Animated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" data-animated="true">
              <div className="order-2 lg:order-1">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-purple-500/50 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 hover:scale-110 hover:-rotate-6 hover:shadow-lg hover:shadow-purple-400/50">3</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Directly</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Unlock seller contact details and chat directly with students. Discuss prices, condition, and arrange a convenient meeting spot.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-8 rounded-xl h-64 flex items-center justify-center transition-all duration-500 hover:scale-105 hover:shadow-xl hover:rotate-2 cursor-pointer">
                  <svg className="w-32 h-32 text-purple-600 dark:text-purple-400 transition-all duration-500 hover:scale-110 hover:rotate-[360deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Step 4 - Animated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" data-animated="true">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 p-8 rounded-xl h-64 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:animate-glow-pulse cursor-pointer">
                <svg className="w-32 h-32 text-orange-600 dark:text-orange-400 transition-all duration-300 hover:scale-110 hover:animate-bounce-gentle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-orange-500/50 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-lg hover:shadow-orange-400/50">4</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Meet & Exchange Safely</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Meet inside your campus at a safe location like the library, canteen, or hostel. Exchange items and complete the transaction in person.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ What You Can Find - Mobile Optimized with Horizontal Scroll */}
      <section 
        data-section="3"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-3 md:mb-6">
            What You Can Find on Campuszon
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto mb-6 md:mb-12 line-clamp-2">
            From textbooks to tech gadgets — everything a student needs, all within your campus
          </p>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide mb-6">
            <div className="flex gap-3 min-w-max">
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Books & Notes</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Textbooks, exam books, semester notes</p>
              </div>
              
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Cycles</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Bicycles for campus commute</p>
              </div>
              
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Calculators</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Scientific & graphing calculators</p>
              </div>
              
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Electronics</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Laptops, tablets, headphones</p>
              </div>
              
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Hostel Essentials</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Mattresses, coolers, kettles</p>
              </div>
              
              <div className="snap-start w-64 flex-shrink-0 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">And More</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">Sports, instruments & more!</p>
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Books - Scale + Shadow */}
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-transparent hover:border-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
              <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-blue-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Books & Notes</h3>
              <p className="text-gray-600 dark:text-gray-400">Engineering textbooks, competitive exam books, semester notes at discounted prices</p>
            </div>

            {/* Card 2: Cycles - Pop Animation */}
            <div className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-transparent hover:border-green-600 transition-all duration-400 hover:animate-pop-in hover:shadow-2xl cursor-pointer">
              <div className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12 group-hover:bg-green-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cycles</h3>
              <p className="text-gray-600 dark:text-gray-400">Bicycles for campus commute — buy or rent from seniors</p>
            </div>

            {/* Card 3: Calculators - Tilt + Glow */}
            <div className="group p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-transparent hover:border-purple-600 transition-all duration-300 hover:rotate-2 hover:shadow-2xl hover:animate-border-glow cursor-pointer">
              <div className="w-14 h-14 bg-purple-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-600 group-hover:scale-110 group-hover:rotate-[360deg] group-hover:bg-purple-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calculators</h3>
              <p className="text-gray-600 dark:text-gray-400">Scientific calculators, graphing calculators for exams</p>
            </div>

            {/* Card 4: Electronics - Icon Bounce + Lift */}
            <div className="group p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-transparent hover:border-orange-600 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl cursor-pointer">
              <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:animate-bounce-gentle group-hover:bg-orange-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Electronics</h3>
              <p className="text-gray-600 dark:text-gray-400">Laptops, tablets, headphones, chargers and more</p>
            </div>

            {/* Card 5: Hostel Essentials - Glow Pulse + Zoom */}
            <div className="group p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border-2 border-transparent hover:border-red-600 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:animate-glow-pulse cursor-pointer">
              <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-400 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-red-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hostel Essentials</h3>
              <p className="text-gray-600 dark:text-gray-400">Mattresses, coolers, electric kettles, storage boxes</p>
            </div>

            {/* Card 6: And More - Shake + Slide */}
            <div className="group p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-transparent hover:border-teal-600 transition-all duration-300 hover:translate-x-2 hover:shadow-2xl hover:animate-tilt-shake cursor-pointer">
              <div className="w-14 h-14 bg-teal-600 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-125 group-hover:-rotate-6 group-hover:bg-teal-700">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">And More</h3>
              <p className="text-gray-600 dark:text-gray-400">Sports equipment, musical instruments, lab coats, anything you need!</p>
            </div>
          </div>
          <div className="mt-6 md:mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row gap-2 md:gap-4 items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 md:p-6 rounded-xl transition-all duration-200 md:duration-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:shadow-lg">
              <div className="group flex items-center gap-2 cursor-pointer transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 transition-all duration-200 md:duration-300 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm md:text-base text-gray-900 dark:text-white font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 md:duration-300">Affordable prices</span>
              </div>
              <div className="group flex items-center gap-2 cursor-pointer transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 transition-all duration-200 md:duration-300 group-hover:scale-110 md:group-hover:scale-125 group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm md:text-base text-gray-900 dark:text-white font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 md:duration-300">Zero delivery hassles</span>
              </div>
              <div className="group flex items-center gap-2 cursor-pointer transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 transition-all duration-200 md:duration-300 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm md:text-base text-gray-900 dark:text-white font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 md:duration-300">Same-campus pickup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Why Students Love Campuszon - Mobile Compressed */}
      <section 
        data-section="4"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-600 to-purple-600 text-white transition-all duration-700 ${
          visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 lg:mb-16">
            Why Students Love Campuszon
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <div className="text-center group transition-all duration-200 md:duration-300 cursor-pointer">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-300 md:duration-500 group-hover:bg-white/40 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-bold mb-1 md:mb-2 relative group-hover:underline transition-all duration-200 md:duration-300">No Scams</h3>
              <p className="text-xs md:text-sm text-indigo-100 group-hover:text-white transition-colors duration-200 md:duration-300 line-clamp-2">Campus-verified users only</p>
            </div>

            <div className="text-center group transition-all duration-200 md:duration-300 cursor-pointer">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-300 md:duration-500 group-hover:bg-white/40 group-hover:scale-105 md:group-hover:scale-110 group-hover:-rotate-12">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-bold mb-1 md:mb-2 relative group-hover:underline transition-all duration-200 md:duration-300">No Shipping</h3>
              <p className="text-xs md:text-sm text-indigo-100 group-hover:text-white transition-colors duration-200 md:duration-300 line-clamp-2">Meet on campus instantly</p>
            </div>

            <div className="text-center group transition-all duration-200 md:duration-300 cursor-pointer">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-300 md:duration-500 group-hover:bg-white/40 group-hover:scale-110 md:group-hover:scale-125 group-hover:animate-bounce-gentle">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-bold mb-1 md:mb-2 relative group-hover:underline transition-all duration-200 md:duration-300">Easy Chat</h3>
              <p className="text-xs md:text-sm text-indigo-100 group-hover:text-white transition-colors duration-200 md:duration-300 line-clamp-2">Direct contact with sellers</p>
            </div>

            <div className="text-center group transition-all duration-200 md:duration-300 cursor-pointer">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 transition-all duration-400 md:duration-700 group-hover:bg-white/40 group-hover:scale-105 md:group-hover:scale-110 group-hover:rotate-[360deg]">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-bold mb-1 md:mb-2 relative group-hover:underline transition-all duration-200 md:duration-300">Sustainable</h3>
              <p className="text-xs md:text-sm text-indigo-100 group-hover:text-white transition-colors duration-200 md:duration-300 line-clamp-2">Give items a second life</p>
            </div>
          </div>
          <div className="mt-8 md:mt-12 lg:mt-16 text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 max-w-3xl mx-auto transition-all duration-300 md:duration-500 hover:bg-white/20 hover:scale-105 hover:shadow-2xl">
            <p className="text-xl italic mb-4">
              "Built for students, by students — because we understand campus life."
            </p>
            <div className="flex items-center justify-center gap-2 text-yellow-300">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 7️⃣ FAQ Section - Mobile Compressed */}
      <section 
        data-section="6"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-2 md:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center mb-6 md:mb-12">
            Everything you need to know about Campuszon
          </p>
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-indigo-500"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white pr-2">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 md:duration-300 flex-shrink-0 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 md:px-6 pb-3 md:pb-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 md:mt-8 text-center">
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4">Still have questions?</p>
            <Link
              to="/faq"
              className="text-sm md:text-base text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Visit our detailed FAQ page →
            </Link>
          </div>
        </div>
      </section>

      {/* 8️⃣ Final CTA - Mobile Compressed */}
      <section 
        data-section="7"
        className={`py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white transition-all duration-700 ${
          visibleSections.has(7) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 animate-pulse-subtle">
            From Campus. For Campus.
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 lg:mb-12 text-indigo-100 animate-fade-in line-clamp-2">
            Join thousands of students already trading safely within their campus
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-6 md:mb-8 lg:mb-12">
            <button
              onClick={handleStartBuying}
              className="group relative px-8 md:px-10 py-3 md:py-4 bg-white text-indigo-600 text-base md:text-lg font-bold rounded-lg transition-all duration-300 md:duration-500 shadow-xl md:shadow-2xl hover:scale-105 md:hover:scale-110 hover:shadow-[0_15px_40px_rgba(255,255,255,0.3)] md:hover:shadow-[0_20px_60px_rgba(255,255,255,0.4)] overflow-hidden"
            >
              <span className="relative z-10 group-hover:scale-105 md:group-hover:scale-110 inline-block transition-transform duration-200 md:duration-300">Start Buying</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:duration-500"></div>
            </button>
            <Link
              to="/signup"
              className="group px-8 md:px-10 py-3 md:py-4 bg-transparent border-2 border-white text-white text-base md:text-lg font-bold rounded-lg transition-all duration-200 md:duration-300 hover:scale-105 md:hover:scale-110 hover:shadow-xl md:hover:shadow-2xl hover:bg-white hover:text-indigo-600 hover:-rotate-1 md:hover:-rotate-2 text-center transform"
            >
              Sign Up Now
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 lg:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>100% Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Campus-verified only</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>2 free tokens included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl border-t-2 border-indigo-400">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">Start Trading on Campus</p>
            <p className="text-indigo-100 text-xs truncate">Join thousands of students</p>
          </div>
          <button
            onClick={handleStartBuying}
            className="flex-shrink-0 px-6 py-2.5 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
          >
            Join Now
          </button>
        </div>
      </div>
    </div>
  );
}
