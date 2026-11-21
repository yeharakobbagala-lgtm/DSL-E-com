const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve(__dirname, '../public/images/email'),
  path.resolve(__dirname, '../../backend/src/assets/email')
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. ORDER SUCCESS SHOPPING BAG ILLUSTRATION
// Modern 3D/flat vector shopping bag in DSL blue, gold accents, stationery peeking out, bright success checkmark badge
const orderSuccessBagSvg = `
<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <linearGradient id="bgGlow" x1="200" y1="40" x2="200" y2="360" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#F0F9FF" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="bagFront" x1="120" y1="140" x2="280" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#0066CC"/>
      <stop offset="100%" stop-color="#08275E"/>
    </linearGradient>
    <linearGradient id="bagFold" x1="100" y1="160" x2="140" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0369A1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <linearGradient id="handleGrad" x1="200" y1="90" x2="200" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="200" y1="210" x2="200" y2="290" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="pencilGrad" x1="130" y1="80" x2="160" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="penGrad" x1="230" y1="70" x2="250" y2="170" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0066CC" flood-opacity="0.18"/>
    </filter>
    <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#059669" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Soft Aura Circle -->
  <circle cx="200" cy="200" r="160" fill="url(#bgGlow)"/>

  <!-- Stationery items peeking out from bag -->
  <!-- 1. Wooden Ruler (Left) -->
  <g transform="rotate(-18 145 130)">
    <rect x="135" y="65" width="22" height="120" rx="3" fill="#FDE68A" stroke="#D97706" stroke-width="1.5"/>
    <line x1="140" y1="80" x2="152" y2="80" stroke="#92400E" stroke-width="1.5"/>
    <line x1="140" y1="92" x2="148" y2="92" stroke="#92400E" stroke-width="1"/>
    <line x1="140" y1="104" x2="152" y2="104" stroke="#92400E" stroke-width="1.5"/>
    <line x1="140" y1="116" x2="148" y2="116" stroke="#92400E" stroke-width="1"/>
    <line x1="140" y1="128" x2="152" y2="128" stroke="#92400E" stroke-width="1.5"/>
    <line x1="140" y1="140" x2="148" y2="140" stroke="#92400E" stroke-width="1"/>
    <line x1="140" y1="152" x2="152" y2="152" stroke="#92400E" stroke-width="1.5"/>
  </g>

  <!-- 2. Yellow HB Pencil (Center-Left) -->
  <g transform="rotate(-6 185 110)">
    <!-- Body -->
    <rect x="175" y="60" width="16" height="120" rx="2" fill="url(#pencilGrad)"/>
    <!-- Pencil stripes -->
    <line x1="180" y1="60" x2="180" y2="180" stroke="#F59E0B" stroke-width="1"/>
    <line x1="186" y1="60" x2="186" y2="180" stroke="#B45309" stroke-width="1"/>
    <!-- Eraser metal ferrule -->
    <rect x="174" y="52" width="18" height="10" rx="1" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
    <!-- Pink eraser -->
    <path d="M175 52 C175 44 191 44 191 52 Z" fill="#F472B6"/>
    <!-- Sharpened tip -->
    <polygon points="175,180 191,180 183,205" fill="#FEF3C7"/>
    <polygon points="180,195 186,195 183,205" fill="#334155"/>
  </g>

  <!-- 3. Blue Speed Pen (Center-Right) -->
  <g transform="rotate(14 225 110)">
    <!-- Pen clip & cap -->
    <rect x="220" y="55" width="14" height="125" rx="4" fill="url(#penGrad)"/>
    <!-- Metal Clip -->
    <rect x="216" y="65" width="4" height="45" rx="2" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="0.8"/>
    <!-- Silver ring -->
    <rect x="219" y="115" width="16" height="4" fill="#F8FAFC"/>
  </g>

  <!-- 4. Golden Triangle / Notebook Tab (Far Right) -->
  <g transform="rotate(22 255 125)">
    <rect x="245" y="80" width="30" height="90" rx="4" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
    <line x1="250" y1="95" x2="270" y2="95" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="250" y1="105" x2="265" y2="105" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="250" y1="115" x2="268" y2="115" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
  </g>

  <!-- Shopping Bag Handles -->
  <path d="M165 170 V115 C165 90 235 90 235 115 V170" fill="none" stroke="url(#handleGrad)" stroke-width="8" stroke-linecap="round"/>
  <path d="M172 170 V118 C172 100 228 100 228 118 V170" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round"/>

  <!-- Main Shopping Bag Body -->
  <g filter="url(#softShadow)">
    <!-- Left fold perspective -->
    <path d="M115 175 L135 160 L140 330 L118 342 Z" fill="url(#bagFold)"/>
    <!-- Front face of the bag -->
    <path d="M135 160 L275 160 L285 330 L140 330 Z" fill="url(#bagFront)"/>
    <!-- Top inner rim & fold crease -->
    <path d="M135 160 L275 160 L282 172 L137 172 Z" fill="#0369A1" opacity="0.6"/>
    <!-- Elegant golden star/sparkle branding motif on bag -->
    <circle cx="205" cy="188" r="3" fill="#FDE047"/>
    <circle cx="160" cy="205" r="2" fill="#FDE047" opacity="0.8"/>
    <circle cx="250" cy="210" r="2.5" fill="#FDE047" opacity="0.8"/>
  </g>

  <!-- Success Confirmation Badge (Prominent green circle with white checkmark) -->
  <g filter="url(#badgeShadow)">
    <circle cx="207" cy="248" r="40" fill="#FFFFFF"/>
    <circle cx="207" cy="248" r="36" fill="url(#badgeGrad)"/>
    <!-- Checkmark Path -->
    <path d="M193 248 L203 258 L223 238" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Celebration Confetti / Sparkles -->
  <path d="M95 140 Q105 145 100 155 Q95 145 95 140 Z" fill="#F59E0B"/>
  <path d="M305 130 Q315 135 310 145 Q305 135 305 130 Z" fill="#38BDF8"/>
  <circle cx="110" cy="190" r="4" fill="#FBBF24"/>
  <circle cx="300" cy="180" r="4.5" fill="#10B981"/>
  <circle cx="90" cy="250" r="3.5" fill="#38BDF8"/>
  <circle cx="315" cy="255" r="3.5" fill="#F59E0B"/>
</svg>
`;

