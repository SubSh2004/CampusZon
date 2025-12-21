/**
 * Moderation Routes
 * API endpoints for image moderation and admin dashboard
 */

import express from 'express';
import {
  getPendingReviews,
  getModerationDetails,
  approveImage,
  rejectImage,
  reportImage,
  getModerationStats,
  getBlurredPreview,
  getAuditLogs
} from '../controllers/moderation.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
// TODO: Implement proper admin role checking
const requireAdmin = (req, res, next) => {
  // For now, check if user has admin flag
  // In production, implement proper role-based access control
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Admin routes
router.get('/pending', authenticateToken, requireAdmin, getPendingReviews);
router.get('/stats', authenticateToken, requireAdmin, getModerationStats);
router.get('/audit-logs', authenticateToken, requireAdmin, getAuditLogs);
router.get('/:imageId', authenticateToken, requireAdmin, getModerationDetails);
router.get('/:imageId/preview', authenticateToken, requireAdmin, getBlurredPreview);
router.post('/:imageId/approve', authenticateToken, requireAdmin, approveImage);
router.post('/:imageId/reject', authenticateToken, requireAdmin, rejectImage);

// User routes (reporting)
router.post('/report/:itemId', authenticateToken, reportImage);

export default router;
