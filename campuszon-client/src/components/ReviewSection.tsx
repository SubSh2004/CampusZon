import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import { useTheme } from '../context/ThemeContext';

interface Review {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  replies?: Reply[];
}

interface Reply {
  userId: string;
  userName: string;
  replyText: string;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewSectionProps {
  itemId: string;
  itemOwnerId?: string;
}

export default function ReviewSection({ itemId, itemOwnerId }: ReviewSectionProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reply state
  const [activeReplyIndex, setActiveReplyIndex] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<{[key: number]: string}>({});
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<{reviewIndex: number, replyIndex: number} | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchReviews();
    fetchCurrentUser();
  }, [itemId]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUserId(response.data.user._id || response.data.user.id);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/items/${itemId}`);
      if (response.data.success) {
        const item = response.data.item;
        setReviews(item.reviews || []);
        setAverageRating(item.averageRating || 0);
        setReviewCount(item.reviewCount || 0);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      setError('Please write a review');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get user info from token or API
      const userResponse = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userId = userResponse.data.user._id || userResponse.data.user.id;
      const userName = userResponse.data.user.name;

      const response = await axios.post(
        `/api/items/${itemId}/review`,
        {
          userId,
          userName,
          rating,
          comment: reviewText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setRating(0);
        setReviewText('');
        
        // Refresh reviews
        fetchReviews();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (reviewIndex: number) => {
    const replyText = replyTexts[reviewIndex]?.trim();
    
    if (!replyText) {
      setError('Reply text cannot be empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setSubmittingReply(reviewIndex);
      setError('');
      
      const userResponse = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userId = userResponse.data.user._id || userResponse.data.user.id;
      const userName = userResponse.data.user.name;

      await axios.post(
        `/api/items/${itemId}/review/${reviewIndex}/reply`,
        {
          userId,
          userName,
          replyText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Clear reply text and close reply form
      setReplyTexts(prev => ({ ...prev, [reviewIndex]: '' }));
      setActiveReplyIndex(null);
      
      // Refresh reviews
      await fetchReviews();
      
      // Expand replies section
      setExpandedReplies(prev => ({ ...prev, [reviewIndex]: true }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleEditReply = (reviewIndex: number, replyIndex: number, currentText: string) => {
    setEditingReply({ reviewIndex, replyIndex });
    setEditReplyText(currentText);
  };

  const handleUpdateReply = async () => {
    if (!editingReply || !editReplyText.trim()) {
      setError('Reply text cannot be empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      
      await axios.put(
        `/api/items/${itemId}/review/${editingReply.reviewIndex}/reply/${editingReply.replyIndex}`,
        {
          userId: currentUserId,
          replyText: editReplyText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setEditingReply(null);
      setEditReplyText('');
      
      // Refresh reviews
      await fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update reply');
    }
  };

  const handleDeleteReply = async (reviewIndex: number, replyIndex: number) => {
    if (!confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      
      await axios.delete(
        `/api/items/${itemId}/review/${reviewIndex}/reply/${replyIndex}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { userId: currentUserId }
        }
      );

      // Refresh reviews
      await fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete reply');
    }
  };

  const toggleReplies = (reviewIndex: number) => {
    setExpandedReplies(prev => ({ ...prev, [reviewIndex]: !prev[reviewIndex] }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        User Reviews
      </h2>

      {/* Average Rating Summary */}
      {reviewCount > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-lg mb-6 border border-yellow-200 dark:border-gray-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white">
                  {averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  out of 5
                </div>
              </div>
              <div>
                <StarRating rating={averageRating} size="lg" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6 border dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Write a Review
        </h3>
        
        <form onSubmit={handleSubmitReview}>
          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              interactive 
              size="lg"
            />
            {rating > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You rated: {rating} star{rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this item..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reviewText.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? '🔄 Submitting...' : '✍️ Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          All Reviews ({reviewCount})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <svg 
              className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No reviews yet. Be the first to review this item!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...reviews]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((review, reviewIndex) => (
                <div
                  key={reviewIndex}
                  className="bg-white dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {review.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {review.userName || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <StarRating rating={review.rating} size="sm" />
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                    {review.comment}
                  </p>

                  {/* Reply Button and Count */}
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => {
                        if (!localStorage.getItem('token')) {
                          navigate('/login');
                          return;
                        }
                        setActiveReplyIndex(activeReplyIndex === reviewIndex ? null : reviewIndex);
                      }}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                    
                    {review.replies && review.replies.length > 0 && (
                      <button
                        onClick={() => toggleReplies(reviewIndex)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                      >
                        {expandedReplies[reviewIndex] ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide {review.replies.length} {review.replies.length === 1 ? 'reply' : 'replies'}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show {review.replies.length} {review.replies.length === 1 ? 'reply' : 'replies'}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Reply Input Form */}
                  {activeReplyIndex === reviewIndex && (
                    <div className="ml-8 mb-4 bg-gray-50 dark:bg-gray-600 p-4 rounded-lg border border-gray-200 dark:border-gray-500">
                      <textarea
                        value={replyTexts[reviewIndex] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [reviewIndex]: e.target.value }))}
                        placeholder="Write your reply..."
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 mb-2`}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(replyTexts[reviewIndex] || '').length}/500 characters
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveReplyIndex(null);
                              setReplyTexts(prev => ({ ...prev, [reviewIndex]: '' }));
                            }}
                            className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitReply(reviewIndex)}
                            disabled={submittingReply === reviewIndex}
                            className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition disabled:opacity-50"
                          >
                            {submittingReply === reviewIndex ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies List */}
                  {review.replies && review.replies.length > 0 && expandedReplies[reviewIndex] && (
                    <div className="ml-8 mt-3 space-y-3 border-l-2 border-indigo-200 dark:border-indigo-700 pl-4">
                      {review.replies
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((reply, replyIndex) => (
                          <div
                            key={replyIndex}
                            className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg"
                          >
                            {editingReply?.reviewIndex === reviewIndex && editingReply?.replyIndex === replyIndex ? (
                              // Edit Mode
                              <div>
                                <textarea
                                  value={editReplyText}
                                  onChange={(e) => setEditReplyText(e.target.value)}
                                  rows={3}
                                  className={`w-full px-3 py-2 rounded-lg border ${
                                    theme === 'dark'
                                      ? 'bg-gray-700 border-gray-500 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2`}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingReply(null);
                                      setEditReplyText('');
                                    }}
                                    className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 text-gray-800 dark:text-white rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateReply}
                                    className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {reply.userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                          {reply.userName || 'Anonymous'}
                                        </p>
                                        {reply.userId === itemOwnerId && (
                                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-semibold">
                                            Seller
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(reply.createdAt)}
                                        {reply.updatedAt && ' (edited)'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Edit/Delete buttons for own replies or item owner */}
                                  {(reply.userId === currentUserId || itemOwnerId === currentUserId) && (
                                    <div className="flex gap-2">
                                      {reply.userId === currentUserId && (
                                        <button
                                          onClick={() => handleEditReply(reviewIndex, replyIndex, reply.replyText)}
                                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteReply(reviewIndex, replyIndex)}
                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {reply.replyText}
                                </p>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
