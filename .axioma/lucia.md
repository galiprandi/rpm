## 📋 BACKLOG

## ✅ DONE
- [x] 2026-08-04 — Ordenamiento Inteligente y Robusto en Grillas de Clientes, Vehículos y Transacciones
  - Implementación de `accessorFn` explícitos y estables para columnas anidadas y dinámicas en el dashboard de vehículos (`VehiclesClient.tsx`) y detalle de cliente (`app/adm/customers/[id]/page.tsx`).
  - Habilitado el ordenamiento dinámico por "Deuda", "Marca/Modelo" y "Propietario" en el listado de vehículos.
  - Normalizado el ordenamiento por "Marca/Modelo/Equipo", "Vehículo" y "Concepto/Items" en las tablas de vehículos, órdenes de trabajo e historial de transacciones de la ficha de cliente.
  - Conversión numérica de montos en `directSales`, `creditNotes` y `payments` para garantizar que la columna "Total" se ordene con precisión matemática matemática y no alfabética.
  - Corrección de riesgos de excepciones de tipo `TypeError` al usar navegación opcional segura (`?.`) en todas las columnas complejas.
- [x] 2026-07-31 — Validación y Formateo de Teléfono en Creación de Cliente Inline en Diálogo de Vehículo
  - Integración de validación de teléfonos argentinos en tiempo real y en blur en la creación de clientes inline dentro de `VehicleDialog.tsx`.
  - Añadidos chips de autocompletado de prefijos rápidos de Argentina (AMBA, Córdoba, Rosario, Mendoza, Tucumán) con re-enfoque automático del cursor.
  - Sincronización del estilo visual del campo de entrada del teléfono (borde verde esmeralda y punto pulsante con región detectada en caso de éxito, borde destructivo y descripción en caso de error) para coherencia visual absoluta con `CustomerForm.tsx`.
  - Cobertura de pruebas completa en `VehicleDialog.test.tsx` para garantizar que la lógica de validación, formateo, pre-llenado de prefijos y bloqueo de envíos incorrectos funcione perfectamente.
- [x] 2026-07-31 — Filtro Avanzado de Antigüedad y Búsqueda en Reporte de Deudores
  - Implementación de filtros client-side avanzados en el Reporte de Deudores (`app/adm/reports/debtors/DebtorsClient.tsx`), permitiendo segmentar por antigüedad de la deuda (deudas mayores a 30, 60, 90 días, o deudas recientes inferiores a 30 días).
  - Integración de barra de búsqueda global en la DataTable para buscar deudores por nombre, teléfonos, email, o por patentes de vehículos registrados.
  - Recálculo en tiempo real de los indicadores KPI de resumen (Deuda Total, Clientes Deudores, OTs, Promedio de Deuda) tanto en pantalla como en el layout de impresión de alta fidelidad, asegurando consistencia absoluta entre lo que se ve en pantalla y el documento impreso.
  - Sincronización de la exportación a CSV para respetar los filtros y búsquedas aplicadas activamente por el usuario.
  - Cobertura completa de pruebas de filtrado y búsqueda en `DebtorsClient.test.tsx` garantizando la robustez del flujo.
- [x] 2026-07-30 — Historial Financiero Unificado con Órdenes de Trabajo en Detalle de Cliente
  - Integración de Órdenes de Trabajo como transacciones de tipo `"INVOICE"` (Factura) directamente dentro de la tabla consolidada de "Historial de Transacciones" en la ficha de detalle de cliente (`app/adm/customers/[id]/page.tsx`). Esto unifica los movimientos de taller con las ventas directas, notas de crédito y pagos en una verdadera cuenta corriente unificada y cronológica.
  - Mapeo de conceptos técnicos con descripciones legibles ("Orden de Trabajo #CODE - Vehículo [PATENTE]") para los ítems de órdenes de trabajo.
  - Soporte de estado `"PAID"` en la tabla de transacciones generales, pintando insignias azules/verdes semánticas ("Pagada").
  - Adición de un atajo de navegación premium "Ver Orden de Trabajo Detallada" en el modal de detalle de transacción, permitiendo navegar sin fricción desde el historial general directamente a la OT.
