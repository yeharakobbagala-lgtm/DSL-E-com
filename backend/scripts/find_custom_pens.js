const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  console.log('--- Checking ProductCustomizationConfig table ---');
  const configs = await c.query(`
    SELECT 
      c.*,
      p.id as "prodId",
      p.name as "prodName",
      p.slug as "prodSlug",
      p.images as "prodImages"
    FROM "ProductCustomizationConfig" c
    JOIN "Product" p ON c."productId" = p.id
  `);
  console.log('Customizable Products in DB:', JSON.stringify(configs.rows, null, 2));

  console.log('\n--- Searching Products matching "blue" or "matle" or "metal" ---');
  const prods = await c.query(`
    SELECT 
      p.id, 
      p.name, 
      p.slug,
      p.images,
      p."createdAt",
      p."updatedAt"
    FROM "Product" p
    WHERE p.name ILIKE '%blue%' 
       OR p.name ILIKE '%matle%' 
       OR p.name ILIKE '%metal%'
       OR p.name ILIKE '%pen%'
    ORDER BY p."updatedAt" DESC
    LIMIT 20
  `);
  console.log('Matching Products in DB:', JSON.stringify(prods.rows, null, 2));

  await c.end();
}

main().catch(console.error);
