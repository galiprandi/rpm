# 🔧 FASE 2: Gestión de Taller

## Objetivo
Digitalizar la operación del taller: órdenes de trabajo, presupuestos, instalaciones y control de calidad.

## Dependencia
**REQUIERE FASE 1 completada y estable**

---

## Módulos Incluidos

### 1. Gestión de Clientes

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha cliente** | P0 | Datos de contacto, documento, múltiples vehículos |
| **Historial** | P0 | Todas las OTs por cliente |
| **Búsqueda rápida** | P0 | Por nombre, teléfono o patente |

#### Campos Cliente:
```typescript
interface Customer {
  id: string;
  name: string;              // Nombre o Razón Social
  phone: string;             // Principal
  phoneAlt?: string;         // Alternativo (WhatsApp)
  email?: string;
  address?: string;
  notes?: string;            // Observaciones
  
  // Datos de facturación (opcional - solo si factura)
  billingData?: {
    cuit: string;            // CUIT para facturación AFIP
    invoiceType: 'A' | 'B' | 'C' | 'M';  // Tipo de factura
  };
  
  vehicles: Vehicle[];
  createdAt: Date;
}
```

**Persona Física vs Jurídica:**
- **Sin diferenciar en UI**: Mismo formulario, mismas acciones
- **Diferencia implícita**: Solo en los datos que complete
  - PF: Completa nombre personal, puede dejar CUIT vacío o usar DNI como CUIT
  - PJ: Completa "Razón Social" en `name`, CUIT de la empresa obligatorio para facturar

### 2. Gestión de Vehículos / Activos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha activo** | P0 | Datos por identificador (patente o n° serie) |
| **Categorización flexible** | P0 | Vehículos, trailers, equipos de audio, otros |
| **Historial vinculado** | P0 | Todas las intervenciones por activo |
| **Fotos** | P1 | Antes/después de cada OT |

#### Modelo Vehicle (Activo Genérico):

El modelo `Vehicle` soporta tanto vehículos como equipos genéricos (trailers, audio, etc.):

```typescript
// Categorías disponibles
enum VehicleCategory {
  CAR = 'CAR',                  // Auto/Camioneta
  TRUCK = 'TRUCK',              // Camión
  SUV = 'SUV',                  // SUV/4x4
  PICKUP = 'PICKUP',            // Pickup
  MOTORCYCLE = 'MOTORCYCLE',    // Moto
  TRAILER = 'TRAILER',          // Trailer/Acoplado
  AUDIO_EQUIPMENT = 'AUDIO_EQUIPMENT',  // Equipos de audio
  ELECTRIC_SCOOTER = 'ELECTRIC_SCOOTER', // Monopatín eléctrico
  OTHER = 'OTHER',              // Otro equipo
}

interface Vehicle {
  id: string;
  identifier: string;          // Patente (vehículos) o N° Serie/Código (equipos) - ÚNICO
  
  category: VehicleCategory;   // Determina qué campos mostrar y validar
  
  // Campos para vehículos (opcionales, requeridos si es vehículo)
  brand?: string;              // Toyota, Ford
  model?: string;              // Hilux, Ranger
  year?: number;               // 2024
  color?: string;              // Rojo
  
  // Campos para equipos genéricos (opcionales, usados si no es vehículo)
  equipmentName?: string;      // "Parlante Sony GTK-XB90"
  equipmentType?: string;      // "Equipo de audio", "Monopatín eléctrico"
  description?: string;        // Detalles adicionales del equipo
  
  // Común
  notes?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper para determinar si es vehículo motorizado
const isMotorVehicle = (category: VehicleCategory): boolean => {
  return ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE'].includes(category);
};

// Helper para determinar si tiene odómetro (solo vehículos motorizados)
const hasOdometer = (category: VehicleCategory): boolean => {
  return ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE'].includes(category);
};
```

#### UI Adaptativa por Categoría:

