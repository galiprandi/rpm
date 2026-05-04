import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './data-table';
import { ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

// Create 50 rows to trigger pagination
const data: TestData[] = Array.from({ length: 50 }, (_, i) => ({
  id: `${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
}));

const meta: Meta<typeof DataTable> = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const WithPagination: Story = {
  args: {
    data: data,
    columns: columns,
    pageSize: 5,
  },
};
