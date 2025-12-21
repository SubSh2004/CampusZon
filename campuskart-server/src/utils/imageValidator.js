import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Image Validation and Preprocessing Utilities
 * Handles validation, sanitization, and preprocessing of uploaded images
 */

// Configuration constants
const CONFIG = {
  ALLOWED_FORMATS: ['jpeg', 'jpg', 'png', 'webp'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 4000,
  MAX_HEIGHT: 4000,
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  THUMBNAIL_SIZE: 300,
  QUALITY: 85,
  BLUR_PREVIEW_RADIUS: 20 // For moderator safety
};

/**
 * Validates image file before processing
 * @param {Buffer} buffer - Image buffer
 * @param {Object} file - File metadata from multer
 * @returns {Object} - { valid: boolean, error: string, warnings: string[] }
 */
export async function validateImage(buffer, file) {
  const result = {
    valid: true,
    error: null,
    warnings: []
  };

  try {
    // Check file size
    if (buffer.length > CONFIG.MAX_FILE_SIZE) {
      result.valid = false;
      result.error = `File size exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`;
      return result;
    }

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Validate format
    if (!CONFIG.ALLOWED_FORMATS.includes(metadata.format)) {
      result.valid = false;
      result.error = `Invalid format. Allowed: ${CONFIG.ALLOWED_FORMATS.join(', ')}`;
      return result;
    }

    // Block animated images
    if (metadata.pages && metadata.pages > 1) {
      result.valid = false;
      result.error = 'Animated images are not allowed';
      return result;
    }

    // Validate dimensions
    if (metadata.width > CONFIG.MAX_WIDTH || metadata.height > CONFIG.MAX_HEIGHT) {
      result.warnings.push(`Image will be resized from ${metadata.width}x${metadata.height} to fit within ${CONFIG.MAX_WIDTH}x${CONFIG.MAX_HEIGHT}`);
    }

    if (metadata.width < CONFIG.MIN_WIDTH || metadata.height < CONFIG.MIN_HEIGHT) {
      result.valid = false;
      result.error = `Image too small. Minimum size: ${CONFIG.MIN_WIDTH}x${CONFIG.MIN_HEIGHT}`;
      return result;
    }

    // Check for corruption
    if (!metadata.width || !metadata.height) {
      result.valid = false;
      result.error = 'Corrupted or invalid image file';
      return result;
    }

    // Warn about EXIF data
    if (metadata.exif || metadata.xmp || metadata.iptc) {
      result.warnings.push('Image contains metadata that will be removed for privacy');
    }

  } catch (error) {
    result.valid = false;
    result.error = 'Unable to process image file: ' + error.message;
  }

  return result;
}

/**
 * Preprocesses image: removes EXIF, resizes if needed, optimizes
 * @param {Buffer} buffer - Original image buffer
 * @returns {Object} - { buffer: Buffer, metadata: Object }
 */
export async function preprocessImage(buffer) {
  try {
    let sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Remove all metadata (EXIF, XMP, IPTC)
    sharpInstance = sharpInstance.withMetadata({
      exif: {},
      icc: 'srgb' // Keep color profile for consistency
    });

    // Resize if exceeds max dimensions
    if (metadata.width > CONFIG.MAX_WIDTH || metadata.height > CONFIG.MAX_HEIGHT) {
      sharpInstance = sharpInstance.resize(CONFIG.MAX_WIDTH, CONFIG.MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Auto-rotate based on EXIF orientation (before stripping EXIF)
    sharpInstance = sharpInstance.rotate();

    // Optimize and convert to JPEG for consistency
    const processedBuffer = await sharpInstance
      .jpeg({ quality: CONFIG.QUALITY, progressive: true })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: processedBuffer.data,
      metadata: {
        format: processedBuffer.info.format,
        width: processedBuffer.info.width,
        height: processedBuffer.info.height,
        size: processedBuffer.data.length,
        hasEXIF: false
      }
    };

  } catch (error) {
    throw new Error('Image preprocessing failed: ' + error.message);
  }
}

/**
 * Generates a perceptual hash for duplicate detection
 * @param {Buffer} buffer - Image buffer
 * @returns {string} - Hash string
 */
export async function generateImageHash(buffer) {
  try {
    // Resize to 8x8 and convert to grayscale for perceptual hashing
    const resized = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    // Calculate average
    const avg = resized.reduce((sum, val) => sum + val, 0) / resized.length;

    // Generate hash based on whether each pixel is above or below average
    let hash = '';
    for (let i = 0; i < resized.length; i++) {
      hash += resized[i] >= avg ? '1' : '0';
    }

    return hash;

  } catch (error) {
    // Fallback to content hash
    return crypto.createHash('md5').update(buffer).digest('hex');
  }
}

/**
 * Creates a blurred preview for moderator safety
 * @param {Buffer} buffer - Image buffer
 * @returns {Buffer} - Blurred image buffer
 */
export async function createBlurredPreview(buffer) {
  try {
    return await sharp(buffer)
      .resize(800, 600, { fit: 'inside' })
      .blur(CONFIG.BLUR_PREVIEW_RADIUS)
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    throw new Error('Failed to create blurred preview: ' + error.message);
  }
}

/**
 * Creates a thumbnail
 * @param {Buffer} buffer - Image buffer
 * @returns {Buffer} - Thumbnail buffer
 */
export async function createThumbnail(buffer) {
  try {
    return await sharp(buffer)
      .resize(CONFIG.THUMBNAIL_SIZE, CONFIG.THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    throw new Error('Failed to create thumbnail: ' + error.message);
  }
}

/**
 * Analyzes image quality
 * @param {Buffer} buffer - Image buffer
 * @returns {Object} - Quality metrics
 */
export async function analyzeImageQuality(buffer) {
  try {
    const stats = await sharp(buffer).stats();
    const metadata = await sharp(buffer).metadata();

    // Calculate sharpness (based on channel variance)
    const channelVariances = stats.channels.map(c => {
      const mean = c.mean;
      return c.stdev / (mean || 1);
    });
    const averageVariance = channelVariances.reduce((a, b) => a + b, 0) / channelVariances.length;

    // Quality score (0-1)
    const qualityScore = Math.min(
      1,
      (averageVariance / 100) * // Sharpness factor
      (Math.min(metadata.width, 1920) / 1920) * // Resolution factor
      (metadata.density ? metadata.density / 300 : 1) // DPI factor
    );

    return {
      score: qualityScore,
      width: metadata.width,
      height: metadata.height,
      sharpness: averageVariance,
      isLowQuality: qualityScore < 0.3
    };

  } catch (error) {
    return {
      score: 0.5,
      isLowQuality: false,
      error: error.message
    };
  }
}

/**
 * Detects if image is a screenshot or screen capture
 * @param {Buffer} buffer - Image buffer
 * @returns {boolean} - True if likely a screenshot
 */
export async function isScreenshot(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Common screenshot dimensions
    const commonScreenSizes = [
      { w: 1920, h: 1080 }, { w: 1366, h: 768 }, { w: 1440, h: 900 },
      { w: 1536, h: 864 }, { w: 1280, h: 720 }, { w: 2560, h: 1440 }
    ];

    return commonScreenSizes.some(size => 
      metadata.width === size.w && metadata.height === size.h
    );

  } catch (error) {
    return false;
  }
}

/**
 * Complete validation and preprocessing pipeline
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} file - File metadata
 * @returns {Object} - Complete validation and processing result
 */
export async function processImageUpload(buffer, file) {
  // Step 1: Validate
  const validation = await validateImage(buffer, file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Step 2: Preprocess
  const processed = await preprocessImage(buffer);

  // Step 3: Generate hash
  const imageHash = await generateImageHash(processed.buffer);

  // Step 4: Analyze quality
  const quality = await analyzeImageQuality(processed.buffer);

  // Step 5: Check if screenshot
  const isScreenCapture = await isScreenshot(processed.buffer);

  return {
    success: true,
    buffer: processed.buffer,
    metadata: {
      ...processed.metadata,
      imageHash,
      qualityScore: quality.score,
      isLowQuality: quality.isLowQuality,
      isScreenshot: isScreenCapture,
      originalSize: buffer.length,
      processedSize: processed.buffer.length
    },
    warnings: validation.warnings
  };
}

export default {
  validateImage,
  preprocessImage,
  generateImageHash,
  createBlurredPreview,
  createThumbnail,
  analyzeImageQuality,
  isScreenshot,
  processImageUpload,
  CONFIG
};
