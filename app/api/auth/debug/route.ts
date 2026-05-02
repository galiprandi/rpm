/**
 * Debug Auth API Endpoint
 * 
 * Allows bypassing Google OAuth authentication during development.
 * Only available when DEBUG_AUTH_ENABLED=true and NODE_ENV !== 'production'.
 * 
 * POST /api/auth/debug - Create debug session with specified role
 * DELETE /api/auth/debug - Clear debug session
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/auth/roles';

const DEBUG_COOKIE_NAME = 'rpm_debug_auth';
const DEBUG_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Check if debug auth is enabled
 * Returns false in production or if DEBUG_AUTH_ENABLED is not set
 */
function isDebugAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEBUG_AUTH_ENABLED === 'true'
  );
}

/**
 * Create a mock debug session
 */
function createDebugSession(role: UserRole) {
  const timestamp = Date.now();
  return {
    user: {
      id: `debug-${role.toLowerCase()}-${timestamp}`,
      name: `Debug ${role}`,
      email: `debug-${role.toLowerCase()}@rpm.local`,
      image: null,
      role: role,
    },
    session: {
      id: `debug-session-${timestamp}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + DEBUG_COOKIE_MAX_AGE * 1000),
      userId: `debug-${role.toLowerCase()}-${timestamp}`,
    },
  };
}

/**
 * POST /api/auth/debug
 * Create a debug authentication session
 */
export async function POST(request: NextRequest) {
  if (!isDebugAuthEnabled()) {
    return NextResponse.json(
      { error: 'Debug auth not enabled' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const role = (body.role as UserRole) || UserRole.USER;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` },
        { status: 400 }
      );
    }

    const debugSession = createDebugSession(role);

    // Set cookie with debug session
    const cookieStore = await cookies();
    cookieStore.set({
      name: DEBUG_COOKIE_NAME,
      value: JSON.stringify(debugSession),
      httpOnly: true,
      secure: false, // Allow HTTP in development
      sameSite: 'lax',
      maxAge: DEBUG_COOKIE_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      role,
      user: debugSession.user,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create debug session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/debug
 * Clear the debug authentication session
 */
export async function DELETE() {
  if (!isDebugAuthEnabled()) {
    return NextResponse.json(
      { error: 'Debug auth not enabled' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(DEBUG_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Debug session cleared',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to clear debug session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/debug
 * Check current debug session status
 */
export async function GET() {
  if (!isDebugAuthEnabled()) {
    return NextResponse.json(
      { error: 'Debug auth not enabled' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const debugCookie = cookieStore.get(DEBUG_COOKIE_NAME);

    if (!debugCookie?.value) {
      return NextResponse.json({
        enabled: true,
        authenticated: false,
      });
    }

    const session = JSON.parse(debugCookie.value);

    return NextResponse.json({
      enabled: true,
      authenticated: true,
      user: session.user,
      role: session.user.role,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to read debug session' },
      { status: 500 }
    );
  }
}
