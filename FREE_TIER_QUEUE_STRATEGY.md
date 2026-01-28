# Free Tier Async Queue Strategy

## 🎯 Problem: Render Free Tier Can't Handle Heavy Processing

### Current Issue:
```javascript
// This blocks EVERYTHING for 5-10 seconds
const optimized = await sharp(buffer).resize().webp().toBuffer();
// Result: Other users get timeouts, failed requests
```

### Solution: Lightweight Background Processing

```javascript
// campuszon-server/src/utils/lightweightQueue.js

class LightweightQueue {
  constructor() {
    this.jobs = new Map(); // In-memory job storage
    this.processing = false;
    this.maxConcurrent = 1; // Only 1 job at a time on free tier
  }

  // Add job (non-blocking)
  addJob(jobId, jobData) {
    this.jobs.set(jobId, {
      id: jobId,
      data: jobData,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0
    });

    console.log(`📋 Queued job ${jobId}. Queue size: ${this.jobs.size}`);
    
    // Start processing (non-blocking)
    setImmediate(() => this.processNext());
    
    return jobId;
  }

  // Process jobs one by one
  async processNext() {
    if (this.processing) return;
    
    const pendingJob = Array.from(this.jobs.values())
      .find(job => job.status === 'pending');
    
    if (!pendingJob) return;
    
    this.processing = true;
    pendingJob.status = 'processing';
    
    try {
      console.log(`⚡ Processing job ${pendingJob.id}...`);
      await this.processImageOptimization(pendingJob);
      
      pendingJob.status = 'completed';
      this.jobs.delete(pendingJob.id); // Clean up
      
      console.log(`✅ Job ${pendingJob.id} completed`);
      
    } catch (error) {
      console.error(`❌ Job ${pendingJob.id} failed:`, error.message);
      
      pendingJob.attempts++;
      if (pendingJob.attempts < 3) {
        pendingJob.status = 'pending'; // Retry
      } else {
        pendingJob.status = 'failed';
        this.jobs.delete(pendingJob.id); // Give up
      }
    }
    
    this.processing = false;
    
    // Process next job after 2 second delay (prevent CPU overload)
    setTimeout(() => this.processNext(), 2000);
  }

  // Actual image processing
  async processImageOptimization(job) {
    const { itemId, imageUrls } = job.data;
    const sharp = require('sharp');
    const axios = require('axios');
    
    const optimizedUrls = [];
    
    for (const url of imageUrls) {
      try {
        // Download with timeout
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 8000 // 8 second timeout
        });
        
        const buffer = Buffer.from(response.data);
        
        // Quick optimization (not perfect, but fast)
        const optimized = await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside' })
          .jpeg({ quality: 80 }) // JPEG is faster than WebP
          .toBuffer();
        
        // Upload optimized
        const optimizedUrl = await this.uploadToImgBB(optimized);
        optimizedUrls.push(optimizedUrl);
        
        console.log(`  ✓ Optimized: ${Math.round(buffer.length/1024)}KB → ${Math.round(optimized.length/1024)}KB`);
        
      } catch (error) {
        console.error(`  ❌ Failed to optimize image:`, error.message);
        optimizedUrls.push(url); // Keep original
      }
    }
    
    // Update database
    const Item = require('../models/item.mongo.model');
    await Item.findByIdAndUpdate(itemId, {
      images: optimizedUrls,
      optimizationStatus: 'completed'
    });
  }

  async uploadToImgBB(buffer) {
    const axios = require('axios');
    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('image', buffer.toString('base64'));
    
    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      params: { key: process.env.IMGBB_API_KEY },
      headers: form.getHeaders(),
      timeout: 15000
    });
    
    return response.data.data.url;
  }

  // Get status
  getStatus() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }
}

module.exports = new LightweightQueue();
```

### Updated Controller (Non-blocking):

```javascript
// campuszon-server/src/controllers/item.controller.js

const queue = require('../utils/lightweightQueue');

const createItem = async (req, res) => {
  try {
    // 1. Quick validation (100ms)
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Images required' });
    }

    // 2. Upload originals immediately (2-3 seconds)
    console.log('[createItem] Uploading original images...');
    const tempUrls = await Promise.all(
      files.map(file => uploadToImgBB(file.buffer))
    );

    // 3. Create item immediately (500ms)
    const item = await Item.create({
      ...req.body,
      images: tempUrls,
      optimizationStatus: 'pending'
    });

    // 4. Queue optimization (non-blocking, 0ms)
    const jobId = queue.addJob(`item-${item._id}`, {
      itemId: item._id,
      imageUrls: tempUrls
    });

    // 5. Return success immediately (total: ~3 seconds)
    res.status(201).json({
      success: true,
      item,
      message: 'Item created! Images optimizing in background.',
      jobId
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

## Benefits:
- ✅ **3-second response** instead of 15 seconds
- ✅ **Non-blocking** - other users unaffected
- ✅ **Memory efficient** - processes one at a time
- ✅ **Retry logic** - handles failures gracefully
- ✅ **Free tier friendly** - no external dependencies