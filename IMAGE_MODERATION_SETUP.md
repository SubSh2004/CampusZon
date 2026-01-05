# Image Moderation System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd campuszon-server
npm install sharp axios
```

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Required - Get free API key from https://imgbb.com/
IMGBB_API_KEY=your_imgbb_api_key

# AI Moderation Provider (Choose at least ONE)

# Option 1: Google Vision (Recommended - Easiest)
GOOGLE_CLOUD_VISION_API_KEY=your_google_api_key
# Get it: https://console.cloud.google.com/apis/credentials

# Option 2: AWS Rekognition (Advanced)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
# Setup: https://aws.amazon.com/rekognition/

# Option 3: OpenAI Vision (Most Expensive)
OPENAI_API_KEY=your_openai_key
# Get it: https://platform.openai.com/api-keys
```

### Step 3: Start Server

```bash
npm run dev
```

That's it! The moderation system is now active.

---

## ✅ Verify Installation

### Test 1: Upload an Image

```bash
# Upload a clean image via your app
# Check console logs for:
"Added job to queue. Queue size: 1"
"Processing moderation job: ..."
"✓ Moderation completed for job ...: AUTO_APPROVED"
```

### Test 2: Check Database

```bash
# Connect to MongoDB
# Check collections created:
- imagemoderations
- userviolations
- moderationauditlogs
```

### Test 3: Access Admin Dashboard

```bash
# Navigate to: http://localhost:3000/admin/moderation
# (Requires admin user - see below)
```

---

## 👤 Create Admin User

### Option 1: Via MongoDB

```javascript
// Connect to MongoDB and run:
db.users.updateOne(
  { email: "your-admin@email.com" },
  { $set: { isAdmin: true } }
);
```

### Option 2: Via Code (Recommended)

Add to your user model/registration:

```javascript
// In user.model.js or signup controller
{
  userId: "generated-id",
  email: "admin@campus.edu",
  isAdmin: true,  // Add this field
  // ... other fields
}
```

---

## 🎯 Testing the System

### Test Auto-Approval

Upload a clean product image:
- ✅ Should be approved within 5-10 seconds
- ✅ Should appear on the listing immediately

### Test Auto-Rejection

Upload an inappropriate image (for testing only!):
- ✅ Should be rejected
- ✅ User should receive a violation strike
- ✅ Check `userviolations` collection

### Test Manual Review

Upload a borderline image:
- ✅ Should be flagged for review
- ✅ Appears in admin dashboard
- ✅ Admin can approve/reject

### Test User Reporting

1. Create a listing with an image
2. Use "Report" button on another account
3. Check moderation dashboard
4. After 3 reports, image should auto-hide

### Test Strike System

```javascript
// Simulate violations:
1st violation → WARNING
2nd violation → 24h SUSPENSION
3rd violation → 7 day SUSPENSION
4th violation → PERMANENT BAN
```

---

## 📊 Monitor Performance

### Check Queue Status

```bash
# Add to your admin dashboard or use:
GET /api/moderation/stats
```

### Check Logs

```bash
# Server console should show:
"Added job to queue. Queue size: X"
"Processing moderation job: ..."
"✓ Moderation completed: AUTO_APPROVED"
```

### Database Queries

```javascript
// Check pending reviews
db.imagemoderations.find({ status: "REVIEWING" }).count()

// Check violations
db.userviolations.find({ accountStatus: { $ne: "ACTIVE" } })

// Check audit logs
db.moderationauditlogs.find().sort({ timestamp: -1 }).limit(10)
```

---

## ⚙️ Configuration Options

### Adjust Moderation Thresholds

Edit `campuszon-server/src/utils/aiModerationService.js`:

```javascript
const THRESHOLDS = {
  SAFE: {
    adult: 0.2,        // Lower = stricter (more to manual review)
    violence: 0.2,
    // ...
  },
  UNSAFE: {
    adult: 0.7,        // Lower = stricter (more auto-rejections)
    violence: 0.7,
    // ...
  }
};
```

### Adjust Strike Penalties

Edit `campuszon-server/src/utils/enforcementSystem.js`:

```javascript
const SEVERITY_STRIKES = {
  LOW: 0.5,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};

const ENFORCEMENT_THRESHOLDS = {
  WARNING: 1,
  TEMP_SUSPENSION_1: 2,
  TEMP_SUSPENSION_2: 3,
  PERMANENT_BAN: 4
};
```

### Change Queue Concurrency

Edit `campuszon-server/src/utils/moderationQueue.js`:

```javascript
class ModerationQueue {
  constructor() {
    this.concurrency = 3;  // Process N images simultaneously
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }
}
```

---

## 🔧 Troubleshooting

### Images Not Being Moderated

**Check:**
1. Is at least one AI provider configured?
2. Are API keys correct in `.env`?
3. Check server console for errors
4. Verify MongoDB connection

**Solution:**
```bash
# Restart server
npm run dev

# Check queue stats
GET /api/moderation/stats
```

### All Images Going to Manual Review

**Cause:** No AI provider configured

**Solution:**
Add at least one AI provider API key to `.env`

### Queue Processing Slow

