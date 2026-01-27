/**
 * Image Optimization Script
 * 
 * This script helps optimize images by:
 * 1. Converting images to WebP format (smaller file size)
 * 2. Creating multiple sizes for responsive images
 * 
 * Requirements:
 * - Install sharp: npm install sharp --save-dev
 * 
 * Usage:
 * node scripts/optimize-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const OUTPUT_DIR = path.join(__dirname, '../public/uploads/optimized');

// Image sizes for responsive images
const IMAGE_SIZES = [
  { width: 200, suffix: '_thumb' },
  { width: 400, suffix: '_small' },
  { width: 800, suffix: '_medium' },
  { width: 1200, suffix: '_large' },
];

async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = path.extname(inputPath).toLowerCase();
  
  // Skip if already optimized
  if (filename.includes('_thumb') || filename.includes('_small') || 
      filename.includes('_medium') || filename.includes('_large')) {
    return;
  }

  // Only process image files
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    return;
  }

  console.log(`Processing: ${filename}${ext}`);

  try {
    // Get original image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Generate WebP versions at different sizes
    for (const size of IMAGE_SIZES) {
      const outputPath = path.join(outputDir, `${filename}${size.suffix}.webp`);
      
      await sharp(inputPath)
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      console.log(`  Created: ${filename}${size.suffix}.webp (${size.width}px)`);
    }

    // Also create a WebP version of the original
    const originalWebp = path.join(outputDir, `${filename}.webp`);
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(originalWebp);
    
    console.log(`  Created: ${filename}.webp (original size)`);
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
  }
}

async function optimizeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping.`);
    return;
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      await optimizeDirectory(filePath);
    } else {
      await optimizeImage(filePath, OUTPUT_DIR);
    }
  }
}

// Main execution
async function main() {
  console.log('Starting image optimization...');
  console.log(`Input directory: ${UPLOAD_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('');

  await optimizeDirectory(UPLOAD_DIR);
  
  console.log('');
  console.log('Image optimization complete!');
  console.log('');
  console.log('Note: Update your components to use the optimized images:');
  console.log('  - Use .webp format when available');
  console.log('  - Use srcset for responsive images');
  console.log('  - Example: <img srcset="image_small.webp 400w, image_medium.webp 800w" />');
}

main().catch(console.error);
