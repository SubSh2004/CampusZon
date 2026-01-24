import mongoose from 'mongoose';
import Item from '../models/item.mongo.model.js';
import ImageModeration from '../models/imageModeration.model.js';
import UserViolation from '../models/userViolation.model.js';
import Notification from '../models/notification.model.js';
import imgbbUploader from 'imgbb-uploader';
import { queueImageModeration } from '../utils/moderationQueue.js';
import { checkUserCanUpload } from '../utils/enforcementSystem.js';
import { getCache, setCache, generateItemsCacheKey, invalidateDomainCache } from '../utils/cache.js';
import { emitNotification } from '../index.js';

// Create a new item
export const createItem = async (req, res) => {
  try {
    const { 
      title, description, price, salePrice, rentPrice, 
      category, listingType, rentalPeriod,
      userId, userName, userPhone, userHostel, userEmail 
    } = req.body;

    // Ensure MongoDB connection is available
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please configure MongoDB connection.',
      });
    }

    // Validation
    if (!title || !description || !price || !category || !userId || !userName || !userPhone || !userHostel || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Validate listing type specific fields
    if (listingType === 'For Sale' || listingType === 'Both') {
      if (!salePrice) {
        return res.status(400).json({
          success: false,
          message: 'Sale price is required for sale listings',
        });
      }
    }

    if (listingType === 'For Rent' || listingType === 'Both') {
      if (!rentPrice || !rentalPeriod) {
        return res.status(400).json({
          success: false,
          message: 'Rent price and rental period are required for rent listings',
        });
      }
    }

    // Validate prices are numbers
    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    if (salePrice && (isNaN(salePrice) || parseFloat(salePrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Sale price cannot be negative',
      });
    }

    if (rentPrice && (isNaN(rentPrice) || parseFloat(rentPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Rent price cannot be negative',
      });
    }

    // Extract email domain
    const emailDomain = userEmail.split('@')[1] || '';
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Upload images directly to ImgBB (no AI moderation)
    let imageUrls = [];
    let imageUrl = null;
    
    if (req.files && req.files.length > 0) {
      try {
        // Limit to 5 images
        const filesToUpload = req.files.slice(0, 5);
        
        // Upload all images to ImgBB
        const uploadPromises = filesToUpload.map(async (file) => {
          const base64Image = file.buffer.toString('base64');
          const response = await imgbbUploader({
            apiKey: process.env.IMGBB_API_KEY,
            base64string: base64Image,
            name: `item-${Date.now()}-${file.originalname}`,
          });
          return response.url;
        });
        
        imageUrls = await Promise.all(uploadPromises);
        imageUrl = imageUrls[0]; // First image is the main image
        
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
        });
      }
    }

    // Create new item with images immediately available
    const itemData = {
      title,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      imageUrls,
      available: true,
      userId,
      userName,
      userPhone,
      userHostel,
      userEmail,
      emailDomain,
      moderationStatus: 'active', // All items start as active
    };

    // Add listing type fields if provided
    if (listingType) {
      itemData.listingType = listingType;
    }
    if (salePrice) {
      itemData.salePrice = parseFloat(salePrice);
    }
    if (rentPrice) {
      itemData.rentPrice = parseFloat(rentPrice);
    }
    if (rentalPeriod) {
      itemData.rentalPeriod = rentalPeriod;
    }

    const newItem = await Item.create(itemData);

    // Invalidate cache for this domain (new item added)
    await invalidateDomainCache(emailDomain);
    console.log(`🗑️  Cache invalidated for domain: ${emailDomain}`);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Item created successfully! It\'s now visible to all users.',
      item: {
        ...newItem.toObject(),
        id: newItem._id.toString(),
        _id: undefined
      }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating item',
      error: error.message,
    });
  }
};

// Get all items (filtered by email domain) with pagination
export const getAllItems = async (req, res) => {
  try {
    const { emailDomain, page = 1, limit = 8, search = '' } = req.query;
    
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        message: 'Email domain is required',
      });
    }

    // Convert to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Try to get from cache first
    const cacheKey = generateItemsCacheKey(emailDomain, pageNum, search);
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.status(200).json(cachedData);
    }
    
    console.log(`❌ Cache miss: ${cacheKey}`);

    // Build query object
    const query = {
      emailDomain,
      moderationStatus: { $in: ['active', 'warned'] }
    };

    // Add search filter if search query exists
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    // Query MongoDB for items matching the domain with active moderation status
    const items = await Item.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

    // Get total count for pagination info
    const totalItems = await Item.countDocuments(query);

    // Convert _id to id for frontend compatibility
    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    const responseData = {
      success: true,
      count: itemsWithId.length,
      items: itemsWithId,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
        hasMore: pageNum * limitNum < totalItems
      }
    };

    // Cache the response for 5 minutes (300 seconds)
    await setCache(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
      error: error.message,
    });
  }
};

