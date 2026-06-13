/**
 * NextAuth.js type extensions for RPM Accesorios
 * 
 * Extends default NextAuth types to include custom role system
 * and additional user properties from Google OAuth
 */

import { UserRole } from '@/lib/auth/roles-client';

declare module 'next-auth' {
  /**
   * Extended session interface with role information
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
    };
  }

  /**
   * Extended user interface with role information
   */
  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface with role information
   */
  interface JWT {
    role: UserRole;
    email?: string;
    name?: string;
    picture?: string;
  }
}

declare module 'next-auth/providers/google' {
  /**
   * Extended Google provider profile with role assignment
   */
  interface GoogleProfile {
    email?: string;
    name?: string;
    picture?: string;
  }
}
