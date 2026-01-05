import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getTokenPackages,
  purchaseTokens,
  verifyTokenPurchase,
  getTokenBalance
} from '../controllers/token.controller.js';

const router = express.Router();

// Get all token packages
router.get('/packages', auth, getTokenPackages);

// Purchase token package
router.post('/purchase', auth, purchaseTokens);

// Verify token purchase payment
router.post('/verify', auth, verifyTokenPurchase);

// Get user's token balance and history
router.get('/balance', auth, getTokenBalance);

export default router;
