# Prisma Database Rules

## 🚫 PROHIBIDO ABSOLUTO

### Operaciones peligrosas que NUNCA deben ejecutarse

- **`prisma db push`** — en cualquier ambiente (local, dev, staging, producción). Usar exclusivamente `prisma migrate dev` (local) o `prisma migrate deploy` (deploy).
- **`prisma db reset`** — DESTRUYE todos los datos. Prohibido en todos los ambientes.
- **`prisma migrate reset`** — DESTRUYE la base de datos y vuelve a aplicar migraciones desde cero. Prohibido.
- **Borrar migraciones del repo** — Una vez mergeada a `main`, la migración existe para siempre. Si hay que corregir algo, crear una **nueva migración**.
- **Actualizar Prisma a v7** — Este proyecto usa **Prisma v6.19.3** de forma permanente. v7 rompe compatibilidad con Next.js 16 por módulos nativos.
- **Editar archivos `.sql` de migraciones ya aplicadas** — El checksum de Prisma detectará el cambio y bloqueará futuros deploys.

## 🛡️ Regla de Oro: Migraciones SIEMPRE Idempotentes

Toda migración debe poder ejecutarse sin errores incluso si los objetos ya no existen o ya fueron creados.

### ✅ Correcto (obligatorio)

```sql
-- Índices
DROP INDEX IF EXISTS "nombre_idx";
CREATE INDEX IF NOT EXISTS "nombre_idx" ON "tabla"("columna");

-- Columnas
ALTER TABLE "tabla" DROP COLUMN IF EXISTS "columna";
ALTER TABLE "tabla" ADD COLUMN IF NOT EXISTS "columna" TEXT;

-- Tablas
DROP TABLE IF EXISTS "tabla";
CREATE TABLE IF NOT EXISTS "tabla" ();

-- Constraints
ALTER TABLE "tabla" DROP CONSTRAINT IF EXISTS "nombre_fkey";
```

### ❌ Prohibido

```sql
-- Falla si el índice no existe
DROP INDEX "nombre_idx";

-- Falla si la columna no existe
ALTER TABLE "tabla" DROP COLUMN "columna";

-- Falla si la tabla ya existe
CREATE TABLE "tabla" (...);
```

## 🔄 Flujo de Trabajo Correcto

### En desarrollo (local)

```bash
# 1. Modificar schema.prisma
# 2. Generar migración
npx prisma migrate dev --name nombre_descriptivo

# 3. Verificar que el SQL generado usa IF EXISTS/IF NOT EXISTS
#    (especialmente si la migración hace DROP o ALTER TABLE)
# 4. Si no lo usa, editar el archivo .sql manualmente ANTES del commit
```

### En producción (Vercel)

```bash
# Esto se ejecuta automáticamente en el build:
npx prisma migrate deploy

# NUNCA:
# - prisma db push
# - prisma db reset
# - prisma migrate reset
# - Editar migraciones ya aplicadas
```

## 📝 Reglas de Commit

### Toda migración nueva debe:

1. [ ] Usar `IF EXISTS` / `IF NOT EXISTS` en operaciones destructivas
2. [ ] Tener un nombre descriptivo (`add_user_preferences`, no `migration_1`)
3. [ ] NO borrar objetos que no creó (a menos que sea una migración de limpieza intencional)
4. [ ] Ser revisada en PR antes de mergear a `main`
5. [ ] NUNCA ser editada después de mergear a `main`

## 🧪 Verificación Automática

El script `scripts/validate-migrations.ts` valida que las migraciones nuevas cumplan con las reglas de idempotencia. Se ejecuta en CI y bloquea PRs con migraciones no conformes.

```bash
# Validar manualmente
npx tsx scripts/validate-migrations.ts
```

## ⚠️ Qué hacer si una migración falla en producción

1. **NO hacer `migrate resolve --applied`** sin entender por qué falló
2. **NO crear una nueva migración** para "arreglar" la que falló sin primero marcarla como rolled back
3. **SÍ conectar a la DB** y verificar el estado real con:
   ```sql
   SELECT migration_name, finished_at, rolled_back_at, logs
   FROM "_prisma_migrations"
   ORDER BY started_at DESC;
   ```
4. **SÍ consultar este AGENTS.md** antes de actuar
5. **SÍ pedir autorización** antes de ejecutar cualquier comando de recovery (`migrate resolve`, SQL manual, etc.)
