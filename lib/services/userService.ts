/**
 * User Service - CRUD operations for users and role management
 *
 * Especificaciones relacionadas:
 * - /specs/users.md
 * - /specs/auth.md
 */

import { db } from '@/lib/db';
import { userRole, user } from '@/db/schema';
import { eq, and, ne, sql, desc } from 'drizzle-orm';

// Types
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER' | 'USER';
  notes?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER' | 'USER';
  notes?: string;
  isActive?: boolean;
}

export interface UserListResult {
  users: UserWithRole[];
  total: number;
}

// Role mapping from UserRole table to User.role enum
function mapToUserRoleEnum(role: string): string {
  const upperRole = role.toUpperCase();
  if (upperRole === 'ADMIN' || upperRole === 'SELLER' || upperRole === 'TECHNICIAN' || upperRole === 'CASHIER') {
    return 'ADMIN';
  }
  return 'USER';
}

/**
 * Get all users with their roles from UserRole table
 */
export async function getUsers(includeInactive: boolean = false): Promise<UserListResult> {
  const userRoles = await db.query.userRole.findMany({
    where: includeInactive ? undefined : eq(userRole.isActive, true),
    orderBy: desc(userRole.createdAt),
  });

  // Get user info for each userRole
  const usersWithRoles = await Promise.all(
    userRoles.map(async (userRoleRec) => {
      const userRec = await db.query.user.findFirst({
        where: eq(user.email, userRoleRec.email),
      });

      return {
        id: userRec?.id || userRoleRec.id,
        name: userRoleRec.name || userRec?.name || userRoleRec.email.split('@')[0],
        email: userRoleRec.email,
        image: userRec?.image || null,
        role: userRoleRec.role,
        isActive: userRoleRec.isActive,
        notes: userRoleRec.notes,
        createdAt: userRec?.createdAt ? new Date(userRec.createdAt) : new Date(userRoleRec.createdAt),
        updatedAt: userRec?.updatedAt ? new Date(userRec.updatedAt) : new Date(userRoleRec.updatedAt),
      };
    })
  );

  // Sort by most recently created first
  const sortedUsers = usersWithRoles.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    users: sortedUsers,
    total: sortedUsers.length,
  };
}

/**
 * Get a single user by email
 */
export async function getUserByEmail(email: string): Promise<UserWithRole | null> {
  const userRoleRec = await db.query.userRole.findFirst({
    where: eq(userRole.email, email.toLowerCase()),
  });

  if (!userRoleRec) return null;

  const userRec = await db.query.user.findFirst({
    where: eq(user.email, userRoleRec.email),
  });

  return {
    id: userRec?.id || userRoleRec.id,
    name: userRoleRec.name || userRec?.name || userRoleRec.email.split('@')[0],
    email: userRoleRec.email,
    image: userRec?.image || null,
    role: userRoleRec.role,
    isActive: userRoleRec.isActive,
    notes: userRoleRec.notes,
    createdAt: userRec?.createdAt ? new Date(userRec.createdAt) : new Date(userRoleRec.createdAt),
    updatedAt: userRec?.updatedAt ? new Date(userRec.updatedAt) : new Date(userRoleRec.updatedAt),
  };
}

/**
 * Get a single user by ID (looks up via User table, then UserRole)
 */
export async function getUserById(id: string): Promise<UserWithRole | null> {
  // First try to find by user id
  const userRec = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  if (userRec) {
    const userRoleRec = await db.query.userRole.findFirst({
      where: eq(userRole.email, userRec.email),
    });

    if (userRoleRec) {
      return {
        id: userRec.id,
        name: userRoleRec.name || userRec.name,
        email: userRec.email,
        image: userRec.image,
        role: userRoleRec.role,
        isActive: userRoleRec.isActive,
        notes: userRoleRec.notes,
        createdAt: new Date(userRec.createdAt),
        updatedAt: new Date(userRec.updatedAt),
      };
    }
  }

  // Try to find by UserRole id
  const userRoleRec = await db.query.userRole.findFirst({
    where: eq(userRole.id, id),
  });

  if (!userRoleRec) return null;

  const linkedUser = await db.query.user.findFirst({
    where: eq(user.email, userRoleRec.email),
  });

  return {
    id: linkedUser?.id || userRoleRec.id,
    name: userRoleRec.name || linkedUser?.name || userRoleRec.email.split('@')[0],
    email: userRoleRec.email,
    image: linkedUser?.image || null,
    role: userRoleRec.role,
    isActive: userRoleRec.isActive,
    notes: userRoleRec.notes,
    createdAt: linkedUser?.createdAt ? new Date(linkedUser.createdAt) : new Date(userRoleRec.createdAt),
    updatedAt: linkedUser?.updatedAt ? new Date(linkedUser.updatedAt) : new Date(userRoleRec.updatedAt),
  };
}

/**
 * Validate that at least one admin will remain after operation
 */
