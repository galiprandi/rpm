# AGENTS.md - Users Domain

## Domain Overview

Gestión de usuarios del sistema con roles y permisos. Controla acceso a funcionalidades según rol (ADMIN, SELLER, TECHNICIAN, CASHIER) y maneja autenticación con Better Auth.

## Related Specifications

- **@[specs/auth.md]** - Sistema de autenticación y roles completo
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para entidades de configuración
- **@[specs/PLAN.md]** - Roles definidos en roadmap del proyecto

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin` y stats cards
- `UserDialog` - Modal creación/edición
- `UserForm` - Formulario con asignación de roles

## Architecture

- **Tipo**: Configuración (sin stats cards según checklist)
- **Campos**: email, nombre, rol, estado, notas
- **Roles**: ADMIN, SELLER, TECHNICIAN, CASHIER (definidos en BD)
- **Autenticación**: Integración con Better Auth system
- **Permisos**: Control de acceso por rol a funcionalidades

## Development Notes

- Usa `CrudAdmin` sin stats cards (entidad de configuración)
- Roles manejados por base de datos (no hard-coded)
- Integración completa con Better Auth para autenticación
- Soporte para activar/desactivar usuarios (soft delete)
- Asignación de roles con validaciones específicas
- Auditoría de cambios en sistema de permisos
