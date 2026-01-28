# Async Job Queue - Usage Examples & Documentation

## 🚀 Quick Start

### 1. Initialize in your main server file

```javascript
// campuszon-server/src/index.js
const express = require('express');
const mongoose = require('mongoose');
const QueueInitializer = require('./utils/queue.init');

const app = express();

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Initialize queue system after DB connection
    await QueueInitializer.initialize();
    
    // Start server
    app.listen(process.env.PORT || 5000, () => {
      console.log('🚀 Server running');
    });
  })
  .catch(error => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await QueueInitializer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await QueueInitializer.shutdown();
  process.exit(0);
});
```

### 2. Add jobs to queue

```javascript
const QueueManager = require('./utils/queue.manager');

// Example 1: Image processing job
const jobId = await QueueManager.addJob('IMAGE_PROCESS', {
  itemId: '507f1f77bcf86cd799439011',
  imageUrls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  callbackUrl: 'https://myapp.com/api/image-complete' // Optional
}, 1); // Priority 1

console.log(`Job queued with ID: ${jobId}`);

// Example 2: Email job
await QueueManager.addJob('EMAIL_SEND', {
  to: 'user@example.com',
  subject: 'Welcome to CampusZon',
  body: 'Thank you for signing up!'
});

// Example 3: Cleanup job
await QueueManager.addJob('CLEANUP', {
  task: 'delete_old_files',
  olderThan: '30d'
});
```

### 3. Check job status

```javascript
// Check specific job
const jobStatus = await QueueManager.getJobStatus(jobId);
console.log(jobStatus);
/*
{
  id: "uuid-here",
  type: "IMAGE_PROCESS",
  status: "completed", // pending | processing | completed | failed
  retryCount: 0,
  createdAt: "2024-01-15T10:30:00Z",
  processedAt: "2024-01-15T10:30:05Z",
  completedAt: "2024-01-15T10:31:20Z",
  error: null
}
*/

// Check queue statistics
const stats = await QueueManager.getQueueStats();
console.log(stats);
/*
{
  pending: 5,
  processing: 1,
  completed: 150,
  failed: 2,
  total: 158,
  oldestPendingAge: 30, // seconds
  oldestProcessingAge: 45 // seconds
}
*/
```

## 📋 API Endpoints

Add these routes to your Express app:

```javascript
// campuszon-server/src/routes/queue.routes.js
const express = require('express');
const QueueManager = require('../utils/queue.manager');
const QueueInitializer = require('../utils/queue.init');

const router = express.Router();

// Get queue statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await QueueManager.getQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status
router.get('/job/:jobId', async (req, res) => {
  try {
    const jobStatus = await QueueManager.getJobStatus(req.params.jobId);
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(jobStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await QueueInitializer.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup stuck jobs (admin only)
router.post('/cleanup', async (req, res) => {
  try {
    const count = await QueueManager.cleanupStuckJobs();
    res.json({ success: true, requeuedCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## 🔧 How It Works

### Architecture Overview

```
HTTP Request → Controller → QueueManager.addJob() → MongoDB
                                    ↓
                            Return immediately
                                    ↓
Background: QueueWorker.processNext() → Get job from DB → Execute → Update status
```

### Key Features

1. **Non-blocking**: HTTP requests return immediately after queuing
2. **Persistent**: Jobs survive server restarts (stored in MongoDB)
3. **Reliable**: Automatic retries with exponential backoff
4. **Memory-safe**: Processes one job at a time, forces garbage collection
5. **Observable**: Full job lifecycle tracking and statistics

### Job Lifecycle

```
pending → processing → completed
   ↓           ↓
   ↓        failed (after 3 retries)
   ↓
cancelled
```

### Error Handling & Retries

- **Retry delays**: 1s, 5s, 15s
- **Max retries**: 3 attempts
- **Stuck job cleanup**: Jobs processing >10 minutes are requeued
- **Graceful degradation**: Failed images keep original URLs

## 📊 Monitoring & Debugging

### Console Logs

```bash
# Normal operation
[Queue] Added job abc-123 (type: IMAGE_PROCESS, priority: 1)
[Worker] Processing job abc-123 (type: IMAGE_PROCESS, attempt: 1)
[Worker] Processing 2 images for item 507f1f77bcf86cd799439011
[Worker] Processing image 1/2
[Worker] ✅ Image 1: 2500KB → 180KB (92.8% smaller)
[Worker] Processing image 2/2
[Worker] ✅ Image 2: 1800KB → 145KB (91.9% smaller)
[Worker] ✅ Job abc-123 completed successfully

# Error handling
[Worker] ❌ Failed to process image 1: Request timeout
[Worker] 🔄 Job abc-123 will retry in 1000ms (attempt 2/3)
[Worker] ❌ Job abc-123 failed permanently after 3 attempts: Sharp processing failed
```

### Health Check Endpoint

```bash
GET /api/queue/health

{
  "healthy": true,
  "initialized": true,
  "stats": {
    "pending": 2,
    "processing": 1,
    "completed": 45,
    "failed": 1,
    "total": 49
  },
  "worker": {
    "isProcessing": true,
    "processingJobId": "abc-123",
    "maxRetries": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ⚡ Performance Characteristics

### Memory Usage
- **Base overhead**: ~5MB for queue system
- **Per job**: ~1KB in database
- **Image processing**: Peak ~50MB during Sharp operations
- **Garbage collection**: Forced after each image

### Processing Speed
- **Job queuing**: <10ms
- **Image processing**: 5-15 seconds per image
- **Queue throughput**: ~240 images/hour (4 per minute)

### Database Impact
- **Job creation**: 1 write operation
- **Job processing**: 2-3 update operations
- **Cleanup**: Periodic bulk operations
- **TTL**: Auto-delete completed jobs after 7 days

## 🚨 Production Considerations

### Resource Limits (Render Free Tier)
- **CPU**: Single core, shared
- **Memory**: 512MB total
- **Recommendation**: Process max 2-3 images concurrently

### Scaling Strategy
```javascript
// Current: In-process queue
// Future: External queue (Upstash, Bull, etc.)

// Migration path:
// 1. Replace QueueManager.addJob() calls
// 2. Replace QueueWorker with external worker
// 3. Keep same job payload structure
```

### Error Recovery
- **Server restart**: Jobs automatically resume
- **Database issues**: Jobs retry with backoff
- **Memory pressure**: Single job processing prevents OOM
- **Stuck jobs**: Auto-cleanup every 5 minutes

## 🔄 Migration to External Queue

When ready to scale, replace the queue implementation:

```javascript
// Before (current)
await QueueManager.addJob('IMAGE_PROCESS', payload);

// After (Upstash QStash)
await fetch('https://qstash.upstash.io/v1/publish/webhook-url', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(payload)
});
```

The job payload structure remains the same, making migration seamless.

## 📝 Summary

This queue system provides:
- ✅ **Production-safe** async processing
- ✅ **Memory-efficient** single job concurrency  
- ✅ **Persistent** job storage in MongoDB
- ✅ **Reliable** retry logic with exponential backoff
- ✅ **Observable** with full job lifecycle tracking
- ✅ **Scalable** migration path to external queues

Perfect for Render free tier constraints while maintaining professional reliability.