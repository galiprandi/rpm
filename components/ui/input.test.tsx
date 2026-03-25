import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Input } from './input';

describe('Input Component', () => {
  test('renders with default props', () => {
    render(<Input placeholder="Enter text..." />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('h-8');
  });

  test('applies type correctly', () => {
    render(<Input type="email" placeholder="Email" />);
    const input = screen.getByPlaceholderText(/email/i);
    expect(input).toHaveAttribute('type', 'email');
  });

  test('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input value="test" onChange={handleChange} />);
    
    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test');
  });

  test('applies disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  test('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