```typescript
// Formulario condicional según categoría
const VehicleForm = ({ category }) => {
  const isVehicle = isMotorVehicle(category);
  const needsPatent = requiresPatent(category);
  
  return (
    <form>
      {/* Siempre visible */}
      <SelectCategory 
        value={category}
        options={[
          { value: 'CAR', label: 'Auto/Camioneta 🚗' },
          { value: 'SUV', label: 'SUV/4x4 🚙' },
          { value: 'PICKUP', label: 'Pickup 🛻' },
          { value: 'TRUCK', label: 'Camión 🚚' },
          { value: 'MOTORCYCLE', label: 'Moto 🏍️' },
          { value: 'TRAILER', label: 'Trailer/Acoplado 🚛' },
          { value: 'AUDIO_EQUIPMENT', label: 'Equipo de Audio 🔊' },
          { value: 'ELECTRIC_SCOOTER', label: 'Monopatín Eléctrico 🛴' },
          { value: 'OTHER', label: 'Otro Equipo 📦' },
        ]}
      />
      
      <Input 
        label={needsPatent ? 'Patente' : 'Código/N° Serie'} 
        placeholder={needsPatent ? 'AB123CD' : 'SN-12345'}
        required
      />
      
      {/* Campos condicionales: solo vehículos */}
      {isVehicle && (
        <>
          <Input label="Marca" placeholder="Toyota" required />
          <Input label="Modelo" placeholder="Hilux" required />
          <Input label="Año" type="number" placeholder="2024" />
          <Input label="Color" placeholder="Blanco" />
        </>
      )}
      
      {/* Campos condicionales: solo equipos */}
      {!isVehicle && (
        <>
          <Input 
            label="Nombre del Equipo" 
            placeholder="Parlante Sony GTK-XB90"
            required 
          />
          <Input 
            label="Tipo de Equipo" 
            placeholder="Equipo de audio portátil"
            required 
          />
          <Textarea 
            label="Descripción" 
            placeholder="Detalles adicionales del equipo..."
            rows={3}
          />
        </>
      )}
      
      <Textarea label="Notas" placeholder="Observaciones..." />
    </form>
  );
};
```

### 3. Servicios (Catálogo de Trabajos)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Definición servicios** | P0 | Lista de trabajos estándar |
| **Costo base** | P0 | Precio referencia |
| **Factor vehículo** | P1 | Ajuste por tipo de vehículo |
| **Tiempo estimado** | P1 | Para agendamiento |
| **Productos incluidos** | P2 | Kits (servicio + insumos) |

Servicios típicos RPM:
```typescript
const defaultServices = [
  { name: 'Instalación barras LED', baseCost: 15000, timeMinutes: 60 },
  { name: 'Instalación faros antiniebla', baseCost: 12000, timeMinutes: 45 },
  { name: 'Aplicación vinilo PPF (capó)', baseCost: 35000, timeMinutes: 120 },
  { name: 'Polarizado luneta', baseCost: 8000, timeMinutes: 30 },
  { name: 'Tratamiento cerámico', baseCost: 45000, timeMinutes: 180 },
  { name: 'Limpieza ópticas', baseCost: 5000, timeMinutes: 20 },
  { name: 'Limpieza motor', baseCost: 8000, timeMinutes: 40 },
];
```

### 4. Presupuestos (Futuro - Post MVP)

> **Nota**: Para el MVP inicial solo implementaremos flujo express (OT directa). Los presupuestos se agregarán en iteración posterior.

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Generar presupuesto** | P2 | Productos + servicios |
| **Vencimiento** | P2 | Válido por N días (default 7) |
| **Aprobación cliente** | P2 | Confirmación explícita |
| **Rechazo/contraoferta** | P3 | Motivo del rechazo |

#### Estados Presupuesto (Futuro):
```
PENDIENTE → APROBADO → OT GENERADA
        ↘ RECHAZADO
        ↘ VENCIDO (auto después de N días)
```

