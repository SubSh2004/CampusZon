import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteItems() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== DELETE ITEMS MENU ===');
    console.log('1. Delete all items');
    console.log('2. Delete items by user email');
    console.log('3. Delete items by category');
    console.log('4. Delete specific item by ID');
    console.log('5. Delete items created before a date');
    console.log('6. View items before deleting');
    console.log('0. Cancel\n');

    const choice = await question('Enter your choice (0-6): ');

    switch (choice) {
      case '1':
        await deleteAllItems();
        break;
      case '2':
        await deleteByUserEmail();
        break;
      case '3':
        await deleteByCategory();
        break;
      case '4':
        await deleteById();
        break;
      case '5':
        await deleteByDate();
        break;
      case '6':
        await viewItems();
        break;
      case '0':
        console.log('❌ Cancelled');
        break;
      default:
        console.log('❌ Invalid choice');
    }

    rl.close();
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function deleteAllItems() {
  const count = await Item.countDocuments();
  console.log(`\n⚠️ Found ${count} items`);
  
  const confirm = await question('Are you SURE you want to delete ALL items? (yes/no): ');
  
  if (confirm.toLowerCase() === 'yes') {
    const result = await Item.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} items`);
  } else {
    console.log('❌ Cancelled');
  }
}

async function deleteByUserEmail() {
  const email = await question('\nEnter user email: ');
  
  const items = await Item.find({ userEmail: email });
  console.log(`\n📦 Found ${items.length} items for ${email}:`);
  items.forEach(item => {
    console.log(`  - ${item.title} (₹${item.price}) - ${item._id}`);
  });
  
  if (items.length === 0) return;
  
  const confirm = await question(`\nDelete these ${items.length} items? (yes/no): `);
  
  if (confirm.toLowerCase() === 'yes') {
    const result = await Item.deleteMany({ userEmail: email });
    console.log(`✅ Deleted ${result.deletedCount} items`);
  } else {
    console.log('❌ Cancelled');
  }
}

async function deleteByCategory() {
  const categories = await Item.distinct('category');
  console.log('\n📂 Available categories:');
  categories.forEach((cat, i) => console.log(`  ${i + 1}. ${cat}`));
  
  const category = await question('\nEnter category name: ');
  
  const items = await Item.find({ category });
  console.log(`\n📦 Found ${items.length} items in "${category}":`);
  items.forEach(item => {
    console.log(`  - ${item.title} (₹${item.price}) - ${item._id}`);
  });
  
  if (items.length === 0) return;
  
  const confirm = await question(`\nDelete these ${items.length} items? (yes/no): `);
  
  if (confirm.toLowerCase() === 'yes') {
    const result = await Item.deleteMany({ category });
    console.log(`✅ Deleted ${result.deletedCount} items`);
  } else {
    console.log('❌ Cancelled');
  }
}

async function deleteById() {
  const id = await question('\nEnter item ID: ');
  
  const item = await Item.findById(id);
  
  if (!item) {
    console.log('❌ Item not found');
    return;
  }
  
  console.log(`\n📦 Found item:`);
  console.log(`  Title: ${item.title}`);
  console.log(`  Price: ₹${item.price}`);
  console.log(`  Seller: ${item.userName} (${item.userEmail})`);
  console.log(`  Category: ${item.category}`);
  
  const confirm = await question('\nDelete this item? (yes/no): ');
  
  if (confirm.toLowerCase() === 'yes') {
    await Item.findByIdAndDelete(id);
    console.log('✅ Item deleted');
  } else {
    console.log('❌ Cancelled');
  }
}

async function deleteByDate() {
  const date = await question('\nEnter date (YYYY-MM-DD) to delete items created before: ');
  
  const items = await Item.find({ createdAt: { $lt: new Date(date) } });
  console.log(`\n📦 Found ${items.length} items created before ${date}:`);
  items.slice(0, 10).forEach(item => {
    console.log(`  - ${item.title} (${item.createdAt.toLocaleDateString()})`);
  });
  if (items.length > 10) {
    console.log(`  ... and ${items.length - 10} more`);
  }
  
  if (items.length === 0) return;
  
  const confirm = await question(`\nDelete these ${items.length} items? (yes/no): `);
  
  if (confirm.toLowerCase() === 'yes') {
    const result = await Item.deleteMany({ createdAt: { $lt: new Date(date) } });
    console.log(`✅ Deleted ${result.deletedCount} items`);
  } else {
    console.log('❌ Cancelled');
  }
}

async function viewItems() {
  const limit = await question('\nHow many items to show? (default 20): ');
  const itemLimit = parseInt(limit) || 20;
  
  const items = await Item.find()
    .sort({ createdAt: -1 })
    .limit(itemLimit);
  
  console.log(`\n📦 Showing ${items.length} most recent items:\n`);
  items.forEach((item, i) => {
    console.log(`${i + 1}. ${item.title}`);
    console.log(`   Price: ₹${item.price} | Category: ${item.category}`);
    console.log(`   Seller: ${item.userName} (${item.userEmail})`);
    console.log(`   ID: ${item._id}`);
    console.log(`   Created: ${item.createdAt.toLocaleString()}\n`);
  });
  
  const totalCount = await Item.countDocuments();
  console.log(`📊 Total items in database: ${totalCount}\n`);
}

// Run the script
deleteItems();
