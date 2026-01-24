import Booking from '../models/booking.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import Notification from '../models/notification.model.js';
import { emitNotification } from '../index.js';

// Create a booking request
export const createBooking = async (req, res) => {
  try {
    const { itemId, itemTitle, itemPrice, sellerId, sellerName, message, itemCategory } = req.body;
    const buyerId = req.user._id.toString();
    const buyerName = req.user.username;
    const buyerEmail = req.user.email;
    const buyerPhone = req.user.phoneNumber;

    // Enhanced validation with debugging
    console.log('Booking request body:', JSON.stringify(req.body, null, 2));
    console.log('User data:', { buyerId, buyerName, buyerEmail, buyerPhone });

    // Validate required fields
    if (!itemId || itemId === 'undefined' || itemId === 'null') {
      console.error('❌ Missing or invalid itemId in booking request:', itemId);
      console.error('Full request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Item ID is required for booking. Please provide a valid item ID.',
        debug: { 
          receivedItemId: itemId,
          receivedBody: req.body,
          expectedFormat: 'MongoDB ObjectId (24-character hex string)'
        }
      });
    }

    if (!itemTitle || itemPrice === undefined || itemPrice === null || !sellerId || !sellerName) {
      console.error('❌ Missing required booking fields:', { 
        itemId: !!itemId, 
        itemTitle: !!itemTitle, 
        itemPrice: itemPrice !== undefined && itemPrice !== null, 
        sellerId: !!sellerId, 
        sellerName: !!sellerName 
      });
      console.error('Received values:', { itemTitle, itemPrice, sellerId, sellerName });
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information',
        debug: { 
          hasItemId: !!itemId, 
          hasItemTitle: !!itemTitle, 
          hasItemPrice: itemPrice !== undefined && itemPrice !== null, 
          hasSellerId: !!sellerId, 
          hasSellerName: !!sellerName,
          received: { itemTitle, itemPrice, sellerId, sellerName }
        }
      });
    }

    // Validate MongoDB ObjectId format for itemId (24-character hex string)
    if (!itemId || !itemId.match || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
        debug: { itemId, expected: '24-character hex string (MongoDB ObjectId)' }
      });
    }

    // Check if user already has a pending booking for this item
    const existingBooking = await Booking.findOne({
      itemId,
      buyerId,
      status: 'pending'
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending booking for this item'
      });
    }

    const booking = await Booking.create({
      itemId,
      itemTitle,
      itemPrice,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      sellerId,
      sellerName,
      message,
      status: 'pending'
    });

    // Create or find chat between buyer and seller
    let chat = await Chat.findOne({
      participants: { $all: [buyerId, sellerId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [buyerId, sellerId],
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: new Map()
      });
    }

    // Create simplified booking notification message
    const bookingMessage = `📦 You have a booking request for "${itemTitle}"\n\nCheck your Bookings section to see buyer details.`;

    const newMessage = await Message.create({
      chatId: chat._id,
      senderId: buyerId,
      senderName: buyerName,
      receiverId: sellerId,
      message: bookingMessage
    });

    // Update chat with latest message
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: bookingMessage,
      lastMessageTime: new Date(),
      $inc: { [`unreadCount.${sellerId}`]: 1 }
    });

    // Send real-time notification to seller about new booking
    try {
      const Notification = (await import('../models/notification.model.js')).default;
      const notification = await Notification.create({
        userId: sellerId,
        type: 'BOOKING',
        title: '📦 New Booking Request!',
        message: `You have a new booking request for "${itemTitle}" from ${buyerName}.`,
        itemId: itemId,
        read: false
      });

      console.log(`✅ Notification created for seller ${sellerId}:`, notification._id);

      // Send real-time notification update
      emitNotification(sellerId, notification);
    } catch (err) {
      console.error('❌ Error creating booking notification for seller:', err);
    }

    // Return booking with chat info. Frontend no longer needs to emit sendPrivateMessage when autoMessage present.
    res.json({ 
      success: true, 
      booking, 
      chatId: chat._id,
      message: 'Booking request sent successfully!',
      autoMessage: {
        ...newMessage.toObject(),
        chatId: chat._id
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
};

// Get bookings for seller (incoming requests)
export const getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();

    const bookings = await Booking.find({ 
      sellerId,
      status: { $ne: 'rejected' } // Exclude rejected bookings
    })
      .populate('buyerId', 'username email phoneNumber hostelName')
      .populate('itemId', 'title price imageUrl imageUrls category')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching seller bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// Get bookings for buyer (sent requests)
export const getBuyerBookings = async (req, res) => {
  try {
    const buyerId = req.user._id.toString();

    const bookings = await Booking.find({ buyerId })
      .populate('itemId', 'title price imageUrl imageUrls category')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching buyer bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionNote } = req.body;
    const userId = req.user._id.toString();

    const booking = await Booking.findById(bookingId)
      .populate('buyerId', 'username')
      .populate('itemId', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only seller can accept/reject
    if (booking.sellerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // 🔒 IDEMPOTENCY CHECK: Prevent duplicate processing
    if (booking.status !== 'pending') {
      console.log(`⚠️ Booking ${bookingId} already processed. Current status: ${booking.status}`);
      return res.status(400).json({ 
        success: false, 
        message: `This booking has already been ${booking.status}. Cannot process again.`,
        currentStatus: booking.status
      });
    }

    // Validate status transition
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be "accepted" or "rejected".' 
      });
    }

    // Update status BEFORE any side effects
    booking.status = status;
    
    // Find or create chat between buyer and seller
    let chat = await Chat.findOne({
      participants: { $all: [booking.buyerId, booking.sellerId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [booking.buyerId, booking.sellerId],
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: new Map()
      });
    }
    
    // Handle acceptance
    if (status === 'accepted') {
      // Mark item as unavailable in MongoDB
      try {
        // Check if itemId is valid (populate may have failed for old invalid bookings)
        if (!booking.itemId) {
          console.warn(`⚠️ Cannot mark item as unavailable - itemId is invalid or missing for booking ${bookingId}`);
        } else {
          const Item = (await import('../models/item.mongo.model.js')).default;
          // Extract the actual item ID - handle populated objects correctly
          const actualItemId = booking.itemId._id 
            ? booking.itemId._id.toString() 
            : booking.itemId.toString();
          
          console.log(`🔍 Attempting to mark item as unavailable. ItemId:`, actualItemId);
          
          const updateResult = await Item.findByIdAndUpdate(
            actualItemId,
            { available: false },
            { new: true }
          );
          
          if (updateResult) {
            console.log(`✅ Item ${actualItemId} marked as unavailable. Title: "${updateResult.title}"`);
          } else {
            console.error(`❌ Item ${actualItemId} not found in MongoDB`);
          }
        }
      } catch (err) {
        console.error('❌ Error updating item availability:', err);
        console.error('Error details:', err.message);
      }

      // Send chat message to buyer
      try {
        const acceptMessage = await Message.create({
          chatId: chat._id,
          senderId: booking.sellerId,
          senderName: booking.sellerName,
          receiverId: booking.buyerId,
          message: `✅ Your booking for "${booking.itemTitle}" has been accepted! The seller will contact you soon.`
        });

        // Update chat with latest message
        await Chat.findByIdAndUpdate(chat._id, {
          lastMessage: `✅ Booking accepted for "${booking.itemTitle}"`,
          lastMessageTime: new Date(),
          $inc: { [`unreadCount.${booking.buyerId}`]: 1 }
        });

        console.log(`✅ Acceptance message sent to buyer ${booking.buyerId}`);
      } catch (err) {
        console.error('❌ Error creating acceptance message:', err);
      }

      // Create notification for buyer
      try {
        // Handle case where itemId populate failed (invalid ObjectId)
        let notificationItemId = null;
        if (booking.itemId) {
          notificationItemId = booking.itemId._id 
            ? booking.itemId._id 
            : booking.itemId;
        }
        
        const buyerIdStr = booking.buyerId._id ? booking.buyerId._id.toString() : booking.buyerId.toString();
        
        const notification = await Notification.create({
          userId: buyerIdStr,
          type: 'BOOKING',
          title: '🎉 Booking Accepted!',
          message: `Your booking request for "${booking.itemTitle}" has been accepted by the seller. Check your chats to coordinate!`,
          itemId: notificationItemId,
          read: false
        });

        console.log(`✅ Notification created for buyer ${booking.buyerId}:`, notification._id);

        // Send real-time notification update
        emitNotification(buyerIdStr, notification);
      } catch (err) {
        console.error('❌ Error creating acceptance notification:', err);
      }
    }
    
    // Handle rejection
    if (status === 'rejected') {
      booking.rejectionNote = rejectionNote || 'No reason provided';
      
      // Refund 0.5 tokens to buyer if they unlocked the item
      try {
        const buyerIdStr = booking.buyerId._id ? booking.buyerId._id.toString() : booking.buyerId.toString();
        const User = (await import('../models/user.model.js')).default;
        const Unlock = (await import('../models/unlock.model.js')).default;
        
        // Check if buyer unlocked the item
        const unlock = await Unlock.findOne({
          userId: buyerIdStr,
          itemId: booking.itemId,
          active: true
        });

        if (unlock) {
          // Refund 0.5 tokens
          await User.findByIdAndUpdate(buyerIdStr, {
            $inc: { unlockTokens: 0.5 }
          });
          console.log(`✅ Refunded 0.5 tokens to buyer ${buyerIdStr} for rejected booking`);
        }
      } catch (refundError) {
        console.error('❌ Error processing token refund:', refundError);
      }
      
      // Send chat message to buyer
      const rejectMessage = await Message.create({
        chatId: chat._id,
        senderId: booking.sellerId,
        senderName: booking.sellerName,
        receiverId: booking.buyerId,
        message: `❌ Your booking for "${booking.itemTitle}" was cancelled.\n\nReason: ${rejectionNote || 'No reason provided'}\n\n💰 You have received a 0.5 token refund. The item remains unlocked for you.`
      });

      // Update chat with latest message
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: `❌ Booking cancelled for "${booking.itemTitle}"`,
        lastMessageTime: new Date(),
        $inc: { [`unreadCount.${booking.buyerId}`]: 1 }
      });

      // Create notification for buyer
      try {
        // Handle case where itemId populate failed (invalid ObjectId)
        let notificationItemId = null;
        if (booking.itemId) {
          notificationItemId = booking.itemId._id 
            ? booking.itemId._id 
            : booking.itemId;
        }
        
        const buyerIdStr = booking.buyerId._id ? booking.buyerId._id.toString() : booking.buyerId.toString();
        
        const notification = await Notification.create({
          userId: buyerIdStr,
          type: 'BOOKING',
          title: '❌ Booking Rejected',
          message: `Your booking request for "${booking.itemTitle}" was rejected. You received a 0.5 token refund. Reason: ${rejectionNote || 'No reason provided'}`,
          itemId: notificationItemId,
          read: false
        });

        console.log(`✅ Rejection notification created for buyer ${booking.buyerId}:`, notification._id);

        // Send real-time notification update
        emitNotification(buyerIdStr, notification);
      } catch (err) {
        console.error('❌ Error creating rejection notification:', err);
      }
    }
    
    await booking.save();

    res.json({ success: true, booking, message: `Booking ${status} successfully` });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
};

