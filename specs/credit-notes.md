# Especificación: Notas de Crédito

## Resumen
Sistema para gestionar devoluciones de productos y servicios, permitiendo anular total o parcialmente una venta previa. La Nota de Crédito (NC) impacta en tres niveles: stock (opcional), dinero (reembolso o crédito) y fiscal (AFIP).

## Alcance

### Incluido
- Creación de Notas de Crédito asociadas a una factura previa (`invoice`).
- Selección de ítems a devolver (cantidad parcial o total).
- Opción de "Restaurar Stock" por cada ítem devuelto.
- Gestión de dinero:
    - Reembolso en efectivo (genera `cash_movement` tipo `EXPENSE`).
    - Crédito a cuenta corriente (resta de `customer.balance`).
- Integración fiscal: Referencia al comprobante original para AFIP.

### Excluido
- Notas de Crédito no asociadas a una factura (NC "sueltas").
- Reembolsos parciales por métodos de pago automáticos (ej. estorno automático de tarjeta vía API). Todo reembolso se maneja como efectivo o crédito en cuenta.

## Modelo de Datos

### Entidad Invoice (Ampliación)
El modelo `invoice` existente ya soporta el tipo `NOTA_CREDITO`. Se utilizará la misma tabla.

```prisma
model invoice {
  // ... campos existentes ...
  type           String   // "FACTURA_A", "FACTURA_B", "NOTA_CREDITO"
  relatedInvoiceId String? // ID de la factura que anula (para NC)
  // ...
}
```

## Flujos de Usuario

### 1. Crear Nota de Crédito
```
Usuario → /adm/invoices → Selecciona Factura → "Crear Nota de Crédito"

Flujo:
1. El sistema precarga los ítems de la factura original.
2. El usuario selecciona qué ítems se devuelven y en qué cantidad.
3. El usuario marca el checkbox "Restaurar Stock" para los productos físicos que vuelven al estante.
4. El sistema calcula el total de la NC.
5. El usuario elige el destino de los fondos:
   - "Crédito en Cuenta Corriente": Resta del saldo deudor del cliente (disminuye su deuda).
   - "Efectivo / Reembolso Manual": Registra una salida de caja.
6. Confirmar → Envío a AFIP (asociando factura original) → Emisión de NC.
```

## Reglas de Negocio

### 1. Stock
- Si el ítem es un `PRODUCTO` y se marca "Restaurar Stock":
    - Se incrementa `product.stock`.
    - Se crea `stock_movement` tipo `IN` con motivo `DEVOLUCION` y referencia a la NC.

### 2. Dinero y Cuenta Corriente
- **Caso A (Cuenta Corriente)**:
    - Se resta el total de la NC de `customer.balance`.
    - Esto reduce la deuda del cliente o puede generar un saldo a favor.
- **Caso B (Reembolso)**:
    - Se genera un `cash_movement` de tipo `EXPENSE`.
    - El motivo debe indicar "Reembolso NC #XXXX".

### 3. AFIP (ARCA)
- La NC debe incluir los `CbtesAsoc` (Comprobantes Asociados).
- Debe emitirse con el mismo punto de venta que la factura original (usualmente).
- Los montos e IVA deben ser consistentes con la factura original.

## Interfaz de Usuario (Mockup Conceptual)

```
┌─────────────────────────────────────────────────────┐
│ Crear Nota de Crédito (Ref: Factura B 0001-00001234)│
├─────────────────────────────────────────────────────┤
│ Ítems a devolver:                                   │
│ [x] Filtro de Aceite  Cant: [ 1 ] / 2   [x] Stock   │
│ [ ] Servicio Cambio   Cant: [ 0 ] / 1               │
│ ─────────────────────────────────────────           │
│ Total NC:                          $12,500          │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Destino de fondos:                                  │
│ ( ) Reembolso en Efectivo (Caja)                    │
│ (●) Crédito a Cuenta Corriente                      │
│                                                     │
│ [Cancelar]          [Emitir Nota de Crédito]        │
└─────────────────────────────────────────────────────┘
```

## Criterios de Aceptación
- [ ] Botón "Nota de Crédito" visible en detalle de facturas emitidas.
- [ ] La NC incrementa el stock si se selecciona la opción.
- [ ] El saldo del cliente se actualiza correctamente si se elige cuenta corriente.
- [ ] Se genera un movimiento de egreso si se elige reembolso.
- [ ] La NC queda vinculada a la factura original en la base de datos.
