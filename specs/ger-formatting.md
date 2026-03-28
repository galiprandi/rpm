# Formato de Presentación de Información

Guía de estilo para mostrar información al usuario de manera consistente y escaneable.

---

## Principios Universales

1. **Título primero**: Siempre empezar con un encabezado claro
2. **Enumeración**: Usar números para listas ordenadas, bullets para desordenadas
3. **Emojis indicadores**: ✅ ❌ ⚠️ ⏳ para estados visuales
4. **IDs resaltados**: Códigos (#1234), patentes (AB123CD) en formato destacado
5. **Acciones al final**: Botones o sugerencias de próximo paso al pie

---

## Formatos por Tipo de Información

### 📋 Lista de OTs

```
# OTs asignadas a ti:

1. **#1234**: Hilux (AB123CD) - Cambio de filtros y aceite
2. **#1235**: Ranger (AC567EF) - Instalación barra LED
3. **#1236**: Amarok (AD890GH) - Polarizado completo

¿Por cuál arrancamos? [1] [2] [3]
```

**Reglas:**
- Siempre incluir: Número OT + Vehículo + Patente + Servicio resumido
- Si hay >5 OTs: mostrar solo las primeras 3 + "...y 2 más"
- Indicar estado con emoji: ⏳ Pendiente | 🔧 En Progreso | ✅ Lista

---

### 📋 Detalle de una OT

```
# OT #1234 - Toyota Hilux

**Patente**: AB123CD  
**Servicio**: Cambio filtros + aceite + revisión general  
**Estado**: 🔧 En Progreso  
**Cliente**: Juan Pérez

**Checklist de ingreso**:
☑️ Llaves recibidas
☑️ Estado óptico documentado
⬜ Odómetro (falta)
☑️ Accesorios guardados

[Completar checklist] [Ver fotos] [Cambiar estado]
```

**Reglas:**
- Header: # OT + Vehículo siempre visible
- Datos en líneas separadas, no en párrafos
- Checklist: usar checkboxes visuales ☑️ ⬜
- Siempre ofrecer próxima acción relevante

---

### 📦 Consulta de Stock

```
# Stock Polarizados 3M

✅ **3M CS35** (35% oscuridad) - 12 rollos disponibles
✅ **3M CS20** (20% oscuridad) - 8 rollos disponibles
⚠️ **3M CS05** (5% oscuridad) - 2 rollos (mínimo: 5) - Reponer
❌ **3M CS50** (50% oscuridad) - Sin stock

¿Armamos un presupuesto? [Sí] [Ver alternativas]
```

**Reglas:**
- Siempre categoría/tipo como título
- Stock disponible: ✅ + cantidad exacta
- Stock bajo: ⚠️ + indicar mínimo
- Sin stock: ❌ claro, no ambiguo
- Ofrecer acción comercial después

---

### 💰 Presupuesto / Quote

```
# Presupuesto para Juan Pérez - Hilux

**Items**:
• Polarizado 3M CS20 - $45.000
• Tratamiento cerámico - $35.000
• Mano de obra - $15.000

**Totales**:
Subtotal: $95.000
IVA (21%): $19.950
**Total: $114.950**

¿Guardamos el presupuesto? [Guardar #P-458] [Agregar item] [Modificar]
```

**Reglas:**
- Mostrar cliente + vehículo en título
- Items con bullets, precios alineados
- Total en **negrita** y destacado
- Siempre confirmar antes de guardar

---

### 📊 Resumen / Dashboard

```
# Resumen del día - Viernes 28/03

📋 **OTs**: 12 totales | 5 en progreso | 3 listas | 4 entregadas
💰 **Ventas**: $485.000 (8 facturas)
⚠️ **Alertas**: 3 productos bajo stock

[Ver OTs] [Ver ventas] [Ver alertas]
```

**Reglas:**
- Fecha clara en título
- Métricas clave en una línea cada una
- Usar emojis categoría: 📋 💰 ⚠️ 📈
- Botones para profundizar en cada área

---

### 🚗 Información de Vehículo

```
# Toyota Hilux - AB123CD

**Dueño**: Juan Pérez
**Última visita**: 15/03/2026 (cambio de aceite)
**Historial**:
• 15/03/2026 - Service completo - $85.000
• 02/01/2026 - Polarizado - $45.000
• 10/10/2025 - Instalación LED - $125.000

¿Ver última OT? [Ver #1234] [Crear presupuesto]
```

**Reglas:**
- Patente destacada en título
- Última visita siempre visible
- Historial cronológico descendente
- Máximo 5 items de historial

---

### ⚠️ Errores / No encontrado

```
No encontré la OT #9999. 

¿Querés:
• Ver tus OTs asignadas
• Buscar por patente
• Ver OTs completadas
```

**Reglas:**
- Nunca dejar en blanco
- Siempre ofrecer alternativas concretas
- Tono ayudante, no culposo
- Máximo 3 opciones de fallback

---

### ✅ Confirmación Requerida

```
¿Confirmás pasar la OT #1234 a "Lista para entrega"?

Esto notificará al cliente que puede retirar el vehículo.

[Confirmar] [Cancelar] [Ver detalle primero]
```

**Reglas:**
- Acción específica en pregunta
- Consecuencia breve explicada
- Botones claros: Confirmar / Cancelar
- Opción de "ver antes" cuando aplica

---

## Checklist de Calidad

Antes de enviar cualquier respuesta, verificar:

- [ ] ¿Tiene título claro?
- [ ] ¿Los datos importantes son escaneables (no pared de texto)?
- [ ] ¿Usa emojis apropiadamente?
- [ ] ¿IDs y códigos están destacados?
- [ ] ¿Ofrece próximo paso o acción?
- [ ] ¿Se puede leer en 5 segundos o menos?

---

## Ejemplos Completos por Contexto

### Contexto: Técnico pide "mis tareas"

```
# Tenés 3 OTs para hoy:

1. 🔧 **#1245**: Hilux (AB123CD) - Instalación LED (empezaste ayer)
2. ⏳ **#1246**: Ranger (AC456EF) - Polarizado - 10:00 hs
3. ⏳ **#1247**: Amarok (AD789GH) - Tratamiento - 14:00 hs

¿Por cuál arrancamos? [Ver #1245] [Ver #1246] [Ver #1247]
```

### Contexto: Vendedor pregunta "tenemos polarizados?"

```
# Stock Polarizados

✅ **3M CS35** - 12 rollos
✅ **3M CS20** - 8 rollos  
⚠️ **3M CS05** - 2 rollos (mín: 5)

¿Armamos presupuesto? [Sí] [Ver otras marcas]
```

### Contexto: Admin pide "resumen del día"

```
# Resumen Miércoles 26/03

📋 OTs: 8 | 💰 Ventas: $285.000 | ⚠️ 2 bajo stock

**OTs destacadas**:
• #1245 Lista - Hilux - Retirar
• #1246 En progreso - Ranger - Juan (técnico)

[Ver todas] [Ver ventas] [Ver alertas]
```
