🟢 # Authentication & Security

## Overview

Sistema de autenticación centralizado con Better Auth mediante Google OAuth, implementando roles y permisos para el acceso diferenciado entre clientes y staff administrativo.

## Stack Tecnológico

### Authentication Core
- **Framework**: Better Auth
- **Provider**: Google OAuth 2.0
- **Database**: PostgreSQL con Prisma ORM
- **Session Management**: Database sessions con cookie caching

### Security Stack
- **Password Hashing**: No aplica (Google OAuth)
- **Session Storage**: Database + Cookie Cache (5 minutos)
- **CSRF Protection**: Integrado en Better Auth
- **Account Linking**: Deshabilitado (solo un provider por usuario)

## Google OAuth Configuration

### Google Cloud Console Setup
```typescript
// Google OAuth 2.0 Credentials
- Client ID: Configurado en Google Cloud Console
- Client Secret: Almacenado en Environment Variables
- Authorized JavaScript Origins: http://localhost:3000 (dev), https://rpm-wheat.vercel.app (prod)
- Authorized Redirect URIs: http://localhost:3000/api/auth/callback/google (dev), https://rpm-wheat.vercel.app/api/auth/callback/google (prod)
```

### Environment Variables
```bash
# .env.local (development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-better-auth-secret
ADMIN_EMAILS=admin@example.com,galiprandi@gmail.com

# Production (Vercel)
# Configuradas en panel Vercel Environment Variables
```

## Role Management System

### User Roles Definition
```typescript
type UserRole = 'ADMIN' | 'STAFF' | 'USER';

// Role hierarchy for authorization
const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 0,
  STAFF: 1,
  ADMIN: 2,
};
```

### Role Assignment Strategy

**Enfoque**: Roles almacenados en base de datos (tabla `user`), con sincronización automática vía `ADMIN_EMAILS`.

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  name          String?
  role          String    @default("USER")  // USER | STAFF | ADMIN
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  
  @@index([email])
  @@index([role])
}
```

### ADMIN_EMAILS Environment Variable

Para casos de emergencia o primer setup sin acceso a DB, se puede configurar admins vía environment variable:

```bash
# .env.local o Vercel Environment Variables
ADMIN_EMAILS=admin@example.com,galiprandi@gmail.com
```

**Comportamiento:**
- Los emails en `ADMIN_EMAILS` automáticamente reciben rol `ADMIN` al iniciar sesión
- Funciona incluso si el usuario no existe en DB (Better Auth lo crea automáticamente)
- Override se aplica en dos capas:
  1. **En memoria** (`getSession()` en `lib/auth-server.ts`) - para autorización inmediata
  2. **En base de datos** (`proxy.ts`) - para persistencia automática
- Útil para:
  - Primer acceso tras reset de DB (sin seed)
  - Recuperación de acceso administrativo
  - Setup inicial en producción

**Seguridad:**
- Variable no expuesta al cliente (server-side only)
- Validación de sesión vía Better Auth (cookies seguras)
- No reemplaza la gestión de roles vía DB, funciona en conjunto

### Proxy de Sincronización Automática

```typescript
// proxy.ts (Next.js 16 middleware)
export async function proxy(request: NextRequest) {
  // Skip static files and API routes
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Sync role with ADMIN_EMAILS if user is authenticated
    if (session?.user?.email) {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
      
      if (adminEmails.includes(session.user.email.toLowerCase())) {
        const currentRole = (session.user as { role?: string }).role;
        
        // Update role in database if not already ADMIN
        if (currentRole !== 'ADMIN') {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { role: 'ADMIN' },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error syncing role in proxy:', error);
  }

  return NextResponse.next();
}
```

**Características:**
- Se ejecuta automáticamente en cada request
- Transparente al frontend
- No bloquea requests si falla (error handling)
- Solo actualiza si es necesario (optimización)

## Better Auth Configuration

### Core Setup
```typescript
// auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
```

### Session Helpers
```typescript
// lib/auth-server.ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { UserRole } from './auth/roles';

export async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  // Override role based on ADMIN_EMAILS environment variable
  if (session?.user) {
    const userEmail = (session.user as { email?: string }).email;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    
    if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
      (session.user as { role: string }).role = 'ADMIN';
    }
  }
  
  return session;
}

