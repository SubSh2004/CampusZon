# 🚀 Quick Start Guide - Monetization System

## ✨ What's New?

Your Campus-Kart now has a **complete monetization system**!

### 🎁 Every New User Gets:
- **3 FREE unlocks** (worth ₹30!)
- Try before you buy
- No credit card needed to start

### 💰 Revenue Streams:
- Basic Unlock: ₹10
- Premium Unlock: ₹25
- Upgrade Path: ₹15

---

## 🏃 Quick Setup (10 minutes)

### Step 1: Install Dependencies (1 min)

```bash
cd campuskart-server
npm install razorpay
```

### Step 2: Get Razorpay Keys (3 min)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys
3. Generate **Test Keys** (no KYC needed for testing!)
4. Copy Key ID and Secret

### Step 3: Configure Environment (2 min)

**Backend (`campuskart-server/.env`):**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

**Frontend (`campuskart-client/.env`):**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### Step 4: Integrate UI (4 min)

See [INTEGRATION_EXAMPLE.md](INTEGRATION_EXAMPLE.md) for copy-paste code!

Basically:
1. Import `UnlockModal` and `FreeCreditsIndicator`
2. Hide seller contact details by default
3. Show "Unlock Contact" button
4. Reveal details after unlock

---

## 🧪 Test It Out

### Use Test Cards (No Real Money):

- **Card:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** `12/25`
- **UPI:** `success@razorpay`

### Test Scenarios:

1. **New user** → Has 3 free credits
2. **Click unlock** → Use free credit
3. **No payment** → Instantly unlocked!
4. **0 credits** → Pay ₹10 via Razorpay
5. **Premium** → Get phone + email

---

## 📊 What You'll Earn

| Campus Size | Monthly Revenue |
|-------------|-----------------|
| 300 students | ₹800-1,500 |
| 1000 students | ₹2,500-5,000 |
| 3000 students | ₹8,000-15,000 |
| Multiple campuses | ₹20,000-50,000+ |

---

## 📚 Full Documentation

- **[MONETIZATION_IMPLEMENTATION.md](MONETIZATION_IMPLEMENTATION.md)** - Complete technical details
- **[RAZORPAY_SETUP.md](RAZORPAY_SETUP.md)** - Step-by-step payment setup
- **[INTEGRATION_EXAMPLE.md](INTEGRATION_EXAMPLE.md)** - Copy-paste UI code

---

## ✅ Deploy & Launch

```bash
git add .
git commit -m "Add monetization system with free credits"
git push
```

**In Render:** Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`  
**In Vercel:** Add `VITE_RAZORPAY_KEY_ID`

---

## 🎯 Next Actions

1. ✅ **Setup Razorpay** (3 min)
2. ✅ **Test locally** with test cards (5 min)
3. ✅ **Integrate UI** (see INTEGRATION_EXAMPLE.md)
4. ✅ **Deploy** (git push)
5. ✅ **Add env vars** to Render/Vercel
6. 🚀 **Launch and earn!**

---

## 💡 Pro Tips

- Start with TEST mode (no KYC needed)
- Give 3 free credits = builds trust
- Premium converts better than Basic
- Monitor first week closely
- Switch to LIVE mode after KYC approval

---

## 🆘 Need Help?

Check these files:
- Payment issues → [RAZORPAY_SETUP.md](RAZORPAY_SETUP.md)
- Integration help → [INTEGRATION_EXAMPLE.md](INTEGRATION_EXAMPLE.md)
- How it works → [MONETIZATION_IMPLEMENTATION.md](MONETIZATION_IMPLEMENTATION.md)

---

## 🎉 You're Ready!

Your campus marketplace can now generate revenue while offering free trials to new users!

**Time to launch and scale! 🚀**
