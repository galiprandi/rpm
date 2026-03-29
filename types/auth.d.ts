import { UserRole } from './auth/roles';

declare module 'better-auth' {
  interface User {
    role: UserRole;
  }
}
