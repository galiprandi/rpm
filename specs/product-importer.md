# Product Importer Spec

## Resumen
Importador de productos desde CSV legacy con mapeo inteligente de columnas, inferencia de categorías y procesamiento de datos.

## Alcance (Scope Contenido)
- **Solo productos** - No importa proveedores, clientes ni stock inicial
- **Inferencia de categorías** - Crea rubros detectados automáticamente (categorías planas, sin sub-rubros)
- **Mapeo manual de columnas** - Usuario asigna qué columna CSV va a qué campo del sistema
- **Preview y validación** - Muestra cantidad de registros detectados y válidos antes de importar
- **Procesamiento de datos** - Capitalización, trim, redondeo de números

## Out of Scope
- Importación de proveedores (solo referencia por nombre/código si existe)
- Importación de stock inicial (se puede agregar después)
- Actualización de productos existentes (solo creación)
- Historial de precios
- Imágenes de productos

## Ubicación
- Ruta: `/settings/import/products`
- Componente: `ProductImporter` (client-side, heavy interactivity)

## Flujo del Usuario

### Paso 1: Carga de Archivo
- Dropzone o input file para CSV
- Validación: archivo .csv o .txt
- Detección automática de:
  - Encoding (UTF-8, ISO-8859-1, Windows-1252)
  - Delimitador (coma, punto y coma, tab)
  - Línea de headers
- Preview primeras 5 filas crudas

### Paso 2: Mapeo de Columnas
- Mostrar columnas detectadas del CSV
- Por cada campo del sistema, permitir:
  - Seleccionar columna origen (dropdown)
  - Definir valor por defecto (input)
  - Seleccionar función de procesamiento (dropdown)
  - Checkbox "Omitir si vacío" (`skipEmpty`)
- **Persistencia**: Guardar mapeo en `localStorage` automáticamente al cambiar cualquier valor
- Mostrar notificación "Mapeo guardado" con debounce de 1 segundo
- Al cargar Paso 2, recuperar mapeo de `localStorage` si existe para estas columnas

**Campos del Sistema Disponibles (mapeo 1:1 con tabla `Product`):**
| Campo DB | Label UI | Tipo | Requerido | Default Sugerido | Funciones |
|----------|----------|------|-----------|------------------|-----------|
| `name` | Nombre del producto | string | Sí | - | Capitalize + Trim |
| `sku` | SKU (código) | string | No | Auto-generado | Trim + Uppercase |
| `barcode` | Código de barras (EAN) | string | No | - | Trim |
| `description` | Descripción | string | No | - | Capitalize + Trim |
| `categoryId` | Categoría | relation | No | Sin categoría | - |
| `costPrice` | Precio de costo | Decimal | No | 0 | Round 2 decimals |
| `salePrice` | Precio de venta | Decimal | No | 0 | Round 2 decimals |
| `stock` | Stock inicial | Int | No | 0 | Round integer |
| `minStock` | Stock mínimo | Int | No | 0 | Round integer |
| `location` | Ubicación | string | No | - | Uppercase + Trim |

**Nota importante:** El modelo `Product` en Prisma NO tiene campos `wholesalePrice`, `retailPrice`, ni `unit`. El precio mayorista del CSV debe mapearse al campo `salePrice` si es el precio principal de venta.

**Campos del modelo Product (Prisma):**
```prisma
model Product {
  id          String   @id @default(uuid())
  sku         String?  @unique
  name        String
  description String?
  costPrice   Decimal  @db.Decimal(10, 2)
  salePrice   Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  minStock    Int      @default(0)
  barcode     String?
  location    String?
  // ... relations
}
```

### Paso 3: Configuración de Categorías
- Detectar valores únicos de columna Rubro + Subrubro
- Mostrar tabla: Rubro | Subrubro | Cantidad Productos
- Por cada combinación, permitir:
  - Mapear a categoría existente (search/select)
  - O crear nueva categoría (input nombre + descripción opcional)
- Default: crea categorías con nombre = Rubro (capitalizado)

### Paso 4: Preview y Validación
- Procesar todas las filas del CSV
- Mostrar estadísticas:
  - Total registros detectados
  - Registros válidos (tienen nombre)
  - Registros inválidos (falta nombre u obligatorio)
  - Categorías a crear
  - Productos por categoría
- Lista de errores detectados (fila + motivo)
- Botón "Importar" habilitado solo si hay válidos > 0

### Paso 5: Procesamiento e Importación
- Batch processing (chunks de 100)
- Progress bar con contador
- Resultado final:
  - Productos creados exitosamente
  - Categorías creadas
  - Errores durante importación (si los hay)
  - Botón "Descargar reporte" (CSV con resultado por fila)

## Funciones de Procesamiento

| Función | Descripción | Aplica a |
|---------|-------------|----------|
| `capitalize_trim` | Capitaliza primera letra de cada palabra + trim | strings |
| `uppercase_trim` | Convierte a mayúsculas + trim | códigos, IDs |
| `lowercase_trim` | Convierte a minúsculas + trim | emails, slugs |
| `round_2` | Redondea a 2 decimales | precios |
| `round_int` | Redondea a entero | cantidades |
| `parse_es_number` | Convierte número español (coma decimal) a float | precios legacy |
| `boolean_yes_no` | "SI"/"YES"/"1" → true, resto → false | flags |

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
  name: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  code?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  barcode?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  categoryId?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  costPrice?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  wholesalePrice?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  retailPrice?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  stock?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
  unit?: { column: string; process: ProcessFunction; skipEmpty?: boolean };
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
app/settings/import/products/
├── page.tsx                    # Página contenedora
├── components/
│   ├── FileUploader.tsx        # Dropzone + detección encoding
│   ├── ColumnMapper.tsx        # Mapeo columnas ↔ campos
│   ├── CategoryMapper.tsx      # Mapeo rubros ↔ categorías
│   ├── ValidationPreview.tsx  # Preview + estadísticas
│   ├── ImportProgress.tsx      # Progress bar + resultados
│   └── ProcessFunctionSelect.tsx # Selector de funciones de procesamiento
```

## Modelo de Datos - Campos Adicionales

No requiere cambios en schema.prisma. Usa modelos existentes:
- `Product` (name, code, costPrice, salePrice, stock, unit, categoryId)
- `Category` (name, description)

## Opciones de Importación

### Opciones Globales (Step 2 - Mapeo)

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `skipStockLessThanOne` | switch | false | Omitir productos con stock < 1 |
| `duplicateAction` | select | 'skip' | Acción al detectar duplicados: skip | update | create_with_suffix |
| `defaultCategoryId` | select | "_none" | Categoría por defecto (usar "/adm/categories" para crear) |
| `defaultSupplierId` | select | "_none" | Proveedor por defecto (usar "/adm/suppliers" para crear) |

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
