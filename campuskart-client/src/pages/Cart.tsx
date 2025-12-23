import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { cartAtom } from '../store/cart.atom';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api';

export default function Cart() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [cart, setCart] = useRecoilState(cartAtom);
  const [loading, setLoading] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCart({
          items: response.data.items,
          count: response.data.count
        });
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setRemovingItemId(itemId);
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${API_URL}/api/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCart({
          items: response.data.items,
          count: response.data.count
        });
      }
    } catch (error: any) {
      console.error('Error removing item:', error);
      alert(error.response?.data?.message || 'Failed to remove item from cart');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`${API_URL}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCart({
          items: [],
          count: 0
        });
      }
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  const handleBuyNow = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                🛒 Your Cart
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {cart.count} {cart.count === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {cart.count > 0 && (
              <button
                onClick={handleClearCart}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  theme === 'dark'
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {cart.count === 0 ? (
          /* Empty Cart State */
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
            <div className="text-6xl mb-4">🛒</div>
            <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Your cart is empty
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Browse items and add them to your cart for easy access later
            </p>
            <Link
              to="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item._id}
                  className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Item Image */}
                    <Link to={`/item/${item.itemId}`} className="flex-shrink-0">
                      <img
                        src={(item.images && item.images.length > 0 ? item.images[0] : null) || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded-lg hover:opacity-90 transition"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                        }}
                      />
                    </Link>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/item/${item.itemId}`}>
                        <h3 className={`text-lg font-semibold mb-1 hover:text-indigo-600 transition ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                      </Link>
                      <p className={`text-sm mb-2 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          {item.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {item.condition}
                        </span>
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Seller: {item.sellerName}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Added: {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          onClick={() => handleBuyNow(item.itemId)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          Buy/Rent Now
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.itemId)}
                          disabled={removingItemId === item.itemId}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            theme === 'dark'
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          {removingItemId === item.itemId ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 shadow-md sticky top-4`}>
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Cart Summary
                </h2>
                <div className={`space-y-3 mb-4 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Items:</span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {cart.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Total Price:</span>
                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ₹{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mb-4`}>
                  <p>💡 Tip: View item details to unlock contact info and complete your purchase</p>
                </div>
                <Link
                  to="/"
                  className={`block text-center py-2 rounded-lg font-medium transition ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