// 2. STATIONERY HEADER DECORATIVE BANNER
// Clean white/soft-blue background with stationery items across top (pencils, ruler, book, notebook, clips)
const stationeryHeaderSvg = `
<svg width="1200" height="180" viewBox="0 0 1200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerBg" x1="0" y1="0" x2="1200" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F0F9FF"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F0F9FF"/>
    </linearGradient>
    <linearGradient id="blueWave" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0066CC"/>
      <stop offset="50%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#08275E"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="180" fill="url(#headerBg)"/>
  
  <!-- Subtle Top Accent Stripe -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#blueWave)"/>

  <!-- Left Stationery cluster: Notebook, Pencil, Clips -->
  <g transform="translate(60, 25)">
    <!-- Blue Notebook -->
    <rect x="20" y="20" width="95" height="115" rx="6" fill="#0066CC" stroke="#08275E" stroke-width="2"/>
    <!-- Spine binding -->
    <rect x="15" y="20" width="14" height="115" rx="3" fill="#08275E"/>
    <line x1="15" y1="35" x2="29" y2="35" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="15" y1="55" x2="29" y2="55" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="15" y1="75" x2="29" y2="75" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="15" y1="95" x2="29" y2="95" stroke="#FFFFFF" stroke-width="1.5"/>
    <line x1="15" y1="115" x2="29" y2="115" stroke="#FFFFFF" stroke-width="1.5"/>
    <!-- Notebook Label -->
    <rect x="42" y="45" width="55" height="30" rx="3" fill="#FFFFFF"/>
    <line x1="48" y1="55" x2="88" y2="55" stroke="#94A3B8" stroke-width="2"/>
    <line x1="48" y1="65" x2="78" y2="65" stroke="#CBD5E1" stroke-width="1.5"/>

    <!-- Yellow Pencil tilted across notebook -->
    <g transform="rotate(35 90 90)">
      <rect x="75" y="10" width="12" height="130" rx="2" fill="#F59E0B"/>
      <rect x="74" y="5" width="14" height="8" rx="1" fill="#E2E8F0"/>
      <path d="M75 5 C75 -2 87 -2 87 5 Z" fill="#F472B6"/>
      <polygon points="75,140 87,140 81,155" fill="#FEF3C7"/>
      <polygon points="79,148 83,148 81,155" fill="#1E293B"/>
    </g>

    <!-- Paperclip -->
    <path d="M140 80 C140 68 155 68 155 80 L155 115 C155 132 128 132 128 115 L128 75 C128 58 165 58 165 75 L165 115" fill="none" stroke="#0284C7" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Right Stationery cluster: Books, Fountain Pen, Compass -->
  <g transform="translate(980, 25)">
    <!-- Book 1 (Coral/Amber) -->
    <g transform="rotate(-6 80 80)">
      <rect x="40" y="30" width="105" height="26" rx="4" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
      <rect x="40" y="34" width="8" height="18" fill="#FBBF24"/>
      <line x1="55" y1="43" x2="135" y2="43" stroke="#FFFFFF" stroke-width="1.5"/>
    </g>
    <!-- Book 2 (DSL Sky Blue) -->
    <g transform="rotate(2 80 80)">
      <rect x="35" y="60" width="115" height="28" rx="4" fill="#0284C7" stroke="#0369A1" stroke-width="1.5"/>
      <rect x="35" y="64" width="8" height="20" fill="#38BDF8"/>
      <line x1="52" y1="74" x2="140" y2="74" stroke="#FFFFFF" stroke-width="1.5"/>
    </g>
    <!-- Book 3 (Deep Navy Blue) -->
    <rect x="30" y="92" width="125" height="30" rx="4" fill="#08275E" stroke="#001B48" stroke-width="1.5"/>
    <rect x="30" y="96" width="9" height="22" fill="#0066CC"/>
    <line x1="50" y1="107" x2="145" y2="107" stroke="#FDE047" stroke-width="1.5"/>

    <!-- Premium Pen leaning on books -->
    <g transform="rotate(-32 30 80)">
      <rect x="25" y="15" width="10" height="120" rx="3" fill="#0066CC"/>
      <rect x="23" y="45" width="3" height="35" rx="1.5" fill="#E2E8F0"/>
      <polygon points="25,135 35,135 30,150" fill="#F59E0B"/>
    </g>
  </g>

  <!-- Center Decorative Subtle Sparkles -->
  <g opacity="0.6">
    <path d="M480 40 Q485 45 480 50 Q475 45 480 40 Z" fill="#F59E0B"/>
    <path d="M720 45 Q725 50 720 55 Q715 50 720 45 Z" fill="#0284C7"/>
    <circle cx="530" cy="70" r="3" fill="#38BDF8"/>
    <circle cx="670" cy="75" r="2.5" fill="#FBBF24"/>
  </g>
</svg>
`;

