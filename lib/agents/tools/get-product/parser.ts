import type { Product } from '@/lib/services/productService';
import type { UserRole } from '../../promptComposer';
import type { BotContext } from '../../types';

interface ProductWithPrices extends Partial<Product> {
  priceLists?: Array<{
    name: string;
    isPublic: boolean;
    finalPrice: number;
  }>;
}

/**
 * Filter product fields based on user role
 * Sensitive fields (costs) are only shown to authorized roles
 */
function filterProductByRole(product: Product, role: UserRole): Partial<Product> {
  const baseFields = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    stock: product.stock,
    category: product.category,
    isActive: product.isActive,
  };

  // ADMIN sees everything
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

  // SELLER sees price and supplier but not costs
  if (role === 'SELLER') {
    return {
      ...baseFields,
      replacementCost: product.replacementCost,
      supplier: product.supplier,
      supplierId: product.supplierId,
    };
  }

  // TECHNICIAN and STAFF see only basic fields
  return baseFields;
}

/**
 * Format a single product as Markdown
 */
function formatSingleProduct(product: ProductWithPrices, role: UserRole): string {
  const lines: string[] = [];

  lines.push(`**${product.name}**`);
  lines.push(`*SKU*: ${product.sku || 'N/A'}`);

  if (product.category) {
    lines.push(`*Categoría*: ${product.category.name}`);
  }

  lines.push(`📊 *Stock*: ${product.stock} unidades`);

  // Add price lists (all for ADMIN, only public for others)
  if (product.priceLists && product.priceLists.length > 0) {
    const visibleLists = role === 'ADMIN'
      ? product.priceLists
      : product.priceLists.filter(pl => pl.isPublic);

    if (visibleLists.length > 0) {
      lines.push('');
      lines.push(`💰 *Precios por lista*:`);
      visibleLists.forEach(pl => {
        lines.push(`- **${pl.name}**: $${pl.finalPrice.toLocaleString('es-AR')}`);
      });
    }
  }

  // Add replacementCost if available (ADMIN/SELLER) - this is the default price
  if ('replacementCost' in product && product.replacementCost) {
    lines.push(`💰 *Precio venta*: $${product.replacementCost.toLocaleString('es-AR')}`);
  }

  lines.push('');

  // Add description if available
  if (product.description) {
    lines.push(`> ℹ️ ${product.description}`);
    lines.push('');
  }

  // Add supplier info for ADMIN/SELLER
  if (product.supplier) {
    lines.push(`🏭 *Proveedor*: ${product.supplier.name}`);
    lines.push('');
  }

  // Add cost info for ADMIN only
  if ('costPrice' in product && product.costPrice !== undefined) {
    lines.push(`💵 *Costo*: $${product.costPrice.toLocaleString('es-AR')}`);
    lines.push('');
  }

  // Add last movement date for ADMIN
  if ('lastMovementAt' in product && product.lastMovementAt) {
    const date = new Date(product.lastMovementAt);
    lines.push(`📅 *Último movimiento*: ${date.toLocaleDateString('es-AR')}`);
    lines.push('');
  }

  // Add location for ADMIN
  if ('location' in product && product.location) {
    lines.push(`📍 *Ubicación*: ${product.location}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format multiple products as Markdown (list format)
 */
function formatMultipleProducts(products: ProductWithPrices[]): string {
  const lines: string[] = [];

  lines.push(`Encontré ${products.length} productos:`);
  lines.push('');

  products.forEach((product, index) => {
    const price = 'replacementCost' in product && product.replacementCost
      ? ` - *$${product.replacementCost.toLocaleString('es-AR')}*`
      : '';

    lines.push(`${index + 1}. **${product.name}** (*SKU*: ${product.sku || 'N/A'})`);
    lines.push(`   📊 Stock: ${product.stock} unidades${price}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Add contextual message based on current URL
 */
function addContextualMessage(markdown: string, context?: BotContext): string {
  if (!context) return markdown;

  const { currentUrl } = context;
  
  // If user is on products page, offer to open detail
  if (currentUrl.path.includes('/products')) {
    return `${markdown}\n\n> Viendo que estás en la lista de productos, ¿querés que te abra el detalle de alguno?`;
  }

  return markdown;
}

/**
 * Convert products to Markdown format with role-based filtering
 * @param products - Array of products to format
 * @param role - User role for field filtering
 * @param context - Optional bot context for contextual messages
 * @param priceLists - Optional price lists data for each product
 * @returns Formatted Markdown string
 */
export function productToMarkdown(
  products: Product[],
  role: UserRole,
  context?: BotContext,
  priceLists?: Map<string, Array<{ name: string; isPublic: boolean; finalPrice: number }>>
): string {
  // Filter products by role (remove sensitive fields)
  const filteredProducts = products.map(p => filterProductByRole(p, role));

  // Limit to 5 products
  const limitedProducts = filteredProducts.slice(0, 5);

  // Attach price lists to products if provided
  const productsWithPrices: ProductWithPrices[] = limitedProducts.map(p => ({
    ...p,
    priceLists: p.id ? priceLists?.get(p.id) : undefined,
  }));

  // Format based on number of products
  let markdown: string;
  if (productsWithPrices.length === 1) {
    markdown = formatSingleProduct(productsWithPrices[0], role);
  } else {
    markdown = formatMultipleProducts(productsWithPrices);
  }

  // Add contextual message if applicable
  markdown = addContextualMessage(markdown, context);

  return markdown;
}
