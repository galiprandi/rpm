## 📋 BACKLOG
- [ ] Mejorar la visualización de archivos adjuntos en la ficha del vehículo

## ✅ DONE
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
