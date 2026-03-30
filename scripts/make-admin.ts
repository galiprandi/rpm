import "dotenv/config";
import { prisma } from "../lib/prisma";

async function makeAdmin(email: string) {
  try {
    // Update user table (Better Auth)
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log(`✅ Updated user table: ${email} -> ADMIN`);

    // Update or create user_role entry
    await prisma.userRole.upsert({
      where: { email },
      update: {
        role: "ADMIN",
        isActive: true,
        notes: "Administrador del sistema",
      },
      create: {
        email,
        role: "ADMIN",
        name: "Germán Aliprandi",
        notes: "Administrador del sistema",
        isActive: true,
      },
    });
    console.log(`✅ Updated user_role table: ${email} -> ADMIN`);

    console.log("\n🎉 Usuario ahora tiene rol ADMIN");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || "galiprandi@gmail.com";
makeAdmin(email);
