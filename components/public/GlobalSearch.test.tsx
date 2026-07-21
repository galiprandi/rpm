import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSearch } from './GlobalSearch';
import React from 'react';

// Mock dialog component to render directly when open
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
}));

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('GlobalSearch', () => {
  const mockOnClose = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockPush.mockClear();
    // Default fetch mock returns empty catalog
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders nothing when closed', () => {
    render(<GlobalSearch isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });

  it('renders helper prompt when open and search query is empty', async () => {
    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByText('¿Qué estás buscando hoy?')).toBeInTheDocument();

    // Wait for the async fetch state update to settle to avoid act() warning
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('filters and displays services and products based on input', async () => {
    // Override fetch for this specific test
    const mockProducts = [
      {
        id: 'p1',
        sku: 'SKU-LIVE-001',
        name: 'Live Super Laser Beam 5000',
        category: 'Iluminación',
        price: 99000,
        image: 'L',
        imageUrl: '/images/laser.jpg',
        description: 'Super bright laser beam for test',
      },
    ];

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Buscar productos, servicios...');
    fireEvent.change(input, { target: { value: 'Live Super' } });

    // Wait for dynamic products to fetch and be queried
    await waitFor(() => {
      expect(screen.getByText('Live Super Laser Beam 5000')).toBeInTheDocument();
    });

    expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
  });

  it('reverts seamlessly to static featuredProducts when api fetch fails', async () => {
    // Override fetch to fail
    (globalThis.fetch as any).mockRejectedValue(new Error('Network Error'));

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Buscar productos, servicios...');
    // "Barra LED Ultra-Beam" is one of the static featuredProducts
    fireEvent.change(input, { target: { value: 'Ultra-Beam' } });

    await waitFor(() => {
      expect(screen.getByText('Barra LED Ultra-Beam 42"')).toBeInTheDocument();
    });

    expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
  });

  it('handles item selections and pushes to correct routes', async () => {
    const mockProducts = [
      {
        id: 'p-select',
        sku: 'SKU-SELECT',
        name: 'Clickable Live Product',
        category: 'Estética',
        price: 25000,
        image: 'C',
        imageUrl: null,
        description: 'This is clickable',
      },
    ];

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Buscar productos, servicios...');
    fireEvent.change(input, { target: { value: 'Clickable' } });

    await waitFor(() => {
      expect(screen.getByText('Clickable Live Product')).toBeInTheDocument();
    });

    const productBtn = screen.getByText('Clickable Live Product').closest('button');
    expect(productBtn).toBeInTheDocument();
    fireEvent.click(productBtn!);

    expect(mockPush).toHaveBeenCalledWith('/productos?product=p-select');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
