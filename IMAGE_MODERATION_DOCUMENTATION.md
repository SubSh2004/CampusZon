# Image Moderation System - Complete Documentation

## 🎯 Overview

This document describes the comprehensive image moderation system implemented for CampusZon marketplace. The system prevents inappropriate, offensive, or harmful images from appearing on the platform while allowing human oversight and enforcing penalties for repeat offenders.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Image Upload Flow](#image-upload-flow)
5. [AI Moderation](#ai-moderation)
6. [Manual Review System](#manual-review-system)
7. [User Reporting](#user-reporting)
8. [Strike & Enforcement](#strike--enforcement)
9. [Configuration & Setup](#configuration--setup)
10. [Security & Compliance](#security--compliance)

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│   User      │
│  Uploads    │
│   Image     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Image Validation           │
│  - Format check             │
│  - Size limits              │
│  - EXIF removal             │
│  - Hash generation          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Temp Storage (ImgBB)       │
│  - Private upload           │
│  - Not yet public           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Moderation Queue           │
│  - Async processing         │
│  - Retry logic              │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  AI Moderation Service      │
│  - Google Vision API        │
│  - AWS Rekognition          │
│  - OpenAI Vision            │
└──────┬──────────────────────┘
       │
       ├──► AUTO_APPROVED ──► Public Storage
       │
       ├──► MANUAL_REVIEW ──► Admin Dashboard
       │
       └──► AUTO_REJECTED ──► Strike System
```

---

## 🗄️ Database Schema

### 1. ImageModeration Collection

```javascript
{
  _id: ObjectId,
  imageUrl: String,              // Public URL (after approval)
  tempImageUrl: String,           // Temporary URL
  imageHash: String,              // Perceptual hash for duplicates
  itemId: ObjectId,               // Reference to item
  userId: String,                 // Uploader ID
  status: Enum,                   // PENDING, APPROVED, REJECTED, FLAGGED, REVIEWING
  
  aiScores: {
    adult: Number,                // 0-1 scores
    violence: Number,
    racy: Number,
    nudity: Number,
    explicitNudity: Number,
    suggestive: Number,
    drugs: Number,
    weapons: Number,
    hate: Number,
    gambling: Number,
    relevance: Number,
    qualityScore: Number
  },
  
  aiProvider: Enum,               // GOOGLE_VISION, AWS_REKOGNITION, etc.
  detectedLabels: [String],       // Detected objects
  moderationDecision: Enum,       // AUTO_APPROVED, AUTO_REJECTED, MANUAL_REVIEW_REQUIRED
  rejectionReasons: [Enum],       // Specific violation types
  
  manualReview: {
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,
    finalDecision: Enum
  },
  
  reportCount: Number,
  reports: [{
    reportedBy: String,
    reportedAt: Date,
    reason: Enum,
    comments: String
  }],
  
  imageMetadata: {
    width: Number,
    height: Number,
    format: String,
    size: Number,
    hasEXIF: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. UserViolation Collection

```javascript
{
  _id: ObjectId,
  userId: String (unique),
  
  totalViolations: Number,
  activeStrikes: Number,          // Current penalty strikes
  lifetimeStrikes: Number,        // Total ever received
  
  accountStatus: Enum,            // ACTIVE, WARNING, SUSPENDED, BANNED
  
  suspendedUntil: Date,
  suspensionReason: String,
  
  permanentlyBanned: Boolean,
  banReason: String,
  bannedAt: Date,
  
  violations: [{
    violationId: ObjectId,
    imageId: ObjectId,
    itemId: ObjectId,
    violationType: Enum,
    severity: Enum,               // LOW, MEDIUM, HIGH, CRITICAL
    action: Enum,                 // WARNING, IMAGE_REMOVED, SUSPENSION, BAN
    strikesAdded: Number,
    description: String,
    detectedAt: Date,
    actedBy: String
  }],
  
  stats: {
    totalImagesUploaded: Number,
    imagesRejected: Number,
    imagesReported: Number,
    rejectionRate: Number,
    lastViolationDate: Date
  },
  
  goodBehaviorDays: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. ModerationAuditLog Collection (Immutable)

```javascript
{
  _id: ObjectId,
  action: Enum,                   // IMAGE_UPLOADED, AUTO_APPROVED, etc.
  imageId: ObjectId,
  itemId: ObjectId,
  userId: String,
  actorType: Enum,                // SYSTEM, AI, ADMIN, USER
  actorId: String,
  
  details: {
    previousStatus: String,
    newStatus: String,
    reason: String,
    aiScores: Object,
    moderatorNotes: String,
    metadata: Object
  },
  
  ipAddress: String,
  userAgent: String,
  timestamp: Date (immutable)
}
```

---

## 🔌 API Endpoints

### Admin Endpoints (Require Admin Auth)

```
GET    /api/moderation/pending
       - Get images pending manual review
       - Query: page, limit, status
       - Returns: paginated list of images

GET    /api/moderation/:imageId
       - Get detailed moderation info
       - Returns: moderation record, user stats, audit logs

POST   /api/moderation/:imageId/approve
       - Manually approve an image
       - Body: { notes: string }

POST   /api/moderation/:imageId/reject
       - Manually reject an image
       - Body: { reasons: string[], notes: string, addViolation: boolean }

GET    /api/moderation/stats
       - Get moderation statistics
       - Returns: counts, recent activity, top violators

GET    /api/moderation/:imageId/preview
       - Get blurred preview for moderator safety
       - Query: blur=true/false

GET    /api/moderation/audit-logs
       - Get audit logs
       - Query: page, limit, action, userId, startDate, endDate
```

### User Endpoints (Require Auth)

```
POST   /api/moderation/report/:itemId
       - Report an inappropriate image
       - Body: { imageUrl: string, reason: enum, comments: string }
```

---

## 📤 Image Upload Flow

### 1. User Initiates Upload

```javascript
// Frontend
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('title', 'Item Title');
formData.append('category', 'Electronics');
// ... other fields

await axios.post('/api/items', formData);
```

### 2. Backend Processing

```javascript
// Controller: createItem
1. Check user enforcement status (banned/suspended?)
2. Validate form data
3. Upload images to TEMP storage (ImgBB)
4. Create item WITHOUT images
5. Queue each image for moderation
6. Return success (item created, images pending)
```

### 3. Moderation Queue Processing

```javascript
// moderationQueue.js
For each image:
  1. Validate format, size, quality
  2. Remove EXIF metadata
  3. Generate perceptual hash
  4. Call AI moderation service
  5. Calculate category relevance
  6. Make decision (APPROVE/REJECT/REVIEW)
  7. Save moderation record
  8. Create audit log
  9. Execute decision:
     - APPROVE: Upload to public storage, add to item
     - REJECT: Record violation, notify user
     - REVIEW: Flag for admin review
```

---

## 🤖 AI Moderation

### Supported Providers

1. **Google Cloud Vision API** (Priority 1)
   - SafeSearch Detection
   - Label Detection
   - Web Detection

2. **AWS Rekognition** (Priority 2)
   - Content Moderation
   - Object Detection

3. **OpenAI Vision GPT-4** (Priority 3)
   - Advanced reasoning
   - Context understanding

### Configuration

```bash
# .env
GOOGLE_CLOUD_VISION_API_KEY=your_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
OPENAI_API_KEY=your_key
```

### Moderation Thresholds

```javascript
// Adjust in aiModerationService.js
THRESHOLDS = {
  SAFE: {      // Below these = auto approve
    adult: 0.2,
    violence: 0.2,
    nudity: 0.15,
    explicitNudity: 0.1,
    // ...
  },
  UNSAFE: {    // Above these = auto reject
    adult: 0.7,
    violence: 0.7,
    nudity: 0.6,
    explicitNudity: 0.4,
    // ...
  }
}
```

### Decision Logic

```
Score < SAFE threshold     → AUTO_APPROVED
SAFE < Score < UNSAFE      → MANUAL_REVIEW_REQUIRED
Score ≥ UNSAFE threshold   → AUTO_REJECTED
```

---

## 👨‍💼 Manual Review System

### Admin Dashboard Access

```
Navigate to: /admin/moderation
```

### Review Interface Features

- **Blurred Previews**: Protect moderators from harmful content
- **AI Scores Display**: See confidence levels for each category
- **User History**: View violator's past behavior
- **Quick Actions**: Approve/Reject with notes
- **Audit Trail**: All actions logged

### Review Process

1. Admin sees pending images
2. Clicks image to see details
3. Reviews AI scores and detected labels
4. Checks user violation history
5. Decides: Approve or Reject
6. Adds moderator notes
7. For rejections: Choose violation type
8. System auto-applies enforcement

---

## 🚨 User Reporting

### How It Works

1. User sees inappropriate image
2. Clicks "Report" button
3. Selects reason from list
4. Optionally adds comments
5. Report logged in database

### Auto-Hiding Threshold

```javascript
// moderation.controller.js
const REPORT_THRESHOLD = 3;

if (reportCount >= REPORT_THRESHOLD) {
  - Image automatically hidden
  - Flagged for manual review
  - Violation recorded for uploader
}
```

### Report Reasons

- INAPPROPRIATE
- PORNOGRAPHIC
- VIOLENT
- OFFENSIVE
- FAKE
- SPAM

---

## ⚖️ Strike & Enforcement

### Strike System

```javascript
Severity Levels:
- LOW:      0.5 strikes
- MEDIUM:   1.0 strikes
- HIGH:     2.0 strikes
- CRITICAL: 3.0 strikes
```

### Enforcement Actions

```
1 strike    → WARNING
2 strikes   → 24-hour suspension
3 strikes   → 7-day suspension
4+ strikes  → PERMANENT BAN
```

### Violation Types & Severity

```javascript
CRITICAL: Pornography, Gore, Hate Symbols
HIGH:     Nudity, Violence, Weapons, Drugs
MEDIUM:   Spam, Misleading, Inappropriate
LOW:      Minor quality issues
```

### Good Behavior Rewards

```javascript
// Every 30 days without violations:
- Reduce active strikes by 0.5
- Reset to ACTIVE status when strikes = 0
```

### User Upload Restrictions

```javascript
// Before allowing upload:
1. Check if permanently banned → BLOCK
2. Check if suspended → BLOCK (show suspension end date)
3. Check if warned → ALLOW (but show warning)
4. Otherwise → ALLOW
```

---

## ⚙️ Configuration & Setup

### 1. Install Dependencies

```bash
cd campuszon-server
npm install sharp axios @aws-sdk/client-rekognition
```

### 2. Environment Variables

```bash
# Required
IMGBB_API_KEY=your_imgbb_key
MONGODB_URI=your_mongodb_uri

# AI Providers (at least one recommended)
GOOGLE_CLOUD_VISION_API_KEY=your_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
OPENAI_API_KEY=your_key
```

### 3. Database Setup

```bash
# No migration needed - collections created automatically
# Ensure MongoDB is running
```

### 4. Start Server

```bash
npm run dev
```

### 5. Admin Access Setup

```javascript
// Add admin flag to user model
// In user.model.js or during user creation:
{
  userId: "admin123",
  isAdmin: true,  // Add this field
  // ... other fields
}
```

---

## 🔒 Security & Compliance

### Image Privacy

✅ **Temp Storage**: Images uploaded to temporary private URLs  
✅ **No Public Access**: Until approved  
✅ **EXIF Removal**: All metadata stripped for privacy  
✅ **Hash Generation**: Detect duplicate uploads  

### Moderator Protection

✅ **Blurred Previews**: Default blur on harmful content  
✅ **Toggle Option**: Moderators can un-blur when needed  
✅ **Batch Processing**: Limit exposure time  

### Audit Compliance

✅ **Immutable Logs**: Audit logs cannot be modified  
✅ **Complete Trail**: Every action tracked  
✅ **IP Logging**: Track who did what  
✅ **Export Capability**: Logs can be exported if required  

### Child Safety

✅ **Zero Tolerance**: CRITICAL severity for explicit content  
✅ **Instant Rejection**: Auto-reject above unsafe thresholds  
✅ **Permanent Bans**: Repeat offenders permanently banned  
✅ **Legal Compliance**: System designed for CSAM prevention  

### Data Retention

```javascript
// Recommendations:
- Keep audit logs forever (immutable)
- Keep violation records for banned users (legal protection)
- Archive approved images after item deletion (optional)
- Permanently delete rejected images after 90 days
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

```javascript
// Dashboard Stats
- Pending reviews count
- Auto-approval rate
- Auto-rejection rate
- Manual review rate
- Average review time
- Top violation types
- User ban rate
- Report accuracy (false positives)
```

### Performance Optimization

```javascript
// Moderation Queue
- Concurrency: 3 images simultaneously
- Retry attempts: 3 with exponential backoff
- Timeout: 30 seconds per AI call
- Batch processing: Process queue continuously
```

### Recommended Monitoring Tools

- Datadog / New Relic: API performance
- Sentry: Error tracking
- MongoDB Atlas: Database metrics
- CloudWatch (AWS): Rekognition usage

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload clean image → Should auto-approve
- [ ] Upload inappropriate image → Should auto-reject
- [ ] Upload borderline image → Should flag for review
- [ ] Report image 3 times → Should auto-hide
- [ ] Get 1 violation → Should warn user
- [ ] Get 2 violations → Should suspend 24h
- [ ] Get 4 violations → Should permanently ban
- [ ] Admin approve image → Should add to item
- [ ] Admin reject image → Should record violation

### Load Testing

```bash
# Test queue with 100 concurrent uploads
# Monitor:
- Queue processing time
- Database connection pool
- Memory usage
- API response times
```

---

## 🚀 Deployment Checklist

- [ ] Configure AI provider API keys
- [ ] Set up MongoDB with proper indices
- [ ] Enable CORS for admin dashboard
- [ ] Configure ImgBB or alternative storage
- [ ] Set up admin user accounts
- [ ] Test email notifications (optional)
- [ ] Monitor error logs after deployment
- [ ] Set up alerts for queue failures
- [ ] Document admin procedures
- [ ] Train moderation team

---

## 📝 Admin Procedures

### Daily Tasks

1. Review pending images (target: < 2 hours turnaround)
2. Check for false positives
3. Monitor top violators
4. Review appeal requests (if implemented)

### Weekly Tasks

1. Review moderation statistics
2. Adjust AI thresholds if needed
3. Ban repeat offenders
4. Export audit logs for compliance

### Monthly Tasks

1. Reduce strikes for good behavior users
2. Review and update violation policies
3. Analyze AI accuracy
4. Update documentation

---

## 🛠️ Troubleshooting

### Queue Not Processing

```bash
# Check queue stats
GET /api/moderation/stats

# Restart server to reset queue
npm run dev
```

### AI Provider Failures

```javascript
// System automatically falls back to next provider
// Check logs for error messages
// Verify API keys in .env
```

### False Positives

```javascript
// Adjust thresholds in aiModerationService.js
// Lower UNSAFE threshold to reduce auto-rejections
// More images will go to manual review
```

### Database Performance

```bash
# Add indices (automatically added on first run)
# Monitor slow queries
# Consider upgrading MongoDB tier
```

---

## 📚 Additional Resources

- [Google Vision API Docs](https://cloud.google.com/vision/docs)
- [AWS Rekognition Docs](https://docs.aws.amazon.com/rekognition/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [ImgBB API Docs](https://api.imgbb.com/)

---

## 📄 License & Legal

This moderation system is designed to comply with:
- COPPA (Children's Online Privacy Protection Act)
- GDPR (General Data Protection Regulation)
- DMCA (Digital Millennium Copyright Act)
- Platform-specific content policies

**Disclaimer**: This system provides automated assistance but should not replace human judgment. Always have trained moderators review flagged content.

---

## 🤝 Support

For issues or questions:
1. Check troubleshooting section
2. Review audit logs
3. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: CampusZon Development Team
