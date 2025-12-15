import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Unlock from '../models/unlock.model.js';

// Get all users for chat list (excluding current user, same domain only)
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const currentUserEmail = req.user.email;
    const searchQuery = req.query.search || '';
    
    // Extract domain from current user's email
    const currentDomain = currentUserEmail.split('@')[1];
    
    // Build query: same domain, not current user, optional search
    const query = {
      _id: { $ne: currentUserId },
      email: { $regex: `@${currentDomain}$`, $options: 'i' } // Same domain
    };
    
    // Add search filter if provided
    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('username email hostelName phoneNumber')
      .sort({ username: 1 })
      .limit(50); // Limit to 50 results
    
    res.json({ success: true, users, domain: currentDomain });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get or create chat between two users (same domain only)
export const getOrCreateChat = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user._id.toString();
    const currentUserEmail = req.user.email;

    // Get receiver's email
    const receiver = await User.findById(receiverId).select('email');
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if both users are from same domain
    const senderDomain = currentUserEmail.split('@')[1];
    const receiverDomain = receiver.email.split('@')[1];
    
    if (senderDomain !== receiverDomain) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only chat with users from your college' 
      });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    // Create new chat if doesn't exist
    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        unreadCount: { [senderId]: 0, [receiverId]: 0 }
      });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error getting/creating chat:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat' });
  }
};

// Get messages for a chat
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id.toString();

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(100); // Last 100 messages

    // Mark messages as read
    await Message.updateMany(
      { chatId, receiverId: userId, read: false },
      { read: true }
    );

    // Update unread count in chat
    await Chat.findByIdAndUpdate(chatId, {
      [`unreadCount.${userId}`]: 0
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, receiverId, message, itemId } = req.body;
    const senderId = req.user._id.toString();
    const senderName = req.user.username;

    // Check if sender has unlock permission and message limit for basic tier
    if (itemId) {
      const unlock = await Unlock.findOne({
        userId: senderId,
        itemId,
        active: true
      });

      if (!unlock) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must unlock this item to send messages',
          requiresUnlock: true
        });
      }

      // Check message limit for basic tier
      if (unlock.tier === 'basic' && unlock.messageCount >= unlock.messageLimit) {
        return res.status(403).json({
          success: false,
          message: `Message limit reached (${unlock.messageLimit}). Upgrade to Premium for unlimited messages.`,
          requiresUpgrade: true,
          messageLimit: unlock.messageLimit
        });
      }

      // Increment message count for basic tier
      if (unlock.tier === 'basic') {
        unlock.messageCount += 1;
        await unlock.save();
      }
    }

    const newMessage = await Message.create({
      chatId,
      senderId,
      senderName,
      receiverId,
      message
    });

    // Update chat with last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message,
      lastMessageTime: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 }
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const chats = await Chat.find({
      participants: userId
    }).sort({ lastMessageTime: -1 });

    // Get other participant details for each chat
    const chatsWithUsers = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.participants.find(id => id.toString() !== userId);
        if (!otherUserId) {
          console.error('No other user found for chat:', chat._id);
          return null;
        }
        
        const otherUser = await User.findById(otherUserId).select('username email hostel phoneNumber');
        
        if (!otherUser) {
          console.error('Other user not found:', otherUserId);
          return null;
        }
        
        return {
          ...chat.toObject(),
          otherUser,
          unreadCount: chat.unreadCount?.get(userId) || 0
        };
      })
    );

    // Filter out null chats
    const validChats = chatsWithUsers.filter(chat => chat !== null);

    res.json({ success: true, chats: validChats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

// Delete message (unsend for everyone)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only sender can unsend
    if (message.senderId !== userId) {
      return res.status(403).json({ success: false, message: 'You can only unsend your own messages' });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // Update chat's last message if this was the last message
    const chat = await Chat.findById(message.chatId);
    if (chat) {
      const lastMsg = await Message.findOne({ chatId: message.chatId })
        .sort({ createdAt: -1 });
      
      if (lastMsg) {
        chat.lastMessage = lastMsg.message;
        chat.lastMessageTime = lastMsg.createdAt;
      } else {
        chat.lastMessage = '';
        chat.lastMessageTime = new Date();
      }
      await chat.save();
    }

    res.json({ 
      success: true, 
      messageId,
      chatId: message.chatId,
      receiverId: message.receiverId 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

// Delete entire conversation
export const deleteConversation = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id.toString();

    // Find chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete chat and all messages
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ 
      success: true, 
      chatId,
      otherUserId: chat.participants.find(id => id !== userId)
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
};
