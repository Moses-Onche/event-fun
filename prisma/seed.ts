import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@eventfun.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Set ADMIN_PASSWORD before running the seed.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true, passwordHash },
    create: { email, name: "EventFun Admin", role: "ADMIN", passwordHash },
  });
  console.log(`Admin ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
