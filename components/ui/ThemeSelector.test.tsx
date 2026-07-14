import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeSelector } from './ThemeSelector';
import React from 'react';

// Mock useTheme hook
const setThemeMock = vi.fn();
vi.mock('@/components/ui/ThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: setThemeMock,
  }),
}));

// Mock Select component since it uses Radix UI and can be complex to test in JSDOM
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange('dark')}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className, 'aria-label': ariaLabel }: any) => (
    <button className={className} aria-label={ariaLabel}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid={`item-${value}`}>{children}</div>,
}));

describe('ThemeSelector', () => {
  it('renders with the correct icon and aria-label', () => {
    render(<ThemeSelector />);

    // Check for the Palette icon (absolute positioned)
    // In our mock, we don't mock lucide-react so it will render the SVG
    // But we can check for the aria-label on the trigger
    const trigger = screen.getByLabelText('Seleccionar tema');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('pl-9');
  });

  it('contains theme options', () => {
    render(<ThemeSelector />);

    // Check if theme items are present (light, dark, system, high-contrast)
    expect(screen.getByTestId('item-light')).toBeInTheDocument();
    expect(screen.getByTestId('item-dark')).toBeInTheDocument();
    expect(screen.getByTestId('item-system')).toBeInTheDocument();
    expect(screen.getByTestId('item-high-contrast')).toBeInTheDocument();
  });
});
