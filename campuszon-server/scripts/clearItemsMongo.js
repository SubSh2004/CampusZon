import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import { connectMongoDB } from '../src/db/mongo.js';

dotenv.config();

try {
  await connectMongoDB();
  console.log('✅ Connected to MongoDB');

  const itemCount = await Item.countDocuments();
  console.log(`\n📦 Found ${itemCount} items in MongoDB`);

  if (itemCount === 0) {
    console.log('✅ Database is already empty!');
    await mongoose.disconnect();
    process.exit(0);
  }

  const items = await Item.find().sort({ createdAt: -1 }).lean();
  console.log('\n🗑️  Items to be deleted:');
  items.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.title} (ID: ${item._id})`);
    console.log(`      Image: ${item.imageUrl || 'No image'}`);
  });

  console.log('\n⚠️  Deleting all items from MongoDB...');
  const deleteRes = await Item.deleteMany({});

  console.log(`✅ Successfully deleted ${deleteRes.deletedCount} items from MongoDB!`);

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  await mongoose.disconnect();
  process.exit(1);
}