### 5. Órdenes de Trabajo (OT) - MVP

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Creación directa (express)** | P0 | Sin presupuesto previo |
| **Kanban estados** | P0 | Visual del flujo |
| **Asignación técnico** | P0 | Quién hace el trabajo |
| **Checklist ingreso** | P1 | Estado del activo al recibir (odómetro solo vehículos) |
| **Consumo stock** | P0 | Productos usados |
| **Registro fotográfico** | P1 | Antes/después |
| **Checklist calidad** | P1 | Verificación antes entrega |
| **Cierre con pago** | P0 | Total y forma de pago (efectivo/transferencia/QR) |

#### Estados OT (Kanban):
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  CONFIRMADA │──▶│   EN ESPERA │──▶│  EN PROCESO │──▶│  CONTROL QC │
│  (agendada) │   │ (en taller) │   │ (trabajando)│   │ (revisión)  │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                            │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  ENTREGADA  │◄──│   PAGADA    │◄──│    LISTO    │◄──────────┘
│  (cerrada)  │   │ (cierre)    │   │ (para retiro)│
└─────────────┘   └─────────────┘   └─────────────┘
```

#### Campos OT:
```typescript
interface WorkOrder {
  id: string;                    // Número OT (ej: OT-2024-0001)
  status: WorkOrderStatus;
  source: 'IN_PERSON' | 'WEB';   // Origen: Presencial o Web
  customerId: string;
  vehicleId: string;
  technicianId?: string;         // Asignado
  
  // Items
  items: WorkOrderItem[];        // Productos + servicios
  
  // Checklists
  entryChecklist?: Checklist;    // Ingreso (odómetro solo si aplica)
  exitChecklist?: Checklist;     // Control calidad
  
  // Fotos
  entryPhotos: string[];         // URLs fotos ingreso
  exitPhotos: string[];          // URLs fotos egreso
  
  // Tiempos
  scheduledDate?: Date;          // Turno agendado
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  
  // Pago (MVP - sin facturación AFIP aún)
  payment?: {
    total: number;               // Total cobrado
    method: 'CASH' | 'TRANSFER' | 'QR' | 'CARD' | 'OTHER';  // Forma de pago
    notes?: string;              // Referencia transferencia, etc.
  };
  
  // Facturación (futuro - cuando se implemente AFIP)
  invoiceId?: string;            // Factura emitida (opcional)
  
