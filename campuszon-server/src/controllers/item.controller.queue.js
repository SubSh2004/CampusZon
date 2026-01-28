// campuszon-server/src/controllers/item.controller.queue.js
// Example integration with the async queue

const Item = require('../models/item.mongo.model');
const QueueManager = require('../utils/queue.manager');
const { uploadToImgBB } = require('../utils/imageUpload');

const createItem = async (req, res) => {
  try {
    const { title, description, price, category, condition, userId } = req.body;
    const files = req.files;

    // Validation
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    if (files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images allowed' });
    }

    console.log(`[createItem] Processing ${files.length} images for quick upload...`);

    // Step 1: Quick validation (non-blocking)
    const validatedFiles = files.map(file => {
      if (file.size > 5000000) { // 5MB limit
        throw new Error(`File ${file.originalname} exceeds 5MB limit`);
      }
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        throw new Error(`File ${file.originalname} has invalid format`);
      }
      
      return file;
    });

    // Step 2: Upload original images immediately (2-3 seconds)
    console.log('[createItem] Uploading original images...');
    const tempImageUrls = await Promise.all(
      validatedFiles.map(async (file) => {
        try {
          return await uploadToImgBB(file.buffer);
        } catch (error) {
          console.error(`Failed to upload ${file.originalname}:`, error.message);
          throw new Error(`Upload failed for ${file.originalname}`);
        }
      })
    );

    // Step 3: Create item immediately with temp images (500ms)
    const newItem = new Item({
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      images: tempImageUrls, // Original images for immediate display
      userId,
      optimizationStatus: 'pending', // Will be updated by queue worker
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedItem = await newItem.save();
    console.log(`[createItem] ✅ Item created with ID: ${savedItem._id}`);

    // Step 4: Queue image optimization (non-blocking, immediate return)
    const jobId = await QueueManager.addJob('IMAGE_PROCESS', {
      itemId: savedItem._id.toString(),
      imageUrls: tempImageUrls,
      callbackUrl: null // Optional: add callback URL if needed
    }, 1); // Priority 1 for image processing

    console.log(`[createItem] 📋 Queued optimization job: ${jobId}`);

    // Step 5: Return success immediately (total time: ~3 seconds)
    res.status(201).json({
      success: true,
      message: 'Item created successfully. Images are being optimized in background.',
      item: {
        id: savedItem._id,
        title: savedItem.title,
        description: savedItem.description,
        price: savedItem.price,
        category: savedItem.category,
        condition: savedItem.condition,
        images: savedItem.images,
        optimizationStatus: savedItem.optimizationStatus,
        createdAt: savedItem.createdAt
      },
      jobId // Client can use this to check optimization status
    });

  } catch (error) {
    console.error('[createItem] Error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get optimization status for an item
const getOptimizationStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await Item.findById(itemId).select('optimizationStatus optimizedAt');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({
      itemId,
      status: item.optimizationStatus,
      optimizedAt: item.optimizedAt
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get job status by job ID
const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobStatus = await QueueManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobStatus);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get queue statistics (admin only)
const getQueueStats = async (req, res) => {
  try {
    const stats = await QueueManager.getQueueStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manual cleanup of stuck jobs (admin only)
const cleanupQueue = async (req, res) => {
  try {
    const requeuedCount = await QueueManager.cleanupStuckJobs();
    
    res.json({
      success: true,
      message: `Requeued ${requeuedCount} stuck jobs`,
      requeuedCount
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createItem,
  getOptimizationStatus,
  getJobStatus,
  getQueueStats,
  cleanupQueue
};