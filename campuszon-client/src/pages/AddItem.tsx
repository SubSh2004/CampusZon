import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import axios from '../config/axios';
import { userAtom } from '../store/user.atom';
import BrandName from '../components/BrandName';
import { ITEM_CATEGORIES } from '../constants/categories';

export default function AddItem() {
  const navigate = useNavigate();
  const user = useRecoilValue(userAtom);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salePrice: '',
    rentPrice: '',
    category: '',
  });
  const [listingType, setListingType] = useState<'For Sale' | 'For Rent' | 'Both' | ''>('');
  const [rentalPeriod, setRentalPeriod] = useState<'Per Day' | 'Per Week' | 'Per Month'>('Per Day');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 3); // Limit to 3 images
      
      if (fileArray.length + images.length > 3) {
        setError('Maximum 3 images allowed');
        return;
      }
      
      setImages(prev => [...prev, ...fileArray].slice(0, 3));
      
      // Create preview URLs
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string].slice(0, 5));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // FIX: Prevent double-submit (idempotency guard)
    if (loading) {
      console.log('⚠️  Submit already in progress, ignoring duplicate');
      return;
    }

    // Check if user is logged in
    if (!user.isLoggedIn) {
      setError('You must be logged in to add an item');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Title, description, and category are required');
      return;
    }

    if (!listingType) {
      setError('Please select a listing type (For Sale, For Rent, or Both)');
      return;
    }

    if ((listingType === 'For Sale' || listingType === 'Both') && !formData.salePrice) {
      setError('Sale price is required');
      return;
    }

    if ((listingType === 'For Rent' || listingType === 'Both') && !formData.rentPrice) {
      setError('Rent price is required');
      return;
    }

    if (formData.salePrice && parseFloat(formData.salePrice) < 0) {
      setError('Sale price cannot be negative');
      return;
    }

    if (formData.rentPrice && parseFloat(formData.rentPrice) < 0) {
      setError('Rent price cannot be negative');
      return;
    }

    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);

    try {
      // Create FormData object
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('listingType', listingType);
      
      // Add prices based on listing type
      if (listingType === 'For Sale' || listingType === 'Both') {
        data.append('salePrice', formData.salePrice);
      }
      if (listingType === 'For Rent' || listingType === 'Both') {
        data.append('rentPrice', formData.rentPrice);
        data.append('rentalPeriod', rentalPeriod);
      }
      
      // For backward compatibility with backend, send primary price
      const primaryPrice = listingType === 'For Rent' ? formData.rentPrice : formData.salePrice;
      data.append('price', primaryPrice);
      
      
      // Append all images
      images.forEach((img) => {
        data.append('images', img);
      });
      
      data.append('userId', user.userId || '');
      data.append('userName', user.username || '');
      data.append('userPhone', user.phoneNumber || '');
      data.append('userHostel', user.hostelName || '');
      data.append('userEmail', user.email || '');

      // Debug logging
      console.log('📤 Sending item data:', {
        title: formData.title,
        description: formData.description,
        listingType,
        salePrice: formData.salePrice,
        rentPrice: formData.rentPrice,
        rentalPeriod,
        category: formData.category,
        userId: user.userId,
        userName: user.username,
        userPhone: user.phoneNumber,
        userHostel: user.hostelName,
        userEmail: user.email,
        imageCount: images.length
      });

      // Send POST request
      const response = await axios.post('/api/items/add', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Check if requires manual review
        if (response.data.moderation?.requiresManualReview) {
          setSuccess('Admin will check and upload your item. Thank you!');
          setTimeout(() => {
            navigate('/');
          }, 2500);
        } else {
          setSuccess('Item added successfully!');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error response:', err.response);
      
      // Show detailed validation errors if available
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
          .map((e: any) => `${e.field}: ${e.message}`)
          .join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to add item. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 dark:border dark:border-gray-700">
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <img src="/logo-icon.jpg" alt="CampusZon" className="w-12 h-12 flex-shrink-0 rounded-full object-cover shadow-md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Item</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">List your item for sale on <BrandName className="font-semibold" /></p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            title="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="e.g., iPhone 13 Pro"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Describe your item in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Listing Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setListingType('For Sale')}
                className={`px-4 py-3 rounded-md font-semibold transition-all ${
                  listingType === 'For Sale'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xl">💰</span>
                  <span className="text-sm">For Sale</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setListingType('For Rent')}
                className={`px-4 py-3 rounded-md font-semibold transition-all ${
                  listingType === 'For Rent'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xl">🏠</span>
                  <span className="text-sm">For Rent</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setListingType('Both')}
                className={`px-4 py-3 rounded-md font-semibold transition-all ${
                  listingType === 'Both'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xl">🔄</span>
                  <span className="text-sm">Both</span>
                </div>
              </button>
            </div>
          </div>

          {/* Sale Price Field - shown for 'For Sale' or 'Both' */}
          {(listingType === 'For Sale' || listingType === 'Both') && (
            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sale Price (₹) (Cannot be 0)
              </label>
              <input
                id="salePrice"
                name="salePrice"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Rent Price Field - shown for 'For Rent' or 'Both' */}
          {(listingType === 'For Rent' || listingType === 'Both') && (
            <div>
              <label htmlFor="rentPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rent Amount (₹) (Cannot be 0)
              </label>
              <input
                id="rentPrice"
                name="rentPrice"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.rentPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Rental Period - shown for 'For Rent' or 'Both' */}
          {(listingType === 'For Rent' || listingType === 'Both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rental Period
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRentalPeriod('Per Day')}
                  className={`px-4 py-3 rounded-md font-semibold transition-all ${
                    rentalPeriod === 'Per Day'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">📅</div>
                    <div className="text-sm mt-1">Per Day</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRentalPeriod('Per Week')}
                  className={`px-4 py-3 rounded-md font-semibold transition-all ${
                    rentalPeriod === 'Per Week'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">📆</div>
                    <div className="text-sm mt-1">Per Week</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRentalPeriod('Per Month')}
                  className={`px-4 py-3 rounded-md font-semibold transition-all ${
                    rentalPeriod === 'Per Month'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">🗓️</div>
                    <div className="text-sm mt-1">Per Month</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            >
              <option value="">Select a category</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Images (Maximum 3, each up to 5MB)
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={images.length >= 5}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 dark:file:bg-green-900/30 file:text-green-700 dark:file:text-green-400 hover:file:bg-green-100 dark:hover:file:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {images.length}/3 images selected
            </p>
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Previews:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{imagePreviews.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:ring-offset-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Adding Item...' : 'Add Item'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:ring-offset-gray-800 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