  // Totales
  totalProducts: number;
  totalServices: number;
  total: number;
  
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Checklist de Ingreso (Condicional):

```typescript
// Items base para todos los activos
const baseEntryChecklist = [
  { id: 'keys', label: 'Llaves/Control recibido', required: true },
  { id: 'visual', label: 'Estado visual general documentado', required: true },
  { id: 'accessories', label: 'Accesorios guardados', required: false },
];

// Items solo para vehículos motorizados
const vehicleEntryChecklist = [
  { id: 'odometer', label: 'Odómetro registrado', required: true },
  { id: 'fuel', label: 'Nivel de combustible', required: false },
];

// Generar checklist según categoría
const generateEntryChecklist = (category: VehicleCategory) => {
  const items = [...baseEntryChecklist];
  if (hasOdometer(category)) {
    items.push(...vehicleEntryChecklist);
  }
  return items;
};
```

---

## Flujos de Usuario (MVP - Flujo Express)

### Flujo Principal: Instalación Express (MVP)

**Flujo Presencial - Inicio por Patente:**

```
┌─────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│Cliente      │──▶│ Recepcionista ingresa   │──▶│ Sistema busca patente   │
│llega con    │   │ patente: XYZ789 [Buscar]│   │ en base de datos        │
│vehículo     │   └─────────────────────────┘   └─────────────────────────┘
└─────────────┘                                          │
                                                         ▼
                              ┌────────────────────────────────────────┐
                              │  ✅ VEHÍCULO ENCONTRADO               │
                              │  🚗 Ford Ranger - Negro               │
                              │  Dueño: María González                │
                              │  Tel: +54 11 5555-6666                │
                              │                                      │
                              │  [✓ Confirmar cliente] [Gestionar]    │
                              └────────────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         ┌─────────────────────┐               ┌─────────────────────┐
         │ CONFIRMAR → Paso 2│               │ GESTIONAR → Cambiar │
         │ Servicios/Checklist│              │ dueño del vehículo  │
         └─────────────────────┘               └─────────────────────┘
```

**Si patente NO existe:**

```
┌─────────────────────────────────────────┐
│  ❌ Patente XYZ789 no encontrada        │
│                                         │
│  [+ Crear nuevo vehículo]              │
│                                         │
│  Cliente: [Buscar o crear]             │
│  ├── María González (encontrado)       │
│  └── [+ Nuevo cliente]                 │
│                                         │
│  [Continuar]                           │
└─────────────────────────────────────────┘
```

### Diferencias: Presencial vs Web

| Aspecto | Presencial | Web (futuro) |
|---------|------------|--------------|
| **Vehículo** | Staff crea si no existe | Cliente registra previamente |
| **Inicio flujo** | Buscar patente | Cliente selecciona vehículo propio |
| **Servicio** | Staff selecciona del catálogo | Cliente describe libremente |
| **Estado inicial** | WAITING o IN_PROGRESS | CONFIRMED (turno solicitado) |
| **Checklist** | Staff completa ingreso | Cliente acepta términos online |
| **Origen** | `source: 'IN_PERSON'` | `source: 'WEB'` |

### Flujo Alternativo: Cliente Nuevo + OT Directa

```
┌─────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────┐
│Cliente      │──▶│ Crear nuevo vehículo  │──▶│ Buscar/crear cliente   │──▶│ Crear OT    │
│nuevo        │   │ con patente             │   │ asociado al vehículo   │   │ directa     │
└─────────────┘   └─────────────────────────┘   └─────────────────────────┘   └─────────────┘
```

> **Nota**: El flujo con presupuestos se implementará en iteración posterior (ver sección Presupuestos).

---

### 6. Gestión de Técnicos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha técnico** | P0 | Datos, especialidad |
| **Asignación OTs** | P0 | Quién trabaja qué |
| **Carga de trabajo** | P1 | Visual de ocupación |

### 7. Agenda/Turnos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Vista calendario** | P0 | OTs agendadas por día |
| **Bloques horarios** | P1 | Mañana/tarde configurable |
| **Notificación** | P2 | WhatsApp/SMS recordatorio |

---
### DB de Assets Normalizada (Marcas/Modelos)

Para evitar duplicados y construir una base de conocimiento:

```typescript
// Modelo de Marcas (normalizado)
interface VehicleMake {
  id: string;
  name: string;              // "Toyota", "Ford", "Sony" (capitalizado)
  normalizedName: string;    // "toyota", "ford", "sony" (para búsqueda)
  category: VehicleCategory[]; // [CAR, SUV, PICKUP] o [AUDIO_EQUIPMENT]
  isActive: boolean;
  createdAt: Date;
}

// Modelo de Modelos (normalizado)
interface VehicleModel {
  id: string;
  makeId: string;            // Relación con marca
  name: string;              // "Hilux", "Ranger", "GTK-XB90"
  normalizedName: string;    // "hilux", "ranger", "gtk-xb90"
  years: number[];           // [2020, 2021, 2022, 2023, 2024]
  isActive: boolean;
  createdAt: Date;
}

// Helper para normalizar (trim + lowercase)
const normalizeText = (text: string): string => {
  return text.trim().toLowerCase();
};

// Helper para capitalizar
const capitalizeText = (text: string): string => {
  return text.trim().replace(/\b\w/g, (char) => char.toUpperCase());
};
```

### UI para Selección/Creación de Marca/Modelo (Search-as-you-type):

```typescript
// Componente de búsqueda inteligente con fuentes múltiples
const ModelSearchField = ({ makeId, category, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchModels(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const searchModels = async (term: string) => {
    setLoading(true);
    
    // Backend busca en ambas fuentes
    const response = await fetch(`/api/vehicle-models/search?q=${encodeURIComponent(term)}&makeId=${makeId}`);
    const results = await response.json();
    
    // Results contiene: { local: [...], external: [...] }
    // local = DB propia, external = NHTSA
    setSuggestions([
      ...results.local.map(r => ({ ...r, source: 'local' })),
      ...results.external.map(r => ({ ...r, source: 'nhtsa', id: null })) // NHTSA items sin ID
    ]);
    setLoading(false);
  };
  
  return (
    <div>
      <Input
        label="Modelo"
        placeholder="Escribe para buscar (ej: Hilux, Cronos)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {loading && <Spinner size="sm" />}
      
      {suggestions.length > 0 && (
        <Dropdown>
          {suggestions.map((item) => (
            <DropdownItem
              key={`${item.source}-${item.name}`}
              onClick={() => {
                onSelect({
                  id: item.id,        // null si viene de NHTSA
                  name: item.name,    // "Cronos", "Hilux"
                  year: item.year,    // [2020, 2021, 2022...]
                  source: item.source // 'local' | 'nhtsa'
                });
                setSearchTerm(item.name);
                setSuggestions([]);
              }}
            >
              <div className="flex items-center justify-between">
                <span>{item.name}</span>
                <Badge variant={item.source === 'local' ? 'default' : 'secondary'}>
                  {item.source === 'local' ? 'Existente' : 'NHTSA'}
                </Badge>
              </div>
              {item.years && (
                <span className="text-xs text-muted-foreground">
                  Años: {item.years.slice(0, 5).join(', ')}
                  {item.years.length > 5 && '...'}
                </span>
              )}
            </DropdownItem>
          ))}
          
          {/* Opción para crear nuevo si no existe */}
          {!suggestions.some(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
            <DropdownItem
              onClick={() => {
                onSelect({
                  id: null,
                  name: searchTerm,
                  year: [],
                  source: 'new'
                });
                setSuggestions([]);
              }}
            >
              <span className="text-primary">
                + Crear "{searchTerm}"
              </span>
            </DropdownItem>
          )}
        </Dropdown>
      )}
    </div>
  );
};
```

### Backend - Búsqueda Unificada:

```typescript
// app/api/vehicle-models/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const makeId = searchParams.get('makeId');
  
  // 1. Buscar en DB local
  const localModels = await prisma.vehicleModel.findMany({
    where: {
      makeId,
      normalizedName: { contains: normalizeText(query) }
    },
    take: 10
  });
  
  // 2. Si hay menos de 5 resultados locales, buscar en NHTSA
  let externalModels = [];
  if (localModels.length < 5) {
    const nhtsaResponse = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeid/${makeId}?format=json`
    );
    const nhtsaData = await nhtsaResponse.json();
    
    // Filtrar por query
    externalModels = nhtsaData.Results
      .filter(m => normalizeText(m.Model_Name).includes(normalizeText(query)))
      .slice(0, 5);
  }
  
  return Response.json({
    local: localModels,
    external: externalModels
  });
}
```

### Backend - Creación de OT (Manejo de Vinculación):

```typescript
// app/api/work-orders/route.ts - POST
export async function POST(request: Request) {
  const body = await request.json();
  
  // El frontend envía solo texto, el backend resuelve IDs
  const { vehicleData } = body; // { identifier, category, makeName, modelName, year }
  
  // 1. Buscar o crear Marca
  let make = await prisma.vehicleMake.findFirst({
    where: { normalizedName: normalizeText(vehicleData.makeName) }
  });
  
  if (!make) {
    make = await prisma.vehicleMake.create({
      data: {
        name: capitalizeText(vehicleData.makeName),
        normalizedName: normalizeText(vehicleData.makeName),
        category: [vehicleData.category]
      }
    });
  }
  
  // 2. Buscar o crear Modelo
  let model = await prisma.vehicleModel.findFirst({
    where: {
      makeId: make.id,
      normalizedName: normalizeText(vehicleData.modelName)
    }
  });
  
  if (!model) {
    model = await prisma.vehicleModel.create({
      data: {
        makeId: make.id,
        name: capitalizeText(vehicleData.modelName),
        normalizedName: normalizeText(vehicleData.modelName),
        years: vehicleData.year ? [vehicleData.year] : []
      }
    });
  } else if (vehicleData.year && !model.years.includes(vehicleData.year)) {
    // Agregar año si no existe
    await prisma.vehicleModel.update({
      where: { id: model.id },
      data: { years: { push: vehicleData.year } }
    });
  }
  
  // 3. Buscar o crear Vehicle (Activo)
  let vehicle = await prisma.vehicle.findFirst({
    where: {
      identifier: vehicleData.identifier.toUpperCase(), // Patente
      customerId: body.customerId
    }
  });
  
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        identifier: vehicleData.identifier.toUpperCase(),
        category: vehicleData.category,
        makeId: make.id,
        modelId: model.id,
        year: vehicleData.year,
        customerId: body.customerId
      }
    });
  }
  
  // 4. Crear la OT vinculada al vehicle.id
  const workOrder = await prisma.workOrder.create({
    data: {
      ...body,
      vehicleId: vehicle.id
    }
  });
  
  return Response.json(workOrder, { status: 201 });
}
```

### Resumen del Flujo:

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌─────────────┐
│   FRONT     │────▶│              BACKEND                     │────▶│    DB/NHTSA │
├─────────────┤     ├──────────────────────────────────────────┤     ├─────────────┤
│             │     │  GET /api/vehicle-models/search?q=cor  │     │             │
│ User escribe│     │    1. Busca en DB local                  │────▶│  DB local   │
│ "cronos"    │     │    2. Si faltan, busca en NHTSA          │     │             │
│             │     │    3. Devuelve combinado                 │     │             │
│             │◄────│       {local: [...], external: [...]}    │◄────│  NHTSA API  │
│ Muestra     │     │                                          │     │             │
│ opciones    │     │                                          │     │             │
│             │     │  POST /api/work-orders                   │     │             │
│ User elige  │     │    1. Recibe: makeName, modelName, etc   │     │             │
│ o crea      │     │    2. Busca/crea Marca (por texto)         │────▶│  Crea si no │
│             │     │    3. Busca/crea Modelo (por texto)        │     │  existe     │
│             │     │    4. Busca/crea Vehicle (por patente)     │     │             │
│             │     │    5. Crea OT vinculada                    │────▶│  Crea OT    │
└─────────────┘     └──────────────────────────────────────────┘     └─────────────┘
```

