# Arquitectura Backend y Base de Datos

## 1. Patrón Arquitectónico Backend (Estado Actual y Meta)
El backend de RPM tiene como meta una arquitectura basada en **Servicios como funciones puras** (Service Pattern) en `lib/services/*`. 
- **Rutas API (`app/api/*`)**: Exponen los endpoints RESTful. **Meta**: No deben contener lógica de negocio, solo orquestar parámetros y llamar a servicios. **Estado Actual**: Algunos módulos (Work Orders, Customers) aún tienen lógica embebida en las rutas que requiere refactorización.
- **Servicios (`lib/services/*`)**: Funciones puras reutilizables, tipadas e independientes de HTTP.
- **Tools (`lib/agent-tools/*`)**: Wrappers de los servicios adaptados para el Vercel AI SDK (Nitro Bot).

## 2. Base de Datos y ORM
- **Motor**: PostgreSQL.
- **ORM**: Prisma (v6.19.3).
- **Esquema Único**: El modelo de datos completo vive en `prisma/schema.prisma`. Los nombres de las tablas en la BD son en minúscula con guiones bajos (ej: `work_order`, `direct_sale`).
- **Migraciones Automáticas**: `npx prisma migrate deploy` se ejecuta en cada build de Vercel.

## 3. Modelo de Datos Principal (Resumen)
- `user` / `user_role`: Autenticación y jerarquía.
- `product` / `category` / `brand` / `supplier`: Catálogo.
- `direct_sale` / `direct_sale_item`: Ventas directas (mostrador).
- `stock_movement`: Trazabilidad inmutable de entradas y salidas de inventario.
- `work_order` / `work_order_item`: Gestión de taller y servicios.
- `cash_movement`: Control de caja diaria.
- `invoice` / `credit_note`: Documentos fiscales.

## 4. Caché e Invalidación
- **Next.js Cache**: Se utiliza caché en peticiones de lectura pesadas.
- **Estrategia Obligatoria**: Usar `revalidate: 60` e invalidación selectiva (`revalidatePath`) al realizar mutaciones críticas (Ventas, OT, Stock).

## 5. Manejo de Errores y Transacciones
- Las mutaciones que afectan múltiples tablas DEBEN utilizar transacciones de Prisma (`prisma.$transaction`) para garantizar la atomicidad (ej: creación de OT + actualización de balance de cliente).
