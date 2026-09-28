// Neon JSON snapshot
// usage: node scripts/backup.cjs [dir]
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

(async () => {
  const outDir = process.argv[2] || 'backups';
  fs.mkdirSync(outDir, { recursive: true });
  const data = {
    exportedAt: new Date().toISOString(),
    categories: await prisma.category.findMany(),
    products: await prisma.product.findMany({ include: { variants: true } }),
    promos: await prisma.promo.findMany(),
    alerts: await prisma.alert.findMany({ take: 500, orderBy: { createdAt: 'desc' } }),
    counts: {
      orders: await prisma.order.count(),
      reviews: await prisma.review.count(),
    },
  };
  const file = path.join(outDir, `gog-backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`BACKUP OK ${file} products=${data.products.length} categories=${data.categories.length}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error('BACKUP FAIL ' + e.message); await prisma.$disconnect(); process.exit(1); });
