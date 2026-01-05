// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  login: `${API_URL}/api/user/login`,
  signup: `${API_URL}/api/user/signup`,
  sendOTP: `${API_URL}/api/user/send-otp`,
  verifyOTP: `${API_URL}/api/user/verify-otp`,
  googleAuth: `${API_URL}/api/auth/google`,
  
  // Items
  items: `${API_URL}/api/items`,
  
  // Chat
  chat: `${API_URL}/api/chat`,
  
  // Booking
  booking: `${API_URL}/api/booking`,
  
  // User
  user: `${API_URL}/api/user`,
};

export default { API_URL, SOCKET_URL, API_ENDPOINTS };
