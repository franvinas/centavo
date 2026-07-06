import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

if (process.env.CENTAVO_ENV === "sandbox") {
  loadEnv({ path: ".env.sandbox", override: true });
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#E67E22", icon: "UtensilsCrossed" },
  { name: "Transport", color: "#3498DB", icon: "Car" },
  { name: "Groceries", color: "#3D8A5A", icon: "ShoppingCart" },
  { name: "Entertainment", color: "#9B59B6", icon: "Film" },
  { name: "Health", color: "#E74C3C", icon: "Heart" },
  { name: "Housing", color: "#2ECC71", icon: "Home" },
  { name: "Shopping", color: "#1ABC9C", icon: "ShoppingBag" },
  { name: "Utilities", color: "#F39C12", icon: "Zap" },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      baseCurrency: "USD",
    },
  });

  console.log(`Created user: ${user.email} (${user.id})`);

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name: { userId: user.id, name: cat.name },
      },
      update: {},
      create: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      },
    });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
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
