import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding products with images to flag for Best Sellers and New Arrivals...');

  // Get products with stock and images
  const allProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      stockQuantity: { gt: 0 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const withImages = allProducts.filter((p) => {
    const imgs = p.images as string[] | undefined;
    return imgs && imgs.length > 0 && imgs[0] && imgs[0].trim() !== '';
  });

  console.log(`Found ${withImages.length} active products with valid images.`);

  if (withImages.length === 0) {
    console.log('No products with images found.');
    return;
  }

  // Top 10 as Best Sellers
  const bestSellerSlice = withImages.slice(0, 12);
  const bestSellerIds = bestSellerSlice.map((p) => p.id);

  // Next 12 as New Arrivals
  const newArrivalSlice = withImages.slice(12, 24);
  const newArrivalIds = newArrivalSlice.map((p) => p.id);

  console.log(`Updating ${bestSellerIds.length} products to isBestSeller: true`);
  await prisma.product.updateMany({
    where: { id: { in: bestSellerIds } },
    data: { isBestSeller: true },
  });

  console.log(`Updating ${newArrivalIds.length} products to isNewArrival: true`);
  await prisma.product.updateMany({
    where: { id: { in: newArrivalIds } },
    data: { isNewArrival: true },
  });

  console.log('Successfully flagged storefront products!');
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
