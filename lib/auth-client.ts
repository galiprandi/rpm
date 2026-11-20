/**
 * Better Auth Client Configuration
 * 
 * Following official Better Auth documentation
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
});

export type Session = typeof authClient.$Infer.Session;
