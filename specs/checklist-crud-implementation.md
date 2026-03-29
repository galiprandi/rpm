# 📋 Checklist para Implementación de Nuevos CRUDs

> **Documento de referencia obligatoria** antes de iniciar cualquier nuevo CRUD en el proyecto RPM.
> Basado en errores y correcciones de la implementación de Supplier CRUD (Sesión 2026-03-28)

---

## 🎯 Antes de Empezar: Leer Especificaciones

### 1. Revisar AGENTS.md
- [ ] Política de idioma (especs en español, código en inglés)
- [ ] Regla de comentarios: **TODO en inglés**
- [ ] Arquitectura de servicios (funciones puras en `lib/services/`)
- [ ] Storybook integration (actualización obligatoria)
- [ ] Flujo de trabajo basado en especificaciones

### 2. Revisar specs/ui-architecture-adm.md
- [ ] Layout CRUD estándar (Header → Stats → Filtros → Tabla)
- [ ] Ubicación consistente del botón "+ Nuevo" (siempre en header)
- [ ] Botón CTA principal (bg-slate-900)
- [ ] Reglas por tipo de CRUD (Importante/Catalogo/Config)

### 3. Revisar specs existentes relacionadas
- [ ] Modelo de datos (Prisma)
- [ ] Reglas de negocio
- [ ] API endpoints esperados
- [ ] UI components necesarios

---

## 🏗️ Arquitectura de 3 Capas (Obligatorio)

```
┌─────────────────────────────────────────┐
│  CAPA 1: UI (Pages/Components)          │
│  - app/adm/[entity]/page.tsx            │
│  - components/[entity]/*.tsx            │
│  - NO lógica de negocio inline          │
├─────────────────────────────────────────┤
│  CAPA 2: API Routes (Controllers)      │
│  - app/api/[entity]/route.ts            │
│  - app/api/[entity]/[id]/route.ts       │
│  - Solo validación y delegación         │
│  - Comentarios en INGLÉS obligatorio    │
├─────────────────────────────────────────┤
│  CAPA 3: Services (Lógica de negocio)  │
│  - lib/services/[entity]Service.ts     │
│  - Funciones puras, reutilizables       │
│  - Usadas por API y Bot Tools           │
└─────────────────────────────────────────┘
```

---

## 🎨 UX/UI Standards - Reglas Definidas en Sesión

### 1. Layout CRUD Admin - Estructura Vertical Estándar

**Todas las páginas CRUD deben seguir este orden de arriba a abajo:**

```
1. HEADER (flex justify-between items-start)
   ├── Izquierda: Título (text-3xl font-bold) + Subtítulo (text-muted-foreground)
   └── Derecha: Botón [+ Nuevo] (primary, dark, shadow)

2. STATS CARDS (solo Productos y CRUDs importantes - máx 4 cards)
   └── Grid de cards con métricas clave

3. FILTROS (flex gap-4)
   ├── Buscador (flex-1, con icono Search)
   └── Filtros opcionales (select, badges, etc.)

4. TABLA DE DATOS / GRID DE CARDS
   └── Table con headers, rows, acciones | o Cards grid
```

**Reglas por Tipo de CRUD:**

| Tipo | Stats Cards | Ejemplos |
|------|-------------|----------|
| **Importante** | ✅ Sí (4 máx) | Productos, Ventas, Clientes |
| **Catalogo** | ❌ No | Categorías, Proveedores |
| **Config** | ❌ No | Usuarios, Settings |

### 2. Botón "+ Nuevo" - Ubicación y Estilo

**Definición CTA Primario:**
> **CTA Primario**: Botón de acción principal que ejecuta la acción más importante de la interfaz (crear, guardar, confirmar). Debe destacar visualmente con fondo oscuro (`bg-slate-900`), sombra y alto contraste.

**Características del CTA Primario:**
- Fondo: `bg-slate-900` (slate oscuro)
- Texto: Blanco (`text-white`)
- Hover: `hover:bg-slate-800`
- Borde: `border-slate-900`
- Sombra: `shadow-lg` con `hover:shadow-xl`
- Tipografía: `font-semibold`
- Transición: `transition-all`

