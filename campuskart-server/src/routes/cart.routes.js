import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller.js';

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, getCart);

// Add item to cart
router.post('/add', authenticateToken, addToCart);

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, removeFromCart);

// Clear cart
router.delete('/clear', authenticateToken, clearCart);

export default router;
