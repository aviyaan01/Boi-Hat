import { PrismaClient } from '@prisma/client';
import { CATEGORIES_SEED, AUTHORS_SEED, PUBLISHERS_SEED, SHOPS_SEED } from './seedData';
import { generate160Books } from './seedBooks';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Boi-Hat Database Seeding...');

  try {
    await prisma.$connect();
  } catch (err) {
    console.log('Notice: PostgreSQL is not reachable on configured DATABASE_URL. Seed skipped (DatabaseService in-memory store is fully pre-seeded).');
    return;
  }

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.upsert({
    where: { phone: '+8801700000000' },
    update: {},
    create: {
      phone: '+8801700000000',
      name: 'Boi-Hat Admin (এডমিন)',
      email: 'admin@boihat.com',
      role: 'admin',
      city: 'Dhaka',
      area: 'Shahbagh',
      is_phone_verified: true,
      otp_code: hashedOtp,
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { phone: '+8801711111111' },
    update: {},
    create: {
      phone: '+8801711111111',
      name: 'Tanvir Ahmed (তানভীর আহমেদ)',
      email: 'tanvir@example.com',
      role: 'seller',
      city: 'Dhaka',
      area: 'Nilkhet',
      is_phone_verified: true,
      otp_code: hashedOtp,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { phone: '+8801722222222' },
    update: {},
    create: {
      phone: '+8801722222222',
      name: 'Farhana Rahman (ফারহানা রহমান)',
      email: 'farhana@example.com',
      role: 'seller',
      city: 'Dhaka',
      area: 'Dhanmondi',
      is_phone_verified: true,
      otp_code: hashedOtp,
    },
  });

  const buyer1 = await prisma.user.upsert({
    where: { phone: '+8801733333333' },
    update: {},
    create: {
      phone: '+8801733333333',
      name: 'Sabbir Hossain (সাব্বির হোসেন)',
      email: 'sabbir@example.com',
      role: 'buyer',
      city: 'Dhaka',
      area: 'Uttara',
      is_phone_verified: true,
      otp_code: hashedOtp,
    },
  });

  console.log('✅ Users seeded');

  // 2. Seed Shops
  for (const s of SHOPS_SEED) {
    await prisma.shop.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        user_id: seller1.id,
        name: s.name,
        slug: s.slug,
        address: s.address,
        contact_phone: s.contact_phone,
        is_verified: s.is_verified,
        subscription_plan: s.subscription_plan,
        logo_url: s.logo_url,
      },
    });
  }
  console.log('✅ Shops seeded');

  // 3. Seed Categories
  const categoryMap = new Map<string, string>();
  for (const c of CATEGORIES_SEED) {
    const parentId = c.parent_slug ? categoryMap.get(c.parent_slug) : null;
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name_en: c.name_en,
        name_bn: c.name_bn,
        level: c.level,
        icon_url: c.icon_url,
        slug: c.slug,
        parent_id: parentId,
      },
    });
    categoryMap.set(c.slug, cat.id);
  }
  console.log('✅ Categories seeded');

  // 4. Seed Authors
  const authorRecords: any[] = [];
  for (const a of AUTHORS_SEED) {
    const rec = await prisma.author.create({
      data: {
        name_en: a.name_en,
        name_bn: a.name_bn,
        aliases: a.aliases,
      },
    });
    authorRecords.push(rec);
  }
  console.log('✅ Authors seeded');

  // 5. Seed Publishers
  const publisherRecords: any[] = [];
  for (const p of PUBLISHERS_SEED) {
    const pub = await prisma.publisher.create({
      data: {
        name_en: p.name_en,
        name_bn: p.name_bn,
      },
    });
    publisherRecords.push(pub);
  }
  console.log('✅ Publishers seeded');

  // 6. Seed Books
  const books = generate160Books();
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const author = authorRecords[b.author_index] || authorRecords[0];
    const publisher = publisherRecords[b.publisher_index] || publisherRecords[0];
    const seller = i % 2 === 0 ? seller1 : seller2;

    const book = await prisma.book.create({
      data: {
        seller_id: seller.id,
        title_en: b.title_en,
        title_bn: b.title_bn,
        author_id: author.id,
        publisher_id: publisher.id,
        description: b.description,
        condition: b.condition,
        language: b.language,
        price: b.price,
        original_price: b.original_price,
        edition: b.edition,
        publication_year: b.publication_year,
        is_rare: b.is_rare || false,
        is_featured: b.is_featured || false,
        stock_count: b.stock_count,
        weight_bucket: b.weight_bucket,
        images: {
          create: b.images.map((url, imgIdx) => ({
            url,
            sort_order: imgIdx,
            is_primary: imgIdx === 0,
          })),
        },
      },
    });

    for (const cSlug of b.category_slugs) {
      const catId = categoryMap.get(cSlug);
      if (catId) {
        await prisma.bookCategory.create({
          data: {
            book_id: book.id,
            category_id: catId,
          },
        });
      }
    }
  }

  console.log(`✅ ${books.length} Books seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('Seed script note:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
