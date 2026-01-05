import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';
import Chat from '../src/models/chat.model.js';
import Message from '../src/models/message.model.js';
import OTP from '../src/models/otp.model.js';
import Booking from '../src/models/booking.model.js';

// Load environment variables
dotenv.config();

const clearUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all related data
    const usersResult = await User.deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);

    const chatsResult = await Chat.deleteMany({});
    console.log(`✅ Deleted ${chatsResult.deletedCount} chats`);

    const messagesResult = await Message.deleteMany({});
    console.log(`✅ Deleted ${messagesResult.deletedCount} messages`);

    const otpResult = await OTP.deleteMany({});
    console.log(`✅ Deleted ${otpResult.deletedCount} OTP records`);

    const bookingsResult = await Booking.deleteMany({});
    console.log(`✅ Deleted ${bookingsResult.deletedCount} bookings`);

    console.log('\n🎉 All user data cleared! Users must sign up again.');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearUsers();
