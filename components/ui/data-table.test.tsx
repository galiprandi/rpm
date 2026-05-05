import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from './data-table';
import { ColumnDef } from '@tanstack/react-table';

describe('DataTable Pagination', () => {
  const columns: ColumnDef<{ id: string; name: string }>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
  ];

  const data = Array.from({ length: 25 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Item ${i + 1}`,
  }));

  it('should render pagination summary in Spanish', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        pageSize={10}
      />
    );

    // Should show "Página 1 de 3 · 25 registros"
    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
    expect(screen.getByText(/25 registros/)).toBeInTheDocument();
  });

  it('should have ARIA labels on pagination buttons', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        pageSize={10}
      />
    );

    expect(screen.getByRole('button', { name: 'Primera página' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Última página' })).toBeInTheDocument();
  });

  it('should show "registro" in singular when there is only one item', () => {
    render(
      <DataTable
        data={[{ id: '1', name: 'Only one' }]}
        columns={columns}
        pageSize={10}
      />
    );

    expect(screen.getByText(/1 registro/)).toBeInTheDocument();
    expect(screen.queryByText(/1 registros/)).not.toBeInTheDocument();
  });
});
