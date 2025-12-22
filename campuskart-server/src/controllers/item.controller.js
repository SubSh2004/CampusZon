import mongoose from 'mongoose';
import Item from '../models/item.mongo.model.js';
import ImageModeration from '../models/imageModeration.model.js';
import UserViolation from '../models/userViolation.model.js';
import imgbbUploader from 'imgbb-uploader';
import { queueImageModeration } from '../utils/moderationQueue.js';
import { checkUserCanUpload } from '../utils/enforcementSystem.js';

// Create a new item
export const createItem = async (req, res) => {
  try {
    const { title, description, price, category, userId, userName, userPhone, userHostel, userEmail } = req.body;

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
        message: 'All fields are required',
      });
    }

    // Validate price is a number
    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
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
    const newItem = await Item.create({
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
    });

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

// Get all items (filtered by email domain)
export const getAllItems = async (req, res) => {
  try {
    const { emailDomain } = req.query;
    
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        message: 'Email domain is required',
      });
    }

    // Query MongoDB for items matching the domain with active moderation status
    const items = await Item.find({ 
      emailDomain,
      moderationStatus: { $in: ['active', 'warned'] } // Show active and warned items
    }).sort({ createdAt: -1 }).lean();

    // Convert _id to id for frontend compatibility
    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(), // Convert ObjectId to string and add as 'id'
      _id: undefined // Remove the original _id field
    }));

    res.status(200).json({
      success: true,
      count: itemsWithId.length,
      items: itemsWithId,
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
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
    const { title, description, price, category, available } = req.body;
    
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

    // Update fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (available !== undefined) updates.available = available;

  Object.assign(item, updates);
  await item.save();

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

    await Item.findByIdAndDelete(id);

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
        createdAt: new Date()
      };
    } else {
      // Add new review
      item.reviews.push({
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    // Calculate average rating
    const totalRating = item.reviews.reduce((sum, review) => sum + review.rating, 0);
    item.averageRating = totalRating / item.reviews.length;
    item.reviewCount = item.reviews.length;
    
    await item.save();

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

// Get reported items (Admin only)
export const getReportedItems = async (req, res) => {
  try {
    const items = await Item.find({ 
      reportCount: { $gt: 0 },
      moderationStatus: { $ne: 'removed' }
    }).sort({ reportCount: -1, createdAt: -1 }).lean();

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
    const items = await Item.find({}).sort({ createdAt: -1 }).lean();

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

    // Update moderation status
    if (action === 'keep') {
      item.moderationStatus = 'active';
      item.reports = []; // Clear reports
      item.reportCount = 0;
    } else if (action === 'warn') {
      item.moderationStatus = 'warned';
    } else if (action === 'remove') {
      item.moderationStatus = 'removed';
      item.available = false; // Also mark as unavailable
    }

    item.moderationNotes = notes || '';
    item.moderatedAt = new Date();
    item.moderatedBy = adminId;

    await item.save();

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
