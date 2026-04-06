# AGENTS.md - Settings Domain

## Domain Overview

Configuración global de la aplicación incluyendo tema visual y parámetros de negocio como márgenes mínimos para alertas de rentabilidad.

## Related Specifications

- **@[specs/spec-price-lists.md]** - Configuración de margen mínimo global para alertas
- **@[specs/ui-architecture-adm.md]** - Definición de temas y paleta de colores

## Key Components

- `page.tsx` - Configuración general con cards por sección
- `SettingItem` - Componente reutilizable para items de configuración
- `ThemeSelector` - Selector de tema visual

## Architecture

- **Tipo**: Configuración (sin CRUD tradicional)
- **Secciones**: Apariencia (tema), Listas de Precios (márgenes)
- **Datos**: Guardados en tabla `Setting` (key-value)
- **Validaciones**: Rangos específicos por tipo de configuración

## Development Notes

- Usa `SettingItem` para consistencia visual
- Configuración de margen mínimo impacta alertas en listas de precios
- Selector de tema para personalización visual
- Validaciones en frontend (rango 0-100 para márgenes)
- API REST para guardar/recuperar configuraciones
- No usa `CrudAdmin` - es una página de configuración específica
