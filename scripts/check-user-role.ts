import "dotenv/config";
import { prisma } from "../lib/prisma";

async function checkUserRole(email: string) {
  try {
    // Check user table (Better Auth)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("\n=== User Role Information ===");
    console.log(`Email: ${email}`);
    console.log("\n--- user table (Better Auth) ---");
    if (user) {
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email Verified: ${user.emailVerified}`);
    } else {
      console.log("No entry in user table");
    }

    // Effective role calculation (ADMIN_EMAILS from env)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const isAdmin = adminEmails.includes(email.toLowerCase());

    console.log("\n--- Effective Role ---");
    console.log(`ADMIN_EMAILS includes this email: ${isAdmin}`);
    console.log(`Effective Role: ${isAdmin ? 'ADMIN' : (user?.role || 'USER')}`);

  } catch (error) {
    console.error("Error checking user role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || "galiprandi@gmail.com";
checkUserRole(email);
