---
name: create-specification
description: 'Crea un nuevo archivo de especificación para la solución, optimizado para ser consumido por IAs Generativas y alineado con los estándares del proyecto.'
---

# Create Specification

Tu objetivo es crear un nuevo archivo de especificación para `${input:SpecPurpose}`.

El archivo de especificación debe definir los requisitos, restricciones e interfaces de los componentes de la solución de manera clara, sin ambigüedades y estructurada.

## Mejores Prácticas para Especificaciones "AI-Ready"

- Usa lenguaje preciso, explícito y sin ambigüedades.
- Distingue claramente entre requisitos, restricciones y recomendaciones.
- Usa un formato estructurado (encabezados, listas, tablas).
- Evita modismos, metáforas o referencias dependientes de contexto.
- Define términos específicos del dominio.
- El documento debe ser autocontenido.

La especificación debe guardarse en la carpeta `/specs/features/` (para módulos de negocio) o `/specs/architecture/` (para decisiones técnicas globales). El nombre debe seguir la convención kebab-case, ej: `inventory-sales.md`.

## Plantilla Estricta Obligatoria

Toda nueva especificación (especialmente de features/negocio) DEBE seguir la siguiente plantilla estricta en Markdown. Asegúrate de completar todas las secciones.

```md
🚦 Estado: [🟢 Completamente implementado (100%) | 🟡 Parcialmente implementado | 🔴 No iniciado (0%)]

# [Título Conciso de la Especificación]

## 1. Propósito / Alcance
[Proporciona una descripción clara y concisa del propósito de la especificación y su alcance. Qué resuelve a nivel de negocio.]

## 2. Casos de Uso Principales (Flujos de éxito)
[Lista detallada de qué hace la feature. Ej: "Permite al administrador crear una nueva venta", "Descuenta el stock automáticamente al confirmar", etc. Flujos paso a paso si es necesario.]
- **CU-01**: [Descripción]

## 3. Restricciones (Qué NO hace / Fuera de alcance)
[Enumera explícitamente qué cosas están fuera del alcance de esta especificación para evitar confusiones de responsabilidades.]
- **RES-01**: [Restricción]

## 4. Comportamiento Esperado y Casos Límite
[Qué sucede en cada caso anómalo, validaciones de seguridad o de negocio, y prevención de regresiones.]
- **Límite 1**: Si el stock es 0, [comportamiento esperado].
- **Validación 1**: [Regla de validación de formulario/API].

## 5. Dependencias Técnicas Clave
[Qué tablas de la base de datos (Prisma) afecta directamente, componentes de UI críticos, endpoints de API específicos o dependencias externas.]
- **Tablas BD**: `Tabla1`, `Tabla2`
- **Servicios**: `servicioX.ts`
- **Rutas API**: `/api/ruta`

```
