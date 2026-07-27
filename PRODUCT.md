# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

RPM es un sistema interno para **una sola tienda** (RPM Accesorios, San Miguel de Tucumán). El panel `/adm` lo usan tres perfiles distintos con jobs muy diferenciados — no hay un usuario dominante:

- **ADMIN** (dueño/encargado): factura, atiende caja, gestiona OTs, clientes, proveedores, precios y reportes. Visión total del negocio en una sola pantalla.
- **STAFF** (vendedor de mostrador): ventas rápidas, cobranza, consulta de stock y cuenta corriente de clientes. Necesita densidad de información y atajos para operar en segundos.
- **USER** (tallerista/técnico): consume OTs asignadas, checklists de ingreso/salida y novedades de taller. Flujo operativo, no administrativo.

El **sitio público** (`/`) está dirigido al cliente final: entusiastas de vehículos que buscan equipamiento y agendan turnos por WhatsApp.

## Product Purpose

Administrar de punta a punta una tienda que **vende accesorios para vehículos y opera un taller** en el mismo local: catálogo + stock + ventas + facturación fiscal AFIP + caja + órdenes de trabajo + clientes + vehículos + proveedores + reportes, en un único sistema coherente en lugar de planillas y herramientas sueltas.

El éxito significa que una persona en el mostrador pueda atender una venta, generar comprobante fiscal con CAE, registrar el pago y actualizar stock sin cambiar de pantalla ni abrir otro sistema — y que el dueño vea el estado del negocio (caja, deudores, OTs en curso, stock crítico) sin armar reportes a mano.

## Positioning

El diferencial que un ERP genérico (TANGO/Bejerman) o un gestor de taller no replican es **NITRO**, el copiloto conversacional con tools del negocio: consulta stock, clientes, OTs, saldos y operaciones del panel desde lenguaje natural, con acceso a los mismos servicios que usan las API routes. Convierte el panel administrativo en una interfaz copiloto donde el usuario pregunta y actúa en lugar de navegar menús.

Lo que un vecino no podría copiar con veracidad: la integración entre el catálogo de accesorios (AFIP, precios, stock) y el taller (OTs, checklists, técnicos) en un solo flujo, más un agente IA que opera sobre ambos mundos con las mismas tools que el panel.

## Operating Context

- **Local físico:** San Lorenzo 1462, San Miguel de Tucumán. Horario Lun–Vie 09:00–19:00, Sáb 09:00–13:00.
- **Canal de venta dominante:** WhatsApp (`+54 381 319-9647`, `@rpm.accesorios` en Instagram). El sitio público deriva a WhatsApp para agendar turnos y consultas.
- **Régimen fiscal argentino:** facturación electrónica AFIP con CAE vía wsfe; tipos de comprobante, pre-factura → oficialización → PDF fiscal.
- **Moneda:** ARS. Formateo estricto con `formatARS`.
- **Stack operativo:** Next.js 16+ App Router, TypeScript estricto, Drizzle ORM + PostgreSQL (Neon en producción), Better Auth + Google OAuth, Vercel para deploy.
- **Roles:** `USER` · `STAFF` · `ADMIN` (RBAC en middleware y servicios).
- **Auth dev bypass:** `RPM_DEV_BYPASS_AUTH=true` genera sesión mock solo en `NODE_ENV=development`; en producción no existe en el código ejecutable.

## Capabilities and Constraints

**Módulos confirmados** (uno por carpeta bajo `app/adm/`):
- `customers` — ABM clientes + vehículos + cuenta corriente + saldos a favor
- `vehicles` — vehículos vinculados a clientes, historial de OTs
- `work-orders` — Órdenes de Trabajo con checklists de ingreso/salida, técnicos asignados
- `products` — catálogo con categorías, SKU, imágenes, importador masivo
- `inventory-counts` — recuentos cíclicos de stock
- `direct-sales` — ventas directas (mostrador)
- `invoices` — facturación
- `credit-notes` — notas de crédito
- `cash` — movimientos y cierre de caja
- `price-lists` — listas de precios con excepciones por producto
- `purchase-vouchers` — comprobantes de compra
- `suppliers` — proveedores
- `payment-methods` — métodos de pago
- `categories` — categorías de producto con color propio
- `services` — servicios del taller
- `operations` — operaciones diarias / log operativo
- `novedades` — novedades de taller (comunicación interna)
- `reports` — reportes (deudores, etc.)
- `maintenance` — mantenimiento del sistema
- `settings` — configuración
- `users` — ABM usuarios y roles