async function validateAdminCount(
  excludeEmail?: string,
  newRole?: string
): Promise<void> {
  // If changing role to non-admin, check remaining admins
  if (newRole && newRole !== 'ADMIN') {
    const conditions = [
      eq(userRole.role, 'ADMIN'),
      eq(userRole.isActive, true),
    ];
    if (excludeEmail) {
      conditions.push(ne(userRole.email, excludeEmail));
    }

    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(userRole)
      .where(and(...conditions));

    const adminCount = result[0]?.count ?? 0;

    if (adminCount === 0) {
      throw new Error('Debe existir al menos un administrador activo');
    }
  }
}

/**
 * Create a new user (manual creation by admin)
 */
export async function createUser(input: CreateUserInput): Promise<UserWithRole> {
  const email = input.email.toLowerCase();

  // Check if userRole already exists
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.email, email),
  });

  if (existingRole) {
    throw new Error('Ya existe un usuario con ese email');
  }

  // Create UserRole record
  const [createdRole] = await db.insert(userRole).values({
    id: crypto.randomUUID(),
    email,
    role: input.role,
    name: input.name,
    notes: input.notes || null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }).returning();

  // If user already exists (had logged in before), update their role
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    await db.update(user).set({ role: mapToUserRoleEnum(input.role) })
      .where(eq(user.id, existingUser.id));

    return {
      id: existingUser.id,
      name: createdRole.name || existingUser.name,
      email: existingUser.email,
      image: existingUser.image,
      role: createdRole.role,
      isActive: createdRole.isActive,
      notes: createdRole.notes,
      createdAt: new Date(existingUser.createdAt),
      updatedAt: new Date(existingUser.updatedAt),
    };
  }

  return {
    id: createdRole.id,
    name: createdRole.name || email.split('@')[0],
    email: createdRole.email,
    image: null,
    role: createdRole.role,
    isActive: createdRole.isActive,
    notes: createdRole.notes,
    createdAt: new Date(createdRole.createdAt),
    updatedAt: new Date(createdRole.updatedAt),
  };
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
  adminEmail: string
): Promise<UserWithRole> {
  // Find the user first
  const userRec = await getUserById(id);
  if (!userRec) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-demotion from admin
  if (userRec.email === adminEmail && input.role && input.role !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador');
  }

  // Validate admin count if changing role
  if (input.role) {
    await validateAdminCount(userRec.email, input.role);
  }

  // Update UserRole record
  const updateData: Partial<typeof userRole.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.notes !== undefined) updateData.notes = input.notes || null;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const [updatedRole] = await db.update(userRole).set(updateData)
    .where(eq(userRole.email, userRec.email)).returning();

  // Update User record if exists
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, userRec.email),
  });

  if (existingUser && input.role !== undefined) {
    await db.update(user).set({ role: mapToUserRoleEnum(input.role) })
      .where(eq(user.id, existingUser.id));
  }

  // Return updated user
  const updatedUser = await db.query.user.findFirst({
    where: eq(user.email, userRec.email),
  });

  return {
    id: updatedUser?.id || updatedRole.id,
    name: updatedRole.name || updatedUser?.name || updatedRole.email.split('@')[0],
    email: updatedRole.email,
    image: updatedUser?.image || null,
    role: updatedRole.role,
    isActive: updatedRole.isActive,
    notes: updatedRole.notes,
    createdAt: updatedUser?.createdAt ? new Date(updatedUser.createdAt) : new Date(updatedRole.createdAt),
    updatedAt: updatedUser?.updatedAt ? new Date(updatedUser.updatedAt) : new Date(updatedRole.updatedAt),
  };
}

/**
 * Toggle user active status (soft delete)
 */
export async function toggleUserActive(
  id: string,
  adminEmail: string
): Promise<UserWithRole> {
  const userRec = await getUserById(id);
  if (!userRec) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-deactivation for admins
  if (userRec.email === adminEmail && userRec.role === 'ADMIN') {
    throw new Error('No puedes desactivar tu propia cuenta de administrador');
  }

  // If deactivating an admin, validate admin count
  if (userRec.isActive && userRec.role === 'ADMIN') {
    await validateAdminCount(userRec.email, 'USER');
  }

  return updateUser(id, { isActive: !userRec.isActive }, adminEmail);
}

/**
 * Delete a user (hard delete - only if no activity)
 * Note: In practice, we use soft delete (toggleUserActive) instead
 */
export async function deleteUser(id: string, adminEmail: string): Promise<void> {
  const userRec = await getUserById(id);
  if (!userRec) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-deletion
  if (userRec.email === adminEmail) {
    throw new Error('No puedes eliminar tu propia cuenta');
  }

  // Validate admin count for admins
  if (userRec.role === 'ADMIN') {
    await validateAdminCount(userRec.email, 'USER');
  }

  // Delete UserRole record
  await db.delete(userRole).where(eq(userRole.email, userRec.email));

  // Note: User record in auth tables is kept for audit trail
}
