# CampusZon Microservice Architecture - Large Scale

## 🏗️ Complete Service Breakdown

### Core Services (Essential)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Load Balancer  │  │  Rate Limiting  │  │  Authentication │             │
│  │  - Nginx/Traefik│  │  - Per service  │  │  - JWT verify   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   USER SERVICE      │  │   ITEM SERVICE      │  │   CHAT SERVICE      │
│                     │  │                     │  │                     │
│ - Authentication    │  │ - CRUD operations   │  │ - Real-time msgs    │
│ - User profiles     │  │ - Search & filter   │  │ - Socket.IO         │
│ - Token management  │  │ - Categories        │  │ - Message history   │
│ - Email verification│  │ - Bookings          │  │ - Online status     │
│                     │  │                     │  │                     │
│ DB: MongoDB         │  │ DB: MongoDB         │  │ DB: MongoDB         │
│ Cache: Redis        │  │ Cache: Redis        │  │ Cache: Redis        │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │     IMAGE PROCESSING SERVICE    │
                    │                                 │
                    │ - Image optimization            │
                    │ - Multiple format generation    │
                    │ - CDN upload                    │
                    │ - Background processing         │
                    │                                 │
                    │ Queue: Redis/Bull               │
                    │ Storage: AWS S3/Cloudinary     │
                    └─────────────────────────────────┘
```

## 📦 Service Details

### 1. API Gateway Service
```javascript
// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();

// Rate limiting per service
const createRateLimit = (windowMs, max) => rateLimit({ windowMs, max });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Service routes with rate limiting
app.use('/api/auth', 
  createRateLimit(15 * 60 * 1000, 10), // 10 requests per 15 min
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/api' }
  })
);

app.use('/api/items',
  createRateLimit(1 * 60 * 1000, 30), // 30 requests per minute
  authenticateToken,
  createProxyMiddleware({
    target: process.env.ITEM_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/items': '/api' }
  })
);

app.use('/api/chat',
  createRateLimit(1 * 60 * 1000, 100), // 100 messages per minute
  authenticateToken,
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/chat': '/api' }
  })
);

app.use('/api/images',
  createRateLimit(5 * 60 * 1000, 20), // 20 uploads per 5 min
  authenticateToken,
  createProxyMiddleware({
    target: process.env.IMAGE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/images': '/api' }
  })
);

