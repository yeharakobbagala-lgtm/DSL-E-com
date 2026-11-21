const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  // 1. Check if Speed Ball Pen exists, if not re-insert it
  const { rows: speedRows } = await client.query(
    `SELECT id FROM "HomepageBanner" WHERE title ILIKE '%speed%write%' OR title ILIKE '%speed ball pen%'`
  );

  const speedImage = '/images/hero/test-output/desktop_1920x1080.png';
  const suppliesImage = '/images/hero 2/hero-background.png';
  const schoolPackImage = '/images/DSL_School_Pack_Graphic_HD_2x.png';

  if (speedRows.length === 0) {
    const id = 'cm_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await client.query(
      `INSERT INTO "HomepageBanner" (
        id, title, subtitle, description, "desktopImage", "mobileImage", "imageAltText",
        "buttonText", "buttonLink", placement, "sortOrder", status, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::"BannerStatus", NOW(), NOW()
      )`,
      [
        id,
        'Speed Ball Pen (Write Beyond Limits)',
        'DISTRIBUTOR SPOTLIGHT',
        'High-performance writing instruments engineered for ultra-smooth gliding, zero-smudge ink delivery, and prolonged exam endurance.',
        speedImage,
        null,
        'Speed Ball Pen Series - Write Beyond Limits',
        'Explore Speed Range',
        '/shop?brand=Speed',
        'HERO',
        1,
        'PUBLISHED',
      ]
    );
    console.log('Re-assigned Speed Ball Pen (Write Beyond Limits) with right photo at Slot #1');
  } else {
    await client.query(
      `UPDATE "HomepageBanner" SET "desktopImage" = $1, "sortOrder" = 1, status = 'PUBLISHED'::"BannerStatus" WHERE id = $2`,
      [speedImage, speedRows[0].id]
    );
    console.log('Updated existing Speed Ball Pen image and slot to 1');
  }

  // 2. Update Supplies Without Limits photo
  await client.query(
    `UPDATE "HomepageBanner" SET "desktopImage" = $1, "sortOrder" = 2 WHERE title ILIKE '%supplies without limits%'`,
    [suppliesImage]
  );
  console.log('Updated Supplies Without Limits with right photo: ' + suppliesImage);

  // 3. Update Find Your School Pack photo
  await client.query(
    `UPDATE "HomepageBanner" SET "desktopImage" = $1, "sortOrder" = 3 WHERE title ILIKE '%school pack%'`,
    [schoolPackImage]
  );
  console.log('Updated Find Your School Pack with right photo: ' + schoolPackImage);

  // 4. Ensure customer service is slot 0
  await client.query(
    `UPDATE "HomepageBanner" SET "sortOrder" = 0 WHERE title ILIKE '%customer service%'`
  );

  const { rows: allBanners } = await client.query(
    `SELECT title, placement, "sortOrder", "desktopImage", status FROM "HomepageBanner" ORDER BY "sortOrder" ASC`
  );
  console.log('All banners in database now:');
  console.table(allBanners);

  await client.end();
}

main().catch((err) => {
  console.error('Error in fix script:', err);
  process.exit(1);
});
