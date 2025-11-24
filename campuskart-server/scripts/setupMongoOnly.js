import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB } from '../src/db/mongo.js';

dotenv.config();

const setupMongoOnly = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB successfully');
    
    // Check existing collections
    const collections = await mongoose.connection.db.collections();
    const collectionNames = collections.map(c => c.collectionName);
    
    console.log('📦 Existing MongoDB collections:', collectionNames);
    
    // Check if items collection exists and count documents
    if (collectionNames.includes('items')) {
      const itemCount = await mongoose.connection.db.collection('items').countDocuments();
      console.log(`📋 Items collection has ${itemCount} documents`);
    } else {
      console.log('📋 Items collection does not exist yet - will be created when first item is added');
    }
    
    console.log('✅ MongoDB-only setup verified - ready to go!');
    console.log('💡 PostgreSQL is no longer needed - all data will use MongoDB');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB setup error:', error.message);
    process.exit(1);
  }
};

setupMongoOnly();