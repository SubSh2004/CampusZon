import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports that might use them
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport, { configurePassport } from './config/passport.js';
import { connectMongoDB } from './db/mongo.js';
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

// Initialize Express app
const app = express();

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
app.use(express.json());
app.use(express.static('public'));

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

app.set('trust proxy', 1);

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

// Database Connections - Initialize databases before starting server
const initializeServer = async () => {
  await connectMongoDB();
  
  // Start server after databases are initialized
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
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