- [x] 2026-07-27 — Integración Unificada de Botón Imprimir en Cabeceras de Detalle de Clientes y Vehículos
  - Incorporación del botón de acción secundaria "Imprimir" con el icono `Printer` en la cabecera principal de las fichas de Detalle de Cliente y Detalle de Vehículo. Esto unifica la experiencia con los demás reportes del sistema (Deudores, Rentabilidad, Finanzas) y permite generar el resumen de cuenta impreso de alta fidelidad en cualquier momento, incluso cuando el saldo actual es exactamente $0.00.
  - Actualización de los botones de impresión incrustados en las tarjetas de cuenta corriente para que utilicen el icono `Printer` y el texto "Imprimir" en lugar de "Exportar PDF" con un icono de descarga, logrando coherencia visual absoluta.
  - Optimización de la vista de impresión del vehículo (`#print-section`) para renderizar un mensaje de fallback limpio y elegante de "No hay órdenes de trabajo pendientes de pago" en la tabla cuando no existen deudas, alineándose con el diseño del cliente.
  - Verificación visual end-to-end completa con capturas de pantalla y grabación de video mediante un script de Playwright en modo desatendido.
- [x] 2026-07-26 — Seguimiento de Deuda y Filtros de Cuentas Corrientes en Listado de Vehículos
  - Implementación del cálculo dinámico de deuda de vehículos en tiempo real en `VehiclesClient.tsx` agregando los totales de órdenes de trabajo con estado pendiente (distinto de `PAID` y `CANCELLED`).
  - Adición de dos nuevas tarjetas de estadísticas KPI ("Con Deuda" y "Deuda Total") en la cabecera de vehículos para una visualización agregada perfecta del estado financiero de las unidades del taller.
  - Creación de un botón interactivo "Filtrar con Deuda" en las acciones secundarias de cabecera que permite al operador aislar instantáneamente vehículos con saldos deudores pendientes.
  - Inyección de una columna dedicada "Deuda" en la tabla principal con formato de moneda argentino (`formatARS`) y estilo visual de alto contraste WCAG AA (`text-red-700 font-semibold font-mono`).
  - Expansión de la exportación a CSV para incluir la columna "Deuda" calculada, garantizando compatibilidad Excel.
  - Desarrollo de una suite de pruebas automatizadas completa en `VehiclesClient.test.tsx` logrando una cobertura robusta de cálculos de deuda, filtros interactivos y descargas.
- [x] 2026-07-25 — Autocompletado y Validación de Prefijos de Teléfonos en CustomerForm
  - Creación de un conjunto completo de utilidades de validación y normalización específicas para teléfonos argentinos en `lib/utils/phone-validation.ts`. Soporta eliminación automática de prefijos internacionales `+54`/`54`, el dígito móvil `9` en cadenas cortas, ceros iniciales de códigos de área, y el prefijo interno `15` para celulares.
  - Implementación de un selector de prefijos rápidos (chips interactivos) en `CustomerForm.tsx` para AMBA (11), Córdoba (351), Rosario (341), Mendoza (261) y Tucumán (381). Al hacer clic en un prefijo, se precarga la plantilla `+54 9 [Prefijo] ` manteniendo dígitos locales existentes y enfocando el campo con el cursor posicionado de forma óptima al final.
  - Diseño de visualización de errores y estados válidos en tiempo real aliniados con los estándares de validación de CUIT, inyectando un borde verde esmeralda y un indicador dot pulsante verde con la región geográfica detectada (ej. `● Teléfono válido (Córdoba)` o `● WhatsApp válido (AMBA)`).
  - Desarrollo de una suite de pruebas unitarias robustas en `tests/unit/phone-validation.test.ts` con cobertura del 100% de normalizaciones, formato y detección de región.
  - Adición de pruebas de integración frontend en `components/customers/CustomerForm.test.tsx` garantizando el comportamiento de las acciones de clics de autocompletado, formateo interactivo y flujos de eventos de pérdida de foco (`onBlur`).
