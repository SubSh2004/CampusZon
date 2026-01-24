/**
 * Migration Script: Optimize Existing Images
 * 
 * This script downloads all existing images from the database,
 * optimizes them using Sharp, and re-uploads them.
 */

import mongoose from 'mongoose';
import sharp from 'sharp';
import axios from 'axios';
import imgbbUploader from 'imgbb-uploader';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import Item model
const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageUrl: String,
  imageUrls: [String],
  category: String,
  available: Boolean,
  userId: String,
  userName: String,
  userEmail: String,
  emailDomain: String,
  moderationStatus: String,
}, { timestamps: true });

const Item = mongoose.model('Item', ItemSchema);

// Configuration
const CONFIG = {
  BATCH_SIZE: 5, // Process 5 items at a time to avoid rate limits
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds delay
  DRY_RUN: false, // Set to true to test without actually updating
};

// Statistics
const stats = {
  total: 0,
  processed: 0,
  optimized: 0,
  failed: 0,
  skipped: 0,
  totalSizeBefore: 0,
  totalSizeAfter: 0,
  errors: [],
};

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'CampusZon-Image-Optimizer/1.0'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download: ${error.message}`);
  }
}

/**
 * Optimize image using Sharp
 */
async function optimizeImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    const originalSize = buffer.length;

    // Check if already optimized (small and WebP)
    if (metadata.format === 'webp' && originalSize < 300000) {
      return { buffer: null, alreadyOptimized: true, originalSize };
    }

    // Optimize: resize to 1200px max and convert to WebP
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    const optimizedSize = optimizedBuffer.length;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    return {
      buffer: optimizedBuffer,
      alreadyOptimized: false,
      originalSize,
      optimizedSize,
      reduction,
      format: metadata.format,
    };
  } catch (error) {
    throw new Error(`Optimization failed: ${error.message}`);
  }
}

/**
 * Upload optimized image to ImgBB
 */
async function uploadImage(buffer, originalName) {
  try {
    const base64Image = buffer.toString('base64');
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: base64Image,
      name: `optimized-${Date.now()}-${originalName}`,
    });
    return response.url;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Process a single image URL
 */
async function processImageUrl(url, index) {
  try {
    console.log(`  [${index + 1}] Downloading image...`);
    const buffer = await downloadImage(url);

    console.log(`  [${index + 1}] Optimizing image (${(buffer.length / 1024).toFixed(0)}KB)...`);
    const result = await optimizeImage(buffer);

    if (result.alreadyOptimized) {
      console.log(`  [${index + 1}] ✓ Already optimized (${(result.originalSize / 1024).toFixed(0)}KB)`);
      stats.skipped++;
      return { url, optimized: false };
    }

    stats.totalSizeBefore += result.originalSize;
    stats.totalSizeAfter += result.optimizedSize;

    console.log(`  [${index + 1}] Uploading optimized image (${(result.optimizedSize / 1024).toFixed(0)}KB, ${result.reduction}% smaller)...`);
    const newUrl = await uploadImage(result.buffer, `image-${index}.webp`);

    console.log(`  [${index + 1}] ✓ Optimized: ${result.format.toUpperCase()} ${(result.originalSize / 1024).toFixed(0)}KB → WebP ${(result.optimizedSize / 1024).toFixed(0)}KB (${result.reduction}% reduction)`);
    stats.optimized++;

    return { url: newUrl, optimized: true };
  } catch (error) {
    console.error(`  [${index + 1}] ✗ Error: ${error.message}`);
    stats.failed++;
    stats.errors.push({ url, error: error.message });
    return { url, optimized: false, error: error.message };
  }
}

/**
 * Process a single item
 */
async function processItem(item) {
  console.log(`\n📦 Processing: ${item.title} (ID: ${item._id})`);
  
  const imagesToProcess = [];
  
  // Collect all image URLs
  if (item.imageUrls && item.imageUrls.length > 0) {
    imagesToProcess.push(...item.imageUrls);
  } else if (item.imageUrl) {
    imagesToProcess.push(item.imageUrl);
  }

  if (imagesToProcess.length === 0) {
    console.log('  ⚠️  No images to process');
    stats.skipped++;
    return;
  }

  console.log(`  Processing ${imagesToProcess.length} image(s)...`);

  // Process all images
  const results = await Promise.all(
    imagesToProcess.map((url, index) => processImageUrl(url, index))
  );

  // Check if any were actually optimized
  const optimizedResults = results.filter(r => r.optimized);
  
  if (optimizedResults.length === 0) {
    console.log('  ℹ️  No optimization needed');
    return;
  }

  // Update database
  if (!CONFIG.DRY_RUN) {
    const newImageUrls = results.map(r => r.url);
    const newImageUrl = newImageUrls[0];

    await Item.updateOne(
      { _id: item._id },
      {
        $set: {
          imageUrl: newImageUrl,
          imageUrls: newImageUrls,
        }
      }
    );

    console.log('  ✅ Database updated with optimized URLs');
  } else {
    console.log('  🧪 DRY RUN - Database not updated');
  }

  stats.processed++;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main migration function
 */
async function migrateImages() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Image Optimization Migration Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (CONFIG.DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No database changes will be made\n');
  }

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Verify ImgBB API key
    if (!process.env.IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY not found in environment variables');
    }
    console.log('✅ ImgBB API key found\n');

    // Fetch all items with images
    console.log('🔍 Fetching items from database...');
    const items = await Item.find({
      $or: [
        { imageUrl: { $exists: true, $ne: null } },
        { imageUrls: { $exists: true, $ne: [] } }
      ]
    }).sort({ createdAt: -1 });

    stats.total = items.length;
    console.log(`✅ Found ${stats.total} items with images\n`);

    if (stats.total === 0) {
      console.log('ℹ️  No items to process');
      return;
    }

    // Process items in batches
    console.log(`⚙️  Processing in batches of ${CONFIG.BATCH_SIZE}...\n`);
    
    for (let i = 0; i < items.length; i += CONFIG.BATCH_SIZE) {
      const batch = items.slice(i, i + CONFIG.BATCH_SIZE);
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(items.length / CONFIG.BATCH_SIZE);

      console.log(`\n┌─────────────────────────────────────────┐`);
      console.log(`│ Batch ${batchNum}/${totalBatches} (Items ${i + 1}-${Math.min(i + CONFIG.BATCH_SIZE, items.length)})       │`);
      console.log(`└─────────────────────────────────────────┘`);

      for (const item of batch) {
        await processItem(item);
      }

      // Delay between batches to avoid rate limits
      if (i + CONFIG.BATCH_SIZE < items.length) {
        console.log(`\n⏸️  Waiting ${CONFIG.DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }

    // Print final statistics
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Complete - Statistics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total items:           ${stats.total}`);
    console.log(`Items processed:       ${stats.processed}`);
    console.log(`Images optimized:      ${stats.optimized}`);
    console.log(`Already optimized:     ${stats.skipped}`);
    console.log(`Failed:                ${stats.failed}\n`);

    if (stats.optimized > 0) {
      const totalReduction = ((1 - stats.totalSizeAfter / stats.totalSizeBefore) * 100).toFixed(1);
      console.log(`Total size before:     ${(stats.totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total size after:      ${(stats.totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total reduction:       ${totalReduction}%`);
      console.log(`Space saved:           ${((stats.totalSizeBefore - stats.totalSizeAfter) / 1024 / 1024).toFixed(2)} MB\n`);
    }

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.error}`);
        console.log(`   URL: ${err.url.substring(0, 60)}...`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration script completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run migration
migrateImages().catch(console.error);
