# 👥 Módulo de Usuarios

## 📍 Ubicación

- **Página Admin**: `/app/adm/users/page.tsx`
- **Schema Prisma**: `prisma/schema.prisma` → `model User` | `model UserRole`
- **Servicio**: `lib/services/userService.ts`
- **Roles**: `lib/auth/roles.ts`

---

## Propósito

Gestión de usuarios del sistema y asignación de roles. Permite crear nuevos usuarios manualmente (después del login inicial) y administrar sus permisos desde la interfaz de administración.

---

## Modelo de Datos

### User (Prisma - NextAuth.js)

```prisma
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  role          String    @default("USER") // ADMIN, STAFF, USER
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}
```

### UserRole (Prisma - Role Management)

```prisma
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
  @@map("user_role")
}
```

---

## Roles Disponibles

| Rol | Código | Acceso | Descripción |
|-----|--------|--------|-------------|
| **Admin** | `ADMIN` | Completo | Acceso total a /adm, gestión de usuarios |
| **Vendedor** | `SELLER` | Limitado | Ventas, cotizaciones, clientes |
| **Técnico** | `TECHNICIAN` | Limitado | Tareas, instalaciones, órdenes de trabajo |
| **Cajero** | `CASHIER` | Limitado | Cobros, caja, movimientos diarios |
| **Usuario** | `USER` | Público | Solo acceso a web pública |

---

## UI - Página de Usuarios (`/adm/users`)

### Layout

- **Grid de cards**: Visualización tipo tarjetas de usuario
- **Cada card muestra**: Avatar, nombre, email, rol actual, badge de estado
- **Acciones**: Editar (cambiar rol), Desactivar/Activar, Eliminar

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
    case 'SELLER': return 'secondary';
    case 'TECHNICIAN': return 'outline';
    case 'CASHIER': return 'outline';
    default: return 'secondary';
  }
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    SELLER: 'Vendedor',
    TECHNICIAN: 'Técnico',
    CASHIER: 'Cajero',
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
            <SelectItem value="SELLER">Vendedor</SelectItem>
            <SelectItem value="TECHNICIAN">Técnico</SelectItem>
            <SelectItem value="CASHIER">Cajero</SelectItem>
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

- ✅ **Solo ADMIN** puede crear usuarios manualmente
- ✅ Email debe ser único (constraint de User y UserRole)
- ✅ Al crear usuario, también se crea registro en `UserRole`
- ✅ Usuario creado manualmente estará listo para hacer login con Google OAuth
- ✅ Contraseña: No aplica (usamos Google OAuth)

### Edición de Usuario

- ✅ **Solo ADMIN** puede cambiar roles
- ✅ No se puede editar el email (es el identificador)
- ✅ Al cambiar rol, se actualiza tanto `User.role` como `UserRole.role`
- ✅ Un ADMIN no puede quitarse su propio rol de admin (protección)

### Activación/Desactivación

- ✅ **Soft delete**: Cambia `isActive` a `false` en `UserRole`
- ✅ Usuario desactivado no puede hacer login (middleware check)
- ✅ No se elimina de la base de datos (audit trail)

### Restricciones Importantes

- ❌ **Un ADMIN no puede auto-desactivarse**: Evita quedarse sin admins
- ❌ **Debe existir al menos un ADMIN activo**: Validación en backend
- ❌ **Email de dominio staff**: Puede auto-asignarse STAFF en primer login

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
  role: string;
  isActive: boolean;
  notes?: string | null;
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

// Listar todos los usuarios con sus roles
export async function getAllUsers(): Promise<UserWithRole[]>;

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<UserWithRole | null>;

// Crear usuario manualmente (después del login)
export async function createUser(input: CreateUserInput): Promise<UserWithRole>;

// Actualizar usuario (cambiar rol, notas, etc)
export async function updateUser(
  id: string, 
  input: UpdateUserInput,
  adminEmail: string // Para validación de no auto-quitarse admin
): Promise<UserWithRole>;

// Soft delete (desactivar)
export async function deactivateUser(
  id: string,
  adminEmail: string
): Promise<void>;

// Reactivar usuario
export async function activateUser(id: string): Promise<void>;
```

---

## API Endpoints

### Protected Routes (Solo ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar todos los usuarios con roles |
| GET | `/api/users?activeOnly=true` | Listar solo usuarios activos |
| GET | `/api/users/:id` | Obtener usuario específico |
| **GET** | **`/api/roles`** | **Obtener roles disponibles con descripción** |
| POST | `/api/users` | Crear usuario manualmente |
| PUT | `/api/users/:id` | Actualizar usuario (rol, notas, etc) |
| PATCH | `/api/users/:id/toggle` | Activar/desactivar usuario |
| DELETE | `/api/users/:id` | Desactivar usuario (soft delete) |

### Endpoint: Obtener Roles Disponibles

```typescript
// app/api/roles/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { hasRole } from '@/lib/auth/roles';

