# 👥 Módulo de Usuarios

## 📍 Ubicación

- **Página Admin**: `/app/adm/users/page.tsx`
- **Schema Prisma**: `prisma/schema.prisma` → `model User` (Better Auth)
- **Servicio**: `lib/services/userService.ts`
- **Roles**: `lib/auth/roles.ts`
- **Proxy de Sincronización**: `proxy.ts` - Middleware Next.js 16 para sincronización automática

---

## Propósito

Gestión de usuarios del sistema y asignación de roles. Los usuarios se crean automáticamente al hacer login con Google OAuth, y sus roles se sincronizan automáticamente vía `ADMIN_EMAILS`. Los administradores pueden gestionar roles manualmente desde la interfaz.

---

## Modelo de Datos

### User (Prisma - Better Auth)

```prisma
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

**Nota**: Ya no existe la tabla `UserRole` separada. El rol se almacena directamente en la tabla `User` del schema de Better Auth.

---

## Roles Disponibles

| Rol | Código | Acceso | Descripción |
|-----|--------|--------|-------------|
| **Admin** | `ADMIN` | Completo | Acceso total a /adm, gestión de usuarios y configuración |
| **Staff** | `STAFF` | Limitado | Acceso a operaciones diarias (ventas, OTs, caja) |
| **Usuario** | `USER` | Público | Solo acceso a web pública |

---

## UI - Página de Usuarios (`/adm/users`)

### Layout

- **Grid de cards**: Visualización tipo tarjetas de usuario
- **Cada card muestra**: Avatar, nombre, email, rol actual, badge de estado
- **Acciones**: Editar (cambiar rol), Desactivar/Activar, Eliminar
- **Tabla de usuarios**: Columnas - Usuario, Email, Rol, Estado, Acciones

### Componentes

#### Card de Usuario

```typescript
<Card>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={user.isActive ? "text-red-600" : "text-green-600"}
          onClick={() => handleToggleActive(user.id, user.isActive)}
        >
          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </Button>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {getRoleLabel(user.role)}
        </Badge>
        {!user.isActive && <Badge variant="destructive">Inactivo</Badge>}
      </div>
      {user.notes && (
        <p className="text-sm text-muted-foreground pt-2">{user.notes}</p>
      )}
    </div>
  </CardContent>
</Card>
```

#### Badge Variantes por Rol

```typescript
const getRoleBadgeVariant = (role: string): BadgeVariant => {
  switch (role) {
    case 'ADMIN': return 'default';
    case 'STAFF': return 'secondary';
    case 'USER': return 'outline';
    default: return 'secondary';
  }
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    STAFF: 'Staff',
    USER: 'Usuario',
  };
  return labels[role] || role;
};
```

#### Modal de Crear/Editar Usuario

```typescript
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
      <DialogDescription>
        {isEditing 
          ? 'Modifica el rol y datos del usuario.' 
          : 'Crea un usuario manualmente para asignarle acceso al sistema.'}
      </DialogDescription>
    </DialogHeader>

    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="usuario@empresa.com"
          disabled={isEditing} // Email no editable en edición
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" placeholder="Nombre completo" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol *</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="USER">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea 
          id="notes" 
          placeholder="Observaciones sobre el usuario..."
          rows={2}
        />
      </div>
    </form>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>
        {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Reglas de Negocio

### Creación de Usuario

- ✅ **Automático**: Better Auth crea usuario al hacer login con Google OAuth
- ✅ Email debe ser único (constraint de Better Auth)
- ✅ Rol por defecto: `USER` (se puede sobrescribir vía `ADMIN_EMAILS`)
- ✅ No se requiere creación manual previa

### Sincronización de Roles

- ✅ **ADMIN_EMAILS**: Emails en esta variable obtienen rol `ADMIN` automáticamente
- ✅ **Proxy**: Sincronización automática en cada request (transparente al frontend)
- ✅ **Override en memoria**: `getSession()` aplica override para autorización inmediata
- ✅ **Persistencia en DB**: Proxy actualiza rol en base de datos automáticamente

### Gestión Manual de Roles

- ✅ **Solo ADMIN** puede cambiar roles manualmente
- ✅ Se actualiza directamente en tabla `User` (ya no hay tabla `UserRole` separada)
- ✅ Un ADMIN no puede quitarse su propio rol de admin (protección)
- ✅ Debe existir al menos un ADMIN activo

### Restricciones Importantes

- ❌ **Un ADMIN no puede auto-desactivarse**: Evita quedarse sin admins
- ❌ **Debe existir al menos un ADMIN activo**: Validación en backend

---

## Servicio de Usuarios

### User Service Interface

```typescript
// lib/services/userService.ts

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'USER' | 'STAFF' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserInput {
  name?: string;
  role?: 'USER' | 'STAFF' | 'ADMIN';
}

// Listar todos los usuarios
export async function getAllUsers(): Promise<UserWithRole[]>;

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<UserWithRole | null>;

// Actualizar usuario (cambiar rol, etc)
export async function updateUser(
  id: string, 
  input: UpdateUserInput,
  adminEmail: string // Para validación de no auto-quitarse admin
): Promise<UserWithRole>;
```

---

## API Endpoints

### Protected Routes (Solo ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario específico |
| PUT | `/api/users/:id` | Actualizar usuario (rol, etc) |

### API Route Example

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getAllUsers, updateUser } from '@/lib/services/userService';

