# Microservice Strategy for CampusZon

## 🎯 When to Use Microservices

### Current Pain Points:
1. **Image processing** blocks main app
2. **Single point of failure** - if main app crashes, everything down
3. **Resource contention** - all features compete for same CPU/memory
4. **Scaling limitations** - can't scale individual features

## 🏗️ Recommended Microservice Architecture

### Phase 1: Extract Heavy Processing

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN APP (Render Free)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   User Auth     │  │   Item CRUD     │  │   Chat       │ │
│  │   - Login       │  │   - Create      │  │   - Messages │ │
│  │   - Signup      │  │   - Read        │  │   - Socket   │ │
│  │   - Tokens      │  │   - Update      │  │   - Real-time│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼ (HTTP requests)
┌─────────────────────────────────────────────────────────────┐
│              IMAGE PROCESSING SERVICE                        │
│                    (Separate Deployment)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Optimize      │  │   Resize        │  │   Upload     │ │
│  │   - Sharp       │  │   - WebP        │  │   - ImgBB    │ │
│  │   - Compress    │  │   - Quality     │  │   - S3       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Implementation:

#### Main App (Lightweight):
```javascript
// campuszon-server/src/controllers/item.controller.js

const createItem = async (req, res) => {
  try {
    // 1. Upload originals immediately
    const tempUrls = await uploadOriginals(req.files);
    
    // 2. Create item
    const item = await Item.create({
      ...req.body,
      images: tempUrls,
      optimizationStatus: 'pending'
    });
    
    // 3. Send to image service (non-blocking)
    axios.post(process.env.IMAGE_SERVICE_URL + '/optimize', {
      itemId: item._id,
      imageUrls: tempUrls,
      callbackUrl: process.env.MAIN_APP_URL + '/api/items/optimization-complete'
    }).catch(err => console.error('Image service error:', err));
    
    // 4. Return immediately
    res.json({ success: true, item });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Callback endpoint
const optimizationComplete = async (req, res) => {
  const { itemId, optimizedUrls, success } = req.body;
  
  await Item.findByIdAndUpdate(itemId, {
    images: optimizedUrls,
    optimizationStatus: success ? 'completed' : 'failed'
  });
  
  res.json({ received: true });
};
```

#### Image Processing Service:
```javascript
// image-service/server.js (Separate deployment)

const express = require('express');
const sharp = require('sharp');
const app = express();

app.post('/optimize', async (req, res) => {
  const { itemId, imageUrls, callbackUrl } = req.body;
  
  // Return immediately
  res.json({ accepted: true, jobId: itemId });
  
  // Process in background
  processImages(itemId, imageUrls, callbackUrl);
});

const processImages = async (itemId, imageUrls, callbackUrl) => {
  try {
    const optimizedUrls = [];
    
    for (const url of imageUrls) {
      // Heavy processing here (doesn't block main app)
      const optimized = await optimizeImage(url);
      optimizedUrls.push(optimized);
    }
    
    // Notify main app when done
    await axios.post(callbackUrl, {
      itemId,
      optimizedUrls,
      success: true
    });
    
  } catch (error) {
    await axios.post(callbackUrl, {
      itemId,
      success: false,
      error: error.message
    });
  }
};

app.listen(3001);
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
```yaml
# railway.json
{
  "services": {
    "main-app": {
      "source": "./campuszon-server",
      "build": "npm install",
      "start": "npm start"
    },
    "image-service": {
      "source": "./image-service",
      "build": "npm install",
      "start": "npm start"
    }
  }
}
```

**Benefits:**
- ✅ $5/month credit covers both services
- ✅ Easy deployment
- ✅ Automatic scaling
- ✅ Built-in monitoring

### Option 2: Render + Vercel Functions
```javascript
// vercel/api/optimize-image.js (Serverless function)

import sharp from 'sharp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { imageUrl } = req.body;
  
  try {
    // Download image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Optimize
    const optimized = await sharp(Buffer.from(buffer))
      .resize(1200, 1200, { fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();
    
    // Upload to ImgBB
    const optimizedUrl = await uploadToImgBB(optimized);
    
    res.json({ success: true, optimizedUrl });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Benefits:**
- ✅ Serverless (no always-on costs)
- ✅ Auto-scaling
- ✅ 100GB-hours free on Vercel
- ✅ No server management

### Option 3: Cloudflare Workers
```javascript
// cloudflare-worker.js

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const { imageUrl } = await request.json();
    
    // Use Cloudflare Image Resizing
    const optimizedUrl = `https://imagedelivery.net/your-account/${imageUrl}/w=1200,q=85,f=webp`;
    
    return Response.json({ optimizedUrl });
  }
};
```

**Benefits:**
- ✅ 100,000 requests/day free
- ✅ Global edge network
- ✅ Built-in image optimization
- ✅ Extremely fast

## 📊 Cost Comparison

| Solution | Main App | Image Processing | Total/Month |
|----------|----------|------------------|-------------|
| **Monolithic** | Render Free (750h) | Same server | $0 (but slow) |
| **Railway Split** | Railway ($5 credit) | Railway ($5 credit) | $0-10 |
| **Render + Vercel** | Render Free | Vercel Free | $0 |
| **Render + Cloudflare** | Render Free | CF Workers Free | $0 |

## 🎯 Recommended Approach

### For Your Current Stage:

1. **Start with lightweight queue** (Option 1 above)
   - Keeps everything simple
   - Solves immediate blocking issue
   - No additional infrastructure

2. **If still having issues, move to Vercel Functions**:
   ```javascript
   // In main app
   const optimizeImages = async (imageUrls) => {
     const promises = imageUrls.map(url => 
       fetch('https://your-app.vercel.app/api/optimize-image', {
         method: 'POST',
         body: JSON.stringify({ imageUrl: url })
       })
     );
     
     return Promise.all(promises);
   };
   ```

3. **For scale (1000+ users), consider Railway microservices**

## 🚨 Free Tier Optimization Tips

### Immediate Actions:
```javascript
// 1. Add request timeout
app.use(timeout('30s'));

// 2. Add rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/items', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // Max 10 uploads per 15 min per IP
}));

// 3. Add compression
app.use(compression());

// 4. Optimize database queries
// Add indexes, use lean(), limit results
```

### Queue Priority System:
```javascript
class PriorityQueue {
  constructor() {
    this.highPriority = []; // Small images
    this.lowPriority = [];  // Large images
  }
  
  add(job) {
    if (job.data.totalSize < 1000000) { // < 1MB
      this.highPriority.push(job);
    } else {
      this.lowPriority.push(job);
    }
  }
  
  getNext() {
    return this.highPriority.shift() || this.lowPriority.shift();
  }
}
```

## 🎯 Action Plan

### Week 1: Implement Lightweight Queue
- Add the simple async queue
- Test with multiple concurrent uploads
- Monitor Render resource usage

### Week 2: Add Rate Limiting & Optimization
- Implement upload rate limits
- Add compression middleware
- Optimize database queries

### Week 3: Consider External Processing
- If still having issues, implement Vercel Functions
- Test image processing offload
- Monitor performance improvements

### Month 2: Scale Decision
- If growing rapidly (100+ daily users), consider Railway microservices
- If staying small, stick with current setup

The key is to **start simple** and **scale only when needed**!