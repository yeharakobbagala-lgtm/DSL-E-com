const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function updateBanners() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  // Update customer service to sortOrder 0
  await c.query(`UPDATE "HomepageBanner" SET "sortOrder" = 0 WHERE title ILIKE '%customer service%'`);

  // Update Speed Ball Pen to sortOrder 1 and correct image
  await c.query(`
    UPDATE "HomepageBanner" 
    SET "desktopImage" = '/images/hero/test-output/desktop_1920x1080.png',
        "sortOrder" = 1,
        status = 'PUBLISHED'::"BannerStatus"
    WHERE title ILIKE '%speed%write%' OR title ILIKE '%speed ball pen%'
  `);

  // Update Supplies Without Limits to sortOrder 2 and full composite image
  await c.query(`
    UPDATE "HomepageBanner" 
    SET "desktopImage" = '/images/hero/supplies_without_limits_full.png',
        "sortOrder" = 2,
        status = 'PUBLISHED'::"BannerStatus"
    WHERE title ILIKE '%supplies without limits%'
  `);

  // Update Find Your School Pack to sortOrder 3 and full composite image
  await c.query(`
    UPDATE "HomepageBanner" 
    SET "desktopImage" = '/images/hero/school_pack_full.png',
        "sortOrder" = 3,
        status = 'PUBLISHED'::"BannerStatus"
    WHERE title ILIKE '%school pack%'
  `);

  const res = await c.query(`
    SELECT id, title, "desktopImage", "sortOrder", status, placement
    FROM "HomepageBanner"
    WHERE placement = 'HERO'
    ORDER BY "sortOrder" ASC
  `);
  console.log('Updated Hero Banners in DB:');
  console.log(JSON.stringify(res.rows, null, 2));

  await c.end();
}

updateBanners().catch(console.error);
