# 💳 Custom Razorpay Payment Integration

A comprehensive custom payment solution for CampusZon using Razorpay payment gateway.

## 🎯 Features

✅ **Custom Payment Page** - Beautiful, fully customizable payment interface  
✅ **Multiple Payment Methods** - Card, UPI, Net Banking, Wallets  
✅ **Payment Success/Failure Pages** - Dedicated pages for transaction results  
✅ **Payment History** - Complete transaction history with filters  
✅ **Mobile Responsive** - Works seamlessly on all devices  
✅ **Dark Mode Support** - Full dark mode compatibility  
✅ **Secure** - 256-bit SSL encryption, PCI compliant  
✅ **Type-Safe** - Full TypeScript support with proper typing

## 📁 File Structure

```
campuszon-client/src/
├── pages/
│   ├── Payment.tsx              # Main payment page
│   ├── PaymentSuccess.tsx       # Success confirmation page
│   ├── PaymentFailed.tsx        # Failed payment page
│   └── PaymentHistory.tsx       # Transaction history
├── utils/
│   └── paymentUtils.ts          # Payment utilities & types
└── App.tsx                      # Updated with payment routes
```

## 🚀 Setup Instructions

### 1. Environment Variables

Add to `campuszon-client/.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

Add to `campuszon-server/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### 2. Install Dependencies

Backend (if not already installed):
```bash
cd campuszon-server
npm install razorpay
```

### 3. Routes Configuration

Routes are automatically configured in `App.tsx`:
- `/payment` - Payment page
- `/payment-success` - Success page
- `/payment-failed` - Failed page
- `/payment-history` - Transaction history

## 💡 Usage

### Option 1: Direct Navigation

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to payment page with details
navigate('/payment', {
  state: {
    itemId: 'item_id_here',
    itemTitle: 'Item Title',
    itemPrice: 500,
    sellerName: 'Seller Name',
    amount: 11, // Unlock fee
    tier: 'standard'
  }
});
```

### Option 2: Using Payment Utilities

```tsx
import { PaymentDetails, validatePaymentDetails } from '../utils/paymentUtils';

const paymentDetails: PaymentDetails = {
  itemId: item.id,
  itemTitle: item.title,
  itemPrice: item.price,
  sellerName: item.userName,
  amount: 11,
  tier: 'standard'
};

if (validatePaymentDetails(paymentDetails)) {
  navigate('/payment', { state: paymentDetails });
}
```

### Option 3: Update UnlockModal

Modify the `handleUnlock` function in `UnlockModal.tsx`:

```tsx
const handleUnlock = async (useFreeCredit?: boolean) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/api/unlock/items/${itemId}/unlock`,
      { useFreeCredit },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success && !response.data.requiresPayment) {
      onUnlockSuccess(response.data.sellerInfo, 'standard');
      setFreeCredits(response.data.remainingCredits);
      onClose();
      return;
    }

    if (response.data.requiresPayment) {
      // Navigate to custom payment page instead of opening Razorpay modal
      navigate('/payment', {
        state: {
          itemId,
          itemTitle,
          itemPrice: item?.price || 0,
          sellerName: item?.userName || 'Seller',
          amount: 11,
          tier: 'standard'
        }
      });
      onClose();
    }
  } catch (error: any) {
    console.error('Unlock error:', error);
    alert(error.response?.data?.message || 'Failed to unlock');
    setLoading(false);
  }
};
```

## 🎨 Components Overview

### Payment.tsx
Main payment page with:
- Order summary display
- User details form
- Payment method selection (Card, UPI, Net Banking, Wallet)
- Secure Razorpay integration
- Loading states and error handling

### PaymentSuccess.tsx
Success page featuring:
- Transaction confirmation
- Payment ID and Order ID
- Seller contact information (if unlocked)
- Action buttons (View Bookings, Continue Shopping)
- Downloadable receipt

### PaymentFailed.tsx
Failed payment page with:
- Error message display
- Common failure reasons
- Helpful tips
- Retry and support options
- No money deducted assurance

