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

      {/* 1️⃣ Hero Section - Desktop/Tablet Full, Mobile Compact */}
      <section 
        data-section="0"
        className={`pt-20 sm:pt-16 md:pt-24 lg:pt-32 pb-8 sm:pb-6 md:pb-10 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all duration-700 ${
          visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ minHeight: window.innerWidth < 640 ? '65vh' : '85vh' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-6 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 sm:mb-2 md:mb-4">
                <img src="/logo-icon.jpg" alt="Campuszon" className="w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover logo-hero" />
                <h1 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">Campuszon</h1>
              </div>
              <h1 className="text-2xl sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-2 md:mb-4 animate-fade-in leading-tight sm:line-clamp-2">
                Buy, Sell & Rent Within Your Campus — <span className="text-indigo-600 dark:text-indigo-400">Safely.</span>
              </h1>
              <p className="text-sm sm:text-xs md:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-3 md:mb-6 sm:line-clamp-1">
                Trusted student-to-student marketplace for Indian campuses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 md:gap-3 justify-center lg:justify-start">
                <button
                  onClick={handleStartBuying}
                  className="group px-8 py-3 sm:px-5 sm:py-2.5 md:px-7 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base sm:text-sm md:text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-98 hover:shadow-lg transform relative overflow-hidden"
                >
                  <span className="relative z-10">Start Buying</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <Link
                  to="/login"
                  className="px-8 py-3 sm:px-5 sm:py-2.5 md:px-7 md:py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-base sm:text-sm md:text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-98 text-center"
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

      {/* 2️⃣ What is Campuszon? - Rich Cards Desktop/Tablet, Compact Mobile */}
      <section 
        data-section="1"
        className={`py-12 sm:py-6 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-2 md:mb-4 text-center">
            What is Campuszon?
          </h2>
          <p className="text-lg sm:text-xs md:text-lg text-gray-600 dark:text-gray-300 text-center mb-12 sm:mb-4 md:mb-12 max-w-3xl mx-auto sm:line-clamp-2">
            Exclusive student marketplace where only verified students from your college can buy, sell, and rent items.
          </p>
          
          {/* Mobile: Compact Rows */}
          <div className="sm:block md:hidden space-y-3">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-all duration-200 active:scale-98">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Buy</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Find affordable items from campus students</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg transition-all duration-200 active:scale-98">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sell</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">List items you no longer need and earn cash</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-all duration-200 active:scale-98">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Rent</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Rent items for short-term use at low prices</p>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet: Rich 3-Column Cards */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Buy</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Find affordable items from students in your campus. Browse verified listings and get exactly what you need.</p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border-2 border-green-100 dark:border-green-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-green-300 dark:hover:border-green-600 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Sell</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">List items you no longer need and earn cash. Declutter your space while helping fellow students.</p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-2xl border-2 border-purple-100 dark:border-purple-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Rent</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Rent items for short-term use at low prices. Perfect for temporary needs without long-term commitment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ How Campuszon Works - Rich Cards Desktop/Tablet, Compact Mobile */}
      <section 
        data-section="2"
        className={`py-12 sm:py-6 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-all duration-700 ${
          visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4 sm:mb-2 md:mb-4">
            How Campuszon Works
          </h2>
          <p className="text-lg sm:text-xs md:text-lg text-gray-600 dark:text-gray-300 text-center mb-12 sm:mb-4 md:mb-12 max-w-3xl mx-auto sm:line-clamp-1">
            Get started in 4 simple steps
          </p>
          
          {/* Mobile: Compact Vertical Steps */}
          <div className="sm:block md:hidden space-y-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <h3 className="text-sm font-bold mb-1">Sign Up with College Email</h3>
                  <p className="text-xs text-indigo-100 line-clamp-2">Create account and verify hostel details. Only genuine students access the platform.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Browse or List Items</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Explore items from your campus or list your own</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Connect Directly</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Unlock contacts and chat with students directly</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Meet & Exchange Safely</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">Meet on campus at safe location and complete exchange</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet: Rich 4-Column Cards */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">1</div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Create your account with college email and verify your hostel details to access the platform.</p>
            </div>

            <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 hover:border-green-400 dark:hover:border-green-500 cursor-pointer overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">2</div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Browse</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Explore thousands of items from verified students in your campus or list your own items.</p>
            </div>

            <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">3</div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Connect</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Unlock seller contacts using tokens and chat directly through our secure messaging platform.</p>
            </div>

            <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">4</div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Exchange</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Meet safely on campus at a convenient location and complete the transaction in person.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ What You Can Find - Rich Cards Desktop/Tablet, Compact Mobile */}
      <section 
        data-section="3"
        className={`py-12 sm:py-6 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4 sm:mb-2 md:mb-4">
            What You Can Find
          </h2>
          <p className="text-lg sm:text-xs md:text-lg text-gray-600 dark:text-gray-300 text-center mb-12 sm:mb-4 md:mb-12 max-w-3xl mx-auto sm:line-clamp-1">
            Everything a student needs, all within your campus
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-3 md:gap-6">
            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-blue-200 dark:border-blue-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-blue-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Books & Notes</h3>
            </div>

            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-green-400 dark:hover:border-green-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-green-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Cycles</h3>
            </div>

            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-purple-200 dark:border-purple-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-purple-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Calculators</h3>
            </div>

            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-orange-200 dark:border-orange-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-orange-400 dark:hover:border-orange-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-orange-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Electronics</h3>
            </div>

            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-red-200 dark:border-red-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-red-400 dark:hover:border-red-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-red-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Hostel Items</h3>
            </div>

            <div className="group p-6 sm:p-3 md:p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-teal-200 dark:border-teal-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-teal-400 dark:hover:border-teal-600 cursor-pointer">
              <div className="w-14 h-14 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-teal-600 rounded-xl sm:rounded-lg md:rounded-xl flex items-center justify-center mb-4 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg">
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-xs md:text-base font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">And More</h3>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 sm:mt-4 md:mt-8 flex flex-wrap justify-center gap-4 sm:gap-3 md:gap-4 text-sm sm:text-xs md:text-sm">
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

      {/* 5️⃣ Why Students Love - Rich Cards Desktop/Tablet, Compact Mobile */}
      <section 
        data-section="4"
        className={`py-12 sm:py-6 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-600 to-purple-600 text-white transition-all duration-700 ${
          visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-xl md:text-3xl font-bold text-center mb-4 sm:mb-2 md:mb-4">
            Why Students Love Campuszon
          </h2>
          <p className="text-lg sm:text-xs md:text-lg text-center mb-12 sm:mb-4 md:mb-12 text-indigo-100 sm:line-clamp-1">Safe, fast, and hassle-free campus transactions</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-3 md:gap-6">
            <div className="group flex items-center gap-4 sm:gap-3 md:gap-4 p-6 sm:p-3 md:p-6 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <svg className="w-12 h-12 sm:w-8 sm:h-8 md:w-12 md:h-12 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-lg sm:text-sm md:text-lg font-bold mb-1 sm:mb-0 md:mb-1">No Scams</h3>
                <p className="text-sm sm:text-xs md:text-sm text-indigo-100 sm:line-clamp-1">Campus-verified only</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 sm:gap-3 md:gap-4 p-6 sm:p-3 md:p-6 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <svg className="w-12 h-12 sm:w-8 sm:h-8 md:w-12 md:h-12 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3 className="text-lg sm:text-sm md:text-lg font-bold mb-1 sm:mb-0 md:mb-1">No Shipping</h3>
                <p className="text-sm sm:text-xs md:text-sm text-indigo-100 sm:line-clamp-1">Meet on campus instantly</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 sm:gap-3 md:gap-4 p-6 sm:p-3 md:p-6 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <svg className="w-12 h-12 sm:w-8 sm:h-8 md:w-12 md:h-12 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <h3 className="text-lg sm:text-sm md:text-lg font-bold mb-1 sm:mb-0 md:mb-1">Easy Chat</h3>
                <p className="text-sm sm:text-xs md:text-sm text-indigo-100 sm:line-clamp-1">Direct contact</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 sm:gap-3 md:gap-4 p-6 sm:p-3 md:p-6 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-lg md:rounded-2xl border-2 sm:border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
              <svg className="w-12 h-12 sm:w-8 sm:h-8 md:w-12 md:h-12 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <h3 className="text-lg sm:text-sm md:text-lg font-bold mb-1 sm:mb-0 md:mb-1">Sustainable</h3>
                <p className="text-sm sm:text-xs md:text-sm text-indigo-100 sm:line-clamp-1">Eco-friendly reuse</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6️⃣ FAQ - Rich Desktop/Tablet, Compact Top 3 Mobile */}
      <section 
        data-section="6"
        className={`py-12 sm:py-6 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-all duration-700 ${
          visibleSections.has(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4 sm:mb-2 md:mb-4">
            FAQ
          </h2>
          <p className="text-base sm:text-xs md:text-base text-gray-600 dark:text-gray-400 text-center mb-8 sm:mb-4 md:mb-8">
            Quick answers about Campuszon
          </p>
          <div className="space-y-3 sm:space-y-2 md:space-y-3">
            {(window.innerWidth < 640 ? faqs.slice(0, 3) : faqs).map((faq, index) => (
              <div
                key={index}
                className="group bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-lg md:rounded-xl overflow-hidden border-2 sm:border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 sm:px-3 md:px-5 py-4 sm:py-2.5 md:py-4 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20"
                >
                  <span className="font-semibold text-base sm:text-xs md:text-base text-gray-900 dark:text-white pr-3 sm:pr-2 md:pr-3">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${
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
                  <div className="px-5 sm:px-3 md:px-5 pb-4 sm:pb-2.5 md:pb-4 text-sm sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 animate-fade-in leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 sm:mt-4 md:mt-6 text-center sm:block md:hidden">
            <Link
              to="/faq"
              className="text-sm sm:text-xs md:text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* 7️⃣ Final CTA - Rich Desktop/Tablet, Compact Mobile */}
      <section 
        data-section="7"
        className={`py-16 sm:py-8 md:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white transition-all duration-700 ${
          visibleSections.has(7) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-3 md:mb-6 animate-pulse">
            From Campus. For Campus.
          </h2>
          <p className="text-xl sm:text-sm md:text-xl mb-10 sm:mb-4 md:mb-10 text-indigo-100 max-w-2xl mx-auto sm:line-clamp-1">
            Join thousands of students trading safely within your campus community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 md:gap-4 justify-center mb-10 sm:mb-4 md:mb-10">
            <button
              onClick={handleStartBuying}
              className="group px-10 py-4 sm:px-7 sm:py-2.5 md:px-10 md:py-4 bg-white text-indigo-600 text-lg sm:text-sm md:text-lg font-bold rounded-xl sm:rounded-lg md:rounded-xl transition-all duration-300 shadow-2xl hover:scale-110 active:scale-95 hover:shadow-3xl transform hover:-translate-y-1"
            >
              <span className="relative z-10">Start Buying Now</span>
            </button>
            <Link
              to="/signup"
              className="px-10 py-4 sm:px-7 sm:py-2.5 md:px-10 md:py-4 border-3 sm:border-2 md:border-3 border-white text-white text-lg sm:text-sm md:text-lg font-bold rounded-xl sm:rounded-lg md:rounded-xl transition-all duration-300 hover:bg-white hover:text-indigo-600 hover:scale-110 active:scale-95 hover:shadow-2xl transform hover:-translate-y-1 text-center"
            >
              Sign Up Free
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-3 md:gap-6 text-base sm:text-xs md:text-base">
            <div className="flex items-center gap-2 sm:gap-1.5 md:gap-2 group">
              <svg className="w-6 h-6 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-300 transition-transform duration-300 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">100% Free to Join</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-1.5 md:gap-2 group">
              <svg className="w-6 h-6 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-300 transition-transform duration-300 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Campus-verified Students</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-1.5 md:gap-2 group">
              <svg className="w-6 h-6 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-300 transition-transform duration-300 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">2 Free Unlock Tokens</span>
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
