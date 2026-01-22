import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import { TOKEN_PACKAGES, getPackageById } from '../config/tokenPackages.js';
import crypto from 'crypto';

// Get all token packages
export const getTokenPackages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      packages: TOKEN_PACKAGES,
      currentTokens: user?.unlockTokens || 0
    });
  } catch (error) {
    console.error('Get token packages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Purchase token package
export const purchaseTokens = async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user.id;

    const tokenPackage = getPackageById(packageId);
    if (!tokenPackage) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        message: 'Payment gateway not configured' 
      });
    }

    // Create Razorpay order
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: tokenPackage.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        userId,
        packageId: tokenPackage.id,
        tokens: tokenPackage.tokens,
        type: 'token_purchase'
      }
    });

    // Create payment record
    const payment = new Payment({
      userId,
      amount: tokenPackage.price,
      type: 'token_purchase',
      status: 'pending',
      razorpayOrderId: order.id,
      metadata: {
        packageId: tokenPackage.id,
        tokens: tokenPackage.tokens
      }
    });

    await payment.save();

    res.json({
      success: true,
      requiresPayment: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      payment: {
        id: payment._id,
        amount: tokenPackage.price,
        tokens: tokenPackage.tokens
      },
      packageDetails: tokenPackage
    });
  } catch (error) {
    console.error('Purchase tokens error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify token purchase payment
export const verifyTokenPurchase = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
    const userId = req.user.id;

    console.log('🔍 Payment verification started:', {
      razorpay_order_id,
      razorpay_payment_id,
      paymentId,
      userId
    });

    // SECURITY: Get payment record first and verify ownership
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error('❌ Payment record not found:', paymentId);
      return res.status(404).json({ 
        success: false,
        message: 'Payment record not found' 
      });
    }

    console.log('✅ Payment record found:', {
      paymentId: payment._id,
      userId: payment.userId,
      status: payment.status,
      amount: payment.amount,
      metadata: payment.metadata
    });

    // SECURITY: Verify payment belongs to requesting user
    if (payment.userId !== userId) {
      console.error('❌ User ID mismatch:', {
        paymentUserId: payment.userId,
        requestUserId: userId
      });
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: Payment does not belong to you' 
      });
    }

    // SECURITY: Prevent replay attacks - check if already completed
    if (payment.status === 'completed') {
      console.warn('⚠️ Payment already completed:', paymentId);
      return res.status(400).json({ 
        success: false,
        message: 'Payment already processed' 
      });
    }

    // SECURITY: Verify payment matches our order
    if (payment.razorpayOrderId !== razorpay_order_id) {
      console.error('❌ Order ID mismatch:', {
        paymentOrderId: payment.razorpayOrderId,
        razorpayOrderId: razorpay_order_id
      });
      return res.status(400).json({ 
        success: false,
        message: 'Payment order mismatch' 
      });
    }

    console.log('✅ Payment ownership and order verified');

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Signature verification failed:', {
        expected: expectedSignature,
        received: razorpay_signature
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Payment signature verification failed - potential tampering detected' 
      });
    }

    console.log('✅ Razorpay signature verified');

    // SECURITY: Verify amount matches the expected package price
    const tokenPackage = getPackageById(payment.metadata.packageId);
    if (!tokenPackage) {
      console.error('❌ Invalid package ID:', payment.metadata.packageId);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid package in payment record' 
      });
    }

    console.log('✅ Package found:', {
      packageId: tokenPackage.id,
      tokens: tokenPackage.tokens,
      price: tokenPackage.price
    });

    // Verify stored amount matches package price (prevent amount manipulation)
    if (payment.amount !== tokenPackage.price) {
      console.error('⚠️ SECURITY ALERT: Payment amount mismatch', {
        paymentId: payment._id,
        storedAmount: payment.amount,
        expectedAmount: tokenPackage.price,
        userId
      });
      return res.status(400).json({ 
        success: false,
        message: 'Payment amount verification failed' 
      });
    }

    // SECURITY: Fetch payment details from Razorpay to verify actual amount paid
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const actualAmountPaid = razorpayPayment.amount / 100; // Convert from paise to rupees

    // Verify actual amount paid matches expected amount
    if (actualAmountPaid !== tokenPackage.price) {
      console.error('⚠️ CRITICAL SECURITY ALERT: Razorpay amount mismatch', {
        paymentId: payment._id,
        actualPaid: actualAmountPaid,
        expectedAmount: tokenPackage.price,
        userId
      });
      return res.status(400).json({ 
        success: false,
        message: 'Payment amount does not match package price' 
      });
    }

    // Verify payment was successful on Razorpay's end
    if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
      return res.status(400).json({ 
        success: false,
        message: 'Payment not successful on gateway' 
      });
    }

    // All security checks passed - Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    await payment.save();

    // Add tokens to user account
    const user = await User.findById(userId);
    const tokensToAdd = payment.metadata.tokens;
    
    user.unlockTokens += tokensToAdd;
    user.totalSpent += payment.amount;
    await user.save();

    console.log('✅ Payment verified successfully:', {
      paymentId: payment._id,
      userId,
      amount: payment.amount,
      tokensAdded: tokensToAdd
    });

    res.json({
      success: true,
      message: `Successfully added ${tokensToAdd} tokens!`,
      tokensAdded: tokensToAdd,
      currentTokens: user.unlockTokens,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('❌ Verify token purchase error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error during payment verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's token balance and history
export const getTokenBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Get token purchase history
    const purchases = await Payment.find({
      userId,
      type: 'token_purchase',
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      currentTokens: user?.unlockTokens || 0,
      totalSpent: user?.totalSpent || 0,
      recentPurchases: purchases.map(p => ({
        id: p._id,
        tokens: p.metadata.tokens,
        amount: p.amount,
        date: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Get token balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
