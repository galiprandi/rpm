import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductsClient from './ProductsClient';
import { useSearchParams } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the subcomponents & layout
vi.mock('@/components/public/layout/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="public-layout">{children}</div>,
}));

vi.mock('@/components/public/ProductQuickView', () => ({
  ProductQuickView: ({ product, onClose }: { product: any; onClose: () => void }) =>
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

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Proyector Bi-LED Laser',
    category: 'Iluminación',
    price: 150000,
    image: '💡',
    imageUrl: null,
  },
  {
    id: 'prod-2',
    name: 'Kit Tratamiento Cerámico',
    category: 'Estética',
    price: 85000,
    image: '🛡️',
    imageUrl: null,
  },
  {
    id: 'prod-3',
    name: 'Fenders Off-Road Hilux',
    category: 'Equipamiento',
    price: 120000,
    image: '🏔️',
    imageUrl: null,
  },
];

const mockCategories = ['Todos', 'Iluminación', 'Estética', 'Equipamiento'];

describe('ProductsClient Public Catalog', () => {
  let mockHistoryReplaceState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoryReplaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => null,
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
});
