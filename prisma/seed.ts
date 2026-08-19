import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@pedidos.local';
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Admin';
const SEED_ADMIN_PHONE = process.env.SEED_ADMIN_PHONE ?? '00000000';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script must not run in production');
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { role: Role.ADMIN },
    create: {
      email: SEED_ADMIN_EMAIL,
      name: SEED_ADMIN_NAME,
      phone: SEED_ADMIN_PHONE,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Seed completed. Admin user: ${admin.email}`);
  if (SEED_ADMIN_PASSWORD === 'Admin123!') {
    console.warn('Using default password. Set SEED_ADMIN_PASSWORD for custom deployments.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
