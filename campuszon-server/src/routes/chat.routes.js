import express from 'express';
import {
  getUsers,
  getOrCreateChat,
  getMessages,
  sendMessage,
  getUserChats,
  getUnreadCount,
  deleteMessage,
  deleteConversation
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/users', getUsers);
router.get('/chats', getUserChats);
router.get('/chat/:receiverId', getOrCreateChat);
router.get('/messages/:chatId', getMessages);
router.post('/message', sendMessage);
router.get('/unread-count', getUnreadCount);
router.delete('/message/:messageId', deleteMessage);
router.delete('/chat/:chatId', deleteConversation);

export default router;
