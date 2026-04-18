import { tool } from 'ai';
import { z } from 'zod';
import { executeGetProduct } from './execute';

// TODO: Load from description.md - Turbopack doesn't support .md imports
// Temporary hardcoded description to get bot working
const description = `Busca y devuelve información de productos del catálogo según EAN, SKU o nombre.

## Uso

Usa esta tool cuando el usuario necesite:
- Consultar información de un producto específico
- Buscar productos por código (EAN/SKU) o nombre
- Ver stock, precios o detalles de productos

## Parámetros

- query (string, required): Código EAN, SKU o nombre del producto a buscar
- context (BotContext, optional): Inyectado automáticamente - contiene rol del usuario y URL actual

## Comportamiento

1. Búsqueda exacta primero: Intenta encontrar por EAN o SKU exacto
2. Fallback fuzzy: Si no hay resultados exactos, ejecuta búsqueda por nombre (fuzzy)
3. Límite de resultados: Máximo 5 productos
4. Filtro por rol: Los campos sensibles (costos) solo se muestran a roles autorizados
5. Singularización OBLIGATORIA de queries: ANTES de invocar esta tool, SIEMPRE singulariza la query del usuario:
   - "baterías" → "batería"
   - "aceites" → "aceite"
   - "pastillas" → "pastilla"
   - "filtros" → "filtro"
   
   IMPORTANTE: Los nombres de productos en la base de datos están en singular. Si el usuario usa plural, singulariza antes de pasar el parámetro query.

## Salida

Devuelve información en formato Markdown estructurado con:
- Datos del producto (SKU, nombre, categoría, stock, precio)
- Campos adicionales según rol (costos, proveedor, etc.)
- Mensajes contextuales según cantidad de resultados y URL actual`;

/**
 * get_product tool implementation
 * Searches for products by EAN, SKU, or name and returns formatted Markdown
 */
export const getProductTool = tool({
  description,
  inputSchema: z.object({
    query: z.string().describe('EAN, SKU or product name to search for'),
  }),
  execute: async ({ query }) => {
    return executeGetProduct({ query });
  },
});
