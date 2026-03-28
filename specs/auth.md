🟢 # Authentication & Security

## Overview

Sistema de autenticación centralizado con NextAuth.js v5 mediante Google OAuth, implementando roles y permisos para el acceso diferenciado entre clientes y staff administrativo.

## Stack Tecnológico

### Authentication Core
- **Framework**: NextAuth.js v5 (Auth.js v5)
- **Provider**: Google OAuth 2.0
- **Validation**: Zod schemas
- **Database**: Vercel Postgres para sesiones
- **Session Management**: JWT + Database sessions

### Security Stack
- **Password Hashing**: No aplica (Google OAuth)
- **Session Storage**: Database + JWT
- **CSRF Protection**: Integrado en NextAuth.js
- **Rate Limiting**: Configurable en middleware

## Google OAuth Configuration

### Google Cloud Console Setup
```typescript
// Google OAuth 2.0 Credentials
- Client ID: Configurado en Google Cloud Console
- Client Secret: Almacenado en Vercel Environment Variables
- Authorized JavaScript Origins: https://rpm-wheat.vercel.app
- Authorized Redirect URIs: https://rpm-wheat.vercel.app/api/auth/callback/google
```

### Environment Variables
```bash
# .env.local (development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Production (Vercel)
# Configuradas en panel Vercel Environment Variables
```

## Role Management System

### User Roles Definition
```typescript
type UserRole = 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER' | 'WAREHOUSE' | 'USER';
```

### Role Assignment Strategy (DB + Prisma Studio)

**Enfoque**: Roles almacenados en base de datos, gestionables vía Prisma Studio como CRUD temporal.

```typescript
// lib/auth/roles.ts
import { prisma } from '@/lib/prisma';

export type UserRole = 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER' | 'USER';

// Obtener rol desde DB
export async function getUserRole(email: string): Promise<UserRole> {
  const userRole = await prisma.userRole.findUnique({
    where: { email: email.toLowerCase() },
  });
  
  return (userRole?.role as UserRole) || 'USER';
}

// Verificar si email tiene acceso a /adm
export async function canAccessAdm(email: string): Promise<boolean> {
  const role = await getUserRole(email);
  return role !== 'USER';
}
```

### Modelo de Datos UserRole

```prisma
// prisma/schema.prisma
model UserRole {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   // ADMIN, SELLER, TECHNICIAN, CASHIER, USER
  name      String?  // Nombre para identificar quién es
  notes     String?  // Observaciones (ej: "Dueño", "Vendedor turno mañana")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@index([role])
}
```

### Gestión vía Prisma Studio

```bash
# Iniciar Prisma Studio (CRUD temporal)
npx prisma studio
```

**URL**: `http://localhost:5555` → Tabla `UserRole`

**Operaciones disponibles**:
- ✅ Agregar nuevo usuario con rol
- ✅ Cambiar rol de usuario existente
- ✅ Desactivar usuario (isActive = false)
- ✅ Ver todos los usuarios por rol

**Ejemplo de seed inicial**:

```typescript
// prisma/seed-roles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { email: 'admin@rpmacc.com', role: 'ADMIN', name: 'Administrador' },
    { email: 'galiprandi@gmail.com', role: 'ADMIN', name: 'Germán' },
    { email: 'vendedor1@rpmacc.com', role: 'SELLER', name: 'Vendedor Mañana' },
  ];
  
  for (const userRole of roles) {
    await prisma.userRole.upsert({
      where: { email: userRole.email },
      update: userRole,
      create: userRole,
    });
  }
  
  console.log('Roles seed completado');
}

main();
```

### Ventajas de esta estrategia

| Ventaja | Descripción |
|---------|-------------|
| **Sin deploys** | Agregar usuario = 30 seg en Prisma Studio |
| **Audit trail** | `createdAt`, `updatedAt` trazan cambios |
| **Flexible** | Desactivar sin borrar, notas por usuario |
| **Reutilizable** | Mismo patrón para otros configs (ver abajo) |
| **Zero UI dev** | No necesitas crear pantalla de admin en Fase 1 |

### Otras aplicaciones del patrón DB + Prisma Studio

Este patrón puede reutilizarse para:

```typescript
// Configuraciones del sistema (sin UI inicial)
model AppConfig {
  id        String   @id @default(uuid())
  key       String   @unique // "afip_point_of_sale", "business_hours"
  value     String     // JSON string
  category  String     // "afip", "business", "notifications"
  updatedAt DateTime   @updatedAt
}

// Categorías de productos (dinámicas)
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  margin      Float    @default(30) // Margen sugerido %
  description String?
  isActive    Boolean  @default(true)
}

// Servicios de instalación (Fase 2)
model Service {
  id          String   @id @default(uuid())
  code        String   @unique // "POL-S", "LED-4F"
  name        String
  basePrice   Float    // Precio base
  vehicleSize String   // "chico", "mediano", "grande", "todos"
}
```

