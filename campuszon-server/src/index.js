import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports that might use them
dotenv.config();

// SECURITY: Validate environment variables at startup
import { validateAndExitOnError } from './utils/envValidator.js';
validateAndExitOnError();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport, { configurePassport } from './config/passport.js';
import { connectMongoDB } from './db/mongo.js';
import { connectRedis } from './config/redis.js';
import userRoutes from './routes/user.routes.js';
import itemRoutes from './routes/item.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import unlockRoutes from './routes/unlock.routes.js';
import tokenRoutes from './routes/token.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Trust proxy - Required for rate limiting and security headers behind reverse proxy
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'https://campuszon-navy.vercel.app', // Old Vercel domain
  'https://campus-zon-navy.vercel.app', // CampusZon Vercel domain
  'https://campuszon.tech', // Custom domain
  'https://www.campuszon.tech', // Custom domain with www
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// SECURITY: Helmet.js - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (consider removing in production)
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from any HTTPS source
      connectSrc: ["'self'", ...allowedOrigins], // Allow API calls to allowed origins
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // Prevent iframe embedding
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with external images
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  xssFilter: true, // Enable XSS filter
  noSniff: true, // Prevent MIME type sniffing
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// CORS configuration - Secure and explicit
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins only (removed insecure vercel.app wildcard)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Compression middleware - reduces response size by 70%
app.use(compression());

app.use(express.json());
app.use(express.static('public'));

// SECURITY: NoSQL injection prevention - Sanitize user input
app.use(mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ NoSQL injection attempt detected - Sanitized key: ${key} from IP: ${req.ip}`);
  },
}));

const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUrl) {
  console.error('CRITICAL: MONGODB_URI or MONGO_URI must be defined for sessions.');
  process.exit(1);
}

// Session middleware for Passport
if (!process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not defined. Server cannot start securely.');
  process.exit(1);
}

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7, // 7 days
      autoRemove: 'native'
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 * 1000
    }
  })
);

// Configure and initialize Passport (after env vars are loaded)
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Track user socket connections for notifications
// FIX: Enforce ONE active socket per userId (prevent duplicates)
const userSockets = new Map(); // userId -> { socketId, socket }

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their userId for notifications
  socket.on('userJoin', (userId) => {
    // FIX: Disconnect old socket if user reconnects (prevent duplicates)
    const existingConnection = userSockets.get(userId);
    if (existingConnection) {
      console.log(`🔄 User ${userId} reconnecting - disconnecting old socket ${existingConnection.socketId}`);
      existingConnection.socket.disconnect(true);
      userSockets.delete(userId);
    }
    
    // Register new socket
    userSockets.set(userId, { socketId: socket.id, socket: socket });
    socket.userId = userId;
    console.log(`✅ User ${userId} connected for notifications (socket: ${socket.id})`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`👋 User ${socket.userId} disconnected`);
    }
  });
});

// Export notification helper for controllers
export const emitNotification = (userId, notification) => {
  const connection = userSockets.get(userId);
  if (connection) {
    io.to(connection.socketId).emit('new-notification', notification);
    console.log(`📬 Notification sent to user ${userId}`);
    return true;
  }
  console.log(`⚠️ User ${userId} offline, notification queued`);
  return false;
};

// Database Connections - Initialize databases before starting server
const initializeServer = async () => {
  await connectMongoDB();
  
  // Connect to Redis (optional - app works without it)
  await connectRedis();
  
  // Start server after databases are initialized
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔌 Socket.IO enabled for real-time notifications`);
  });
};

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/unlock', unlockRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CampusZon Server' });
});

// Health check endpoint (keeps Render awake, prevents cold starts)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy and running'
  });
});

// Ping endpoint (alternative health check)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Initialize and start server
initializeServer();
