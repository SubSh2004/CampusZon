import express from 'express';
import { createItem, getAllItems, getItemById, updateItem, deleteItem } from '../controllers/item.controller.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// POST /api/items/add - Create a new item with image upload (up to 5 images)
router.post('/add', upload.array('images', 5), createItem);

// GET /api/items - Get all items
router.get('/', getAllItems);

// GET /api/items/:id - Get item by ID
router.get('/:id', getItemById);

// PUT /api/items/:id - Update item by ID
router.put('/:id', updateItem);

// DELETE /api/items/:id - Delete item by ID
router.delete('/:id', deleteItem);

export default router;