**❌ PROHIBIDO: Botón en card separada debajo del header**
```typescript
<Card>
  <CardHeader><CardTitle>Nueva Categoría</CardTitle></CardHeader>
  <CardContent>
    <Button>Crear</Button>  // ← NO: Está en el lugar equivocado
  </CardContent>
</Card>
```

**✅ OBLIGATORIO: Botón en header alineado con título**
```typescript
<div className="flex justify-between items-start">
  <div>
    <h1 className="text-3xl font-bold">Categorías</h1>
    <p className="text-muted-foreground">Gestiona las categorías</p>
  </div>
  <Button 
    variant="default"
    className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
  >
    <Plus className="h-5 w-5 mr-2" />
    Nueva Categoría
  </Button>
</div>
```

**Estilo del Botón CTA Principal:**
```typescript
<Button 
  variant="default"
  className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
>
  <Plus className="h-5 w-5 mr-2" />
  Nuevo Producto
</Button>
```

### 3. Modales vs Forms Inline

**❌ PROHIBIDO: Form inline en la página**
```typescript
// NO: Form inline en page
{isCreating && (
  <Card>
    <CardContent>
      <Input ... />
      <Button>Crear</Button>
    </CardContent>
  </Card>
)}
```

**✅ OBLIGATORIO: Modal con form**
```typescript
// SÍ: Modal con form
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

<Button onClick={() => setIsCreateDialogOpen(true)}>Nuevo</Button>

<Modal
  isOpen={isCreateDialogOpen}
  onClose={() => setIsCreateDialogOpen(false)}
  title="Nueva Entidad"
  description="Completa los datos..."
  size="md"
  footer={
    <ModalFooter
      onCancel={() => setIsCreateDialogOpen(false)}
      onSave={handleCreate}
      saveText="Crear Entidad"
    />
  }
>
  <form className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Nombre *</Label>
      <Input id="name" ... />
    </div>
  </form>
</Modal>
```

### 4. Botón "Guardar Cambios" en Modales de Edición

**El botón de guardar dentro de los modales debe ser PRIMARY:**
```typescript
<Modal
  footer={
    <ModalFooter
      onCancel={() => setIsDialogOpen(false)}
      onSave={handleEditSubmit}
      saveText="Guardar Cambios"  // ← Primary button
    />
  }
>
```

### 5. Alerts y Confirms - UIProvider (NO Nativos)

**❌ PROHIBIDO: alert() y confirm() nativos**
```typescript
// NO: Nativos
alert('Mensaje');
if (confirm('¿Seguro?')) { ... }
```

**✅ OBLIGATORIO: useUI() hook**
```typescript
// SÍ: UIProvider
const { alert, confirm } = useUI();

// Alert
await alert({
  title: 'Éxito',
  description: 'Entidad creada correctamente',
  variant: 'success',
});

// Confirm
const confirmed = await confirm({
  title: 'Eliminar Entidad',
  description: `¿Estás seguro de eliminar "${entity.name}"?`,
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  variant: 'destructive',
});

if (confirmed) {
  // Proceder con eliminación
}
```

### 6. Select Dropdowns vs Input de Texto Libre

**❌ PROHIBIDO: Input de texto libre para relaciones**
```typescript
// NO: Input libre para proveedor
<Input 
  placeholder="Nombre del proveedor..."
  value={formData.supplier}
  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
/>
```

**✅ OBLIGATORIO: NativeSelect para dropdowns dentro de modales**
```typescript
// SÍ: NativeSelect - funciona perfecto en modales, sin problemas de z-index
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

<div className="space-y-2">
  <Label htmlFor="supplierId">Proveedor *</Label>
  <NativeSelect
    id="supplierId"
    value={formData.supplierId}
    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
    className="w-full"
  >
    <NativeSelectOption value="">Selecciona proveedor</NativeSelectOption>
    {suppliers.map((sup) => (
      <NativeSelectOption key={sup.id} value={sup.id}>
        {sup.name}
      </NativeSelectOption>
    ))}
  </NativeSelect>
</div>
```

