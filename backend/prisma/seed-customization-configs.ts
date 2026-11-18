import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding ProductCustomizationConfig for eligible pen products...');

  // Find products that are pens or in pen category
  const penProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'Pen', mode: 'insensitive' } },
        { description: { contains: 'pen', mode: 'insensitive' } },
        { category: { name: { contains: 'Pen', mode: 'insensitive' } } },
      ],
      isActive: true,
    },
    include: {
      category: true,
      customizationConfig: true,
    },
  });

  console.log(`Found ${penProducts.length} pen products eligible for customization.`);

  const previewConfigDefault = {
    CAP: {
      label: 'Pen Cap',
      top: '46%',
      left: '26%',
      width: '32%',
      angle: -4,
      textColor: '#FFFFFF',
      maxChars: 18,
    },
    BARREL: {
      label: 'Pen Barrel',
      top: '48%',
      left: '48%',
      width: '42%',
      angle: -4,
      textColor: '#FFFFFF',
      maxChars: 25,
    },
    CLIP: {
      label: 'Pen Clip',
      top: '40%',
      left: '24%',
      width: '26%',
      angle: -4,
      textColor: '#FFFFFF',
      maxChars: 12,
    },
  };

  const bulkRulesDefault = [
    { minQuantity: 1, feeCents: 35000 },    // 1 - 9: Rs. 350 / unit
    { minQuantity: 10, feeCents: 25000 },   // 10 - 49: Rs. 250 / unit (Save Rs. 100)
    { minQuantity: 50, feeCents: 15000 },   // 50+: Rs. 150 / unit (Save Rs. 200)
  ];

  for (const product of penProducts) {
    await prisma.productCustomizationConfig.upsert({
      where: { productId: product.id },
      update: {
        isCustomizable: true,
        maxCharacters: 25,
        baseFeeCents: 35000,
        allowedPositions: ['CAP', 'BARREL', 'CLIP'],
        allowedFonts: ['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script'],
        bulkRules: bulkRulesDefault,
        previewConfig: previewConfigDefault,
      },
      create: {
        productId: product.id,
        isCustomizable: true,
        maxCharacters: 25,
        baseFeeCents: 35000,
        allowedPositions: ['CAP', 'BARREL', 'CLIP'],
        allowedFonts: ['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script'],
        bulkRules: bulkRulesDefault,
        previewConfig: previewConfigDefault,
      },
    });
    console.log(`- Configured customization for: [${product.sku}] ${product.name}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
