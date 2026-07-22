/**
 * Better Auth Configuration for RPM Accesorios
 * 
 * Modern authentication system with Google OAuth and role-based access control
 * Built specifically for Next.js App Router
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

/**
 * Better Auth configuration
 * 
 * Features:
 * - Google OAuth 2.0 authentication
 * - Drizzle database adapter
 * - Role-based access control (via ADMIN_EMAILS env in auth-server.ts)
 * - Session management
 * - TypeScript-first approach
 */
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
      },
    },
  },
  
  emailAndPassword: {
    enabled: false, // Solo Google OAuth
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: true,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      version: 'v2', 
    },
  },
  
  account: {
    accountLinking: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
