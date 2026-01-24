/**
 * Test Script: Image Optimization Verification
 * 
 * This script helps verify that image optimization is working correctly.
 * Run this after deploying the changes.
 */

import sharp from 'sharp';
import { processImageUpload } from '../src/utils/imageValidator.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing Image Optimization Pipeline\n');

// Test 1: Verify Sharp is installed and working
console.log('Test 1: Sharp Installation');
try {
  const testBuffer = Buffer.from('test');
  await sharp(testBuffer).metadata();
  console.log('✅ Sharp is installed and working\n');
} catch (error) {
  console.error('❌ Sharp installation issue:', error.message);
  console.log('   Run: npm install sharp\n');
}

// Test 2: Test processImageUpload function
console.log('Test 2: processImageUpload Function');
try {
  // Create a test image buffer (simple 100x100 red square)
  const testImage = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  })
  .png()
  .toBuffer();

  const mockFile = {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: testImage.length
  };

  const result = await processImageUpload(testImage, mockFile);
  
  if (result.success) {
    console.log('✅ processImageUpload is working correctly');
    console.log(`   Original size: ${testImage.length} bytes`);
    console.log(`   Processed size: ${result.buffer.length} bytes`);
    console.log(`   Image hash: ${result.imageHash}\n`);
  } else {
    console.error('❌ processImageUpload validation failed:', result.error);
  }
} catch (error) {
  console.error('❌ processImageUpload test failed:', error.message);
  console.log('   Check that imageValidator.js is properly configured\n');
}

// Test 3: Test WebP conversion and compression
console.log('Test 3: WebP Conversion & Compression');
try {
  // Create a larger test image (1920x1080)
  const largeImage = await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .jpeg()
  .toBuffer();

  console.log(`   Original JPEG: ${(largeImage.length / 1024).toFixed(2)} KB`);

  // Optimize to WebP (simulating the optimization in createItem)
  const optimizedBuffer = await sharp(largeImage)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const reduction = ((1 - optimizedBuffer.length / largeImage.length) * 100).toFixed(1);

  console.log(`   Optimized WebP: ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`   Size reduction: ${reduction}%`);
  
  if (parseFloat(reduction) > 50) {
    console.log('✅ WebP optimization is working effectively\n');
  } else {
    console.log('⚠️  WebP reduction is less than expected\n');
  }
} catch (error) {
  console.error('❌ WebP conversion test failed:', error.message);
  console.log('   Sharp may not support WebP on this system\n');
}

// Test 4: Verify multer configuration
console.log('Test 4: Multer Configuration');
try {
  const multerPath = path.join(process.cwd(), 'src', 'middleware', 'multer.js');
  const multerContent = fs.readFileSync(multerPath, 'utf8');
  
  if (multerContent.includes('5 * 1024 * 1024')) {
    console.log('✅ File size limit is set to 5MB\n');
  } else if (multerContent.includes('20 * 1024 * 1024')) {
    console.log('⚠️  File size limit is still 20MB (should be 5MB)\n');
  } else {
    console.log('⚠️  Could not verify file size limit\n');
  }
} catch (error) {
  console.log('⚠️  Could not read multer.js:', error.message, '\n');
}

// Test 5: Verify item.controller.js has optimization code
console.log('Test 5: Item Controller Optimization');
try {
  const controllerPath = path.join(process.cwd(), 'src', 'controllers', 'item.controller.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const hasProcessImageUpload = controllerContent.includes('processImageUpload');
  const hasSharpResize = controllerContent.includes('sharp(');
  const hasWebPConversion = controllerContent.includes('.webp(');
  
  if (hasProcessImageUpload && hasSharpResize && hasWebPConversion) {
    console.log('✅ Item controller has all optimization code\n');
  } else {
    console.log('⚠️  Some optimization code may be missing:');
    console.log(`   - processImageUpload: ${hasProcessImageUpload ? '✅' : '❌'}`);
    console.log(`   - Sharp resize: ${hasSharpResize ? '✅' : '❌'}`);
    console.log(`   - WebP conversion: ${hasWebPConversion ? '✅' : '❌'}\n`);
  }
} catch (error) {
  console.log('⚠️  Could not read item.controller.js:', error.message, '\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 Image Optimization Tests Complete!\n');
console.log('Next Steps:');
console.log('1. Test actual image upload through the API');
console.log('2. Check server logs for optimization messages');
console.log('3. Verify reduced image sizes in production');
console.log('4. Test lazy loading on frontend');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
