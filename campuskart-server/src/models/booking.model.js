import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  itemTitle: {
    type: String,
    required: true
  },
  itemPrice: {
    type: Number,
    required: true
  },
  buyerId: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
bookingSchema.index({ sellerId: 1, status: 1 });
bookingSchema.index({ buyerId: 1, status: 1 });
bookingSchema.index({ itemId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
