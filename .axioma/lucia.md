## 📋 BACKLOG
- [ ] Implementar exportación PDF de cuenta corriente y deuda de vehículo desde su ficha técnica

## ✅ DONE
- [x] 2026-07-18 — Galería Fotográfica y Registro de Adjuntos Consolidado en la Ficha del Vehículo
  - Conexión de la API `/api/vehicles/[id]` para incluir todas las fotos (`photo` relation) de las últimas 50 Órdenes de Trabajo del vehículo.
  - Creación del panel de pestañas (`Tabs`) separando el listado histórico de OTs de la nueva galería fotográfica consolidada del vehículo.
  - Desarrollo de galería de fotos de alta fidelidad, de-duplicando fotos por URL (agregando `entryPhotos`, `exitPhotos` y fotos de la tabla general).
  - Implementación de filtros rápidos por tipo de foto (Ingreso, Egreso, General) y por Orden de Trabajo de origen para una búsqueda instantánea.
  - Diseño de tarjetas interactivas de fotos con efecto de zoom al pasar el cursor (`hover:scale-105`), etiquetas de colores de semántica de estado y enlaces directos a la OT de procedencia.
  - Creación de un visualizador / Lightbox inmersivo a pantalla completa con navegación mediante flechas de teclado (`ArrowLeft` / `ArrowRight` / `Escape`), indicador de metadatos, enlace a la OT y botón de descarga directa de imágenes.
- [x] 2026-07-17 — Cuenta Corriente y Cobranza Rápida en la Ficha de Vehículos
  - Implementación del cálculo dinámico de deuda acumulada del vehículo a partir de sus OTs pendientes de cobro (estado distinto de `PAID` y `CANCELLED`).
  - Creación de la tarjeta "Cuenta Corriente del Vehículo" destacando el saldo pendiente y permitiendo notificar la deuda por WhatsApp y saldar la deuda total.
  - Adición de un listado interactivo de OTs impagas con botones para registrarlas individualmente.
  - Integración de botones de cobro rápido (`ArrowDownLeft`) en cada fila correspondiente de la tabla general del historial de OTs del vehículo.
  - Implementación del modal de cobro unificado (`Dialog` de pagos) consumiendo la API de pagos del cliente con protección contra doble envío.
- [x] 2026-07-28 — Validación de CUIT en tiempo real y protección doble click
  - Implementación de validación de CUIT/CUIL en tiempo real en `CustomerForm` que se dispara automáticamente al completar 11 dígitos numéricos.
  - Mensaje descriptivo "CUIT válido" en verde con un indicador de punto e input con bordes verde esmeralda para una UX limpia y agradable.
  - Validación del CUIT en el evento `onBlur` que advierte si la longitud es inferior a 11 dígitos.
  - Agregada protección de doble envío de formulario (`isSubmitting`) en los formularios de Clientes (`CustomerForm`) y Vehículos (`VehicleForm`).
  - Suite de tests unitarios completa en `CustomerForm.test.tsx` cubriendo inputs, carga de initialData, validación en tiempo real de CUIT, validación onBlur y protección de doble envío.
- [x] 2026-07-15 — Expansión de búsqueda y mejoras en reporte de deudores
  - Expansión de búsqueda en backend (`customerService.ts`) para incluir Email, Dirección y Patente.
  - Mejora visual en reporte de deudores para resaltar deudas con más de 30 días.
  - Uso de `phoneAlt` como fallback de contacto en el reporte de deudores.
- [x] 2025-07-24 — Mejoras de UX y agilización de cobranzas
  - Inclusión de `phoneAlt` en la búsqueda global de clientes.
  - Estandarización de precisión financiera (`formatARS(x, 2)`) y tipografía (`font-semibold`) en listado de clientes.
  - Implementación de botón "Saldar total" en el diálogo de pago del cliente.
  - Adición de botones de "Pagar" rápido para cada Orden de Trabajo pendiente en la ficha del cliente.
  - Mejora de navegación con botón de "Volver" en el detalle del cliente.

## 🧠 LEARNINGS
## 2026-07-18 - Consolidación de Historial Visual de Entidades Relacionadas
**Learning:** En fichas técnicas o perfiles de nivel intermedio (como un Vehículo), los archivos adjuntos y fotos suelen estar dispersos a nivel operativo de transacciones (en Órdenes de Trabajo). Ofrecer una vista agregada y consolidada de todos estos archivos directamente en el perfil del vehículo, junto con herramientas de filtrado rápido y un visualizador Lightbox cómodo, ahorra valiosos clics de navegación y permite al operador realizar una inspección de daños previa y posterior de forma impecable.
**Action:** Consolidar fotos, notas y adjuntos dispersos en sub-entidades operativas y presentarlos unificados en las fichas del cliente y vehículo.

## 2026-07-17 - Experiencia de Cobranza Simétrica
**Learning:** Ofrecer capacidades de cuenta corriente y cobranza rápida no solo en la ficha de clientes, sino también en la ficha de vehículos, mejora enormemente la eficiencia en el punto de recepción del taller. Los operadores asocian naturalmente un vehículo que entra al taller con sus facturas pendientes, y poder cobrar sin salir de esa vista agiliza el flujo de caja del negocio.
**Action:** Mantener la simetría de flujos financieros en vistas relacionadas (Clientes <-> Vehículos) para eliminar clics de navegación innecesarios.

## 2026-07-28 - Validación de CUIT en Tiempo Real de Alta Fidelidad
**Learning:** Validar el CUIT en tiempo real inmediatamente al presionar teclas puede resultar frustrante si se muestra un error de longitud mientras el usuario apenas está escribiendo. Disparar la validación algorítmica (Fórmula de Módulo 11) exactamente cuando la longitud es 11 dígitos, y reservar la advertencia de longitud incompleta para el evento `onBlur`, proporciona un flujo sumamente natural e interactivo.
**Action:** Usar este patrón híbrido (tiempo real a longitud fija + onBlur para campos incompletos) para campos de formato estructurado.

## 2025-07-24 - Estandarización de Datos Financieros
**Learning:** La consistencia en la tipografía (`font-mono`) y el formato de moneda es crítica para la legibilidad en módulos contables. El uso de `formatARS` centralizado evita discrepancias de redondeo.
**Action:** Usar siempre `formatARS` y clases de ancho fijo para valores monetarios.

## 2025-07-24 - Accesibilidad en Formularios Dinámicos
**Learning:** En formularios que se usan tanto en creación como en edición, asegurar que los `id` sean únicos y los `aria-label` descriptivos mejora significativamente la experiencia con lectores de pantalla.
**Action:** Mapear siempre `Label` con `htmlFor` apuntando a `id` explícitos.
