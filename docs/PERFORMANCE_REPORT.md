# Informe de Análisis de Performance e Inestabilidad

## Problemas Detectados

1.  **Carga Monolítica del Dashboard**: Actualmente, el dashboard (`app/adm/page.tsx`) solicita toda la información (ventas, OTs, stock, movimientos) en una única llamada al servidor. Si una consulta a la base de datos es lenta, el usuario percibe que el sistema "se traba" hasta que todo finaliza.
2.  **Falta de Resiliencia en el Cliente**: Las pantallas de OTs y Ventas usan `useEffect` con `fetch` estándar. Ante micro-cortes de Wi-Fi, estas peticiones fallan y obligan al usuario a refrescar manualmente la página, perdiendo el estado actual si no se guardó.
3.  **Deuda Técnica en Lógica de OTs**: La lógica de creación y actualización de OTs está "enterrada" en las rutas de la API, lo que dificulta optimizar las consultas Prisma de manera global y reutilizar lógica eficiente.
4.  **Cálculo Pesado en Búsqueda de Productos**: La API de búsqueda calcula precios para *todas* las listas de precios activas por cada producto encontrado. A medida que escalen los productos y listas, esto se volverá un cuello de botella crítico.
5.  **Invalidación de Cache Incompleta**: Las acciones sobre OTs no disparan la invalidación del cache del dashboard (`revalidateTag`), forzando al usuario a refrescar para ver los cambios reflejados.

## Sugerencias de Mejora

1.  **Implementar TanStack Query**: Introducir esta librería para manejar las peticiones desde el cliente. Esto permitirá:
    -   **Reintentos automáticos** ante fallos de conexión.
    -   **Cache en el cliente**, mostrando datos previos mientras se cargan los nuevos.
    -   **Sincronización en segundo plano**, mejorando la percepción de fluidez.
2.  **Descomponer el Dashboard (Lazy Loading)**: Transformar las tarjetas del dashboard en componentes que carguen su propia información de forma independiente. Así, el usuario ve la estructura de la página de inmediato y los datos aparecen a medida que llegan.
3.  **Centralizar WorkOrderService**: Mover toda la lógica a un servicio dedicado. Optimizar las consultas `findMany` para traer solo los campos necesarios (por ejemplo, evitar traer todos los items y fotos en el listado Kanban).
4.  **Optimizar el Cálculo de Precios**: Modificar la API de búsqueda para que el cálculo de precios sea más eficiente o se realice bajo demanda (lazy) según la lista seleccionada.
5.  **Invalidación Reactiva**: Asegurar que cada mutación (Crear OT, Pagar, Cambiar Estado) llame a `invalidateDashboard()` para mantener los datos siempre frescos.
6.  **Migración a Componentes de Servidor Estratégicos**: Usar `Suspense` de React para manejar estados de carga de forma granular.

---

*Preparado por Jules - Ingeniero de Software*
