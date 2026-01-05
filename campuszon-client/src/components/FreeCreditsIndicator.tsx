import React, { useEffect, useState } from 'react';
import axios from '../config/axios';

const FreeCreditsIndicator: React.FC = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/unlock/user/unlocks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCredits(response.data.freeCredits);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || credits === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
        <span className="text-2xl">🎁</span>
        <div>
          <div className="font-bold text-sm">
            {credits} Free Unlock{credits > 1 ? 's' : ''}
          </div>
          <div className="text-xs opacity-90">
            Tap any item to use
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeCreditsIndicator;
