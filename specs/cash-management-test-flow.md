# Flujo de Prueba Orgánico - Arqueo de Caja

## Preparación
1. Ir a `http://localhost:3000/adm`
2. Iniciar sesión con usuario ADMIN
3. Verificar que el menú lateral muestra "Arqueo de Caja"

---

## Escenario 1: Apertura de Caja (Día 1)

### Paso 1: Acceder a la vista
- Click en "Arqueo de Caja" en el sidebar
- **Esperado:** Vista carga con estado "Caja Cerrada"

### Paso 2: Abrir caja
- Click en botón verde "Abrir Caja"
- Modal se abre con input "Monto Inicial Efectivo"
- Como es primera vez, sugiere $0
- Ingresar: `$10,000`
- Click "Abrir Caja"
- **Esperado:** 
  - Modal cierra
  - Status cambia a "Caja Abierta"
  - Card "Apertura Efectivo" muestra `$10,000.00`
  - Botón "Abrir Caja" desaparece
  - Aparecen botones "Registrar Egreso" y "Cerrar Caja"

### Paso 3: Verificar desglose
- En la tabla "Desglose por Método de Pago"
- **Esperado:** Solo método CASH con `$10,000` en apertura

---

## Escenario 2: Registrar Egresos

### Paso 4: Registrar gasto de proveedor
- Click en "Registrar Egreso"
- Modal se abre
- Completar:
  - Monto: `500`
  - Método: `CASH` (efectivo)
  - Motivo: `Pago proveedor - Café y snacks`
  - Notas: `Compra semanal`
- Click "Registrar Egreso"
- **Esperado:**
  - Modal cierra
  - Card "Egresos" actualiza a `$500.00`
  - Card "Esperado Efectivo" muestra `$9,500.00`
  - Tabla actualiza: CASH → Egresos: `$500.00`, Esperado: `$9,500.00`

### Paso 5: Verificar estado via API (opcional)
```bash
curl http://localhost:3000/api/cash/status \
  -H "Cookie: tu_session_cookie"
```
- **Esperado:** `status: "OPEN"`, `summary.CASH.expense: 500`

---

## Escenario 3: Cierre con Diferencias (Simular faltante)

### Paso 6: Iniciar cierre
- Click en "Cerrar Caja" (botón rojo)
- Modal de arqueo se abre
- **Esperado:** Tabla muestra:
  - Método: CASH
  - Esperado: `$9,500.00`
  - Contado: input vacío
  - Diferencia: `-` o `$0`

### Paso 7: Simular error de conteo (faltante)
- En input "Contado" para CASH, ingresar: `9400` (en vez de 9500)
- **Esperado en tiempo real:**
  - Diferencia muestra `-$100.00` en rojo
  - Aparece sección "Se detectaron diferencias"
  - Input obligatorio "Explicación de las diferencias"

### Paso 8: Documentar diferencia
- Ingresar en textarea: `Error de conteo, faltan $100`
- Click "Cerrar Caja"
- **Esperado:**
  - Cierre exitoso con warning
  - Status cambia a "Caja Cerrada"
  - Al reabrir modal de "Abrir Caja", sugiere `$9,400` (monto de cierre anterior)

---

## Escenario 4: Apertura con sugerencia (Día 2)

### Paso 9: Nueva apertura
- Click "Abrir Caja"
- **Esperado:** Input pre-llenado con `$9,400` (cierre anterior)
- Modificar a: `$10,000`
- Click "Abrir Caja"
- **Esperado:** Nueva sesión abierta

---

## Escenario 5: Cierre Exacto (Sin diferencias)

### Paso 10: Registrar venta simulada (vía expense negativo o esperar venta real)
- Alternativa: Ir a dashboard, crear una venta rápida que genere ingreso en CASH
- O registrar un egreso pequeño para simular

### Paso 11: Cerrar exacto
- Click "Cerrar Caja"
- Ingresar en "Contado" el monto exacto del "Esperado"
- **Esperado:** Diferencia muestra ✅ `$0` en verde
- Click "Cerrar Caja"
- **Esperado:** Mensaje de éxito "Caja cerrada correctamente sin diferencias"

---

## Escenario 6: Validaciones de Error

### Paso 12: Intentar abrir caja ya abierta
- Con caja abierta, intentar llamar API directamente:
```bash
curl -X POST http://localhost:3000/api/cash/open \
  -H "Content-Type: application/json" \
  -H "Cookie: tu_session" \
  -d '{"amount": 5000}'
```
- **Esperado:** `{"error": "Cash register is already open today"}`

### Paso 13: Intentar registrar egreso sin caja abierta
- Primero cerrar caja si está abierta
- Luego intentar:
```bash
curl -X POST http://localhost:3000/api/cash/expense \
  -H "Content-Type: application/json" \
  -H "Cookie: tu_session" \
  -d '{"amount": 100, "method": "CASH", "reason": "Test"}'
```
- **Esperado:** `{"error": "Cash register is not open"}`

### Paso 14: Intentar cerrar sin explicar diferencias
- Abrir caja, registrar movimiento
- Iniciar cierre con diferencia
- Intentar cerrar sin completar textarea
- **Esperado:** Error "Debe ingresar una explicación..."

---

## Escenario 7: Verificar Auditoría

### Paso 15: Verificar movimientos en DB (opcional)
```bash
# Conectar a DB y verificar:
SELECT type, amount, method, reason, created_at 
FROM cash_movement 
ORDER BY created_at DESC 
LIMIT 10;
```
- **Esperado:** 
  - Registro OPENING
  - Registros EXPENSE  
  - Registro CLOSING con notas sobre diferencias
  - Registros ADJUSTMENT si hubo diferencias

---

## Checklist Final

- [ ] Sidebar muestra "Arqueo de Caja" con icono Wallet
- [ ] Status se actualiza en tiempo real
- [ ] Sugerencia de apertura funciona (usa cierre anterior)
- [ ] Egresos se registran y afectan el esperado
- [ ] Cierre calcula diferencias en tiempo real
- [ ] Diferencias requieren explicación obligatoria
- [ ] Ajustes se crean automáticamente por diferencias
- [ ] Validaciones de seguridad funcionan (sin caja abierta no hay operaciones)
- [ ] Solo ADMIN/STAFF pueden operar (probar con USER normal si existe)
