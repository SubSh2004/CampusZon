import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateModerationStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all items without moderationStatus field
    const result = await Item.updateMany(
      { moderationStatus: { $exists: false } },
      { 
        $set: { 
          moderationStatus: 'active',
          reportCount: 0,
          reports: []
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} items with moderationStatus: 'active'`);
    
    // Count items by moderation status
    const activeCount = await Item.countDocuments({ moderationStatus: 'active' });
    const warnedCount = await Item.countDocuments({ moderationStatus: 'warned' });
    const removedCount = await Item.countDocuments({ moderationStatus: 'removed' });
    const totalCount = await Item.countDocuments({});
    
    console.log('\n📊 Current Item Statistics:');
    console.log(`Total items: ${totalCount}`);
    console.log(`Active: ${activeCount}`);
    console.log(`Warned: ${warnedCount}`);
    console.log(`Removed: ${removedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit();
  }
}

updateModerationStatus();