// Get user's own items (all statuses, no moderation filter)
export const getMyItems = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;
    const { limit = 10000 } = req.query;

    const limitNum = parseInt(limit);

    console.log('🔍 Fetching items for user ID:', userId);

    // Extract email domain for campus isolation (security)
    const emailDomain = userEmail.split('@')[1] || '';
    
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user email format',
      });
    }

    // Fetch all items created by this user within their campus, regardless of moderation status
    const items = await Item.find({ 
      emailDomain,  // Campus isolation (security + performance)
      userId 
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    console.log(`✅ Found ${items.length} items for user ${userId}`);

    // Convert _id to id for frontend compatibility
    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      success: true,
      count: itemsWithId.length,
      items: itemsWithId
    });
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your items',
      error: error.message,
    });
  }
};

// Get item by ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Valid item ID is required',
      });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }

    const item = await Item.findById(id).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Convert _id to id for frontend compatibility
    const itemWithId = {
      ...item,
      id: item._id.toString(),
      _id: undefined
    };

    res.status(200).json({
      success: true,
      item: itemWithId,
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item',
      error: error.message,
    });
  }
};

// Update item by ID
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, price, salePrice, rentPrice, 
      category, listingType, rentalPeriod, available 
    } = req.body;
    
    // Validate ObjectId format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }
    
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // AUTHORIZATION CHECK: Verify user owns this item (or is admin)
    if (item.userId !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item',
      });
    }

    // Update fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (salePrice !== undefined) updates.salePrice = parseFloat(salePrice);
    if (rentPrice !== undefined) updates.rentPrice = parseFloat(rentPrice);
    if (category !== undefined) updates.category = category;
    if (listingType !== undefined) updates.listingType = listingType;
    if (rentalPeriod !== undefined) updates.rentalPeriod = rentalPeriod;
    if (available !== undefined) updates.available = available;

  Object.assign(item, updates);
  await item.save();

    // Invalidate cache for this domain (item updated)
    await invalidateDomainCache(item.emailDomain);
    console.log(`🗑️  Cache invalidated for domain: ${item.emailDomain}`);

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: {
        ...item.toObject(),
        id: item._id.toString(),
        _id: undefined
      },
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item',
      error: error.message,
    });
  }
};

// Delete item by ID
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }
    
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // AUTHORIZATION CHECK: Verify user owns this item (or is admin)
    if (item.userId !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item',
      });
    }

    // Store email domain before deletion
    const emailDomain = item.emailDomain;

    // Delete the item from MongoDB
    await Item.findByIdAndDelete(id);
    
    // Clean up related data (cascade delete)
    try {
      // Delete image moderation records
      await ImageModeration.deleteMany({ itemId: id });
      
      // Delete notifications related to this item
      await Notification.deleteMany({ 
        $or: [
          { itemId: id },
          { 'metadata.itemId': id }
        ]
      });
      
      console.log(`🧹 Cleaned up related data for item ${id}`);
    } catch (cleanupError) {
      console.error('Error cleaning up related data:', cleanupError);
      // Don't fail the delete if cleanup fails
    }

    // Invalidate cache for this domain (item deleted)
    await invalidateDomainCache(emailDomain);
    console.log(`🗑️  Item deleted and cache invalidated for domain: ${emailDomain}`);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item',
      error: error.message,
    });
  }
};

// Report item
export const reportItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, userEmail, reason, description } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID and reason are required',
      });
    }
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check if user already reported this item
    const alreadyReported = item.reports.some(report => report.userId === userId);
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this item',
      });
    }

    // Add report
    item.reports.push({
      userId,
      userName,
      userEmail,
      reason,
      description,
      createdAt: new Date()
    });
    item.reportCount = item.reports.length;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Item reported successfully. Admin will review it.',
    });
  } catch (error) {
    console.error('Report item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting item',
      error: error.message,
    });
  }
};

