# 🚀 Image Moderation System - Installation Instructions

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18+ installed
- ✅ MongoDB instance running (local or Atlas)
- ✅ Campus-Kart project already set up
- ✅ At least ONE AI provider API key

---

## Step 1: Install Dependencies

```bash
cd campuskart-server
npm install sharp axios
```

**What we're installing:**
- `sharp` - Image processing library (validation, EXIF removal, resizing)
- `axios` - HTTP client for AI provider APIs

---

## Step 2: Configure Environment Variables

Edit your `.env` file in `campuskart-server/`:

```bash
# Add these new variables:

# AI Moderation - Choose at least ONE provider

# Option 1: Google Cloud Vision (RECOMMENDED - Easiest & Free Tier)
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key

# Option 2: AWS Rekognition (Advanced)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1

# Option 3: OpenAI Vision (Most Expensive)
# OPENAI_API_KEY=your_openai_api_key
```

### How to Get API Keys

#### Google Cloud Vision (Recommended)
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Cloud Vision API"
4. Go to "APIs & Services" → "Credentials"
5. Create API Key
6. Copy and paste into `.env`

**Free Tier:** 1,000 images/month FREE!

#### AWS Rekognition (Optional)
1. Go to https://aws.amazon.com/rekognition/
2. Create AWS account if needed
3. Get Access Key ID and Secret Key from IAM
4. Add to `.env`

**Cost:** $1 per 1,000 images (no free tier)

#### OpenAI Vision (Optional)
1. Go to https://platform.openai.com/
2. Create account and add payment method
3. Get API key from API keys section
4. Add to `.env`

**Cost:** ~$10 per 1,000 images (most expensive)

---

## Step 3: Verify Installation

### Start the Server

```bash
cd campuskart-server
npm run dev
```

### Check Logs

You should see:
```
Server is running on port 5000
MongoDB connected successfully
```

**NO ERRORS should appear** about missing dependencies.

---

## Step 4: Test the System

### Test 1: Upload a Clean Image

