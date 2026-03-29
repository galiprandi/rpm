/**
 * Better Auth Configuration for RPM Accesorios
 * 
 * Modern authentication system with Google OAuth and role-based access control
 * Built specifically for Next.js App Router
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { getUserRole, UserRole } from './auth/roles';

/**
 * Better Auth configuration
 * 
 * Features:
 * - Google OAuth 2.0 authentication
 * - Prisma database adapter
 * - Role-based access control
 * - Session management
 * - TypeScript-first approach
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
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
      version: 'v2', // Increment to invalidate old sessions with wrong role
    },
  },
  
  account: {
    accountLinking: {
      enabled: false,
    },
  },

  /**
   * Session callback to include role in session
   */
  callbacks: {
    session: async (session: { user: { role?: string } }) => {
      // Role is already in the database and included via Prisma adapter
      return session;
    },
  },
});

export type Session = typeof auth.$Infer.Session;