// Add review to item
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, rating, comment } = req.body;
    
    console.log('Add review request:', { id, userId, userName, rating, comment });
    
    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'User ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }
    
    const item = await Item.findById(id);
    if (!item) {
      console.log('Item not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check if user already reviewed this item
    const existingReviewIndex = item.reviews.findIndex(review => review.userId === userId);
    
    if (existingReviewIndex >= 0) {
      // Update existing review
      item.reviews[existingReviewIndex] = {
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
        replies: item.reviews[existingReviewIndex].replies || [] // Preserve existing replies
      };
      console.log('Updated existing review');
    } else {
      // Add new review
      item.reviews.push({
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
        replies: [] // Initialize replies array
      });
      console.log('Added new review');
    }

    // Calculate average rating
    const totalRating = item.reviews.reduce((sum, review) => sum + review.rating, 0);
    item.averageRating = totalRating / item.reviews.length;
    item.reviewCount = item.reviews.length;
    
    await item.save();

    console.log('Review saved successfully:', { averageRating: item.averageRating, reviewCount: item.reviewCount });

    res.status(200).json({
      success: true,
      message: existingReviewIndex >= 0 ? 'Review updated successfully' : 'Review added successfully',
      averageRating: item.averageRating,
      reviewCount: item.reviewCount
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding review',
      error: error.message,
    });
  }
};

// Add reply to a review
export const addReplyToReview = async (req, res) => {
  try {
    const { id, reviewIndex } = req.params;
    const { userId, userName, replyText } = req.body;
    
    if (!userId || !replyText) {
      return res.status(400).json({
        success: false,
        message: 'User ID and reply text are required',
      });
    }
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (!item.reviews[reviewIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Initialize replies array if it doesn't exist
    if (!item.reviews[reviewIndex].replies) {
      item.reviews[reviewIndex].replies = [];
    }

    // Add new reply
    item.reviews[reviewIndex].replies.push({
      userId,
      userName,
      replyText,
      createdAt: new Date()
    });
    
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      review: item.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reply',
      error: error.message,
    });
  }
};

// Update a reply
export const updateReply = async (req, res) => {
  try {
    const { id, reviewIndex, replyIndex } = req.params;
    const { userId, replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (!item.reviews[reviewIndex] || !item.reviews[reviewIndex].replies[replyIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    const reply = item.reviews[reviewIndex].replies[replyIndex];
    
    // Check if user owns this reply
    if (reply.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own replies',
      });
    }

    // Update reply
    item.reviews[reviewIndex].replies[replyIndex].replyText = replyText;
    item.reviews[reviewIndex].replies[replyIndex].updatedAt = new Date();
    
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Reply updated successfully',
      review: item.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reply',
      error: error.message,
    });
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  try {
    const { id, reviewIndex, replyIndex } = req.params;
    const { userId } = req.body;
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (!item.reviews[reviewIndex] || !item.reviews[reviewIndex].replies[replyIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    const reply = item.reviews[reviewIndex].replies[replyIndex];
    
    // Check if user owns this reply or is the item owner
    if (reply.userId !== userId && item.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own replies or replies on your items',
      });
    }

    // Remove reply
    item.reviews[reviewIndex].replies.splice(replyIndex, 1);
    
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully',
      review: item.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reply',
      error: error.message,
    });
  }
};

// Get list of all campuses (email domains) for admin
export const getCampusList = async (req, res) => {
  try {
    // Get distinct email domains
    const domains = await Item.distinct('emailDomain');
    
    // Get item count for each domain
    const campusData = await Promise.all(
      domains.filter(d => d).map(async (domain) => {
        const totalCount = await Item.countDocuments({ emailDomain: domain });
        const activeCount = await Item.countDocuments({ emailDomain: domain, moderationStatus: 'active' });
        const warnedCount = await Item.countDocuments({ emailDomain: domain, moderationStatus: 'warned' });
        const removedCount = await Item.countDocuments({ emailDomain: domain, moderationStatus: 'removed' });
        const reportedCount = await Item.countDocuments({ emailDomain: domain, reportCount: { $gt: 0 }, moderationStatus: { $ne: 'removed' } });
        
        return {
          domain,
          totalItems: totalCount,
          activeItems: activeCount,
          warnedItems: warnedCount,
          removedItems: removedCount,
          reportedItems: reportedCount,
        };
      })
    );
    
    // Sort by total items descending
    campusData.sort((a, b) => b.totalItems - a.totalItems);
    
    res.status(200).json({
      success: true,
      count: campusData.length,
      campuses: campusData,
    });
  } catch (error) {
    console.error('Get campuses list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching campuses',
      error: error.message,
    });
  }
};

