# Optimize Existing Images - Migration Guide

## Overview

This migration script optimizes all existing images in the database that were uploaded before the image optimization feature was implemented.

## What It Does

1. ✅ Fetches all items with images from database
2. ✅ Downloads each image from ImgBB
3. ✅ Optimizes using Sharp (resize to 1200px, convert to WebP, 85% quality)
4. ✅ Uploads optimized version back to ImgBB
5. ✅ Updates database with new URLs
6. ✅ Provides detailed statistics and progress

## Before Running

### 1. Install Dependencies
```bash
cd campuszon-server
npm install axios
```
### 2. Verify Environment
Check that `.env` contains:
- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `IMGBB_API_KEY` - ImgBB API key

### 3. Test First (Dry Run)
Edit the script to enable dry run mode:
```javascript
// In optimizeExistingImages.js, line 40
const CONFIG = {
  BATCH_SIZE: 5,
  DELAY_BETWEEN_BATCHES: 2000,
  DRY_RUN: true, // Change this to true for testing
};
```

## Running the Migration

### Option 1: Dry Run (Recommended First)
Test without making changes:
```bash
cd campuszon-server
node scripts/optimizeExistingImages.js
```

This will:
- Download and optimize images
- Show what would be changed
- NOT update the database

### Option 2: Full Migration
After verifying dry run works:

1. Edit script to disable dry run:
   ```javascript
   DRY_RUN: false,
   ```

2. Run migration:
   ```bash
   node scripts/optimizeExistingImages.js
   ```

## Configuration Options

Edit these in the script (line 40):

```javascript
const CONFIG = {
  BATCH_SIZE: 5,           // Items per batch (5 recommended)
  DELAY_BETWEEN_BATCHES: 2000,  // 2 seconds between batches
  DRY_RUN: false,          // true = test only, false = actually update
};
```

### Adjust for Your Needs

**Fast (more API calls):**
```javascript
BATCH_SIZE: 10,
DELAY_BETWEEN_BATCHES: 1000,
```

**Slow & safe (avoid rate limits):**
```javascript
BATCH_SIZE: 3,
DELAY_BETWEEN_BATCHES: 5000,
```

## Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Image Optimization Migration Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to MongoDB...
✅ Connected to MongoDB

✅ ImgBB API key found

🔍 Fetching items from database...
✅ Found 47 items with images

⚙️  Processing in batches of 5...

┌─────────────────────────────────────────┐
│ Batch 1/10 (Items 1-5)                  │
└─────────────────────────────────────────┘

📦 Processing: iPhone 13 Pro (ID: 67890...)
  Processing 3 image(s)...
  [1] Downloading image...
  [1] Optimizing image (3200KB)...
  [1] Uploading optimized image (145KB, 95.5% smaller)...
  [1] ✓ Optimized: JPEG 3200KB → WebP 145KB (95.5% reduction)
  [2] Downloading image...
  [2] Optimizing image (2800KB)...
  [2] Uploading optimized image (132KB, 95.3% smaller)...
  [2] ✓ Optimized: JPEG 2800KB → WebP 132KB (95.3% reduction)
  [3] Already optimized (85KB)
  ✅ Database updated with optimized URLs

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Migration Complete - Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total items:           47
Items processed:       45
Images optimized:      132
Already optimized:     8
Failed:                2

Total size before:     456.78 MB
Total size after:      18.92 MB
Total reduction:       95.9%
Space saved:           437.86 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Migration script completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## What to Expect

### Performance
- **Small database (10-50 items):** ~2-5 minutes
- **Medium database (50-200 items):** ~10-30 minutes
- **Large database (200+ items):** ~30-60+ minutes

### Results
- **Average reduction:** 95-97% smaller images
- **Space saved:** 400-500 MB per 100 images
- **Format change:** All images → WebP
- **Max size:** 1200×1200 pixels

## Troubleshooting

### Error: "Failed to download"
**Cause:** Image URL is broken or inaccessible
**Solution:** Script will skip and continue with next image

### Error: "Upload failed"
**Cause:** ImgBB rate limit or API issue
**Solution:** 
- Increase `DELAY_BETWEEN_BATCHES` to 5000
- Reduce `BATCH_SIZE` to 3
- Wait and retry later

### Error: "IMGBB_API_KEY not found"
**Cause:** Missing environment variable
**Solution:** Add to `.env` file:
```
IMGBB_API_KEY=your_api_key_here
```

### Error: "Cannot connect to MongoDB"
**Cause:** Wrong MONGODB_URI or network issue
**Solution:** Verify `.env` has correct MongoDB connection string

### Migration stopped mid-way
**Solution:** Just run again - script skips already optimized images

## After Migration

### 1. Verify Results
```bash
# Check a few items in the database
# Images should now be WebP format and much smaller
```

### 2. Test Website
- Open Home page
- Check that all images load correctly
- Verify images are WebP format in DevTools

### 3. Monitor Performance
- Page load should be much faster
- Network tab should show smaller image sizes
- No broken images

## Rollback Plan

If something goes wrong:

### Option 1: Keep Old URLs
The old image URLs on ImgBB are still valid! Just restore from database backup.

### Option 2: Re-run Migration
If some images failed, just run the script again:
- It skips already-optimized images
- Only processes failed ones

## FAQ

**Q: Will this delete old images?**
A: No! Old images remain on ImgBB. Only database URLs are updated.

**Q: What if migration fails halfway?**
A: Just run again. Script skips already-optimized images.

**Q: Can I run this multiple times?**
A: Yes! Safe to run multiple times. Already-optimized images are skipped.

**Q: How much will this cost?**
A: ImgBB is free for reasonable use. This uses their API to upload optimized versions.

**Q: Will users see broken images during migration?**
A: No! Old URLs remain valid. Migration only adds new optimized URLs.

**Q: How do I stop mid-migration?**
A: Press Ctrl+C. Safe to stop anytime. Resume by running again.

## Performance Tips

1. **Run during off-peak hours** (late night/early morning)
2. **Monitor server resources** (CPU, memory, network)
3. **Start with dry run** to verify everything works
4. **Use conservative batch settings** for first run
5. **Keep terminal open** to monitor progress

## Success Metrics

After migration, you should see:
- ✅ 95%+ size reduction
- ✅ All images in WebP format
- ✅ Faster page loads
- ✅ Lower bandwidth usage
- ✅ No broken images
- ✅ Better user experience

## Example Commands

### Dry run first (test only)
```bash
cd campuszon-server
# Edit script: DRY_RUN: true
node scripts/optimizeExistingImages.js
```

### Full migration
```bash
cd campuszon-server
# Edit script: DRY_RUN: false
node scripts/optimizeExistingImages.js
```

### Run with logging
```bash
node scripts/optimizeExistingImages.js | tee migration.log
```

---

## Ready to Migrate?

1. ✅ Verified `.env` has MONGODB_URI and IMGBB_API_KEY
2. ✅ Tested with dry run (DRY_RUN: true)
3. ✅ Reviewed output and statistics
4. ✅ Changed to DRY_RUN: false
5. ✅ Ready to run full migration

**Run command:**
```bash
cd campuszon-server
node scripts/optimizeExistingImages.js
```

Good luck! 🚀
