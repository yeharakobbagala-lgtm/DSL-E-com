const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve('frontend/node_modules/sharp'));

const targetDirs = [
  path.resolve('frontend/public/images'),
  path.resolve('backend/public/uploads'),
  path.resolve('frontend/public/uploads'),
];

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

async function convertAll() {
  console.log('Starting Batch WebP Conversion...');
  let allFiles = [];
  targetDirs.forEach((dir) => {
    allFiles = allFiles.concat(getFilesRecursively(dir));
  });

  // Deduplicate files by absolute path
  allFiles = Array.from(new Set(allFiles));
  console.log(`Found ${allFiles.length} image files to convert to WebP.\n`);

  let convertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalOriginalBytes = 0;
  let totalWebpBytes = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const ext = path.extname(filePath);
    const outputPath = filePath.substring(0, filePath.length - ext.length) + '.webp';

    try {
      const originalStat = fs.statSync(filePath);
      totalOriginalBytes += originalStat.size;

      // Convert using sharp with high quality and lossless preservation of alpha
      await sharp(filePath)
        .webp({ quality: 80, effort: 4 })
        .toFile(outputPath);

      const webpStat = fs.statSync(outputPath);
      totalWebpBytes += webpStat.size;
      convertedCount++;

      const origKb = (originalStat.size / 1024).toFixed(1);
      const webpKb = (webpStat.size / 1024).toFixed(1);
      const savings = (
        ((originalStat.size - webpStat.size) / originalStat.size) *
        100
      ).toFixed(1);

      if (i % 25 === 0 || i === allFiles.length - 1) {
        console.log(
          `[${i + 1}/${allFiles.length}] ${path.basename(filePath)} (${origKb} KB -> ${webpKb} KB, -${savings}%)`
        );
      }
    } catch (err) {
      console.error(`Error converting ${filePath}:`, err.message);
      errorCount++;
    }
  }

  const origMb = (totalOriginalBytes / (1024 * 1024)).toFixed(2);
  const webpMb = (totalWebpBytes / (1024 * 1024)).toFixed(2);
  const totalSavings = (
    ((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) *
    100
  ).toFixed(1);
  const savedMb = (
    (totalOriginalBytes - totalWebpBytes) /
    (1024 * 1024)
  ).toFixed(2);

  console.log('\n=============================================');
  console.log('✅ BATCH WEBP CONVERSION COMPLETE');
  console.log('=============================================');
  console.log(`Total Images Processed : ${allFiles.length}`);
  console.log(`Successfully Converted : ${convertedCount}`);
  console.log(`Errors Encountered     : ${errorCount}`);
  console.log(`Original Total Size    : ${origMb} MB`);
  console.log(`New WebP Total Size    : ${webpMb} MB`);
  console.log(`Total Bandwidth Saved  : ${savedMb} MB (-${totalSavings}%)`);
  console.log('=============================================\n');
}

convertAll().catch(console.error);
