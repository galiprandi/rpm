🚦 Estado: 🔴 No iniciado (0%)

# Conteo Cíclico Inteligente y Ajuste de Stock

## 1. Propósito de la Feature
Permitir al administrador iniciar auditorías de stock parciales basadas en datos de criticidad y movimiento, delegar el conteo físico a un operario mediante un acceso móvil ciego (sin revelar las existencias teóricas), y consolidar las diferencias mediante una pantalla de aprobación antes de impactar el inventario real.

## 2. Casos de Uso y Flujos de Trabajo

### Caso de Uso 1: Creación del Conteo (Vista Administrador)
- **Algoritmo de Criticidad**: El sistema selecciona **X** artículos basándose en un "Puntaje de Riesgo":
  - **Nunca contado**: +100 puntos.
  - **Stock = 1**: +50 puntos (alta propensión a error).
  - **Sin ubicación**: +30 puntos.
  - **Alta rotación (> 10 ventas en últimos 60 días)**: +40 puntos.
  - **Antigüedad**: +1 punto por cada día desde el último conteo.
- **Flujo**:
  1. El Administrador define la cantidad máxima de artículos (X).
  2. El sistema propone la lista basada en el algoritmo.
  3. El Administrador puede remover artículos.
  4. El sistema genera un operativo en estado **"Pendiente de Ejecución"**.

### Caso de Uso 2: Acceso Móvil (QR)
- El sistema genera un QR con una URL única vinculada al ID del operativo.
- Se muestra en pantalla para ser escaneado por el operario.

### Caso de Uso 3: Ejecución del Conteo Ciego (Vista Móvil)
- **Requisito**: Usuario autenticado con rol distinto a "USER".
- **Regla de Oro**: No se muestra el stock teórico.
- **Acciones**:
  - **Marcar como "Encontrado"**: Ingresar cantidad (>= 1). Posibilidad de editar ubicación.
  - **Marcar como "No Encontrado"**: Registra cantidad como 0.
- **UI**: Optimizada para uso con una sola mano, simple e intuitiva.

### Caso de Uso 4: Revisión y Aprobación (Vista Administrador)
- **Gestión de Concurrencia**: Si hubo ventas o ajustes posteriores a la creación del conteo, el sistema:
  - Muestra una alerta con la cantidad contada vs. vendida.
  - Sugiere automáticamente un nuevo valor de ajuste restando las ventas del conteo físico.
- **Micro-ajustes**: El administrador puede editar cantidad y ubicación final antes de confirmar.
- **Impacto**: Actualiza stock real, ubicación del producto y genera registro en `stock_movement`.

## 3. Consideraciones Técnicas
- **Tablas BD**: `inventory_count_operative`, `inventory_count_item`, y extensión de `product` con `lastCountedAt`.
- **Servicios**: `inventoryCountService.ts` para lógica de selección y consolidación.
- **Seguridad**: Validación de roles y sesión en la vista móvil.

## 4. Relaciones con otras Specs
- [Gestión de Productos e Inventario](./products-and-inventory.md): Extiende el control de stock con auditorías periódicas.
- [Ventas y Facturación](./sales-and-billing.md): Las ventas afectan el cálculo de consolidación del conteo si ocurren durante el proceso.
