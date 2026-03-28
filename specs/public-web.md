# 🌐 FASE 3: Web Pública & Canal Digital

## Objetivo
Presencia online para captación de clientes: información, consultas y reserva de turnos.

## Dependencia
**REQUIERE FASE 1 y 2 completadas y estables**

---

## Módulos Incluidos

### 1. Web Pública Informativa

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Home** | P0 | Presentación, servicios destacados |
| **Servicios** | P0 | Catálogo con descripciones |
| **Productos destacados** | P1 | Algunos items con precios (opcional) |
| **Galería trabajos** | P1 | Fotos antes/después (con permiso) |
| **Contacto** | P0 | Formulario, WhatsApp, mapa |
| **FAQ** | P2 | Preguntas frecuentes |

**No incluye**: E-commerce con checkout (modelo consulta en local)

### 2. Consulta por Patente

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Formulario patente** | P0 | Cliente ingresa patente |
| **Historial resumido** | P0 | Últimos trabajos realizados |
| **Descarga facturas** | P1 | PDF de comprobantes |
| **Próximos mantenimientos** | P2 | Recomendaciones |

### 3. Turnero Online

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Calendario disponible** | P0 | Días y horarios libres |
| **Selección servicio** | P0 | Qué trabajo necesita |
| **Registro datos** | P0 | Nombre, teléfono, patente |
| **Confirmación** | P0 | Reserva con código |
| **Notificación** | P1 | Email/WhatsApp confirmación |
| **Cancelación** | P1 | Cancelar/modificar turno |

#### Lógica de Turnos:

```typescript
interface OnlineAppointment {
  id: string;
  requestedDate: Date;        // Día solicitado
  requestedTime: TimeSlot;    // Mañana/Tarde/Horario específico
  
  // Datos cliente (si no existe, se crea)
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Vehículo (si no existe, se crea)
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  
  // Servicio solicitado
  serviceType: string;        // O "consulta general"
  notes: string;              // Detalles adicionales
  
  // Estado
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';
  
  // Vinculación interna
  workOrderId?: string;       // OT generada al confirmar
  
  createdAt: Date;
  confirmedAt?: Date;
}
```

### 4. Chat/WhatsApp Integrado

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Botón flotante WhatsApp** | P0 | Link directo con mensaje predefinido |
| **Respuestas automáticas** | P2 | FAQ automatizado |
| **Ticket consulta** | P2 | Formulario integrado a sistema |

### 5. Panel Admin Web

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Gestión turnos web** | P0 | Aprobar/rechazar/modificar |
| **Publicar galería** | P1 | Subir fotos de trabajos |
| **Configurar servicios** | P1 | Qué mostrar y precios |
| **Estadísticas web** | P2 | Visitas, conversiones |

---

## Flujos de Usuario

### Flujo 1: Reserva de Turno Online

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Usuario      │──▶│Selecciona   │──▶│Elige día y  │──▶│Completa     │
│entra a web  │   │servicio     │   │horario      │   │datos        │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                             │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│Recibe       │◄──│Confirmación │◄──│Admin        │◄────────┘
│notificación │   │por mail/WA  │   │aprueba      │
└─────────────┘   └─────────────┘   └─────────────┘
```

### Flujo 2: Consulta Historial

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Ingresa      │──▶│Sistema      │──▶│Muestra      │
│patente      │   │busca        │   │últimos      │
└─────────────┘   └─────────────┘   │trabajos     │
                                    └─────────────┘
```

---

## API Endpoints Fase 3

### Web Pública (Públicos)
| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/public/services` | GET | Listar servicios | Público |
| `/api/public/gallery` | GET | Galería de trabajos | Público |
| `/api/public/contact` | POST | Formulario de contacto | Público |

### Consulta por Patente
| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/public/vehicle/:plate` | GET | Consultar historial | Público |
| `/api/public/vehicle/:plate/invoices` | GET | Descargar facturas | Público (email verification) |

### Turnos Online
| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/public/appointments` | POST | Solicitar turno | Público |
| `/api/public/appointments/available` | GET | Horarios disponibles | Público |
| `/api/public/appointments/:id/cancel` | POST | Cancelar turno | Público (código) |

### Panel Admin Web
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/web-admin/appointments` | GET | Listar turnos web | ADMIN |
| `/api/web-admin/appointments/:id/confirm` | POST | Confirmar turno | ADMIN |
| `/api/web-admin/appointments/:id/reject` | POST | Rechazar turno | ADMIN |
| `/api/web-admin/gallery` | GET | Listar fotos | ADMIN |
| `/api/web-admin/gallery` | POST | Publicar fotos | ADMIN |
| `/api/web-admin/gallery/:id` | DELETE | Quitar de galería | ADMIN |
| `/api/web-admin/stats` | GET | Estadísticas web | ADMIN |

---

## Modelo de Datos FASE 3

```
┌─────────────────┐       ┌─────────────────┐
│  WEB_APPOINTMENT│       │  PUBLIC_GALLERY │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ status          │       │ workOrderId     │◄────┐
│ customerName    │       │ beforePhotoUrl  │     │
│ customerPhone   │       │ afterPhotoUrl   │     │
│ customerEmail   │       │ description     │     │
│ vehiclePlate    │       │ isPublic        │     │
│ vehicleBrand    │       │ createdAt       │     │
│ vehicleModel    │       └─────────────────┘     │
│ serviceType     │                                 │
│ notes           │       ┌─────────────────┐     │
│ requestedDate   │       │   WORK_ORDER    │     │
│ requestedTime   │       ├─────────────────┤     │
│ status          │◄──────┤ id              │─────┘
│ workOrderId     │◄────┤                 │
│ createdAt         │       └─────────────────┘
└─────────────────┘
```

---

## Criterios de Éxito FASE 3

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Visitas web/mes** | > 500 | Google Analytics |
| **Turnos solicitados** | > 30/mes | Formularios completados |
| **Conversión turnos** | > 50% | Confirmados / Solicitados |
| **Consultas WhatsApp** | Trazables | Uso del link con parámetros |
| **Nuevos clientes vía web** | > 20% | Clientes nuevos / Total |
