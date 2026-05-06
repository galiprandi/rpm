# Arquitectura Backend y Base de Datos

## 1. Patrón Arquitectónico Backend
El backend de RPM sigue una arquitectura basada en **Servicios como funciones puras** (Service Pattern) implementados en Next.js App Router.
- **Rutas API (`app/api/*`)**: Exponen los endpoints RESTful. No contienen lógica de negocio compleja. Solo extraen parámetros, validan auth y llaman al servicio.
- **Servicios (`lib/services/*`)**: Funciones puras reutilizables, tipadas e independientes de HTTP. Son consumidas tanto por las Rutas API como por las Tools del Agente de IA.
- **Tools (`lib/agent-tools/*`)**: Wrappers de los servicios adaptados para el Vercel AI SDK (Ger Bot).

## 2. Base de Datos y ORM
- **Motor**: PostgreSQL.
- **ORM**: Prisma (v6.19.3).
- **Esquema Único**: El modelo de datos completo vive en `prisma/schema.prisma`.
- **Migraciones Automáticas**: `npx prisma migrate deploy` se ejecuta en cada build de Vercel. NO se admiten cambios manuales en producción.

## 3. Modelo de Datos Principal (Resumen)
- `User` / `Role`: Autenticación y jerarquía.
- `Product` / `Category` / `Brand`: Catálogo.
- `Sale` / `SaleItem`: Transacciones y facturación.
- `StockMovement`: Trazabilidad inmutable de entradas y salidas de inventario.
- `WorkOrder` / `Checklist`: Gestión de taller y servicios.
- `CashRegister` / `CashMovement`: Control de caja diaria.

## 4. Caché e Invalidación
- **Next.js Cache**: Se utiliza caché en peticiones de lectura pesadas (ej. listado de productos, dashboard).
- **Estrategia Obligatoria**: Usar `revalidate: 60` e invalidación selectiva (`revalidatePath`) al realizar mutaciones. NUNCA desactivar el caché globalmente en rutas pesadas.

## 5. Manejo de Errores y Transacciones
- Las mutaciones que afectan múltiples tablas (ej. Venta -> Descuenta Stock -> Genera Movimiento de Caja) DEBEN utilizar transacciones de Prisma (`prisma.$transaction`) para garantizar atomicidad y prevenir estados inconsistentes en caso de fallos.
