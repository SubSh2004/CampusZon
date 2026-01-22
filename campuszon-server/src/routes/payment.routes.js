import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getPaymentHistory, downloadPaymentSlip } from '../controllers/payment.controller.js';

const router = express.Router();

// Get user's payment history
router.get('/history', authenticateToken, getPaymentHistory);

// Download payment slip
router.get('/slip/:paymentId', authenticateToken, downloadPaymentSlip);

export default router;
