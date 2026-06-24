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
}));

describe('SettingsClient', () => {
  it('renders the minimum margin input with TrendingUp icon and proper classes', () => {
    render(<SettingsClient initialMinimumMargin={10} />);

    // Check for title
    expect(screen.getByText(/Margen Mínimo Global/i)).toBeInTheDocument();

    // Check for TrendingUp icon (it was added by me)
    expect(screen.getByTestId('icon-trendingup')).toBeInTheDocument();

    // Check for input and its classes
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveClass('pl-9');
    expect(input).toHaveClass('font-mono');
  });
});
