"use client";

/**
 * UserProvider — Client-side context for user data and permission checks.
 *
 * Wraps the admin layout and provides:
 * - user: { id, name, email, role, permissions }
 * - can(permission): boolean — check if user has a permission
 * - isAdmin: boolean
 *
 * ADMIN always has all permissions (permissions = ['*']).
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { UserRole } from "@/lib/auth/roles-client";

interface UserContextValue {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  can: (permission: string) => boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    permissions?: string[];
  };
}

export function UserProvider({ children, user }: UserProviderProps) {
  const value = useMemo<UserContextValue>(() => {
    const role = (user.role?.toUpperCase() as UserRole) || UserRole.USER;
    const permissions = user.permissions ?? [];
    const isAdmin = role === UserRole.ADMIN;

    const can = (permission: string): boolean => {
      if (isAdmin) return true;
      if (permissions.includes("*")) return true;
      return permissions.includes(permission);
    };

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      permissions,
      can,
      isAdmin,
    };
  }, [user.id, user.name, user.email, user.role, user.permissions]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access user data and permission checks.
 * Must be used within a UserProvider.
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
