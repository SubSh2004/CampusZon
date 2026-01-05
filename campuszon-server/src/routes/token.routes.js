import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getTokenPackages,
  purchaseTokens,
  verifyTokenPurchase,
  getTokenBalance
} from '../controllers/token.controller.js';

const router = express.Router();

// Get all token packages
router.get('/packages', authenticate, getTokenPackages);

// Purchase token package
router.post('/purchase', authenticate, purchaseTokens);

// Verify token purchase payment
router.post('/verify', authenticate, verifyTokenPurchase);

// Get user's token balance and history
router.get('/balance', authenticate, getTokenBalance);

export default router;
