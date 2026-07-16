import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsClient from './SettingsClient';
import React from 'react';

// Mock components and hooks
vi.mock('@/components/adm/Header', () => ({
  Header: () => <div data-testid="header" />
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />
}));
vi.mock('@/components/settings/SettingItem', () => ({
  SettingItem: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  )
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Palette: () => <div data-testid="icon-palette" />,
  Percent: () => <div data-testid="icon-percent" />,
  TrendingUp: () => <div data-testid="icon-trendingup" />,
  CreditCard: () => <div data-testid="icon-creditcard" />,
  ChevronRight: () => <div data-testid="icon-chevronright" />,
  Building2: () => <div data-testid="icon-building2" />,
  ShieldCheck: () => <div data-testid="icon-shieldcheck" />,
  Globe: () => <div data-testid="icon-globe" />,
  FileKey: () => <div data-testid="icon-filekey" />,
  Hash: () => <div data-testid="icon-hash" />,
  Fingerprint: () => <div data-testid="icon-fingerprint" />,
  MapPin: () => <div data-testid="icon-mappin" />,
  UserCheck: () => <div data-testid="icon-usercheck" />,
  FolderOpen: () => <div data-testid="icon-folderopen" />,
  Wifi: () => <div data-testid="icon-wifi" />,
}));

// Mock Switch and Select
vi.mock('@/components/ui/switch', () => ({
  Switch: () => <div data-testid="switch" />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <div data-testid="select-value" />,
}));

describe('SettingsClient', () => {
  const initialAfipSettings = {
    cuit: '30123456789',
    puntoVenta: '1',
    responsable: 'RI',
    production: false,
    certPath: '/certs/afip.p12',
  };

  it('renders AFIP settings section', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
      />
    );

    expect(screen.getByText(/Configuración Fiscal \(AFIP\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('30123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/certs/afip.p12')).toBeInTheDocument();
  });

  it('renders the minimum margin input with TrendingUp icon and proper classes', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
      />
    );

    // Check for title
    expect(screen.getByText(/Margen Mínimo Global/i)).toBeInTheDocument();

    // Check for TrendingUp icon
    expect(screen.getByTestId('icon-trendingup')).toBeInTheDocument();

    // Check for input and its classes
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveClass('pl-9');
    expect(input).toHaveClass('font-mono');
  });

  it('renders AFIP inputs with proper padding and icons', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
      />
    );

    const cuitInput = screen.getByDisplayValue('30123456789');
    expect(cuitInput).toHaveClass('pl-10');
    expect(screen.getByTestId('icon-fingerprint')).toBeInTheDocument();

    const pvInput = screen.getByDisplayValue('1');
    expect(pvInput).toHaveClass('pl-10');
    expect(screen.getByTestId('icon-hash')).toBeInTheDocument();

    const certInput = screen.getByDisplayValue('/certs/afip.p12');
    expect(certInput).toHaveClass('pl-10');
    expect(screen.getByTestId('icon-filekey')).toBeInTheDocument();
  });
});
