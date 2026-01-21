import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../store/user.atom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useRecoilValue(userAtom);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!user.isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [user.isLoggedIn, navigate]);

  // Don't render anything if not logged in (prevents flash of content)
  if (!user.isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
