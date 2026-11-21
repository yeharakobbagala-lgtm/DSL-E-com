const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function check() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const res = await c.query('SELECT id, name FROM "Product" WHERE name ILIKE \'%chair%\' OR description ILIKE \'%chair%\'');
  console.log('Products matching chair:', res.rows);

  const banners = await c.query('SELECT id, title, "desktopImage", subtitle, description FROM "HomepageBanner"');
  console.log('All Homepage Banners:', banners.rows);

  await c.end();
}

check().catch(console.error);