**⚠️ NOTA**: El componente `Select` de Radix tiene problemas de z-index dentro de modales. 
**Siempre usar `NativeSelect` cuando el select esté dentro de un modal.**

### 7. Cards de Entidades - Diseño Estándar

**Estructura de Card para Catálogos (Categorías, Proveedores):**
```typescript
<Card key={entity.id} className={!entity.isActive ? 'opacity-60' : ''}>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      {/* Info principal */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h3 className="font-semibold">{entity.name}</h3>
          <p className="text-sm text-muted-foreground">
            {entity.productCount} productos
          </p>
        </div>
      </div>
      
      {/* Acciones */}
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEditDialog(entity)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600"
          onClick={() => handleDelete(entity)}
          disabled={entity.productCount > 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    {/* Info adicional (para proveedores) */}
    <div className="mt-4 space-y-2 text-sm">
      {entity.contactName && (
        <p className="text-muted-foreground">Contacto: {entity.contactName}</p>
      )}
      {entity.phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {entity.phone}
        </div>
      )}
    </div>
    
    {/* Badges de estado */}
    <div className="flex items-center gap-2 pt-2">
      {!entity.isActive && <Badge variant="destructive">Inactivo</Badge>}
      {entity.isDefault && <Badge variant="secondary">Default</Badge>}
    </div>
  </CardContent>
</Card>
```

### 8. Mensajes de Error

**Error técnico (logs, API): EN INGLÉS**
```typescript
console.error('Error creating entity:', error);
return NextResponse.json(
  { error: 'Error creating entity' },  // ← Inglés
  { status: 500 }
);
```

**Error de negocio (usuario final): PUEDE SER ESPAÑOL**
```typescript
await alert({
  title: 'Error',
  description: 'El nombre es obligatorio',  // ← Español (usuario final)
  variant: 'error',
});
```

### 9. Checklist UX/UI Pre-Implementación

Antes de implementar cualquier CRUD, verificar:

- [ ] ¿Es un CRUD Importante, Catálogo o Config? (define si lleva Stats Cards)
- [ ] ¿El botón "+ Nuevo" va en el header con estilo bg-slate-900?
- [ ] ¿Las acciones de crear/editar usan modales (no forms inline)?
- [ ] ¿El botón "Guardar Cambios" en modales es primary?
- [ ] ¿Se usa useUI() para alerts/confirms (no nativos)?
- [ ] ¿Las relaciones usan NativeSelect (no Radix Select) dentro de modales?
- [ ] ¿Los modales NO tienen overflow-y-auto?
- [ ] ¿Los mensajes técnicos están en inglés?
- [ ] ¿Los mensajes al usuario están en español?
- [ ] ¿Las cards tienen diseño consistente (icono, info, acciones)?
- [ ] ¿Items inactivos tienen opacity-60?
- [ ] ¿Las acciones de delete están deshabilitadas si hay dependencias?

---

## ✅ Checklist por Archivo

### 1. Prisma Schema (`prisma/schema.prisma`)

```prisma
model Entity {
  id          String    @id @default(uuid())
  name        String    @unique
  // ... otros campos
  
  // Relations con onDelete
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([name])
  @@index([isActive])
  @@map("entity")
}
```

- [ ] Modelo creado con campos apropiados
- [ ] Relaciones con `onDelete` definido (Cascade o SetNull)
- [ ] Índices en campos de búsqueda
- [ ] `@map` para nombre de tabla
- [ ] Ejecutar `npx prisma generate` después de cambios
- [ ] Ejecutar `npx prisma migrate dev` si es necesario

### 2. Service Layer (`lib/services/entityService.ts`)

