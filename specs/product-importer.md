# Product Importer Spec

## Resumen
Importador de productos desde CSV con flujo optimizado: sanitización → mapeo DB→CSV → revisión validada → importación.

## Alcance (Scope)
- **Solo productos** - No importa proveedores, clientes ni stock inicial
- **Categorías planas** - Sin jerarquía de sub-rubros
- **Mapeo DB→CSV** - Campos de base de datos como origen, columnas CSV como destino
- **Datos validados** - Solo se muestra en revisión lo que realmente irá a la DB
- **Sanitización automática** - Filas malformadas se descartan al cargar

## Out of Scope
- Importación de proveedores
- Importación de stock inicial  
- Actualización de productos existentes (solo creación)
- Historial de precios
- Imágenes de productos

## Ubicación
- Ruta: `/adm/products/import`
- Componente principal: `ProductImporterPage`

## Flujo del Usuario (Implementado)

### Paso 1: Cargar CSV ✅
**Objetivo:** Sanitizar y detectar columnas

- **Componente:** `UploadStep.tsx`
- **Hook:** `useFileUpload.ts`
- **Funcionalidad:**
  - Dropzone para CSV (.csv, .txt)
  - Sanitización: Descartar filas que no coincidan con el número de columnas del header
  - Detección automática: Encoding (UTF-8, ISO-8859-1), Delimitador (coma, punto y coma)
  - Preview de primeras filas válidas

### Paso 2: Mapear Columnas ✅
**Objetivo:** Asignar columnas CSV a campos de DB

- **Componente:** `ConfigurationStep.tsx`
- **Hook:** `useConfiguration.ts`
- **Componentes:** `ColumnMapper.tsx`, `FieldConfigRow.tsx`
- **Funcionalidad:**
  - Tabla con campos de DB como filas
  - Transformaciones por tipo (Capitalizar, Formato numérico, etc.)
  - Opciones globales (Omitir stock < 1, Acción con duplicados)
  - Persistencia en localStorage

### Paso 3: Revisar ✅
**Objetivo:** Validar contra DB y mostrar qué se importará

- **Componente:** `ReviewStep.tsx`
- **Hook:** Integración con API de validación
- **Componentes:** `ProductReviewTable.tsx` con tabs
- **Funcionalidad:**
  - 4 tabs: Nuevos, Omitidos, Existentes, Categorías
  - Datos transformados listos para DB
  - Mapeo de categorías detectadas

### Paso 4: Importar ✅
**Objetivo:** Ejecutar importación con batch processing

- **Componente:** `ExecuteStep.tsx`
- **Hook:** `useImportExecution.ts`
- **Componentes:** `ImportProgress.tsx`
- **Funcionalidad:**
  - Batch processing (chunks de 100)
  - Progress bar
  - Resultado final con reporte descargable

## Campos de DB Disponibles para Mapeo

```prisma
model Product {
  id          String   @id @default(uuid())
  sku         String?  @unique
  name        String
  description String?
  costPrice   Decimal  @db.Decimal(10, 2)
  replacementCost Decimal @db.Decimal(10, 2)
  stock       Int      @default(0)
  minStock    Int      @default(0)
  barcode     String?
  location    String?
  categoryId  String
  // ... relations
}
```

| Campo DB | Label UI | Tipo | Requerido | Transformación Default |
|----------|----------|------|-----------|------------------------|
| `name` | Nombre | String | Sí | Capitalizar + Trim |
| `sku` | SKU/Código | String | No | Mayúsculas + Trim |
| `barcode` | Código de barras | String | No | Trim |
| `description` | Descripción | String | No | Capitalizar + Trim |
| `costPrice` | Precio de costo | Decimal | No | Formato español → Decimal(10,2) |
| `replacementCost` | Costo de reposición | Decimal | No | Formato español → Decimal(10,2) |
| `stock` | Stock inicial | Int | No | Redondear entero |
| `minStock` | Stock mínimo | Int | No | Redondear entero |
| `location` | Ubicación | String | No | Mayúsculas + Trim |
| `categoryId` | Categoría | Relación | No* | Capitalizar + match fuzzy |

*Si no se mapea categoría, se usa `defaultCategoryId`.

## Tests Unitarios ✅

### Stack de Testing
- **Framework**: Vitest (compatible con React 19)
- **Testing Library**: @testing-library/react para render de hooks y componentes
- **DOM Testing**: @testing-library/jest-dom/vitest para matchers
- **Mocks**: vi.fn() de Vitest en lugar de jest.fn()
- **Environment**: jsdom con setup personalizado