**Solutions:**
1. Increase concurrency (default: 3)
2. Use faster AI provider (Google Vision is fastest)
3. Upgrade server resources
4. Check network latency to AI providers

### False Positives

**Solution:**
1. Adjust UNSAFE thresholds higher (e.g., 0.7 → 0.8)
2. Review and approve manually
3. Train AI with approved images (if using custom model)

---

## 🛡️ Security Best Practices

### 1. Secure Admin Dashboard

```javascript
// Require strong authentication
// Add role-based access control
// Log all admin actions
```

### 2. Rate Limiting

```javascript
// Add to server (optional)
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // Max 10 uploads per 15 min
});

app.use('/api/items', uploadLimiter);
```

### 3. API Key Security

```bash
# Never commit .env to git
# Use environment-specific keys
# Rotate keys periodically
```

### 4. HTTPS Only

```javascript
// In production, enforce HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## 📈 Scaling Considerations

### For High Traffic (1000+ uploads/day)

1. **Use Redis Queue** instead of in-memory queue
   ```bash
   npm install bull redis
   ```

2. **Separate Worker Processes**
   ```bash
   # Start multiple workers
   node worker1.js
   node worker2.js
   ```

3. **Use Cloud Storage**
   - AWS S3 instead of ImgBB
   - Cloudinary for optimization

4. **Database Optimization**
   - Add MongoDB indices (auto-created)
   - Use connection pooling
   - Consider sharding

5. **Caching**
   - Cache moderation results by image hash
   - Avoid re-processing duplicates

---

## 💰 Cost Estimation

### AI Provider Pricing (as of 2024)

**Google Vision API:**
- First 1,000 images/month: FREE
- Next 1M: $1.50 per 1,000 images
- **Recommended for startups**

**AWS Rekognition:**
- $1.00 per 1,000 images
- No free tier
- **Best for enterprise**

**OpenAI Vision:**
- ~$0.01 per image
- Most expensive
- **Use only for complex cases**

### Monthly Cost Examples

**Low traffic (100 images/day):**
- Google Vision: FREE
- AWS: $3/month
- OpenAI: $30/month

**Medium traffic (1,000 images/day):**
- Google Vision: $45/month
- AWS: $30/month
- OpenAI: $300/month

**High traffic (10,000 images/day):**
- Google Vision: $450/month
- AWS: $300/month
- OpenAI: $3,000/month

**💡 Recommendation:** Start with Google Vision (free tier), switch to AWS for scale.

---

## 📞 Support & Resources

### Documentation
- Full Documentation: `IMAGE_MODERATION_DOCUMENTATION.md`
- API Reference: See "API Endpoints" section
- Database Schema: See "Database Schema" section

### Common Issues

| Issue | Solution |
|-------|----------|
| Queue not processing | Restart server, check AI keys |
| Too many false positives | Adjust thresholds higher |
| Too many manual reviews | Configure AI provider |
| Slow processing | Increase concurrency |
| High costs | Use Google Vision, optimize queue |

### Next Steps

1. ✅ Test all features thoroughly
2. ✅ Train moderation team
3. ✅ Set up monitoring/alerts
4. ✅ Review and adjust thresholds
5. ✅ Plan for scaling

---

## 🎓 Training Your Moderation Team

### Admin Dashboard Training (30 min)

1. **Login to Dashboard**: Navigate to `/admin/moderation`
2. **Review Queue**: See pending images
3. **Examine AI Scores**: Understand confidence levels
4. **Check User History**: Review violator patterns
5. **Make Decisions**: Approve or reject with notes
6. **Monitor Stats**: Track performance metrics

### Moderation Guidelines

**Approve:**
- Clean product photos
- Appropriate room/property images
- Clear, relevant images

**Reject:**
- Inappropriate/sexual content
- Violence or disturbing images
- Hate symbols or offensive content
- Spam, memes, or irrelevant images
- Low quality or misleading images

**When in Doubt:**
- Check AI scores (>70% = likely inappropriate)
- Review user history (repeat offender?)
- Err on side of caution (reject if unsure)
- Add detailed notes for audit trail

---

## ✨ Optional Enhancements

### 1. Email Notifications

```javascript
// Notify users of violations
import { sendEmail } from './emailService.js';

await sendEmail({
  to: user.email,
  subject: 'Image Moderation Notice',
  body: `Your image was rejected: ${reasons.join(', ')}`
});
```

### 2. Appeal System

```javascript
// Allow users to appeal rejections
POST /api/moderation/appeal/:imageId
{
  reason: "This image was appropriate because..."
}
```

### 3. Automated Good Behavior

```javascript
// Cron job to reduce strikes
import cron from 'node-cron';

cron.schedule('0 0 * * *', async () => {
  // Run daily: reduce strikes for good users
  await reduceStrikesForGoodBehavior();
});
```

### 4. Advanced Analytics

```javascript
// Track metrics
- Average moderation time
- AI accuracy rate
- Moderator performance
- Violation trends
```

---

**Setup Complete!** 🎉

Your image moderation system is now protecting your marketplace from inappropriate content while maintaining a smooth user experience.

For detailed information, see `IMAGE_MODERATION_DOCUMENTATION.md`
