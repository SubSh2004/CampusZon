import Payment from '../models/payment.model.js';
import User from '../models/user.model.js';
import Item from '../models/item.mongo.model.js';
import PDFDocument from 'pdfkit';

// Get user's payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all payments for the user
    const payments = await Payment.find({ userId })
      .populate({
        path: 'itemId',
        select: 'title price imageUrl'
      })
      .sort({ createdAt: -1 }); // Latest first

    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      transactionId: payment.razorpayPaymentId || payment.razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      type: payment.type,
      paymentMethod: 'Razorpay',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      metadata: {
        ...payment.metadata,
        itemTitle: payment.itemId?.title || payment.metadata?.itemTitle,
        itemPrice: payment.itemId?.price
      },
      item: payment.itemId ? {
        id: payment.itemId._id,
        title: payment.itemId.title,
        price: payment.itemId.price,
        imageUrl: payment.itemId.imageUrl
      } : null
    }));

    // Calculate stats
    const stats = {
      total: payments.length,
      successful: payments.filter(p => p.status === 'completed').length,
      failed: payments.filter(p => p.status === 'failed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      totalSpent: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({
      success: true,
      payments: formattedPayments,
      stats
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

// Download payment slip as PDF
export const downloadPaymentSlip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;

    // Fetch payment and verify ownership
    const payment = await Payment.findById(paymentId).populate({
      path: 'itemId',
      select: 'title price'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Security: Verify payment belongs to user
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment record'
      });
    }

    // Only allow download for completed payments
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment slip only available for completed payments'
      });
    }

    // Fetch user details
    const user = await User.findById(userId);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment-slip-${payment._id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content
    // Header with branding
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#4F46E5')
      .text('CampusZon', { align: 'center' });
    
    doc
      .fontSize(12)
      .fillColor('#6B7280')
      .text('Campus Marketplace', { align: 'center' })
      .moveDown(0.5);

    // Divider line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#E5E7EB')
      .stroke()
      .moveDown();

    // Payment Slip Title
    doc
      .fontSize(20)
      .fillColor('#111827')
      .text('Payment Receipt', { align: 'center' })
      .moveDown(1.5);

    // Payment Status Badge
    const statusColor = payment.status === 'completed' ? '#10B981' : '#EF4444';
    const statusBg = payment.status === 'completed' ? '#D1FAE5' : '#FEE2E2';
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(statusColor)
      .text(`✓ ${payment.status.toUpperCase()}`, { align: 'center' })
      .moveDown(2);

    // Payment Details Box
    const startY = doc.y;
    doc
      .fontSize(11)
      .font('Helvetica');

    const addField = (label, value, bold = false) => {
      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text(label, 50, doc.y, { continued: true, width: 200 })
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(11)
        .fillColor('#111827')
        .text(value, { align: 'right' })
        .font('Helvetica')
        .moveDown(0.8);
    };

    addField('Transaction ID:', payment.razorpayPaymentId || payment.razorpayOrderId, true);
    addField('Order ID:', payment.razorpayOrderId);
    addField('Payment Date:', new Date(payment.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }));
    addField('Payment Type:', getPaymentTypeLabel(payment.type));
    addField('Payment Method:', 'Razorpay (UPI/Card/Wallet)');
    
    doc.moveDown(0.5);
    
    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#E5E7EB')
      .stroke()
      .moveDown(1);

    // Item/Service Details
    if (payment.metadata) {
      if (payment.metadata.itemTitle) {
        addField('Item:', payment.metadata.itemTitle);
      }
      if (payment.metadata.tokens) {
        addField('Tokens:', `${payment.metadata.tokens} Tokens`);
      }
      if (payment.metadata.tier) {
        addField('Tier:', payment.metadata.tier.charAt(0).toUpperCase() + payment.metadata.tier.slice(1));
      }
      if (payment.metadata.sellerName) {
        addField('Seller:', payment.metadata.sellerName);
      }
    }

    doc.moveDown(0.5);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#E5E7EB')
      .stroke()
      .moveDown(1);

    // Amount Section
    doc
      .fontSize(10)
      .fillColor('#6B7280')
      .text('Amount Paid:', 50, doc.y)
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#4F46E5')
      .text(`₹${payment.amount.toFixed(2)}`, { align: 'right' })
      .font('Helvetica')
      .moveDown(2);

    // Footer
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#E5E7EB')
      .stroke()
      .moveDown(1);

    doc
      .fontSize(9)
      .fillColor('#9CA3AF')
      .text('Customer Details', 50, doc.y);
    
    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text(`Name: ${user.username}`, 50)
      .text(`Email: ${user.email}`, 50)
      .text(`User ID: ${user._id}`, 50)
      .moveDown(2);

    // Important Note
    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .text(
        'This is a computer-generated receipt and does not require a signature.\nFor any queries, please contact support@campuszon.com',
        50,
        doc.page.height - 80,
        { align: 'center', width: 495 }
      );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating payment slip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment slip'
    });
  }
};

// Helper function to get payment type label
function getPaymentTypeLabel(type) {
  const labels = {
    'unlock_basic': 'Basic Unlock',
    'unlock_premium': 'Premium Unlock',
    'token_purchase': 'Token Purchase',
    'transaction': 'Transaction',
    'featured_listing': 'Featured Listing'
  };
  return labels[type] || type;
}
