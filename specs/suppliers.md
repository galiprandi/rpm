# 🚚 Módulo de Proveedores

## 📍 Ubicación

- **Página Admin**: `/app/adm/suppliers/page.tsx`
- **Schema Prisma**: `prisma/schema.prisma` → `model Supplier`
- **Seed**: `prisma/seed.ts`

---

## Propósito

Gestión de proveedores de productos del sistema. Cada producto puede estar asociado a un proveedor, permitiendo trazabilidad y contacto.

---

## Modelo de Datos

### Supplier (Prisma)

```prisma
model Supplier {
  id          String    @id @default(uuid())
  name        String    @unique
  contactName String?   // Nombre de contacto
  phone       String?   // Teléfono
  email       String?   // Email
  address     String?   // Dirección
  notes       String?   // Notas adicionales
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  products Product[]

  @@index([name])
  @@index([isActive])
  @@map("supplier")
}
```

### Relación con Product

```prisma
model Product {
  // ... otros campos ...
  
  supplierId String?
  supplier   Supplier? @relation(fields: [supplierId], references: [id])
  
  @@index([supplierId])
}
```

---

## UI - Página de Proveedores (`/adm/suppliers`)

### Layout

- **Grid de cards**: Visualización tipo tarjetas de contacto
- **Cada card muestra**: Icono, nombre, cantidad de productos, contacto
- **Acciones**: Editar, Eliminar (deshabilitado si tiene productos)

### Componentes

#### Card de Proveedor

```typescript
<Card>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Truck className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h3 className="font-semibold">{supplier.name}</h3>
          <p className="text-sm text-muted-foreground">
            {supplier.productCount} productos
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEditDialog(supplier)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600"
          onClick={() => handleDeleteSupplier(supplier.id)}
          disabled={supplier.productCount > 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="mt-4 space-y-2 text-sm">
      {supplier.contactName && (
        <p className="text-muted-foreground">Contacto: {supplier.contactName}</p>
      )}
      {supplier.phone && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {supplier.phone}
        </div>
      )}
      {supplier.email && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          {supplier.email}
        </div>
      )}
      {supplier.address && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {supplier.address}
        </div>
      )}
      <div className="flex items-center gap-2 pt-2">
        {!supplier.isActive && <Badge variant="destructive">Inactivo</Badge>}
        {supplier.name === 'Sin especificar' && <Badge variant="secondary">Default</Badge>}
      </div>
    </div>
  </CardContent>
</Card>
```

#### Modal de Edición

```typescript
<Modal
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  title="Editar Proveedor"
  description="Modifica los datos del proveedor."
  size="md"
  footer={
    <ModalFooter
      onCancel={() => setIsDialogOpen(false)}
      onSave={handleEditSubmit}
      saveText="Guardar Cambios"
    />
  }
>
  <form className="space-y-4">
    <Input id="name" label="Nombre *" required />
    <Input id="contactName" label="Nombre de Contacto" />
    <div className="grid grid-cols-2 gap-4">
      <Input id="phone" label="Teléfono" placeholder="+54 11 1234-5678" />
      <Input id="email" type="email" label="Email" placeholder="proveedor@email.com" />
    </div>
    <Input id="address" label="Dirección" />
    <Textarea id="notes" label="Notas" rows={2} />
  </form>
</Modal>
```

---

## UI - Formulario de Producto

### Select de Proveedor

```typescript
<div className="space-y-2">
  <Label htmlFor="supplierId">Proveedor *</Label>
  <Select
    value={formData.supplierId}
    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
  >
    <SelectTrigger id="supplierId">
      <SelectValue placeholder="Selecciona proveedor" />
    </SelectTrigger>
    <SelectContent position="popper" className="z-50 max-h-60">
      {suppliers.map((sup) => (
        <SelectItem key={sup.id} value={sup.id}>
          {sup.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

## Datos de Seed

### Proveedor Default

```typescript
{
  id: 'sup-default',
  name: 'Sin especificar',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  notes: 'Proveedor por defecto para productos sin proveedor específico'
}
```

### Proveedores de Ejemplo

- **OSRAM Argentina** - Iluminación LED
- **3M Argentina** - Polarizados, películas
- **XPEL Argentina** - PPF (Paint Protection Film)
- **Avery Dennison** - Vinilos
- **Gtechniq Argentina** - Cerámicos
- **CarPro Argentina** - Productos detailing
- **Chemical Guys** - Limpieza
- **Safari Snorkels** - Off-road
- **Warn Winches** - Winches
- **ARB Argentina** - Accesorios 4x4

---

## Reglas de Negocio

### Creación

- ✅ Nombre es único (unique constraint)
- ✅ Contacto opcional (todos los campos de contacto son opcionales)
- ✅ Se crea automáticamente "Sin especificar" en el seed

### Eliminación

- ❌ **No se puede eliminar** si tiene productos asociados (`productCount > 0`)
- ✅ Solo se permite eliminar proveedores sin productos
- ✅ Al eliminar, se hace soft delete (cambia `isActive` a false)

### Edición

- ✅ Todos los campos son editables excepto el ID
- ✅ El proveedor "Sin especificar" no debe eliminarse

### Relación con Productos

- Un proveedor tiene muchos productos (`products Product[]`)
- Un producto tiene cero o un proveedor (`supplier Supplier?`)
- Al eliminar un proveedor, los productos quedan sin proveedor asignado (opcional)

---

## API Endpoints (Esperados)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/suppliers` | Listar proveedores activos |
| GET | `/api/suppliers?includeInactive=true` | Listar todos (incluye inactivos) |
| POST | `/api/suppliers` | Crear proveedor |
| PUT | `/api/suppliers/:id` | Actualizar proveedor |
| DELETE | `/api/suppliers/:id` | Desactivar proveedor (soft delete) |

---

## Vinculación con Otras Specs

- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/inventory-sales.md]` - Reglas de negocio stock/ventas
- `@[specs/ui-architecture.md]` - Índice de arquitectura UI

---

**Estado**: ✅ Implementado  
**Última actualización**: 2026-03-28
