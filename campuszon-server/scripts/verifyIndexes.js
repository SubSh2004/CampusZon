// Verify Compound Indexes and Performance
// Run: node scripts/verifyIndexes.js

import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';

async function verifyIndexes() {
  try {
    // Load environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI or MONGO_URI environment variable not set!');
      console.log('\n💡 How to fix:');
      console.log('   1. Make sure you have a .env file in campuszon-server/');
      console.log('   2. Add: MONGODB_URI=your-mongodb-atlas-url');
      console.log('   3. Or run: set MONGODB_URI=your-url (Windows PowerShell)');
      console.log('   4. Or run with: MONGODB_URI=your-url node scripts/verifyIndexes.js\n');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. CHECK ALL INDEXES
    console.log('📋 STEP 1: Checking All Indexes');
    console.log('='.repeat(60));
    const indexes = await Item.collection.getIndexes();
    
    const expectedIndexes = [
      'emailDomain_1_createdAt_-1',
      'emailDomain_1_moderationStatus_1_createdAt_-1',
      'emailDomain_1_category_1_createdAt_-1',
      'emailDomain_1_userId_1_createdAt_-1',
      'emailDomain_1_available_1_createdAt_-1'
    ];

    console.log('\nFound Indexes:');
    Object.keys(indexes).forEach(indexName => {
      const isExpected = expectedIndexes.includes(indexName);
      const icon = isExpected ? '✅' : '📌';
      console.log(`${icon} ${indexName}`);
      console.log(`   Fields: ${JSON.stringify(indexes[indexName])}`);
    });

    // Check if all expected indexes exist
    console.log('\n\nExpected Indexes Status:');
    expectedIndexes.forEach(indexName => {
      const exists = indexes.hasOwnProperty(indexName);
      console.log(`${exists ? '✅' : '❌'} ${indexName}`);
    });

    // 2. PERFORMANCE TEST
    console.log('\n\n' + '='.repeat(60));
    console.log('⚡ STEP 2: Performance Test (WITH indexes)');
    console.log('='.repeat(60));

    // Find actual domain with data
    const domains = await Item.distinct('emailDomain');
    const testDomain = domains.find(d => d) || 'gmail.com';
    const domainCount = await Item.countDocuments({ emailDomain: testDomain });
    console.log(`\nUsing domain: ${testDomain} (${domainCount} items)\n`);
    
    // Test 1: Home Page Query (with moderationStatus)
    const startHome = Date.now();
    const homeItems = await Item.find({
      emailDomain: testDomain,
      moderationStatus: { $in: ['active', 'warned'] }
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .explain('executionStats');
    const timeHome = Date.now() - startHome;

    const homeStage = homeItems.executionStats.executionStages;
    const homeIndexName = homeStage.indexName || 
                          (homeStage.inputStage?.indexName) || 
                          (homeStage.stage === 'IXSCAN' ? homeStage.keyPattern : 'NONE');

    console.log('\n🏠 Home Page Query:');
    console.log(`   Time: ${timeHome}ms`);
    console.log(`   Docs Examined: ${homeItems.executionStats.totalDocsExamined}`);
    console.log(`   Docs Returned: ${homeItems.executionStats.nReturned}`);
    console.log(`   Index Used: ${typeof homeIndexName === 'object' ? JSON.stringify(homeIndexName) : homeIndexName}`);
    console.log(`   Efficiency: ${homeItems.executionStats.totalDocsExamined === homeItems.executionStats.nReturned ? '✅ OPTIMAL' : '⚠️ NEEDS IMPROVEMENT'}`);

    // Test 2: Category Query
    const startCategory = Date.now();
    const categoryItems = await Item.find({
      emailDomain: testDomain,
      category: 'electronics'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .explain('executionStats');
    const timeCategory = Date.now() - startCategory;

    const catStage = categoryItems.executionStats.executionStages;
    const catIndexName = catStage.indexName || 
                         (catStage.inputStage?.indexName) || 
                         (catStage.stage === 'IXSCAN' ? catStage.keyPattern : 'NONE');

    console.log('\n📦 Category Query:');
    console.log(`   Time: ${timeCategory}ms`);
    console.log(`   Docs Examined: ${categoryItems.executionStats.totalDocsExamined}`);
    console.log(`   Docs Returned: ${categoryItems.executionStats.nReturned}`);
    console.log(`   Index Used: ${typeof catIndexName === 'object' ? JSON.stringify(catIndexName) : catIndexName}`);
    console.log(`   Efficiency: ${categoryItems.executionStats.totalDocsExamined === categoryItems.executionStats.nReturned ? '✅ OPTIMAL' : '⚠️ NEEDS IMPROVEMENT'}`);

    // Test 3: User Items Query (Profile Page)
    const sampleUser = await Item.findOne({ emailDomain: testDomain });
    if (sampleUser) {
      const startProfile = Date.now();
      const profileItems = await Item.find({
        emailDomain: testDomain,
        userId: sampleUser.userId
      })
      .sort({ createdAt: -1 })
      .explain('executionStats');
      const timeProfile = Date.now() - startProfile;

      const profStage = profileItems.executionStats.executionStages;
      const profIndexName = profStage.indexName || 
                           (profStage.inputStage?.indexName) || 
                           (profStage.stage === 'IXSCAN' ? profStage.keyPattern : 'NONE');

      console.log('\n👤 Profile Page Query:');
      console.log(`   Time: ${timeProfile}ms`);
      console.log(`   Docs Examined: ${profileItems.executionStats.totalDocsExamined}`);
      console.log(`   Docs Returned: ${profileItems.executionStats.nReturned}`);
      console.log(`   Index Used: ${typeof profIndexName === 'object' ? JSON.stringify(profIndexName) : profIndexName}`);
      console.log(`   Efficiency: ${profileItems.executionStats.totalDocsExamined === profileItems.executionStats.nReturned ? '✅ OPTIMAL' : '⚠️ NEEDS IMPROVEMENT'}`);
    }

    // 3. INDEX STATS
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 STEP 3: Index Usage Statistics');
    console.log('='.repeat(60));

    try {
      const db = mongoose.connection.db;
      const stats = await db.collection('items').stats();
      console.log(`\nTotal Documents: ${stats.count}`);
      console.log(`Storage Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Number of Indexes: ${stats.nindexes}`);
    } catch (err) {
      console.log(`\nCouldn't fetch detailed stats: ${err.message}`);
      const count = await Item.countDocuments();
      console.log(`Total Documents: ${count}`);
    }

    // 4. RECOMMENDATIONS
    console.log('\n\n' + '='.repeat(60));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(60));

    const missingIndexes = expectedIndexes.filter(idx => !indexes.hasOwnProperty(idx));
    if (missingIndexes.length > 0) {
      console.log('\n❌ Missing Indexes:');
      missingIndexes.forEach(idx => console.log(`   - ${idx}`));
      console.log('\n🔧 Fix: Restart your server to create missing indexes');
    } else {
      console.log('\n✅ All expected indexes are present!');
    }

    if (timeHome < 50) {
      console.log('✅ Home page query is FAST (<50ms)');
    } else {
      console.log(`⚠️ Home page query is slow (${timeHome}ms). Expected <50ms`);
    }

    console.log('\n✨ Verification Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

verifyIndexes();
