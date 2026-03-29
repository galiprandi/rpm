/**
 * User Service - CRUD operations for users and role management
 *
 * Especificaciones relacionadas:
 * - /specs/users.md
 * - /specs/auth.md
 */

import { prisma } from '@/lib/prisma';

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
  const userRoles = await prisma.userRole.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get user info for each userRole
  const usersWithRoles = await Promise.all(
    userRoles.map(async (userRole) => {
      const user = await prisma.user.findUnique({
        where: { email: userRole.email },
      });

      return {
        id: user?.id || userRole.id,
        name: userRole.name || user?.name || userRole.email.split('@')[0],
        email: userRole.email,
        image: user?.image || null,
        role: userRole.role,
        isActive: userRole.isActive,
        notes: userRole.notes,
        createdAt: user?.createdAt || userRole.createdAt,
        updatedAt: user?.updatedAt || userRole.updatedAt,
      };
    })
  );

  return {
    users: usersWithRoles,
    total: usersWithRoles.length,
  };
}

/**
 * Get a single user by email
 */
export async function getUserByEmail(email: string): Promise<UserWithRole | null> {
  const userRole = await prisma.userRole.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!userRole) return null;

  const user = await prisma.user.findUnique({
    where: { email: userRole.email },
  });

  return {
    id: user?.id || userRole.id,
    name: userRole.name || user?.name || userRole.email.split('@')[0],
    email: userRole.email,
    image: user?.image || null,
    role: userRole.role,
    isActive: userRole.isActive,
    notes: userRole.notes,
    createdAt: user?.createdAt || userRole.createdAt,
    updatedAt: user?.updatedAt || userRole.updatedAt,
  };
}

/**
 * Get a single user by ID (looks up via User table, then UserRole)
 */
export async function getUserById(id: string): Promise<UserWithRole | null> {
  // First try to find by user id
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (user) {
    const userRole = await prisma.userRole.findUnique({
      where: { email: user.email },
    });

    if (userRole) {
      return {
        id: user.id,
        name: userRole.name || user.name,
        email: user.email,
        image: user.image,
        role: userRole.role,
        isActive: userRole.isActive,
        notes: userRole.notes,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
  }

  // Try to find by UserRole id
  const userRole = await prisma.userRole.findFirst({
    where: { id },
  });

  if (!userRole) return null;

  const linkedUser = await prisma.user.findUnique({
    where: { email: userRole.email },
  });

  return {
    id: linkedUser?.id || userRole.id,
    name: userRole.name || linkedUser?.name || userRole.email.split('@')[0],
    email: userRole.email,
    image: linkedUser?.image || null,
    role: userRole.role,
    isActive: userRole.isActive,
    notes: userRole.notes,
    createdAt: linkedUser?.createdAt || userRole.createdAt,
    updatedAt: linkedUser?.updatedAt || userRole.updatedAt,
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
    const adminCount = await prisma.userRole.count({
      where: {
        role: 'ADMIN',
        isActive: true,
        email: excludeEmail ? { not: excludeEmail } : undefined,
      },
    });

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
  const existingRole = await prisma.userRole.findUnique({
    where: { email },
  });

  if (existingRole) {
    throw new Error('Ya existe un usuario con ese email');
  }

  // Create UserRole record
  const userRole = await prisma.userRole.create({
    data: {
      email,
      role: input.role,
      name: input.name,
      notes: input.notes || null,
      isActive: true,
    },
  });

  // If user already exists (had logged in before), update their role
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: mapToUserRoleEnum(input.role) },
    });

    return {
      id: existingUser.id,
      name: userRole.name || existingUser.name,
      email: existingUser.email,
      image: existingUser.image,
      role: userRole.role,
      isActive: userRole.isActive,
      notes: userRole.notes,
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt,
    };
  }

  return {
    id: userRole.id,
    name: userRole.name || email.split('@')[0],
    email: userRole.email,
    image: null,
    role: userRole.role,
    isActive: userRole.isActive,
    notes: userRole.notes,
    createdAt: userRole.createdAt,
    updatedAt: userRole.updatedAt,
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
  const user = await getUserById(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-demotion from admin
  if (user.email === adminEmail && input.role && input.role !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador');
  }

  // Validate admin count if changing role
  if (input.role) {
    await validateAdminCount(user.email, input.role);
  }

  // Update UserRole record
  const userRole = await prisma.userRole.update({
    where: { email: user.email },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  // Update User record if exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existingUser && input.role !== undefined) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: mapToUserRoleEnum(input.role) },
    });
  }

  // Return updated user
  const updatedUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  return {
    id: updatedUser?.id || userRole.id,
    name: userRole.name || updatedUser?.name || userRole.email.split('@')[0],
    email: userRole.email,
    image: updatedUser?.image || null,
    role: userRole.role,
    isActive: userRole.isActive,
    notes: userRole.notes,
    createdAt: updatedUser?.createdAt || userRole.createdAt,
    updatedAt: updatedUser?.updatedAt || userRole.updatedAt,
  };
}

/**
 * Toggle user active status (soft delete)
 */
export async function toggleUserActive(
  id: string,
  adminEmail: string
): Promise<UserWithRole> {
  const user = await getUserById(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-deactivation for admins
  if (user.email === adminEmail && user.role === 'ADMIN') {
    throw new Error('No puedes desactivar tu propia cuenta de administrador');
  }

  // If deactivating an admin, validate admin count
  if (user.isActive && user.role === 'ADMIN') {
    await validateAdminCount(user.email, 'USER');
  }

  return updateUser(id, { isActive: !user.isActive }, adminEmail);
}

/**
 * Delete a user (hard delete - only if no activity)
 * Note: In practice, we use soft delete (toggleUserActive) instead
 */
export async function deleteUser(id: string, adminEmail: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Prevent self-deletion
  if (user.email === adminEmail) {
    throw new Error('No puedes eliminar tu propia cuenta');
  }

  // Validate admin count for admins
  if (user.role === 'ADMIN') {
    await validateAdminCount(user.email, 'USER');
  }

  // Delete UserRole record
  await prisma.userRole.delete({
    where: { email: user.email },
  });

  // Note: User record in auth tables is kept for audit trail
}