### Hooks Testeados
- **useImportState.test.ts** - 19 tests pasados ✅
  - Navegación entre pasos
  - Gestión de datos de archivo
  - Gestión de configuración
  - Gestión de resultados de validación
  - Gestión de mapeos de categorías
  - Gestión de resultados de importación
  - Gestión de estado UI
  - Persistencia (adaptada para entorno de测试)

- **useFileUpload.test.ts** - 6 tests pasados ✅
  - Inicialización correcta
  - Reset de estado
  - Análisis exitoso de archivos CSV
  - Manejo de errores de API
  - Validación de tipo de archivo (CSV obligatorio)
  - Validación de tamaño (límite 10MB)

- **useConfiguration.test.ts** - Tests pasados ✅
  - Configuración de campos
  - Opciones globales
  - Auto-detección de headers (español: PRODUCTO, PRECIO, STOCK, etc.)
  - Validación
  - Persistencia en localStorage con clave `product-import-configuration`

### Componentes Testeados
- **UploadStep.test.tsx** - En progreso 🟡
  - Renderizado de interfaz
  - Manejo de archivos
  - Estados de error (mensajes en español)
  - Accesibilidad
  - Integración con hooks
  - Mocks actualizados para compatibilidad con vitest

## Estado de Implementación

### ✅ Completado
- [x] Arquitectura modular con hooks separados
- [x] Componentes reutilizables en `/components/products/import/`
- [x] Flujo completo de 4 pasos
- [x] Estado global con Zustand + persistencia
- [x] Validación con Zod schemas compartidos
- [x] Tests unitarios para hooks principales (useImportState, useFileUpload, useConfiguration)
- [x] Migración de jest a vitest para compatibilidad con React 19
- [x] Build exitoso sin errores

### � En Progreso
- [ ] UploadStep.test.tsx - Corrigiendo mensajes de error en español

### 📋 Pendiente
- [ ] Tests para componentes restantes (ConfigurationStep, ReviewStep, ExecuteStep)
- [ ] Tests de integración E2E
- [ ] Eliminar componentes obsoletos (CategoryMapper.tsx)

## Funciones de Procesamiento

| Función | Descripción | Aplica a |
|---------|-------------|----------|
| `capitalize_trim` | Capitaliza primera letra de cada palabra + trim | strings |
| `uppercase_trim` | Convierte a mayúsculas + trim | códigos, IDs |
| `lowercase_trim` | Convierte a minúsculas + trim | emails, slugs |
| `trim` | Solo elimina espacios al inicio y final | strings |
| `round_2` | Redondea a 2 decimales | precios |
| `round_int` | Redondea a entero | cantidades |
| `parse_es_number` | Convierte número español (coma decimal) a float | precios legacy |
| `resilient_decimal` | Detecta formato numérico (ES/EN) y convierte a decimal | precios |
| `resilient_integer` | Detecta formato numérico y convierte a entero | cantidades |

**Nota**: Los campos de precio usan un **array de transformers** (ej: `['resilient_decimal', 'round_2']`) para procesar en cadena: primero detectan/convierten el formato numérico, luego redondean.

## API Endpoints Requeridos

```typescript
// Upload y análisis inicial
POST /api/import/products/analyze
- Input: FormData con archivo CSV
- Output: { columns: string[], preview: Row[], totalRows: number, encoding: string }

// Validación completa
POST /api/import/products/validate
- Input: { 
    mapping: ColumnMapping, 
    categoryMapping: CategoryMapping, 
    importOptions: ImportOptions,
    defaultValues: Defaults 
  }
- Output: { valid: Product[], invalid: InvalidRow[], stats: Stats, categoriesToCreate: Category[] }

// Ejecución de importación
POST /api/import/products/execute
- Input: { 
    mapping: ColumnMapping, 
    categoryMapping: CategoryMapping, 
    importOptions: ImportOptions,
    defaultValues: Defaults 
  }
- Output: { created: number, errors: ImportError[], reportUrl: string }
```

## Estructura de Datos

```typescript
interface ColumnMapping {
  [fieldKey: string]: {
    column: string;
    process: string | string[];  // Single transformer or array for chaining
    skipEmpty?: boolean;
    defaultValue?: string;
  };
}

interface ImportOptions {
  skipStockLessThanOne: boolean;     // Omitir items con stock < 1
  duplicateAction: 'skip' | 'update' | 'create_with_suffix'; // Qué hacer con duplicados
  defaultCategoryName: string;        // Categoría por defecto si rubro vacío
}

interface CategoryMapping {
  [csvCategoryKey: string]: {
    action: 'create' | 'map';
    targetId?: string; // solo si action === 'map'
    newName?: string;  // solo si action === 'create'
  };
}

interface ImportConfig {
  delimiter: ',' | ';' | '\t';
  encoding: string;
  hasHeader: boolean;
  skipRows: number;
}

interface MappingTemplate {
  id: string;
  name: string;
  description?: string;
  columnMapping: ColumnMapping;
  categoryColumn: string;      // Qué columna CSV usar para categoría
  importOptions: ImportOptions;
  createdAt: Date;
  updatedAt: Date;
}
```