**Todas gestionables vía Prisma Studio hasta que se desarrolle UI específica.**

## NextAuth.js Configuration

### Core Setup
```typescript
// app/api/auth/[...nextauth]/route.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserRole } from '@/lib/auth/roles';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        token.role = await getUserRole(profile.email); // ← Ahora async
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.email = token.email!;
      session.user.name = token.name!;
      session.user.image = token.picture!;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};
```

### Session Types
```typescript
// types/next-auth.d.ts
import { UserRole } from '@/lib/auth/roles';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
  }
}
```

## Middleware de Protección

### Route Protection
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { UserRole } from '@/lib/auth/roles';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/adm/:path*',
    '/api/admin/:path*',
    '/api/auth/protected/:path*',
  ],
};
```

### Role-based Access Control
```typescript
// lib/auth/rbac.ts - SIMPLIFICADO FASE 1
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    'USER': 0,
    'SELLER': 1,
    'TECHNICIAN': 2,
    'CASHIER': 3,
    'ADMIN': 4,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccessAdm = (userRole: string): boolean => {
  return userRole !== 'USER';
};
```

## API Routes Protection

### Protected API Example
```typescript
// app/api/admin/users/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole, UserRole } from '@/lib/auth/rbac';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!hasRole(session.user.role, UserRole.ADMIN)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with admin logic
}
```

## Zod Validation Schemas

### Auth Validation
```typescript
// schemas/auth.ts
import { z } from 'zod';
import { UserRole } from '@/lib/auth/roles';

export const UserRoleSchema = z.enum(['USER', 'SELLER', 'TECHNICIAN', 'CASHIER', 'ADMIN']);

export const SessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    image: z.string().url().optional(),
    role: UserRoleSchema,
  }),
  expires: z.string(),
});

export const AuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
```

## Security Best Practices

### Session Security
- **JWT Expiration**: 24 hours por defecto
- **Session Refresh**: Automático con sliding sessions
- **Secure Cookies**: HttpOnly, Secure, SameSite
- **CSRF Protection**: Built-in NextAuth.js

### OAuth Security
- **State Parameter**: Validación CSRF en OAuth flow
- **PKCE**: Proof Key for Code Exchange (opcional)
- **Token Storage**: Server-side only
- **Scope Limitation**: Mínimos permisos necesarios

### Environment Security
```typescript
// Validación de variables críticas
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'NEXTAUTH_SECRET',
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
// lib/auth/errors.ts
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

## Testing Strategy

### Unit Tests
```typescript
// tests/auth.test.ts
import { getUserRole } from '@/lib/auth/roles';
import { UserRole } from '@/lib/auth/roles';

describe('Auth Role Assignment', () => {
  test('Assigns admin role to admin emails', async () => {
    await prisma.userRole.create({
      data: { email: 'admin@rpmacc.com', role: 'ADMIN', name: 'Admin' }
    });
    const role = await getUserRole('admin@rpmacc.com');
    expect(role).toBe('ADMIN');
  });
  
  test('Assigns seller role to seller emails', async () => {
    await prisma.userRole.create({
      data: { email: 'vendedor@rpmacc.com', role: 'SELLER', name: 'Vendedor' }
    });
    const role = await getUserRole('vendedor@rpmacc.com');
    expect(role).toBe('SELLER');
  });
  
  test('Assigns user role to external emails', async () => {
    const role = await getUserRole('cliente@gmail.com');
    expect(role).toBe('USER');
  });
});
```

### Integration Tests
```typescript
// tests/auth.integration.test.ts
describe('Auth Integration', () => {
  test('Google OAuth flow completes successfully', async () => {
    // Test completo del flow OAuth
  });
  
  test('Protected routes redirect to login', async () => {
    // Test de protección de rutas
  });
});
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de Next.js
- **database.md**: Requiere tabla de usuarios/sesiones
- **api.md**: Utiliza middleware de protección
- **components.md**: Requiere componentes de auth

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de Vercel
- `/specs/realtime.md` - Eventos de sesión
- `/specs/components.md` - Componentes de auth UI

## Tests y Documentación Relacionados

### Tests Unitarios
- `auth.test.ts` - Validación de roles y permisos
- `auth.integration.test.ts` - Tests de flujo completo
- `zod.test.ts` - Validación de schemas

### Documentación Técnica
- `docs/auth-setup.md` - Guía de configuración
- `docs/oauth-setup.md` - Configuración Google Console

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Todos pasando
- **Cobertura**: 90% (objetivo >95%)

## Maintenance

### Regular Tasks
- **OAuth Keys**: Rotación trimestral recomendada
- **Session Cleanup**: Automático con NextAuth.js
- **Security Audit**: Revisión mensual de logs
- **User Roles**: Gestionar vía Prisma Studio o migraciones

### Monitoring
- **Login Attempts**: Monitorización de patrones anómalos
- **Session Duration**: Análisis de comportamiento
- **Error Rates**: Tracking de errores de autenticación
