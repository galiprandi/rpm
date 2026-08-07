import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductsClient from './ProductsClient';
import { useSearchParams } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { PublicCatalogProduct } from '@/lib/services/publicCatalogService';

// Mock the subcomponents & layout
vi.mock('@/components/public/layout/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="public-layout">{children}</div>,
}));

vi.mock('@/components/public/ProductQuickView', () => ({
  ProductQuickView: ({ product, onClose }: { product: PublicCatalogProduct | null; onClose: () => void }) =>
    product ? (
      <div data-testid="quick-view">
        <span>{product.name} - Quick View</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const mockProducts: PublicCatalogProduct[] = [
  {
    id: 'prod-1',
    sku: 'SKU-001',
    name: 'Proyector Bi-LED Laser',
    category: 'Iluminación',
    price: 150000,
    image: '💡',
    imageUrl: null,
    description: 'Description 1',
    features: [],
  },
  {
    id: 'prod-2',
    sku: 'SKU-002',
    name: 'Kit Tratamiento Cerámico',
    category: 'Estética',
    price: 85000,
    image: '🛡️',
    imageUrl: null,
    description: 'Description 2',
    features: [],
  },
  {
    id: 'prod-3',
    sku: 'SKU-003',
    name: 'Fenders Off-Road Hilux',
    category: 'Equipamiento',
    price: 120000,
    image: '🏔️',
    imageUrl: null,
    description: 'Description 3',
    features: [],
  },
];

const mockCategories = ['Todos', 'Iluminación', 'Estética', 'Equipamiento'];

describe('ProductsClient Public Catalog', () => {
  let mockHistoryReplaceState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoryReplaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    (useSearchParams as any).mockReturnValue({
      get: () => null,
    });
  });

  it('renders products and default category header descriptions correctly', () => {
    render(
      <TooltipProvider>
        <ProductsClient initialProducts={mockProducts} initialCategories={mockCategories} />
      </TooltipProvider>
    );

    // Verify header title structure gets rendered (e.g. text split over line breaks)
    expect(screen.getByText(/EQUIPAMIENTO/)).toBeInTheDocument();
    expect(screen.getByText(/SUPERIOR/)).toBeInTheDocument();

    // Check default description
    expect(
      screen.getByText(
        'Explorá nuestra colección completa de equipamiento premium para elevar el rendimiento, la seguridad y el diseño de tu vehículo.'
      )
    ).toBeInTheDocument();

    // Verify product cards render
    expect(screen.getByText('Proyector Bi-LED Laser')).toBeInTheDocument();
    expect(screen.getByText('Kit Tratamiento Cerámico')).toBeInTheDocument();
  });

  it('filters products by category selection and updates URL query parameters', () => {
    render(
      <TooltipProvider>
        <ProductsClient initialProducts={mockProducts} initialCategories={mockCategories} />
      </TooltipProvider>
    );

    // Click 'Iluminación' category button
    const ilumBtn = screen.getByRole('button', { name: /Iluminación/i });
    fireEvent.click(ilumBtn);

    // Verify correct description is shown
    expect(
      screen.getByText(
        'Sistemas Bi-LED, luces auxiliares y proyectores de alta potencia para una visibilidad nocturna superior y de estándar profesional.'
      )
    ).toBeInTheDocument();

    // Only 'Proyector Bi-LED Laser' should be displayed
    expect(screen.getByText('Proyector Bi-LED Laser')).toBeInTheDocument();
    expect(screen.queryByText('Kit Tratamiento Cerámico')).not.toBeInTheDocument();

    // Check URL state sync
    expect(mockHistoryReplaceState).toHaveBeenCalled();
  });

  it('initializes category and search queries from URL parameters correctly', () => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => {
        if (key === 'category') return 'Estética';
        if (key === 'q') return 'Cerámico';
        return null;
      },
    });

    render(
      <TooltipProvider>
        <ProductsClient initialProducts={mockProducts} initialCategories={mockCategories} />
      </TooltipProvider>
    );

    // Description of 'Estética' category should render
    expect(
      screen.getByText(
        'Tratamientos cerámicos, PPF (Paint Protection Film) y acabados detallados para conservar el valor y brillo original de tu vehículo.'
      )
    ).toBeInTheDocument();

    // Verification of filters: 'Kit Tratamiento Cerámico' is present
    expect(screen.getByText('Kit Tratamiento Cerámico')).toBeInTheDocument();
    expect(screen.queryByText('Proyector Bi-LED Laser')).not.toBeInTheDocument();
  });

  it('displays suggestions in empty state and updates search query on click', () => {
    render(
      <TooltipProvider>
        <ProductsClient initialProducts={mockProducts} initialCategories={mockCategories} />
      </TooltipProvider>
    );

    const searchInput = screen.getByPlaceholderText('Buscar producto...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    // Zero search results UI
    expect(screen.getByText('No se encontraron productos')).toBeInTheDocument();

    // Suggestion chips should be displayed
    const suggestionChip = screen.getByRole('button', { name: /✨ PPF/i });
    expect(suggestionChip).toBeInTheDocument();

    // Click suggestion chip
    fireEvent.click(suggestionChip);

    // Input should change
    expect(searchInput).toHaveValue('PPF');
  });

  it('provides a highly accessible and interactive card container with focus/click/key capabilities', () => {
    render(
      <TooltipProvider>
        <ProductsClient initialProducts={mockProducts} initialCategories={mockCategories} />
      </TooltipProvider>
    );

    // Find the product card for "Proyector Bi-LED Laser"
    const cardElement = screen.getByRole('button', { name: /Ver detalles de Proyector Bi-LED Laser/i });
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveAttribute('tabIndex', '0');

    // Confirm that the "DETALLES" text is present inside the card, but it is not a button tag
    const detallesTextList = screen.getAllByText(/DETALLES/i);
    expect(detallesTextList.length).toBeGreaterThan(0);
    expect(detallesTextList[0]).toBeInTheDocument();
    expect(detallesTextList[0].tagName).not.toBe('BUTTON');

    // Quick View modal should not be open yet
    expect(screen.queryByTestId('quick-view')).not.toBeInTheDocument();

    // Click the entire card container
    fireEvent.click(cardElement);

    // It should trigger opening the product view modal
    expect(screen.getByTestId('quick-view')).toBeInTheDocument();
    expect(screen.getByText('Proyector Bi-LED Laser - Quick View')).toBeInTheDocument();

    // Close the modal
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('quick-view')).not.toBeInTheDocument();

    // Focus and press 'Enter' on the card
    fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
    expect(screen.getByTestId('quick-view')).toBeInTheDocument();

    // Close again
    const closeBtn2 = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn2);

    // Focus and press 'Space' on the card
    fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
    expect(screen.getByTestId('quick-view')).toBeInTheDocument();
  });
});