app.listen(process.env.PORT || 3000);
```

### 2. User Service (Authentication & Profiles)
```javascript
// user-service/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redis = require('../config/redis');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        emailDomain: email.split('@')[1],
        tokens: 2 // Free tokens for new users
      });
      
      await user.save();
      
      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Cache user session
      await redis.setex(`user:${user._id}`, 7 * 24 * 60 * 60, JSON.stringify({
        userId: user._id,
        email: user.email,
        name: user.name,
        tokens: user.tokens
      }));
      
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          tokens: user.tokens
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Check cache first
      const cachedUser = await redis.get(`user:email:${email}`);
      let user;
      
      if (cachedUser) {
        user = JSON.parse(cachedUser);
      } else {
        user = await User.findOne({ email }).lean();
        if (user) {
          await redis.setex(`user:email:${email}`, 60 * 60, JSON.stringify(user));
        }
      }
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          tokens: user.tokens
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async getProfile(req, res) {
    try {
      const { userId } = req.user;
      
      // Check cache first
      const cachedUser = await redis.get(`user:${userId}`);
      let user;
      
      if (cachedUser) {
        user = JSON.parse(cachedUser);
      } else {
        user = await User.findById(userId).select('-password').lean();
        if (user) {
          await redis.setex(`user:${userId}`, 60 * 60, JSON.stringify(user));
        }
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ success: true, user });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
```

### 3. Item Service (Core Business Logic)
```javascript
// item-service/src/controllers/itemController.js
const Item = require('../models/Item');
const redis = require('../config/redis');
const axios = require('axios');

class ItemController {
  async createItem(req, res) {
    try {
      const { title, description, price, category, condition } = req.body;
      const { userId, email } = req.user;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' });
      }
      
      // Create item with temporary status
      const item = new Item({
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        userId,
        emailDomain: email.split('@')[1],
        status: 'processing',
        imageProcessingStatus: 'pending'
      });
      
      await item.save();
      
      // Send images to image processing service
      const imageFormData = new FormData();
      files.forEach((file, index) => {
        imageFormData.append('images', file.buffer, `image-${index}.jpg`);
      });
      imageFormData.append('itemId', item._id.toString());
      imageFormData.append('callbackUrl', `${process.env.ITEM_SERVICE_URL}/api/image-processing-complete`);
      
      // Non-blocking call to image service
      axios.post(`${process.env.IMAGE_SERVICE_URL}/api/process`, imageFormData, {
        headers: imageFormData.getHeaders(),
        timeout: 5000
      }).catch(error => {
        console.error('Image service error:', error.message);
        // Fallback: mark as failed, but item still exists
        Item.findByIdAndUpdate(item._id, { 
          imageProcessingStatus: 'failed',
          status: 'active' 
        });
      });
      
      // Invalidate cache for this domain
      await this.invalidateCache(email.split('@')[1]);
      
      res.status(201).json({
        success: true,
        item,
        message: 'Item created successfully. Images are being processed.'
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async getItems(req, res) {
    try {
      const { page = 1, limit = 20, search, category } = req.query;
      const { email } = req.user;
      const domain = email.split('@')[1];
      
      // Create cache key
      const cacheKey = `items:${domain}:page:${page}:limit:${limit}:search:${search || ''}:category:${category || ''}`;
      
      // Check cache first
      const cachedItems = await redis.get(cacheKey);
      if (cachedItems) {
        return res.json({
          success: true,
          items: JSON.parse(cachedItems),
          cached: true
        });
      }
      
      // Build query
      const query = {
        emailDomain: domain,
        status: 'active'
      };
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (category) {
        query.category = category;
      }
      
      // Execute query with pagination
      const items = await Item.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(items));
      
      res.json({
        success: true,
        items,
        cached: false
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async imageProcessingComplete(req, res) {
    try {
      const { itemId, images, success } = req.body;
      
      const updateData = {
        imageProcessingStatus: success ? 'completed' : 'failed',
        status: 'active'
      };
      
      if (success && images) {
        updateData.images = images;
      }
      
      await Item.findByIdAndUpdate(itemId, updateData);
      
      // Invalidate cache
      const item = await Item.findById(itemId).select('emailDomain');
      if (item) {
        await this.invalidateCache(item.emailDomain);
      }
      
      res.json({ success: true });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async invalidateCache(domain) {
    const pattern = `items:${domain}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

module.exports = new ItemController();
```

### 4. Image Processing Service (Heavy Lifting)
```javascript
// image-service/src/controllers/imageController.js
const sharp = require('sharp');
const AWS = require('aws-sdk');
const Queue = require('bull');
const axios = require('axios');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Create processing queue
const imageQueue = new Queue('image processing', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
  }
});

class ImageController {
  constructor() {
    this.setupQueue();
  }
  
  setupQueue() {
    // Process jobs with concurrency
    imageQueue.process('optimize', 3, async (job) => {
      return this.processImages(job.data);
    });
    
    // Handle completed jobs
    imageQueue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed:`, result);
    });
    
    // Handle failed jobs
    imageQueue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });
  }
  
  async processRequest(req, res) {
    try {
      const { itemId, callbackUrl } = req.body;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }
      
      // Add job to queue
      const job = await imageQueue.add('optimize', {
        itemId,
        callbackUrl,
        images: files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype
        }))
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      
      res.json({
        success: true,
        jobId: job.id,
        message: 'Images queued for processing'
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async processImages(data) {
    const { itemId, callbackUrl, images } = data;
    const processedImages = [];
    
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Processing image ${i + 1}/${images.length} for item ${itemId}`);
        
        // Generate multiple sizes
        const sizes = [
          { name: 'thumbnail', width: 300, height: 300 },
          { name: 'medium', width: 800, height: 600 },
          { name: 'large', width: 1200, height: 900 }
        ];
        
        const imageVariants = {};
        
        for (const size of sizes) {
          // Optimize image
          const optimizedBuffer = await sharp(Buffer.from(image.buffer))
            .resize(size.width, size.height, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
            .webp({ quality: 85, effort: 4 })
            .toBuffer();
          
          // Upload to S3
          const key = `items/${itemId}/${i}-${size.name}.webp`;
          const uploadResult = await s3.upload({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: optimizedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000' // 1 year cache
          }).promise();
          
          imageVariants[size.name] = uploadResult.Location;
        }
        
        processedImages.push(imageVariants);
        
        console.log(`✅ Processed image ${i + 1}: ${Object.keys(imageVariants).length} variants created`);
      }
      
      // Notify item service
      await axios.post(callbackUrl, {
        itemId,
        images: processedImages,
        success: true
      });
      
      return {
        itemId,
        processedCount: processedImages.length,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to process images for item ${itemId}:`, error);
      
      // Notify item service of failure
      await axios.post(callbackUrl, {
        itemId,
        success: false,
        error: error.message
      }).catch(err => console.error('Failed to notify callback:', err));
      
      throw error;
    }
  }
  
  async getQueueStats(req, res) {
    try {
      const waiting = await imageQueue.getWaiting();
      const active = await imageQueue.getActive();
      const completed = await imageQueue.getCompleted();
      const failed = await imageQueue.getFailed();
      
      res.json({
        queue: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        }
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ImageController();
```

### 5. Chat Service (Real-time)
```javascript
// chat-service/src/socketManager.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const redis = require('./config/redis');

class SocketManager {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from cache or database
        const cachedUser = await redis.get(`user:${decoded.userId}`);
        if (cachedUser) {
          socket.user = JSON.parse(cachedUser);
        } else {
          // Fallback to user service API call
          const userResponse = await axios.get(`${process.env.USER_SERVICE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          socket.user = userResponse.data.user;
        }
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected`);
      
      // Join user to their personal room
      socket.join(`user:${socket.user.id}`);
      
      // Handle joining chat rooms
      socket.on('join-chat', async (data) => {
        const { itemId, sellerId } = data;
        const chatId = this.generateChatId(socket.user.id, sellerId, itemId);
        
        socket.join(chatId);
        
        // Load recent messages
        const messages = await Message.find({ chatId })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('senderId', 'name email')
          .lean();
        
        socket.emit('chat-history', {
          chatId,
          messages: messages.reverse()
        });
      });
      
      // Handle sending messages
      socket.on('send-message', async (data) => {
        try {
          const { chatId, itemId, recipientId, content } = data;
          
          // Create message
          const message = new Message({
            chatId,
            itemId,
            senderId: socket.user.id,
            recipientId,
            content,
            timestamp: new Date()
          });
          
          await message.save();
          await message.populate('senderId', 'name email');
          
          // Send to chat room
          this.io.to(chatId).emit('new-message', message);
          
          // Send notification to recipient
          this.io.to(`user:${recipientId}`).emit('message-notification', {
            chatId,
            itemId,
            sender: socket.user,
            content,
            timestamp: message.timestamp
          });
          
          // Cache unread count
          await redis.incr(`unread:${recipientId}:${chatId}`);
          
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });
      
      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user-typing', {
          userId: socket.user.id,
          name: socket.user.name
        });
      });
      
      socket.on('stop-typing', (data) => {
        socket.to(data.chatId).emit('user-stop-typing', {
          userId: socket.user.id
        });
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected`);
      });
    });
  }
  
  generateChatId(buyerId, sellerId, itemId) {
    const participants = [buyerId, sellerId].sort();
    return `${participants[0]}-${participants[1]}-${itemId}`;
  }
}

module.exports = SocketManager;
```

## 🚀 Deployment Architecture

### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "80:3000"
    environment:
      - USER_SERVICE_URL=http://user-service:3000
      - ITEM_SERVICE_URL=http://item-service:3000
      - CHAT_SERVICE_URL=http://chat-service:3000
      - IMAGE_SERVICE_URL=http://image-service:3000
    depends_on:
      - user-service
      - item-service
      - chat-service
      - image-service
  
  # User Service
  user-service:
    build: ./user-service
    environment:
      - MONGODB_URI=mongodb://mongo:27017/campuszon_users
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
      - redis
  
  # Item Service
  item-service:
    build: ./item-service
    environment:
      - MONGODB_URI=mongodb://mongo:27017/campuszon_items
      - REDIS_URL=redis://redis:6379
      - IMAGE_SERVICE_URL=http://image-service:3000
    depends_on:
      - mongo
      - redis
  
  # Chat Service
  chat-service:
    build: ./chat-service
    environment:
      - MONGODB_URI=mongodb://mongo:27017/campuszon_chats
      - REDIS_URL=redis://redis:6379
      - USER_SERVICE_URL=http://user-service:3000
    depends_on:
      - mongo
      - redis
  
  # Image Processing Service
  image-service:
    build: ./image-service
    environment:
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=${AWS_REGION}
      - S3_BUCKET=${S3_BUCKET}
    depends_on:
      - redis
  
  # Databases
  mongo:
    image: mongo:5
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

## 💰 Cost Estimation for Large Scale

### Cloud Provider Comparison

| Service | AWS | Google Cloud | Azure | Railway |
|---------|-----|--------------|-------|---------|
| **API Gateway** | $3.50/million | $3.00/million | $3.50/million | $20/month |
| **Compute (5 services)** | $50/month | $45/month | $55/month | $100/month |
| **Database (MongoDB)** | $60/month | $50/month | $65/month | $30/month |
| **Redis Cache** | $20/month | $15/month | $25/month | $15/month |
| **Image Storage (S3)** | $25/month | $20/month | $30/month | N/A |
| **Load Balancer** | $20/month | $18/month | $25/month | Included |
| **Total** | **$178/month** | **$148/month** | **$200/month** | **$165/month** |

### Recommended: Railway for Simplicity
```bash
# Deploy all services with one command
railway up

# Auto-scaling, monitoring, and CI/CD included
# Perfect for 10K-100K users
```

## 📊 Performance Expectations

### With Microservices (10K+ Users):
- **API Response Time**: 50-200ms
- **Image Processing**: Non-blocking, 30-60 seconds
- **Chat Messages**: < 100ms latency
- **Database Queries**: 10-50ms (with caching)
- **Concurrent Users**: 1000+ simultaneous
- **Uptime**: 99.9% (multiple service redundancy)

### Scaling Capabilities:
- **Horizontal Scaling**: Each service scales independently
- **Load Distribution**: API Gateway distributes load
- **Fault Tolerance**: One service failure doesn't crash entire app
- **Performance Isolation**: Heavy image processing doesn't affect chat

## 🎯 Implementation Timeline

### Week 1-2: Core Services
- Set up API Gateway
- Extract User Service
- Extract Item Service (without image processing)

### Week 3-4: Advanced Services
- Set up Image Processing Service
- Implement Chat Service
- Add Redis caching

### Week 5-6: Production Deployment
- Docker containerization
- Railway/AWS deployment
- Load testing and optimization

### Week 7-8: Monitoring & Scaling
- Add monitoring (Datadog/New Relic)
- Performance optimization
- Auto-scaling configuration

This architecture will handle 10K-100K users easily and can scale to millions with proper infrastructure! 🚀