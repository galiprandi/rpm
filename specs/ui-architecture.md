# � Índice de Arquitectura UI

## 🎯 Antes de Crear o Modificar UI

**SIEMPRE consultar la especificación correspondiente:**

| Área | Archivo | Descripción |
|------|---------|-------------|
| **Admin** | `@[specs/ui-architecture-adm.md]` | Interfaz de administración (`/adm/*`) |
| **Público** | `@[specs/ui-architecture-public.md]` | Sitio web público (`/`, catálogo, landing) |

---

## 📁 Estructura de Specs UI

```
specs/
├── ui-architecture.md           ← ESTE ARCHIVO (índice)
├── ui-architecture-adm.md      → Diseño de interfaz admin
└── ui-architecture-public.md    → Diseño de sitio público
```

---

## 🖥️ Admin (`/app/adm/**`)

**Consultar:** `@[specs/ui-architecture-adm.md]`

### Características
- **Usuarios**: Staff interno (ADMIN, SELLER, TECHNICIAN)
- **Foco**: Funcionalidad, datos densos, formularios completos
- **Layout**: Sidebar + Main Content
- **Colores**: Esquema claro profesional, bordes `ring-slate-300` (gris 50%)
- **Componentes**: Tablas densas, modales, formularios completos

### Rutas Admin
```
/adm/products       → CRUD productos
/adm/categories     → CRUD categorías
/adm/inventory      → Stock y alertas
/adm/sales/quick    → Venta rápida
/adm/invoices       → Facturas
/adm/reports        → Reportes
```

---

## 🌐 Público (`/app/(public)/**`)

**Consultar:** `@[specs/ui-architecture-public.md]`

### Características
- **Usuarios**: Clientes potenciales, visitantes
- **Foco**: Marketing, conversión, catálogo visual
- **Layout**: Single column, hero sections
- **Colores**: Esquema vibrante, CTAs contrastantes
- **Componentes**: Cards visuales, grids de productos, landing sections

### Rutas Públicas
```
/                   → Home / Landing
/productos          → Catálogo
/servicios          → Servicios de instalación
/taller            → Info taller (Fase 2)
/nosotros          → Quiénes somos
/contacto          → Formulario contacto
```

---

## 📱 Mobile App (`/app/m/**`)

**Nota:** El módulo mobile está documentado en las specs correspondientes según el tipo:

- **Mobile Admin**: Ver `@[specs/ui-architecture-adm.md]` (sección Mobile)
- **Mobile Público**: Ver `@[specs/ui-architecture-public.md]` (sección Mobile)

---

## ⚡ Flujo de Trabajo Obligatorio

### Antes de Empezar

1. **Identificar el área**: ¿Es admin (`/adm`) o público (`/`)?
2. **Consultar la spec**: Leer el archivo correspondiente
3. **Verificar reglas existentes**: No reinventar, seguir estándares

### Durante el Desarrollo

4. **Seguir las reglas**: Layout, colores, componentes según spec
5. **Mantener consistencia**: No mezclar patrones de admin en público o viceversa

### Al Finalizar

6. **Documentar cambios**: Si hay nuevas decisiones, agregar a la spec
7. **Commit con referencia**: Mencionar qué spec se actualizó

---

## 🎨 Diferencias Clave

| Aspecto | Admin | Público |
|---------|-------|---------|
| **Foco** | Funcionalidad | Conversión |
| **Colores** | Neutros profesionales | Vibrantes de marca |
| **Bordes** | `ring-slate-300` | Según diseño de marca |
| **Formularios** | Completos, validación compleja | Mínimos, simples |
| **Tablas** | Sí, densas | No (cards visuales) |
| **Sidebar** | Sí | No |
| **CTAs** | Acción secundaria | Conversión primaria |

---

## 🔗 Vinculación con Otras Specs

- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/ui-architecture-public.md]` - Diseño de sitio público
- `@[specs/inventory-sales.md]` - Reglas de negocio stock/ventas
- `@[specs/workshop.md]` - Reglas de negocio taller
- `@[AGENTS.md]` - Reglas de arquitectura de componentes

---

## ✅ Checklist Pre-Implementación

- [ ] Identifiqué el área (admin vs público)
- [ ] Leí la spec correspondiente
- [ ] Verifiqué reglas de componentes existentes
- [ ] Confirmé colores y estilos según área
- [ ] Revisé límites de complejidad

---

**Estado**: ✅ Definido  
**Última actualización**: 2026-03-28
