import { PrismaClient, Role } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@boihat.com').trim().toLowerCase();
  const username = (process.env.ADMIN_USERNAME || 'boihat_admin').trim().toLowerCase();
  const name = process.env.ADMIN_NAME || 'Boi-Hat System Administrator';
  const phone = process.env.ADMIN_PHONE || '+8801700000000';

  console.log('Seeding / verifying production Administrator account...');
  console.log(`- Username: ${username}`);
  console.log(`- Email:    ${email}`);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.admin,
      status: 'active',
      name,
      username,
      email_verified_at: new Date(),
    },
    create: {
      email,
      username,
      name,
      phone,
      role: Role.admin,
      status: 'active',
      is_phone_verified: true,
      email_verified_at: new Date(),
      city: 'Dhaka',
      rating_avg: 5.0,
      rating_count: 1,
    },
  });

  console.log(`✓ Admin user successfully provisioned with ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('Failed to seed admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
