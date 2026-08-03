import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ProductQuickView } from './ProductQuickView';
import { ServiceQuickView } from './ServiceQuickView';
import { ProjectQuickView } from './ProjectQuickView';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Wrench } from 'lucide-react';
import type { PublicCatalogProduct } from '@/lib/services/publicCatalogService';
import type { PublicService } from '@/lib/constants/services';
import type { GalleryItem } from './AboutClient';

// Mock dialog component content/overlay for vitest jsdom environment
vi.mock('@/components/ui/dialog', () => {
  return {
    Dialog: ({ children, open, onOpenChange }: any) => {
      if (!open) return null;
      return <div role="dialog" data-state="open">{children}</div>;
    },
    DialogContent: ({ children, className }: any) => {
      return <div className={className}>{children}</div>;
    },
    DialogHeader: ({ children, className }: any) => {
      return <div className={className}>{children}</div>;
    },
    DialogTitle: ({ children, className }: any) => {
      return <h2 className={className}>{children}</h2>;
    },
  };
});

const mockProduct: PublicCatalogProduct = {
  id: 'prod-123',
  sku: 'BILED-PRO',
  name: 'Kit Proyectores Bi-LED',
  category: 'Iluminación',
  price: 150000,
  image: '💡',
  imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935',
  description: 'Kit completo de proyectores de alta gama con tecnología Bi-LED.',
  features: ['6000K Blanco Frío', 'Alineación precisa', 'Mayor haz de luz'],
  isActive: true,
};

const mockService: PublicService = {
  id: 'serv-123',
  title: 'Instalación Bi-LED',
  icon: Wrench,
  bg: 'bg-zinc-900',
  gridClassName: 'col-span-1',
  shortDescription: 'Instalación premium con proyectores láser.',
  fullDescription: 'Realizamos una calibración láser de precisión para tus faros.',
  benefits: ['Mejora de visibilidad nocturna', 'No encandila al tránsito opuesto'],
};

const mockProject: GalleryItem = {
  id: 'proj-123',
  year: '2022',
  title: 'Hito Iluminación',
  category: 'Iluminación',
  description: 'Nuestra especialización de iluminación de vanguardia.',
  details: ['Calibración láser', 'Instalación limpia'],
  visualKey: '💡',
};

describe('Quick View Dialogs Focus Accessibility', () => {
  it('focuses the primary action button in ProductQuickView when opened', async () => {
    render(
      <TooltipProvider>
        <ProductQuickView product={mockProduct} onClose={() => {}} />
      </TooltipProvider>
    );

    const primaryBtn = screen.getByRole('button', { name: /consultar por whatsapp sobre/i });
    expect(primaryBtn).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(primaryBtn);
    });
  });

  it('focuses the primary action button in ServiceQuickView when opened', async () => {
    render(
      <TooltipProvider>
        <ServiceQuickView service={mockService} onClose={() => {}} />
      </TooltipProvider>
    );

    const primaryBtn = screen.getByRole('button', { name: /consultar por whatsapp sobre/i });
    expect(primaryBtn).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(primaryBtn);
    });
  });

  it('focuses the primary action button in ProjectQuickView when opened', async () => {
    render(
      <TooltipProvider>
        <ProjectQuickView project={mockProject} onClose={() => {}} />
      </TooltipProvider>
    );

    const primaryBtn = screen.getByRole('button', { name: /consultar por whatsapp sobre/i });
    expect(primaryBtn).toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(primaryBtn);
    });
  });
});