```
┌─────────────────┐       ┌──────────────────────────────────────────┐       ┌─────────────────┐
│  VEHICLE_MAKE   │       │              VEHICLE                     │       │   WORK_ORDER    │
├─────────────────┤       │          (Activo Genérico)               │       ├─────────────────┤
│ id              │◄────┤ id                                       │◄────┤ id (OT-XXXX)    │
│ name            │       │ identifier (patente/serie)               │       │ status          │
│ normalizedName  │       │ category                                 │       │ customerId      │
│ category[]      │       │ makeId? (vehículos)  ─────────────────►  │       │ vehicleId       │
│ isActive        │       │ modelId? (vehículos) ───────────────┐    │       │ technicianId    │
└─────────────────┘       │ year? (vehículos)                      │   │       │ payment?        │
                          │ equipmentName? (equipos)               │   │       │ invoiceId?      │
                          │ equipmentType? (equipos)               │   │       │ scheduledDate   │
                          │ description? (equipos)                   │   │       │ total           │
                          │ customerId                               │   │       └─────────────────┘
                          └──────────────────────────────────────────┘   │
┌─────────────────┐                                                      │
│ VEHICLE_MODEL   │◄─────────────────────────────────────────────────────┘
├─────────────────┤
│ id              │
│ makeId          │
│ name            │
│ normalizedName  │
│ years[]         │
│ isActive        │
└─────────────────┘
┌─────────────────┐       ┌─────────────────┐       └─────────────────┘
│     QUOTE       │       │  WORK_ORDER_ITEM│              │
├─────────────────┤       ├─────────────────┤              │
│ id              │       │ workOrderId     │──────────────┘
│ customerId      │◄────┤ type (PROD/SERV)│
│ vehicleId       │       │ productId?      │◄─────────────┐
│ status          │       │ serviceId?      │◄─────────┐   │
│ validUntil      │       │ quantity        │          │   │
│ total           │       │ unitPrice       │          │   │
│ approvedAt      │       │ subtotal        │          │   │
└─────────────────┘       └─────────────────┘          │   │
                                                       │   │
┌─────────────────┐       ┌─────────────────┐         │   │
│  CHECKLIST      │       │    SERVICE      │◄──────────┘   │
├─────────────────┤       ├─────────────────┤               │
│ id              │       │ id              │               │
│ workOrderId     │◄────┤ name            │               │
│ type (ENTRY/EXIT)       │ baseCost        │               │
│ items[]         │       │ timeMinutes     │               │
│ completed       │       │ vehicleFactor   │               │
│ notes           │       │ description     │               │
└─────────────────┘       └─────────────────┘               │
                                                            │
                                                    ┌───────┘
                                                    ▼
                                            ┌─────────────────┐
                                            │     PHOTO       │
                                            ├─────────────────┤
                                            │ id              │
                                            │ workOrderId     │◄────┘
                                            │ type            │
                                            │ url             │
                                            │ description     │
                                            └─────────────────┘
```

