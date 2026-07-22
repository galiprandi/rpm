#!/usr/bin/env node
/**
 * Direct SQL Seed for Production Database
 * Bypasses ORM Client issues
 */

import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('🌱 Seeding production database...');
  await client.connect();

  try {
    // Insert category
    await client.query(`
      INSERT INTO "category" (id, name, description, "defaultMarginPercent", color, "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES ('cat-default', 'Sin categoría', 'Categoría por defecto', 30, '#6b7280', 0, true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);
    console.log('✅ Category created');

    // Insert supplier
    await client.query(`
      INSERT INTO "supplier" (id, name, "contactName", phone, email, address, notes, "isActive", "createdAt", "updatedAt")
      VALUES ('sup-default', 'Sin especificar', null, null, null, null, 'Proveedor por defecto', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);
    console.log('✅ Supplier created');

    // Insert user
    await client.query(`
      INSERT INTO "user" (id, name, email, "emailVerified", image, role, "createdAt", "updatedAt")
      VALUES ('user-german', 'Germán Aliprandi', 'galiprandi@gmail.com', true, null, 'ADMIN', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);
    console.log('✅ User created');

    // Insert user role
    await client.query(`
      INSERT INTO "user_role" (id, email, role, name, notes, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'galiprandi@gmail.com', 'ADMIN', 'Germán Aliprandi', 'Admin del sistema', true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    `);
    console.log('✅ UserRole created');

    console.log('🎉 Production seed complete!');
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
