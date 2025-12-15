import Chat from './models/chat.model.js';
import Message from './models/message.model.js';

// Module-scoped references so other controllers can emit events through sockets
let ioRef = null;
const userSockets = new Map(); // userId -> socketId

export const setupSocketManager = (io) => {
  ioRef = io;

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User joins with their userId
    socket.on('userJoin', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Join a specific room (for general chat)
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('userJoined', {
        userId: socket.id,
        message: `User ${socket.id} has joined the room`,
      });
    });

    // Send message to a specific room (general chat)
    socket.on('sendMessage', (data) => {
      console.log(`Message from ${socket.id} to room ${data.roomId}:`, data.message);
      
      // Emit message to all users in the room
      io.to(data.roomId).emit('receiveMessage', data.message);
    });

    // Private message between two users
    socket.on('sendPrivateMessage', async (data) => {
      try {
        const { chatId, receiverId, message, senderId, senderName } = data;
        console.log('💬 Message received - sender:', senderId, 'receiver:', receiverId);

        // Find unlock between these two users (check both directions)
        const Unlock = (await import('./models/unlock.model.js')).default;
        
        let unlock = await Unlock.findOne({
          userId: senderId,
          active: true
        }).populate({
          path: 'itemId',
          match: { sellerId: receiverId }
        });

        // If not found, check if receiver unlocked sender's item
        if (!unlock || !unlock.itemId) {
          unlock = await Unlock.findOne({
            userId: receiverId,
            active: true
          }).populate({
            path: 'itemId',
            match: { sellerId: senderId }
          });
        }

        // Check COMBINED message limit for basic tier
        if (unlock && unlock.itemId && unlock.tier === 'basic') {
          console.log('🔍 Checking limits - Count:', unlock.messageCount, '/', unlock.messageLimit);
          
          const totalMessages = unlock.messageCount;
          
          if (totalMessages >= unlock.messageLimit) {
            console.log('❌ Limit reached!');
            socket.emit('messageError', {
              message: `Combined message limit reached (${unlock.messageLimit} total). Upgrade to Premium for unlimited messages.`,
              requiresUpgrade: true,
              messageLimit: unlock.messageLimit
            });
            return;
          }

          // Increment combined message count
          unlock.messageCount += 1;
          await unlock.save();
          console.log(`📊 Updated count: ${unlock.messageCount}/${unlock.messageLimit}`);
        } else {
          console.log('✨ No basic unlock found - unlimited messages');
        }

        // Save message to database
        const newMessage = await Message.create({
          chatId,
          senderId,
          senderName,
          receiverId,
          message
        });

        // Update chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message,
          lastMessageTime: new Date(),
          $inc: { [`unreadCount.${receiverId}`]: 1 }
        });

        // Emit to receiver if online
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId && ioRef) {
          ioRef.to(receiverSocketId).emit('newPrivateMessage', {
            ...newMessage.toObject(),
            chatId
          });
        }

        // Emit back to sender as confirmation
        socket.emit('messageSent', newMessage);
      } catch (error) {
        console.error('Error sending private message:', error);
        socket.emit('messageError', { message: 'Failed to send message' });
      }
    });

    // Booking notification
    socket.on('sendBookingRequest', (data) => {
      const { sellerId, booking } = data;
      
      // Send notification to seller if online
      const sellerSocketId = userSockets.get(sellerId);
      if (sellerSocketId && ioRef) {
        ioRef.to(sellerSocketId).emit('newBookingRequest', booking);
      }
    });

    // Booking status update notification
    socket.on('bookingStatusUpdate', (data) => {
      const { buyerId, booking } = data;
      
      // Send notification to buyer if online
      const buyerSocketId = userSockets.get(buyerId);
      if (buyerSocketId) {
        io.to(buyerSocketId).emit('bookingStatusChanged', booking);
      }
    });

    // Message deleted (unsend)
    socket.on('deleteMessage', (data) => {
      const { messageId, receiverId, chatId } = data;
      
      // Notify receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId && ioRef) {
        ioRef.to(receiverSocketId).emit('messageDeleted', { messageId, chatId });
      }
    });

    // Conversation deleted
    socket.on('deleteConversation', (data) => {
      const { chatId, otherUserId } = data;
      
      // Notify other user if online
      const otherSocketId = userSockets.get(otherUserId);
      if (otherSocketId && ioRef) {
        ioRef.to(otherSocketId).emit('conversationDeleted', { chatId });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from map
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log('User disconnected:', socket.id);
    });
  });
};

// Helper to emit events to a specific user from other server-side controllers
export const sendToUser = (userId, event, payload) => {
  try {
    const socketId = userSockets.get(userId);
    if (!socketId || !ioRef) return false;
    ioRef.to(socketId).emit(event, payload);
    return true;
  } catch (err) {
    console.error('Error in sendToUser:', err);
    return false;
  }
};