```typescript
/**
 * Entity Service - CRUD operations for entities
 * 
 * Specs:
 * - /specs/entity.md
 */

import { prisma } from '@/lib/prisma';
import { nanoid } from '@/lib/utils';

// Types
export interface Entity {
  id: string;
  name: string;
  // ... otros campos
  productCount?: number;  // Si tiene relación con products
}

export interface CreateEntityInput {
  name: string;
  // ... otros campos opcionales
}

export interface UpdateEntityInput extends Partial<CreateEntityInput> {}

export interface EntityListResult {
  entities: Entity[];
  total: number;
}

// GET all with count
export async function getEntities(includeInactive: boolean = false): Promise<EntityListResult> {
  const entities = await prisma.entity.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true },  // Si aplica
      },
    },
  });

  return {
    entities: entities.map(e => ({
      ...e,
      productCount: e._count?.products || 0,
    })),
    total: entities.length,
  };
}

// GET by ID
export async function getEntityById(id: string): Promise<Entity | null> {
  // ... implementación
}

// GET by Name (para validaciones de duplicados)
export async function getEntityByName(name: string): Promise<Entity | null> {
  // ... implementación
}

// CREATE
export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  // ... implementación con nanoid()
}

// UPDATE
export async function updateEntity(id: string, input: UpdateEntityInput): Promise<Entity> {
  // ... implementación
}

// DELETE (soft delete)
export async function deactivateEntity(id: string): Promise<Entity> {
  // ... implementación
}
```

- [ ] Todos los tipos exportados
- [ ] Funciones puras con params tipados
- [ ] Include `_count` si tiene relaciones
- [ ] Validaciones de unicidad en create/update
- [ ] Exportado en `lib/services/index.ts`

### 3. API Routes (`app/api/entities/route.ts`)

```typescript
/**
 * API Route: /api/entities
 * Methods: GET, POST
 * Spec: /specs/entity.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEntities, createEntity, getEntityByName } from '@/lib/services/entityService';

// GET /api/entities - List entities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const result = await getEntities(includeInactive);

    return NextResponse.json({ entities: result.entities });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Error al obtener entidades' },  // Mensaje puede ser español (usuario final)
      { status: 500 }
    );
  }
}

// POST /api/entities - Create entity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validations
    if (!body.name) {
      return NextResponse.json(
        { error: 'Entity name is required' },  // Inglés
        { status: 400 }
      );
    }

    // Check unique name
    const existing = await getEntityByName(body.name);

    if (existing) {
      return NextResponse.json(
        { error: 'An entity with that name already exists' },  // Inglés
        { status: 409 }
      );
    }

    const entity = await createEntity({
      name: body.name,
      // ... otros campos
    });

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Error creating entity' },  // Inglés
      { status: 500 }
    );
  }
}
```

- [ ] JSDoc con "Methods" (no "Métodos")
- [ ] Importa desde service (NO prisma directamente)
- [ ] Comentarios inline en INGLÉS
- [ ] Mensajes de error técnicos en INGLÉS
- [ ] Mensajes de error de negocio pueden ser español
- [ ] Manejo de errores con status codes apropiados

### 4. API Routes [id] (`app/api/entities/[id]/route.ts`)

```typescript
/**
 * API Route: /api/entities/[id]
 * Methods: PUT, DELETE
 * Spec: /specs/entity.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';  // Solo para validaciones específicas

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/entities/[id] - Update entity
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify entity exists
    const existing = await prisma.entity.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Validate unique name if changed
    if (body.name && body.name !== existing.name) {
      const nameExists = await prisma.entity.findUnique({
        where: { name: body.name },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: 'An entity with that name already exists' },
          { status: 409 }
        );
      }
    }

    const entity = await prisma.entity.update({
      where: { id },
      data: {
        name: body.name,
        // ... otros campos
      },
    });

    return NextResponse.json({ entity });
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Error updating entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/entities/[id] - Deactivate entity (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Verify entity exists
    const existing = await prisma.entity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },  // Si aplica
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Check no associated records (if applicable)
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete entity with associated products' },
        { status: 409 }
      );
    }

    // Soft delete: set isActive to false
    const entity = await prisma.entity.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: 'Entity deactivated successfully',
      entity,
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Error deactivating entity' },
      { status: 500 }
    );
  }
}
```

- [ ] Usa `interface Params { params: Promise<{ id: string }> }` para Next.js 15+
- [ ] Siempre verifica existencia antes de update/delete
- [ ] Valida dependencias antes de eliminar (soft delete)
- [ ] Comentarios en INGLÉS

