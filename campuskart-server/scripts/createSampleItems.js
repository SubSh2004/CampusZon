import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import { connectMongoDB } from '../src/db/mongo.js';

dotenv.config();

const createSampleItems = async () => {
  try {
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing items first
    await Item.deleteMany({});
    console.log('🗑️  Cleared existing items');

    // Create sample items with proper data
    const sampleItems = [
      {
        title: "JavaScript: The Good Parts Book",
        description: "Well-maintained programming book, perfect for learning JavaScript fundamentals.",
        price: 25.99,
        category: "Books",
        imageUrl: "https://i.ibb.co/sample1.jpg",
        available: true,
        userId: "sample_user_001",
        userName: "John Doe",
        userPhone: "+91 9876543210",
        userHostel: "Hostel A",
        userEmail: "john@university.edu",
        emailDomain: "university.edu"
      },
      {
        title: "Gaming Laptop - Dell Inspiron",
        description: "High-performance laptop suitable for gaming and programming. 8GB RAM, GTX 1650.",
        price: 450.00,
        category: "Electronics",
        imageUrl: "https://i.ibb.co/sample2.jpg",
        available: true,
        userId: "sample_user_002", 
        userName: "Jane Smith",
        userPhone: "+91 8765432109",
        userHostel: "Hostel B",
        userEmail: "jane@university.edu",
        emailDomain: "university.edu"
      },
      {
        title: "Study Desk - Wooden",
        description: "Spacious wooden study desk in excellent condition. Perfect for dorm room.",
        price: 75.50,
        category: "Furniture",
        imageUrl: "https://i.ibb.co/sample3.jpg",
        available: true,
        userId: "sample_user_003",
        userName: "Mike Johnson", 
        userPhone: "+91 7654321098",
        userHostel: "Hostel C",
        userEmail: "mike@university.edu",
        emailDomain: "university.edu"
      }
    ];

    const createdItems = await Item.insertMany(sampleItems);
    console.log(`✅ Created ${createdItems.length} sample items with ObjectIds:`);
    
    createdItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   ID: ${item._id}`);
      console.log(`   Price: $${item.price}`);
      console.log('');
    });

    console.log('💡 These items now have proper MongoDB ObjectIds and can be viewed/booked');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample items:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createSampleItems();