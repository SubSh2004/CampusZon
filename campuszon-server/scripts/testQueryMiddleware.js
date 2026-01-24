// Test Query Middleware Warnings
// Run: node scripts/testQueryMiddleware.js

import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';

async function testMiddleware() {
  try {
    // Load environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI or MONGO_URI environment variable not set!');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Testing Query Middleware (Security Warnings)\n');
    console.log('='.repeat(60));

    // TEST 1: Query WITHOUT emailDomain (should trigger warning)
    console.log('\n📍 TEST 1: Query WITHOUT emailDomain (should warn)');
    console.log('-'.repeat(60));
    console.log('Running: Item.find({ category: "electronics" })');
    await Item.find({ category: 'electronics' }).limit(1);
    console.log('Expected: ⚠️ Warning in console above\n');

    // TEST 2: Query WITH emailDomain (should NOT warn)
    console.log('\n📍 TEST 2: Query WITH emailDomain (should NOT warn)');
    console.log('-'.repeat(60));
    console.log('Running: Item.find({ emailDomain: "iitism.ac.in", category: "electronics" })');
    await Item.find({ emailDomain: 'iitism.ac.in', category: 'electronics' }).limit(1);
    console.log('Expected: ✅ No warning (this is secure)\n');

    // TEST 3: Query with _id (should NOT warn - exception)
    console.log('\n📍 TEST 3: Query with _id (should NOT warn - exception)');
    console.log('-'.repeat(60));
    const sampleItem = await Item.findOne();
    if (sampleItem) {
      console.log(`Running: Item.findById("${sampleItem._id}")`);
      await Item.findById(sampleItem._id);
      console.log('Expected: ✅ No warning (_id queries are exempt)\n');
    }

    console.log('='.repeat(60));
    console.log('✨ Middleware Test Complete!');
    console.log('\n💡 Check console output above:');
    console.log('   - TEST 1 should show ⚠️ warning (insecure query)');
    console.log('   - TEST 2 should be silent (secure query)');
    console.log('   - TEST 3 should be silent (_id exception)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testMiddleware();
