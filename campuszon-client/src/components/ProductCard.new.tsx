import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

interface Item {
  id: string; // Changed from number to string for MongoDB ObjectId compatibility
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageUrls?: string[]; // Multiple images support
  available: boolean;
  createdAt: string;
  userId: string; // Required for booking
  userName: string; // Required for booking
  userEmail: string;
  userPhone: string;
}

interface ProductCardProps {
  item: Item;
}

export default function ProductCard({ item }: ProductCardProps) {
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageUrl = (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : item.imageUrl) || '/placeholder.jpg';
  const imageCount = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls.length : (item.imageUrl ? 1 : 0);

  const handleChatClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to chat');
        navigate('/login');
        return;
      }

      if (!item.userId) {
        alert('Unable to start chat: Seller information not available');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/chat`,
        { otherUserId: item.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/chat?chatId=${response.data.chat._id}`);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to start chat');
    }
  };

  const handleBooking = async () => {
    if (!bookingMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to book');
        navigate('/login');
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/booking/create`,
        {
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: item.price,
          itemCategory: item.category,
          sellerId: item.userId,
          sellerName: item.userName,
          message: bookingMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Booking request sent successfully!');
      setShowBookingModal(false);
      setBookingMessage('');
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.response?.data?.error || 'Failed to send booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.userPhone) {
      window.location.href = `tel:${item.userPhone}`;
    } else {
      alert('Phone number not available');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Image Container */}
        <Link to={`/item/${item.id}`} className="block relative h-56 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          
          {/* Image Count Indicator */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 right-3">
              <span className="backdrop-blur-md bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {imageCount}
              </span>
            </div>
          )}
          
          {/* Availability Badge - Hidden */}
          {/* <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
              item.available
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-white'
            }`}>
              {item.available ? 'Available' : 'Booked'}
            </span>
          </div> */}
        </Link>

        {/* Content Section */}
        <div className="p-5">
          {/* Title and Price */}
          <Link to={`/item/${item.id}`} className="block mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{item.price}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / day
              </span>
            </div>
          </Link>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 text-sm">
            {item.description}
          </p>

          {/* Category */}
          <div className="mb-4">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {item.category}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleChatClick}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
            
            {item.available && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowBookingModal(true);
                  }}
                  className="flex-1 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book
                </button>
                
                <button
                  onClick={handleCall}
                  className="sm:hidden flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Request Booking
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Item: {item.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Price: ₹{item.price}/day
              </p>
            </div>

            <textarea
              placeholder="Add a message for the owner (dates, duration, etc.)"
              value={bookingMessage}
              onChange={(e) => setBookingMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingMessage('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