- [x] 2026-07-24 — Validación de Patentes en Tiempo Real con Interfaz Híbrida en Ficha de Vehículo
  - Implementación del patrón de validación híbrido de patentes argentinas en tiempo real en `VehicleForm.tsx`.
  - Validación algorítmica inmediata cuando la patente sanitizada (sin espacios ni guiones) alcanza la longitud esperada por categoría (6-7 caracteres para autos/motos, 9-10 para trailers).
  - Alerta de longitud corta y mensajes descriptivos en eventos `onBlur` y de envío, previniendo guardar identificadores truncados o inválidos en la base de datos.
  - Diseño de feedback visual semántico con borde verde esmeralda (`border-emerald-500`) y punto pulsante junto al texto "Patente válida" de forma simétrica a la validación de CUIT.
  - Expansión de la suite de pruebas unitarias en `VehicleForm.test.tsx` con 4 nuevos casos de prueba robustos logrando cobertura total de estados de validación y de bloqueo de formularios.
- [x] 2026-07-29 — Acción de Recalcular Saldos para Administradores en Listado de Clientes
  - Implementación de un botón de acción "Recalcular Saldos" en la cabecera del listado de clientes (`CustomersClient.tsx`), visible únicamente para usuarios con rol de Administrador (`isAdmin={userRole === UserRole.ADMIN}`).
  - Integración asíncrona robusta que invoca al endpoint `/api/admin/recalculate-balances` con estados de carga animados (`isRecalculating` con animación pulse) y re-fetching automático tras un cálculo exitoso.
  - Diseño de feedback de alerta mediante el método `useUI().alert` para notificar resultados precisos sin diálogos invasivos.
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
  - Implementación de validación de CUIT/CUIL in tiempo real en `CustomerForm` que se dispara automáticamente al completar 11 dígitos numéricos.
  - Mensaje descriptivo "CUIT válido" en verde con un indicador de punto e input con bordes verde esmeralda para una UX limpia y agradable.
  - Validación del CUIT en el evento `onBlur` que advierte si la longitud es inferior a 11 dígitos.
  - Agregada protección de doble envío de formulario (`isSubmitting`) en los formularios de Clientes (`CustomerForm`) y Vehículos (`VehicleForm`).
  - Suite de tests unitarios completa en `CustomerForm.test.tsx` cubriendo inputs, carga de initialData, validación en tiempo real de CUIT, validación onBlur and protección de doble envío.
- [x] 2026-07-15 — Expansión de búsqueda y mejoras en reporte de deudores
  - Expansión de búsqueda en backend (`customerService.ts`) para incluir Email, Dirección y Patente.
  - Mejora visual en reporte de deudores para resaltar deudas con más de 30 días.
  - Uso de `phoneAlt` como barra de búsqueda en el reporte de deudores.
- [x] 2025-07-24 — Mejoras de UX y agilización de cobranzas
  - Inclusión de `phoneAlt` en la búsqueda global de clientes.
  - Estandarización de precisión financiera (`formatARS(x, 2)`) y tipografía (`font-semibold`) en listado de clientes.
  - Implementación de botón "Saldar total" en el diálogo de pago del cliente.
  - Adición de botones de "Pagar" rápido para cada Orden de Trabajo pendiente en la ficha del cliente.
  - Mejora de navegación con botón de "Volver" en el detalle del cliente.

## 🧠 LEARNINGS
## 2026-08-04 - Ordenamiento de Campos Calculados y Complejos en TanStack Table
**Learning:** En tablas de datos avanzadas como las de vehículos y transacciones, es común tener columnas basadas en datos compuestos (como la combinación de marca y modelo o el nombre del equipamiento técnico) o calculados al vuelo (como la deuda acumulada de un vehículo). Si estas columnas se renderizan sin un `accessorFn` explícito, TanStack Table pierde la capacidad de ordenarlas y filtrarlas de forma predecible o directamente omite la funcionalidad. Al definir funciones accesoras explícitas (`accessorFn`) para transformar y normalizar estos campos complejos (incluyendo la conversión explícita de montos decimales a tipo numérico de JavaScript), garantizamos un ordenamiento preciso y un filtrado fluido que mejora drásticamente la usabilidad y evita excepciones por valores nulos.
**Action:** Usar siempre `accessorFn` estables y tipados en TanStack Table para columnas compuestas, anidadas o de montos financieros calculados para asegurar la capacidad de ordenamiento completo de la grilla.