---

## API Endpoints Fase 2

### Clientes

**Schema:**
```typescript
// POST /api/customers - Request Body
{
  name: string;           // Nombre o Razón Social (requerido)
  phone: string;          // Teléfono principal (requerido)
  phoneAlt?: string;      // Teléfono alternativo (WhatsApp)
  email?: string;
  address?: string;
  notes?: string;
  billingData?: {         // Solo si factura
    cuit: string;         // CUIT para AFIP
    invoiceType: 'A' | 'B' | 'C' | 'M';
  };
}

// GET /api/customers - Response
{
  customers: [{
    id: string;
    name: string;
    phone: string;
    phoneAlt?: string;
    email?: string;
    address?: string;
    notes?: string;
    billingData?: { cuit: string; invoiceType: string };
    vehicles: [...];
    _count: { workOrders: number };
  }];
  total: number;
}
```

**Endpoints:**

| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/customers` | GET | Listar clientes | SELLER, TECHNICIAN, ADMIN |
| `/api/customers` | POST | Crear cliente | SELLER, ADMIN |
| `/api/customers/:id` | GET | Obtener cliente | SELLER, TECHNICIAN, ADMIN |
| `/api/customers/:id` | PUT | Actualizar cliente | SELLER, ADMIN |
| `/api/customers/search` | GET | Buscar por nombre/tel/patente | SELLER, TECHNICIAN, ADMIN |

### Activos/Vehículos (DB Normalizada)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/vehicles` | GET | Listar activos | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles` | POST | Crear activo | SELLER, ADMIN |
| `/api/vehicles/:id` | GET | Obtener activo | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id` | PUT | Actualizar activo | SELLER, ADMIN |
| `/api/vehicles/by-identifier/:identifier` | GET | Buscar por patente o n° serie | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id/history` | GET | Historial de OTs del activo | SELLER, TECHNICIAN, ADMIN |

### Marcas/Modelos (Normalización)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/vehicle-makes` | GET | Listar marcas | Todos |
| `/api/vehicle-makes` | POST | Crear marca (autocreación) | SELLER, ADMIN |
| `/api/vehicle-models` | GET | Listar modelos por marca | Todos |
| `/api/vehicle-models` | POST | Crear modelo (autocreación) | SELLER, ADMIN |

