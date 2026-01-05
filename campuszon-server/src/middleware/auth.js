import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Alias for compatibility with moderation routes
export const authenticateToken = authenticate;

// Admin-only middleware
export const isAdmin = async (req, res, next) => {
  try {
    // Assumes authenticate middleware has already run and set req.user
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, message: 'Error checking admin status' });
  }
};
