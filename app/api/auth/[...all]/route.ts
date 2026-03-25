/**
 * Better Auth API Handler
 * 
 * Following official Better Auth documentation
 */

import { auth } from '@/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
