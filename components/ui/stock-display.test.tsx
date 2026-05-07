import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockDisplay } from './stock-display';
import { TooltipProvider } from './tooltip';

describe('StockDisplay', () => {
  it('renders normal stock level without tooltip', () => {
    render(<StockDisplay stock={10} minStock={5} />);

    const element = screen.getByText('10');
    expect(element).toBeInTheDocument();
    expect(element).not.toHaveClass('text-orange-600');
    expect(element).toHaveAttribute('aria-label', 'Stock: 10');
  });

  it('renders low stock level with orange color and accessibility label', () => {
    render(
      <TooltipProvider>
        <StockDisplay stock={3} minStock={5} />
      </TooltipProvider>
    );

    const element = screen.getByText('3');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('text-orange-600');
    expect(element).toHaveAttribute('aria-label', 'Stock bajo: 3. El nivel mínimo es 5');
  });

  it('renders low stock level when stock is equal to minStock', () => {
    render(
      <TooltipProvider>
        <StockDisplay stock={5} minStock={5} />
      </TooltipProvider>
    );

    const element = screen.getByText('5');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('text-orange-600');
  });
});