1. Go to your app (http://localhost:3000)
2. Create a new item listing
3. Upload a clean product photo
4. Submit the form

**Expected Result:**
- Console should show: "Added job to queue"
- Within 5-10 seconds: "✓ Moderation completed: AUTO_APPROVED"
- Image should appear on the listing

### Test 2: Check Database

Connect to MongoDB and verify these collections were created:
- `imagemoderations`
- `userviolations`
- `moderationauditlogs`

```javascript
// MongoDB Shell or Compass
db.imagemoderations.find().pretty()
// Should show your moderation record
```

### Test 3: Check Moderation Record

```bash
# Make a test API call
curl http://localhost:5000/api/moderation/stats

# Should return:
{
  "success": true,
  "stats": {
    "pending": 0,
    "approved": 1,
    "rejected": 0,
    ...
  }
}
```

---

## Step 5: Set Up Admin Access

### Option A: Add Admin Flag to Existing User

```javascript
// Connect to MongoDB and run:
db.users.updateOne(
  { email: "your-admin-email@example.com" },
  { $set: { isAdmin: true } }
)
```

### Option B: Create New Admin User

When creating a user through signup, add the `isAdmin` field:

```javascript
// In your signup controller or database
{
  userId: "generated-id",
  email: "admin@campus.edu",
  name: "Admin User",
  isAdmin: true,  // Add this
  // ... other fields
}
```

---

## Step 6: Access Admin Dashboard

1. Login with admin account
2. Navigate to: `http://localhost:3000/admin/moderation`
3. You should see the moderation dashboard

**Note:** You need to add a route in your React app:

```typescript
// In your App.tsx or routes file
import ModerationDashboard from './pages/ModerationDashboard';

// Add route:
<Route path="/admin/moderation" element={<ModerationDashboard />} />
```

---

## Step 7: Test All Features

### ✅ Auto-Approval
- Upload clean product image
- Should auto-approve within 10 seconds

### ✅ Manual Review (Test if needed)
- Upload borderline image (will be rare)
- Check admin dashboard
- Should appear in pending queue

### ✅ User Reporting
- Add "Report" button to your product detail page
- Import `ReportImageButton` component
- Test reporting an image
- After 3 reports, image should auto-hide

### ✅ Strike System
- Reject an image from admin dashboard
- Check `userviolations` collection
- User should have 1 strike
- Try uploading 4 inappropriate images → Should result in ban

---

## Step 8: Production Deployment

### Environment Variables (Production)

```bash
# Vercel / Railway / Render
IMGBB_API_KEY=xxx
MONGODB_URI=xxx
GOOGLE_CLOUD_VISION_API_KEY=xxx
JWT_SECRET=xxx
# ... all other existing vars
```

### Build Commands

```bash
# Server (no changes needed)
npm start

# Client (no changes needed)
npm run build
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas connection string updated
- [ ] AI provider API key added
- [ ] Admin users created
- [ ] CORS configured for production domain
- [ ] Test upload flow in production
- [ ] Monitor logs for errors

---

## Troubleshooting

### Issue: "Cannot find module 'sharp'"

**Solution:**
```bash
cd campuskart-server
npm install sharp
```

### Issue: "AI provider not configured"

**Solution:**
- Add at least ONE AI provider API key to `.env`
- Restart server after adding

### Issue: Images not being moderated

**Check:**
1. Is server running? (`npm run dev`)
2. Is MongoDB connected?
3. Are AI API keys correct?
4. Check server console for errors

**Debug:**
```bash
# Check queue
GET http://localhost:5000/api/moderation/stats

# Check logs
tail -f server.log
```

### Issue: Queue not processing

**Solution:**
```bash
# Restart server
Ctrl+C
npm run dev
```

### Issue: Admin dashboard not loading

**Check:**
1. Is user marked as admin? (`isAdmin: true`)
2. Is route added to React app?
3. Check browser console for errors

---

## Configuration Options

### Adjust Moderation Strictness

Edit `campuskart-server/src/utils/aiModerationService.js`:

```javascript
const THRESHOLDS = {
  SAFE: {
    adult: 0.2,        // Lower = stricter (more manual review)
    violence: 0.2,
  },
  UNSAFE: {
    adult: 0.7,        // Lower = stricter (more auto-rejections)
    violence: 0.7,
  }
};
```

### Adjust Strike Penalties

Edit `campuskart-server/src/utils/enforcementSystem.js`:

```javascript
const ENFORCEMENT_THRESHOLDS = {
  WARNING: 1,
  TEMP_SUSPENSION_1: 2,
  TEMP_SUSPENSION_2: 3,
  PERMANENT_BAN: 4      // Change to 5 for more lenient
};
```

### Change Processing Speed

Edit `campuskart-server/src/utils/moderationQueue.js`:

```javascript
constructor() {
  this.concurrency = 3;  // Increase to process faster
  this.retryAttempts = 3;
  this.retryDelay = 5000;
}
```

---

## Verification Checklist

After installation, verify:

- [ ] Dependencies installed successfully
- [ ] Server starts without errors
- [ ] MongoDB collections created
- [ ] AI provider configured (at least one)
- [ ] Test image upload works
- [ ] Moderation queue processes images
- [ ] Admin dashboard accessible
- [ ] Report button works
- [ ] Strike system functional

---

## Next Steps

1. ✅ **Read Documentation**
   - `IMAGE_MODERATION_DOCUMENTATION.md` - Complete reference
   - `IMAGE_MODERATION_SETUP.md` - Detailed setup guide
   - `IMAGE_MODERATION_SUMMARY.md` - System overview

2. ✅ **Test Thoroughly**
   - Upload various types of images
   - Test all moderation flows
   - Verify strike system
   - Practice admin review

3. ✅ **Train Your Team**
   - Show admins the dashboard
   - Explain violation categories
   - Practice approval/rejection
   - Review moderation guidelines

4. ✅ **Monitor Performance**
   - Check queue processing
   - Monitor AI costs
   - Review moderation accuracy
   - Adjust thresholds as needed

---

## Support & Resources

### Documentation
- 📚 Complete Guide: `IMAGE_MODERATION_DOCUMENTATION.md`
- 🚀 Quick Setup: `IMAGE_MODERATION_SETUP.md`
- 📊 Summary: `IMAGE_MODERATION_SUMMARY.md`

### API Reference
```
GET  /api/moderation/pending          - Pending images
GET  /api/moderation/stats            - Statistics
GET  /api/moderation/:id              - Image details
POST /api/moderation/:id/approve      - Approve image
POST /api/moderation/:id/reject       - Reject image
POST /api/moderation/report/:itemId   - Report image
```

### Common Commands

```bash
# Install dependencies
npm install sharp axios

# Start development server
npm run dev

# Check moderation stats
curl http://localhost:5000/api/moderation/stats

# View MongoDB collections
mongo
use campus-kart
db.imagemoderations.find().pretty()
```

---

## Installation Complete! 🎉

Your image moderation system is now installed and ready to protect your marketplace.

**What's Working:**
✅ Image validation and preprocessing  
✅ AI-powered moderation  
✅ Asynchronous queue processing  
✅ Manual review dashboard  
✅ User reporting system  
✅ Strike and enforcement  
✅ Complete audit trail  

**Next:** Test the system thoroughly and train your moderation team!

For detailed usage, see `IMAGE_MODERATION_DOCUMENTATION.md`

---

**Need Help?**
- Check troubleshooting section above
- Review documentation files
- Examine server logs
- Verify environment variables
