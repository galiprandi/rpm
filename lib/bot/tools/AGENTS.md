# 🤖 Bot Tools - Guía para Agentes

## 📋 Prácticas Recomendadas

### Al Crear o Modificar Tools

**OBLIGATORIO:**
1. **Spec primero**: Crear/actualizar la spec en `/specs/bot-tools/[tool-name].md` antes de implementar
2. **Tests obligatorios**: Crear tests para parsers y servicios internos
3. **Validación con curl**: Probar la tool con curl antes de declararla lista
4. **Documentar en AGENTS.md**: Actualizar este archivo con decisiones arquitectónicas

### Estructura de Tool Core

```
lib/bot/tools/[tool-name]/
├── description.md          # Prompt/description editable
├── index.ts                # Implementación de la tool
├── parser.ts               # Service → Markdown (si aplica)
├── parser.test.ts          # Tests del formato MD
└── execute.ts              # Lógica de ejecución (si aplica)
```

**Patrones obligatorios:**
- Todas reciben `context: BotContext` inyectado por el backend
- Descripción cargada desde `.md` (no hardcodeada)
- Respuesta en Markdown (parser testeado)
- Datos filtrados según `context.role`

### Testing

**Para parsers:**
- Testear formato Markdown
- Testear filtrado por rol
- Testear casos edge (vacío, 1 resultado, múltiples)

**Para servicios internos:**
- Mock de Prisma
- Testear lógica de fallback
- Testear filtrado de datos

**Validación:**
```bash
# Probar con curl
curl -X POST 'http://localhost:3000/api/bot/chat' \
  -H 'Content-Type: application/json' \
  -b 'better-auth.session_token=...' \
  --data-raw '{"id":"test","messages":[{"parts":[{"type":"text","text":"query"}],"id":"msg1","role":"user"}]}'
```

### Arquitectura de Tools Potentes

**Principio:** Proveer al modelo de pocas tools muy potentes

**Ejemplo - get_product:**
- Tool visible para el modelo: `get_product`
- Servicio interno: `searchService` (no visible para el modelo)
- Lógica de fallback: `get_product` decide cuándo usar `searchService`
- El modelo solo ve `get_product`, nosotros componemos tools internamente

**Ventajas:**
- Modelo ve menos tools → más simple de usar
- Composición interna permite mejorar experiencia sin cambiar tools del modelo
- Servicios internos testeables independientemente

### Decisión de Fuzzy Fallback

**Lógica implementada en get_product:**
1. Si query es SKU (match exacto) → no fuzzy
2. Si query genérica + >= 2 resultados → devuelve tal cual
3. Si query genérica + < 2 resultados → invoca searchService (fuzzy más amplio)

**Razón:**
- SKU es identificador único, si hay coincidencia es exacta
- Query genérica puede necesitar más opciones si < 2 resultados

### Filtrado por Rol

**Campos sensibles:**
- `costPrice`: Solo ADMIN
- `replacementCost`: ADMIN y SELLER
- `supplier`: ADMIN y SELLER
- `lastMovementAt`: Solo ADMIN

**Implementación:**
- Parser recibe `role` como parámetro
- Filtra campos antes de formatear
- Campos omitidos no aparecen en Markdown

### Errores Comunes a Evitar

❌ **No hardcodear descripciones** → Usar `description.md` con cache
❌ **No omitir tests de parser** → Formato Markdown crítico para UX
❌ **No validar sin curl** → Tests unitarios no suficientes
❌ **No filtrar por rol** → Datos sensibles expuestos
❌ **No usar `any` types** → Tipado estricto obligatorio

### Composición de Servicios

**Cuando crear servicio interno:**
- Lógica compleja que no debería estar en la tool
- Requiere testing independiente
- Puede ser reutilizado por múltiples tools

**Ejemplo:**
- `searchService`: Búsqueda fuzzy avanzada con múltiples estrategias
- Usado por `get_product` pero podría usarse por otras tools en el futuro

### Actualización de Specs

**Antes de implementar:**
1. Actualizar `/specs/bot-tools/[tool-name].md`
2. Definir comportamiento, parámetros, formato de salida
3. Especificar lógica de fallback si aplica
4. Documentar filtrado por rol

**Después de implementar:**
1. Actualizar estado en spec (🟡 → ✅)
2. Agregar notas de implementación si hubo desviaciones
3. Documentar decisiones arquitectónicas en AGENTS.md

### Debugging Proactivo y Validación

**Enfoque:** Nunca asumir que algo funciona sin validación explícita

**Herramientas de validación:**
- **curl**: Probar APIs directamente
- **Logs de terminal**: Ver comportamiento real del servidor
- **Queries a DB**: Verificar datos existentes
- **Scripts de prueba**: Validar servicios aislados

**Flujo de debugging proactivo:**
```
1. Hacer el cambio → 2. VALIDAR → 3. Confirmar que funciona → 4. Responder al usuario
```

**Ejemplo práctico - singularización de queries:**

**Problema:** "¿Hay baterías?" no encontraba productos

