/**
 * Better Auth Configuration for RPM Accesorios
 * 
 * Modern authentication system with Google OAuth and role-based access control
 * Built specifically for Next.js App Router
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

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
   * Session callback - creates UserRole on first session
   */
  callbacks: {
    session: async (session: { user: { id?: string; email?: string; name?: string; role?: string } }) => {
      // Create UserRole if user exists and has email
      if (session.user?.email && session.user?.id) {
        try {
          const existing = await prisma.userRole.findUnique({
            where: { email: session.user.email },
          });

          if (!existing) {
            // Create UserRole with USER role by default
            await prisma.userRole.create({
              data: {
                email: session.user.email,
                role: 'USER',
                name: session.user.name || session.user.email.split('@')[0],
                isActive: true,
              },
            });
          }
        } catch (err) {
          console.error('Error creating UserRole in session callback:', err);
        }
      }
      
      return session;
    },
  },
});

export type Session = typeof auth.$Infer.Session;