// 3. DECORATIVE WAVES FOR EMAIL FOOTER
// Smooth, layered waves in royal blue, sky blue and light cyan with soft golden accent
const decorativeWavesSvg = `
<svg width="1200" height="160" viewBox="0 0 1200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="waveLight" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E0F2FE"/>
      <stop offset="50%" stop-color="#BAE6FD"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <linearGradient id="waveMid" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0066CC"/>
    </linearGradient>
    <linearGradient id="waveDeep" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0066CC"/>
      <stop offset="50%" stop-color="#08275E"/>
      <stop offset="100%" stop-color="#004C99"/>
    </linearGradient>
  </defs>

  <!-- Background Fill -->
  <rect width="1200" height="160" fill="#FFFFFF"/>

  <!-- Wave 1: Soft Light Blue (Back) -->
  <path d="M0 60 C300 20 500 90 800 45 C1000 15 1100 50 1200 35 V160 H0 Z" fill="url(#waveLight)" opacity="0.75"/>

  <!-- Wave 2: Middle Vibrant Blue -->
  <path d="M0 85 C250 45 480 115 750 70 C980 30 1120 85 1200 65 V160 H0 Z" fill="url(#waveMid)" opacity="0.85"/>

  <!-- Wave 3: Deep Royal Navy Brand Wave (Front) -->
  <path d="M0 110 C200 80 420 135 680 95 C920 60 1080 115 1200 90 V160 H0 Z" fill="url(#waveDeep)"/>

  <!-- Subtle Golden Crest Line -->
  <path d="M0 110 C200 80 420 135 680 95 C920 60 1080 115 1200 90" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-opacity="0.9"/>
</svg>
`;

async function buildAssets() {
  console.log('Generating premium email visual assets...');

  // 1. Order Success Bag PNG (600x600 crisp retina)
  const bagPng = await sharp(Buffer.from(orderSuccessBagSvg))
    .png({ quality: 95 })
    .toBuffer();

  // 2. Stationery Header PNG (1200x180 crisp retina)
  const headerPng = await sharp(Buffer.from(stationeryHeaderSvg))
    .png({ quality: 95 })
    .toBuffer();

  // 3. Decorative Waves PNG (1200x160 crisp retina)
  const wavesPng = await sharp(Buffer.from(decorativeWavesSvg))
    .png({ quality: 95 })
    .toBuffer();

  // Read the existing official logo
  const logoPath = path.resolve(__dirname, '../public/images/dsl-logo-official.png');
  const logoBuffer = fs.readFileSync(logoPath);

  for (const dir of targetDirs) {
    fs.writeFileSync(path.join(dir, 'order-success-bag.png'), bagPng);
    fs.writeFileSync(path.join(dir, 'stationery-header.png'), headerPng);
    fs.writeFileSync(path.join(dir, 'decorative-waves.png'), wavesPng);
    fs.writeFileSync(path.join(dir, 'dsl-logo.png'), logoBuffer);
    console.log(`Saved assets to: ${dir}`);
  }

  console.log('Successfully generated and distributed all email graphic assets!');
}

buildAssets().catch(console.error);
