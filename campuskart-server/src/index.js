import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports that might use them
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport, { configurePassport } from './config/passport.js';
import { connectMongoDB } from './db/mongo.js';
import userRoutes from './routes/user.routes.js';
import itemRoutes from './routes/item.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import unlockRoutes from './routes/unlock.routes.js';
import moderationRoutes from './routes/moderation.routes.js';

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'https://campus-kart-navy.vercel.app', // Old domain (kept for transition)
  'https://campus-zon-navy.vercel.app', // New CampusZon domain
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
app.use('/api/moderation', moderationRoutes);

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
