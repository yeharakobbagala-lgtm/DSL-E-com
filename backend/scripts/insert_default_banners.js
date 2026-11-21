const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database');

  const { rows: existing } = await client.query('SELECT id, title, placement, status, "sortOrder" FROM "HomepageBanner"');
  console.log('Existing banners in database:', existing);

  const defaults = [
    {
      title: 'Speed Ball Pen (Write Beyond Limits)',
      subtitle: 'DISTRIBUTOR SPOTLIGHT',
      description: 'High-performance writing instruments engineered for ultra-smooth gliding, zero-smudge ink delivery, and prolonged exam endurance.',
      desktopImage: '/images/hero/hero_section_2x.png',
      mobileImage: null,
      imageAltText: 'Speed Ball Pen Series and school stationery supplies',
      buttonText: 'Explore Speed Range',
      buttonLink: '/shop?brand=Speed',
      placement: 'HERO',
      sortOrder: 1,
      status: 'PUBLISHED',
    },
    {
      title: 'Supplies Without Limits',
      subtitle: 'OFFICIAL STATIONERY DISTRIBUTOR',
      description: 'Everything you need for classrooms and corporate workspaces with authentic direct-distributor guarantees.',
      desktopImage: '/images/hero 2/hero-content-frame.png',
      mobileImage: null,
      imageAltText: 'DSL Stationery school essentials and distribution catalogue',
      buttonText: 'Shop Catalogue',
      buttonLink: '/shop',
      placement: 'HERO',
      sortOrder: 2,
      status: 'PUBLISHED',
    },
    {
      title: 'Find Your School Pack',
      subtitle: 'GRADE-WISE PACKS & BOOKLISTS',
      description: 'Curated stationery packages pre-approved by leading schools with fast home delivery and official booklist matching.',
      desktopImage: '/images/hero 2/children.png',
      mobileImage: null,
      imageAltText: 'Grade-wise school packs and stationery packages',
      buttonText: 'Explore School Packs',
      buttonLink: '/school-packs',
      placement: 'HERO',
      sortOrder: 3,
      status: 'PUBLISHED',
    },
  ];

  for (const item of defaults) {
    const alreadyThere = existing.some((e) => e.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 15)));
    if (!alreadyThere) {
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
          item.title,
          item.subtitle,
          item.description,
          item.desktopImage,
          item.mobileImage,
          item.imageAltText,
          item.buttonText,
          item.buttonLink,
          item.placement,
          item.sortOrder,
          item.status,
        ]
      );
      console.log(`Inserted: ${item.title}`);
    } else {
      console.log(`Already exists: ${item.title}`);
    }
  }

  // Ensure customer service is sortOrder 0 so it comes first
  await client.query(`UPDATE "HomepageBanner" SET "sortOrder" = 0 WHERE title = 'customer service'`);

  const { rows: updated } = await client.query('SELECT id, title, placement, status, "sortOrder" FROM "HomepageBanner" ORDER BY "sortOrder" ASC');
  console.log('All banners after insert and order:', updated);

  await client.end();
}

main().catch((err) => {
  console.error('Error inserting default banners:', err);
  process.exit(1);
});