**Investigación proactiva:**
```bash
# 1. Verificar si el producto existe en DB
pnpm tsx -e "import { getProducts } from './lib/services/productService.js'; 
  getProducts({ search: 'batería', isActive: true }).then(r => console.log('Found:', r.products.length));"
# Output: Found: 1 ✅

# 2. Probar con curl para ver qué pasa
curl -X POST 'http://localhost:3000/api/bot/chat' \
  -H 'Content-Type: application/json' \
  -b 'better-auth.session_token=...' \
  --data-raw '{"id":"test","messages":[{"parts":[{"type":"text","text":"batería"}],"id":"msg1","role":"user"}]}'
# Output: No encontré productos ❌

# 3. Agregar logs de debug para entender el flujo
console.log(`[get_product] Query: "${query}", Found: ${result.products.length}`);
```

**Diagnóstico:** getProducts encontraba 1 resultado, pero get_product invocaba searchService porque la lógica de fallback era "< 2 resultados" en lugar de "> 0 resultados".

**Solución:** Corregir lógica de fallback y agregar singularización en código.

**Validación final:**
```bash
curl -X POST 'http://localhost:3000/api/bot/chat' \
  --data-raw '{"id":"test","messages":[{"parts":[{"type":"text","text":"¿Hay baterías?"}],"id":"msg1","role":"user"}]}'
# Output: ✅ Encontró "Batería 12V 50Ah"
```

**Lecciones:**
- ❌ PROHIBIDO: "Debería funcionar" sin validar
- ✅ OBLIGATORIO: Validar con herramientas concretas antes de responder
- ✅ Usar múltiples herramientas en paralelo cuando sea posible
- ✅ Si la validación falla, reportar el error exacto y proponer siguiente paso
- ✅ Tomar los segundos necesarios para confirmar, siempre mejor que asumir

**Herramientas preferidas por tipo de validación:**
| Tipo de Cambio | Herramienta | Ejemplo |
|----------------|-------------|---------|
| API Backend | `curl` | `curl -X POST http://localhost:3000/api/...` |
| UI/Frontend | Playwright MCP | Screenshots, interacciones |
| Base de Datos | `psql` o scripts tsx | `SELECT * FROM product WHERE...` |
| Servicios | Scripts de prueba aislados | `pnpm tsx -e "import { service } ..."` |

### Linting

**Errores comunes:**
- `Unexpected any` → Usar tipos explícitos o `as any` solo cuando sea necesario
- `Variable assigned but never used` → Remover o usar
- Type mismatches en Prisma mocks → Usar tipos correctos de Decimal

**Práctica:**
- Arreglar lint errors antes de commitear
- Usar `vi.mocked()` en lugar de `as any` cuando sea posible
- Mockear Prisma con tipos correctos (Decimal → number con `toNumber()`)

### Referencias

- Spec principal: `/specs/bot.md`
- Specs de tools: `/specs/bot-tools/`
- Ejemplo implementado: `lib/bot/tools/get-product/`
- Servicio interno: `lib/services/searchService.ts`

### Limitación: SDK Conversation History

**Estado:** ❌ No compatible

**Problema:**
`convertToModelMessages` del Vercel AI SDK no es compatible con nuestra arquitectura de tools modulares. El SDK espera tools definidas inline con `execute` function que retornen strings simples, pero nuestra arquitectura usa tool objects externos con outputs estructurados (Markdown con metadata).

**Error:**
```
Invalid input: expected string, received undefined
Invalid input: expected array, received undefined
```

**Enfoques probados (todos fallaron):**
1. SDK pattern con tools inline en `route.ts`
2. SDK pattern con arquitectura modular (`execute.ts`)
3. `convertToModelMessages` con parámetro `tools`

**Resultado:**
- ✅ Bot funciona para queries individuales
- ❌ Sin historial de conversación (el bot no entiende "precio del primero?" después de listar productos)
- ✅ Arquitectura modular mantenida (description.md, parser.ts, servicios internos)

**Futuro:**
Esperar actualización del SDK que soporte arquitecturas modulares, o aceptar reestructuración completa a tools inline (pierde modularidad).

---

### Limitación: Separación de Descripciones en Carpeta Central

**Estado:** ❌ No compatible con Next.js/Turbopack

**Problema:**
Next.js 16.2.1 con Turbopack no reconoce archivos `.md` como módulos válidos cuando se importan desde carpetas separadas. El loader de webpack/Turbopack requiere configuración específica para tipos de archivo personalizados.

**Error:**
```
Unknown module type
This module doesn't have an associated type. Use a known file extension, or register a loader for it.
```

**Enfoque probado (falló):**
1. Mover `description.md` a `lib/bot/descriptions/[tool-name].md`
2. Crear `types/md.d.ts` para declarar módulos `.md`
3. Actualizar imports en tools

**Resultado:**
- ❌ Build falló con "Unknown module type"
- ✅ Revertido a estructura original (description.md dentro de cada carpeta de tool)

**Conclusión:**
Mantener `description.md` dentro de cada carpeta de tool (`lib/bot/tools/[tool-name]/description.md`). Next.js soporta imports de `.md` solo cuando están en la misma carpeta que el archivo que los importa.

**Workaround temporal:**
Debido a que Turbopack no reconoce archivos `.md` como módulos válidos, las descripciones están hardcoded en `index.ts` temporalmente. El archivo `description.md` se mantiene como documentación de referencia.

**Solución futura:**
- Investigar configuración de webpack/Turbopack para habilitar loader de archivos `.md`
- O migrar descripciones a archivos `.ts` con strings exportadas
- O usar un sistema de build que genere archivos de descripción en tiempo de compilación
