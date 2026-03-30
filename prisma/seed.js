import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.deleteMany();
  await prisma.paymentMethod.deleteMany();

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@gmail.com",
      password: bcrypt.hashSync("rahasia123", bcrypt.genSaltSync(10)),
      role: "admin",
    },
  });

  await prisma.paymentMethod.create({
    data: {
      type: "bank",
      provider: "BCA",
      accountNumber: "1234567890",
      accountHolderName: "Cassiority",
    },
  });

  await prisma.paymentMethod.create({
    data: {
      type: "e-wallet",
      provider: "Gopay",
      accountNumber: "0987654321",
      accountHolderName: "Cassiority Fund",
    },
  });

  console.log({ admin });
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