export interface RoleOption {
  value: string;        // Código del rol (ADMIN, SELLER, etc)
  label: string;        // Label visible (Administrador, Vendedor, etc)
  description: string;  // Descripción para tooltip o subtítulo
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const ROLES_CONFIG: RoleOption[] = [
  {
    value: 'ADMIN',
    label: 'Administrador',
    description: 'Acceso completo al sistema. Gestiona usuarios, configuración y todos los módulos.',
    badgeVariant: 'default',
  },
  {
    value: 'SELLER',
    label: 'Vendedor',
    description: 'Gestiona ventas, cotizaciones y clientes. Acceso limitado a módulo de ventas.',
    badgeVariant: 'secondary',
  },
  {
    value: 'TECHNICIAN',
    label: 'Técnico',
    description: 'Acceso a órdenes de trabajo, instalaciones y tareas técnicas.',
    badgeVariant: 'outline',
  },
  {
    value: 'CASHIER',
    label: 'Cajero',
    description: 'Gestiona cobros, caja diaria y movimientos de tesorería.',
    badgeVariant: 'outline',
  },
  {
    value: 'USER',
    label: 'Usuario',
    description: 'Cliente final. Solo acceso a web pública, sin acceso a /adm.',
    badgeVariant: 'secondary',
  },
];

export async function GET() {
  const session = await auth();
  
  // Requiere al menos autenticación (cualquier rol)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Solo ADMIN puede ver todos los roles (incluyendo ADMIN)
  // STAFF solo ve roles de staff (no ADMIN)
  const isAdmin = hasRole(session.user.role, 'ADMIN');
  
  const availableRoles = isAdmin 
    ? ROLES_CONFIG 
    : ROLES_CONFIG.filter(r => r.value !== 'ADMIN');

  return NextResponse.json(availableRoles);
}
```

### Uso en UI (Select de Roles)

```typescript
// components/users/UserRoleSelect.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface RoleOption {
  value: string;
  label: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

interface UserRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function UserRoleSelect({ value, onChange, disabled }: UserRoleSelectProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando roles...</div>;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un rol" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            <div className="flex items-center gap-2">
              <Badge variant={role.badgeVariant}>{role.label}</Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {role.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### API Route Example

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { getAllUsers, createUser } from '@/lib/services/userService';
import { hasRole } from '@/lib/auth/roles';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.role || !hasRole(session.user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.role || !hasRole(session.user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  
  // Validation
  if (!body.email || !body.name || !body.role) {
    return NextResponse.json(
      { error: 'Missing required fields' }, 
      { status: 400 }
    );
  }

  const user = await createUser(body);
  return NextResponse.json(user, { status: 201 });
}
```

---

## Flujo: Crear Usuario Después del Login

### Escenario 1: Usuario hace login por primera vez

1. Usuario autentica con Google OAuth
2. NextAuth.js crea automáticamente registro en `User`
3. `getUserRole()` verifica si existe en `UserRole`:
   - Si existe: Usa ese rol
   - Si no existe y es dominio staff: Asigna STAFF
   - Si no existe y es otro dominio: Asigna USER
4. Se crea entrada en `UserRole` con el rol determinado

### Escenario 2: ADMIN crea usuario manualmente (antes del primer login)

1. ADMIN va a `/adm/users`
2. Clica "Nuevo Usuario"
3. Completa email, nombre, rol, notas
4. Sistema crea registro en `UserRole`
5. Cuando ese usuario hace login por primera vez:
   - NextAuth.js crea `User`
   - `getUserRole()` encuentra el registro previo en `UserRole`
   - Se asigna el rol predefinido por el ADMIN

```typescript
// Flujo de creación manual
async function createManualUser(input: CreateUserInput) {
  // 1. Crear UserRole (el usuario aún no existe en User)
  await prisma.userRole.create({
    data: {
      email: input.email.toLowerCase(),
      role: input.role,
      name: input.name,
      notes: input.notes,
      isActive: true,
    },
  });

  // 2. Si el usuario ya existe en User (hizo login antes), actualizar su rol
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: mapToUserRoleEnum(input.role) },
    });
  }
}
```

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
  // Obtener admin que hace la operación
  const currentAdmin = await prisma.userRole.findUnique({
    where: { email: adminEmail },
  });

  // No permitir auto-desactivación de admin
  const targetUser = await prisma.userRole.findFirst({
    where: { 
      user: { id: targetUserId }
    },
  });

  if (targetUser?.email === adminEmail && newRole !== 'ADMIN') {
    throw new Error('No puedes quitarte tu propio rol de administrador');
  }

  // Contar admins restantes si se desactiva/quita rol
  if (newRole && newRole !== 'ADMIN') {
    const adminCount = await prisma.userRole.count({
      where: { 
        role: 'ADMIN', 
        isActive: true,
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

- `@[specs/auth.md]` - Sistema de autenticación y roles
- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/suppliers.md]` - Patrón de CRUD similar
- `@[specs/components.md]` - Componentes UI reutilizables

---

**Estado**: 🟡 Por implementar  
**Dependencias**: ✅ Auth implementado, ✅ UI components listos  
**Última actualización**: 2026-03-29
