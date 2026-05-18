import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create shop config
  await prisma.shopConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'Nos Market',
      shopDescription: 'Premium gaming items marketplace',
      contactEmail: 'support@nosmarket.com',
      bestSellerIds: [],
      banners: [],
      announcements: [],
      maintenanceMode: false,
    },
  });

  // Create order sequence
  await prisma.orderSequence.upsert({
    where: { id: 'order_seq' },
    update: {},
    create: {
      id: 'order_seq',
      value: 0,
    },
  });

  // Create sample game
  const game = await prisma.game.upsert({
    where: { slug: 'roblox' },
    update: {},
    create: {
      name: 'Roblox',
      slug: 'roblox',
      description: 'Roblox game items and currency',
      isActive: true,
      sortOrder: 0,
    },
  });

  // Create sample category
  const category = await prisma.category.upsert({
    where: { gameId_slug: { gameId: game.id, slug: 'robux' } },
    update: {},
    create: {
      gameId: game.id,
      name: 'Robux',
      slug: 'robux',
      description: 'Robux currency packages',
      isActive: true,
      sortOrder: 0,
    },
  });

  // Create sample product
  await prisma.product.upsert({
    where: { categoryId_slug: { categoryId: category.id, slug: '500k-robux' } },
    update: {},
    create: {
      gameId: game.id,
      categoryId: category.id,
      name: '500K Robux',
      slug: '500k-robux',
      description: 'Get 500,000 Robux delivered instantly to your account.',
      shortDescription: 'Instant delivery',
      price: 49.99,
      stock: 100,
      maxPerOrder: 10,
      imageUrls: [],
      isActive: true,
      isDigital: true,
      deliveryInfo: 'Delivered within 1-24 hours',
      bulkDiscounts: [
        { minQuantity: 5, discountPercent: 5 },
        { minQuantity: 10, discountPercent: 10 },
      ],
      sortOrder: 0,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
