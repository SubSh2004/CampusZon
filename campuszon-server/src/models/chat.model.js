import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{
    type: String, // userId
    required: true
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Index for finding chats by participants
chatSchema.index({ participants: 1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
