# 📚 Índice del Sistema de Especificaciones (RPM)

Bienvenido a las especificaciones de RPM. Esta documentación ha sido refactorizada para enfocarse en **casos de uso y prevención de regresiones**. Las especificaciones se dividen en dos categorías principales: **Arquitectura Técnica** y **Módulos de Negocio (Features)**.

## 1. Arquitectura Técnica Global (`/specs/architecture/`)
Define las bases técnicas y de infraestructura sobre las que está construida la aplicación.
- [Arquitectura Backend y Datos](architecture/backend-data-architecture.md) - Servicios, Prisma, Caché y Transacciones.
- [Arquitectura Frontend](architecture/frontend-architecture.md) - Next.js, UI, Manejo de Estado y Layouts.
- [Operaciones, Deploy y Escalamiento](architecture/ops-architecture.md) - Vercel, Base de datos, CDN de imágenes.

## 2. Módulos de Negocio / Features (`/specs/features/`)
Define exactamente qué hace cada parte de la aplicación, qué no hace, y cuáles son sus casos límite de fallo.
- [Ventas, Facturación y Caja](features/sales-and-billing.md) - Ventas, AFIP, Notas de crédito, Cierre de Caja, Listas de Precio.
- [Productos e Inventario](features/products-and-inventory.md) - Catálogo, Importador, Actualización masiva de costos.
- [Gestión de Taller (OT)](features/workshop-management.md) - Órdenes de trabajo, checklists, técnicos.
- [Clientes y Cuenta Corriente](features/customers.md) - ABM clientes, vehículos, saldos a favor.
- [Usuarios, Roles y Autenticación](features/users-and-auth.md) - Better Auth, ABM usuarios.
- [Proveedores](features/suppliers.md) - Compras y proveedores.
- [Bot GER (IA)](features/ai-bot-ger.md) - Vercel AI SDK, Tools, asistencia técnica inteligente.

## 3. Propuestas No Implementadas (`/specs/proposals/`)
Aquí residen ideas, propuestas o features diseñadas pero que aún no se han llevado a código, mantenidas para referencia futura.

---
**Nota para Agentes IA**: Antes de modificar código, consulta el módulo de negocio en `/features/` correspondiente para entender los casos de uso esperados y las restricciones técnicas, evitando así introducir regresiones. Si vas a crear una nueva feature, usa la skill `create-specification` que ya tiene cargada la plantilla estricta y obligatoria.
