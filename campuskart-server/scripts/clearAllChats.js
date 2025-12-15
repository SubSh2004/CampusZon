import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Simple schemas for clearing
const chatSchema = new mongoose.Schema({}, { strict: false });
const messageSchema = new mongoose.Schema({}, { strict: false });
const unlockSchema = new mongoose.Schema({}, { strict: false });

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);
const Unlock = mongoose.model('Unlock', unlockSchema);

async function clearAllChats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'campuskart'
    });
    console.log('✅ Connected to MongoDB');

    // Count before deletion
    const chatCount = await Chat.countDocuments();
    const messageCount = await Message.countDocuments();
    const unlockCount = await Unlock.countDocuments();

    console.log('\n📊 Current Database State:');
    console.log(`   - Chats: ${chatCount}`);
    console.log(`   - Messages: ${messageCount}`);
    console.log(`   - Unlocks: ${unlockCount}`);

    console.log('\n🗑️  Starting cleanup...\n');

    // Delete all messages
    const deletedMessages = await Message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.deletedCount} messages`);

    // Delete all chats
    const deletedChats = await Chat.deleteMany({});
    console.log(`✅ Deleted ${deletedChats.deletedCount} chats`);

    // Reset message counts in Unlock records (but keep unlock records)
    const updatedUnlocks = await Unlock.updateMany(
      {},
      { $set: { messageCount: 0 } }
    );
    console.log(`✅ Reset message counts in ${updatedUnlocks.modifiedCount} unlock records`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📧 All chat messages and conversations have been cleared.');
    console.log('💾 Unlock records preserved (only message counts reset).\n');

    // Final count
    const finalChatCount = await Chat.countDocuments();
    const finalMessageCount = await Message.countDocuments();

    console.log('📊 Final Database State:');
    console.log(`   - Chats: ${finalChatCount}`);
    console.log(`   - Messages: ${finalMessageCount}`);
    console.log(`   - Unlocks: ${unlockCount} (preserved)\n`);

  } catch (error) {
    console.error('❌ Error clearing chats:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
clearAllChats();
