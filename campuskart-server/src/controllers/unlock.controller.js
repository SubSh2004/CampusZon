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
      tier: unlock?.tier || null,
      messagesUsed: unlock?.messageCount || 0,
      messageLimit: unlock?.messageLimit || 0,
      freeCredits: user?.freeUnlockCredits || 0
    });
  } catch (error) {
    console.error('Check unlock status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unlock basic tier (₹10 or free credit)
export const unlockBasic = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { useFreeCredit } = req.body;
    const userId = req.user.id;

    // Check if already unlocked
    const existingUnlock = await Unlock.findOne({ userId, itemId, active: true });
    if (existingUnlock) {
      return res.status(400).json({ message: 'Item already unlocked' });
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

    // Use free credit if requested and available
    if (useFreeCredit && user.freeUnlockCredits > 0) {
      const unlock = new Unlock({
        userId,
        itemId,
        sellerId: item.userId,
        tier: 'basic',
        amount: 0,
        isFreeCredit: true,
        messageLimit: 20
      });

      await unlock.save();

      // Decrement free credits
      user.freeUnlockCredits -= 1;
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
        const autoMessage = `Hi! I'm interested in buying your "${item.title}" listed for ₹${item.price}. Please let me know if it's still available.`;
        
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
        message: 'Unlocked with free credit!',
        unlock,
        remainingCredits: user.freeUnlockCredits,
        sellerInfo: {
          name: item.userName,
          hostel: item.userHostel,
          email: null,
          phone: null
        }
      });
    }

    // If no free credit, need to create payment order
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please use free credit or contact admin.' 
      });
    }

    // Create Razorpay order
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: 1000, // ₹10 in paise
      currency: 'INR',
      receipt: `unlock_basic_${itemId}_${userId}_${Date.now()}`,
      notes: {
        itemId: itemId.toString(),
        userId,
        tier: 'basic',
        itemTitle: item.title
      }
    });

    // Create payment record
    const payment = new Payment({
      userId,
      itemId,
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
    console.error('Unlock basic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unlock premium tier (₹25)
export const unlockPremium = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.userId === userId) {
      return res.status(400).json({ message: 'Cannot unlock your own item' });
    }

    // Check if already unlocked at premium level
    const existingUnlock = await Unlock.findOne({ 
      userId, 
      itemId, 
      tier: 'premium',
      active: true 
    });
    
    if (existingUnlock) {
      return res.status(400).json({ message: 'Item already unlocked at premium level' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Contact admin.' 
      });
    }

    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Check if upgrading from basic
    const basicUnlock = await Unlock.findOne({ 
      userId, 
      itemId, 
      tier: 'basic',
      active: true 
    });

    const amount = basicUnlock ? 1500 : 2500; // ₹15 upgrade or ₹25 full

    const order = await razorpay.orders.create({
      amount, // in paise
      currency: 'INR',
      receipt: `unlock_premium_${itemId}_${userId}_${Date.now()}`,
      notes: {
        itemId: itemId.toString(),
        userId,
        tier: 'premium',
        isUpgrade: !!basicUnlock,
        itemTitle: item.title
      }
    });

    const payment = new Payment({
      userId,
      itemId,
      type: 'unlock_premium',
      amount: amount / 100,
      razorpayOrderId: order.id,
      status: 'pending',
      metadata: {
        tier: 'premium',
        isUpgrade: !!basicUnlock,
        sellerName: item.userName,
        itemTitle: item.title
      }
    });

    await payment.save();

    res.json({
      success: true,
      requiresPayment: true,
      order,
      payment: payment._id,
      isUpgrade: !!basicUnlock,
      amount: amount / 100
    });

  } catch (error) {
    console.error('Unlock premium error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify payment and complete unlock
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    await payment.save();

    // Create unlock
    const item = await Item.findById(payment.itemId);
    const tier = payment.metadata.tier;

    // If upgrading from basic to premium, deactivate basic unlock
    if (tier === 'premium') {
      await Unlock.updateOne(
        { userId: payment.userId, itemId: payment.itemId, tier: 'basic' },
        { active: false }
      );
    }

    const unlock = new Unlock({
      userId: payment.userId,
      itemId: payment.itemId,
      sellerId: item.userId,
      tier,
      amount: payment.amount,
      paymentId: razorpay_payment_id,
      messageLimit: tier === 'basic' ? 20 : 999999 // Unlimited for premium
    });

    await unlock.save();

    // Update user stats
    await User.findByIdAndUpdate(payment.userId, {
      $inc: { totalUnlocks: 1, totalSpent: payment.amount }
    });

    // Update item analytics
    item.unlockCount += 1;
    item.totalRevenue += payment.amount;
    await item.save();

    // Return seller info based on tier
    const sellerInfo = {
      name: item.userName,
      hostel: item.userHostel,
      email: tier === 'premium' ? item.userEmail : null,
      phone: tier === 'premium' ? item.userPhone : null,
      rating: 0, // TODO: Implement rating system
      verifiedSeller: false
    };

    res.json({
      success: true,
      message: 'Payment verified and unlock completed!',
      unlock,
      sellerInfo
    });

  } catch (error) {
    console.error('Verify payment error:', error);
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
        tier: unlock.tier,
        unlockedAt: unlock.createdAt,
        messageCount: unlock.messageCount,
        isFreeCredit: unlock.isFreeCredit
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
        tier: unlock.tier,
        amount: unlock.amount,
        isFreeCredit: unlock.isFreeCredit,
        unlockedAt: unlock.createdAt,
        messageCount: unlock.messageCount,
        messageLimit: unlock.messageLimit,
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
      freeCredits: user?.freeUnlockCredits || 0,
      totalUnlocks: user?.totalUnlocks || 0,
      totalSpent: user?.totalSpent || 0
    });

  } catch (error) {
    console.error('Get user unlocks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment message count for basic tier
export const incrementMessageCount = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const unlock = await Unlock.findOne({ 
      userId, 
      itemId, 
      tier: 'basic',
      active: true 
    });

    if (!unlock) {
      return res.status(404).json({ message: 'No active basic unlock found' });
    }

    unlock.messageCount += 1;
    await unlock.save();

    const canSendMore = unlock.messageCount < unlock.messageLimit;

    res.json({
      success: true,
      messageCount: unlock.messageCount,
      messageLimit: unlock.messageLimit,
      canSendMore,
      needsUpgrade: !canSendMore
    });

  } catch (error) {
    console.error('Increment message count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