## Componentes UI

```
components/products/import/
├── steps/
│   ├── UploadStep.tsx           # Paso 1: Cargar y analizar CSV
│   ├── ConfigurationStep.tsx    # Paso 2: Mapear columnas
│   ├── ReviewStep.tsx           # Paso 3: Revisar validación
│   └── ExecuteStep.tsx          # Paso 4: Importar
├── shared/
│   └── StepActions.tsx          # Componente de navegación
├── FileUploader.tsx             # Input file + detección encoding/delimiter
├── ColumnMapper.tsx             # Mapeo columnas ↔ campos
├── ProductReviewTable.tsx       # Tabla de revisión con tabs
├── ImportProgress.tsx           # Progress de importación
└── CategoryMapper.tsx           # Mapeo de categorías (obsoleto)

app/adm/products/import/
├── page.tsx                     # Página contenedora
├── hooks/
│   ├── useImportState.ts        # Estado global del importador
│   ├── useFileUpload.ts         # Manejo de archivos
│   ├── useConfiguration.ts      # Configuración de mapeo
│   ├── useCategoryMapping.ts    # Mapeo de categorías
│   └── useImportExecution.ts    # Ejecución de importación
└── lib/
    ├── transformers.ts         # Helper con funciones de transformación
    └── transformers.test.ts    # Tests unitarios
```

## Modelo de Datos - Campos Adicionales

No requiere cambios en schema.prisma. Usa modelos existentes:
- `Product` (name, code, costPrice, replacementCost, stock, unit, categoryId)
- `Category` (name, description)

## Opciones de Importación

### Opciones Globales (Step 2 - Mapeo)

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `skipStockLessThanOne` | switch | false | Omitir productos con stock < 1 |
| `duplicateAction` | select | 'skip' | Acción al detectar duplicados: skip, update, create_with_suffix |
| `defaultCategoryId` | select | "_none" | Categoría por defecto (usar "/adm/categories" para crear) |

### Opciones por Columna (Step 2 - Mapeo)

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `skipEmpty` | checkbox | false | Omitir productos donde esta columna esté vacía |

### Acciones para Duplicados

- **skip**: No importar el producto si ya existe (por code o name)
- **update**: Actualizar producto existente con datos del CSV (precios, stock, etc.)
- **create_with_suffix**: Crear nuevo producto con sufijo "(2)", "(3)" etc.

## Validaciones Críticas

1. **Productos duplicados**: Detectar por `code` o `name` exacto. Acción según `duplicateAction`
2. **Categorías vacías**: Si rubro vacío → asignar a categoría `defaultCategoryName`
3. **Precios negativos**: Convertir a 0 (no permitir negativos en el sistema)
4. **Stock negativo**: Si `skipStockLessThanOne` = true, omitir producto. Si false, convertir a 0
5. **Columnas vacías**: Si columna tiene `skipEmpty` = true y valor vacío → omitir producto
6. **Nombres duplicados post-sanitización**: Agregar sufijo "(2)", "(3)" etc.

## Features Sugeridas (Post-MVP)

### 1. Templates de Mapeo Guardables

**Funcionamiento a alto nivel:**