### Servicios
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/services` | GET | Listar servicios | Todos |
| `/api/services` | POST | Crear servicio | ADMIN |
| `/api/services/:id` | GET | Obtener servicio | Todos |
| `/api/services/:id/cost` | GET | Calcular costo por vehículo | SELLER, ADMIN |

### Presupuestos (Futuro)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/quotes` | GET | Listar presupuestos | SELLER, ADMIN |
| `/api/quotes` | POST | Crear presupuesto | SELLER, ADMIN |
| `/api/quotes/:id` | GET | Obtener presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/approve` | POST | Aprobar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/reject` | POST | Rechazar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/convert` | POST | Convertir a OT | SELLER, ADMIN |

> **Nota**: Presupuestos se implementarán post-MVP

### Órdenes de Trabajo

**Schema:**
```typescript
// POST /api/work-orders - Request Body
{
  customerId: string;
  vehicleId?: string;           // Si ya existe
  vehicleData?: {               // Si es nuevo (se crea vehicle)
    identifier: string;
    category: string;
    makeName?: string;
    modelName?: string;
    year?: number;
    color?: string;
    equipmentName?: string;
    equipmentType?: string;
    description?: string;
  };
  items: [...];                 // Productos y servicios
  entryChecklist?: {...};
  notes?: string;
  scheduledDate?: string;
  source?: 'IN_PERSON' | 'WEB'; // Default: 'IN_PERSON'
}
```

**Endpoints:**

| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/work-orders` | GET | Listar OTs con filtros | SELLER, TECHNICIAN, ADMIN |
| `/api/work-orders` | POST | Crear OT | SELLER, ADMIN |
| `/api/work-orders/:id` | GET | Obtener OT | SELLER, TECHNICIAN, ADMIN |
| `/api/work-orders/:id` | PUT | Actualizar OT | SELLER, ADMIN |
| `/api/work-orders/:id/status` | PUT | Cambiar estado | TECHNICIAN, ADMIN |
| `/api/work-orders/:id/assign` | POST | Asignar técnico | ADMIN |
| `/api/work-orders/:id/photos` | POST | Subir fotos | TECHNICIAN, ADMIN |
| `/api/work-orders/:id/checklist` | POST | Completar checklist | TECHNICIAN, ADMIN |
| `/api/work-orders/my` | GET | Mis OTs asignadas | TECHNICIAN |