### PaymentHistory.tsx
Transaction history with:
- Statistics dashboard (Total, Completed, Pending, Failed, Total Spent)
- Filter by status (All, Completed, Pending, Failed)
- Search by item, seller, or payment ID
- Expandable transaction details
- Responsive cards layout

## 🔧 Payment Flow

```
User clicks "Unlock Item"
       ↓
Check Free Credits
       ↓
   Has Credits? ──Yes──→ Use Free Credit → Success
       ↓ No
Navigate to /payment
       ↓
User fills details
       ↓
Click "Pay Securely"
       ↓
Create Order (Backend)
       ↓
Open Razorpay Checkout
       ↓
User completes payment
       ↓
Payment Success? ──Yes──→ /payment-success
       ↓ No
  /payment-failed
```

## 🔐 Security Features

1. **Environment Variables** - API keys stored securely
2. **Token Authentication** - All requests require valid JWT
3. **HTTPS Only** - Production uses SSL/TLS
4. **Payment Verification** - Server-side signature validation
5. **PCI Compliance** - Razorpay handles sensitive data
6. **No Card Storage** - Card details never touch our servers

## 🧪 Testing

### Test Cards (Test Mode Only)

**Success:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Testing Workflow

1. Start both servers (frontend + backend)
2. Navigate to an item
3. Click "Unlock" button
4. Choose payment method (not free credit)
5. Get redirected to `/payment`
6. Fill in details
7. Click "Pay Securely"
8. Use test card details
9. Complete payment
10. See success/failure page
11. Check `/payment-history`

## 📱 Mobile Responsiveness

All payment pages are fully responsive:
- Single column on mobile
- Touch-friendly buttons
- Easy form inputs
- Optimized images
- Fast loading

## 🎨 Customization

### Change Payment Amount
Edit in `Payment.tsx`:
```tsx
const amount = paymentDetails.amount; // Change this
```

### Modify Theme Colors
Edit in `Payment.tsx`:
```tsx
theme: {
  color: '#3b82f6', // Change to your brand color
}
```

### Add Payment Methods
Edit in `Payment.tsx`:
```tsx
config: {
  display: {
    blocks: {
      card: { name: 'Pay using Card' },
      upi: { name: 'UPI' },
      netbanking: { name: 'Netbanking' },
      wallet: { name: 'Wallet' },
      // Add more methods here
    }
  }
}
```

### Custom Success Message
Edit in `PaymentSuccess.tsx`:
```tsx
<h1>Your Custom Success Message</h1>
```

## 🔍 Debugging

Enable detailed logging:

```tsx
// In Payment.tsx
console.log('Payment Details:', paymentDetails);
console.log('Order Created:', order);
console.log('Razorpay Response:', response);
```

Check Razorpay Dashboard:
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to "Transactions"
3. View all test payments
4. Check payment status and logs

## 🚨 Common Issues

### Issue: Razorpay Script Not Loading
**Solution:**
```tsx
// Check if script loaded successfully
const scriptLoaded = await loadRazorpayScript();
if (!scriptLoaded) {
  alert('Failed to load payment gateway');
  return;
}
```

### Issue: Payment Not Opening
**Solution:** Ensure `VITE_RAZORPAY_KEY_ID` is set correctly and script is loaded

### Issue: Payment Verification Failed
**Solution:** Check server logs and ensure `RAZORPAY_KEY_SECRET` is correct

### Issue: State Lost on Redirect
**Solution:** Pass data via `location.state` or use session storage

## 📊 Payment Analytics

Track payments in backend:
```javascript
// In payment controller
Payment.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
```

## 🔄 Future Enhancements

- [ ] Refund functionality
- [ ] Payment reminders
- [ ] Subscription support
- [ ] Multiple currency support
- [ ] Payment links
- [ ] Auto-debit / Recurring payments
- [ ] Payment analytics dashboard
- [ ] Export transaction history (CSV/PDF)
- [ ] Email receipts
- [ ] SMS notifications

## 📞 Support

For Razorpay issues:
- Email: support@razorpay.com
- Docs: https://razorpay.com/docs/

For CampusZon issues:
- Create a GitHub issue
- Contact: your-email@example.com

## 📄 License

This payment integration is part of CampusZon project.

---

**Happy Payments! 💰**
