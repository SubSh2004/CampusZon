import mongoose from 'mongoose';
import User from '../src/models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOneAndUpdate(
      { email: 'campuszon@gmail.com' },
      { $set: { isAdmin: true } },
      { new: true }
    );
    
    if (user) {
      console.log('✅ Admin user updated:', user.email);
      console.log('Admin status:', user.isAdmin);
    } else {
      console.log('❌ User not found with email: campuszon@gmail.com');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

makeAdmin();