// Get reported items (Admin only)
export const getReportedItems = async (req, res) => {
  try {
    // Support campus filtering via query parameter
    const { emailDomain } = req.query;
    const filter = {
      reportCount: { $gt: 0 },
      moderationStatus: { $ne: 'removed' }
    };
    
    // Add email domain filter if provided
    if (emailDomain && emailDomain !== 'all') {
      filter.emailDomain = emailDomain;
    }
    
    const items = await Item.find(filter).sort({ reportCount: -1, createdAt: -1 }).lean();

    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    res.status(200).json({
      success: true,
      count: itemsWithId.length,
      items: itemsWithId,
    });
  } catch (error) {
    console.error('Get reported items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reported items',
      error: error.message,
    });
  }
};

// Get all items for admin review
export const getAllItemsForAdmin = async (req, res) => {
  try {
    // Support campus filtering via query parameter
    const { emailDomain } = req.query;
    const filter = {};
    
    // Add email domain filter if provided
    if (emailDomain && emailDomain !== 'all') {
      filter.emailDomain = emailDomain;
    }
    
    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();

    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined,
      reports: item.reports || [],
      reportCount: item.reportCount || 0,
      reviews: item.reviews || [],
      moderationStatus: item.moderationStatus || 'active',
      imageUrls: item.imageUrls || [],
      averageRating: item.averageRating || 0,
      reviewCount: item.reviewCount || 0,
    }));

    res.status(200).json({
      success: true,
      count: itemsWithId.length,
      items: itemsWithId,
    });
  } catch (error) {
    console.error('Get all items for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
      error: error.message,
    });
  }
};

// Admin action on item (keep/warn/remove)
export const moderateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, adminId } = req.body; // action: 'keep', 'warn', 'remove'
    
    if (!action || !['keep', 'warn', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action is required (keep/warn/remove)',
      });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Prepare notification data
    let notificationType = 'ITEM_KEPT_ACTIVE';
    let notificationTitle = '';
    let notificationMessage = '';

    // Update moderation status and prepare notification
    if (action === 'keep') {
      item.moderationStatus = 'active';
      item.reports = []; // Clear reports
      item.reportCount = 0;
      notificationType = 'ITEM_KEPT_ACTIVE';
      notificationTitle = '✅ Your item is active';
      notificationMessage = `Your item "${item.title}" has been reviewed by an admin and is now active in the marketplace.`;
    } else if (action === 'warn') {
      item.moderationStatus = 'warned';
      notificationType = 'ITEM_WARNED';
      notificationTitle = '⚠️ Warning for your item';
      notificationMessage = `Your item "${item.title}" has received a warning from the admin. ${notes ? 'Reason: ' + notes : 'Please review our community guidelines.'}`;
    } else if (action === 'remove') {
      item.moderationStatus = 'removed';
      item.available = false; // Also mark as unavailable
      notificationType = 'ITEM_REMOVED';
      notificationTitle = '❌ Your item was removed';
      notificationMessage = `Your item "${item.title}" has been removed from the marketplace by an admin. ${notes ? 'Reason: ' + notes : 'It violated our community guidelines.'}`;
    }

    item.moderationNotes = notes || '';
    item.moderatedAt = new Date();
    item.moderatedBy = adminId;

    await item.save();

    // Create notification for item owner
    try {
      const notification = await Notification.create({
        userId: item.userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        itemId: item._id,
        imageUrl: item.imageUrl,
        read: false,
        metadata: new Map([
          ['action', action],
          ['adminNotes', notes || ''],
          ['itemTitle', item.title]
        ])
      });
      console.log(`✅ Notification sent to user ${item.userId} for ${action} action on item ${item.title}`);
      
      // Send real-time notification
      emitNotification(item.userId, notification);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Item ${action === 'keep' ? 'kept active' : action === 'warn' ? 'warned' : 'removed'} successfully`,
      item: {
        ...item.toObject(),
        id: item._id.toString(),
        _id: undefined
      }
    });
  } catch (error) {
    console.error('Moderate item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while moderating item',
      error: error.message,
    });
  }
};
