import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

interface Booking {
  _id: string;
  itemId: string | {
    _id: string;
    title: string;
    price: number;
    imageUrl: string;
    imageUrls?: string[];
    category: string;
  };
  itemTitle?: string;
  itemPrice?: number;
  buyerId: string | {
    _id: string;
    username: string;
    email: string;
    phoneNumber: string;
    hostelName: string;
  };
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  sellerId: string;
  message: string;
  rejectionNote?: string;
  status: string;
  createdAt: string;
}

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<'booked' | 'requests'>('booked');
  const [itemsBooked, setItemsBooked] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

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

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setProcessingBookingId(bookingId);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/api/booking/${bookingId}/status`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh bookings
      await fetchBookings();
      alert('Booking accepted! Item marked as unavailable.');
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectModalOpen(true);
  };

  const confirmRejectBooking = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingBookingId(selectedBooking._id);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/api/booking/${selectedBooking._id}/status`,
        { status: 'rejected', rejectionNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh bookings
      await fetchBookings();
      setRejectModalOpen(false);
      setRejectionNote('');
      setSelectedBooking(null);
      alert('Booking rejected and buyer notified.');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setProcessingBookingId(bookingId);
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${API_URL}/api/booking/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh bookings
      await fetchBookings();
      alert('Booking cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
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
            to="/home" 
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
                  <Link to="/home" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
                    Browse items →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {itemsBooked.map((booking) => {
                    const itemId = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId._id : booking.itemId;
                    const itemTitle = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId.title : booking.itemTitle || 'Item';
                    const itemPrice = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId.price : booking.itemPrice || 0;
                    const itemCategory = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId.category : 'General';
                    const itemImage = typeof booking.itemId === 'object' && booking.itemId
                      ? ((booking.itemId.imageUrls && booking.itemId.imageUrls[0]) || booking.itemId.imageUrl)
                      : '/placeholder.png';

                    return (
                    <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                      <div className="flex gap-4">
                        <Link to={`/item/${itemId}`} className="flex-shrink-0">
                          <img
                            src={itemImage}
                            alt={itemTitle}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/item/${itemId}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                            {itemTitle}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{itemCategory}</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                            ₹{itemPrice}
                          </p>
                          {booking.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                              "{booking.message}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Booked on {formatDate(booking.createdAt)}
                          </p>

                          {/* Cancel Button for Pending Bookings */}
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={processingBookingId === booking._id}
                              className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingBookingId === booking._id ? '⏳ Cancelling...' : '🗑️ Cancel Booking'}
                            </button>
                          )}
                          {booking.status === 'rejected' && (
                            <>
                              {booking.rejectionNote && (
                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection Reason:</p>
                                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">"{booking.rejectionNote}"</p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={processingBookingId === booking._id}
                                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingBookingId === booking._id ? '⏳ Deleting...' : '🗑️ Delete'}
                                </button>
                                <Link
                                  to={`/item/${itemId}`}
                                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-center"
                                >
                                  🔄 Book Again
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'accepted' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : booking.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
                  {bookingRequests.map((booking) => {
                    const itemId = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId._id : booking.itemId;
                    const itemTitle = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId.title : booking.itemTitle || 'Item';
                    const itemCategory = typeof booking.itemId === 'object' && booking.itemId ? booking.itemId.category : 'General';
                    const itemImage = typeof booking.itemId === 'object' && booking.itemId
                      ? ((booking.itemId.imageUrls && booking.itemId.imageUrls[0]) || booking.itemId.imageUrl)
                      : '/placeholder.png';
                    
                    const buyerUsername = typeof booking.buyerId === 'object' && booking.buyerId ? booking.buyerId.username : booking.buyerName || 'Unknown';
                    const buyerEmail = typeof booking.buyerId === 'object' && booking.buyerId ? booking.buyerId.email : booking.buyerEmail || 'N/A';
                    const buyerPhone = typeof booking.buyerId === 'object' && booking.buyerId ? booking.buyerId.phoneNumber : booking.buyerPhone || 'N/A';
                    const buyerHostel = typeof booking.buyerId === 'object' && booking.buyerId ? booking.buyerId.hostelName : 'N/A';

                    return (
                    <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                      <div className="flex gap-4">
                        <Link to={`/item/${itemId}`} className="flex-shrink-0">
                          <img
                            src={itemImage}
                            alt={itemTitle}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/item/${itemId}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                            {itemTitle}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{itemCategory}</p>
                          
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Interested Buyer:</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                              <p>👤 <strong>{buyerUsername}</strong></p>
                              <p>📧 {buyerEmail}</p>
                              <p>📞 {buyerPhone}</p>
                              <p>🏠 {buyerHostel}</p>
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

                          {/* Action Buttons */}
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAcceptBooking(booking._id)}
                                disabled={processingBookingId === booking._id}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingBookingId === booking._id ? '⏳ Processing...' : '✅ Accept'}
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking)}
                                disabled={processingBookingId === booking._id}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          )}
                          {booking.status === 'accepted' && (
                            <div className="mt-3 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-center font-semibold rounded-lg">
                              ✅ Accepted
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reject Booking Request</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please provide a reason for rejecting this booking. The buyer will be notified.
              </p>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={confirmRejectBooking}
                  disabled={!rejectionNote.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionNote('');
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
