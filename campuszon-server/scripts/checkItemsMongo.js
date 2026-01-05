import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import { connectMongoDB } from '../src/db/mongo.js';

dotenv.config();

try {
  await connectMongoDB();
  console.log('✅ Connected to MongoDB');

  const items = await Item.find().sort({ createdAt: -1 }).limit(10).lean();

  console.log('\n📦 Recent items in MongoDB:');
  console.log('Total items:', items.length);
  console.log('\n');

  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   Image URL: ${item.imageUrl || 'No image'}`);
    console.log(`   Created: ${item.createdAt}`);
    console.log('');
  });

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
