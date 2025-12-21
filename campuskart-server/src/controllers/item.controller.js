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

    // Check if user is allowed to upload (enforcement check)
    const uploadPermission = await checkUserCanUpload(userId);
    if (!uploadPermission.allowed) {
      return res.status(403).json({
        success: false,
        message: uploadPermission.reason,
        suspendedUntil: uploadPermission.suspendedUntil,
        banReason: uploadPermission.banReason
      });
    }

    // Upload images with moderation
    let imageUrls = [];
    let imageUrl = null;
    let pendingModerationCount = 0;
    
    if (req.files && req.files.length > 0) {
      try {
        // Limit to 5 images
        const filesToUpload = req.files.slice(0, 5);
        
        // Upload to temporary storage first (ImgBB)
        const tempUploadPromises = filesToUpload.map(async (file) => {
          const base64Image = file.buffer.toString('base64');
          const response = await imgbbUploader({
            apiKey: process.env.IMGBB_API_KEY,
            base64string: base64Image,
            name: `temp-${Date.now()}-${file.originalname}`,
          });
          return {
            url: response.url,
            buffer: file.buffer,
            metadata: {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size
            }
          };
        });
        
        const tempUploads = await Promise.all(tempUploadPromises);
        
        // Note: Images are uploaded to temp storage, but not added to item yet
        // They will be added after moderation approval
        pendingModerationCount = tempUploads.length;
        
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images',
        });
      }
    }

    // Create new item WITHOUT images (images added after moderation)
    const newItem = await Item.create({
      title,
      description,
      price: parseFloat(price),
      category,
      imageUrl: null, // Will be set after moderation approval
      imageUrls: [], // Will be populated after moderation approval
      available: true,
      userId,
      userName,
      userPhone,
      userHostel,
      userEmail,
      emailDomain,
    });

    // Queue images for moderation
    if (req.files && req.files.length > 0) {
      const filesToUpload = req.files.slice(0, 5);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Upload to temporary storage
        const base64Image = file.buffer.toString('base64');
        const tempUpload = await imgbbUploader({
          apiKey: process.env.IMGBB_API_KEY,
          base64string: base64Image,
          name: `temp-${Date.now()}-${file.originalname}`,
        });

        // Queue for moderation
        await queueImageModeration({
          imageBuffer: file.buffer,
          tempImageUrl: tempUpload.url,
          itemId: newItem._id,
          userId,
          category,
          fileMetadata: {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          },
          onApproved: async (approvedUrl, moderationRecord) => {
            // Add approved image to item
            const item = await Item.findById(newItem._id);
            if (item) {
              item.imageUrls.push(approvedUrl);
              if (!item.imageUrl) {
                item.imageUrl = approvedUrl; // First approved image becomes main image
              }
              await item.save();
            }
          },
          onRejected: async (reasons, errorMessage) => {
            console.log(`Image rejected for item ${newItem._id}: ${reasons.join(', ')}`);
          },
          onManualReview: async (moderationRecord) => {
            console.log(`Image flagged for manual review: ${moderationRecord._id}`);
          }
        });
      }

      // Update user violation stats (increment upload count)
      await UserViolation.findOneAndUpdate(
        { userId },
        {
          $inc: { 'stats.totalImagesUploaded': filesToUpload.length }
        },
        { upsert: true }
      );
    }

    // Return response
    res.status(201).json({
      success: true,
      message: pendingModerationCount > 0 
        ? 'Admin will check and upload your item. Thank you!'
        : 'Item created successfully',
      item: {
        ...newItem.toObject(),
        id: newItem._id.toString(),
        _id: undefined
      },
      moderation: {
        pending: pendingModerationCount,
        requiresManualReview: pendingModerationCount > 0,
        message: pendingModerationCount > 0 
          ? 'Your images are being reviewed by our admin team'
          : null
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

    // Query MongoDB for items matching the domain
    const items = await Item.find({ emailDomain }).sort({ createdAt: -1 }).lean();

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
