const path = require('path');
const sharp = require(path.resolve('frontend/node_modules/sharp'));
const fs = require('fs');

async function createSuppliesBanner() {
  const baseDir = path.resolve('frontend/public/images/hero 2');
  const bgPath = path.join(baseDir, 'hero-background.png');
  const backRibbon = path.join(baseDir, 'back-ribbon.png');
  const children = path.join(baseDir, 'children.png');
  const frontRibbon = path.join(baseDir, 'front-ribbon.png');
  const shadow = path.join(baseDir, 'product-shadow.png');
  const productSet = path.join(baseDir, 'product-set.png');
  const heroContent = path.join(baseDir, 'hero-content.png');

  // Scale hero-content from 1774x887 to width 922 (36% of 2560)
  const contentWidth = 922;
  const contentHeight = Math.round((887 / 1774) * contentWidth);
  const resizedContent = await sharp(heroContent)
    .resize(contentWidth, contentHeight)
    .png()
    .toBuffer();

  const left = 90;
  const top = 26;

  // Composite all 2560x1440 layers first
  const compBuffer = await sharp(bgPath)
    .composite([
      { input: backRibbon },
      { input: children },
      { input: shadow },
      { input: productSet },
      { input: frontRibbon },
      { input: resizedContent, left, top },
    ])
    .toBuffer();

  // Then resize to 1920x1080
  await sharp(compBuffer)
    .resize(1920, 1080)
    .png()
    .toFile(path.resolve('frontend/public/images/hero/supplies_without_limits_full.png'));

  console.log('Created supplies_without_limits_full.png successfully');
}

async function createSchoolPackBanner() {
  const schoolGraphic = path.resolve('frontend/public/images/DSL_School_Pack_Graphic_HD_2x.png');

  // Get metadata of schoolGraphic
  const meta = await sharp(schoolGraphic).metadata();
  console.log('School graphic metadata:', meta.width, meta.height);

  // Resize graphic to 1920x1080 with light background fill
  const resizedGraphic = await sharp(schoolGraphic)
    .flatten({ background: { r: 246, g: 250, b: 255 } })
    .resize(1920, 1080, { fit: 'contain', background: { r: 246, g: 250, b: 255 } })
    .png()
    .toBuffer();

  const svgTextOverlay = Buffer.from(`
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <!-- FIND YOUR Tag -->
      <g transform="translate(1020, 360)">
        <text x="0" y="0" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#102A5E" letter-spacing="4">
          FIND YOUR
        </text>
        <path d="M140 -15 L140 -5 M133 -10 L138 -6 M147 -10 L142 -6" stroke="#087BFF" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- School Pack Title -->
      <g transform="translate(1020, 470)">
        <text x="0" y="0" font-family="'Segoe UI', Roboto, sans-serif" font-size="96" font-weight="900" fill="#102A5E" letter-spacing="-2">
          School <tspan fill="#FFFFFF" stroke="#102A5E" stroke-width="4" paint-order="stroke fill">Pack</tspan>
        </text>
      </g>

      <!-- Description -->
      <g transform="translate(1020, 530)">
        <text x="0" y="0" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#102A5E" opacity="0.85">
          Get a ready-made stationery pack for your grade with all the
        </text>
        <text x="0" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#102A5E" opacity="0.85">
          essentials you need for a successful school year.
        </text>
      </g>

      <!-- Explore School Packs Button -->
      <g transform="translate(1020, 620)">
        <rect width="320" height="64" rx="32" fill="#087BFF" />
        <text x="40" y="40" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">
          Explore School Packs &#8594;
        </text>
      </g>

      <!-- 3 Badges Row -->
      <g transform="translate(1020, 740)">
        <rect x="0" y="0" width="160" height="50" rx="12" fill="#EBF4FF" stroke="#D1E6FF" />
        <text x="18" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#102A5E">
          Grade Packs
        </text>
        <rect x="180" y="0" width="160" height="50" rx="12" fill="#EBF4FF" stroke="#D1E6FF" />
        <text x="198" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#102A5E">
          Booklist Match
        </text>
        <rect x="360" y="0" width="160" height="50" rx="12" fill="#EBF4FF" stroke="#D1E6FF" />
        <text x="378" y="32" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#102A5E">
          Direct Home
        </text>
      </g>
    </svg>
  `);

  await sharp(resizedGraphic)
    .composite([
      { input: svgTextOverlay },
    ])
    .png()
    .toFile(path.resolve('frontend/public/images/hero/school_pack_full.png'));

  console.log('Created school_pack_full.png successfully');
}

async function main() {
  await createSuppliesBanner();
  await createSchoolPackBanner();
}

main().catch(console.error);
