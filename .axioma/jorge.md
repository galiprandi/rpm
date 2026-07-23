## 📋 BACKLOG
- [ ] Idea pendiente — breve descripción

## ✅ COMPLETADO
- [x] 2026-07-23 — Búsqueda por Cliente y Pre-carga de Cuenta en Alta de OT (PR #jorge/work-orders/preloaded-customer-search)
- [x] 2026-07-22 — Indicadores Visuales de Checklist/Fotos y Exportación CSV en Taller (PR #jorge/work-orders/enhanced-metadata-csv-export)
- [x] 2026-07-21 — Botones de Filtro Rápido en Taller: Demoradas y Turnos de Hoy (PR #jorge/work-orders/quick-filters)
- [x] 2026-07-20 — Gestión de Fotos — Carga y eliminación masiva de fotos de órdenes de trabajo (PR jorge/work-orders/photo-management)
- [x] 2026-07-18 — Impresión Estandarizada de Remitos y Presupuestos (PR #jorge/work-orders/standardized-printing)
- [x] 2026-07-16 — Checklist Estándar e Interactivo en Taller (PR #jorge/work-orders/checklists-refactor)
- [x] 2026-07-16 — Paridad de Vista de Lista y Corrección de Prioridad HOY (PR #jorge/work-orders/list-view-parity)
- [x] 2025-07-12 — Refinamiento de UX en Taller: Acciones Rápidas y Navegación (PR #jorge/work-orders/ux-refinement)
- [x] 2025-07-08 — Servicio Centralizado de OT y Timeline Unificado (PR #jorge/work-orders/centralized-updates)

## 🧠 APRENDIZAJES
## 2026-07-23 - Búsqueda por Cliente y Pre-carga de Cuenta en Alta de OT
**Aprendizaje:** Al iniciar el alta de un servicio en el taller, es común que el recepcionista no conozca de inmediato la patente del vehículo, o que el cliente sea recurrente y tenga múltiples unidades. Permitir buscar directamente por cliente (nombre o teléfono) e integrar la pre-carga desde la URL (para redirecciones fluidas desde la ficha del cliente) reduce sustancialmente el tiempo de carga administrativa y elimina la fricción de duplicar búsquedas de cuentas existentes.
**Acción:** Siempre proveer múltiples caminos de búsqueda en flujos de creación (por entidad técnica y por entidad de cliente) y pre-cargar el contexto de forma transparente si proviene de una vista relacional previa.

## 2026-07-22 - Indicadores Visuales de Metadatos y Exportación CSV en Taller
**Aprendizaje:** En la gestión diaria del taller mecánico, tener visibilidad inmediata sobre si los checklists (de ingreso y de salida) han sido completados y la cantidad de fotos cargadas en las tarjetas del Kanban y de la Lista evita que se dejen vehículos sin inspección previa o posterior. Además, poder exportar en un solo click (respetando filtros activos, codificación Excel UTF-8 BOM, escape de caracteres y relaciones de vehículos/responsables de manera defensiva) eleva considerablemente la productividad administrativa del taller.
**Acción:** Siempre incluir micro-indicadores visuales con tooltips informativos para estados de procesos secuenciales (checklists, fotos) y habilitar exportación a CSV segura y amigable para Excel.

## 2026-07-21 - Botones de Filtro Rápido para Eficiencia en Taller
**Learning:** En flujos con alta carga de trabajo (como talleres mecánicos), disponer de contadores globales dinámicos en los botones de filtro rápido ("Demoradas", "Turnos de Hoy", etc.) le da al usuario visibilidad inmediata del estado de su operación sin tener que aplicar cada filtro. Esto acelera drásticamente la toma de decisiones.
**Acción:** Siempre incluir recuentos informativos y badges dinámicos con contrastes WCAG AA adecuados en todos los componentes de filtro principal.

## 2026-07-20 - Gestión de Fotos con Carga Masiva y Lightbox Immersivo
**Learning:** La implementación de flujos de carga masivos que realizan llamadas secuenciales a los endpoints de carga y de registro de fotos evita las complejidades y el riesgo de timeouts asociados a las cargas de bloques grandes (multipart uploads) de una sola vez. Además, para los componentes de lightbox, el uso de memos robustos que unifican las fotos de ingreso y egreso en un solo carrusel, junto con controles de navegación con el teclado (flechas y Esc) y de descarga, proporciona una navegación sumamente fluida.
**Acción:** Siempre unificar arrays de archivos dispersos en un solo carrusel indexado cuando se implementen lightboxes interactivos.

## 2026-07-18 - Emulación de Impresión y Contenido de Documentos
**Learning:** El uso de emulación de medios de impresión (`page.emulate_media(media="print")`) en Playwright facilita enormemente la auditoría y validación visual automatizada de layouts que de otra manera no son fácilmente verificables en pantalla normal. Asimismo, estructurar secciones de despacho (origen/destino) para remitos y cláusulas de validez/precio para presupuestos entrega un nivel de profesionalismo indispensable en documentos de taller y ventas.
**Acción:** Siempre usar emulación de impresión y validación con capturas de pantalla para todos los comprobantes y reportes imprimibles.

## 2026-07-16 - Checklists Interactivos y Resilientes
**Learning:** Almacenar checklists como datos serializados es flexible, pero requiere que las operaciones de actualización (PUT/POST) realicen merges seguros (preservando marcas de tiempo como `completedAt`) para evitar regresiones de datos. La inicialización con plantillas unificadas directamente en la interfaz de detalle elimina la necesidad de re-crear OTs completas para agregar protocolos faltantes.
**Acción:** Siempre fusionar campos de forma granular en APIs que operen sobre documentos JSON embebidos.

## 2026-07-16 - Paridad de Vista de Lista y Corrección de Prioridad HOY
**Learning:** Mantener la consistencia del motor de búsqueda y filtros entre la vista Kanban y la vista de lista evita sorpresas molestas al usuario. Priorizar visualmente los turnos programados para el día actual ("HOY") con estilos de alta jerarquía y contraste WCAG AA asegura que el equipo no pase por alto los trabajos críticos del día.
**Acción:** Al duplicar funcionalidades de filtrado/búsqueda en dos vistas de un mismo módulo, extraer la lógica de ordenamiento y filtrado a funciones puras reusables o memos unificados.

## 2025-07-12 - Acciones Rápidas en Kanban
**Learning:** Las acciones rápidas en tarjetas Kanban (hover buttons) reducen drácticamente la fricción para flujos lineales de trabajo, evitando la necesidad de drag-and-drop para transiciones comunes.
**Acción:** Implementar el patrón `NEXT_STATUS_MAP` para guiar al usuario hacia la siguiente acción lógica en el flujo de negocio.

## 2025-07-08 - UX Kanban y Propagación de Eventos
**Learning:** Los elementos interactivos anidados en tarjetas Kanban (como dropdowns de técnicos) requieren stop-propagation tanto en onMouseDown como en onClick para evitar la navegación del Link y conflictos con el inicio del arrastre.
**Acción:** Usar el "Patrón Guardián de Navegación Kanban" para todas las futuras interfaces tipo tablero.

## 2025-07-08 - Efectos Secundarios Centralizados
**Learning:** Mover los efectos secundarios como movimientos de stock y facturación automática a un servicio centralizado evita la fragmentación de lógica y el doble disparo durante el drag-and-drop del Kanban.
**Acción:** Siempre devolver un flag booleano de cambio de estado desde los servicios de actualización para permitir que los llamadores disparen retroalimentación condicional de UI o notificaciones externas.