export async function GET() {
  const session = await getSession();
  
  if (!session?.user || !await hasRole(UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function PUT(request: Request) {
  const session = await getSession();
  
  if (!session?.user || !await hasRole(UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const user = await updateUser(body.id, body, session.user.email);
  return NextResponse.json(user);
}
```

---

## Flujo: Sincronización Automática de Usuarios

### Proxy de Sincronización (Next.js 16 Middleware)

El proxy (`proxy.ts`) se ejecuta automáticamente en cada request y sincroniza el rol de los usuarios que están en `ADMIN_EMAILS`.

```typescript
// proxy.ts
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

### Escenario 1: Usuario hace login por primera vez

1. Usuario autentica con Google OAuth
2. Better Auth crea registro en `User` con rol `USER`
3. Primer request → Proxy detecta email en `ADMIN_EMAILS` y actualiza rol a `ADMIN` en DB
4. `getSession()` aplica override en memoria (acceso inmediato a `/adm`)
5. Usuario accede al sistema con rol correcto

### Escenario 2: Usuario existente hace login

1. Usuario autentica (ya existe en `User`)
2. Proxy verifica si email está en `ADMIN_EMAILS`
3. Si está en la lista y no tiene rol `ADMIN`, actualiza la DB
4. `getSession()` aplica override en memoria
5. Usuario accede con rol correcto

### Escenario 3: ADMIN cambia rol manualmente

1. ADMIN va a `/adm/users`
2. Cambia rol de un usuario
3. Se actualiza directamente en tabla `User`
4. El proxy respeta el rol manual (no lo sobreescribe si el usuario no está en `ADMIN_EMAILS`)

---

## Protección Anti-Auto-Destrucción

### Regla Crítica: No quedarse sin admins

```typescript
// lib/services/userService.ts

async function validateAdminCount(
  targetUserId: string, 
  newRole?: string,
  adminEmail: string
): Promise<void> {
  // No permitir auto-cambio de rol de admin
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (targetUser?.email === adminEmail && newRole !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador');
  }

  // Contar admins restantes si se cambia rol
  if (newRole && newRole !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { 
        role: 'ADMIN',
        email: { not: targetUser?.email },
      },
    });

    if (adminCount === 0) {
      throw new Error('Debe existir al menos un administrador activo');
    }
  }
}
```

---

## Vinculación con Otras Specs

- `@[specs/auth.md]` - Sistema de autenticación y roles (Better Auth)
- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/components.md]` - Componentes UI reutilizables

---

## Cambios Recientes

### 2026-04-07 - Migración a Better Auth
- Migrado de NextAuth.js a Better Auth
- Eliminada tabla `UserRole` separada (rol ahora en tabla `User`)
- Implementado proxy de sincronización automática en lugar de UserSyncServer
- Simplificados roles (solo USER, STAFF, ADMIN)
- Sincronización automática vía `ADMIN_EMAILS` (proxy + getSession)

---

**Estado**: ✅ Implementado  
**Dependencias**: ✅ Better Auth implementado, ✅ Proxy de sincronización activo  
**Última actualización**: 2026-04-07
