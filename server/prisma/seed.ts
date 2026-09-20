import { PrismaClient, Role, ServiceModel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cleaning database and initializing master admin...');

  const masterUsername = process.env.MASTER_ADMIN_USERNAME?.trim();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD?.trim();
  const saltRoundsStr = process.env.BCRYPT_SALT_ROUNDS?.trim();

  if (!masterUsername || !masterPassword || !saltRoundsStr) {
    throw new Error(
      '❌ [SEED ENV ERROR]: MASTER_ADMIN_USERNAME, MASTER_ADMIN_PASSWORD, and BCRYPT_SALT_ROUNDS must be defined in server/.env',
    );
  }

  const saltRounds = Number(saltRoundsStr);
  if (isNaN(saltRounds) || saltRounds <= 0) {
    throw new Error('❌ [SEED ENV ERROR]: BCRYPT_SALT_ROUNDS must be a valid positive integer.');
  }

  // 1. Clean all existing records
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.kotTicket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurantSettings.deleteMany();

  // 2. Hash Master Admin Password
  const masterPasswordHash = await bcrypt.hash(masterPassword, saltRounds);

  // 3. Create Master Admin Account ONLY
  console.log(`👤 Creating Master Admin (${masterUsername})...`);
  await prisma.user.create({
    data: {
      username: masterUsername,
      passwordHash: masterPasswordHash,
      name: 'Natnael (Master Admin)',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 4. Create Default Restaurant Settings
  console.log('⚙️ Creating initial venue settings...');
  await prisma.restaurantSettings.create({
    data: {
      id: 'default',
      name: 'Abyssinia Digital Restaurant',
      serviceModel: ServiceModel.SELF_SERVED,
      fastingAutoSchedule: true,
      defaultLanguage: 'en',
      currency: 'ETB',
      themeConfig: {
        primaryColor: '#d97706',
        secondaryColor: '#78350f',
        accentColor: '#f59e0b',
        backgroundColor: '#1c1917',
        surfaceColor: '#292524',
        textColor: '#fafaf9',
      },
    },
  });

  console.log('✅ Database initialized cleanly with single master admin account!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