export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  const userRole = (session.user as { role: string }).role as UserRole;
  const ROLE_HIERARCHY: Record<UserRole, number> = {
    USER: 0,
    STAFF: 1,
    ADMIN: 2,
  };
  
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

## Debug Auth (Development Only)

Para facilitar testing durante desarrollo, existe un modo debug que permite bypass de autenticación Google OAuth.

### Activar Debug Auth
```bash
# .env.local
DEBUG_AUTH_ENABLED=true
DEBUG_AUTH_DEFAULT_ROLE=ADMIN  # USER | STAFF | ADMIN
```

### Comportamiento
- Solo funciona cuando `NODE_ENV !== 'production'`
- Requiere `DEBUG_AUTH_ENABLED=true` explícito
- Crea sesión mock con cookie `rpm_debug_auth`
- Compatible con override de `ADMIN_EMAILS`

### API de Debug
- `POST /api/auth/debug` - Crear sesión con rol específico
- `DELETE /api/auth/debug` - Limpiar sesión
- `GET /api/auth/debug` - Verificar estado de sesión

## Route Protection

### Server Components
```typescript
// app/adm/layout.tsx
import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/adm');
  }

  const isAuthorized = await hasRole(UserRole.STAFF);
  
  if (!isAuthorized) {
    redirect('/');
  }

  return <>{children}</>;
}
```

### Client Components
```typescript
// app/adm/page.tsx
'use client';
import { authClient } from '@/lib/auth-client';

export default function AdminDashboard() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return <div>No autorizado</div>;
  }

  // Render admin content
}
```

### Role-based Access Control
```typescript
// lib/auth-server.ts
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  const userRole = (session.user as { role: string }).role as UserRole;
  const ROLE_HIERARCHY: Record<UserRole, number> = {
    USER: 0,
    STAFF: 1,
    ADMIN: 2,
  };
  
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

## API Routes Protection

### Protected API Example
```typescript
// app/api/admin/users/route.ts
import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!await hasRole(UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with admin logic
  return NextResponse.json({ users: [] });
}
```

## Security Best Practices

### Session Security
- **Session Expiration**: 7 días
- **Cookie Cache**: 5 minutos para optimización
- **Secure Cookies**: HttpOnly, Secure, SameSite (configurado por Better Auth)
- **CSRF Protection**: Built-in Better Auth

### OAuth Security
- **State Parameter**: Validación CSRF en OAuth flow (Better Auth)
- **Token Storage**: Server-side only
- **Scope Limitation**: Mínimos permisos necesarios (email, profile)

### Environment Security
```typescript
// Validación de variables críticas
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'BETTER_AUTH_SECRET',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## Error Handling

### Auth Error Types
```typescript
// lib/auth-server.ts
export enum AuthError {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  OAUTH_CALLBACK_ERROR = 'OAUTH_CALLBACK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error) {
    case AuthError.ACCESS_DENIED:
      return 'No tienes permisos para acceder a esta sección';
    case AuthError.SESSION_EXPIRED:
      return 'Tu sesión ha expirado, por favor inicia sesión nuevamente';
    default:
      return 'Error de autenticación, intenta nuevamente';
  }
};
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de Next.js
- **database.md**: Requiere tabla de usuarios/sesiones de Better Auth
- **api.md**: Utiliza helpers de auth-server.ts
- **components.md**: Requiere componentes de auth UI

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de Vercel
- `/specs/users.md` - Gestión de usuarios
- `/specs/spec-admin-dashboard.md` - Panel de administración

## Maintenance

### Regular Tasks
- **OAuth Keys**: Rotación trimestral recomendada
- **Session Cleanup**: Automático con Better Auth
- **Security Audit**: Revisión mensual de logs
- **User Roles**: Gestionar vía ADMIN_EMAILS o directamente en DB

### Monitoring
- **Login Attempts**: Monitorización de patrones anómalos
- **Session Duration**: Análisis de comportamiento
- **Error Rates**: Tracking de errores de autenticación
- **Proxy Performance**: Monitorización del proxy de sincronización

## Cambios Recientes

### 2026-04-07 - Migración a Better Auth
- Migrado de NextAuth.js v5 a Better Auth
- Implementado proxy de sincronización automática de roles
- Eliminada tabla `UserRole` separada (rol ahora en tabla `user`)
- Agregado override de `ADMIN_EMAILS` en dos capas (memoria + DB)
- Compatible con modo debug para desarrollo
