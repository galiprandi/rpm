import { describe, it, expect } from 'vitest';
import { productToMarkdown } from './parser';
import type { Product } from '@/lib/services/productService';

describe('productToMarkdown', () => {
  const mockProduct: Product = {
    id: 'prod-1',
    sku: 'POL-3M-35',
    name: 'Polarizado 3M CS35',
    description: 'Película polarizada 3M serie CS35, 35% transmisión de luz.',
    barcode: '1234567890123',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Polarizados',
      color: '#FF0000',
    },
    costPrice: 15000,
    replacementCost: 45000,
    stock: 12,
    minStock: 5,
    isLowStock: false,
    margin: 200,
    supplierId: 'sup-1',
    supplier: {
      id: 'sup-1',
      name: '3M Argentina',
    },
    location: 'A-12',
    lastMovementAt: new Date('2026-04-01'),
    isActive: true,
  };

  const mockContext = {
    role: 'ADMIN' as const,
    currentUrl: {
      path: '/adm/products',
      search: '?page=1',
      hash: '',
    },
    userId: 'user-1',
  };

  it('filters sensitive fields for TECHNICIAN', () => {
    const markdown = productToMarkdown([mockProduct], 'TECHNICIAN');
    
    // Should NOT show cost fields
    expect(markdown).not.toContain('Costo');
    expect(markdown).not.toContain('$15,000');
    expect(markdown).not.toContain('$45,000');
    
    // Should NOT show supplier
    expect(markdown).not.toContain('Proveedor');
    expect(markdown).not.toContain('3M Argentina');
    
    // SHOULD show basic fields
    expect(markdown).toContain('Polarizado 3M CS35');
    expect(markdown).toContain('**SKU**: POL-3M-35');
    expect(markdown).toContain('**Stock disponible**: 12 unidades');
    expect(markdown).toContain('**Categoría**: Polarizados');
  });

  it('shows all fields for ADMIN', () => {
    const markdown = productToMarkdown([mockProduct], 'ADMIN');
    
    // Should show cost fields
    expect(markdown).toContain('Costo');
    expect(markdown).toContain('$15.000');
    expect(markdown).toContain('**Precio venta**: $45.000');
    
    // Should show supplier
    expect(markdown).toContain('Proveedor');
    expect(markdown).toContain('3M Argentina');
    
    // Should show basic fields
    expect(markdown).toContain('Polarizado 3M CS35');
    expect(markdown).toContain('**SKU**: POL-3M-35');
  });

  it('shows price and supplier for SELLER but not costs', () => {
    const markdown = productToMarkdown([mockProduct], 'SELLER');
    
    // Should NOT show cost
    expect(markdown).not.toContain('Costo');
    expect(markdown).not.toContain('$15.000');
    
    // Should show price (replacementCost as sale price)
    expect(markdown).toContain('**Precio venta**: $45.000');
    
    // Should show supplier
    expect(markdown).toContain('Proveedor');
    expect(markdown).toContain('3M Argentina');
  });

  it('shows only basic fields for STAFF', () => {
    const markdown = productToMarkdown([mockProduct], 'STAFF');
    
    // Should NOT show cost
    expect(markdown).not.toContain('Costo');
    expect(markdown).not.toContain('$15,000');
    
    // Should NOT show price
    expect(markdown).not.toContain('Precio venta');
    expect(markdown).not.toContain('$45,000');
    
    // Should NOT show supplier
    expect(markdown).not.toContain('Proveedor');
    expect(markdown).not.toContain('3M Argentina');
    
    // SHOULD show basic fields
    expect(markdown).toContain('Polarizado 3M CS35');
    expect(markdown).toContain('**Stock disponible**: 12 unidades');
    expect(markdown).toContain('**SKU**: POL-3M-35');
  });

  it('returns max 5 products with message', () => {
    const products: Product[] = Array.from({ length: 6 }, (_, i) => ({
      ...mockProduct,
      id: `prod-${i}`,
      sku: `SKU-${i}`,
      name: `Product ${i}`,
    }));

    const markdown = productToMarkdown(products, 'ADMIN');
    
    // Should mention 5 products found
    expect(markdown).toContain('Encontré 5 productos');
    
    // Should have refinement message
    expect(markdown).toContain('refiná la búsqueda');
    expect(markdown).toContain('search_products');
  });

  it('formats single product with proper markdown', () => {
    const markdown = productToMarkdown([mockProduct], 'ADMIN');
    
    // Should have H2 title
    expect(markdown).toContain('## Polarizado 3M CS35');
    
    // Should have bold fields
    expect(markdown).toContain('**SKU**');
    expect(markdown).toContain('**Categoría**');
    expect(markdown).toContain('**Stock disponible**');
    
    // Should have blockquote for description
    expect(markdown).toContain('> Película polarizada');
    
    // Should have separator
    expect(markdown).toContain('---');
  });

  it('includes contextual message for /products URL', () => {
    const markdown = productToMarkdown([mockProduct], 'ADMIN', mockContext);
    
    // Should have contextual message
    expect(markdown).toContain('Viendo que estás en la lista de productos');
    expect(markdown).toContain('¿querés que te abra el detalle de alguno?');
  });

  it('does not include contextual message for other URLs', () => {
    const otherContext = {
      ...mockContext,
      currentUrl: {
        ...mockContext.currentUrl,
        path: '/adm/dashboard',
      },
    };

    const markdown = productToMarkdown([mockProduct], 'ADMIN', otherContext);
    
    // Should NOT have contextual message
    expect(markdown).not.toContain('Viendo que estás en la lista de productos');
  });

  it('handles products without optional fields', () => {
    const minimalProduct: Product = {
      ...mockProduct,
      description: null,
      supplier: null,
      supplierId: null,
      location: null,
      lastMovementAt: null,
    };

    const markdown = productToMarkdown([minimalProduct], 'ADMIN');
    
    // Should still format correctly
    expect(markdown).toContain('## Polarizado 3M CS35');
    expect(markdown).toContain('**SKU**: POL-3M-35');
    
    // Should not show empty fields
    expect(markdown).not.toContain('Proveedor:');
  });

  it('handles products without SKU', () => {
    const noSkuProduct: Product = {
      ...mockProduct,
      sku: '',
    };

    const markdown = productToMarkdown([noSkuProduct], 'ADMIN');
    
    // Should show N/A for missing SKU
    expect(markdown).toContain('**SKU**: N/A');
  });

  it('formats multiple products as list', () => {
    const products: Product[] = [
      { ...mockProduct, id: 'prod-1', sku: 'SKU-1', name: 'Product 1' },
      { ...mockProduct, id: 'prod-2', sku: 'SKU-2', name: 'Product 2' },
      { ...mockProduct, id: 'prod-3', sku: 'SKU-3', name: 'Product 3' },
    ];

    const markdown = productToMarkdown(products, 'ADMIN');
    
    // Should show numbered list
    expect(markdown).toContain('**1. Product 1**');
    expect(markdown).toContain('**2. Product 2**');
    expect(markdown).toContain('**3. Product 3**');
    
    // Should show count
    expect(markdown).toContain('Encontré 3 productos');
  });
});
