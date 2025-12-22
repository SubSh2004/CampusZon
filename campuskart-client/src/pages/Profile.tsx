import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import axios from 'axios';
import { userAtom } from '../store/user.atom';

interface Item {
  id: string; // Changed from number to string for MongoDB ObjectId compatibility
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  createdAt: string;
}

export default function Profile() {
  const user = useRecoilValue(userAtom);
  const setUser = useSetRecoilState(userAtom);
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Form state for editing items
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    available: true,
  });
  const [editListingType, setEditListingType] = useState<'For Sale' | 'For Rent' | ''>('');

  // Form state for editing profile
  const [profileForm, setProfileForm] = useState({
    username: '',
    phoneNumber: '',
    hostelName: '',
  });

  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [profileUpdateMessage, setProfileUpdateMessage] = useState('');
  const [profileUpdateError, setProfileUpdateError] = useState('');

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchMyItems();
  }, [user.isLoggedIn, navigate]);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const emailDomain = user.email?.split('@')[1] || '';
      const response = await axios.get(`/api/items?emailDomain=${emailDomain}`);
      
      if (response.data.success) {
        // Filter to show only current user's items
        const userItems = response.data.items.filter(
          (item: Item & { userId: string }) => item.userId === user.userId
        );
        setMyItems(userItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    
    // Parse category to extract listing type and actual category
    let listingType: 'For Sale' | 'For Rent' | '' = '';
    let category = item.category;
    
    if (item.category.includes('For Sale')) {
      listingType = 'For Sale';
      category = item.category.replace('For Sale - ', '');
    } else if (item.category.includes('For Rent')) {
      listingType = 'For Rent';
      category = item.category.replace('For Rent - ', '');
    }
    
    setEditListingType(listingType);
    setEditForm({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      category: category,
      available: item.available,
    });
    setShowEditModal(true);
    setUpdateMessage('');
    setUpdateError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setUpdateError('');
      setUpdateMessage('');

      const response = await axios.put(`/api/items/${editingItem.id}`, {
        title: editForm.title,
        description: editForm.description,
        price: parseFloat(editForm.price),
        category: editListingType ? `${editListingType} - ${editForm.category}` : editForm.category,
        available: editForm.available,
      });

      if (response.data.success) {
        setUpdateMessage('Item updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          fetchMyItems();
        }, 1500);
      }
    } catch (error: any) {
      setUpdateError(error.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/items/${itemId}`);
      if (response.data.success) {
        fetchMyItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleAvailability = async (item: Item) => {
    try {
      const response = await axios.put(`/api/items/${item.id}`, {
        available: !item.available,
      });

      if (response.data.success) {
        fetchMyItems();
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleEditProfileClick = () => {
    setProfileForm({
      username: user.username || '',
      phoneNumber: user.phoneNumber || '',
      hostelName: user.hostelName || '',
    });
    setShowEditProfileModal(true);
    setProfileUpdateMessage('');
    setProfileUpdateError('');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProfileUpdateError('');
      setProfileUpdateMessage('');

      const response = await axios.put('/api/user/profile', {
        username: profileForm.username,
        phoneNumber: profileForm.phoneNumber,
        hostelName: profileForm.hostelName,
      });

      if (response.data.success) {
        // Update localStorage
        localStorage.setItem('username', profileForm.username);
        localStorage.setItem('phoneNumber', profileForm.phoneNumber);
        localStorage.setItem('hostelName', profileForm.hostelName);

        // Update Recoil state
        setUser({
          ...user,
          username: profileForm.username,
          phoneNumber: profileForm.phoneNumber,
          hostelName: profileForm.hostelName,
        });

        setProfileUpdateMessage('Profile updated successfully!');
        setTimeout(() => {
          setShowEditProfileModal(false);
        }, 1500);
      }
    } catch (error: any) {
      setProfileUpdateError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-icon.jpg" alt="CampusZon" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Profile</span>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* User Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 dark:border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <button
              onClick={handleEditProfileClick}
              className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">Personal Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">Contact Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hostel</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.hostelName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Items Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 dark:border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Listed Items</h2>
            <button
              onClick={() => navigate('/add-item')}
              className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition text-sm sm:text-base"
            >
              + Add New Item
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
            </div>
          ) : myItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">You haven't listed any items yet.</p>
              <button
                onClick={() => navigate('/add-item')}
                className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                List your first item →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition bg-white dark:bg-gray-800"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Image */}
                    <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{item.category}</p>
                          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-2 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                          <p className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{parseFloat(item.price.toString()).toFixed(2)}</p>
                          <span className={`inline-block sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            item.available 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}>
                            {item.available ? 'Available' : 'Sold/Unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-3 py-1.5 sm:py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-xs sm:text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`px-3 py-1.5 sm:py-1 rounded-md transition text-xs sm:text-sm font-medium ${
                            item.available
                              ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                              : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                          }`}
                        >
                          <span className="hidden sm:inline">Mark as {item.available ? 'Unavailable' : 'Available'}</span>
                          <span className="sm:hidden">{item.available ? 'Unavailable' : 'Available'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1.5 sm:py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition text-xs sm:text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:border dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Item</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {updateMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md">
                  {updateMessage}
                </div>
              )}

              {updateError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
                  {updateError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Listing Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditListingType('For Sale')}
                      className={`px-4 py-3 rounded-md font-semibold transition-all ${
                        editListingType === 'For Sale'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">💰</span>
                        <span>For Sale</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditListingType('For Rent')}
                      className={`px-4 py-3 rounded-md font-semibold transition-all ${
                        editListingType === 'For Rent'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">🏠</span>
                        <span>For Rent</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Books">Books</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={editForm.available}
                    onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="available" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Item is available for sale
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile</h2>

            {profileUpdateMessage && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md text-sm">
                {profileUpdateMessage}
              </div>
            )}

            {profileUpdateError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
                {profileUpdateError}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hostel Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.hostelName}
                  onChange={(e) => setProfileForm({ ...profileForm, hostelName: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
