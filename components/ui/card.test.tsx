import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card Components', () => {
  test('renders Card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
        <CardFooter>
          <p>Test Footer</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  test('Card has correct styling classes', () => {
    render(<Card data-testid="card">Test Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('ring-1');
  });

  test('CardHeader has correct styling', () => {
    render(
      <CardHeader data-testid="header">
        <CardTitle>Title</CardTitle>
      </CardHeader>
    );
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('grid');
    expect(header).toHaveClass('gap-1');
  });

  test('CardTitle has correct styling', () => {
    render(<CardTitle>Test Title</CardTitle>);
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-base');
    expect(title).toHaveClass('font-medium');
  });

  test('CardContent has correct styling', () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('px-4');
  });

  test('CardFooter has correct styling', () => {
    render(
      <CardFooter data-testid="footer">
        <button>Action</button>
      </CardFooter>
    );
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });
});
