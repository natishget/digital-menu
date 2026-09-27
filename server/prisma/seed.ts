import { PrismaClient, Role, ServiceModel, FulfillmentStation } from '@prisma/client';
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

  // 3. Create Master Admin Account
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

  // 5. Create Sample Venue Tables (for Waiter-Assisted mode testing)
  console.log('🍽️ Creating venue tables...');
  await prisma.table.createMany({
    data: [
      { number: 1, name: 'Main Dining Table 1', qrToken: 'table-1-qr-token-abc123' },
      { number: 2, name: 'Main Dining Table 2', qrToken: 'table-2-qr-token-def456' },
      { number: 3, name: 'VIP Garden Table 3', qrToken: 'table-3-qr-token-ghi789' },
    ],
  });

  // 6. Create Menu Categories with Food Composition Descriptions
  console.log('🍲 Seeding categories and menu items with food composition descriptions...');

  // Category 1: Hot Drinks & Coffee
  const hotDrinksCat = await prisma.category.create({
    data: {
      nameEn: 'Hot Drinks & Coffee',
      nameAm: 'የሞቁ መጠጦችና ቡና',
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: hotDrinksCat.id,
      nameEn: 'Special Jebena Coffee',
      nameAm: 'ልዩ የጀበና ቡና',
      descriptionEn: 'Composed of freshly roasted organic Yirgacheffe coffee beans brewed traditionally in a clay Jebena, served with cardamom and fresh rue leaf (Tenadam).',
      descriptionAm: 'በጀበና ከተፈላ የይርጋጨፌ ኦርጋኒክ የቡና እህል፡ ከጤና አዳም እና ሄል ጋር የቀረበ።',
      price: 60.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.BARISTA,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: hotDrinksCat.id,
      nameEn: 'Double Shot Macchiato',
      nameAm: 'ድርብ ማኪያቶ',
      descriptionEn: 'Composed of dark espresso double shot topped with velvety steamed whole milk microfoam.',
      descriptionAm: 'በድርብ ኤስፕሬሶ እና በጋለ የወተት አረፋ የተበጠበጠ ማኪያቶ።',
      price: 75.0,
      isFastingFriendly: false,
      fulfillmentStation: FulfillmentStation.BARISTA,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: hotDrinksCat.id,
      nameEn: 'Spiced Ethiopian Herbal Tea',
      nameAm: 'የቅመም ሻይ',
      descriptionEn: 'Composed of premium black tea infused with natural cinnamon bark, clove buds, ginger root, and cardamom pods.',
      descriptionAm: 'በቀረፋ፡ ቅርንፉድ፡ ዝንጅብል እና ሄል የተቀመመ ጥቁር ሻይ።',
      price: 45.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.BARISTA,
    },
  });

  // Category 2: Ethiopian Breakfast
  const breakfastCat = await prisma.category.create({
    data: {
      nameEn: 'Ethiopian Breakfast',
      nameAm: 'የኢትዮጵያ ቁርስ',
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: breakfastCat.id,
      nameEn: 'Special Chechebsa with Honey & Milk Yogurt',
      nameAm: 'ልዩ ጨጨብሳ በማርና እርጎ',
      descriptionEn: 'Composed of hand-torn crispy flatbread (Kita) pan-fried with spiced clarified butter (Niter Kibbeh), red chili flakes (Berbere), wild blossom honey, and side homemade yogurt (Ergo).',
      descriptionAm: 'በንጥር ቅቤ፡ በበርበሬ፡ በማር እና ከጎን ከቀረበ የቤት እርጎ ጋር የተቦካ የተቆራረሰ ቂጣ።',
      price: 220.0,
      isFastingFriendly: false,
      fulfillmentStation: FulfillmentStation.KITCHEN,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: breakfastCat.id,
      nameEn: 'Special Fasting Ful Medames',
      nameAm: 'ልዩ የጾም ፉል ምዳመስ',
      descriptionEn: 'Composed of slow-simmered fava beans, cold-pressed extra virgin olive oil, diced roma tomatoes, jalapeños, onions, parsley, served with warm french bread.',
      descriptionAm: 'ከተቀቀለ ፉል፡ ዘይት፡ ቲማቲም፡ ቃሪያ እና ሽንኩርት የተዘጋጀ ከትኩስ ዳቦ ጋር።',
      price: 150.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.KITCHEN,
    },
  });

  // Category 3: Traditional Main Dishes
  const mainDishesCat = await prisma.category.create({
    data: {
      nameEn: 'Traditional Main Dishes',
      nameAm: 'ባህላዊ የሀበሻ ምግቦች',
      sortOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainDishesCat.id,
      nameEn: 'Deluxe Fasting Beyaynetu Combo',
      nameAm: 'ልዩ የጾም በያይነቱ',
      descriptionEn: 'Composed of Clay-pot Shiro Tegabino, spicy red split lentil stew (Misir Wot), yellow split pea stew (Kik Alicha), sautéed collard greens (Gomen), Timatim Fitfit, and potato-beetroot salad served over sourdough Injera.',
      descriptionAm: 'ከሽሮ ተጋቢኖ፡ ምስር ወጥ፡ ክክ አልጫ፡ ጎመን፡ ቲማቲም ፍትፍት እና ቀይ ስር በእንጀራ የቀረበ።',
      price: 280.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.KITCHEN,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainDishesCat.id,
      nameEn: 'Tegabino Shiro Wot',
      nameAm: 'ተጋቢኖ ሽሮ ወጥ',
      descriptionEn: 'Composed of roasted sun-dried chickpea & grass pea flour cooked with minced garlic, onions, spiced oil, served piping hot in a traditional clay pot (Mitead) with soft sourdough Injera.',
      descriptionAm: 'በሸክላ ድስት ፈልቆ የሚቀርብ በነጭ ሽንኩርት እና ቅቤ የተቀመመ የሽሮ ወጥ።',
      price: 180.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.KITCHEN,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: mainDishesCat.id,
      nameEn: 'Sizzling Beef Tenderloin Tibs',
      nameAm: 'የበሬ ቁሊያ ጥብስ',
      descriptionEn: 'Composed of prime diced beef tenderloin pan-sautéed with sliced red onions, rosemary leaves, jalapeños, garlic, and aromatic spiced butter (Niter Kibbeh).',
      descriptionAm: 'በቀይ ሽንኩርት፡ የጽድ ቅጠል (ሮዝመሪ)፡ ቃሪያ እና በንጥር ቅቤ የተጠበሰ የበሬ ሥጋ።',
      price: 350.0,
      isFastingFriendly: false,
      fulfillmentStation: FulfillmentStation.KITCHEN,
    },
  });

  // Category 4: Refreshing Cold Juices
  const coldDrinksCat = await prisma.category.create({
    data: {
      nameEn: 'Cold Juices & Spris',
      nameAm: 'ቀዝቃዛ ጁሶችና ስፕሪስ',
      sortOrder: 4,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: coldDrinksCat.id,
      nameEn: 'Layered Avocado & Mango Spris',
      nameAm: 'የአቮካዶና ማንጎ ስፕሪስ',
      descriptionEn: 'Composed of thick pureed Hass avocado, sweet mango pulp, passionfruit top layer, finished with fresh lime juice.',
      descriptionAm: 'ከተፈጥሮ አቮካዶ እና ማንጎ የተዘጋጀ ድርብ ስፕሪስ ጁስ።',
      price: 120.0,
      isFastingFriendly: true,
      fulfillmentStation: FulfillmentStation.BARISTA,
    },
  });

  console.log('✅ Database successfully seeded with venue settings, tables, and food compositions!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

