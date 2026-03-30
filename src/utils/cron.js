import cron from "node-cron";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Penjadwalan: Berjalan setiap jam (menit ke-0)
// Format: (menit) (jam) (hari) (bulan) (hari dalam seminggu)
cron.schedule("6 * * * *", async () => {
  console.log("--- Menjalankan pengecekan campaign kadaluwarsa ---");

  try {
    const now = new Date();

    const result = await prisma.campaign.updateMany({
      where: {
        status: "active", // Hanya cek yang masih aktif
        deadline: {
          lt: now, // lt = less than (waktu berakhir sudah lewat dari sekarang)
        },
      },
      data: {
        status: "completed",
      },
    });

    if (result.count > 0) {
      console.log(`Berhasil menutup ${result.count} campaign yang telah berakhir.`);
    } else {
      console.log("Tidak ada campaign yang perlu ditutup saat ini.");
    }
  } catch (error) {
    console.error("Gagal menjalankan cron job:", error);
  }
});