```
┌─────────────────────────────────────────────────────────────┐
│  Paso 2: Column Mapper                                      │
│                                                             │
│  [ Guardar como Template ]  [ Cargar Template ▼ ]          │
│                                                             │
│  Nombre: "Import Legacy CSV v1"                             │
│  Descripción: "Mapeo para CSV del sistema anterior"         │
│                                                             │
│  [ Guardar ]  [ Cancelar ]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Almacenamiento:**
- Guardar en `localStorage` para MVP (sin backend)
- Estructura: `MappingTemplate[]`
- Campos: id, name, description, columnMapping, categoryColumn, importOptions, timestamps

**UX:**
- Dropdown "Cargar Template" en Step 2
- Autodetect: Si columnas del CSV coinciden con template guardado → sugerir cargarlo
- Pre-fill: Al cargar template, pre-completar todos los mapeos de columnas
- Update: Permitir actualizar template existente después de ajustes

**Ejemplo de uso:**
1. Usuario importa CSV por primera vez, configura mapeo manualmente
2. Guarda template "Import RPM Legacy"
3. Mes siguiente, nuevo CSV con misma estructura
4. Sistema detecta columnas similares → sugiere cargar template
5. Un click y todo el mapeo se pre-completa

### 2. Undo Import (dentro de 24hs)
- Guardar batchId de productos creados
- Endpoint DELETE /api/import/products/batch/:batchId
- Disponible solo 24hs post-importación

### 3. Importación Asíncrona (archivos > 10k filas)
- Cola de procesamiento (Redis/Bull)
- WebSocket para progreso real
- Notificación email al completar

### 4. Validación de Códigos de Barras (EAN13)
- Validar checksum de EAN13
- Detectar GTIN-8, GTIN-12, GTIN-13, GTIN-14

### 5. Importación de Imágenes por URL
- Campo opcional `imageUrl` en mapeo
- Descarga async + resize al importar

## Decisiones del Usuario (Respondidas)

1. **✅ Categorías**: Sistema usa categorías planas, sin sub-rubros
2. **✅ Mapeo de códigos**: Definible desde UI (code vs barcode vs supplierCode)
3. **✅ Mapeo de precios**: Definible desde UI (wholesalePrice vs retailPrice vs costPrice)
4. **✅ Stock < 1**: Opción `skipStockLessThanOne` (switch)
5. **✅ Vacíos**: Opción `skipEmpty` por columna (checkbox)
6. **✅ Duplicados**: Opción `duplicateAction` durante importación (select)

## Criterios de Aceptación (Definidos en Conversación)

### Scope y Funcionalidad Core
- [ ] El importador es **solo de productos** (no importa proveedores, clientes ni stock inicial)
- [ ] El sistema usa **categorías planas** (sin jerarquía de sub-rubros)
- [ ] El usuario puede **mapear cualquier columna CSV a cualquier campo del sistema** desde la UI
- [ ] El usuario define qué columna de precio va a qué campo (wholesalePrice, retailPrice, costPrice)
- [ ] El usuario define qué columna de código va a qué campo (code, barcode, supplierCode)

### Opciones de Importación
- [ ] Opción **"Omitir stock < 1"** (`skipStockLessThanOne`): switch global que excluye productos con stock negativo o cero
- [ ] Opción **"Omitir vacíos"** (`skipEmpty`): checkbox por columna que excluye productos donde esa columna esté vacía
- [ ] Opción **"Acción con duplicados"** (`duplicateAction`): select con opciones skip | update | create_with_suffix
- [ ] Opción **"Categoría por defecto"** (`defaultCategoryName`): input para nombre de categoría cuando rubro está vacío

### Procesamiento de Datos
- [ ] **Capitalización**: Nombres de productos y categorías se capitalizan automáticamente
- [ ] **Trim**: Todos los strings se limpian de espacios al inicio y final
- [ ] **Números españoles**: Conversión automática de coma decimal a punto decimal
- [ ] **Redondeo**: Precios a 2 decimales, cantidades a enteros
- [ ] **Precios negativos**: Se convierten a 0 (no se permiten negativos)

### Categorías
- [ ] **Inferencia automática**: Detecta valores únicos de columna Rubro del CSV
- [ ] **Creación automática**: Crea categorías con nombres capitalizados para rubros no existentes
- [ ] **Mapeo manual**: Permite asignar rubro detectado a categoría existente
- [ ] **Rubros vacíos**: Se asignan a categoría default configurable

### UX y Flujo
- [ ] **Paso 1 - Carga**: Dropzone con detección automática de encoding y delimitador
- [ ] **Paso 2 - Mapeo**: UI para asignar columnas CSV a campos del sistema, con defaults y funciones de procesamiento
- [ ] **Paso 3 - Categorías**: Tabla de rubros detectados con opciones de mapeo/creación
- [ ] **Paso 4 - Preview**: Muestra total de registros, válidos, inválidos, categorías a crear, errores detectados
- [ ] **Paso 5 - Importación**: Progreso con batch processing y reporte final descargable

### Validaciones
- [ ] **Preview de validación**: Muestra exactamente cómo quedarán los datos antes de importar
- [ ] **Detección de duplicados**: Por code o name exacto, con acción configurable
- [ ] **Estadísticas**: Total, válidos, inválidos, errores por fila
- [ ] **Reporte descargable**: CSV con resultado de cada fila (éxito/error)

### Rendimiento
- [ ] Capacidad de procesar CSV de 3000+ productos sin timeout
- [ ] Batch processing en chunks de 100 productos
- [ ] Persistencia de mapeo en localStorage durante el proceso
