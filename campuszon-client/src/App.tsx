import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSetRecoilState } from 'recoil'
import axios from 'axios'
import { userAtom } from './store/user.atom'
import { cartAtom } from './store/cart.atom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AddItem from './pages/AddItem'
import ItemDetail from './pages/ItemDetail'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import OAuthCallback from './pages/OAuthCallback'
import ModerationDashboard from './pages/ModerationDashboard'
import Bookings from './pages/Bookings'
import Cart from './pages/Cart'
import Notifications from './pages/Notifications'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed'
import PaymentHistory from './pages/PaymentHistory'
import FAQ from './pages/FAQ'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import ContactUs from './pages/ContactUs'
import Footer from './components/Footer'

export default function App() {
  const setUser = useSetRecoilState(userAtom);
  const setCart = useSetRecoilState(cartAtom);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check for stored token on app load and validate it with backend
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('email');
      const phoneNumber = localStorage.getItem('phoneNumber');
      const hostelName = localStorage.getItem('hostelName');
      const userId = localStorage.getItem('userId');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (token && username && email) {
        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Restore user state immediately (optimistic)
        setUser({
          isLoggedIn: true,
          email: email,
          username: username,
          token: token,
          phoneNumber: phoneNumber || null,
          hostelName: hostelName || null,
          userId: userId || null,
          isAdmin: isAdmin,
        });
        
        try {
          // Validate token with backend in the background
          await axios.get('/api/user/profile');
          // Token is valid, user state already set
          
          // Fetch cart data
          try {
            const cartResponse = await axios.get('/api/cart');
            if (cartResponse.data.success) {
              setCart({
                items: cartResponse.data.items,
                count: cartResponse.data.count
              });
            }
          } catch (cartError) {
            console.error('Error fetching cart:', cartError);
          }
        } catch (error: any) {
          // Only clear if it's a 401 (unauthorized) error
          if (error.response?.status === 401) {
            console.error('Token expired or invalid');
            localStorage.clear();
            delete axios.defaults.headers.common['Authorization'];
            setUser({
              isLoggedIn: false,
              email: null,
              username: null,
              token: null,
              phoneNumber: null,
              hostelName: null,
              userId: null,
              isAdmin: false,
            });
          }
          // For other errors (network issues, server down), keep user logged in
        }
      }
      
      setIsInitialized(true);
    };

    initAuth();
  }, [setUser]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow">
        <Routes>
          {/* Public Routes - Landing Page Only */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes - Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
          <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment-failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
          <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute><ModerationDashboard /></ProtectedRoute>} />
          
          {/* Public Info Pages - Accessible to all */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