## 2026-07-31 - Validación de Teléfono en Modales Inline
**Learning:** Al simplificar los flujos para permitir crear entidades relacionadas en el lugar (como crear un cliente directamente desde el modal para agregar vehículos), es común descuidar la validación y normalización de los datos. Esta inconsistencia no solo daña la UX sino que ensucia la base de datos con formatos inconsistentes de teléfonos que luego pueden fallar en integraciones automatizadas (como envíos de notificaciones de WhatsApp). Trasplantar el mismo motor inteligente de validación, formateo y chips de prefijos geográficos de la pantalla principal a los formularios inline garantiza coherencia visual absoluta, consistencia de datos y deleita al usuario.
**Action:** Mantener siempre la misma fidelidad de validación y enriquecimiento de campos de datos estructurados (como teléfonos, CUIT o patentes) en formularios de creación rápida/inline que en las vistas completas dedicadas.

## 2026-07-31 - Filtros Dinámicos Integrados con Métricas de Resumen y Exportación
**Learning:** Al añadir herramientas de segmentación avanzada (como la antigüedad de la deuda y filtros de búsqueda) en reportes financieros de gran volumen, es fundamental que la UI reaccione como un todo integrado. El usuario final espera que, al realizar un filtro de cohorte (ej. ver solo deudores con más de 30 días), no solo se filtre la tabla, sino que también se recalculen de inmediato las tarjetas KPI de resumen (Deuda Total, Cuenta de Clientes, Promedio de Deuda) tanto en la pantalla como en los formatos de impresión física o exportación CSV. Esta sincronización elimina por completo discrepancias de datos y brinda una experiencia de altísimo nivel técnico.
**Action:** Al filtrar listados que cuenten con paneles de estadísticas o layouts de impresión integrados, utilizar siempre computaciones de useMemo para recalcular los resúmenes de manera reactiva e inyectar el dataset filtrado unificado a todas las vistas derivadas.

## 2026-07-30 - Historial de Transacciones como Estado de Cuenta Corriente Real
**Learning:** Una ficha de cliente que muestra por separado las órdenes de trabajo del resto de movimientos financieros (como notas de crédito y pagos) dificulta la interpretación cronológica del saldo de la cuenta corriente. Al consolidar todos estos tipos de transacciones de forma cronológica en un único historial unificado —tratando las órdenes de trabajo como transacciones debitadoras (`"INVOICE"`)—, el operador puede seguir perfectamente la evolución del balance del cliente. Adicionalmente, enriquecer el modal de resumen de transacciones con un botón de navegación directa a la entidad origen de la transacción reduce significativamente la fricción de navegación.
**Action:** Unificar siempre todos los registros debitadores y acreditadores de una cuenta corriente en un único listado transaccional y ofrecer enlaces contextuales de navegación rápida.

## 2026-07-26 - Gestión de Cuentas Corrientes Unificadas en Activos (Vehículos/Equipos)
**Learning:** En talleres con flujos operativos avanzados, los operadores y encargados de cobros tienden a asociar y seguir las deudas directamente vinculadas a las patentes/vehículos que ingresan físicamente al taller. Proporcionar un seguimiento financiero e indicadores de deuda total en el propio listado de vehículos, permitiendo filtrar de inmediato qué unidades registran saldos deudores pendientes, agiliza dramáticamente el control de cuentas corrientes y la gestión de cobranzas. Además, mantener el mismo estilo visual de KPI y colores de contraste alto (nivel 700) que en el listado de clientes asegura consistencia y profesionalismo en toda la interfaz.
**Action:** Integrar siempre la lógica de deuda y filtros de saldos en listas secundarias de activos para agilizar la toma de decisiones.

