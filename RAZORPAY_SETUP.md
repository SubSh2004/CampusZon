# 💳 Razorpay Payment Integration Setup Guide

## 🎯 Quick Setup (5 minutes)

This guide will help you integrate Razorpay payment gateway for the unlock system.

---

## 📝 Step 1: Create Razorpay Account

1. Visit [Razorpay.com](https://razorpay.com)
2. Click **"Sign Up"** → Choose **"As a Business"**
3. Enter your details:
   - Business Name: CampusZon (or your name)
   - Email
   - Phone number
4. Verify email and phone (OTP)
5. Complete KYC:
   - PAN card
   - Bank account details
   - GST (optional for small amounts)

**Note:** Approval takes 1-2 business days for live mode. Use TEST mode immediately!

---

## 🔑 Step 2: Get API Keys

### For Testing (Immediate - No Approval Needed):

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Under **Test Mode**, click **"Generate Test API Keys"**
4. Copy:
   - **Key ID**: `rzp_test_xxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxx`

### For Production (After KYC Approval):

1. Toggle to **Live Mode** in dashboard
2. Generate **Live API Keys**
3. Copy Live Key ID and Secret

---

## ⚙️ Step 3: Configure Backend

1. Open `campuszon-server/.env` file
2. Add these variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

**Important:** 
- Use **TEST keys** for development
- Switch to **LIVE keys** only when ready to accept real payments
- NEVER commit `.env` to GitHub

---

## 🎨 Step 4: Configure Frontend

1. Open `campuszon-client/.env` file (create if doesn't exist)
2. Add:

```env
# Razorpay Public Key (safe to expose)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

**Note:** Only add the Key ID (not secret) to frontend!

---

## 📦 Step 5: Install Razorpay Package

In backend terminal:

```bash
cd campuszon-server
npm install razorpay
```

---

## ✅ Step 6: Test the Integration

### Test with Razorpay Test Cards:

1. Start your servers (backend + frontend)
2. Try to unlock an item
3. Use these **test credentials**:

**Test Cards (NO REAL MONEY):**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Test UPI:**
- UPI ID: `success@razorpay`
- This simulates successful payment

**Test Netbanking:**
- Select any bank
- Choose "Success" option

### Expected Flow:

1. Click "Unlock Basic - ₹10" (or use free credit)
2. Razorpay modal opens
3. Enter test card details
4. Payment succeeds
5. Seller details are revealed
6. Chat unlocks

---

## 🔒 Step 7: Webhook Setup (Optional but Recommended)

Webhooks notify your backend about payment status changes.

1. In Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **"+ Create New Webhook"**
3. Enter:
   - **Webhook URL**: `https://your-render-backend.onrender.com/api/unlock/webhook`
   - **Secret**: Generate and save it
   - **Events**: Select `payment.authorized`, `payment.failed`
4. Save webhook

5. Add to backend `.env`:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 💰 Step 8: Go Live (When Ready)

### Before Going Live:

✅ Complete KYC verification (1-2 days)
✅ Add bank account for settlements
✅ Test thoroughly with test keys
✅ Read Razorpay's terms & pricing

### Switch to Live:

1. Get **Live API Keys** from dashboard
2. Update `.env` files with live keys
3. Redeploy backend and frontend
4. Test with small real payment (₹1-10)
5. Monitor first few transactions

### Razorpay Pricing:

- **2% + GST** per transaction
- No setup fee
- No monthly fee
- Settlement: T+3 days (3 days after transaction)

**Example:**
- User pays ₹10
- Razorpay fee: ₹0.20 + GST ≈ ₹0.24
- You receive: ₹9.76

---

## 🎓 Test Scenarios

### Test Case 1: Free Credit Unlock
1. New user (should have 3 free credits)
2. Click "Unlock Basic"
3. Choose "Use Free Credit"
4. Should unlock without payment
5. Credits reduce to 2

### Test Case 2: Paid Basic Unlock
1. User with 0 free credits
2. Click "Unlock Basic - ₹10"
3. Razorpay opens
4. Use test card
5. Payment succeeds
6. Seller details revealed

### Test Case 3: Premium Unlock
1. Click "Unlock Premium - ₹25"
2. Complete payment
3. Get phone number + email + unlimited chat

### Test Case 4: Upgrade Basic → Premium
1. Already have basic unlock
2. Click "Upgrade to Premium - ₹15"
3. Pay ₹15 (not ₹25)
4. Get full access

---

## 🐛 Troubleshooting

### Issue 1: "Payment gateway not configured"
**Solution:** Make sure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are in backend `.env`

### Issue 2: Razorpay modal doesn't open
**Solution:** 
- Check browser console for errors
- Ensure Razorpay script is loaded
- Verify `VITE_RAZORPAY_KEY_ID` in frontend `.env`

### Issue 3: Payment succeeds but unlock fails
**Solution:**
- Check backend logs
- Verify signature verification is working
- Ensure MongoDB connection is stable

### Issue 4: "Invalid key_id"
**Solution:**
- Verify you're using correct key (test vs live)
- Check for extra spaces in `.env` file
- Restart servers after changing `.env`

---

## 📊 Monitor Transactions

### In Razorpay Dashboard:

1. **Payments** tab: See all transactions
2. **Settlements** tab: Track money received
3. **Analytics**: View success rates, volumes

### In Your Database:

Query payments:
```javascript
db.payments.find({ status: 'completed' }).sort({ createdAt: -1 })
```

Check unlocks:
```javascript
db.unlocks.find({ active: true }).count()
```

---

## 🚀 Going to Production Checklist

- [ ] KYC approved by Razorpay
- [ ] Bank account added and verified
- [ ] Live API keys generated
- [ ] Backend `.env` updated with live keys
- [ ] Frontend `.env` updated with live key
- [ ] Tested with real ₹1 payment
- [ ] Webhook configured
- [ ] Error logging set up
- [ ] Refund policy decided
- [ ] Terms & conditions updated

---

## 💡 Pro Tips

1. **Start with Test Mode**: Never test with real money
2. **Monitor First Week**: Watch for issues closely
3. **Keep Test Keys**: Useful for debugging
4. **Enable 2FA**: On Razorpay account for security
5. **Check Settlements**: Money comes in T+3 days
6. **Handle Failures**: Show clear error messages
7. **Refund Policy**: Decide how to handle disputes

---

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/

---

## 🎉 You're Done!

Your payment system is ready! Users can now:
- ✅ Use 3 free unlocks
- ✅ Pay ₹10 for basic access
- ✅ Pay ₹25 for premium access
- ✅ Upgrade from basic to premium

**Next Steps:**
1. Test thoroughly in test mode
2. Complete KYC for live mode
3. Launch and start earning! 💰

---

## 📈 Expected Revenue

With 300 students:
- 50 unlocks/month × ₹10 = ₹500
- After Razorpay fees (2%): ≈ ₹490

With 1000 students:
- 200 unlocks/month = ₹2,000
- Net revenue: ≈ ₹1,960

**Your turn to scale! 🚀**
