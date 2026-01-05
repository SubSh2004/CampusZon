import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { userAtom } from '../store/user.atom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userAtom);

  useEffect(() => {
    console.log('🔍 OAuth Callback - Processing authentication...');
    
    // Get user data from URL
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    const error = params.get('error');

    console.log('📦 Data received:', data ? 'YES' : 'NO');
    console.log('❌ Error param:', error);

    if (error) {
      console.log('❌ OAuth error:', error);
      alert('OAuth authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (data) {
      try {
        const userData = JSON.parse(decodeURIComponent(data));
        console.log('✅ User data parsed:', userData);
        
        // Update Recoil state
        setUser({
          isLoggedIn: true,
          email: userData.email,
          username: userData.username,
          token: userData.token,
          phoneNumber: userData.phoneNumber || '',
          hostelName: userData.hostelName || '',
          userId: userData.userId,
        });

        // Save to localStorage in the format the app expects
        localStorage.setItem('token', userData.token);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('phoneNumber', userData.phoneNumber || '');
        localStorage.setItem('hostelName', userData.hostelName || '');
        localStorage.setItem('userId', userData.userId);

        console.log('💾 Saved to localStorage');

        // Check if user needs to complete profile (no phone or hostel)
        if (!userData.phoneNumber || !userData.hostelName) {
          console.log('⚠️ Profile incomplete, redirecting to profile page');
          alert('Please complete your profile by adding phone number and hostel name.');
          navigate('/profile');
        } else {
          console.log('🏠 Redirecting to home page');
          navigate('/');
        }
      } catch (error) {
        console.error('❌ Error parsing OAuth data:', error);
        alert('Authentication failed. Please try again.');
        navigate('/login');
      }
    } else {
      console.log('⚠️ No data found, redirecting to login');
      navigate('/login');
    }
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
