import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Booking {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    price: number;
    imageUrl: string;
    imageUrls?: string[];
    category: string;
  };
  buyerId: {
    _id: string;
    username: string;
    email: string;
    phoneNumber: string;
    hostelName: string;
  };
  sellerId: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<'booked' | 'requests'>('booked');
  const [itemsBooked, setItemsBooked] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch items booked by user
      const bookedResponse = await axios.get(`${API_URL}/api/booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItemsBooked(bookedResponse.data.bookings || []);

      // Fetch booking requests for user's items
      const requestsResponse = await axios.get(`${API_URL}/api/booking/booking-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingRequests(requestsResponse.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Back to Home"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('booked')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'booked'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Items Booked ({itemsBooked.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Booking Requests ({bookingRequests.length})
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'booked' ? (
            <div>
              {itemsBooked.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No items booked yet</p>
                  <Link to="/" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
                    Browse items →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {itemsBooked.map((booking) => (
                    <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                      <div className="flex gap-4">
                        <Link to={`/item/${booking.itemId._id}`} className="flex-shrink-0">
                          <img
                            src={(booking.itemId.imageUrls && booking.itemId.imageUrls[0]) || booking.itemId.imageUrl}
                            alt={booking.itemId.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/item/${booking.itemId._id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                            {booking.itemId.title}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{booking.itemId.category}</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                            ₹{booking.itemId.price}
                          </p>
                          {booking.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                              "{booking.message}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Booked on {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {bookingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No booking requests yet</p>
                  <Link to="/add-item" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
                    Add an item →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookingRequests.map((booking) => (
                    <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                      <div className="flex gap-4">
                        <Link to={`/item/${booking.itemId._id}`} className="flex-shrink-0">
                          <img
                            src={(booking.itemId.imageUrls && booking.itemId.imageUrls[0]) || booking.itemId.imageUrl}
                            alt={booking.itemId.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/item/${booking.itemId._id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                            {booking.itemId.title}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{booking.itemId.category}</p>
                          
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Interested Buyer:</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                              <p>👤 <strong>{booking.buyerId.username}</strong></p>
                              <p>📧 {booking.buyerId.email}</p>
                              <p>📞 {booking.buyerId.phoneNumber}</p>
                              <p>🏠 {booking.buyerId.hostelName}</p>
                            </div>
                            {booking.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic border-t border-blue-200 dark:border-blue-800 pt-2">
                                💬 "{booking.message}"
                              </p>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Requested on {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