### 5. Admin Page (`app/adm/entities/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useUI } from '@/components/ui/UIProvider';  // Para alerts/confirms

interface Entity {
  id: string;
  name: string;
  // ... otros campos
  productCount?: number;
  isActive: boolean;
}

export default function EntitiesPage() {
  const { alert, confirm } = useUI();  // NO usar alert()/confirm() nativos
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [newEntityName, setNewEntityName] = useState('');

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities?includeInactive=true');
      const data = await response.json();
      if (data.entities) {
        setEntities(data.entities);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEntityName.trim()) {
      await alert({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'error',
      });
      return;
    }

    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName }),
      });

      if (response.ok) {
        setNewEntityName('');
        setIsCreateDialogOpen(false);
        await alert({
          title: 'Éxito',
          description: 'Entidad creada correctamente',
          variant: 'success',
        });
        fetchEntities();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al crear',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await alert({
        title: 'Error',
        description: 'Error al crear entidad',
        variant: 'error',
      });
    }
  };

  const handleDelete = async (entity: Entity) => {
    // Usar confirm del UIProvider, NO confirm() nativo
    const confirmed = await confirm({
      title: 'Eliminar Entidad',
      description: `¿Estás seguro de eliminar "${entity.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await alert({
          title: 'Éxito',
          description: 'Entidad eliminada correctamente',
          variant: 'success',
        });
        fetchEntities();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se puede eliminar',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await alert({
        title: 'Error',
        description: 'Error al eliminar',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER con CTA */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entidades</h1>
          <p className="text-muted-foreground">Gestiona las entidades del sistema</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Entidad
        </Button>
      </div>

      {/* 2. STATS CARDS (solo para CRUDs importantes) */}
      {/* Omitir para CRUDs tipo Catalogo/Config */}

      {/* 3. TABLA DE DATOS (o Grid de cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <Card key={entity.id} className={!entity.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{entity.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {entity.productCount} productos
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingEntity(entity);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(entity)}
                    disabled={entity.productCount > 0}  // Si aplica
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. MODALES */}
      {/* Create Modal */}
      <Modal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Nueva Entidad"
        description="Completa los datos para crear una nueva entidad."
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsCreateDialogOpen(false)}
            onSave={handleCreate}
            saveText="Crear Entidad"
          />
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name">Nombre *</label>
            <Input
              id="name"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Nombre de la entidad"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Editar Entidad"
        description="Modifica los datos de la entidad."
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsEditDialogOpen(false)}
            onSave={() => { /* handle edit */ }}
            saveText="Guardar Cambios"
          />
        }
      >
        {/* Form de edición */}
      </Modal>
    </div>
  );
}
```

- [ ] Usa `useUI()` para alerts/confirms (NO nativos)
- [ ] Botón "+ Nuevo" en header con estilo primary
- [ ] Layout consistente con otros CRUDs
- [ ] Modales para create/edit (no forms inline)
- [ ] Manejo de estados loading
- [ ] Mensajes de error en español (usuario final)

### 6. Sidebar (`components/adm/layout/AdminSidebar.tsx`)

- [ ] Agregar ítem de navegación con icono apropiado
- [ ] Ubicar en orden lógico (Dashboard, Productos, Categorías, **Entidades**, ...)

### 7. Specs Document (`specs/entity.md`)

```markdown
# 🏷️ Módulo de Entidades

## 📍 Ubicación

- **Página Admin**: `/app/adm/entities/page.tsx`
- **Schema Prisma**: `prisma/schema.prisma` → `model Entity`
- **Seed**: `prisma/seed.ts`
- **Service**: `lib/services/entityService.ts`
- **API**: `app/api/entities/route.ts`

---

## Propósito

Descripción del módulo...

---

## Modelo de Datos

### Entity (Prisma)

```prisma
model Entity {
  // ... definición
}
```

---

## Reglas de Negocio

### Creación
- ✅ Nombre único (unique constraint)
- ✅ ...

### Eliminación
- ❌ No se puede eliminar si tiene productos asociados
- ✅ Soft delete (cambia `isActive` a false)

### Edición
- ✅ ...

---

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/entities` | Listar entidades activas |
| GET | `/api/entities?includeInactive=true` | Listar todas |
| POST | `/api/entities` | Crear entidad |
| PUT | `/api/entities/:id` | Actualizar entidad |
| DELETE | `/api/entities/:id` | Desactivar entidad |

---

## Vinculación con Otras Specs

- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- ...

---

**Estado**: 🟡 En progreso / ✅ Implementado  
**Última actualización**: 2026-03-28
```

- [ ] Documentar modelo de datos
- [ ] Documentar reglas de negocio
- [ ] Documentar API endpoints
- [ ] Incluir estado de implementación
- [ ] Vincular con otras specs

---

## 🚨 Reglas Críticas a Recordar

### 1. Idioma en Código
```typescript
// ❌ PROHIBIDO: Comentarios en español
// POST /api/entities - Crear entidad

// ✅ OBLIGATORIO: Comentarios en inglés
// POST /api/entities - Create entity
```

### 2. Arquitectura de Servicios
```typescript
// ❌ PROHIBIDO: Prisma en API routes
const result = await prisma.entity.create({...});

// ✅ OBLIGATORIO: Usar service layer
const result = await createEntity(input);
```

### 3. Alerts/Confirms
```typescript
// ❌ PROHIBIDO: Nativos
alert('Mensaje');
if (confirm('¿Seguro?')) {...}

// ✅ OBLIGATORIO: UIProvider
const { alert, confirm } = useUI();
await alert({ title: '...', variant: 'success' });
```

### 4. Ubicación del Botón "+ Nuevo"
```typescript
// ❌ PROHIBIDO: Botón en card separada
<Card><CardContent><Button>Crear</Button></CardContent></Card>

// ✅ OBLIGATORIO: Botón en header alineado con título
<div className="flex justify-between items-start">
  <div><h1>Título</h1></div>
  <Button className="bg-slate-900">+ Nuevo</Button>
</div>
```

### 5. Modales vs Forms Inline
```typescript
// ❌ PROHIBIDO: Form inline en page
{isCreating && <form>...</form>}

// ✅ OBLIGATORIO: Modal con form
<Modal isOpen={isDialogOpen} ... >
  <form>...</form>
</Modal>
```

---

## 📁 Archivos a Crear/Modificar

### Nuevos (por cada CRUD):
1. `prisma/schema.prisma` - Agregar modelo
2. `lib/services/entityService.ts` - Lógica de negocio
3. `lib/services/index.ts` - Exportar servicio
4. `app/api/entities/route.ts` - API GET/POST
5. `app/api/entities/[id]/route.ts` - API PUT/DELETE
6. `app/adm/entities/page.tsx` - Página admin
7. `specs/entity.md` - Documentación
8. `prisma/seed.ts` - Agregar seed data

### Modificados:
1. `components/adm/layout/AdminSidebar.tsx` - Agregar menú
2. `prisma/schema.prisma` - Agregar relaciones si aplica

---

## ✅ Validación Final (Pre-Commit)

Antes de hacer commit, verificar:

- [ ] No hay comentarios en español en código
- [ ] Services están en `lib/services/` y exportados
- [ ] API routes usan services (no prisma directo)
- [ ] Botón "+ Nuevo" está en header con estilo correcto
- [ ] Se usa `useUI()` para alerts/confirms
- [ ] Modales en lugar de forms inline
- [ ] Prisma generate ejecutado
- [ ] Spec document creado/actualizado
- [ ] Mensajes de error técnicos en inglés
- [ ] Mensajes de usuario en español (si aplica)

---

**⚠️ ADVERTENCIA**: No seguir estas reglas resultará en:
- Rechazo de PRs
- Inconsistencia visual entre CRUDs
- Código no reutilizable
- Deuda técnica

---

**Documento creado**: 2026-03-28  
**Basado en errores de**: Implementación Supplier CRUD  
**Última actualización**: 2026-03-28