**Constraints técnicos:**
- Drizzle ORM 0.45.2 + Drizzle Kit 0.31.10. **Prohibido reset de BD.** Timestamps en `mode: 'string'` (Drizzle devuelve strings, no Date).
- Sharp con importación dinámica `await import('sharp')` + fallback (módulo nativo no bundlable).
- Cache con `revalidate: 60` + `revalidatePath('/adm')` tras mutaciones relevantes; nunca remover el cache de páginas con queries complejas.
- Lógica de negocio en `lib/services/` como funciones puras; API routes solo orquestan. Agent tools en `lib/agents/tools/` reutilizan los mismos servicios.

**Indecisos / no confirmados:** ninguno material por ahora.

## Brand Commitments

- **Nombre:** RPM Accesorios
- **Tagline:** "Precision & Performance"
- **Contacto público:** San Lorenzo 1462, San Miguel de Tucumán · `+54 381 319-9647` · `contacto@rpmaccesorios.com.ar` · `@rpm.accesorios`
- **Antigüedad:** más de 15 años en actividad (claim usado en el sitio público).
- **Voz:** directa, técnica, orientada al entusiasta de vehículos; sin hipérbole marketinguera.
- **Asset:** `public/logo.jpg` (logo existente). Imágenes reales del local/equipo en `nosotros.png`, `nosotros_milestones.png`, `productos.png` (raíz del repo, pendientes de mover a `public/`).

## Evidence on Hand

- **Specs vivas** en `specs/features/` (ventas, AFIP, productos, taller, clientes, usuarios, proveedores, bot NITRO) — fuente de casos de uso y restricciones.
- **DESIGN.md** extenso con 18 secciones de patrones UI admin (action hierarchy, color semantics, entity rows, form UX, skeletons, etc.) — autoridad visual incumbente.
- **AGENTS.md** con reglas de arquitectura, Drizzle, auth bypass, cache, componentes, UI/UX.
- **Capturas Playwright** en `.playwright-mcp/` (estado real de vistas admin).
- **Imágenes del negocio** (`nosotros.png`, `productos.png`, `nosotros_milestones.png`) — evidencia real, no fabricar claims visuales que no estén respaldados por estos assets.

**Ausencias que futuros trabajos no deben fabricar:** testimonios de clientes, cifras de ventas, benchmarks, casos de estudio, premios. Si se necesitan para una superficie Persuade, pedirlos al dueño.

## Product Principles

1. **Una persona, una pantalla.** El mostrador no tiene tiempo de cambiar de sistema: venta + factura + caja + stock en un mismo flujo.
2. **El copiloto antes que el menú.** NITRO es el diferencial; cualquier nueva capacidad del panel debería ser alcanzable también desde el agente IA con tools, no solo desde UI.
3. **Accesorios y taller son un solo negocio.** No separarlos en subsistemas estancos: un cliente compra un accesorio y agenda instalación; una OT puede incluir productos vendidos.
4. **Densidad sobre decoración.** El panel es Operate, no Persuade: scanability, consistencia y velocidad operativa pesan más que la expresión visual.
5. **Lo fiscal no es opcional.** AFIP/CAE es parte del producto, no un módulo aparte: el flujo de venta debe terminar en comprobante oficial sin fricción.

## Accessibility & Inclusion

- Colores semánticos con peso 700+ para contraste WCAG AA (`text-emerald-700`, `text-red-700` en admin; `emerald-600`/`red-600` para financieros).
- `aria-label` obligatorio en acciones de fila con icono único; iconos decorativos con `aria-hidden="true"` y `pointer-events-none`.
- Tooltips en toda acción icónica de tabla. Select de shadcn/ui en lugar de `<select>` nativo.
- Sin requisito de standard formal adicional confirmado por ahora.