## 2026-07-25 - Validación Dinámica de Teléfonos Argentinos Libre de Falsos Positivos
**Learning:** Al normalizar y validar números telefónicos argentinos en tiempo real, es muy común tener colisiones durante la digitación carácter por carácter (for example, cuando un número de 10 dígitos que contiene el prefijo `9` pero aún no ha sido completado es interpretado incorrectamente como un número local de 10 dígitos sin código de país, lo que resulta en un formato deformado mid-typing). Limitar los códigos de área de Argentina para que siempre inicien de forma estricta con `1`, `2` o `3` en `validateArgentinePhone` evita este tipo de colisiones y garantiza una auto-corrección totalmente fluida y libre de saltos visuales.
**Action:** Aplicar validación estricta de primer dígito para area codes al programar máquinas de formateo en tiempo real.

## 2026-07-29 - Acción de Recalcular Saldos y Control de Acceso por Roles
**Learning:** En flujos administrativos donde existen roles con diferentes permisos (como Admin vs Staff), es sumamente importante restringir la visualización y ejecución de acciones críticas (como la optimización y recálculo de saldos de cuenta corriente de los clientes) a nivel de la interfaz de usuario. Al pasar explícitamente la propiedad `isAdmin` a componentes de cliente desde una página de servidor segura y condicionar la renderización de las acciones de cabecera, evitamos la exposición de controles avanzados a usuarios con menos privilegios. Además, la interacción con la API de procesamiento pesado debe incorporar estados de carga visibles y avisos no intrusivos mediante contextos UI (`useUI().alert`) en lugar de alerts globales del navegador para mantener la fluidez de la interfaz.
**Action:** Propagar siempre variables seguras de rol desde el servidor a componentes de cliente, aplicar feedback de carga con animaciones y notificaciones de UI controladas.

## 2026-07-22 - Visualización Contextual de Activos y Alertas Financieras
**Learning:** En fichas de clientes complejos (como flotas de transporte, empresas o clientes con múltiples unidades y equipos), es común tener tanto automotores tradicionales como equipos especiales o remolques registrados en la misma cuenta. Si la interfaz solo muestra marca y modelo estándar, las celdas de equipos quedan vacías, forzando al operador a navegar a la ficha individual de cada equipo para saber qué es. Al renderizar dinámicamente `equipmentName` y `equipmentType` en la misma tabla según la categoría del activo, y añadir alertas de deuda individuales derivadas de las órdenes de trabajo activas, se proporciona una visualización contextual de primer nivel que permite identificar deudores de un vistazo sin clics de navegación adicionales.
**Action:** Utilizar siempre visualizaciones adaptativas basadas en la categoría del activo e inyectar métricas financieras agregadas en la tabla de listado de sub-entidades para reducir fricción.

## 2026-07-20 - Resumen de Cuenta Corriente del Cliente Impreso y Exportación CSV
**Learning:** Ofrecer un resumen de cuenta corriente de cliente con soporte para impresión física o PDF permite una experiencia administrativa del taller sin fisuras. Mediante window.print() y estilos `@media print` scoped, se genera un documento elegante que reúne la deuda total y el detalle de OTs impagas. Asimismo, la exportación de listados de Clientes y Vehículos a formato CSV que respeta el filtrado y búsqueda del usuario actual con BOM UTF-8 y entrecomillado adecuado de campos simplifica enormemente la reportería en Excel.
**Action:** Mantener la simetría de exportaciones PDF imprimibles y exportaciones de listados en formato CSV con BOM compatible con Excel en todo el sistema.

## 2026-07-19 - Resúmenes de Cuenta Autocontenidos y Listos para Imprimir
**Learning:** Ofrecer capacidades de exportación rápida a PDF sin añadir dependencias de backend o pesadas librerías de renderizado se puede lograr elegantemente combinando `window.print()` nativo con un bloque `<style media="print">` localizado. De esta manera, el navegador hace todo el trabajo pesado garantizando el renderizado exacto de fuentes y colores. Además, diseñar el documento impreso como un recibo formal o resumen de deudas de un vehículo estructurado (con firmas y disclaimers legales) añade un inmenso valor profesional para los operadores del taller.
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
