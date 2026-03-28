# 📱 Arquitectura de UI: Desktop vs Mobile

## Principio Fundamental

**Desktop = Administración compleja | Mobile = Acciones rápidas**

El sistema tiene dos modalidades de interfaz distintas, cada una optimizada para su contexto de uso.

---

## Desktop (Escritorio)

### Contexto de Uso
- **Ubicación**: Mostrador, oficina, área administrativa
- **Dispositivo**: PC/Laptop con pantalla grande
- **Sesión**: Prolongada (turno completo)
- **Interacción**: Teclado + mouse, multitarea

### Características
| Aspecto | Implementación |
|---------|----------------|
| **Layout** | Sidebar + Main Content, múltiples columnas |
| **Navegación** | Menú persistente, breadcrumbs |
| **Formularios** | Completos, todos los campos visibles |
| **Tablas** | Datos densos, filtros avanzados, exportación |
| **Acciones** | Botones visibles, tooltips, atajos de teclado |
| **Feedback** | Notificaciones, modales, confirmaciones |

### Pantallas Desktop

#### Fase 1 - Stock & Ventas
```
/adm                    → Dashboard resumen día
├── /products           → CRUD completo productos
├── /categories         → CRUD categorías
├── /inventory          → Stock, alertas, ajustes
├── /sales/quick        → Venta rápida (mostrador)
├── /invoices           → Historial facturas, libro IVA
├── /cash-register      → Apertura/cierre caja
└── /reports            → Ventas, stock, simples
```

#### Fase 2 - Taller (Desktop)
```
/adm/workshop
├── /customers          → Fichas clientes completas
├── /quotes             → Presupuestos con preview
├── /work-orders        → Kanban + lista detallada
├── /schedule           → Calendario semanal grande
└── /technicians        → Asignación, carga trabajo
```

---

## Mobile (Móvil / PWA)

### Contexto de Uso
- **Ubicación**: Área de taller, moviéndose, sin escritorio
- **Dispositivo**: Smartphone personal del staff
- **Sesión**: Intermitente (check rápidos entre trabajos)
- **Interacción**: Touch, una mano, voz/chat

### Características
| Aspecto | Implementación |
|---------|----------------|
| **Layout** | Single column, scroll vertical, bottom nav |
| **Navegación** | Tabs inferiores, swipe entre vistas |
| **Formularios** | Paso a paso, campos esenciales |
| **Acciones** | Botones grandes, gestos (swipe, pull-to-refresh) |
| **Input** | Voice-to-text优先, cámara para fotos |
| **Feedback** | Haptics, toast simples, notificaciones push |
| **Offline** | Cache local, sincronización cuando hay wifi |

### Acceso Mobile

```
/m            → App Mobile (PWA instalable)
├── /login    → Auth simplificado
├── /tasks    → Mis tareas/OTs asignadas
├── /scan     → Escanear QR de OT
├── /chat     → RPM Bot (interfaz principal)
└── /quick    → Acciones rápidas (checklist, fotos)
```

---

## Matriz de Vistas por Rol y Dispositivo

| Rol | Desktop | Mobile | Vistas Principales |
|-----|---------|--------|-------------------|
| **ADMIN** | ✅ Full | ✅ Supervisión | Todo (desktop), Dashboard mobile |
| **SELLER** | ✅ Full | ✅ Consulta | Ventas, productos, clientes |
| **TECHNICIAN** | ⚠️ Solo lectura | ✅ **Principal** | Mis OTs, checklists, fotos, chatbot |

> **Nota**: Los técnicos usarán principalmente **Mobile + RPM Bot**

---

## Componentes Mobile Específicos

### 1. Bottom Navigation (Fixed)
```typescript
// m/layout.tsx
<BottomNav>
  <NavItem icon="task" label="Mis Tareas" href="/m/tasks" />
  <NavItem icon="scan" label="Escanear" href="/m/scan" />
  <NavItem icon="bot" label="RPM Bot" href="/m/chat" primary />
  <NavItem icon="flash" label="Rápido" href="/m/quick" />
</BottomNav>
```

### 2. Tarjeta OT Compacta
```typescript
// Componente para lista de OTs en mobile
<WorkOrderCard>
  <Header>
    <Badge color="status">En Progreso</Badge>
    <Text strong>#OT-1245</Text>
  </Header>
  <Body>
    <VehicleInfo plate="AB123CD" model="Toyota Hilux" />
    <ServiceTag>Instalación LED</ServiceTag>
  </Body>
  <Actions>
    <ActionButton>Ver Detalle</ActionButton>
    <ActionButton primary>Completar Checklist</ActionButton>
  </Actions>
</WorkOrderCard>
```

### 3. Botón Flotante Principal (FAB)
```typescript
// Acceso rápido al bot o acciones comunes
<FloatingActionButton>
  <MenuItem icon="camera" label="Foto OT" />
  <MenuItem icon="check" label="Checklist" />
  <MenuItem icon="message" label="RPM Bot" />
</FloatingActionButton>
```

---

## PWA (Progressive Web App)

### Configuración
```typescript
// app/m/layout.tsx - viewport PWA
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a1a',
}

// manifest.json
{
  "name": "RPM Accesorios",
  "short_name": "RPM",
  "start_url": "/m",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

### Capacidades Nativas
- ✅ Notificaciones push (nueva OT asignada)
- ✅ Acceso cámara (fotos de trabajos)
- ✅ Instalación homescreen
- ✅ Offline cache (ver OTs sin conexión)
- ✅ Voz (speech-to-text para bot)

---

## Flujo Típico: Técnico en Taller

### Escenario: Juan, técnico, usando mobile

```
1. Juan abre app en su teléfono (notificación push: "Nueva OT asignada")
   ↓
2. Ve resumen en /m/tasks → "Toyota Hilux - Instalación LED"
   ↓
3. Toca "RPM Bot" (bottom nav, centro)
   ↓
4. Bot: "¡Hola Juan! Tienes 2 OTs pendientes. ¿Qué necesitas?"
   ↓
5. Juan (voice): "Dame la primera"
   ↓
6. Bot: "OT #1245 - Hilux AB123CD - Instalación barra LED"
        "¿Querés completar el checklist o subir fotos?"
   ↓
7. Juan: "Checklist ingreso"
   ↓
8. Bot muestra checklist paso a paso → Juan marca items
   ↓
9. Juan: "Listo, empezar trabajo"
   ↓
10. Bot: "¿Confirmás cambio de estado a 'En Progreso'?"
    Juan: "Sí" → Estado actualizado
```

---

## Comparativa de Implementación

| Aspecto | Desktop | Mobile |
|---------|---------|--------|
| **Framework UI** | shadcn/ui, tables completas | Componentes touch-optimized |
| **Forms** | react-hook-form, validación completa | Formularios paso a paso |
| **Navegación** | Next.js Link, sidebar | Tabs, swipe gestures |
| **Estado** | Zustand complejo | React Query, cache local |
| **API** | REST completo | REST + WebSocket (tiempo real) |

---

## Vinculación con Otras Specs

- `/specs/bot.md` - Interfaz principal mobile
- `/specs/workshop.md` - OTs accesibles desde mobile
- `/specs/core.md` - Configuración PWA

---

**Estado**: ✅ Definido  
**Última actualización**: 2026-03-28
