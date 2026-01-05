import Unlock from '../models/unlock.model.js';
import Payment from '../models/payment.model.js';
import Item from '../models/item.mongo.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import crypto from 'crypto';

// Express interest in an item (FREE, anonymous)
export const expressInterest = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user already expressed interest
    const alreadyInterested = item.interestedUsers.some(
      u => u.userId === userId
    );

    if (alreadyInterested) {
      return res.status(400).json({ message: 'You already expressed interest' });
    }

    // Add to interested users (anonymous to seller)
    item.interestedUsers.push({
      userId,
      userName: req.user.username
    });

    await item.save();

    res.json({ 
      success: true, 
      message: 'Interest registered! Seller will be notified.',
      interestedCount: item.interestedUsers.length
    });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check unlock status for an item
export const checkUnlockStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const unlock = await Unlock.findOne({ userId, itemId, active: true });
    
    const user = await User.findById(userId);

    res.json({
      unlocked: !!unlock,
      unlockTokens: user?.unlockTokens || 0
    });
  } catch (error) {
    console.error('Check unlock status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unlock item with token
export const unlockItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Check if already unlocked
    const existingUnlock = await Unlock.findOne({ userId, itemId, active: true });
    if (existingUnlock) {
      const item = await Item.findById(itemId);
      return res.json({
        success: true,
        message: 'Item already unlocked',
        sellerInfo: {
          name: item.userName,
          hostel: item.userHostel,
          room: item.userRoom || 'Not specified',
          email: item.userEmail || null,
          phone: item.userPhoneNumber || null
        }
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Don't allow unlocking own items
    if (item.userId === userId) {
      return res.status(400).json({ message: 'Cannot unlock your own item' });
    }

    const user = await User.findById(userId);

    // Check if user has tokens
    if (!user.unlockTokens || user.unlockTokens < 1) {
      return res.status(400).json({ 
        message: 'Insufficient tokens. Please purchase tokens to unlock.',
        unlockTokens: user.unlockTokens || 0
      });
    }

    // Create unlock record
    const wasFree = user.unlockTokens <= 2 && user.totalUnlocks === 0; // Track if using initial free tokens
    
    const unlock = new Unlock({
      userId,
      itemId,
      sellerId: item.userId,
      tokensUsed: 1,
      wasFreeToken: wasFree
    });

    await unlock.save();

    // Deduct token
    user.unlockTokens -= 1;
    user.totalUnlocks += 1;
    await user.save();

    // Update item analytics
    item.unlockCount += 1;
    await item.save();

    // Auto-send purchase interest message to seller
    try {
      // Find or create chat between buyer and seller
      let chat = await Chat.findOne({
        participants: { $all: [userId, item.userId] }
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [userId, item.userId],
          unreadCount: { [userId]: 0, [item.userId]: 0 }
        });
      }

      // Send auto-message
      const itemCategory = item.category ? item.category.toLowerCase() : '';
      const action = itemCategory.includes('rent') ? 'rent' : 'buy';
      const autoMessage = `Hi! I want to ${action} your "${item.title}" of price ₹${item.price}. Please let me know if it's still available.`;
      
      await Message.create({
        chatId: chat._id,
        senderId: userId,
        senderName: user.username,
        receiverId: item.userId,
        message: autoMessage
      });

      // Update chat with last message
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: autoMessage,
        lastMessageTime: new Date(),
        $inc: { [`unreadCount.${item.userId}`]: 1 }
      });
    } catch (msgError) {
      console.error('Error sending auto-message:', msgError);
      // Don't fail the unlock if message fails
    }

    return res.json({
      success: true,
      message: 'Item unlocked successfully!',
      unlock,
      remainingTokens: user.unlockTokens,
      sellerInfo: {
        name: item.userName,
        hostel: item.userHostel,
        room: item.userRoom || 'Not specified',
        email: item.userEmail || null,
        phone: item.userPhoneNumber || null
      }
    });
  } catch (error) {
    console.error('Unlock item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
      type: 'unlock_basic',
      amount: 10,
      razorpayOrderId: order.id,
      status: 'pending',
      metadata: {
        tier: 'basic',
        sellerName: item.userName,
        itemTitle: item.title
      }
    });

    await payment.save();

    res.json({
      success: true,
      requiresPayment: true,
      order,
      payment: payment._id
    });

  } catch (error) {
    console.error('Unlock item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get seller's interested buyers (for seller view)
export const getInterestedBuyers = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only seller can view interested buyers
    if (item.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all unlocks for this item
    const unlocks = await Unlock.find({ itemId, active: true })
      .sort({ createdAt: -1 });

    const buyersInfo = await Promise.all(unlocks.map(async (unlock) => {
      const buyer = await User.findById(unlock.userId);
      return {
        unlockId: unlock._id,
        buyerName: buyer?.username || 'Unknown',
        buyerHostel: buyer?.hostelName || 'Unknown',
        tokensUsed: unlock.tokensUsed,
        unlockedAt: unlock.createdAt,
        wasFreeToken: unlock.wasFreeToken
      };
    }));

    res.json({
      interestedCount: item.interestedUsers.length,
      anonymousInterested: item.interestedUsers.length - unlocks.length,
      unlockedBuyers: buyersInfo,
      totalRevenue: item.totalRevenue
    });

  } catch (error) {
    console.error('Get interested buyers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's unlock history
export const getUserUnlocks = async (req, res) => {
  try {
    const userId = req.user.id;

    const unlocks = await Unlock.find({ userId, active: true })
      .sort({ createdAt: -1 })
      .limit(20);

    const unlocksWithItems = await Promise.all(unlocks.map(async (unlock) => {
      const item = await Item.findById(unlock.itemId);
      return {
        unlockId: unlock._id,
        tokensUsed: unlock.tokensUsed,
        wasFreeToken: unlock.wasFreeToken,
        unlockedAt: unlock.createdAt,
        item: item ? {
          id: item._id,
          title: item.title,
          price: item.price,
          imageUrl: item.imageUrl
        } : null
      };
    }));

    const user = await User.findById(userId);

    res.json({
      unlocks: unlocksWithItems,
      unlockTokens: user?.unlockTokens || 0,
      totalUnlocks: user?.totalUnlocks || 0,
      totalSpent: user?.totalSpent || 0
    });

  } catch (error) {
    console.error('Get user unlocks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
