import { render, screen } from '@testing-library/react';
import { CashStatusCard } from './CashStatusCard';

describe('CashStatusCard Component', () => {
  test('renders cash card correctly when cash is open', () => {
    render(
      <CashStatusCard
        isOpen={true}
        openedAt="2026-07-25T10:00:00.000Z"
        balance={1500}
      />
    );

    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
    // Currency format can be either "$ 1.500,00" or similar depending on formatARS locale/env.
    // We can use a partial match or check for the number 1.500 or 1,500
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Ir a la gestión de caja' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/adm/cash');
  });

  test('renders cash card correctly when cash is closed', () => {
    render(
      <CashStatusCard
        isOpen={false}
        openedAt={null}
        balance={0}
      />
    );

    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.getByText('Cerrada')).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
    expect(screen.getByText('Sin abrir hoy')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Ir a la gestión de caja' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/adm/cash');
  });
});
