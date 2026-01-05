import React, { useEffect, useState } from 'react';
import axios from '../config/axios';

const FreeCreditsIndicator: React.FC = () => {
  const [tokens, setTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/tokens/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTokens(response.data.currentTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || tokens === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
        <span className="text-2xl">🎫</span>
        <div>
          <div className="font-bold text-sm">
            {tokens} Token{tokens > 1 ? 's' : ''}
          </div>
          <div className="text-xs opacity-90">
            Unlock any item
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeCreditsIndicator;
