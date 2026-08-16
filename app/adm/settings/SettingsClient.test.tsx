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
  Wifi: () => <div data-testid="icon-wifi" />,
  KeyRound: () => <div data-testid="icon-keyround" />,
  Upload: () => <div data-testid="icon-upload" />,
  Trash2: () => <div data-testid="icon-trash2" />,
  CheckCircle2: () => <div data-testid="icon-checkcircle2" />,
  AlertCircle: () => <div data-testid="icon-alertcircle" />,
  AlertTriangle: () => <div data-testid="icon-alerttriangle" />,
  XCircle: () => <div data-testid="icon-xcircle" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  Clock: () => <div data-testid="icon-clock" />,
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

vi.mock('date-fns', () => ({
  format: () => '01/01/2024',
  differenceInDays: () => 45,
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('SettingsClient', () => {
  const initialAfipSettings = {
    cuit: '30123456789',
    puntoVenta: '1',
    responsable: 'RI',
    production: false,
  };

  const certHealthReady = {
    state: 'ready' as const,
    uploadedAt: '2024-01-01T12:00:00.000Z',
    expiresAt: '2026-01-01T00:00:00.000Z',
    detail: 'Certificado configurado y válido.',
  };

  const certHealthMissing = {
    state: 'missing' as const,
    uploadedAt: null,
    expiresAt: null,
    detail: 'No hay certificado subido. El sistema opera en modo simulación.',
  };

  const certHealthExpired = {
    state: 'expired' as const,
    uploadedAt: '2022-01-01T00:00:00.000Z',
    expiresAt: '2023-01-01T00:00:00.000Z',
    detail: 'Certificado vencido el 01/01/2023.',
  };

  const certHealthNoMasterKey = {
    state: 'no-master-key' as const,
    uploadedAt: null,
    expiresAt: null,
    detail: 'Falta la variable de entorno AFIP_CERT_MASTER_KEY',
  };

  const certHealthInvalid = {
    state: 'invalid' as const,
    uploadedAt: '2024-01-01T00:00:00.000Z',
    expiresAt: null,
    detail: 'No se pudo descifrar el certificado.',
  };

  it('renders AFIP settings section', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthMissing}
      />
    );

    expect(screen.getByText(/Configuración Fiscal \(AFIP\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('30123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('renders the minimum margin input with TrendingUp icon and proper classes', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthMissing}
      />
    );

    expect(screen.getByText(/Margen Mínimo Global/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-trendingup')).toBeInTheDocument();

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveClass('pl-9');
    expect(input).toHaveClass('font-mono');
  });

  it('renders AFIP inputs with proper padding and icons', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthMissing}
      />
    );

    const cuitInput = screen.getByDisplayValue('30123456789');
    expect(cuitInput).toHaveClass('pl-10');
    expect(screen.getByTestId('icon-fingerprint')).toBeInTheDocument();

    const pvInput = screen.getByDisplayValue('1');
    expect(pvInput).toHaveClass('pl-10');
    expect(screen.getByTestId('icon-hash')).toBeInTheDocument();
  });

  it('shows "Sin certificado" when state is missing', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthMissing}
      />
    );

    expect(screen.getByText(/Sin certificado/i)).toBeInTheDocument();
    expect(screen.getByText(/Subir certificado/i)).toBeInTheDocument();
  });

  it('shows "Certificado configurado" when state is ready', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthReady}
      />
    );

    expect(screen.getByText(/Certificado configurado/i)).toBeInTheDocument();
    expect(screen.getByText(/Reemplazar/i)).toBeInTheDocument();
    expect(screen.getByText(/Eliminar/i)).toBeInTheDocument();
  });

  it('shows "Certificado vencido" when state is expired', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthExpired}
      />
    );

    expect(screen.getAllByText(/Certificado vencido/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Renovar certificado/i)).toBeInTheDocument();
  });

  it('shows master key message when state is no-master-key', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthNoMasterKey}
      />
    );

    expect(screen.getByText(/Modo simulación \(sin master key\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AFIP_CERT_MASTER_KEY/i)).toBeInTheDocument();
  });

  it('shows "Certificado inválido o corrupto" when state is invalid', () => {
    render(
      <SettingsClient
        initialMinimumMargin={10}
        initialAfipSettings={initialAfipSettings}
        initialCertHealth={certHealthInvalid}
      />
    );

    expect(screen.getByText(/Certificado inválido o corrupto/i)).toBeInTheDocument();
    expect(screen.getByText(/Reemplazar/i)).toBeInTheDocument();
  });
});
