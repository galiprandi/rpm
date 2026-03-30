import "dotenv/config";
import { prisma } from "../lib/prisma";

async function checkUserRole(email: string) {
  try {
    // Check user_role table
    const userRole = await prisma.userRole.findUnique({
      where: { email },
    });

    // Check user table (Better Auth)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("\n=== User Role Information ===");
    console.log(`Email: ${email}`);
    console.log("\n--- user_role table ---");
    if (userRole) {
      console.log(`Role: ${userRole.role}`);
      console.log(`Name: ${userRole.name || "N/A"}`);
      console.log(`Active: ${userRole.isActive}`);
      console.log(`Last Login: ${userRole.lastLogin || "N/A"}`);
      console.log(`Notes: ${userRole.notes || "N/A"}`);
    } else {
      console.log("No entry in user_role table");
    }

    console.log("\n--- user table (Better Auth) ---");
    if (user) {
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email Verified: ${user.emailVerified}`);
    } else {
      console.log("No entry in user table");
    }

    // Effective role calculation (same logic as roles.ts)
    let effectiveRole = "USER";
    if (userRole?.isActive) {
      const role = userRole.role.toUpperCase();
      if (["ADMIN", "SELLER", "TECHNICIAN", "CASHIER"].includes(role)) {
        effectiveRole = "ADMIN";
      } else if (role === "STAFF") {
        effectiveRole = "STAFF";
      }
    } else if (email.endsWith("@rpmacc.com") || email.endsWith("@rpm-sys.com")) {
      effectiveRole = "STAFF (domain fallback)";
    }

    console.log("\n--- Effective Role ---");
    console.log(`Effective Role: ${effectiveRole}`);

  } catch (error) {
    console.error("Error checking user role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || "galiprandi@gmail.com";
checkUserRole(email);
