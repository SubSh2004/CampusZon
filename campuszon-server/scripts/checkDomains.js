// Check what email domains exist in database
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';

async function checkDomains() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    console.log('📊 Checking Email Domains in Database\n');
    
    // Get all unique email domains
    const domains = await Item.distinct('emailDomain');
    console.log(`Found ${domains.length} unique email domain(s):\n`);
    
    for (const domain of domains) {
      const count = await Item.countDocuments({ emailDomain: domain });
      console.log(`  ${domain || '(empty/null)'}: ${count} items`);
    }
    
    // Get sample item to show structure
    console.log('\n📋 Sample Item:');
    const sample = await Item.findOne().select('emailDomain userId category moderationStatus createdAt');
    console.log(sample);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDomains();