### Técnicos
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/technicians` | GET | Listar técnicos | ADMIN |
| `/api/technicians/:id/workload` | GET | Carga de trabajo | ADMIN |

### Agenda
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/schedule` | GET | Agenda por día/semana | SELLER, TECHNICIAN, ADMIN |
| `/api/schedule/:date` | GET | Turnos del día | SELLER, TECHNICIAN, ADMIN |
| `/api/schedule/available` | GET | Horarios disponibles | SELLER, ADMIN |

---

## UI/UX Nuevas Pantallas (MVP)

1. **Ficha Cliente** - Datos + activos (vehículos/equipos) + historial
2. **Ficha Activo** - Datos según categoría + selector marca/modelo normalizado + historial OTs
3. **Nueva OT (Express)** - Creación directa sin presupuesto
4. **Kanban OTs** - Vista columnas por estado
5. **Detalle OT** - Todo el proceso + cierre con pago
6. **Agenda** - Calendario semanal con turnos
7. **Asignación Técnicos** - Quién hace qué y cuándo

> **Nota**: Pantalla de Presupuestos se agregará en iteración posterior

---

## Criterios de Éxito MVP OTs

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo promedio OT** | < tiempo estimado | 80% cumple estimación |
| **Tasa re-trabajos** | < 5% | OTs con garantía / Total |
| **Ocupación técnicos** | > 75% | Horas trabajadas / Disponibles |
| **Tiempo entrega** | < 48h desde ingreso | Promedio días OT |
| **Precisión datos** | > 95% | Marcas/modelos normalizados vs duplicados |
