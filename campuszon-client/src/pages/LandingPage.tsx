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

      {/* 1️⃣ Hero Section - Ultra Compact Mobile */}
      <section 
        data-section="0"
        className={`pt-16 md:pt-24 lg:pt-32 pb-6 md:pb-10 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all duration-700 ${
          visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ minHeight: '65vh' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 md:mb-4">
                <img src="/logo-icon.jpg" alt="Campuszon" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover logo-hero" />
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">Campuszon</h1>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 animate-fade-in leading-tight line-clamp-2">
                Buy, Sell & Rent Within Your Campus — <span className="text-indigo-600 dark:text-indigo-400">Safely.</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-3 md:mb-6 line-clamp-1">
                Trusted student-to-student marketplace for Indian campuses.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center lg:justify-start">
                <button
                  onClick={handleStartBuying}
                  className="group px-5 md:px-7 py-2.5 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm md:text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg transform relative overflow-hidden"
                >
                  <span className="relative z-10">Start Buying</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <Link
                  to="/login"
                  className="px-5 md:px-7 py-2.5 md:py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-sm md:text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-center"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative animate-slide-in-right">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-400 hover:shadow-3xl hover:-translate-y-2">
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

      {/* 2️⃣ What is Campuszon? - Compact Feature Rows (No Cards) */}
      <section 
        data-section="1"
        className={`py-6 md:py-10 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 text-center">
            What is Campuszon?
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 text-center mb-4 md:mb-8 line-clamp-2 max-w-2xl mx-auto">
            Exclusive student marketplace where only verified students from your college can buy, sell, and rent items.
          </p>
          
          {/* Compact Rows - Mobile & Tablet */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Buy</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">Find affordable items from campus students</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Sell</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">List items you no longer need and earn cash</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/30">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Rent</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">Rent items for short-term use at low prices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ How Campuszon Works - Ultra Compact Vertical */}
      <section 
        data-section="2"
        className={`py-6 md:py-10 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-all duration-700 ${
          visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4 md:mb-8">
            How Campuszon Works
          </h2>
          
          <div className="space-y-3 md:space-y-4">
            {/* Step 1 - Highlighted */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 md:p-5 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">1</div>
                <div>
                  <h3 className="text-sm md:text-base font-bold mb-1">Sign Up with College Email</h3>
                  <p className="text-xs md:text-sm text-indigo-100 line-clamp-2">Create account and verify hostel details. Only genuine students access the platform.</p>
                </div>
              </div>
            </div>

            {/* Step 2 - Minimal */}
            <div className="bg-white dark:bg-gray-900 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">2</div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-0.5">Browse or List Items</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">Explore items from your campus or list your own</p>
                </div>
              </div>
            </div>

            {/* Step 3 - Minimal */}
            <div className="bg-white dark:bg-gray-900 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">3</div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-0.5">Connect Directly</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">Unlock contacts and chat with students directly</p>
                </div>
              </div>
            </div>

            {/* Step 4 - Minimal */}
            <div className="bg-white dark:bg-gray-900 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">4</div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-0.5">Meet & Exchange Safely</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">Meet on campus at safe location and complete exchange</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ What You Can Find - 2-Column Compact Grid */}
      <section 
        data-section="3"
        className={`py-6 md:py-10 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2 md:mb-4">
            What You Can Find
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 text-center mb-4 md:mb-8 line-clamp-1">
            Everything a student needs, all within your campus
          </p>
          
          {/* 2-Column Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Books & Notes</h3>
            </div>

            <div className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Cycles</h3>
            </div>

            <div className="p-3 md:p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Calculators</h3>
            </div>

            <div className="p-3 md:p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Electronics</h3>
            </div>

            <div className="p-3 md:p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Hostel Items</h3>
            </div>

            <div className="p-3 md:p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">And More</h3>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Affordable prices</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Zero delivery</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Campus pickup</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Why Students Love - Icon + Text Rows */}
      <section 
        data-section="4"
        className={`py-6 md:py-10 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-600 to-purple-600 text-white transition-all duration-700 ${
          visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">
            Why Students Love Campuszon
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-center gap-3 p-3 md:p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-sm md:text-base font-bold">No Scams</h3>
                <p className="text-xs md:text-sm text-indigo-100 line-clamp-1">Campus-verified only</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 md:p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="text-sm md:text-base font-bold">No Shipping</h3>
                <p className="text-xs md:text-sm text-indigo-100 line-clamp-1">Meet on campus instantly</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 md:p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <h3 className="text-sm md:text-base font-bold">Easy Chat</h3>
                <p className="text-xs md:text-sm text-indigo-100 line-clamp-1">Direct contact</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 md:p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <svg className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <h3 className="text-sm md:text-base font-bold">Sustainable</h3>
                <p className="text-xs md:text-sm text-indigo-100 line-clamp-1">Eco-friendly reuse</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6️⃣ FAQ - Top 3 Only on Mobile */}
      <section 
        data-section="6"
        className={`py-6 md:py-10 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2 md:mb-4">
            FAQ
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center mb-4 md:mb-8">
            Quick answers about Campuszon
          </p>
          <div className="space-y-2 md:space-y-3">
            {faqs.slice(0, 3).map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white pr-2">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${
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
                  <div className="px-3 md:px-4 pb-2.5 md:pb-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 md:mt-6 text-center">
            <Link
              to="/faq"
              className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* 7️⃣ Final CTA - Compact */}
      <section 
        data-section="7"
        className={`py-8 md:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white transition-all duration-700 ${
          visibleSections.has(7) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            From Campus. For Campus.
          </h2>
          <p className="text-sm sm:text-base md:text-lg mb-4 md:mb-8 text-indigo-100 line-clamp-1">
            Join thousands of students trading safely
          </p>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center mb-4 md:mb-8">
            <button
              onClick={handleStartBuying}
              className="group px-7 md:px-9 py-2.5 md:py-3 bg-white text-indigo-600 text-sm md:text-base font-bold rounded-lg transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-xl overflow-hidden"
            >
              <span className="relative z-10">Start Buying</span>
            </button>
            <Link
              to="/signup"
              className="px-7 md:px-9 py-2.5 md:py-3 border-2 border-white text-white text-sm md:text-base font-bold rounded-lg transition-all duration-200 hover:bg-white hover:text-indigo-600 text-center"
            >
              Sign Up Now
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Campus-verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>2 free tokens</span>
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
