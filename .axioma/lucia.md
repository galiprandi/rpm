## 📋 BACKLOG

## ✅ DONE
- [x] 2026-07-29 — Acción de Recalcular Saldos para Administradores en Listado de Clientes
  - Implementación de un botón de acción "Recalcular Saldos" en la cabecera del listado de clientes (`CustomersClient.tsx`), visible únicamente para usuarios con rol de Administrador (`isAdmin={userRole === UserRole.ADMIN}`).
  - Integración asíncrona robusta que invoca al endpoint `/api/admin/recalculate-balances` con estados de carga animados (`isRecalculating` con animación pulse) y re-fetching automático tras un cálculo exitoso.
  - Diseño de feedback estructurado sin alert nativo usando el contexto de `useUI().alert` para notificar al operador los resultados precisos del proceso de optimización de saldos.
  - Suite de pruebas exhaustiva con Vitest (`CustomersClient.test.tsx`) que valida la visualización basada en roles, las llamadas asíncronas y el control de alertas.
- [x] 2026-07-22 — Visualización de Equipos y Alertas de Deuda por Vehículo en Ficha de Cliente
  - Optimización de la tabla de "Vehículos y Equipos" en la ficha del cliente para renderizar el nombre (`equipmentName`) y tipo de equipo (`equipmentType`) de forma clara para categorías de no-vehículos (ej: `AUDIO_EQUIPMENT`, `TRAILER`, `ELECTRIC_SCOOTER`, `OTHER`), evitando celdas vacías.
  - Implementación de alertas de deuda específicas por vehículo/equipo directamente en la tabla, calculando la deuda en base a órdenes de trabajo pendientes de pago (`vDebt`).
  - Renderizado de badges semánticos contrastados indicando el saldo pendiente de cada activo, facilitando el diagnóstico rápido de deudores.
- [x] 2026-07-21 — Registro de Pago Directo en Reporte de Deudores y Empty States Optimizados
  - Implementación de un modal de registro de pago rápido directamente desde el listado de deudores (`DebtorsClient.tsx`), permitiendo cobrar sin necesidad de salir del reporte.
  - Diseño de un botón con el icono `ArrowDownLeft` y tooltip "Registrar Pago" en la columna de acciones de la tabla de deudores.
  - Rediseño de los empty states del detalle del cliente (`page.tsx`) para vehículos y órdenes de trabajo, reemplazando el texto estático con tarjetas informales elegantes y botones directos de llamada a la acción ("+ Agregar Vehículo" y "+ Crear Nueva OT").
- [x] 2026-07-20 — Exportación de Datos en CSV y Resumen de Cuenta Corriente de Cliente
  - Implementación de exportación client-side de CSV en el listado de clientes (`CustomersClient.tsx`) y vehículos (`VehiclesClient.tsx`) con codificación UTF-8 BOM (`\ufeff`) y escaping de campos.
  - Integración del botón de "Exportar PDF" en la tarjeta "Cuenta Corriente" de la ficha detallada del cliente (`app/adm/customers/[id]/page.tsx`).
  - Creación del layout de impresión unificado en `app/adm/customers/[id]/page.tsx` (`id="print-section"`) con estilo formal, cabecera de RPM, datos del cliente, tabla de OTs adeudadas, términos y líneas de firmas de conformidad.
- [x] 2026-07-19 — Exportación PDF y Resumen Impreso de Cuenta Corriente del Vehículo
  - Adición de un botón "Exportar PDF" en la tarjeta "Cuenta Corriente del Vehículo" de la ficha detallada (`app/adm/vehicles/[id]/page.tsx`).
  - Creación de un componente para impresión (`id="print-section"`) con estilo de factura/resumen formal de deudas del vehículo, conteniendo cabecera de RPM Accesorios, datos del propietario y vehículo, tabla de OTs adeudadas con totales, disclaimer legal y líneas de firma.
  - Implementación de un bloque autoinyectable `<style media="print">` que formatea el documento para impresión al 100% de ancho sobre fondo blanco y oculta de forma infalible elementos como sidebars, botones del sistema, menús de navegación y widgets flotantes.
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
## 2026-07-29 - Acción de Recalcular Saldos y Control de Acceso por Roles
**Learning:** En flujos administrativos donde existen roles con diferentes permisos (como Admin vs Staff), es sumamente importante restringir la visualización y ejecución de acciones críticas (como la optimización y recálculo de saldos de cuenta corriente de los clientes) a nivel de la interfaz de usuario. Al pasar explícitamente la propiedad `isAdmin` a componentes de cliente desde una página de servidor segura y condicionar la renderización de las acciones de cabecera, evitamos la exposición de controles avanzados a usuarios con menos privilegios. Además, la interacción con la API de procesamiento pesado debe incorporar estados de carga visibles y avisos no intrusivos mediante contextos UI (`useUI().alert`) en lugar de alerts globales del navegador para mantener la fluidez de la interfaz.
**Action:** Propagar siempre variables seguras de rol desde el servidor a componentes de cliente, aplicar feedback de carga con animaciones y notificaciones de UI controladas.

## 2026-07-22 - Visualización Contextual de Activos y Alertas Financieras
**Learning:** En fichas de clientes complejos (como flotas de transporte, empresas o clientes con múltiples unidades y equipos), es común tener tanto automotores tradicionales como equipos especiales o remolques registrados en la misma cuenta. Si la interfaz solo muestra marca y modelo estándar, las celdas de equipos quedan vacías, forzando al operador a navegar a la ficha individual de cada equipo para saber qué es. Al renderizar dinámicamente `equipmentName` y `equipmentType` en la misma tabla según la categoría del activo, y añadir alertas de deuda individuales derivadas de las órdenes de trabajo activas, se proporciona una visualización contextual impecable que permite identificar deudores de un vistazo sin clics de navegación adicionales.
**Action:** Utilizar siempre visualizaciones adaptativas basadas en la categoría del activo e inyectar métricas financieras agregadas en la tabla de listado de sub-entidades para reducir fricción.

## 2026-07-20 - Resumen de Cuenta Corriente del Cliente Impreso y Exportación CSV
**Learning:** Ofrecer un resumen de cuenta corriente de cliente con soporte para impresión física o PDF permite una experiencia administrativa del taller sin fisuras. Mediante window.print() y estilos `@media print` scoped, se genera un documento elegante que reúne la deuda total y el detalle de OTs impagas. Asimismo, la exportación de listados de Clientes y Vehículos a formato CSV que respeta el filtrado y búsqueda del usuario actual con BOM UTF-8 y entrecomillado adecuado de campos simplifica enormemente la reportería en Excel.
**Action:** Mantener la simetría de exportaciones PDF imprimibles y exportaciones de listados en formato CSV con BOM compatible con Excel en todo el sistema.

## 2026-07-19 - Resúmenes de Cuenta Autocontenidos y Listos para Imprimir
**Learning:** Ofrecer capacidades de exportación rápida a PDF sin añadir dependencias de backend o pesadas librerías de renderizado se puede lograr elegantemente combinando `window.print()` nativo con un bloque `<style media="print">` localizado. De esta manera, el navegador hace todo el trabajo pesado garantizando el renderizado exacto de fuentes y colores. Además, diseñar el documento impreso como un recibo formal o resumen estructurado (con firmas y disclaimers legales) añade un inmenso valor profesional para los operadores del taller.
**Action:** Usar estilos autocontenidos `@media print` y contenedores semánticos listos para impresión en módulos de informes u hojas de detalles.

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