// Mark booking as read
export const markBookingAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;

    await Booking.findByIdAndUpdate(bookingId, { read: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking booking as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

// Get unread booking count
export const getUnreadBookingCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const unreadCount = await Booking.countDocuments({
      sellerId: userId,
      read: false,
      status: 'pending'
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread booking count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

// Delete/Cancel booking (buyer only)
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id.toString();

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only buyer can cancel their own booking
    const buyerIdStr = booking.buyerId._id ? booking.buyerId._id.toString() : booking.buyerId.toString();
    if (buyerIdStr !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Allow cancellation of pending and rejected bookings only
    if (booking.status !== 'pending' && booking.status !== 'rejected') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete ${booking.status} booking` 
      });
    }

    // Refund 0.5 tokens to buyer if they unlocked the item (only for pending bookings)
    if (booking.status === 'pending') {
      try {
        const User = (await import('../models/user.model.js')).default;
        const Unlock = (await import('../models/unlock.model.js')).default;
        
        // Check if buyer unlocked the item
        const unlock = await Unlock.findOne({
          userId: buyerIdStr,
          itemId: booking.itemId,
          active: true
        });

        if (unlock) {
          // Refund 0.5 tokens
          await User.findByIdAndUpdate(buyerIdStr, {
            $inc: { unlockTokens: 0.5 }
          });
          console.log(`✅ Refunded 0.5 tokens to buyer ${buyerIdStr} for cancelled booking`);
        }
      } catch (refundError) {
        console.error('❌ Error processing token refund on cancellation:', refundError);
      }
    }

    await Booking.findByIdAndDelete(bookingId);

    res.json({ success: true, message: 'Booking deleted successfully. 0.5 tokens have been refunded.' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};
