# Diario de Croma - RPM Accesorios

Aprendizajes críticos de UX y accesibilidad.

## 2025-05-23 - [Botones de Icono Accesibles & Tooltips en Storybook]
**Aprendizaje:** Los botones con solo icono deben usar consistentemente `aria-label` para lectores de pantalla y `Tooltip` para feedback visual. En este sistema de diseño (basado en Radix), los Tooltips requieren un `TooltipProvider` que faltaba en Storybook, impidiendo la verificación visual de las características de accesibilidad de forma aislada.
**Acción:** Siempre envolver botones con solo icono en `Tooltip` + `TooltipTrigger` (con `asChild`) y asegurar que `TooltipProvider` esté disponible en el contexto del componente (y en los decoradores de Storybook).

## 2025-05-15 - Consistencia de Paginación en Español en DataTables
**Aprendizaje:** La aplicación está dirigida a un público hispanohablante, por lo que los componentes UI principales como `DataTable` deben tener su texto incorporado (resúmenes de paginación, placeholders de búsqueda, etc.) traducido al español para mantener una UX consistente. Además, la accesibilidad para lectores de pantalla se mejora agregando etiquetas ARIA a los botones de navegación con solo icono.
**Acción:** Asegurarse siempre que cualquier componente de presentación de datos nuevo o modificado use etiquetas en español (ej. "registros" en lugar de "items") y proporcionar `aria-label` explícito para elementos interactivos con solo icono.

## 2025-05-14 - Accesibilidad de Paginación en DataTable
**Aprendizaje:** Los botones con solo icono en componentes de navegación críticos como `DataTable` a menudo carecen de etiquetas explícitas, dificultando su uso para usuarios de lectores de pantalla y siendo ambiguos para otros. Proporcionar tanto `aria-label` como `Tooltip` es el estándar para este proyecto.
**Acción:** Siempre envolver botones con solo icono con `Tooltip` y proporcionar `aria-label`.

## 2025-05-02 - [Patrón de Accesibilidad de Tooltip]
**Aprendizaje:** Los botones con solo icono requieren tanto `aria-label` para lectores de pantalla como `Tooltip` para usuarios visuales para ser verdaderamente accesibles. En Storybook, los Tooltips basados en Radix no se renderizan a menos que estén envueltos en un decorador `TooltipProvider`.
**Acción:** Siempre envolver botones con solo icono en `Tooltip` + `TooltipTrigger` y proporcionar un `aria-label` explícito. Asegurar que el `preview.ts` de Storybook tenga los providers necesarios.

## 2026-05-07 - [Tooltip de Stock Bajo & Accesibilidad de Teclado]
**Aprendizaje:** Proporcionar solo indicadores visuales (como texto naranja para stock bajo) es insuficiente para la accesibilidad. Agregar un Tooltip con el umbral exacto y una etiqueta ARIA asegura que todos los usuarios entiendan el contexto. Además, hacer que el indicador sea enfocable mediante `tabIndex={0}` permite a los usuarios de teclado activar el tooltip.
**Acción:** Al usar indicadores de estado basados en color, siempre complementar con un Tooltip para el contexto del umbral y un `aria-label` para lectores de pantalla. Asegurar que el elemento sea enfocable por teclado.
