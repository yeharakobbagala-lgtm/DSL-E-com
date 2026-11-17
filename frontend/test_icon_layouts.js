const { chromium } = require('playwright');
const path = require('path');

async function testIconLayouts() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });
  try {
    const skip = await page.waitForSelector('button:has-text("Skip")', { timeout: 2500 });
    if (skip) await skip.click();
  } catch (e) {}
  await page.waitForTimeout(2000);

  const outDir = 'C:/Users/Yehara Kobbagala/.gemini/antigravity/brain/4c1b4457-76fd-4820-8a78-be37fb3a5151';

  // Layout A: Only Manufacturer Graphic on the left (clean & uncluttered, highest impact)
  await page.evaluate(() => {
    const stage = document.querySelector('[style*="1670 / 941"]');
    if (!stage) return;

    // Hide feature icons
    const icons = document.querySelector('.speed-left-shift');
    if (icons) icons.style.display = 'none';

    // Add graphic
    let g = document.getElementById('speed-mfg-graphic');
    if (!g) {
      g = document.createElement('div');
      g.id = 'speed-mfg-graphic';
      g.style.position = 'absolute';
      g.style.left = '4%';
      g.style.top = '15%';
      g.style.width = '32%';
      g.style.maxWidth = '460px';
      g.style.zIndex = '36';
      g.style.pointerEvents = 'none';

      const img = document.createElement('img');
      img.src = '/images/hero/speed-hero/speed-manufacturer-text.png';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.filter = 'drop-shadow(0 14px 30px rgba(0,0,0,0.45))';
      g.appendChild(img);
      stage.appendChild(g);
    }
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'layout_A_clean_headline.png'), fullPage: false });
  console.log('Saved layout_A_clean_headline.png');

  // Layout B: Graphic at top left + 3 feature badges horizontally along bottom left
  await page.evaluate(() => {
    const g = document.getElementById('speed-mfg-graphic');
    if (g) {
      g.style.top = '10%';
      g.style.width = '30%';
    }
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'layout_B_headline_compact.png'), fullPage: false });
  console.log('Saved layout_B_headline_compact.png');

  await browser.close();
}

testIconLayouts().catch(console.error);
