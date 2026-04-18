import { prisma } from '@/lib/prisma';
import { Product } from './productService';
import { UserRole } from '@/lib/agents/utils/promptComposer';
import { BotContext } from '@/lib/agents/utils/types';

export interface SearchServiceInput {
  query: string;
  role: UserRole;
  context?: BotContext;
}

export interface SearchResult {
  products: Partial<Product>[];
  total: number;
  searchType: 'exact' | 'category' | 'none';
}

/**
 * Search service with fuzzy fallback logic
 * Used internally by get_product tool
 */
export async function searchProducts(
  input: SearchServiceInput
): Promise<string> {
  const { query, role } = input;

  // 1. Try exact search first
  const exactResult = await fuzzySearch(query);
  if (exactResult.products.length >= 2) {
    return searchResultsToMarkdown({
      products: exactResult.products,
      total: exactResult.total,
      searchType: 'exact',
    }, role, query);
  }

  // 2. Fallback to category search
  const categoryResult = await categorySearch(query);
  if (categoryResult.products.length > 0) {
    return searchResultsToMarkdown({
      products: categoryResult.products,
      total: categoryResult.total,
      searchType: 'category',
    }, role, query);
  }

  // 3. No results found
  return searchResultsToMarkdown({
    products: [],
    total: 0,
    searchType: 'none',
  }, role, query);
}

/**
 * Fuzzy search in name, barcode, SKU (like getProducts but limited)
 */
async function fuzzySearch(query: string): Promise<SearchResult> {
  const searchLower = query.toLowerCase();
  
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { barcode: { contains: searchLower, mode: 'insensitive' } },
        { name: { contains: searchLower, mode: 'insensitive' } },
        { sku: { contains: searchLower, mode: 'insensitive' } },
      ],
    },
    include: {
      category: true,
      supplier: { select: { id: true, name: true } },
    },
    take: 10,
  });

  return {
    products: products.map(transformProduct),
    total: products.length,
    searchType: 'exact',
  };
}

/**
 * Search by category when fuzzy fails
 */
async function categorySearch(query: string): Promise<SearchResult> {
  const searchLower = query.toLowerCase();
  
  // Find categories matching the query
  const categories = await prisma.category.findMany({
    where: {
      name: { contains: searchLower, mode: 'insensitive' },
    },
    take: 5,
  });

  if (categories.length === 0) {
    return { products: [], total: 0, searchType: 'category' };
  }

  // Get products from matching categories
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: { in: categories.map(c => c.id) },
    },
    include: {
      category: true,
      supplier: { select: { id: true, name: true } },
    },
    take: 10,
  });

  return {
    products: products.map(transformProduct),
    total: products.length,
    searchType: 'category',
  };
}

/**
 * Transform Prisma product to Product type
 */
function transformProduct(product: {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  stock: number;
  costPrice: { toNumber: () => number } | number;
  replacementCost: { toNumber: () => number } | number;
  category: { id: string; name: string; color: string | null } | null;
  supplier: { id: string; name: string } | null;
  location: string | null;
  lastMovementAt: Date | null;
}): Partial<Product> {
  const cost = typeof product.costPrice === 'object' && product.costPrice?.toNumber
    ? product.costPrice.toNumber()
    : Number(product.costPrice) || 0;
  const replacement = typeof product.replacementCost === 'object' && product.replacementCost?.toNumber
    ? product.replacementCost.toNumber()
    : Number(product.replacementCost) || 0;

  return {
    id: product.id,
    sku: product.sku || '',
    name: product.name,
    description: product.description,
    stock: product.stock,
    costPrice: cost,
    replacementCost: replacement,
    category: product.category,
    supplier: product.supplier,
    location: product.location,
    lastMovementAt: product.lastMovementAt,
  };
}

/**
 * Format search results as Markdown with role filtering
 */
function searchResultsToMarkdown(
  result: SearchResult,
  role: UserRole,
  query: string
): string {
  const filteredProducts = result.products.map(p => filterProductByRole(p, role));
  
  const lines: string[] = [];
  
  lines.push(`## 🔍 Resultados de búsqueda: "${query}"`);
  lines.push('');
  
  if (filteredProducts.length === 0) {
    lines.push('No encontré productos.');
    lines.push('');
    lines.push('💡 **Tip**: Probá con:');
    lines.push('- El nombre exacto del producto');
    lines.push('- Código de barras o SKU');
    lines.push('- Términos más generales');
    return lines.join('\n');
  }
  
  lines.push(`Encontré ${filteredProducts.length} productos (${result.searchType}):`);
  
  // Add message if showing partial results
  if (result.total > filteredProducts.length) {
    lines.push(`(Mostrando ${filteredProducts.length} de ${result.total} encontrados)`);
  }
  
  lines.push('');
  
  filteredProducts.forEach((product, index) => {
    const price = 'replacementCost' in product && product.replacementCost
      ? `$${(product.replacementCost as number).toLocaleString('es-AR')}`
      : '$---';
    
    lines.push(`${index + 1}. ${product.name} - ${product.stock}un - ${price}`);
  });
  
  lines.push('---');
  lines.push('💡 **Tip**: Si no encontrás lo que buscás, probá con:');
  lines.push('- El nombre exacto del producto');
  lines.push('- Código de barras o SKU');
  lines.push('- Términos más generales (ej: "aceite" en lugar de "aceite de motor 5w-30")');
  
  return lines.join('\n');
}

/**
 * Filter product fields by role
 */
function filterProductByRole(product: Partial<Product>, role: UserRole): Partial<Product> {
  const baseFields = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    stock: product.stock,
    category: product.category,
    isActive: product.isActive,
  };

  if (role === 'ADMIN') {
    return {
      ...baseFields,
      costPrice: product.costPrice,
      replacementCost: product.replacementCost,
      supplier: product.supplier,
      supplierId: product.supplierId,
      location: product.location,
      lastMovementAt: product.lastMovementAt,
    };
  }

  if (role === 'SELLER') {
    return {
      ...baseFields,
      replacementCost: product.replacementCost,
      supplier: product.supplier,
    };
  }

  return baseFields;
}
