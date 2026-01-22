import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userAtom } from '../store/user.atom';

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  hostelName: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
    hostelName: string;
    isAdmin?: boolean;
  };
}

export const useAuth = () => {
  const setUser = useSetRecoilState(userAtom);
  const navigate = useNavigate();

  const login = async (data: LoginData) => {
    try {
      const response = await axios.post<AuthResponse>('/api/user/login', data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save token and user info to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('username', user.username);
        localStorage.setItem('email', user.email);
        localStorage.setItem('phoneNumber', user.phoneNumber);
        localStorage.setItem('hostelName', user.hostelName);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('isAdmin', user.isAdmin ? 'true' : 'false');
        
        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update Recoil state
        setUser({
          isLoggedIn: true,
          email: user.email,
          username: user.username,
          token: token,
          phoneNumber: user.phoneNumber,
          hostelName: user.hostelName,
          userId: user.id,
          isAdmin: user.isAdmin || false,
        });
        
        // Navigate to home
        navigate('/');
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((e: any) => e.message)
          .join('. ');
        return { success: false, message: validationErrors };
      }
      
      // Handle account not found errors
      if (error.response?.status === 401) {
        return { success: false, message: "Account not found. Please sign up first." };
      }
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message: errorMessage };
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await axios.post<AuthResponse>('/api/user/signup', data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Save token and user info to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('username', user.username);
        localStorage.setItem('email', user.email);
        localStorage.setItem('phoneNumber', user.phoneNumber);
        localStorage.setItem('hostelName', user.hostelName);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('isAdmin', user.isAdmin ? 'true' : 'false');
        
        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update Recoil state
        setUser({
          isLoggedIn: true,
          email: user.email,
          username: user.username,
          token: token,
          phoneNumber: user.phoneNumber,
          hostelName: user.hostelName,
          userId: user.id,
          isAdmin: user.isAdmin || false,
        });
        
        // Navigate to home
        navigate('/');
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      // Handle validation errors from express-validator
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((e: any) => e.msg || e.message)
          .join('. ');
        return { success: false, message: validationErrors };
      }
      
      // Handle password policy errors
      if (error.response?.data?.errors && error.response?.data?.requirements) {
        const passwordErrors = error.response.data.errors.join('. ');
        return { success: false, message: `${error.response.data.message}: ${passwordErrors}` };
      }
      
      const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    // Remove all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('hostelName');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    
    // Remove axios default authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset Recoil state
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
    
    // Navigate to login
    navigate('/login');
  };

  return { login, signup, logout };
};
